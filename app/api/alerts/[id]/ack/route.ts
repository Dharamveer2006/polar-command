import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id;
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // optional body
    }

    return NextResponse.json({
      status: 'success',
      message: `Alert ${alertId} acknowledged successfully.`,
      alertId,
      acknowledged: true,
      acknowledgedBy: (body as any)?.acknowledgedBy || 'NCPOR Operations Officer',
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to acknowledge alert', details: error?.message }, { status: 400 });
  }
}

export const POST = PATCH;

