import { useCallback, useRef, useState } from 'react';
import { ChartNoAxesColumn, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import ChoixUnique from '../../components/ChoixUnique';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import BoutonExporter from '../../components/BoutonExporter';
import EtatColonnes from '../../components/EtatColonnes';
import SyntheseEtatVentes from '../../components/etatVentes/SyntheseEtatVentes';
import FiltresEtatVentesPanneau from '../../components/etatVentes/FiltresEtatVentesPanneau';
import EtatVentesTable, { type LigneEtatVentes } from '../../components/etatVentes/EtatVentesTable';
import {
  DEFAULT_PAGE_SIZE,
  getSyntheseEtatVentes,
  listEtatVentes,
  listEtatVentesGroupes,
  totauxColonnes,
} from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_ETAT_VENTES } from '../../lib/dispositions';
import {
  FILTRES_ETAT_VENTES_DEFAUT,
  catalogueTotaux,
  filtresDepuisChoix,
  filtresEtatVentesActifs,
  libelleStatutVente,
  paramsEtatVentes,
  type ChoixSynthese,
  type FiltresListeEtatVentes,
  type FiltresSyntheseEtatVentes,
} from '../../lib/etatVentes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { usePreview } from '../../lib/previewContext';
import { pluriel } from '../../lib/format';
import {
  referentielItems,
  useCategoriesBien,
  useColonnesEtatVentes,
  useProjetsReferentiel,
  useTranchesFiltre,
  useTypesBienReferentiel,
} from '../../lib/referentiels';
import type { LigneEtatVentesDto, PageDto } from '../../types';

const SYNTHESE_DEFAUT: FiltresSyntheseEtatVentes = { trancheId: [], projetId: null, categorieId: [] };
const VIDE = 'Aucun article pour ces filtres';

function avecId(p: PageDto<LigneEtatVentesDto>): PageDto<LigneEtatVentes> {
  return { ...p, content: p.content.map((l) => ({ ...l, id: l.articleId })) };
}

