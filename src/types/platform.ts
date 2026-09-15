export type PlatformRole = "super_admin" | "platform_dev" | "platform_tester" | "support_agent";

export interface PlatformStaffUser {
  id: string;
  email: string;
  name: string;
  role: PlatformRole;
  status: "active" | "suspended" | "deactivated";
  mfaEnabled: boolean;
  permissions?: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TenantMetadata {
  id: string;
  name: string;
  slug?: string;
  plan: string;
  planStatus: "active" | "suspended" | "trial" | "cancelled" | string;
  planExpiresAt: string | null;
  messageQuotaMonthly?: number;
  maxMonthlyMessages?: number;
  messagesSentCurrentPeriod?: number;
  maxChannels?: number;
  channelCount?: number;
  activeChannelCount?: number;
  maxUsers?: number;
  userCount?: number;
  maxContacts?: number;
  maxMonthlyAiQueries?: number;
  webhookSubscriptionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTenantOverview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  trialTenants: number;
  totalChannels: number;
  totalPlatformStaff: number;
}

export interface SystemHealthTelemetry {
  server: {
    nodeVersion: string;
    platform: string;
    architecture: string;
    uptimeSeconds: number;
    cpuCount: number;
    loadAverage: number[];
    freeMemoryMb: number;
    totalMemoryMb: number;
  };
  process: {
    pid: number;
    uptimeSeconds: number;
    memory: {
      rssMb: number;
      heapTotalMb: number;
      heapUsedMb: number;
      externalMb: number;
    };
  };
  database: {
    status: "healthy" | "degraded" | "down";
    pingLatencyMs: number;
    pool: {
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    };
    version?: string;
  };
  redis: {
    status: "healthy" | "degraded" | "disabled";
    pingLatencyMs: number;
    connected: boolean;
  };
  realtime: {
    activeConnections: number;
    activeTenants: number;
  };
  telemetryTimestamp: string;
}

export interface SyntheticWebhookResult {
  success: boolean;
  channelType: "whatsapp" | "telegram" | "web" | "custom";
  statusCode: number;
  durationMs: number;
  simulatedPayload: any;
  response: string;
}

export interface ChannelHealthPingResult {
  status: "ok" | "degraded" | "error";
  activeChannels: number;
  channelsByType: Record<string, number>;
  latencyMs: number;
}

export interface PlatformAuditLogItem {
  id: string;
  platformUserId: string | null;
  platformUserEmail: string;
  platformUserRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformLogEntry {
  level: "debug" | "info" | "warn" | "error" | string;
  message: string;
  timestamp: string;
  reqId?: string;
  tenantId?: string;
  userId?: string;
  module?: string;
  durationMs?: number;
  statusCode?: number;
  meta?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Dynamic SaaS Plans & Entitlements
// ─────────────────────────────────────────────────────────────
export interface PlatformPlanItem {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxChannels: number;
  maxContacts: number;
  maxMonthlyMessages: number;
  maxMonthlyAiQueries: number;
  features: string[];
  badgeText: string | null;
  isActive: boolean;
  isPublic: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformPlanDto {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  currency?: string;
  maxChannels: number;
  maxContacts: number;
  maxMonthlyMessages: number;
  maxMonthlyAiQueries: number;
  features?: string[];
  badgeText?: string;
  isActive?: boolean;
  isPublic?: boolean;
  isCustom?: boolean;
}

export interface UpdatePlatformPlanDto {
  name?: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  currency?: string;
  maxChannels?: number;
  maxContacts?: number;
  maxMonthlyMessages?: number;
  maxMonthlyAiQueries?: number;
  features?: string[];
  badgeText?: string;
  isActive?: boolean;
  isPublic?: boolean;
  isCustom?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Workspace Subscriptions Lifecycle & Entitlements
// ─────────────────────────────────────────────────────────────
export interface WorkspaceSubscriptionItem {
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  planStatus: "active" | "trial" | "suspended" | "cancelled" | "expired" | string;
  planExpiresAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
  maxChannels: number;
  activeChannels: number;
  maxContacts: number;
  totalContacts: number;
  maxMonthlyMessages: number;
  maxMonthlyAiQueries: number;
  ownerEmail: string | null;
  ownerName: string | null;
  lastPaymentAt: string | null;
  lastInvoiceNumber: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Subscription Payments Ledger
// ─────────────────────────────────────────────────────────────
export interface SubscriptionPaymentRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly" | "custom" | string;
  paymentMethod: "stripe" | "razorpay" | "bank_transfer" | "credit_card" | "manual" | "crypto" | string;
  transactionReference: string | null;
  status: "paid" | "pending" | "failed" | "refunded" | string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
  recordedByStaffId: string | null;
  recordedByName: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Support & Helpdesk Ticketing System
// ─────────────────────────────────────────────────────────────
export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  tenantId: string;
  tenantName?: string;
  createdByUserId: string | null;
  createdByEmail: string;
  createdByName: string;
  subject: string;
  category: "billing" | "technical" | "channel_integration" | "account" | "feature_request" | "general" | string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  status: "open" | "in_progress" | "pending_customer" | "resolved" | "closed" | string;
  assignedToStaffId: string | null;
  assignedToName: string | null;
  lastReplyAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  messageCount?: number;
  internalNoteCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessageItem {
  id: string;
  ticketId: string;
  senderType: "user" | "platform_staff";
  senderId: string | null;
  senderName: string;
  senderEmail: string;
  message: string;
  attachments: any[];
  isInternalNote: boolean;
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicketItem {
  messages: SupportTicketMessageItem[];
}

export interface SupportTicketStats {
  open: number;
  inProgress: number;
  pendingCustomer: number;
  resolved: number;
  urgent: number;
  unassigned: number;
}

export interface RealtimeMessageEvent<T = any> {
  event: string;
  data: T;
  tenantId?: string;
  timestamp: string;
}
