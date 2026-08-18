import { useMemo, useState, type ReactNode } from 'react';
import { PreviewContext, type PreviewTarget } from '../lib/previewContext';
import { useStore } from '../lib/storeContext';
import ProspectionPreviewDialog from './ProspectionPreviewDialog';
import DossierPreviewDialog from './DossierPreviewDialog';
import ProspectPreviewDialog from './ProspectPreviewDialog';
import type { Person } from '../types';

// Single global host for "origine" popups — rendered once around the whole
// app (see App.tsx) so a detail page's small origin-chain list can call
// usePreview() and open a peek dialog without re-implementing dialog state
// itself. See lib/previewContext.ts.
export function PreviewProvider({ children }: { children: ReactNode }) {
  const { prospections, dossiers, getDossierStatus } = useStore();
  const [target, setTarget] = useState<PreviewTarget | null>(null);

  const value = useMemo(
    () => ({
      previewProspection: (id: string) => setTarget({ type: 'prospection', id }),
      previewDossier: (id: string) => setTarget({ type: 'dossier', id }),
      previewProspect: (person: Person, prospectionId?: string) => setTarget({ type: 'prospect', person, prospectionId }),
    }),
    [],
  );

  const prospection = target?.type === 'prospection' ? prospections.find((p) => p.id === target.id) : undefined;
  const dossier = target?.type === 'dossier' ? dossiers.find((d) => d.id === target.id) : undefined;

  return (
    <PreviewContext.Provider value={value}>
      {children}
      {prospection && <ProspectionPreviewDialog prospection={prospection} onClose={() => setTarget(null)} />}
      {dossier && <DossierPreviewDialog dossier={dossier} status={getDossierStatus(dossier.id)} onClose={() => setTarget(null)} />}
      {target?.type === 'prospect' && (
        <ProspectPreviewDialog person={target.person} prospectionId={target.prospectionId} onClose={() => setTarget(null)} />
      )}
    </PreviewContext.Provider>
  );
}
