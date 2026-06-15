import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "./client";

export type AgentStatus = "draft" | "published";

export interface AgentIntegrations {
  slack: { enabled: boolean; webhookUrl?: string; channel?: string };
  googleCalendar: {
    enabled: boolean;
    calendarId?: string;
    hasCredentials?: boolean;
  };
  gmail: { enabled: boolean; email?: string; hasCredentials?: boolean };
}

export interface Agent {
  _id: string;
  name: string;
  description: string;
  status: AgentStatus;
  isActive: boolean;
  integrations: AgentIntegrations;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  channels: {
    slack: { sent: boolean; error?: string };
    googleCalendar: { sent: boolean; error?: string };
    gmail: { sent: boolean; error?: string };
  };
  createdAt: string;
}

export function listAgents(token: string) {
  return apiGet<{ agents: Agent[] }>("/api/agents", token);
}

export function getAgent(token: string, id: string) {
  return apiGet<{ agent: Agent }>(`/api/agents/${id}`, token);
}

export function createAgent(
  token: string,
  data: { name: string; description?: string }
) {
  return apiPost<{ agent: Agent }>("/api/agents", token, data);
}

export function updateAgent(
  token: string,
  id: string,
  data: { name?: string; description?: string }
) {
  return apiPut<{ agent: Agent }>(`/api/agents/${id}`, token, data);
}

export function configureSlack(
  token: string,
  id: string,
  data: { enabled: boolean; webhookUrl?: string; channel?: string }
) {
  return apiPut<{ agent: Agent }>(
    `/api/agents/${id}/integrations/slack`,
    token,
    data
  );
}

export function configureCalendar(
  token: string,
  id: string,
  data: { enabled: boolean; calendarId?: string }
) {
  return apiPut<{ agent: Agent }>(
    `/api/agents/${id}/integrations/google-calendar`,
    token,
    data
  );
}

export function configureGmail(
  token: string,
  id: string,
  data: { enabled: boolean; email?: string }
) {
  return apiPut<{ agent: Agent }>(
    `/api/agents/${id}/integrations/gmail`,
    token,
    data
  );
}

export function publishAgent(token: string, id: string) {
  return apiPatch<{ agent: Agent; message: string }>(
    `/api/agents/${id}/publish`,
    token
  );
}

export function draftAgent(token: string, id: string) {
  return apiPatch<{ agent: Agent; message: string }>(
    `/api/agents/${id}/draft`,
    token
  );
}

export function sendNotification(
  token: string,
  id: string,
  data: { title: string; message: string }
) {
  return apiPost<{ notification: Notification }>(
    `/api/agents/${id}/notifications`,
    token,
    data
  );
}

export function listNotifications(token: string, id: string) {
  return apiGet<{ notifications: Notification[] }>(
    `/api/agents/${id}/notifications`,
    token
  );
}

export function deleteAgent(token: string, id: string) {
  return apiDelete<{ message: string }>(`/api/agents/${id}`, token);
}
