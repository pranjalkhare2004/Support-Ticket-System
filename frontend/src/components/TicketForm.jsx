import { useState, useRef } from 'react';
import { createTicket, classifyTicket } from '../api';

const CATEGORIES = ['billing', 'technical', 'account', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function TicketForm({ onTicketCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [aiSuggested, setAiSuggested] = useState(false);
  const classifyTimeout = useRef(null);

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setClassifyError('');

    // Debounce the classify call
    if (classifyTimeout.current) {
      clearTimeout(classifyTimeout.current);
    }

    if (value.trim().length > 20) {
      classifyTimeout.current = setTimeout(() => {
        handleClassify(value);
      }, 1000);
    }
  };

  const handleClassify = async (desc) => {
    setClassifying(true);
    setClassifyError('');
    setAiSuggested(false);
    try {
      const response = await classifyTicket(desc);
      setCategory(response.data.suggested_category);
      setPriority(response.data.suggested_priority);
      setAiSuggested(true);
    } catch (err) {
      setClassifyError('AI classification unavailable — please select manually.');
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      await createTicket({ title, description, category, priority });
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      setAiSuggested(false);
      onTicketCreated();
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.entries(detail)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        setSubmitError(messages);
      } else {
        setSubmitError('Failed to create ticket. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card ticket-form-card">
      <h2>Submit a New Ticket</h2>
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your issue"
            maxLength={200}
            required
          />
          <span className="char-count">{title.length}/200</span>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe your issue in detail. AI will auto-suggest category and priority..."
            rows={5}
            required
          />
          {classifying && (
            <div className="classify-status">
              <span className="spinner"></span> AI is analyzing your description...
            </div>
          )}
          {classifyError && (
            <div className="classify-error">{classifyError}</div>
          )}
          {aiSuggested && !classifying && (
            <div className="classify-success">
              ✨ AI suggested category and priority — feel free to adjust
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">
              Category
              {aiSuggested && <span className="ai-badge">AI</span>}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">
              Priority
              {aiSuggested && <span className="ai-badge">AI</span>}
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {submitError && <div className="error-message">{submitError}</div>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}

export default TicketForm;
