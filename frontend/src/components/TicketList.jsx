import { useState, useEffect } from 'react';
import { getTickets, updateTicket } from '../api';

const CATEGORIES = ['', 'billing', 'technical', 'account', 'general'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'];
const STATUS_FLOW = ['open', 'in_progress', 'resolved', 'closed'];

const PRIORITY_COLORS = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  critical: '#ef4444',
};

const STATUS_COLORS = {
  open: '#60a5fa',
  in_progress: '#a78bfa',
  resolved: '#4ade80',
  closed: '#9ca3af',
};

function TicketList({ refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const response = await getTickets(params);
      setTickets(response.data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterCategory, filterPriority, filterStatus, search, refreshKey]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicket(ticketId, { status: newStatus });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncate = (text, max = 120) =>
    text.length > max ? text.substring(0, max) + '...' : text;

  return (
    <div className="ticket-list-container">
      <div className="card filters-card">
        <h2>Tickets</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="🔍 Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            id="filter-category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            id="filter-priority"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            id="filter-status"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner"></span> Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <p>🎉 No tickets found. Create one to get started!</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`card ticket-card ${expandedId === ticket.id ? 'expanded' : ''}`}
              onClick={() =>
                setExpandedId(expandedId === ticket.id ? null : ticket.id)
              }
            >
              <div className="ticket-header">
                <h3 className="ticket-title">{ticket.title}</h3>
                <div className="ticket-badges">
                  <span
                    className="badge priority-badge"
                    style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] }}
                  >
                    {ticket.priority}
                  </span>
                  <span
                    className="badge status-badge"
                    style={{ backgroundColor: STATUS_COLORS[ticket.status] }}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="ticket-description">
                {expandedId === ticket.id
                  ? ticket.description
                  : truncate(ticket.description)}
              </p>

              <div className="ticket-meta">
                <span className="badge category-badge">{ticket.category}</span>
                <span className="ticket-date">{formatDate(ticket.created_at)}</span>
              </div>

              {expandedId === ticket.id && (
                <div
                  className="ticket-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <label>Update Status:</label>
                  <div className="status-buttons">
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s}
                        className={`btn btn-sm ${ticket.status === s ? 'btn-active' : ''}`}
                        style={{
                          borderColor: STATUS_COLORS[s],
                          backgroundColor:
                            ticket.status === s ? STATUS_COLORS[s] : 'transparent',
                          color: ticket.status === s ? '#000' : STATUS_COLORS[s],
                        }}
                        onClick={() => handleStatusChange(ticket.id, s)}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketList;
