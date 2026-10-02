import { NextResponse } from 'next/server';
import { Requisition } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newRequisition: Requisition = {
      id: `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      stationId: body.stationId || 'bharati',
      title: body.title || 'Emergency Consumable Requisition',
      requesterId: body.requesterId || 'user-ops-01',
      requesterName: body.requesterName || 'NCPOR Duty Officer',
      requesterRole: body.requesterRole || 'NCPOR Operations',
      priority: body.priority || 'ROUTINE',
      status: 'SUBMITTED',
      items: body.items || [],
      rationale: body.rationale || 'Required to maintain polar safety stock buffer.',
      eta: body.eta || '2026-11-10',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      status: 'success',
      message: 'Requisition submitted for approval.',
      requisition: newRequisition,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create requisition', details: error?.message }, { status: 400 });
  }
}