export default function EtatDesVentes() {
  const { ouvrirFicheArticle } = usePreview();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const projetItems = referentielItems(useProjetsReferentiel().data);
  const trancheItems = useTranchesFiltre().data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const categorieItems = referentielItems(useCategoriesBien().data);
  const typeItems = referentielItems(useTypesBienReferentiel().data);
  const listeRef = useRef<HTMLDivElement>(null);

  const [filtresSynthese, setFiltresSynthese] = useState(SYNTHESE_DEFAUT);
  const synthese = useApi(
    () => getSyntheseEtatVentes(paramsEtatVentes({ ...FILTRES_ETAT_VENTES_DEFAUT, ...filtresSynthese })),
    [JSON.stringify(filtresSynthese)],
    'etat-des-ventes-synthese',
  );
  const statuts = synthese.data?.statuts ?? [];

  const [filtres, setFiltres] = useState<FiltresListeEtatVentes>(FILTRES_ETAT_VENTES_DEFAUT);
  const [page, setPage] = useState(0);
  const search = useDebouncedValue(filtres.search);
  const params = paramsEtatVentes({ ...filtres, search });
  const cle = JSON.stringify(params);

  function changer<K extends keyof FiltresListeEtatVentes>(c: K, valeur: FiltresListeEtatVentes[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [c]: valeur }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(FILTRES_ETAT_VENTES_DEFAUT);
  }

  function choisir(choix: ChoixSynthese) {
    setPage(0);
    setFiltres(filtresDepuisChoix(choix, filtresSynthese));
    listeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const catalogue = useColonnesEtatVentes();
  const colonnes = useColonnesVisibles('etat-des-ventes', catalogue.data, DISPOSITION_ETAT_VENTES);
  const demandees = colonnes.demandees;
  const groupement = useGroupement('etat-des-ventes', catalogue.data, useCallback(() => setPage(0), []));
  const enGroupes = groupement.actif;

  const totauxServeur = useTotauxServeur(
    catalogueTotaux(colonnes.colonnes),
    (agregats) => totauxColonnes('etat-des-ventes', params, agregats),
    cle,
    !enGroupes,
    'etat-des-ventes-totaux-colonnes',
  );
  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listEtatVentes(params, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: demandees }).then(avecId),
    [cle, page, demandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'etat-des-ventes',
  );
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listEtatVentesGroupes(params, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [cle, page, enGroupes, groupement.cleDeps],
    'etat-des-ventes-groupes',
  );
  const lignesGroupes = useLignesGroupes<LigneEtatVentes>(
    (cleGroupe, taille) =>
      listEtatVentes(params, { page: 0, size: taille }, { colonnes: demandees, depliage: groupement.depliagePour(cleGroupe) }).then(avecId),
    `${cle}|${groupement.cleDeps}|${demandees?.join(',') ?? ''}`,
  );

  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const chargement = enGroupes ? groupes.loading : liste.loading;
  const erreur = enGroupes ? groupes.error : liste.error;
  const vide = (pageAffichee?.content.length ?? 0) === 0;
  const actifs = filtresEtatVentesActifs(filtres);
  const statutItems = statuts.map((s) => ({ label: libelleStatutVente(statuts, s.code), value: s.code }));

  return (
    <PageShell
      title="État des ventes"
      crumbs={[{ label: 'Ventes' }, { label: 'État des ventes' }]}
      icon={<ChartNoAxesColumn />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      actions={
        <BoutonExporter chemin="/api/etat-des-ventes/export" params={{ ...params, colonnes: colonnes.visibles }} nomListe="etat-des-ventes" />
      }
    >
      <div className="flex flex-col gap-4">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <section aria-label="Synthèse" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ChoixUnique
              items={projetItems}
              tous="Tous les projets"
              value={filtresSynthese.projetId}
              placeholder="Projet…"
              largeur="w-44"
              onChange={(v) => setFiltresSynthese((f) => ({ ...f, projetId: v }))}
            />
            <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={filtresSynthese.trancheId} onChange={(v) => setFiltresSynthese((f) => ({ ...f, trancheId: v }))} items={trancheItems} />
            <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={filtresSynthese.categorieId} onChange={(v) => setFiltresSynthese((f) => ({ ...f, categorieId: v }))} items={categorieItems} />
          </div>
          {synthese.loading && !synthese.data && <LoadingState />}
          {synthese.error && <ErrorState message={synthese.error} />}
          {!synthese.error && synthese.data && (
            <ResultsRegion loading={synthese.loading}>
              <div className="max-h-112 overflow-auto rounded-xl border border-border bg-card">
                {synthese.data.lignes.length === 0 ? (
                  <EmptyState title={VIDE} />
                ) : (
                  <SyntheseEtatVentes synthese={synthese.data} onChoisir={choisir} />
                )}
              </div>
            </ResultsRegion>
          )}
        </section>

        <section ref={listeRef} aria-label="Liste des articles" className="flex scroll-mt-4 flex-col gap-3">
          <FiltresEtatVentesPanneau
            filtres={filtres}
            changer={changer}
            reinitialiser={reinitialiser}
            projets={projetItems}
            tranches={trancheItems}
            categories={categorieItems}
            statuts={statutItems}
            types={typeItems}
          />
          {chargement && !pageAffichee && <LoadingState />}
          {erreur && <ErrorState message={erreur} />}
          {!erreur && pageAffichee && (
            <ResultsRegion loading={chargement}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-body text-muted-foreground">
                  {pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : 'article')}
                </span>
                {colonnes.catalogueServi.length > 0 && (
                  <ColumnSelector
                    catalogue={colonnes.catalogueServi}
                    visibles={colonnes.visibles}
                    onBasculer={colonnes.basculer}
                    onReinitialiser={colonnes.reinitialiser}
                    estDefaut={colonnes.estDefaut}
                  />
                )}
              </div>
              <div className="flex h-[70vh] min-w-0 flex-col overflow-auto rounded-xl border border-border bg-card">
                <BandeGroupement etat={groupement} />
                {vide ? (
                  <EmptyState
                    title={VIDE}
                    action={
                      actifs ? (
                        <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                          <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                    <EtatVentesTable
                      rows={enGroupes ? [] : (liste.data?.content ?? [])}
                      colonnes={colonnes.colonnes}
                      onOuvrir={ouvrirFicheArticle}
                      groupes={groupesGrille(groupement, groupes.data, lignesGroupes, {
                        statutCode: (brut) => libelleStatutVente(statuts, brut),
                      })}
                      totauxServeur={totauxServeur}
                    />
                  </EtatColonnes>
                )}
              </div>
              <Pagination
                page={pageAffichee.page}
                totalPages={pageAffichee.totalPages}
                totalElements={pageAffichee.totalElements}
                onPageChange={setPage}
              />
            </ResultsRegion>
          )}
        </section>
      </div>
    </PageShell>
  );
}
