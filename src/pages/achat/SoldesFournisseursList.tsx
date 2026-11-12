import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import ChoixUnique from '../../components/ChoixUnique';
import DataGrid from '../../components/DataGrid';
import BoiteFiltre, { CLASSE_LIGNE, CadreBoiteFiltre } from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { cheminExportSoldesFournisseurs, getReferentielsAchat, getSoldesFournisseurs } from '../../lib/apiAchat';
import { formatCurrency, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection } from '../../lib/pucesFiltres';
import { COLONNES_SOLDES, ligneSolde } from '../../lib/soldesFournisseurs';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { FiltresSoldesFournisseurs } from '../../types/achat';

const IMPAYES_FOURNISSEUR = '/achat/documents?natures=INVOICE&natures=DOCUMENT_TO_PAY&nonSoldes=true';

export default function SoldesFournisseursList() {
  const navigate = useNavigate();
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [societe, setSociete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [nonSoldes, setNonSoldes] = useState(true);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('achat-soldes-fournisseurs'));
  const recherche = useDebouncedValue(search.trim());

  const filtres: FiltresSoldesFournisseurs = {
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    societeCodes: societe ? [societe] : undefined,
    search: recherche || undefined,
    nonSoldes: nonSoldes || undefined,
  };

  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const soldes = useApi(() => getSoldesFournisseurs(filtres), [JSON.stringify(filtres)], 'achat-soldes-fournisseurs');
  const exportListe = useExportListe(cheminExportSoldesFournisseurs(), { ...filtres }, 'soldes-fournisseurs');

  const lignes = useMemo(() => (soldes.data?.lignes ?? []).map(ligneSolde), [soldes.data]);
  const societes = useMemo(
    () => [...new Set(lignes.map((l) => l.societeCode).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, 'fr')).map((c) => ({ value: c, label: c })),
    [lignes],
  );
  const projets = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const total = soldes.data?.total;
  const decompte = soldes.data ? pluriel(lignes.length, 'fournisseur') : undefined;

  function ouvrir(id: string) {
    const fournisseurId = lignes.find((l) => l.id === id)?.fournisseurId;
    if (fournisseurId) void navigate(`${IMPAYES_FOURNISSEUR}&fournisseurId=${fournisseurId}`);
  }

  function reinitialiser() {
    setProjetIds([]);
    setSociete(null);
    setSearch('');
    setNonSoldes(true);
  }

  return (
    <PageListe titre="Soldes fournisseurs">
      <EnteteListe titre="Soldes fournisseurs" lignes={decompte} />
      <p className="shrink-0 px-3 pb-1 text-body text-muted-foreground">Solde sur vos projets, hors règlements non affectés à une pièce</p>
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={[...puceSelection('Projet', projets, projetIds), ...(societe ? [societe] : []), ...(nonSoldes ? ['Soldés masqués'] : []), ...(search ? [`« ${search} »`] : [])]}
        recherche={{ valeur: search, onChange: setSearch, placeholder: 'Nom du fournisseur…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Projet" mode="multiple" items={projets} valeur={projetIds} onChange={setProjetIds} />
        <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
          <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Société</span>
          <ChoixUnique items={societes} tous="Toutes" value={societe} placeholder="Toutes" largeur="w-full" onChange={setSociete} />
        </div>
        <CadreBoiteFiltre titre="Options">
          <label className={CLASSE_LIGNE}>
            <input type="checkbox" className="m-0 accent-(--brand)" checked={nonSoldes} onChange={(e) => setNonSoldes(e.target.checked)} />
            <span className="truncate">Masquer les soldés</span>
          </label>
        </CadreBoiteFiltre>
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {soldes.loading && !soldes.data && !soldes.error && <LoadingState />}
        {soldes.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={soldes.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void soldes.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!soldes.error && soldes.data && (
          <ResultsRegion loading={soldes.loading}>
            {total && lignes.length > 0 && (
              <div role="status" className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-xl border border-border bg-card px-3 py-1.5 text-label font-semibold tabular-nums">
                <span>Total : {pluriel(total.nombrePieces, 'pièce')}</span>
                <span>À payer {formatCurrency(total.montantAPayer)}</span>
                <span>Réglé {formatCurrency(total.montantRegle)}</span>
                <span className="text-destructive">Reste {formatCurrency(total.resteARegler)}</span>
                <span>Reste validé {formatCurrency(total.resteValideARegler)}</span>
                <span>À déduire {formatCurrency(total.montantADeduire)}</span>
              </div>
            )}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState title="Aucun fournisseur dans votre périmètre" />
              ) : (
                <DataGrid
                  cleOrdre="achat-soldes-fournisseurs"
                  rows={lignes}
                  colonnes={COLONNES_SOLDES}
                  onOuvrir={ouvrir}
                  libelleLigne={(l) => `Voir les impayés de ${l.fournisseurNom ?? 'ce fournisseur'}`}
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
          { id: 'rafraichir', onClick: () => void soldes.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
