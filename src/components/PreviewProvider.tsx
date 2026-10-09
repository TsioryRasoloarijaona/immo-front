import { Suspense, lazy, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PreviewContext, type FicheCible, type PreviewTarget } from '../lib/previewContext';
import ProspectionPreviewDialog from './ProspectionPreviewDialog';
import DossierPreviewDialog from './DossierPreviewDialog';
import ProspectPreviewDialog from './ProspectPreviewDialog';

/* Chargées à la demande : chacune tire toute une page de détail. */
const FicheProspectionDialog = lazy(() => import('./FicheProspectionDialog'));
const FicheDossierDialog = lazy(() => import('./FicheDossierDialog'));
const FicheProspectDialog = lazy(() => import('./FicheProspectDialog'));

type FicheEmpilee = FicheCible & { cle: number };

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PreviewTarget | null>(null);
  const [pile, setPile] = useState<FicheEmpilee[]>([]);
  const prochaineCle = useRef(0);

  /* Hôte au-dessus des routes : une navigation depuis une fiche (« Créer un
     dossier », un lien) ne démonte pas les dialogues. `key` et non `pathname` :
     naviguer vers la page déjà affichée doit fermer aussi. */
  const { key: cleLocation } = useLocation();
  const [cleOuverture, setCleOuverture] = useState(cleLocation);
  if (cleOuverture !== cleLocation) {
    setCleOuverture(cleLocation);
    setPile([]);
    setTarget(null);
  }

  const value = useMemo(() => {
    const empiler = (fiche: FicheCible) => {
      prochaineCle.current += 1;
      const cle = prochaineCle.current;
      setPile((p) => [...p, { ...fiche, cle }]);
    };
    return {
      previewProspection: (id: string) => setTarget({ type: 'prospection', id }),
      previewDossier: (id: string) => setTarget({ type: 'dossier', id }),
      previewProspect: (id: string) => setTarget({ type: 'prospect', id }),
      ouvrirFicheProspection: (id: string, pre: boolean) => empiler({ type: 'prospection', id, pre }),
      ouvrirFicheDossier: (id: string) => empiler({ type: 'dossier', id }),
      ouvrirFicheProspect: (id: string) => empiler({ type: 'prospect', id }),
    };
  }, []);

  const fermer = (cle: number) => setPile((p) => p.filter((f) => f.cle !== cle));

  return (
    <PreviewContext.Provider value={value}>
      {children}
      {target?.type === 'prospection' && <ProspectionPreviewDialog id={target.id} onClose={() => setTarget(null)} />}
      {target?.type === 'dossier' && <DossierPreviewDialog id={target.id} onClose={() => setTarget(null)} />}
      {target?.type === 'prospect' && <ProspectPreviewDialog id={target.id} onClose={() => setTarget(null)} />}
      {/* Montées dans l'ordre de la pile : la dernière ouverte est au-dessus. */}
      {pile.map((f) => (
        <Suspense key={f.cle} fallback={null}>
          {f.type === 'prospection' && (
            <FicheProspectionDialog id={f.id} pre={f.pre} onClose={() => fermer(f.cle)} />
          )}
          {f.type === 'dossier' && <FicheDossierDialog id={f.id} onClose={() => fermer(f.cle)} />}
          {f.type === 'prospect' && <FicheProspectDialog id={f.id} onClose={() => fermer(f.cle)} />}
        </Suspense>
      ))}
    </PreviewContext.Provider>
  );
}
