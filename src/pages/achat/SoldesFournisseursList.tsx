import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ChoixUnique from '../../components/ChoixUnique';
import DataGrid from '../../components/DataGrid';
import DialogueLignesPosition from '../../components/achat/DialogueLignesPosition';
import BoiteFiltre, { CLASSE_LIGNE, CadreBoiteFiltre } from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { cheminExportPositionsFournisseurs, getPositionsFournisseurs, getReferentielsAchat } from '../../lib/apiAchat';
import { formatCurrency, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { plagePeriode } from '../../lib/periodes';
import { COLONNES_POSITIONS, lignePosition } from '../../lib/positionsFournisseurs';
import { puceSelection } from '../../lib/pucesFiltres';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { FiltresPositionsFournisseurs } from '../../types/achat';

export default function SoldesFournisseursList() {
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [societe, setSociete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [masquerResteZero, setMasquerResteZero] = useState(true);
  const [periode, setPeriode] = useState(() => plagePeriode('annee'));
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('achat-soldes-fournisseurs'));
  const recherche = useDebouncedValue(search.trim());

  const filtres: FiltresPositionsFournisseurs = {
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    societeIds: societe ? [societe] : undefined,
    du: periode.debut || undefined,
    au: periode.fin || undefined,
    search: recherche || undefined,
    masquerResteZero,
  };

  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const positions = useApi(() => getPositionsFournisseurs(filtres), [JSON.stringify(filtres)], 'achat-soldes-fournisseurs');
  const exportListe = useExportListe(cheminExportPositionsFournisseurs(), { ...filtres }, 'soldes-fournisseurs');

  const lignes = useMemo(() => (positions.data?.lignes ?? []).map(lignePosition), [positions.data]);
  const societes = (referentiels.data?.societes ?? []).map((s) => ({ value: s.id, label: s.code ?? s.description ?? '—' }));
  const projets = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const total = positions.data?.total;
  const decompte = positions.data ? pluriel(lignes.length, 'fournisseur') : undefined;
  const position = lignes.find((l) => l.id === ouverte);

  function reinitialiser() {
    setProjetIds([]);
    setSociete(null);
    setSearch('');
    setMasquerResteZero(true);
    setPeriode(plagePeriode('annee'));
  }

  return (
    <PageListe titre="Soldes fournisseurs">
      <EnteteListe titre="Soldes fournisseurs" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={[...puceSelection('Projet', projets, projetIds), ...(societe ? [societes.find((s) => s.value === societe)?.label ?? societe] : []), ...(masquerResteZero ? ['Reste à zéro masqué'] : []), ...(search ? [`« ${search} »`] : [])]}
        periode={{ debut: periode.debut, fin: periode.fin, onChange: (debut, fin) => setPeriode({ debut, fin }) }}
        recherche={{ valeur: search, onChange: setSearch, placeholder: 'Nom du fournisseur…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Projets" mode="multiple" items={projets} valeur={projetIds} onChange={setProjetIds} />
        <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
          <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Société</span>
          <ChoixUnique items={societes} tous="Toutes" value={societe} placeholder="Toutes" largeur="w-full" onChange={setSociete} />
        </div>
        <CadreBoiteFiltre titre="Options">
          <label className={CLASSE_LIGNE}>
            <input type="checkbox" className="m-0 accent-(--brand)" checked={masquerResteZero} onChange={(e) => setMasquerResteZero(e.target.checked)} />
            <span className="truncate">Masquer les fournisseurs avec reste à zéro</span>
          </label>
        </CadreBoiteFiltre>
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2 pb-12">
        {positions.loading && !positions.data && !positions.error && <LoadingState />}
        {positions.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={positions.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void positions.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!positions.error && positions.data && (
          <ResultsRegion loading={positions.loading}>
            {total && lignes.length > 0 && (
              <div role="status" className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-xl border border-border bg-card px-3 py-1.5 text-label font-semibold whitespace-nowrap tabular-nums">
                <span>Solde début {formatCurrency(total.soldeDebut)}</span>
                <span>Net à payer {formatCurrency(total.netAPayer)}</span>
                <span>Réglé {formatCurrency(total.regle)}</span>
                <span className="text-destructive">Solde fin {formatCurrency(total.soldeFin)}</span>
              </div>
            )}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState title="Aucun fournisseur dans votre périmètre" />
              ) : (
                <DataGrid
                  cleOrdre="achat-soldes-fournisseurs"
                  rows={lignes}
                  colonnes={COLONNES_POSITIONS}
                  onOuvrir={setOuverte}
                  libelleLigne={(l) => `Voir la ligne de solde de ${l.fournisseurNom ?? 'ce fournisseur'}`}
                  bandeauRegroupement={false}
                />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="achat-soldes-fournisseurs"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void positions.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {position && <DialogueLignesPosition position={position} filtres={filtres} onClose={() => setOuverte(null)} />}
    </PageListe>
  );
}
