from django.db import models

CATEGORY_PRESETS = [
    "Food & Dining",
    "Groceries",
    "Transport",
    "Utilities",
    "Entertainment",
    "Health",
    "Travel",
    "Shopping",
    "Rent / Housing",
    "Subscriptions",
    "Other",
]

MODE_OPTIONS = ["AIB", "REV", "Cash", "Gift card"]

SOURCE_CHOICES = [("manual", "Manual"), ("splitwise", "Splitwise")]


class Expense(models.Model):
    date = models.DateField(db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    paid_by = models.CharField(max_length=100, blank=True, null=True)
    mode = models.CharField(max_length=50, blank=True, null=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="manual")
    splitwise_id = models.BigIntegerField(unique=True, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.date} | {self.category} | {self.amount}"


class SyncLog(models.Model):
    synced_at = models.DateTimeField()
    imported = models.IntegerField()
    skipped = models.IntegerField()

    class Meta:
        ordering = ["-synced_at"]

    def __str__(self):
        return f"Sync {self.synced_at:%Y-%m-%d %H:%M} — imported {self.imported}"
