import DataGrid, { type ColonneGrille } from '../DataGrid';
import { Badge } from '../ui';
import { libelleOuiNon } from '../../lib/emailHistorique';
import { formatDateTime } from '../../lib/format';
import type { LigneEmailDto } from '../../types/administration';

export function BadgeEnvoye({ envoye }: Readonly<{ envoye: boolean | null }>) {
  if (envoye === null) return <span className="text-muted-foreground">—</span>;
  return <Badge tone={envoye ? 'success' : 'warning'}>{envoye ? 'Envoyé' : 'Échec'}</Badge>;
}

function libelleEnvoye(envoye: boolean | null): string {
  if (envoye === null) return '—';
  return envoye ? 'Envoyé' : 'Échec';
}

const COLONNES: ColonneGrille<LigneEmailDto>[] = [
  { nom: 'date', libelle: 'Date', largeur: 7, valeur: (r) => formatDateTime(r.date), rendu: (r) => formatDateTime(r.date) },
  { nom: 'utilisateur', libelle: 'Utilisateur', largeur: 10 },
  { nom: 'expediteur', libelle: 'Expéditeur', largeur: 12 },
  { nom: 'destinataires', libelle: 'Destinataires', largeur: 14 },
  { nom: 'objet', libelle: 'Objet', largeur: 18 },
  { nom: 'automatique', libelle: 'Automatique', largeur: 6, valeur: (r) => libelleOuiNon(r.automatique), rendu: (r) => libelleOuiNon(r.automatique) },
  { nom: 'envoye', libelle: 'Envoyé', largeur: 6, valeur: (r) => libelleEnvoye(r.envoye), rendu: (r) => <BadgeEnvoye envoye={r.envoye} /> },
];

export default function EmailTable({ rows, onOuvrir }: Readonly<{ rows: LigneEmailDto[]; onOuvrir: (id: string) => void }>) {
  return <DataGrid rows={rows} colonnes={COLONNES} cleOrdre="admin-emails" onOuvrir={onOuvrir} libelleLigne={(r) => r.objet ?? 'E-mail'} />;
}
