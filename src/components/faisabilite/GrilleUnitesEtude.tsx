import GrilleOnglet from '../patrimoine/GrilleOnglet';
import { getEtudeFaisabilite, remplacerUnitesEtude } from '../../lib/apiFaisabilite';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { useAuth } from '../../lib/auth';
import { choixAvec } from '../../lib/faisabilite';
import { texteBrut } from '../../lib/format';
import type { ColonneOnglet, SourceLignes } from '../../lib/ongletsTranche';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import type { ReferentielItemDto } from '../../types';
import type { EtudeFaisabiliteDto, LigneUniteEtudeDto } from '../../types/faisabilite';

/** Unités de base de l'étude (quantités par unité) : PUT de la liste complète, un retrait efface les ventilations de l'unité. */
export default function GrilleUnitesEtude({ fiche, onEnregistre }: Readonly<{ fiche: EtudeFaisabiliteDto; onEnregistre: () => void }>) {
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const referentiel = useApi(() => (admin ? listLignesReferentiel('unites-de-base') : Promise.resolve([])), [admin]);
  const liste: ReferentielItemDto[] = (referentiel.data ?? []).flatMap((l) => (l.id
    ? [{ id: l.id, code: texteBrut(l.code), description: texteBrut(l.description) }]
    : []));
  const colonnes: ColonneOnglet<LigneUniteEtudeDto>[] = [
    { nom: 'sorting', libelle: 'Ordre', type: 'entier' },
    {
      nom: 'uniteBaseId', libelle: 'Unité de base', type: 'choix',
      choix: (l) => choixAvec(liste, l.uniteBaseId, { code: l.uniteCode ?? undefined, description: l.uniteLibelle ?? undefined }),
    },
    { nom: 'quantite', libelle: 'Quantité', type: 'nombre' },
  ];
  const source: SourceLignes<LigneUniteEtudeDto> = {
    cle: fiche.id,
    charger: () => getEtudeFaisabilite(fiche.id).then((f) => ({ lignes: f.unites })),
    enregistrer: (lignes) => remplacerUnitesEtude(fiche.id, lignes),
  };
  return (
    <GrilleOnglet source={source} colonnes={colonnes} onEnregistre={onEnregistre}
      nouvelle={{ sorting: fiche.unites.length + 1, uniteBaseId: '', quantite: null }} />
  );
}
