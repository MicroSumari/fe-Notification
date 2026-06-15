import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createAgent } from "../api/agents";

export default function CreateAgent() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSubmitting(true);

    try {
      const { agent } = await createAgent(token, { name, description });
      navigate(`/agents/${agent._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/agents" className="back-link">← Back to Agents</Link>
      </header>

      <main className="form-page">
        <div className="auth-card">
          <h1>Create Agent</h1>
          <p className="auth-subtitle">
            New agents start in <strong>draft</strong> mode for configuration.
          </p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Agent Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meeting Alerts"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What events should this agent monitor?"
                rows={3}
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Agent"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
