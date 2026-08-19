import { useMemo, useState, type ReactNode } from 'react';
import { PreviewContext, type PreviewTarget } from '../lib/previewContext';
import ProspectionPreviewDialog from './ProspectionPreviewDialog';
import DossierPreviewDialog from './DossierPreviewDialog';
import ProspectPreviewDialog from './ProspectPreviewDialog';

// Single global host for "origine" popups — rendered once around the whole
// app (see App.tsx) so a detail page's small origin-chain list can call
// usePreview() and open a peek dialog without re-implementing dialog state
// itself. Each dialog fetches its own record by id — see lib/previewContext.ts.
export function PreviewProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PreviewTarget | null>(null);

  const value = useMemo(
    () => ({
      previewProspection: (id: string) => setTarget({ type: 'prospection', id }),
      previewDossier: (id: string) => setTarget({ type: 'dossier', id }),
      previewProspect: (id: string) => setTarget({ type: 'prospect', id }),
    }),
    [],
  );

  return (
    <PreviewContext.Provider value={value}>
      {children}
      {target?.type === 'prospection' && <ProspectionPreviewDialog id={target.id} onClose={() => setTarget(null)} />}
      {target?.type === 'dossier' && <DossierPreviewDialog id={target.id} onClose={() => setTarget(null)} />}
      {target?.type === 'prospect' && <ProspectPreviewDialog id={target.id} onClose={() => setTarget(null)} />}
    </PreviewContext.Provider>
  );
}
