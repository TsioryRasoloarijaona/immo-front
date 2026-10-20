import type { OngletFiche } from '../components/FicheShell';
import DossiersArticle from '../components/patrimoine/DossiersArticle';
import HistoriqueArticle from '../components/patrimoine/HistoriqueArticle';
import OngletAudit from '../components/patrimoine/OngletAudit';
import PanneauActions from '../components/patrimoine/PanneauActions';
import PanneauNotes from '../components/patrimoine/PanneauNotes';
import ProspectionsArticle from '../components/patrimoine/ProspectionsArticle';
import type { Porteur } from '../types/audit';

/**
 * Onglets transverses d'un objet du patrimoine : notes, audit et, pour l'article seul (aucune colonne pour
 * programme et tranche), actions, prospections, dossiers et historique. Point d'extension : tout nouvel onglet commun s'ajoute ici.
 */
export function ongletsTransverses(porteur: Porteur, id: string): OngletFiche[] {
  const article: OngletFiche[] = [
    { id: 'actions', libelle: 'Actions', contenu: <PanneauActions articleId={id} /> },
    { id: 'prospections', libelle: 'Prospections', contenu: <ProspectionsArticle articleId={id} /> },
    { id: 'dossiers', libelle: 'Dossiers', contenu: <DossiersArticle articleId={id} /> },
    { id: 'historique', libelle: 'Historique', contenu: <HistoriqueArticle articleId={id} /> },
  ];
  return [
    { id: 'notes', libelle: 'Notes', contenu: <PanneauNotes porteur={porteur} id={id} /> },
    ...(porteur === 'article' ? article : []),
    { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={id} /> },
  ];
}
