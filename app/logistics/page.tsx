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
  Filter,
  Shield,
  Plane
} from 'lucide-react';
import { RequisitionPriority } from '@/types';

export default function LogisticsPage() {
  const { 
    stationState, 
    currentUser, 
    createRequisition, 
    updateRequisitionStatus 
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

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase">
              Domain 4: Polar Supply Chain
            </span>
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Consumables Inventory Runway & Requisition Workflow
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Tracks fuel, food, medical, and spares against polar sea ice accessibility windows and icebreaker routing.
          </p>
        </div>

        {/* Action Button */}
        {permissions.canCreateRequisition && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-polar-accent hover:bg-sky-400 text-polar-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create Requisition
          </button>
        )}
      </div>

      {/* Inventory Consumables Ledger */}
      <div className="polar-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Critical Consumables Ledger & Reserve Runways
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Resupply Buffer Target: ≥ 14 Days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/5">
                <th className="py-2.5">ITEM DESCRIPTION</th>
                <th className="py-2.5">CATEGORY</th>
                <th className="py-2.5">STOCK ON HAND</th>
                <th className="py-2.5">DAILY BURN</th>
                <th className="py-2.5">DAYS REMAINING</th>
                <th className="py-2.5">SAFETY STOCK</th>
                <th className="py-2.5">NEXT ETA</th>
                <th className="py-2.5">RISK STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {logistics.inventory.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    {item.name}
                    <span className="block text-[10px] text-slate-500 font-normal">{item.sku}</span>
                  </td>
                  <td className="py-3 uppercase text-[10px] text-slate-400">{item.category}</td>
                  <td className="py-3 font-bold text-slate-100">
                    {item.quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3 text-slate-300">
                    {item.dailyConsumption} {item.unit}/day
                  </td>
                  <td className="py-3 font-bold">
                    <span className={item.daysRemaining < 14 ? 'text-rose-400' : item.daysRemaining < 21 ? 'text-amber-400' : 'text-emerald-400'}>
                      {item.daysRemaining.toFixed(1)} days
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {item.safetyStock.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3 text-sky-300">{item.nextResupplyEta}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      item.riskLevel === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.riskLevel === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requisitions Lifecycle Workflow */}
      <div className="polar-card p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Requisition Lifecycle Workflow
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              DRAFT → SUBMITTED → APPROVED → IN_TRANSIT → DELIVERED
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Current Operator Role: <strong className="text-sky-300">{currentUser.role}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {logistics.requisitions.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-polar-900/90 border border-polar-border space-y-3 font-mono text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{req.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    req.priority === 'CRITICAL_AIRLIFT' ? 'bg-rose-500 text-white' :
                    req.priority === 'ELEVATED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {req.priority.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2.5 py-0.5 rounded bg-polar-800 text-polar-ice font-bold border border-polar-ice/30">
                    {req.status}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                {req.rationale}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Req ID: {req.id}</span>
                  <span>Requester: {req.requesterName}</span>
                  <span>ETA: {req.eta}</span>
                  {req.approvedBy && <span className="text-emerald-400">Approved By: {req.approvedBy}</span>}
                </div>

                {/* Workflow Transitions (RBAC Protected) */}
                <div className="flex items-center gap-2">
                  {req.status === 'SUBMITTED' && permissions.canApproveRequisition && (
                    <button
                      onClick={() => updateRequisitionStatus(req.id, 'APPROVED')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      Approve Requisition
                    </button>
                  )}
                  {req.status === 'APPROVED' && permissions.canCreateRequisition && (
                    <button
                      onClick={() => updateRequisitionStatus(req.id, 'IN_TRANSIT')}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                    >
                      Dispatch / In Transit
                    </button>
                  )}
                  {req.status === 'IN_TRANSIT' && permissions.canCreateRequisition && (
                    <button
                      onClick={() => updateRequisitionStatus(req.id, 'DELIVERED')}
                      className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="polar-card-highlight p-6 rounded-2xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-mono font-bold text-white text-base">New Station Supply Requisition</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Requisition Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency ATF Winter Blend Top-up"
                  className="w-full p-2.5 rounded bg-polar-950 border border-polar-border text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Target Item</label>
                  <select
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 rounded bg-polar-950 border border-polar-border text-white focus:outline-none"
                  >
                    {logistics.inventory.map(i => (
                      <option key={i.sku} value={i.sku}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded bg-polar-950 border border-polar-border text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                  className="w-full p-2.5 rounded bg-polar-950 border border-polar-border text-white focus:outline-none"
                >
                  <option value="ROUTINE">Routine Vessel Resupply</option>
                  <option value="ELEVATED">Elevated Priority Flight</option>
                  <option value="CRITICAL_AIRLIFT">Critical Emergency Airlift</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Operational Justification / Rationale</label>
                <textarea
                  required
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this consumable buffer is required..."
                  className="w-full p-2.5 rounded bg-polar-950 border border-polar-border text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-polar-accent hover:bg-sky-400 text-polar-950 font-bold"
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
