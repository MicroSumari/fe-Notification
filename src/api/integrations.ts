import { apiDelete, apiGet } from "./client";

export interface IntegrationStatus {
  google: { connected: boolean; email?: string };
  slack: { connected: boolean; teamName?: string };
}

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  htmlLink: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isIm: boolean;
  isMpim?: boolean;
  isMember: boolean;
}

export interface SlackMessage {
  id: string;
  text: string;
  user: string;
  timestamp: string;
}

export function getIntegrationStatus(token: string) {
  return apiGet<{ integrations: IntegrationStatus }>(
    "/api/integrations/status",
    token
  );
}

export function getGoogleAuthUrl(token: string) {
  return apiGet<{ url: string }>("/api/integrations/google/url", token);
}

export function disconnectGoogle(token: string) {
  return apiDelete<{ message: string }>("/api/integrations/google", token);
}

export function getSlackAuthUrl(token: string) {
  return apiGet<{ url: string }>("/api/integrations/slack/url", token);
}

export function disconnectSlack(token: string) {
  return apiDelete<{ message: string }>("/api/integrations/slack", token);
}

export function fetchGmailMessages(token: string) {
  return apiGet<{ messages: GmailMessage[] }>(
    "/api/integrations/gmail/messages",
    token
  );
}

export function fetchCalendarEvents(token: string) {
  return apiGet<{ events: CalendarEvent[] }>(
    "/api/integrations/calendar/events",
    token
  );
}

export function fetchSlackChannels(token: string) {
  return apiGet<{ channels: SlackChannel[] }>(
    "/api/integrations/slack/channels",
    token
  );
}

export function fetchSlackMessages(token: string, channelId: string) {
  return apiGet<{ messages: SlackMessage[]; notice?: string }>(
    `/api/integrations/slack/channels/${channelId}/messages`,
    token
  );
}

export function fetchSlackRecent(token: string) {
  return apiGet<{
    channels: SlackChannel[];
    messages: SlackMessage[];
    notice?: string;
    activeChannel?: SlackChannel;
  }>("/api/integrations/slack/messages", token);
}
