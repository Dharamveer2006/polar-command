'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { UserCheck, Shield, KeyRound, Clock, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { currentUser, setCurrentUser, allUsers, auditLogs } = useStation();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="polar-card p-6 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-polar-ice/15 text-polar-ice border border-polar-ice/30">
                Authentication & Access Control
              </span>
              <span className="text-xs font-mono text-slate-400">NCPOR Unified Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">POLAR COMMAND Role Gateway</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Role-Based Access Control (RBAC) governing telemetry observation, critical equipment command overrides, requisition workflows, and incident reporting for Maitri and Bharati.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-lg bg-polar-accent hover:bg-sky-400 text-polar-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20"
          >
            Enter Command Center <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Demo Credentials & Role Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allUsers.map((user) => {
          const isSelected = currentUser.id === user.id;
          const permissions = ROLE_PERMISSIONS[user.role];

          return (
            <div
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'polar-card-highlight border-cyan-400/60 ring-2 ring-cyan-500/30'
                  : 'polar-card border-polar-border/40 hover:border-polar-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {user.role}
                </span>
                {isSelected && <Shield className="w-4 h-4 text-cyan-400" />}
              </div>

              <h3 className="font-semibold text-white text-sm">{user.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>

              <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Dashboard:</span>
                  <span className={permissions.canEditDashboard ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {permissions.canEditDashboard ? 'Read/Write' : 'Read-Only'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Acknowledge Alerts:</span>
                  <span className={permissions.canAcknowledgeAlerts ? 'text-emerald-400' : 'text-slate-500'}>
                    {permissions.canAcknowledgeAlerts ? 'Full' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Requisitions:</span>
                  <span className={permissions.canApproveRequisition ? 'text-emerald-400 font-bold' : permissions.canCreateRequisition ? 'text-sky-400' : 'text-slate-500'}>
                    {permissions.canApproveRequisition ? 'Create + Approve' : permissions.canCreateRequisition ? 'Create Only' : 'None'}
                  </span>
                </div>
              </div>

              <button
                className={`mt-4 w-full py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  isSelected
                    ? 'bg-cyan-400 text-polar-950 font-bold'
                    : 'bg-polar-800/80 text-slate-300 hover:bg-polar-700'
                }`}
              >
                {isSelected ? 'Active Session' : 'Switch to Profile'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Audit Log / Session Activity Preview */}
      <div className="polar-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-polar-ice" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Operational Session Audit Trail
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} events logged in current session
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/5">
                <th className="py-2">TIMESTAMP</th>
                <th className="py-2">OPERATOR</th>
                <th className="py-2">ACTION</th>
                <th className="py-2">ENTITY</th>
                <th className="py-2">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 text-sky-300 font-semibold">{log.userName}</td>
                  <td className="py-2">
                    <span className="px-1.5 py-0.5 rounded bg-polar-800 border border-polar-border text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 text-slate-400">{log.entityType}:{log.entityId}</td>
                  <td className="py-2 text-slate-200">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
