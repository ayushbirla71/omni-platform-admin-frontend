import React, { useEffect, useState, useCallback, useRef } from "react";
import { platformApi } from "../api/platform-api";
import {
  SupportTicketItem,
  SupportTicketDetail,
  SupportTicketStats,
  PlatformStaffUser,
} from "../types/platform";
import { usePlatformAuth } from "../context/PlatformAuthContext";
import { useRealtimeEvent } from "../hooks/useWebSocket";
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Lock,
  Send,
  User,
  Shield,
  Tag,
  ChevronRight,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Building,
  Mail,
} from "lucide-react";

export const SupportTicketsPage: React.FC = () => {
  const { user: currentStaffUser } = usePlatformAuth();

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [staffList, setStaffList] = useState<PlatformStaffUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected Ticket State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<SupportTicketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Reply Form State
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  useEffect(() => {
    if (ticketDetail?.messages) {
      scrollToBottom(false);
    }
  }, [ticketDetail?.id]);

  const fetchStats = async () => {
    try {
      const data = await platformApi.support.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load support stats:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await platformApi.staff.list();
      setStaffList(data);
    } catch (err) {
      console.error("Failed to load staff list:", err);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.support.listTickets({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        page,
        limit: 15,
      });
      setTickets(res.tickets);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load support tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketDetail = async (ticketId: string) => {
    setIsLoadingDetail(true);
    try {
      const data = await platformApi.support.getTicketDetails(ticketId);
      setTicketDetail(data);
      setTimeout(() => scrollToBottom(false), 50);
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Real-time: Listen for incoming ticket messages
  useRealtimeEvent("support_ticket:message", (event) => {
    const data = event.data;
    if (!data || !data.ticketId) return;

    if (selectedTicketId === data.ticketId && data.message) {
      setTicketDetail((prev) => {
        if (!prev || prev.id !== data.ticketId) return prev;
        const exists = prev.messages.some((m) => m.id === data.message.id);
        if (exists) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          lastReplyAt: data.lastReplyAt || new Date().toISOString(),
          messages: [...prev.messages, data.message],
        };
      });
      setTimeout(() => scrollToBottom(true), 50);
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === data.ticketId) {
          return {
            ...t,
            status: data.status || t.status,
            lastReplyAt: data.lastReplyAt || new Date().toISOString(),
            messageCount: (t.messageCount || 0) + 1,
          };
        }
        return t;
      })
    );
    fetchStats();
  });

  // Real-time: Listen for ticket status / assignment / priority updates
  useRealtimeEvent("support_ticket:updated", (event) => {
    const data = event.data;
    if (!data || !data.ticketId) return;

    if (selectedTicketId === data.ticketId) {
      setTicketDetail((prev) => {
        if (!prev || prev.id !== data.ticketId) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          priority: data.priority || prev.priority,
          category: data.category || prev.category,
          assignedToStaffId: data.assignedToStaffId,
          assignedToName: data.assignedToName,
          resolvedAt: data.resolvedAt,
          closedAt: data.closedAt,
        };
      });
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === data.ticketId) {
          return {
            ...t,
            status: data.status || t.status,
            priority: data.priority || t.priority,
            category: data.category || t.category,
            assignedToStaffId: data.assignedToStaffId,
            assignedToName: data.assignedToName,
          };
        }
        return t;
      })
    );
    fetchStats();
  });

  // Real-time: Listen for new support tickets opened by any tenant
  useRealtimeEvent("support_ticket:created", (event) => {
    const data = event.data;
    if (!data?.ticket) return;

    setTickets((prev) => {
      const exists = prev.some((t) => t.id === data.ticket.id);
      if (exists) return prev;
      return [data.ticket, ...prev];
    });
    setTotal((prev) => prev + 1);
    fetchStats();
  });

  useEffect(() => {
    fetchStats();
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetail(selectedTicketId);
    } else {
      setTicketDetail(null);
    }
  }, [selectedTicketId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDetail || !replyMessage.trim()) return;

    setIsSendingReply(true);
    setReplyError(null);

    try {
      const sentMsg = await platformApi.support.postMessage(ticketDetail.id, {
        message: replyMessage.trim(),
        isInternalNote,
      });

      setReplyMessage("");
      if (sentMsg) {
        setTicketDetail((prev) => {
          if (!prev) return prev;
          const exists = prev.messages.some((m) => m.id === sentMsg.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, sentMsg],
          };
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
      fetchTickets();
      fetchStats();
    } catch (err: any) {
      setReplyError(err.message || "Failed to post message to ticket thread");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!ticketDetail) return;
    try {
      await platformApi.support.updateTicket(ticketDetail.id, { status: newStatus });
      await fetchTicketDetail(ticketDetail.id);
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!ticketDetail) return;
    try {
      await platformApi.support.updateTicket(ticketDetail.id, { priority: newPriority });
      await fetchTicketDetail(ticketDetail.id);
      fetchTickets();
    } catch (err) {
      console.error("Failed to update ticket priority:", err);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    if (!ticketDetail) return;
    const staff = staffList.find((s) => s.id === staffId);
    try {
      await platformApi.support.updateTicket(ticketDetail.id, {
        assignedToStaffId: staffId || null,
        assignedToName: staff ? staff.name : null,
      });
      await fetchTicketDetail(ticketDetail.id);
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error("Failed to assign staff:", err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase font-bold">
            URGENT
          </span>
        );
      case "high":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase font-semibold">
            HIGH
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
            MED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
            OPEN
          </span>
        );
      case "in_progress":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
            IN PROGRESS
          </span>
        );
      case "pending_customer":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
            PENDING CUSTOMER
          </span>
        );
      case "resolved":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
            RESOLVED
          </span>
        );
      case "closed":
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
            CLOSED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Platform Support & Helpdesk</h1>
            <p className="text-xs text-slate-400">
              Manage workspace cases, post public customer replies, or collaborate via internal staff notes.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStats();
            fetchTickets();
            if (selectedTicketId) fetchTicketDetail(selectedTicketId);
          }}
          disabled={isLoading}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition self-start sm:self-auto"
          title="Refresh Tickets"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>

      {/* Stats Chips */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Open</span>
            <span className="text-xl font-bold text-cyan-400 font-mono">{stats.open}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">In Progress</span>
            <span className="text-xl font-bold text-indigo-400 font-mono">{stats.inProgress}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Pending User</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{stats.pendingCustomer}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Urgent</span>
            <span className="text-xl font-bold text-rose-400 font-mono">{stats.urgent}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Unassigned</span>
            <span className="text-xl font-bold text-purple-400 font-mono">{stats.unassigned}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Resolved</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{stats.resolved}</span>
          </div>
        </div>
      )}

      {/* Split Grid: Tickets List & Active Ticket Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className={`space-y-3 ${selectedTicketId ? "lg:col-span-5" : "lg:col-span-12"}`}>
          {/* Filters */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket #, subject, tenant..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </form>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_customer">Pending User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Categories</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="channel_integration">Channels</option>
                <option value="account">Account</option>
                <option value="feature_request">Feature</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Tickets Cards */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-900/60 border border-slate-800 rounded-xl">
                Loading support tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/60 border border-slate-800 rounded-xl">
                No support cases matching criteria.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {t.ticketNumber}
                        </span>
                        {getPriorityBadge(t.priority)}
                      </div>
                      <div>{getStatusBadge(t.status)}</div>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">{t.subject}</h3>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[180px]">
                        {t.tenantName || t.tenantId} • {t.createdByName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(t.lastReplyAt || t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Category: {t.category.replace("_", " ")}</span>
                      <span>Assigned: {t.assignedToName || "Unassigned"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span>
              {tickets.length} / {total} cases
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 text-[11px]"
              >
                Prev
              </button>
              <span className="font-mono text-[11px]">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 text-[11px]"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Ticket Detail & Timeline Drawer */}
        {selectedTicketId && (
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[620px]">
            {isLoadingDetail || !ticketDetail ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs my-auto">
                Loading ticket details & conversation thread...
              </div>
            ) : (
              <>
                {/* Drawer Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono font-bold text-cyan-400">
                        {ticketDetail.ticketNumber}
                      </span>
                      {getPriorityBadge(ticketDetail.priority)}
                      {getStatusBadge(ticketDetail.status)}
                    </div>
                    <button
                      onClick={() => setSelectedTicketId(null)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="text-base font-bold text-white mb-2">{ticketDetail.subject}</h2>

                  {/* Metadata Row & Quick Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    {/* Status Select */}
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        Status
                      </label>
                      <select
                        value={ticketDetail.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_customer">Pending Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Priority Select */}
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        Priority
                      </label>
                      <select
                        value={ticketDetail.priority}
                        onChange={(e) => handleUpdatePriority(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Assign Staff Select */}
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">
                        Assignee
                      </label>
                      <select
                        value={ticketDetail.assignedToStaffId || ""}
                        onChange={(e) => handleAssignStaff(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Unassigned</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="mt-3 p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                    <div>
                      <span className="text-slate-300 font-semibold">{ticketDetail.createdByName}</span> (
                      {ticketDetail.createdByEmail})
                    </div>
                    <div>
                      Workspace: <strong className="text-white">{ticketDetail.tenantName || ticketDetail.tenantId}</strong>
                    </div>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[380px] bg-slate-950/40">
                  {ticketDetail.messages.map((m) => {
                    const isStaff = m.senderType === "platform_staff";
                    const isNote = m.isInternalNote;

                    if (isNote) {
                      return (
                        <div
                          key={m.id}
                          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Internal Staff Note • {m.senderName}</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber-400/80">
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-amber-200 whitespace-pre-wrap leading-relaxed">
                            {m.message}
                          </p>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/60 block pt-1">
                            🔒 Zero-PII Shield: Hidden from customer view
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl p-3.5 border ${
                          isStaff
                            ? "bg-indigo-950/30 border-indigo-500/30 ml-4"
                            : "bg-slate-900 border-slate-800 mr-4"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isStaff
                                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                                  : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                              }`}
                            >
                              {m.senderName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-white">{m.senderName}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                isStaff
                                  ? "bg-indigo-500/20 text-indigo-300"
                                  : "bg-cyan-500/20 text-cyan-300"
                              }`}
                            >
                              {isStaff ? "SUPPORT AGENT" : "CUSTOMER"}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {m.message}
                        </p>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply / Internal Note Input Box */}
                <form onSubmit={handlePostReply} className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
                  {replyError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{replyError}</span>
                    </div>
                  )}

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                        !isInternalNote
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20 font-semibold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Public Customer Reply (Email Dispatched)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                        isInternalNote
                          ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20 font-semibold"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Staff Only Internal Note</span>
                    </button>
                  </div>

                  {/* Message Textarea */}
                  <textarea
                    rows={3}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? "Write private team note (visible only to platform staff & admins)..."
                        : "Type response to customer (they will receive an email and in-app update)..."
                    }
                    className={`w-full border rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none ${
                      isInternalNote
                        ? "bg-amber-950/20 border-amber-500/40 focus:border-amber-500"
                        : "bg-slate-900 border-slate-800 focus:border-indigo-500"
                    }`}
                  />

                  {/* Submit Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {ticketDetail.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus("resolved")}
                          className="text-xs px-2.5 py-1.5 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition"
                        >
                          Mark as Resolved
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingReply || !replyMessage.trim()}
                      className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                        isInternalNote
                          ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
                          : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                      }`}
                    >
                      {isInternalNote ? <Lock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{isSendingReply ? "Sending..." : isInternalNote ? "Save Internal Note" : "Send Customer Reply"}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
