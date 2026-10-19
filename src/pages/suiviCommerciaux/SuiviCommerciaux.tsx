import { useRef, useState } from 'react';
import { Target } from 'lucide-react';
import PageShell from '../../components/PageShell';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { InputGroup, InputGroupInput } from '../../components/ui/input-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import SyntheseJour from '../../components/suiviCommerciaux/SyntheseJour';
import ListeInteractions from '../../components/suiviCommerciaux/ListeInteractions';
import ReglageObjectif from '../../components/suiviCommerciaux/ReglageObjectif';
import GrillesMensuelles from '../../components/suiviCommerciaux/GrillesMensuelles';
import { getSyntheseSuiviCommerciaux, listCommerciauxEquipe } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatNumber } from '../../lib/format';
import { estAdministrateur, estChefOuExempte } from '../../lib/roles';
import {
  choixCommerciauxSuivi,
  filtresDepuisChoix,
  filtresListeDefaut,
  periodeAppliquee,
  periodeDuJour,
  useChoixCumules,
  type ChoixSyntheseSuivi,
  type FiltresListeSuivi,
  type Periode,
} from '../../lib/suiviCommerciaux';
import { useApi } from '../../lib/useApi';

export default function SuiviCommerciaux() {
  const { user } = useAuth();
  const chef = estChefOuExempte(user);
  const [onglet, setOnglet] = useState('jour');
  const listeRef = useRef<HTMLDivElement>(null);

  const [periode, setPeriode] = useState<Periode>(periodeDuJour);
  const [commercialIds, setCommercialIds] = useState<string[]>([]);
  const synthese = useApi(
    () => getSyntheseSuiviCommerciaux({ du: periode.du || undefined, au: periode.au || undefined, commercialIds }),
    [periode.du, periode.au, commercialIds.join(',')],
    'suivi-commerciaux-synthese',
  );
  // Un commercial ne voit que lui : pas de choix à lui proposer.
  const equipe = useApi(() => (chef ? listCommerciauxEquipe(periodeDuJour()) : Promise.resolve([])), [chef], 'suivi-commerciaux-equipe');
  const commerciaux = useChoixCumules(chef ? choixCommerciauxSuivi(equipe.data, synthese.data?.totaux.parCommercial) : []);
  const appliquee = periodeAppliquee(periode);

  const [filtres, setFiltres] = useState<FiltresListeSuivi>(() => filtresListeDefaut(periodeDuJour()));
  const [page, setPage] = useState(0);
  function changer<K extends keyof FiltresListeSuivi>(c: K, valeur: FiltresListeSuivi[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [c]: valeur }));
  }
  const reinitialiser = () => {
    setPage(0);
    setFiltres(filtresListeDefaut(appliquee));
  };
  function choisir(choix: ChoixSyntheseSuivi) {
    setPage(0);
    setFiltres(filtresDepuisChoix(choix, appliquee));
    listeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <PageShell
      title="Suivi des commerciaux"
      crumbs={[{ label: 'Ventes' }, { label: 'Suivi des commerciaux' }]}
      icon={<Target />}
      accent="var(--sec-prospection)"
      accentBg="var(--sec-prospection-bg)"
    >
      <Tabs value={onglet} onValueChange={(v) => setOnglet(String(v))}>
        <TabsList>
          <TabsTrigger value="jour">Jour</TabsTrigger>
          <TabsTrigger value="mois">Mois / année</TabsTrigger>
        </TabsList>
        <TabsContent value="jour" className="flex flex-col gap-4 pt-3">
          <section aria-label="Synthèse par commercial et par jour" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <InputGroup className="w-32.5">
                <InputGroupInput type="date" aria-label="Du" value={periode.du} onChange={(e) => setPeriode((p) => ({ ...p, du: e.target.value }))} />
              </InputGroup>
              <InputGroup className="w-32.5">
                <InputGroupInput type="date" aria-label="Au" value={periode.au} onChange={(e) => setPeriode((p) => ({ ...p, au: e.target.value }))} />
              </InputGroup>
              {commerciaux.length > 0 && (
                <MultiSelectDropdown label="Commercial" placeholder="Tous" value={commercialIds} onChange={setCommercialIds} items={commerciaux} />
              )}
              <span className="ml-auto text-body text-muted-foreground">
                {synthese.data && `Objectif : ${formatNumber(synthese.data.objectif)} personnes jointes par jour`}
              </span>
              {estAdministrateur(user) && <ReglageObjectif onModifie={() => void synthese.refetch()} />}
            </div>
            {synthese.loading && !synthese.data && <LoadingState />}
            {synthese.error && <ErrorState message={synthese.error} />}
            {!synthese.error && synthese.data && (
              <ResultsRegion loading={synthese.loading}>
                <div className="max-h-112 overflow-auto rounded-xl border border-border bg-card">
                  {synthese.data.lignes.length === 0 ? (
                    <EmptyState title="Aucune activité sur cette période" />
                  ) : (
                    <SyntheseJour
                      synthese={synthese.data}
                      plusieursJours={appliquee.du !== appliquee.au}
                      commercialIds={commercialIds}
                      onChoisir={choisir}
                    />
                  )}
                </div>
              </ResultsRegion>
            )}
          </section>
          <div ref={listeRef} className="scroll-mt-4">
            <ListeInteractions
              filtres={filtres}
              page={page}
              setPage={setPage}
              changer={changer}
              reinitialiser={reinitialiser}
              actifs={JSON.stringify(filtres) !== JSON.stringify(filtresListeDefaut(appliquee))}
              commerciaux={commerciaux}
            />
          </div>
        </TabsContent>
        <TabsContent value="mois" className="pt-3">
          <GrillesMensuelles commerciaux={commerciaux} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
