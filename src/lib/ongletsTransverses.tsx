import type { OngletFiche } from '../components/FicheShell';
import OngletAudit from '../components/patrimoine/OngletAudit';
import PanneauActions from '../components/patrimoine/PanneauActions';
import PanneauNotes from '../components/patrimoine/PanneauNotes';
import type { Porteur } from '../types/audit';

/**
 * Onglets transverses d'un objet du patrimoine : notes, actions (article seul : aucune colonne pour programme et
 * tranche) et audit. Point d'extension : tout nouvel onglet commun s'ajoute ici.
 */
export function ongletsTransverses(porteur: Porteur, id: string): OngletFiche[] {
  return [
    { id: 'notes', libelle: 'Notes', contenu: <PanneauNotes porteur={porteur} id={id} /> },
    ...(porteur === 'article' ? [{ id: 'actions', libelle: 'Actions', contenu: <PanneauActions articleId={id} /> }] : []),
    { id: 'audit', libelle: 'Audit', contenu: <OngletAudit id={id} /> },
  ];
}
