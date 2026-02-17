import json
import logging

from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)

CLASSIFY_PROMPT = """You are a support ticket classifier. Given a customer support ticket description, you must classify it into exactly one category and one priority level.

Categories (choose exactly one):
- billing: Payment issues, invoices, charges, refunds, subscription billing
- technical: Bugs, errors, crashes, performance issues, technical problems
- account: Login issues, password resets, account settings, profile changes
- general: General inquiries, feedback, feature requests, other

Priority levels (choose exactly one):
- low: Minor issues, general questions, no urgency
- medium: Standard issues that need attention but aren't urgent
- high: Important issues affecting user workflow or experience
- critical: System outages, security issues, data loss, blocking problems

Respond with ONLY a JSON object in this exact format, no other text:
{"category": "<category>", "priority": "<priority>"}

Ticket description:
"""


def classify_ticket(description: str) -> dict:
    """
    Call OpenAI API to classify a ticket description into category and priority.

    Returns a dict with 'suggested_category' and 'suggested_priority' on success,
    or a dict with an 'error' key on failure.
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        logger.warning("OpenAI API key not configured")
        return {"error": "LLM service not configured"}

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a support ticket classifier. Respond only with valid JSON.",
                },
                {
                    "role": "user",
                    "content": CLASSIFY_PROMPT + description,
                },
            ],
            temperature=0.1,
            max_tokens=50,
        )

        content = response.choices[0].message.content.strip()

        # Parse the JSON response
        result = json.loads(content)

        # Validate the response contains expected fields
        valid_categories = {"billing", "technical", "account", "general"}
        valid_priorities = {"low", "medium", "high", "critical"}

        category = result.get("category", "general").lower()
        priority = result.get("priority", "medium").lower()

        if category not in valid_categories:
            category = "general"
        if priority not in valid_priorities:
            priority = "medium"

        return {
            "suggested_category": category,
            "suggested_priority": priority,
        }

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response: {e}")
        return {"error": "Failed to parse LLM response"}
    except Exception as e:
        logger.error(f"LLM classification failed: {e}")
        return {"error": "LLM service unavailable"}
