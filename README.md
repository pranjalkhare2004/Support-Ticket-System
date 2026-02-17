# Support Ticket System

A full-stack support ticket management system with AI-powered ticket classification.

## Tech Stack

| Layer          | Technology                         |
|---------------|------------------------------------|
| Backend       | Django 4.2 + Django REST Framework |
| Frontend      | React 18 + Vite                    |
| Database      | PostgreSQL 15                      |
| LLM           | OpenAI GPT-4o-mini                 |
| Infrastructure| Docker + Docker Compose            |

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key

### Setup

1. Clone the repository and navigate to the project directory.

2. Create a `.env` file in the project root:
```env
OPENAI_API_KEY=your-openai-api-key-here
POSTGRES_DB=tickets_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

3. Start the application:
```bash
docker-compose up --build
```

4. Access the application:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000/api/

## LLM Choice: OpenAI GPT-4o-mini

**Why GPT-4o-mini?**
- **Cost-effective**: Significantly cheaper than full GPT-4o while maintaining high quality for classification tasks
- **Fast response times**: Low latency for real-time classification as users type
- **Reliable JSON output**: Consistent structured responses with low temperature (0.1)
- **Widely available**: Well-documented API with excellent Python SDK support

The system calls the LLM when the user types a description (debounced at 1 second, minimum 20 characters). It returns a suggested category and priority which pre-fill the form dropdowns. Users can always override these suggestions.

**Graceful degradation**: If the API key is missing, the LLM is unreachable, or it returns invalid data, the system falls back gracefully — tickets can still be submitted manually without AI suggestions.

## API Endpoints

| Method | Endpoint               | Description                                  |
|--------|------------------------|----------------------------------------------|
| POST   | /api/tickets/          | Create a new ticket                          |
| GET    | /api/tickets/          | List tickets (supports filters + search)     |
| PATCH  | /api/tickets/<id>/     | Update a ticket                              |
| GET    | /api/tickets/stats/    | Aggregated statistics (DB-level)             |
| POST   | /api/tickets/classify/ | LLM-powered classification                  |

### Filtering & Search
```
GET /api/tickets/?category=technical&priority=high&status=open&search=login
```

## Design Decisions

1. **DB-level aggregation**: The stats endpoint uses Django ORM `annotate()` and `Count()` — no Python loops for aggregation
2. **Debounced classification**: LLM calls are debounced (1s delay) to avoid excessive API calls while typing
3. **Model ViewSet**: Single ViewSet with `@action` decorators for stats and classify keeps the API code clean
4. **Proxy-based API routing**: Vite proxy handles the frontend → backend routing, avoiding CORS in development while CORS headers are still configured for flexibility
5. **Structured LLM prompt**: The classification prompt constrains the output to valid choices with explicit instructions and JSON-only response format

## Project Structure

```
├── backend/
│   ├── config/           # Django project settings
│   ├── tickets/          # Main app (models, views, serializers, LLM service)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── entrypoint.sh     # Auto-migration + gunicorn startup
├── frontend/
│   ├── src/
│   │   ├── components/   # TicketForm, TicketList, StatsDashboard
│   │   ├── api.js        # Axios API module
│   │   ├── App.jsx       # Main app with tab navigation
│   │   └── index.css     # Dark theme design system
│   ├── Dockerfile
│   └── vite.config.js    # Dev server with API proxy
├── docker-compose.yml
└── README.md
```
