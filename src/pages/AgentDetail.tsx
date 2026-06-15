import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  configureCalendar,
  configureGmail,
  configureSlack,
  draftAgent,
  getAgent,
  listNotifications,
  publishAgent,
  sendNotification,
  type Agent,
  type Notification,
} from "../api/agents";
import StatusBadge from "../components/StatusBadge";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // Integration form state
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [gmailEnabled, setGmailEnabled] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");

  // Notification test
  const [notifTitle, setNotifTitle] = useState("Important Event Update");
  const [notifMessage, setNotifMessage] = useState(
    "You have a new meeting scheduled for tomorrow at 10 AM."
  );

  const isDraft = agent?.status === "draft";

  const loadAgent = useCallback(async () => {
    if (!token || !id) return;
    const [{ agent }, { notifications }] = await Promise.all([
      getAgent(token, id),
      listNotifications(token, id),
    ]);
    setAgent(agent);
    setNotifications(notifications);
    setSlackEnabled(agent.integrations.slack.enabled);
    setSlackChannel(agent.integrations.slack.channel || "");
    setCalendarEnabled(agent.integrations.googleCalendar.enabled);
    setCalendarId(agent.integrations.googleCalendar.calendarId || "");
    setGmailEnabled(agent.integrations.gmail.enabled);
    setGmailEmail(agent.integrations.gmail.email || "");
  }, [token, id]);

  useEffect(() => {
    loadAgent()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadAgent]);

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function saveSlack(e: FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setError("");
    try {
      const { agent } = await configureSlack(token, id, {
        enabled: slackEnabled,
        webhookUrl: slackWebhook || undefined,
        channel: slackChannel || undefined,
      });
      setAgent(agent);
      flash("Slack integration saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function saveCalendar(e: FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setError("");
    try {
      const { agent } = await configureCalendar(token, id, {
        enabled: calendarEnabled,
        calendarId: calendarId || undefined,
      });
      setAgent(agent);
      flash("Google Calendar integration saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function saveGmail(e: FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setError("");
    try {
      const { agent } = await configureGmail(token, id, {
        enabled: gmailEnabled,
        email: gmailEmail || undefined,
      });
      setAgent(agent);
      flash("Gmail integration saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function handlePublish() {
    if (!token || !id) return;
    setError("");
    try {
      const { agent, message } = await publishAgent(token, id);
      setAgent(agent);
      flash(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    }
  }

  async function handleDraft() {
    if (!token || !id) return;
    setError("");
    try {
      const { agent, message } = await draftAgent(token, id);
      setAgent(agent);
      flash(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revert");
    }
  }

  async function handleSendNotification(e: FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setError("");
    try {
      const { notification } = await sendNotification(token, id, {
        title: notifTitle,
        message: notifMessage,
      });
      setNotifications((prev) => [notification, ...prev]);
      flash("Notification dispatched to all enabled channels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <p className="muted" style={{ padding: "2rem" }}>Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="dashboard-page">
        <p className="auth-error" style={{ padding: "2rem" }}>Agent not found</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/agents" className="back-link">← Back to Agents</Link>
        <div className="header-actions">
          {isDraft ? (
            <button onClick={handlePublish} className="btn-primary">
              Publish Agent
            </button>
          ) : (
            <button onClick={handleDraft} className="btn-secondary">
              Revert to Draft
            </button>
          )}
        </div>
      </header>

      <main className="agent-detail">
        <div className="agent-detail-header">
          <div>
            <h2>{agent.name}</h2>
            <p className="muted">{agent.description}</p>
          </div>
          <StatusBadge status={agent.status} />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        <div className="mode-banner">
          {isDraft ? (
            <p>
              <strong>Configuration mode:</strong> Set up integrations below, then publish to activate.
            </p>
          ) : (
            <p>
              <strong>Working mode:</strong> Agent is active and ready to send notifications.
            </p>
          )}
        </div>

        {/* Integrations — only editable in draft */}
        <section className="config-section">
          <h3>Integrations</h3>
          {!isDraft && (
            <p className="muted section-hint">
              Revert to draft to modify integrations.
            </p>
          )}

          <div className="integration-grid">
            <form onSubmit={saveSlack} className="integration-card">
              <h4>Slack</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={slackEnabled}
                  onChange={(e) => setSlackEnabled(e.target.checked)}
                  disabled={!isDraft}
                />
                Enable Slack notifications
              </label>
              <label>
                Webhook URL
                <input
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder={agent.integrations.slack.webhookUrl || "https://hooks.slack.com/..."}
                  disabled={!isDraft}
                />
              </label>
              <label>
                Channel (optional)
                <input
                  value={slackChannel}
                  onChange={(e) => setSlackChannel(e.target.value)}
                  placeholder="#general"
                  disabled={!isDraft}
                />
              </label>
              {isDraft && <button type="submit">Save Slack</button>}
            </form>

            <form onSubmit={saveCalendar} className="integration-card">
              <h4>Google Calendar</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={calendarEnabled}
                  onChange={(e) => setCalendarEnabled(e.target.checked)}
                  disabled={!isDraft}
                />
                Enable Calendar events
              </label>
              <label>
                Calendar ID
                <input
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  placeholder="primary or calendar@group.calendar.google.com"
                  disabled={!isDraft}
                />
              </label>
              {isDraft && <button type="submit">Save Calendar</button>}
            </form>

            <form onSubmit={saveGmail} className="integration-card">
              <h4>Gmail</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={gmailEnabled}
                  onChange={(e) => setGmailEnabled(e.target.checked)}
                  disabled={!isDraft}
                />
                Enable Gmail notifications
              </label>
              <label>
                Email address
                <input
                  type="email"
                  value={gmailEmail}
                  onChange={(e) => setGmailEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  disabled={!isDraft}
                />
              </label>
              {isDraft && <button type="submit">Save Gmail</button>}
            </form>
          </div>
        </section>

        {/* Send notification — only for published agents */}
        {!isDraft && (
          <section className="config-section">
            <h3>Send Notification</h3>
            <form onSubmit={handleSendNotification} className="auth-form">
              <label>
                Title
                <input
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  required
                />
              </label>
              <label>
                Message
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  rows={3}
                  required
                />
              </label>
              <button type="submit" className="btn-primary">
                Dispatch to All Channels
              </button>
            </form>
          </section>
        )}

        {/* Notification history */}
        <section className="config-section">
          <h3>Notification History</h3>
          {notifications.length === 0 ? (
            <p className="muted">No notifications sent yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((n) => (
                <div key={n._id} className="notification-item">
                  <div className="notification-top">
                    <strong>{n.title}</strong>
                    <span className="muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p>{n.message}</p>
                  <div className="channel-results">
                    <span className={n.channels.slack.sent ? "sent" : "failed"}>
                      Slack {n.channels.slack.sent ? "✓" : "✗"}
                    </span>
                    <span className={n.channels.googleCalendar.sent ? "sent" : "failed"}>
                      Calendar {n.channels.googleCalendar.sent ? "✓" : "✗"}
                    </span>
                    <span className={n.channels.gmail.sent ? "sent" : "failed"}>
                      Gmail {n.channels.gmail.sent ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
