import type { ComponentProps, ReactNode } from 'react';
import { FileText, RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import Pagination from '../Pagination';
import { Button } from '../ui/button';
import BarreEtatListe from '../liste/BarreEtatListe';
import BarreOutilsFlottante, { type ActionOutil, type OutilPropre } from '../liste/BarreOutilsFlottante';
import EnteteListe from '../liste/EnteteListe';
import PageListe from '../liste/PageListe';
import PanneauFiltresCoches from '../liste/PanneauFiltresCoches';
import { useAuth } from '../../lib/auth';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { estAdministrateur } from '../../lib/roles';
import { refetchAllApis } from '../../lib/useApi';
import type { useExportListe } from '../../lib/useExportListe';

/** Outils pour l'Administrateur seul : création, imports, outils propres (le serveur répond 403 aux autres). */
interface OutilsAdmin {
  nouveau?: { libelle: string; onClick: () => void };
  actions?: ActionOutil[];
  propres?: OutilPropre[];
}

/** Liste vide : `aucun` est la phrase accordée (« Aucune tranche ») ; avec des filtres actifs, le bouton « Réinitialiser les filtres ». */
interface VideListe {
  aucun: string;
  filtresActifs: boolean;
  onReinitialiser: () => void;
  message?: string;
}

interface ExportListe {
  export: ReturnType<typeof useExportListe>;
  /** L'export sait produire un PDF : ajoute « Exporter en PDF » aux outils propres. */
  pdf?: boolean;
  inactif?: boolean;
}

function ListeVide({ aucun, filtresActifs, onReinitialiser, message }: Readonly<VideListe>) {
  if (!filtresActifs) return <EmptyState title={aucun} message={message} />;
  return (
    <EmptyState
      title="Aucun résultat"
      message={`${aucun} ne correspond aux filtres actifs.`}
      action={
        <Button type="button" variant="outline" size="sm" onClick={onReinitialiser}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
        </Button>
      }
    />
  );
}

function Outils({ cle, actions, propres, admin, exportListe }: Readonly<{
  cle: string;
  actions: ActionOutil[];
  propres: OutilPropre[];
  admin?: OutilsAdmin;
  exportListe?: ExportListe;
}>) {
  const { user } = useAuth();
  const estAdmin = estAdministrateur(user);
  const exporter = exportListe?.export;
  const inactif = !!exportListe?.inactif || !!exporter?.enCours;
  const toutes: ActionOutil[] = [
    { id: 'rafraichir', onClick: refetchAllApis },
    ...actions,
    ...(exporter ? [{ id: 'exporter' as const, onClick: () => void exporter.exporter('xlsx'), disabled: inactif }] : []),
    ...(estAdmin ? (admin?.actions ?? []) : []),
  ];
  const propresToutes: OutilPropre[] = [
    ...propres,
    ...(exporter && exportListe.pdf
      ? [{ id: 'exporter-pdf', libelle: 'Exporter en PDF', icone: FileText, onClick: () => void exporter.exporter('pdf'), disabled: inactif }]
      : []),
    ...(estAdmin ? (admin?.propres ?? []) : []),
  ];
  return (
    <BarreOutilsFlottante
      cle={cle}
      ligneSelectionnee={false}
      nouveau={estAdmin ? admin?.nouveau : undefined}
      actions={toutes}
      propres={propresToutes}
    />
  );
}

/**
 * Cadre commun des listes Patrimoine et Administration : en-tête, panneau de filtres, corps (états, grille, pagination),
 * barre d'état et barre d'outils flottante. La grille est `children` ; les données restent à la page.
 */
export default function CadreListe({
  titre,
  cle,
  lignes,
  selecteur,
  panneau,
  etat,
  sansDonnees,
  avant,
  vide,
  pagination,
  actions = [],
  propres = [],
  admin,
  exportListe,
  reserveAdmin = false,
  dialogues,
  children,
}: Readonly<{
  titre: string;
  /** Slug de l'écran : mémorise le panneau replié et la barre d'outils. */
  cle: string;
  lignes?: string;
  /** `ColumnSelector compact`. */
  selecteur?: ReactNode;
  /** Absent pour une liste sans filtre. */
  panneau?: Omit<ComponentProps<typeof PanneauFiltresCoches>, 'ferme' | 'onBasculer'>;
  /** `pret` : une page de résultats est disponible (même vide). */
  etat: { chargement: boolean; erreur: string | null; pret: boolean };
  /** Affiché quand rien ne charge, rien n'échoue et il n'y a pas de résultats. */
  sansDonnees?: ReactNode;
  /** Au-dessus de la carte (mention, totaux). */
  avant?: ReactNode;
  vide?: VideListe | null;
  pagination?: ComponentProps<typeof Pagination>;
  actions?: ActionOutil[];
  propres?: OutilPropre[];
  admin?: OutilsAdmin;
  exportListe?: ExportListe;
  /** Page entière réservée à l'Administrateur. */
  reserveAdmin?: boolean;
  /** Dialogues de la page, rendus hors de la grille. */
  dialogues?: ReactNode;
  children: ReactNode;
}>) {
  const { user } = useAuth();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes(cle));

  if (reserveAdmin && !estAdministrateur(user)) {
    return (
      <PageListe titre={titre}>
        <EmptyState
          title="Accès réservé aux administrateurs"
          message="Cette section n'est visible que pour les comptes ayant le rôle Administrateur."
        />
      </PageListe>
    );
  }

  const { chargement, erreur, pret } = etat;
  return (
    <PageListe titre={titre}>
      <EnteteListe titre={titre} lignes={lignes}>
        {selecteur}
      </EnteteListe>
      {panneau && <PanneauFiltresCoches ferme={filtresFermes} onBasculer={basculerFiltres} {...panneau} />}
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {chargement && !pret && <LoadingState />}
        {erreur && <ErrorState message={erreur} />}
        {!erreur && !chargement && !pret && sansDonnees}
        {!erreur && pret && (
          <ResultsRegion loading={chargement}>
            {avant}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {vide ? <ListeVide {...vide} /> : children}
            </div>
            {pagination && (
              <div className="shrink-0">
                <Pagination {...pagination} />
              </div>
            )}
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={lignes ?? '—'} selection="aucune" alerte={exportListe?.export.erreur} />
      <Outils cle={cle} actions={actions} propres={propres} admin={admin} exportListe={exportListe} />
      {dialogues}
    </PageListe>
  );
}
