export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum ComponentType {
  JETTY = 'Jetty',
  SHIBBOLETH = 'Shibboleth',
  LDAP = 'LDAP',
  DATABASE = 'Database'
}

export interface TraceStep {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failure' | 'warning';
  timestamp: string;
  details: string;
  durationMs: number;
}

export interface RequestLog {
  id: string; // Transaction ID
  timestamp: Date;
  spEntityId: string;
  userPrincipal: string | null;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  durationMs: number;
  steps: TraceStep[];
  rawLogs: string[];
  auditLog: string; // New field for the structured audit log
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  max: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface IdpHealth {
  jettyThreads: SystemMetric;
  heapMemory: SystemMetric;
  ldapLatency: SystemMetric;
  dbPool: SystemMetric;
}