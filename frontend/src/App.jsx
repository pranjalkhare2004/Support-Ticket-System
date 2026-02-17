import { useState, useEffect, useCallback } from 'react';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StatsDashboard from './components/StatsDashboard';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('tickets');

  const handleTicketCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="logo-icon">🎫</span>
            Support Ticket System
          </h1>
          <p className="header-subtitle">AI-Powered Ticket Classification & Management</p>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          📋 Tickets
        </button>
        <button
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          ➕ New Ticket
        </button>
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'submit' && (
          <TicketForm
            onTicketCreated={() => {
              handleTicketCreated();
              setActiveTab('tickets');
            }}
          />
        )}
        {activeTab === 'tickets' && (
          <TicketList refreshKey={refreshKey} />
        )}
        {activeTab === 'dashboard' && (
          <StatsDashboard refreshKey={refreshKey} />
        )}
      </main>
    </div>
  );
}

export default App;
