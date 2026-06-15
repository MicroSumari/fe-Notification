import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  disconnectGoogle,
  disconnectSlack,
  getGoogleAuthUrl,
  getIntegrationStatus,
  getSlackAuthUrl,
  type IntegrationStatus,
} from "../api/integrations";

export default function Settings() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);

  function loadStatus() {
    if (!token) return;
    getIntegrationStatus(token)
      .then(({ integrations }) => setIntegrations(integrations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStatus();
  }, [token]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "google") {
      setSuccess("Google account connected successfully!");
      setSearchParams({});
      loadStatus();
    } else if (connected === "slack") {
      setSuccess("Slack account connected successfully!");
      setSearchParams({});
      loadStatus();
    } else if (err) {
      setError(`Connection failed: ${err}`);
      setSearchParams({});
    }
  }, [searchParams]);

  async function connectGoogle() {
    if (!token) return;
    setConnecting("google");
    setError("");
    try {
      const { url } = await getGoogleAuthUrl(token);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Google OAuth");
      setConnecting(null);
    }
  }

  async function connectSlack() {
    if (!token) return;
    setConnecting("slack");
    setError("");
    try {
      const { url } = await getSlackAuthUrl(token);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start Slack OAuth");
      setConnecting(null);
    }
  }

  async function handleDisconnectGoogle() {
    if (!token) return;
    await disconnectGoogle(token);
    setSuccess("Google account disconnected");
    loadStatus();
  }

  async function handleDisconnectSlack() {
    if (!token) return;
    await disconnectSlack(token);
    setSuccess("Slack account disconnected");
    loadStatus();
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>Settings</h1>
        <div />
      </header>

      <main className="settings-main">
        <h2>Connected Accounts</h2>
        <p className="muted settings-desc">
          Connect your Google account for Calendar and Gmail, and your Slack workspace.
          Tokens are saved securely and used to fetch your data on the home screen.
        </p>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
        {loading && <p className="muted">Loading...</p>}

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-icon google-icon">G</div>
            <h3>Google</h3>
            <p className="muted">Calendar + Gmail</p>
            {integrations?.google.connected ? (
              <>
                <p className="connected-badge">Connected as {integrations.google.email}</p>
                <button onClick={handleDisconnectGoogle} className="btn-secondary">
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectGoogle}
                disabled={connecting === "google"}
                className="btn-primary"
              >
                {connecting === "google" ? "Redirecting..." : "Connect Google"}
              </button>
            )}
          </div>

          <div className="settings-card">
            <div className="settings-card-icon slack-icon">S</div>
            <h3>Slack</h3>
            <p className="muted">Messages & channels</p>
            {integrations?.slack.connected ? (
              <>
                <p className="connected-badge">
                  Connected to {integrations.slack.teamName}
                </p>
                <button onClick={handleDisconnectSlack} className="btn-secondary">
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectSlack}
                disabled={connecting === "slack"}
                className="btn-primary"
              >
                {connecting === "slack" ? "Redirecting..." : "Connect Slack"}
              </button>
            )}
          </div>
        </div>

        
      </main>
    </div>
  );
}
