from datetime import datetime, timezone
from splitwise import Splitwise
from .models import Expense, CATEGORY_PRESETS


def _parse_date(d):
    if hasattr(d, "date"):
        return d.date()
    if isinstance(d, str):
        return datetime.fromisoformat(d.replace("Z", "+00:00")).date()
    return d


def sync_splitwise(api_key: str, sw_user_id: int, group_id: int, dated_after: str, updated_after: str | None = None) -> dict:
    sw = Splitwise("", "", api_key=api_key)

    imported = 0
    skipped = 0
    offset = 0
    limit = 100

    fetch_kwargs = dict(
        visible=True,
        group_id=group_id,
        dated_after=dated_after,
    )
    if updated_after:
        fetch_kwargs["updated_after"] = updated_after

    while True:
        expenses = sw.getExpenses(offset=offset, limit=limit, **fetch_kwargs)
        if not expenses:
            break

        for sw_exp in expenses:
            if sw_exp.deleted_at is not None:
                skipped += 1
                continue

            # Skip settlement payments between users
            if getattr(sw_exp, "payment", False):
                skipped += 1
                continue

            # Filter to only expenses involving this user; also check if they're the payer
            owed_share = None
            user_is_payer = False
            for u in (sw_exp.users or []):
                if u.id == sw_user_id:
                    owed_share = float(u.owed_share or 0)
                    user_is_payer = float(u.paid_share or 0) > 0
                    break

            if not owed_share or owed_share <= 0:
                skipped += 1
                continue

            sw_id = int(sw_exp.id)

            # On incremental sync, update amount if the expense was edited
            existing = Expense.objects.filter(splitwise_id=sw_id).first()
            if existing:
                if existing.amount != round(owed_share, 2):
                    existing.amount = round(owed_share, 2)
                    existing.save(update_fields=["amount", "updated_at"])  # paid_by doesn't change on edits
                    imported += 1
                else:
                    skipped += 1
                continue

            raw_category = sw_exp.category.name if sw_exp.category else "Other"
            category = raw_category if raw_category in CATEGORY_PRESETS else "Other"

            # Find who paid (the user with paid_share > 0)
            paid_by = None
            for u in (sw_exp.users or []):
                if float(u.paid_share or 0) > 0:
                    paid_by = u.first_name
                    break

            Expense.objects.create(
                date=_parse_date(sw_exp.date),
                category=category,
                amount=round(owed_share, 2),
                description=sw_exp.description,
                paid_by=paid_by,
                mode="AIB" if user_is_payer else None,
                source="splitwise",
                splitwise_id=sw_id,
            )
            imported += 1

        if len(expenses) < limit:
            break
        offset += limit

    return {"imported": imported, "skipped": skipped}
