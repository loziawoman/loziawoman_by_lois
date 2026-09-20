import { NextResponse } from 'next/server';
import { parseWorkspaceInput } from '@/lib/cms';
import { isAdmin, isSameOrigin } from '@/server/admin-auth';
import { writeWorkspace } from '@/server/cms-store';

const MAX_BODY_CHARS = 2_000_000;

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  if (!(await isAdmin())) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  const body = await request.text();
  if (body.length > MAX_BODY_CHARS) return NextResponse.json({ error: 'That is too much content to save at once.' }, { status: 413 });

  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'The content could not be read.' }, { status: 400 });
  }

  const parsed = parseWorkspaceInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  try {
    await writeWorkspace(parsed.data);
  } catch (error) {
    console.error('[cms] Could not save the workspace', error);
    return NextResponse.json({ error: 'The server could not save your changes.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
