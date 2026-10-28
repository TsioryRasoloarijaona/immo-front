import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import usePanneauArticles from './usePanneauArticles';
import CadreListe from './CadreListe';
import ColumnSelector from '../ColumnSelector';
import DataGrid from '../DataGrid';
import EtatColonnes from '../EtatColonnes';
import { EmptyState } from '../ui';
import { listLignesArticles } from '../../lib/apiSousArticles';
import {
  catalogueLignesArticles, dispositionLignesArticles, grilleLignesArticles, useEntiteObligatoire, useFiltresArticles,
} from '../../lib/articlesListe';
import { useColonnesVisibles } from '../../lib/colonnes';
import { pluriel } from '../../lib/format';
import { usePreview } from '../../lib/previewContext';
import { useColonnesArticles, useTranchesReferentiel } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';

/** Liste à colonnes choisies (catalogue serveur) de `/articles` et `/sous-articles` : filtres, sélecteur, grille. */
export default function ListeLignesArticles({ liste, onOuvrir, admin, dialogues }: Readonly<{
  liste: 'articles' | 'sous-articles';
  onOuvrir: (id: string) => void;
  admin: ComponentProps<typeof CadreListe>['admin'];
  dialogues?: ReactNode;
}>) {
  const sous = liste === 'sous-articles';
  const nom = sous ? 'sous-article' : 'article';
  const { ouvrirFicheDossier } = usePreview();
  const tranches = useTranchesReferentiel();
  const catalogue = useColonnesArticles();
  const disposition = useMemo(() => dispositionLignesArticles(sous), [sous]);
  const cleStockage = sous ? liste : 'articles-omran';
  const colonnes = useColonnesVisibles(cleStockage,catalogueLignesArticles(catalogue.data, sous), disposition);
  // Toujours explicite : les défauts du serveur ne portent ni le parent ni l'indicateur « parent occupé ».
  const demandees = [...new Set(colonnes.visibles.flatMap((n) => [n, ...(disposition.dependances?.[n] ?? [])]))];

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const filtres = useFiltresArticles(() => setPage(0));
  const { aucune: aucuneEntite, prete: requetePrete, seule: entiteSeule } = useEntiteObligatoire(filtres, !sous);
  const hasActiveFilters = !!search || trancheId.length > 0 || (filtres.actifs && !entiteSeule);

  function resetFilters() {
    setPage(0);
    setSearch('');
    setTrancheId([]);
    filtres.reinitialiser();
  }

  const { data, loading, error } = useApi(
    () =>
      demandees.length > 0 && requetePrete
        ? listLignesArticles(
            liste,
            { search: debouncedSearch || undefined, trancheId: trancheId.length > 0 ? trancheId : undefined, ...filtres.params, colonnes: demandees },
            { page, size: 20 },
          )
        : Promise.resolve(null),
    [liste, debouncedSearch, trancheId.join(','), filtres.cle, page, demandees.join(','), requetePrete],
  );
  const grille = useMemo(() => grilleLignesArticles(colonnes.colonnes, ouvrirFicheDossier), [colonnes.colonnes, ouvrirFicheDossier]);
  const rows = data?.content ?? [];
  const exportListe = useExportListe(
    `/api/${liste}/export`,
    { search: debouncedSearch || undefined, trancheId: trancheId.length > 0 ? trancheId : undefined, ...filtres.params, colonnes: colonnes.visibles },
    liste,
  );
  const panneau = usePanneauArticles({
    filtres,
    sousArticles: sous,
    entiteObligatoire: !sous,
    tranche: {
      items: tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id })),
      valeur: trancheId,
      onChange: (v) => {
        setPage(0);
        setTrancheId(v);
      },
    },
    recherche: search,
  });
  const erreur = error ?? catalogue.error;

  return (
    <CadreListe
      titre={sous ? 'Sous-articles' : 'Articles'}
      cle={liste}
      lignes={data ? pluriel(data.totalElements, nom) : undefined}
      selecteur={
        colonnes.catalogueServi.length > 0 && (
          <ColumnSelector
            compact
            catalogue={colonnes.catalogueServi}
            visibles={colonnes.visibles}
            onBasculer={colonnes.basculer}
            onReinitialiser={colonnes.reinitialiser}
            estDefaut={colonnes.estDefaut}
          />
        )
      }
      panneau={{
        ...panneau,
        recherche: {
          valeur: search,
          onChange: (v) => {
            setPage(0);
            setSearch(v);
          },
          placeholder: 'Code, description, parent, titre foncier…',
        },
        onReinitialiser: resetFilters,
      }}
      etat={{ chargement: !aucuneEntite && !erreur && (loading || !data), erreur, pret: !!data }}
      sansDonnees={aucuneEntite && <EmptyState title="Aucune entité active" message="Aucune entité active : la liste des articles ne peut pas être affichée." />}
      vide={rows.length === 0 ? { aucun: `Aucun ${nom}`, filtresActifs: hasActiveFilters, onReinitialiser: resetFilters, message: `Aucun ${nom} n'est encore enregistré.` } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={admin}
      exportListe={{ export: exportListe, pdf: true, inactif: colonnes.visibles.length === 0 }}
      dialogues={dialogues}
    >
      <EtatColonnes pret={grille.length > 0} erreur={catalogue.error}>
        <DataGrid
          cleOrdre={cleStockage}
          rows={rows}
          colonnes={grille}
          onOuvrir={onOuvrir}
          libelleLigne={(a) => `Ouvrir la fiche de ${a.code ?? ''}`.trim()}
        />
      </EtatColonnes>
    </CadreListe>
  );
}
