import DataGrid, { type ColonneGrille } from '../DataGrid';
import { Badge } from '../ui';
import { formatDateTime } from '../../lib/format';
import { LIBELLE_ETAT_FICHE, TON_ETAT_FICHE } from '../../lib/fichesVerrouillees';
import type { LigneFicheVerrouilleeDto } from '../../types/administration';

const COLONNES: ColonneGrille<LigneFicheVerrouilleeDto>[] = [
  { nom: 'entite', libelle: 'Entité', largeur: 8 },
  { nom: 'libelle', libelle: 'Libellé entité', largeur: 10 },
  { nom: 'dateVerrouillage', libelle: 'Date de verrouillage', largeur: 8, valeur: (r) => formatDateTime(r.dateVerrouillage), rendu: (r) => formatDateTime(r.dateVerrouillage) },
  { nom: 'utilisateur', libelle: 'Utilisateur', largeur: 8, valeur: (r) => r.utilisateur ?? '—', rendu: (r) => r.utilisateur ?? '—' },
  {
    nom: 'etat',
    libelle: 'Etat',
    largeur: 6,
    valeur: (r) => LIBELLE_ETAT_FICHE[r.etat],
    rendu: (r) => <Badge tone={TON_ETAT_FICHE[r.etat]}>{LIBELLE_ETAT_FICHE[r.etat]}</Badge>,
  },
];

export default function FichesVerrouilleesTable({
  rows,
  selection,
  onLignesVisibles,
}: Readonly<{
  rows: LigneFicheVerrouilleeDto[];
  selection: { id: string | undefined; onChoisir: (id: string | undefined) => void };
  onLignesVisibles: (ids: string[]) => void;
}>) {
  const ids = new Set(selection.id ? [selection.id] : []);
  return (
    <DataGrid
      rows={rows}
      colonnes={COLONNES}
      cleOrdre="admin-fiches-verrouillees"
      onLignesVisibles={onLignesVisibles}
      libelleLigne={(r) => r.libelle ?? r.entite ?? 'Fiche'}
      selection={{
        ids,
        onToggle: (id) => selection.onChoisir(selection.id === id ? undefined : id),
        onToggleAll: () => selection.onChoisir(undefined),
      }}
    />
  );
}
