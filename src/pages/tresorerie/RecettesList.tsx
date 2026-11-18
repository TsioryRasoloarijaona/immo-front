import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import EtatReglement from '../../components/tresorerie/EtatReglement';
import PageTresorerie from '../../components/tresorerie/PageTresorerie';
import { getRecettes } from '../../lib/apiTresorerie';
import { accesRefuse, libelleStatutTresorerie, useFiltresTresorerie } from '../../lib/tresorerie';
import { useApi } from '../../lib/useApi';
import type { ColonneRecetteDto, ModuleTresorerie, VueRecette } from '../../types/tresorerie';

type LigneRecette = Record<string, unknown> & { id: string };

const TITRES: Record<VueRecette, string> = {
  proforma: 'Proforma',
  factures: 'Factures de recettes',
  avoirs: 'Avoirs de recettes',
  encaissements: 'Encaissements',
};

const texte = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** Les colonnes viennent du serveur : `statut` et `enRetard`, s'ils existent, reprennent le rendu des règlements. */
function colonneGrille(c: ColonneRecetteDto): ColonneGrille<LigneRecette> {
  const base: ColonneGrille<LigneRecette> = { nom: c.cle, libelle: c.libelle, type: c.type === 'TEXTE' ? undefined : c.type, valeur: (r) => r[c.cle] };
  if (c.cle !== 'statut') return base;
  return {
    ...base,
    valeur: (r) => libelleStatutTresorerie(texte(r.statut), texte(r.statutLibelle)),
    rendu: (r) => <EtatReglement statut={texte(r.statut)} libelle={texte(r.statutLibelle)} enRetard={r.enRetard === true} nonAffecte={r.nonAffecte === true} />,
  };
}

const classeLigne = (r: LigneRecette) => (r.statut === 'CANCELED' ? 'text-muted-foreground line-through' : undefined);

export default function RecettesList({ vue, module }: Readonly<{ vue: VueRecette; module: ModuleTresorerie }>) {
  const filtres = useFiltresTresorerie(module);
  const liste = useApi(() => accesRefuse(getRecettes(vue, filtres.filtres)), [vue, JSON.stringify(filtres.filtres)]);
  const lignes: LigneRecette[] = (liste.data?.lignes ?? []).map((l) => ({ ...l, id: String(l.id) }));
  const colonnes = (liste.data?.colonnes ?? []).filter((c) => c.visible).map(colonneGrille);
  const cle = `tresorerie-recettes-${vue}-${module}`;

  return (
    <PageTresorerie
      cle={cle}
      titre={TITRES[vue]}
      unite="ligne"
      liste={liste}
      total={liste.data?.total}
      vide={lignes.length === 0}
      filtres={filtres}
      totaux={[{ libelle: 'Total', valeur: liste.data?.totaux.montant ?? 0 }]}
      grille={<DataGrid rows={lignes} colonnes={colonnes} cleOrdre={cle} classeLigne={classeLigne} bandeauRegroupement={false} />}
    />
  );
}
