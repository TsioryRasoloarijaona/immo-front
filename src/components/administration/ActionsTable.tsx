import DataGrid, { type ColonneGrille } from '../DataGrid';
import { formatDateTime } from '../../lib/format';
import type { LigneActionDto } from '../../types/administration';

const TIRET = '—';

const COLONNES: ColonneGrille<LigneActionDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 6, valeur: (r) => r.code ?? TIRET, rendu: (r) => r.code ?? TIRET },
  { nom: 'action', libelle: 'Action', largeur: 8 },
  { nom: 'description', libelle: 'Description', largeur: 14, valeur: (r) => r.description ?? TIRET, rendu: (r) => r.description ?? TIRET },
  { nom: 'creePar', libelle: 'Créé par', largeur: 7, valeur: (r) => r.creePar ?? TIRET, rendu: (r) => r.creePar ?? TIRET },
  { nom: 'creeLe', libelle: 'Créé le', largeur: 8, valeur: (r) => (r.creeLe ? formatDateTime(r.creeLe) : TIRET), rendu: (r) => (r.creeLe ? formatDateTime(r.creeLe) : TIRET) },
  { nom: 'modifiePar', libelle: 'Modifié par', largeur: 7, valeur: (r) => r.modifiePar ?? TIRET, rendu: (r) => r.modifiePar ?? TIRET },
  { nom: 'modifieLe', libelle: 'Modifié le', largeur: 8, valeur: (r) => (r.modifieLe ? formatDateTime(r.modifieLe) : TIRET), rendu: (r) => (r.modifieLe ? formatDateTime(r.modifieLe) : TIRET) },
];

export default function ActionsTable({ rows }: Readonly<{ rows: LigneActionDto[] }>) {
  return <DataGrid rows={rows} colonnes={COLONNES} cleOrdre="admin-actions" libelleLigne={(r) => r.action} />;
}
