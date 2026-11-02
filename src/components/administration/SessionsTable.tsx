import DataGrid, { type ColonneGrille } from '../DataGrid';
import { Badge } from '../ui';
import { formatDateTime } from '../../lib/format';
import { LIBELLE_ETAT_SESSION, TON_ETAT_SESSION } from '../../lib/sessions';
import type { LigneSessionDto } from '../../types/administration';

const COLONNES: ColonneGrille<LigneSessionDto>[] = [
  { nom: 'utilisateur', libelle: 'Utilisateur', largeur: 10 },
  { nom: 'dateOuverture', libelle: "Date d'ouverture", largeur: 8, valeur: (r) => formatDateTime(r.dateOuverture), rendu: (r) => formatDateTime(r.dateOuverture) },
  { nom: 'dateFermeture', libelle: 'Date de fermeture', largeur: 8, valeur: (r) => formatDateTime(r.dateFermeture), rendu: (r) => formatDateTime(r.dateFermeture) },
  {
    nom: 'etat',
    libelle: 'Etat',
    largeur: 6,
    valeur: (r) => LIBELLE_ETAT_SESSION[r.etat],
    rendu: (r) => <Badge tone={TON_ETAT_SESSION[r.etat]}>{LIBELLE_ETAT_SESSION[r.etat]}</Badge>,
  },
  { nom: 'adresseIp', libelle: 'Adresse IP', largeur: 8 },
  { nom: 'version', libelle: 'Version', largeur: 10 },
];

export default function SessionsTable({
  rows,
  selection,
}: Readonly<{ rows: LigneSessionDto[]; selection: { id: string | undefined; onChoisir: (id: string | undefined) => void } }>) {
  const ids = new Set(selection.id ? [selection.id] : []);
  return (
    <DataGrid
      rows={rows}
      colonnes={COLONNES}
      cleOrdre="admin-sessions"
      libelleLigne={(r) => r.utilisateur ?? 'Session'}
      selection={{
        ids,
        onToggle: (id) => selection.onChoisir(selection.id === id ? undefined : id),
        onToggleAll: () => selection.onChoisir(undefined),
      }}
    />
  );
}
