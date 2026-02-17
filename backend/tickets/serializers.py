from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for Ticket model with full validation."""

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ClassifySerializer(serializers.Serializer):
    """Serializer for the LLM classify endpoint request."""

    description = serializers.CharField(required=True, min_length=1)
