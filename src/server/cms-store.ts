import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { makeDefaultWorkspace, normaliseWorkspace, type StoredWorkspace } from '@/lib/cms';

/**
 * File-backed storage for the shop content (products, homepage, policies, settings).
 *
 * This needs a filesystem that survives restarts (your own server, a VPS, Docker with a volume).
 * On serverless hosts such as Vercel the filesystem is read-only or throwaway, so replace
 * `load` and `writeWorkspace` below with a database or KV store; nothing else has to change.
 */
const filePath = () =>
  process.env.CMS_DATA_FILE ? path.resolve(process.env.CMS_DATA_FILE) : path.join(process.cwd(), '.data', 'cms.json');

async function load(): Promise<StoredWorkspace> {
  try {
    const raw = await fs.readFile(filePath(), 'utf8');
    return normaliseWorkspace(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[cms] Could not read the saved workspace, showing the built-in catalogue instead.', error);
    }
    return makeDefaultWorkspace();
  }
}

/** Read once per request, however many layouts and pages ask for it. */
export const readWorkspace = cache(load);

export async function writeWorkspace(workspace: StoredWorkspace): Promise<void> {
  const file = filePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  // Write to a temp file and rename so a crash mid-write can never leave half a file behind.
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(workspace, null, 2), 'utf8');
  await fs.rename(temp, file);
}
