'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import { ROLE_PERMISSIONS } from '@/lib/permissions';
import { 
  Package, 
  PlusCircle, 
  Ship, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Shield, 
  Plane,
  AlertTriangle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { RequisitionPriority } from '@/types';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

export default function LogisticsPage() {
  const { 
    stationState, 
    currentUser, 
    createRequisition, 
    updateRequisitionStatus,
    activeInjectedEvents 
  } = useStation();

  const { logistics, metadata } = stationState;
  const permissions = ROLE_PERMISSIONS[currentUser.role];

  // Modal / Form state for new requisition
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<RequisitionPriority>('ROUTINE');
  const [rationale, setRationale] = useState('');
  const [sku, setSku] = useState('FUEL-JET-A1-POLAR');
  const [quantity, setQuantity] = useState(5000);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rationale) return;

    createRequisition({
      stationId: metadata.stationId,
      title,
      priority,
      rationale,
      eta: '2026-11-05',
      items: [
        {
          sku,
          name: logistics.inventory.find(i => i.sku === sku)?.name || sku,
          quantity: Number(quantity),
          unit: logistics.inventory.find(i => i.sku === sku)?.unit || 'units',
        },
      ],
    });

    setTitle('');
    setRationale('');
    setShowCreateModal(false);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-900 text-rose-100 border-rose-500 font-bold';
      case 'PROJECTED SHORTAGE':
        return 'bg-orange-900 text-orange-100 border-orange-500 font-bold';
      case 'WARNING':
        return 'bg-amber-900 text-amber-100 border-amber-500 font-semibold';
      case 'SAFE':
      default:
        return 'bg-emerald-900 text-emerald-100 border-emerald-500 font-semibold';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-100/90 text-purple-800 border border-purple-300 uppercase font-bold">
              Domain 4: Polar Supply Chain
            </span>
            <ProvenanceBadge source="Prototype Forecast" />
            <span className="text-xs font-mono text-[#36546D]">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-[#0F2740] tracking-tight mt-1">
            Predictive Logistics & Consumables Runway Engine
          </h1>
          <p className="text-xs text-[#36546D] font-mono">
            Calculates <code className="text-cyan-800 bg-cyan-100/80 px-1 py-0.5 rounded border border-cyan-300 font-semibold">daysRemaining = quantity / dailyConsumption</code> and projects shortages against icebreaker routing windows.
          </p>
        </div>

        {/* Action Button */}
        {permissions.canCreateRequisition && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            Create Requisition
          </button>
        )}
      </div>

      {/* Resupply Vessel Banner */}
      <div className="p-4 rounded-xl bg-polar-900 border border-polar-border flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <Ship className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="font-bold text-white text-sm">MV Vasiliy Golovnin Resupply Track</span>
            <p className="text-slate-300 text-[11px] mt-0.5">
              {activeInjectedEvents.resupplyDelay 
                ? 'DELAYED: Fast-ice freeze in Prydz Bay has added +12 days transit. Revised ETA: 2026-11-03.' 
                : 'ON SCHEDULE: Ice-strengthened cargo vessel navigating via Cape Town. ETA: 2026-10-22.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300 text-[11px]">Vessel Transit Status:</span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${
            activeInjectedEvents.resupplyDelay 
              ? 'bg-rose-900 text-rose-100 border-rose-500' 
              : 'bg-emerald-900 text-emerald-100 border-emerald-500'
          }`}>
            {activeInjectedEvents.resupplyDelay ? 'Delayed (+12d)' : 'Nominal Transit'}
          </span>
        </div>
      </div>

      {/* Inventory Consumables Ledger - Technical Dark Translucent Panel */}
      <div className="polar-glass-dark p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Critical Consumables Ledger & Dynamic Shortage Projection
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              Target Safety Threshold: ≥ 14 Days Reserve
            </p>
          </div>
          <ProvenanceBadge source="Derived Calculation" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-polar-900/90 text-slate-300 border-b border-white/15 text-[10px] font-semibold font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3 min-w-[200px]">Item Description</th>
                <th className="py-2.5 px-3 min-w-[95px]">Category</th>
                <th className="py-2.5 px-3 min-w-[110px]">Stock On Hand</th>
                <th className="py-2.5 px-3 min-w-[110px]">Daily Burn</th>
                <th className="py-2.5 px-3 min-w-[105px]">Days Remaining</th>
                <th className="py-2.5 px-3 min-w-[95px]">Safety Stock</th>
                <th className="py-2.5 px-3 min-w-[100px]">Resupply ETA</th>
                <th className="py-2.5 px-3 min-w-[110px]">Projected Shortage</th>
                <th className="py-2.5 px-3 min-w-[115px] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-100 font-sans">
              {logistics.inventory.map((item, idx) => {
                const daysRem = Number((item.quantity / Math.max(0.1, item.dailyConsumption)).toFixed(1));
                const status = item.inventoryStatus || (daysRem < 10 ? 'CRITICAL' : daysRem < 15 ? 'PROJECTED SHORTAGE' : daysRem < 20 ? 'WARNING' : 'SAFE');
                const shortageDate = item.projectedShortageDate || '2026-11-15';

                return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors hover:bg-cyan-500/10 ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white text-xs tracking-tight">
                        {item.name}
                      </div>
                      <span className="inline-block text-[9px] text-cyan-300/80 font-mono tracking-wider mt-0.5">
                        {item.sku}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="font-bold text-white text-xs">
                        {item.quantity.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-300 font-normal ml-1">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200 text-[11px]">
                      <span>{item.dailyConsumption.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5 font-normal">{item.unit}/day</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-xs">
                      <span className={daysRem < 14 ? 'text-rose-400' : daysRem < 21 ? 'text-amber-400' : 'text-emerald-400'}>
                        {daysRem} <span className="text-[10px] font-medium">days</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      <span>{item.safetyStock.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5 font-normal">{item.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-300 font-medium">
                      {item.nextResupplyEta}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-200">
                      {shortageDate}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wide border shadow-sm ${getStatusBadge(status)}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requisitions Lifecycle Workflow */}
      <div className="polar-card p-5 rounded-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F2740] uppercase tracking-wider">
              Requisition Lifecycle Workflow
            </h2>
            <p className="text-[#36546D] mt-0.5 text-[11px] font-medium">
              DRAFT → SUBMITTED → APPROVED → IN_TRANSIT → DELIVERED
            </p>
          </div>
          <span className="text-[#36546D]">
            Active Role: <strong className="text-cyan-800 uppercase font-bold">{currentUser.role}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {logistics.requisitions.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-polar-900 border border-polar-border space-y-3 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{req.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    req.priority === 'CRITICAL_AIRLIFT' ? 'bg-rose-900 text-rose-100 border border-rose-500' :
                    req.priority === 'ELEVATED' ? 'bg-amber-900 text-amber-100 border border-amber-500' :
                    'bg-cyan-900 text-cyan-100 border border-cyan-500'
                  }`}>
                    {req.priority.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-300">Status:</span>
                  <span className="px-2.5 py-0.5 rounded bg-[#08243A] text-cyan-300 font-bold border border-cyan-400">
                    {req.status}
                  </span>
                </div>
              </div>

              <p className="text-slate-200 text-[11px] leading-relaxed font-sans">
                {req.rationale}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-300">
                <div className="flex items-center gap-4">
                  <span>Req ID: <strong className="text-white font-mono">{req.id}</strong></span>
                  <span>Requester: <strong className="text-white">{req.requesterName}</strong></span>
                  <span>ETA: <strong className="text-white font-mono">{req.eta}</strong></span>
                  {req.approvedBy && <span className="text-emerald-400">Approved By: <strong>{req.approvedBy}</strong></span>}
                </div>

                {/* Workflow Transitions (RBAC Protected) */}
                <div className="flex items-center gap-2">
                  {req.status === 'SUBMITTED' && permissions.canApproveRequisition && (
                    <button
                      onClick={() => updateRequisitionStatus(req.id, 'APPROVED')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm"
                    >
                      Approve Requisition
                    </button>
                  )}
                  {req.status === 'APPROVED' && permissions.canCreateRequisition && (
                    <button
                      onClick={() => updateRequisitionStatus(req.id, 'IN_TRANSIT')}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm"
                    >
                      Dispatch / In Transit
                    </button>
                  )}
                  {req.status === 'IN_TRANSIT' && permissions.canCreateRequisition && (
                    <button
                      onClick={() => updateRequisitionStatus(req.id, 'DELIVERED')}
                      className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-sm"
                    >
                      Confirm Station Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Creating Requisition */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="polar-card-dark bg-polar-950 p-6 rounded-2xl max-w-lg w-full space-y-4 font-mono text-xs border border-cyan-500/40 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-white/20 pb-3">
              <h3 className="font-bold text-white text-base">New Station Supply Requisition</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-slate-200 block mb-1 font-semibold">Requisition Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency ATF Winter Blend Top-up"
                  className="w-full p-2.5 rounded bg-polar-900 border border-polar-border text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-200 block mb-1 font-semibold">Target Item</label>
                  <select
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 rounded bg-polar-900 border border-polar-border text-white focus:outline-none"
                  >
                    {logistics.inventory.map(i => (
                      <option key={i.sku} value={i.sku}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-200 block mb-1 font-semibold">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded bg-polar-900 border border-polar-border text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-200 block mb-1 font-semibold">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                  className="w-full p-2.5 rounded bg-polar-900 border border-polar-border text-white focus:outline-none"
                >
                  <option value="ROUTINE">Routine Vessel Resupply</option>
                  <option value="ELEVATED">Elevated Priority Flight</option>
                  <option value="CRITICAL_AIRLIFT">Critical Emergency Airlift</option>
                </select>
              </div>

              <div>
                <label className="text-slate-200 block mb-1 font-semibold">Operational Justification / Rationale</label>
                <textarea
                  required
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this consumable buffer is required..."
                  className="w-full p-2.5 rounded bg-polar-900 border border-polar-border text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-bold shadow-md"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
