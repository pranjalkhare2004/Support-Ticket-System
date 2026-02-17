import { useState, useEffect } from 'react';
import { getStats } from '../api';

const PRIORITY_COLORS = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  critical: '#ef4444',
};

const CATEGORY_COLORS = {
  billing: '#60a5fa',
  technical: '#a78bfa',
  account: '#f472b6',
  general: '#9ca3af',
};

function StatsDashboard({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await getStats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner"></span> Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return <div className="empty-state">Failed to load statistics.</div>;
  }

  const maxPriority = Math.max(...Object.values(stats.priority_breakdown), 1);
  const maxCategory = Math.max(...Object.values(stats.category_breakdown), 1);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      <div className="stats-overview">
        <div className="card stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-value">{stats.total_tickets}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon">🟢</span>
          <div className="stat-content">
            <span className="stat-value">{stats.open_tickets}</span>
            <span className="stat-label">Open Tickets</span>
          </div>
        </div>
        <div className="card stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-content">
            <span className="stat-value">{stats.avg_tickets_per_day}</span>
            <span className="stat-label">Avg / Day</span>
          </div>
        </div>
      </div>

      <div className="breakdowns">
        <div className="card breakdown-card">
          <h3>Priority Breakdown</h3>
          <div className="bar-chart">
            {Object.entries(stats.priority_breakdown).map(([key, value]) => (
              <div key={key} className="bar-item">
                <div className="bar-label">
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span className="bar-value">{value}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(value / maxPriority) * 100}%`,
                      backgroundColor: PRIORITY_COLORS[key],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card breakdown-card">
          <h3>Category Breakdown</h3>
          <div className="bar-chart">
            {Object.entries(stats.category_breakdown).map(([key, value]) => (
              <div key={key} className="bar-item">
                <div className="bar-label">
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span className="bar-value">{value}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(value / maxCategory) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[key],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsDashboard;
