import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { listArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatNumber, formatPercent, formatSurface, libellePrix } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import type { ArticleListItemDto } from '../../types';
import BarreFiltresArticles from './BarreFiltresArticles';
import { useFiltresArticles } from './filtresArticles';

// `valeur` de la colonne « État » : sans lui, tri et filtre compareraient le `statut` brut.
function articleEtatLabel(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>): string {
  if (a.dossierId) return canonicalStatusLabel(a.dossierStatut) || '';
  return a.statut === 'DISPONIBLE' ? 'Libre' : 'Occupé';
}

function articleEtatBadge(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>) {
  if (a.dossierId) {
    const label = canonicalStatusLabel(a.dossierStatut);
    return <Badge tone={toneForStatus(label)}>{label}</Badge>;
  }
  if (a.statut === 'DISPONIBLE') return <Badge tone="success">Libre</Badge>;
  return <Badge tone="neutral">Occupé</Badge>;
}

const TIRET = <span className="text-muted-foreground">—</span>;
const M2 = (v: unknown) => (typeof v === 'number' && v ? formatSurface(v) : TIRET);

function useColonnesArticles(): ColonneGrille<ArticleListItemDto>[] {
  const navigate = useNavigate();
  return useMemo<ColonneGrille<ArticleListItemDto>[]>(
    () => [
      { nom: 'etat', libelle: 'État', largeur: 7, valeur: articleEtatLabel, rendu: articleEtatBadge },
      {
        nom: 'code',
        libelle: 'Code',
        largeur: 8,
        classe: 'font-medium text-foreground',
        titre: (a) => a.code || undefined,
        rendu: (a) => (
          <>
            {a.code || '—'}
            {a.sousArticle && (
              <Badge tone="neutral" className="ml-1.5 align-middle">
                Sous-article
              </Badge>
            )}
          </>
        ),
      },
      { nom: 'description', libelle: 'Description', largeur: 11, classe: 'text-muted-foreground', titre: (a) => a.description || undefined },
      { nom: 'categorieLibelle', libelle: 'Catégorie', largeur: 8, classe: 'text-muted-foreground', titre: (a) => a.categorieLibelle || undefined },
      { nom: 'typeLibelle', libelle: 'Type', largeur: 9, classe: 'text-muted-foreground', titre: (a) => a.typeLibelle || undefined },
      { nom: 'presentationTypeCode', libelle: 'Présent.', largeur: 5, classe: 'text-muted-foreground', titre: (a) => a.presentationTypeLibelle || undefined },
      {
        nom: 'natureCode',
        libelle: 'Nature',
        largeur: 6,
        classe: 'text-muted-foreground',
        valeur: (a) => a.natureCode || a.natureLibelle,
        titre: (a) => a.natureLibelle || undefined,
      },
      {
        nom: 'etageCode',
        libelle: 'Étage',
        largeur: 5,
        classe: 'text-muted-foreground',
        valeur: (a) => a.etageCode || a.etageLibelle,
        titre: (a) => a.etageLibelle || undefined,
      },
      { nom: 'area', libelle: 'Superficie', type: 'NOMBRE', largeur: 6, classe: 'text-muted-foreground', rendu: (a) => M2(a.area) },
      {
        nom: 'superficieSousArticles',
        libelle: 'Superf. sous-art.',
        type: 'NOMBRE',
        largeur: 7,
        classe: 'text-muted-foreground',
        rendu: (a) => M2(a.superficieSousArticles),
      },
      {
        nom: 'tauxTVA',
        libelle: 'TVA',
        type: 'NOMBRE',
        largeur: 5,
        classe: 'text-muted-foreground',
        rendu: (a) => (a.tauxTVA == null ? TIRET : formatPercent(a.tauxTVA)),
        formatValeur: (v) => formatPercent(typeof v === 'number' ? v : null),
      },
      {
        // Prix de l'article et de ses sous-articles (ComSalePrice), celui que le module Vente affiche.
        nom: 'comSalePrice',
        libelle: 'Prix de vente',
        type: 'MONTANT',
        largeur: 9,
        classe: 'text-muted-foreground',
        valeur: (a) => a.comSalePrice || a.comSalePriceFloor,
        rendu: (a) => libellePrix(a.comSalePrice, a.comSalePriceFloor) ?? TIRET,
      },
      {
        nom: 'dossierCode',
        libelle: 'N° Dossier',
        largeur: 6,
        classe: 'text-muted-foreground',
        titre: (a) => a.dossierCode || undefined,
        rendu: (a) =>
          a.dossierCode ? (
            <button
              type="button"
              className="hover:text-foreground hover:underline"
              onClick={(e) => {
                if (!a.dossierId) return;
                e.stopPropagation();
                void navigate(`/dossiers/${a.dossierId}`);
              }}
            >
              {a.dossierCode}
            </button>
          ) : (
            TIRET
          ),
      },
      { nom: 'clientNom', libelle: 'Client', largeur: 8, classe: 'text-muted-foreground', titre: (a) => a.clientNom || undefined },
    ],
    [navigate],
  );
}

/** Filtres OMRAN + grille + pagination des articles ; `trancheId` fixe la tranche (onglet de la fiche tranche). */
export default function GrilleArticles({ trancheId, cleOrdre }: Readonly<{ trancheId?: string; cleOrdre: string }>) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const filtres = useFiltresArticles(() => setPage(0));
  const parametres = filtres.parametres(trancheId);
  const cle = JSON.stringify(parametres);
  const { data, loading, error } = useApi(() => listArticles(parametres, { page, size: 20 }), [cle, page], 'articles');
  const colonnes = useColonnesArticles();
  const rows = data?.content ?? [];

  return (
    <>
      <BarreFiltresArticles filtres={filtres} avecTranche={!trancheId} />
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="shrink-0 text-body text-muted-foreground">
            {formatNumber(data.totalElements)} article{data.totalElements > 1 ? 's' : ''}
          </div>
          {rows.length === 0 ? (
            <EmptyState
              title={filtres.actifs ? 'Aucun résultat' : 'Rien à afficher'}
              message={filtres.actifs ? 'Aucun article ne correspond aux filtres actifs.' : "Aucun article n'est encore enregistré."}
              action={
                filtres.actifs ? (
                  <Button type="button" variant="outline" size="sm" onClick={filtres.reinitialiser}>
                    <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid
                cleOrdre={cleOrdre}
                rows={rows}
                colonnes={colonnes}
                onOuvrir={(id) => navigate(`/articles/${id}`)}
                libelleLigne={(a) => `Ouvrir la fiche de ${a.code}`}
              />
            </div>
          )}
          <div className="shrink-0">
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </div>
        </ResultsRegion>
      )}
    </>
  );
}
