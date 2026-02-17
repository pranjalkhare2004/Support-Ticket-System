from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .llm_service import classify_ticket
from .models import Ticket
from .serializers import ClassifySerializer, TicketSerializer


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for support tickets.

    Provides CRUD operations plus custom actions for stats and classification.
    """

    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        """Apply filters and search to the queryset."""
        queryset = Ticket.objects.all()

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        # Filter by priority
        priority = self.request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        # Filter by status
        ticket_status = self.request.query_params.get("status")
        if ticket_status:
            queryset = queryset.filter(status=ticket_status)

        # Search by title and description
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Return aggregated ticket statistics using DB-level aggregation.
        No Python-level loops — all computed via Django ORM aggregate/annotate.
        """
        all_tickets = Ticket.objects.all()

        # Total and open counts via DB aggregation
        total_tickets = all_tickets.count()
        open_tickets = all_tickets.filter(status="open").count()

        # Average tickets per day via DB aggregation using TruncDate + Count + Avg
        avg_result = (
            all_tickets
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(daily_count=Count("id"))
            .aggregate(avg_per_day=Avg("daily_count"))
        )
        avg_tickets_per_day = round(avg_result["avg_per_day"], 1) if avg_result["avg_per_day"] else 0

        # Priority breakdown via DB aggregation
        priority_counts = dict(
            all_tickets.values_list("priority")
            .annotate(count=Count("id"))
            .values_list("priority", "count")
        )
        priority_breakdown = {
            p: priority_counts.get(p, 0)
            for p in ["low", "medium", "high", "critical"]
        }

        # Category breakdown via DB aggregation
        category_counts = dict(
            all_tickets.values_list("category")
            .annotate(count=Count("id"))
            .values_list("category", "count")
        )
        category_breakdown = {
            c: category_counts.get(c, 0)
            for c in ["billing", "technical", "account", "general"]
        }

        return Response({
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "avg_tickets_per_day": avg_tickets_per_day,
            "priority_breakdown": priority_breakdown,
            "category_breakdown": category_breakdown,
        })

    @action(detail=False, methods=["post"])
    def classify(self, request):
        """
        Send a description to the LLM and get suggested category + priority.
        Always returns 200 with suggested_category and suggested_priority.
        On failure, both values are null.
        """
        serializer = ClassifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        description = serializer.validated_data["description"]
        result = classify_ticket(description)

        return Response(result, status=status.HTTP_200_OK)
