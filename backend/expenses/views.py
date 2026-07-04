from datetime import datetime, timezone
from django.conf import settings
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Expense, SyncLog, CATEGORY_PRESETS, MODE_OPTIONS
from .serializers import ExpenseSerializer, ExpenseWriteSerializer
from .splitwise_service import sync_splitwise


class ExpenseViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = Expense.objects.all()
        p = self.request.query_params

        if p.get("date_from"):
            qs = qs.filter(date__gte=p["date_from"])
        if p.get("date_to"):
            qs = qs.filter(date__lte=p["date_to"])
        if p.get("category"):
            qs = qs.filter(category=p["category"])
        if p.get("source"):
            qs = qs.filter(source=p["source"])

        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ExpenseWriteSerializer
        return ExpenseSerializer

    def perform_create(self, serializer):
        serializer.save(source="manual")

    @action(detail=False, methods=["get"], url_path="monthly-totals")
    def monthly_totals(self, request):
        rows = (
            Expense.objects.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(
                total=Sum("amount"),
                manual_total=Sum("amount", filter=Q(source="manual")),
                sw_total=Sum("amount", filter=Q(source="splitwise")),
            )
            .order_by("-month")[:12]
        )
        return Response(list(rows))

    @action(detail=False, methods=["get"], url_path="meta")
    def meta(self, request):
        return Response({
            "categories": CATEGORY_PRESETS,
            "modes": MODE_OPTIONS,
            "currency": settings.CURRENCY_SYMBOL,
        })


class SplitwiseSyncView(APIView):
    def post(self, request):
        api_key = settings.SPLITWISE_API_KEY
        sw_user_id = settings.SPLITWISE_USER_ID

        if not api_key or not sw_user_id:
            return Response(
                {"error": "Splitwise API key or user ID not configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Record start time before fetching so nothing slips through
        sync_start = datetime.now(timezone.utc)

        # Use last successful sync time for incremental fetch
        last_sync = SyncLog.objects.first()
        updated_after = last_sync.synced_at.isoformat() if last_sync else None

        try:
            result = sync_splitwise(
                api_key,
                sw_user_id,
                group_id=settings.SPLITWISE_GROUP_ID,
                dated_after=settings.SPLITWISE_DATED_AFTER,
                updated_after=updated_after,
            )
            SyncLog.objects.create(
                synced_at=sync_start,
                imported=result["imported"],
                skipped=result["skipped"],
            )
            result["last_sync"] = updated_after
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
