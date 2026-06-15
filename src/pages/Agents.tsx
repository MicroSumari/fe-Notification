import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listAgents, type Agent } from "../api/agents";
import StatusBadge from "../components/StatusBadge";

export default function Agents() {
  const { token } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    listAgents(token)
      .then(({ agents }) => setAgents(agents))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>Agents</h1>
        <Link to="/agents/new" className="btn-primary">
          + Create Agent
        </Link>
      </header>

      <main className="dashboard-main">
        {error && <p className="auth-error">{error}</p>}
        {loading && <p className="muted">Loading agents...</p>}

        {!loading && agents.length === 0 && (
          <div className="empty-state">
            <h3>No agents yet</h3>
            <p>Create an agent to automate notifications across your connected accounts.</p>
            <Link to="/agents/new" className="btn-primary">
              Create your first agent
            </Link>
          </div>
        )}

        <div className="agent-grid">
          {agents.map((agent) => (
            <Link to={`/agents/${agent._id}`} key={agent._id} className="agent-card">
              <div className="agent-card-top">
                <h3>{agent.name}</h3>
                <StatusBadge status={agent.status} />
              </div>
              <p className="agent-desc">
                {agent.description || "No description"}
              </p>
              <div className="integration-tags">
                {agent.integrations.slack.enabled && <span>Slack</span>}
                {agent.integrations.googleCalendar.enabled && <span>Calendar</span>}
                {agent.integrations.gmail.enabled && <span>Gmail</span>}
                {!agent.integrations.slack.enabled &&
                  !agent.integrations.googleCalendar.enabled &&
                  !agent.integrations.gmail.enabled && (
                    <span className="tag-muted">No integrations</span>
                  )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
