import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import ChoixUnique from '../../components/ChoixUnique';
import DataGrid from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import { EmptyState, ErrorState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { getDepensesProjet, getReglementsProjet } from '../../lib/apiDepensesProjet';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { useApi } from '../../lib/useApi';
import { COLONNES_REGLEMENTS, classeReglement } from './colonnesReglementsProjet';
import { SqueletteGrille } from './commun';
import { useReferentielsProjet } from './hooks';

export default function ReglementsProjetList() {
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [lotId, setLotId] = useState<string | null>(null);
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [masquerAnnules, setMasquerAnnules] = useState(false);
  const [page, setPage] = useState(0);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-depenses-reglements'));

  const referentiels = useReferentielsProjet();
  const projetItems = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  // Les lots proposés sont ceux de la synthèse des projets choisis (ceux qui portent des factures).
  const synthese = useApi(() => getDepensesProjet(projetIds.length > 0 ? projetIds : undefined), [projetIds.join(',')], 'projet-depenses-lots');
  const lotItems = (synthese.data ?? []).flatMap((p) =>
    p.lots.flatMap((l) => (l.lotId ? [{ value: l.lotId, label: `${p.projetCode ?? '—'} · ${l.lotCode ?? '—'}` }] : [])),
  );

  const filtres = {
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    lotId: lotId ?? undefined,
    du: du || undefined,
    au: au || undefined,
    inclureAnnules: masquerAnnules ? false : undefined,
  };
  const liste = useApi(() => getReglementsProjet(filtres, { page, size: DEFAULT_PAGE_SIZE }), [JSON.stringify(filtres), page], 'projet-depenses-reglements');

  const lignes = liste.data?.content ?? [];
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'règlement') : undefined;
  const actifs = projetIds.length > 0 || !!lotId || !!du || !!au || masquerAnnules;

  function changerProjets(ids: string[]) {
    setPage(0);
    setLotId(null);
    setProjetIds(ids);
  }

  function reinitialiser() {
    changerProjets([]);
    setDu('');
    setAu('');
    setMasquerAnnules(false);
  }

  return (
    <PageListe titre="Décaissements des projets">
      <EnteteListe titre="Décaissements des projets" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={[
          ...puceSelection('Projet', projetItems, projetIds),
          ...puceUnique(lotItems, lotId),
          ...(masquerAnnules ? ['Sans les annulés'] : []),
        ]}
        periode={{ debut: du, fin: au, onChange: (d, f) => { setPage(0); setDu(d); setAu(f); } }}
        onReinitialiser={reinitialiser}
        champs={
          <label className="flex items-center gap-1.5 text-body text-foreground">
            <input type="checkbox" checked={masquerAnnules} onChange={(e) => { setPage(0); setMasquerAnnules(e.target.checked); }} />
            Masquer les annulés
          </label>
        }
      >
        <BoiteFiltre titre="Projets" mode="multiple" items={projetItems} valeur={projetIds} onChange={changerProjets} />
        <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
          <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase">Lot</span>
          <ChoixUnique items={lotItems} tous="Tous" value={lotId} placeholder="Tous" largeur="w-full" onChange={(v) => { setPage(0); setLotId(v); }} />
        </div>
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
                <EmptyState title={actifs ? 'Aucun règlement ne correspond aux filtres actifs' : 'Aucun règlement dans votre périmètre'} />
              ) : (
                <DataGrid
                  cleOrdre="projet-depenses-reglements"
                  rows={lignes}
                  colonnes={COLONNES_REGLEMENTS}
                  classeLigne={classeReglement}
                  bandeauRegroupement={false}
                />
              )}
            </div>
            <div className="shrink-0">
              <Pagination page={liste.data.page} totalPages={liste.data.totalPages} totalElements={liste.data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante cle="projet-depenses-reglements" ligneSelectionnee={false} actions={[{ id: 'rafraichir', onClick: () => void liste.refetch() }]} />
    </PageListe>
  );
}
