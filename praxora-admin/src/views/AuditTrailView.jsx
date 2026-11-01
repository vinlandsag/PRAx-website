import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Filter, Shield, Calendar, Terminal, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';

export default function AuditTrailView({ searchQuery }) {
  const { toastError } = useToast();
  const [logs, setLogs] = useState([]);
  const [distinctActions, setDistinctActions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        search: searchQuery,
        action: actionFilter,
        targetType: targetTypeFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setLogs(res.logs);
      setDistinctActions(res.distinctActions);
      setPagination(res.pagination);
    } catch (err) {
      toastError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, actionFilter, targetTypeFilter, pagination.page, pagination.limit, toastError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#252C3A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#8B7CFF] uppercase bg-[#8B7CFF]/10 px-2 py-0.5 rounded border border-[#8B7CFF]/20">
              IMMUTABLE LEDGER
            </span>
            <span className="text-xs font-mono text-[#737E91]">WAL Mode Active</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight text-[#F3F5FA] flex items-center gap-2">
            System Security & Audit Trail
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#131722] text-[#A0A8B8] border border-[#252C3A]">
              {pagination.total} Events
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#A0A8B8]">
            Tamper-evident log of role alterations, ledger transactions, access privileges, and moderation actions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] hover:border-[#8B7CFF]/50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8B7CFF]' : ''}`} />
          <span>Sync Log</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0D1017] p-4 rounded-2xl border border-[#252C3A] max-w-lg shadow-sm">
        <div>
          <label htmlFor="audit-action-filter" className="block text-[10px] font-mono font-semibold text-[#A0A8B8] uppercase tracking-wider mb-1.5">
            Action Filter
          </label>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF] transition-colors"
          >
            <option value="">All Actions ({distinctActions.length})</option>
            {distinctActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="audit-target-filter" className="block text-[10px] font-mono font-semibold text-[#A0A8B8] uppercase tracking-wider mb-1.5">
            Target Entity
          </label>
          <select
            id="audit-target-filter"
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#131722] border border-[#252C3A] rounded-xl text-xs text-[#F3F5FA] focus:outline-none focus:border-[#8B7CFF] transition-colors"
          >
            <option value="">All Entities</option>
            <option value="user">User</option>
            <option value="task">Task</option>
            <option value="submission">Submission</option>
            <option value="chat_message">Chat Message</option>
            <option value="invitation">Invitation</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0D1017] border border-[#252C3A] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#737E91] font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#8B7CFF]" />
            Reading append-only security journal...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-[#737E91]">
            <History className="w-10 h-10 mx-auto mb-3 text-[#252C3A]" />
            <h3 className="text-sm font-semibold text-[#A0A8B8]">No audit events match your criteria</h3>
            <p className="text-xs text-[#737E91] mt-1 font-mono">Adjust search query or entity filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#A0A8B8]">
              <thead className="bg-[#08090D] text-[10px] font-mono font-semibold text-[#A0A8B8] uppercase tracking-wider border-b border-[#252C3A]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Action & Target</th>
                  <th scope="col" className="px-4 py-3.5">Initiator</th>
                  <th scope="col" className="px-5 py-3.5">Details</th>
                  <th scope="col" className="px-4 py-3.5">IP Origin</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252C3A]/60 font-mono text-xs">
                {logs.map((log) => {
                  let badge = 'bg-[#191F2B] text-[#A0A8B8] border-[#252C3A]';
                  if (log.action.includes('APPROVED') || log.action.includes('CREATED')) {
                    badge = 'bg-[#48D6A0]/10 text-[#48D6A0] border-[#48D6A0]/25';
                  } else if (log.action.includes('REJECTED') || log.action.includes('SUSPENDED') || log.action.includes('DELETED')) {
                    badge = 'bg-[#FF6B78]/10 text-[#FF6B78] border-[#FF6B78]/25';
                  } else if (log.action.includes('ROLE')) {
                    badge = 'bg-[#F2BD69]/10 text-[#F2BD69] border-[#F2BD69]/25';
                  } else if (log.action.includes('TASK')) {
                    badge = 'bg-[#8B7CFF]/10 text-[#8B7CFF] border-[#8B7CFF]/25';
                  } else if (log.action.includes('CHAT')) {
                    badge = 'bg-[#55D6BE]/10 text-[#55D6BE] border-[#55D6BE]/25';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-[#131722]/50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                          {log.action}
                        </span>
                        <span className="ml-2 text-[10px] text-[#737E91]">[{log.target_type}]</span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-sans">
                        <div className="font-medium text-[#F3F5FA]">{log.user_name || 'System'}</div>
                        <div className="text-[11px] text-[#737E91] font-mono">{log.user_role}</div>
                      </td>

                      <td className="px-5 py-3.5 font-sans text-xs text-[#A0A8B8] max-w-md truncate">
                        {log.details}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-[#737E91] text-[11px] font-mono">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-[#737E91] text-[11px] font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-[#252C3A] flex items-center justify-between text-xs text-[#A0A8B8] font-mono">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-xl border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] hover:border-[#8B7CFF]/50 disabled:opacity-40 disabled:hover:border-[#252C3A] transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-[#252C3A] bg-[#131722] text-[#A0A8B8] hover:text-[#F3F5FA] hover:border-[#8B7CFF]/50 disabled:opacity-40 disabled:hover:border-[#252C3A] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}