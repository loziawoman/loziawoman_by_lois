import { NextResponse } from 'next/server';

// Replaces the Express /api/healthz route from the old api-server package.
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
