import type { AgentStatus } from "../api/agents";

export default function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      {status === "draft" ? "Draft · Configuring" : "Published · Active"}
    </span>
  );
}
