from rest_framework import serializers
from .models import Expense, CATEGORY_PRESETS, MODE_OPTIONS


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id", "date", "category", "amount", "description",
            "paid_by", "mode", "source", "splitwise_id",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "source", "splitwise_id", "created_at", "updated_at"]


class ExpenseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["date", "category", "amount", "description", "paid_by", "mode"]
