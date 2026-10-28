import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { cheminExportCommissions, getCommissionTranches } from '../../lib/apiCommissions';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useExportListe } from '../../lib/useExportListe';
import { pluriel } from '../../lib/format';
import type { CommissionTrancheDto } from '../../types/commissions';
import { MESSAGE_ACCES_REFUSE, lire } from './lecture';

type Ligne = CommissionTrancheDto & { id: string };

const COLONNES: ColonneGrille<Ligne>[] = [
  { nom: 'code', libelle: 'Code', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'vendus', libelle: 'Vendu nombre', type: 'NOMBRE', largeur: 6 },
  { nom: 'restants', libelle: 'Reste nombre', type: 'NOMBRE', largeur: 6 },
  { nom: 'montantGenere', libelle: 'Commission générée', type: 'MONTANT', largeur: 8 },
  { nom: 'montantRegle', libelle: 'Commission réglée', type: 'MONTANT', largeur: 8, classe: 'font-bold text-(--success)' },
  { nom: 'montantReste', libelle: 'Reste à régler', type: 'MONTANT', largeur: 8, classe: 'font-bold text-destructive' },
  { nom: 'caStock', libelle: 'C.A. Stock', type: 'MONTANT', largeur: 8 },
  { nom: 'caRealise', libelle: 'C.A. Réalisé', type: 'MONTANT', largeur: 8 },
  { nom: 'caReste', libelle: 'C.A. Reste', type: 'MONTANT', largeur: 8 },
];

export default function CommissionsList() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
  const q = useDebouncedValue(recherche.trim());
  const liste = useApi(() => lire(() => getCommissionTranches(q || undefined)), [q], 'commissions-tranches');
  const lignes = useMemo<Ligne[]>(() => (liste.data ?? []).map((t) => ({ ...t, id: t.trancheId })), [liste.data]);
  const refuse = liste.error === MESSAGE_ACCES_REFUSE;
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('commissions'));
  const exportListe = useExportListe(cheminExportCommissions(), { recherche: q || undefined }, 'commissions');
  const decompte = liste.data ? pluriel(liste.data.length, 'tranche') : undefined;

  return (
    <PageListe titre="Commissions">
      <EnteteListe titre="Commissions" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={recherche ? [`« ${recherche} »`] : []}
        recherche={{ valeur: recherche, onChange: setRecherche, placeholder: 'Recherche multi-critère' }}
        onReinitialiser={() => setRecherche('')}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {liste.error && refuse && <EmptyState title="Accès refusé" message={MESSAGE_ACCES_REFUSE} />}
        {liste.error && !refuse && (
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
                <EmptyState title="Aucune tranche accessible." />
              ) : (
                <DataGrid
                  cleOrdre="commissions-tranches"
                  rows={lignes}
                  colonnes={COLONNES}
                  onOuvrir={(id) => navigate(`/commissions/${id}`)}
                  libelleLigne={(t) => `Ouvrir les commissions de ${t.code ?? t.id}`}
                  bandeauRegroupement={false}
                />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="commissions"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: refuse || exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
