export interface AuditLogEntry {
  requestId: string;
  userId: string | null;
  endpoint: string;
  method: string;
  timestamp: string;
  status?: number;
  duration?: number;
}

const auditLogs: AuditLogEntry[] = [];

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function logAudit(entry: Omit<AuditLogEntry, 'timestamp'> & { timestamp?: string }): void {
  const log: AuditLogEntry = {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  };
  auditLogs.push(log);
}

export function getAuditLogs(): AuditLogEntry[] {
  return [...auditLogs];
}
