'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CmsWorkspace } from '@/lib/cms';

const CmsContext = createContext<CmsWorkspace | null>(null);

/**
 * Makes the server's copy of the shop content (products, homepage, settings) available to client components.
 * The root layout re-reads it on every request, so `router.refresh()` after an admin save updates the storefront.
 */
export function CmsProvider({ workspace, children }: { workspace: CmsWorkspace; children: ReactNode }) {
  return <CmsContext.Provider value={workspace}>{children}</CmsContext.Provider>;
}

export function useCmsWorkspace(): CmsWorkspace {
  const workspace = useContext(CmsContext);
  if (!workspace) throw new Error('useCmsWorkspace must be used inside <CmsProvider>');
  return workspace;
}
