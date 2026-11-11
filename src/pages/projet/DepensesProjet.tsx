import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import { EmptyState, ErrorState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getDepensesProjet } from '../../lib/apiDepensesProjet';
import { formatCurrency, formatNumber, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection } from '../../lib/pucesFiltres';
import { useApi } from '../../lib/useApi';
import type { DepensesLotDto, DepensesProjetDto } from '../../types/depensesProjet';
import { LienCellule, SqueletteGrille } from './commun';
import { useReferentielsProjet } from './hooks';

const URL_FACTURES = '/projet/depenses/factures';

/** Colonnes de chiffres communes aux lignes projet et lot ; `lienFactures` est nul sans filtre possible (« Hors lot »). */
interface Chiffres {
  id: string;
  lienFactures: string | null;
  nbFactures: number;
  montantTTC: number;
  montantAPayer: number;
  montantRegle: number;
  resteARegler: number;
  nbNonSoldees: number;
  nbTropReglees: number;
}

type LigneProjet = DepensesProjetDto & Chiffres;
type LigneLot = DepensesLotDto & Chiffres;

const COLONNES_CHIFFRES: ColonneGrille<Chiffres>[] = [
  {
    nom: 'nbFactures',
    libelle: 'Factures',
    type: 'NOMBRE',
    largeur: 5,
    rendu: (r) => (r.lienFactures ? <LienCellule to={r.lienFactures}>{formatNumber(r.nbFactures)}</LienCellule> : formatNumber(r.nbFactures)),
  },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'montantAPayer', libelle: 'À payer', type: 'MONTANT', largeur: 9 },
  { nom: 'montantRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 9 },
  {
    nom: 'resteARegler',
    libelle: 'Reste',
    type: 'MONTANT',
    largeur: 9,
    rendu: (r) => <span className={r.resteARegler > 0 ? 'font-semibold text-destructive' : undefined}>{formatCurrency(r.resteARegler)}</span>,
  },
  { nom: 'nbNonSoldees', libelle: 'Non soldées', type: 'NOMBRE', largeur: 5 },
  { nom: 'nbTropReglees', libelle: 'Trop réglées', type: 'NOMBRE', largeur: 5 },
];

const COLONNES_LOTS: ColonneGrille<LigneLot>[] = [
  {
    nom: 'lotCode',
    libelle: 'Lot',
    largeur: 10,
    valeur: (l) => l.lotCode ?? 'Hors lot',
    rendu: (l) => (l.lotId ? <LienCellule to={`/projet/lots/${l.lotId}`}>{l.lotCode ?? '—'}</LienCellule> : 'Hors lot'),
  },
  ...COLONNES_CHIFFRES,
];

const COLONNES_PROJETS: ColonneGrille<LigneProjet>[] = [
  { nom: 'projetCode', libelle: 'Projet', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'projetDescription', libelle: 'Description', largeur: 14 },
  ...COLONNES_CHIFFRES,
];

function lienFactures(projetId: string, lotId?: string): string {
  const q = new URLSearchParams({ projetIds: projetId });
  if (lotId) q.set('lotId', lotId);
  return `${URL_FACTURES}?${q.toString()}`;
}

function lignesLots(p: DepensesProjetDto): LigneLot[] {
  return p.lots.map((l) => ({
    ...l,
    id: l.lotId ?? `hors-lot-${p.projetId}`,
    lienFactures: l.lotId ? lienFactures(p.projetId, l.lotId) : null,
  }));
}

export default function DepensesProjet() {
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-depenses'));
  const referentiels = useReferentielsProjet();
  const projetItems = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));

  const liste = useApi(() => getDepensesProjet(projetIds.length > 0 ? projetIds : undefined), [projetIds.join(',')], 'projet-depenses');
  const lignes = useMemo<LigneProjet[]>(
    () => (liste.data ?? []).map((p) => ({ ...p, id: p.projetId, lienFactures: lienFactures(p.projetId) })),
    [liste.data],
  );
  const decompte = liste.data ? pluriel(lignes.length, 'projet') : undefined;

  return (
    <PageListe titre="Dépenses des projets">
      <EnteteListe titre="Dépenses des projets" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puceSelection('Projet', projetItems, projetIds)}
        onReinitialiser={() => setProjetIds([])}
      >
        <BoiteFiltre titre="Projets" mode="multiple" items={projetItems} valeur={projetIds} onChange={setProjetIds} />
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <SqueletteGrille />}
        {liste.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={liste.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!liste.error && liste.data && (
          <ResultsRegion loading={liste.loading}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState title="Aucune dépense dans votre périmètre" />
              ) : (
                <DataGrid
                  cleOrdre="projet-depenses"
                  rows={lignes}
                  colonnes={COLONNES_PROJETS}
                  libelleLigne={(p) => `Projet ${p.projetCode ?? p.id}`}
                  bandeauRegroupement={false}
                  rendreDetail={(p) => (
                    <DataGrid rows={lignesLots(p)} colonnes={COLONNES_LOTS} cleOrdre="projet-depenses-lots" bandeauRegroupement={false} />
                  )}
                />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante cle="projet-depenses" ligneSelectionnee={false} actions={[{ id: 'rafraichir', onClick: () => void liste.refetch() }]} />
    </PageListe>
  );
}
