import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchCalendarEvents,
  fetchGmailMessages,
  fetchSlackMessages,
  fetchSlackRecent,
  getIntegrationStatus,
  type CalendarEvent,
  type GmailMessage,
  type IntegrationStatus,
  type SlackChannel,
  type SlackMessage,
} from "../api/integrations";

type Tab = "mails" | "calendar" | "slack";

export default function Home() {
  const { user, token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("mails");
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);

  const [mails, setMails] = useState<GmailMessage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [slackMessages, setSlackMessages] = useState<SlackMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<SlackChannel | null>(null);
  const [slackNotice, setSlackNotice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getIntegrationStatus(token)
      .then(({ integrations }) => setIntegrations(integrations))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setError("");
    setLoading(true);

    const load = async () => {
      try {
        if (tab === "mails") {
          const { messages } = await fetchGmailMessages(token);
          setMails(messages);
        } else if (tab === "calendar") {
          const { events } = await fetchCalendarEvents(token);
          setEvents(events);
        } else if (tab === "slack") {
          const { channels, messages, notice, activeChannel: defaultChannel } =
            await fetchSlackRecent(token);
          setChannels(channels);
          setSlackNotice(notice || "");
          if (defaultChannel) {
            setActiveChannel(defaultChannel);
            setSlackMessages(messages);
          } else if (channels.length > 0) {
            const first = channels.find((c) => c.isMember) || channels[0];
            setActiveChannel(first);
            const result = await fetchSlackMessages(token, first.id);
            setSlackMessages(result.messages);
            setSlackNotice(result.notice || "");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tab, token]);

  async function selectChannel(channel: SlackChannel) {
    if (!token) return;
    setActiveChannel(channel);
    setLoading(true);
    setError("");
    try {
      const { messages, notice } = await fetchSlackMessages(token, channel.id);
      setSlackMessages(messages);
      setSlackNotice(notice || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
      setSlackNotice("");
    } finally {
      setLoading(false);
    }
  }

  function NotConnected({ service }: { service: string }) {
    return (
      <div className="not-connected">
        <p>{service} is not connected.</p>
        <Link to="/settings" className="btn-primary">
          Connect in Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>GoogleSlack</h1>
          <p className="header-sub">Welcome, {user?.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/settings" className="btn-secondary">
            Settings
          </Link>
          <button onClick={logout} className="btn-secondary">
            Log out
          </button>
        </div>
      </header>

      <nav className="tab-nav">
        {(["mails", "calendar", "slack"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "mails" ? "Mails" : t === "calendar" ? "Calendar" : "Slack"}
            {t === "mails" && integrations?.google.connected && (
              <span className="tab-dot connected" />
            )}
            {t === "calendar" && integrations?.google.connected && (
              <span className="tab-dot connected" />
            )}
            {t === "slack" && integrations?.slack.connected && (
              <span className="tab-dot connected" />
            )}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {error && <p className="auth-error">{error}</p>}
        {loading && <p className="muted">Loading...</p>}

        {!loading && tab === "mails" && (
          !integrations?.google.connected ? (
            <NotConnected service="Google (Gmail)" />
          ) : mails.length === 0 ? (
            <p className="muted">No emails found.</p>
          ) : (
            <div className="feed-list">
              {mails.map((mail) => (
                <div key={mail.id} className="feed-item">
                  <div className="feed-item-top">
                    <strong>{mail.subject}</strong>
                    <span className="muted">{mail.date}</span>
                  </div>
                  <p className="feed-from">{mail.from}</p>
                  <p className="feed-snippet">{mail.snippet}</p>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && tab === "calendar" && (
          !integrations?.google.connected ? (
            <NotConnected service="Google (Calendar)" />
          ) : events.length === 0 ? (
            <p className="muted">No upcoming events.</p>
          ) : (
            <div className="feed-list">
              {events.map((event) => (
                <div key={event.id} className="feed-item">
                  <div className="feed-item-top">
                    <strong>{event.summary}</strong>
                    <span className="muted">
                      {event.start
                        ? new Date(event.start).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  {event.location && (
                    <p className="feed-from">{event.location}</p>
                  )}
                  {event.description && (
                    <p className="feed-snippet">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {!loading && tab === "slack" && (
          !integrations?.slack.connected ? (
            <NotConnected service="Slack" />
          ) : (
            <div className="slack-layout">
              <aside className="slack-channels">
                <h4>Channels & DMs</h4>
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    className={`channel-btn ${activeChannel?.id === ch.id ? "active" : ""}`}
                    onClick={() => selectChannel(ch)}
                  >
                    {ch.isIm || ch.isMpim ? "@" : "#"}
                    {ch.name}
                  </button>
                ))}
              </aside>
              <div className="slack-messages">
                {slackNotice && (
                  <p className="slack-notice">{slackNotice}</p>
                )}
                {!slackNotice && slackMessages.length === 0 ? (
                  <p className="muted">No messages in this channel.</p>
                ) : (
                  slackMessages.map((msg) => (
                    <div key={msg.id} className="slack-msg">
                      <strong>{msg.user}</strong>
                      <span className="muted">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleString()
                          : ""}
                      </span>
                      <p>{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
