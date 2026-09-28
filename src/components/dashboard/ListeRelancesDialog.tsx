import { useMemo, useState } from 'react';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import Modal from '../Modal';
import { Badge, EmptyState, ErrorState, LoadingState } from '../ui';
import FicheProspectionLazy, { type FicheOuverte } from './FicheProspectionLazy';
import { formatTelephone } from '../../lib/format';
import type { RelanceProspectionDto } from '../../types';

/** Une relance telle que la grille la veut : `DataGrid` identifie ses lignes
 * par `id`, que le DTO ne porte pas. L'interaction est la bonne identité — une
 * même prospection peut porter plusieurs relances. */
type LigneRelance = RelanceProspectionDto & { id: string };

const COLONNES: ColonneGrille<LigneRelance>[] = [
  {
    nom: 'prospectNom',
    libelle: 'Nom',
    largeur: 20,
    classe: 'font-medium text-foreground',
    rendu: (r) => r.prospectNom || <span className="font-normal text-muted-foreground italic">Lead sans nom</span>,
    titre: (r) => r.prospectNom ?? undefined,
  },
  {
    nom: 'telephone',
    libelle: 'Téléphone',
    largeur: 10,
    classe: 'tabular-nums',
    /* Le numéro reste un lien `tel:` : appeler est l'action de cet écran. Le
       clic est arrêté avant la ligne, qui ouvrirait la fiche. */
    rendu: (r) =>
      r.telephone ? (
        <a
          href={`tel:${r.telephone.replace(/\s/g, '')}`}
          className="text-(--info) no-underline hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {formatTelephone(r.telephone)}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    valeur: (r) => formatTelephone(r.telephone) ?? '',
  },
  { nom: 'dateRelance', libelle: 'Échéance', type: 'DATE', largeur: 8 },
  { nom: 'joursDeRetard', libelle: 'Retard (j)', type: 'NOMBRE', largeur: 7 },
  { nom: 'motif', libelle: 'Motif', largeur: 24, classe: 'text-muted-foreground', titre: (r) => r.motif ?? undefined },
  {
    nom: 'commercialNom',
    libelle: 'Commercial',
    largeur: 14,
    classe: 'text-muted-foreground',
    rendu: (r) => (r.nonAffectee ? 'Non affectée' : r.commercialNom || '—'),
    valeur: (r) => (r.nonAffectee ? 'Non affectée' : (r.commercialNom ?? '')),
  },
  {
    nom: 'preProspection',
    libelle: 'Type',
    largeur: 9,
    rendu: (r) =>
      r.preProspection ? <Badge tone="amber">Pré-prospection</Badge> : <Badge tone="neutral">Prospection</Badge>,
    valeur: (r) => (r.preProspection ? 'Pré-prospection' : 'Prospection'),
  },
  { nom: 'derniereInteractionDate', libelle: 'Dernière action', type: 'DATE', largeur: 9 },
];

/**
 * Toute la file d'une section « À rappeler » (Aujourd'hui ou En retard), dans
 * un dialogue.
 *
 * **Aucune requête ici** : le tableau de bord charge déjà la file entière pour
 * pouvoir en montrer la fin (voir `TAILLE_FILE`), et la passe telle quelle. La
 * liste suit donc la bascule Moi / Équipe et se rafraîchit avec la carte.
 *
 * Tri et filtre par colonne sont ceux de `DataGrid`, côté client — légitime
 * ici, puisque la file est complète et non une page.
 */
export default function ListeRelancesDialog({
  titre,
  etat,
  plusRecentesDAbord,
  note,
  onClose,
}: {
  titre: string;
  /** Précision de périmètre rendue sous la liste — la borne de 30 jours de la
   * file « En retard », sans objet sur « Aujourd'hui ». */
  note?: string;
  etat: {
    data: { content: RelanceProspectionDto[]; totalElements: number } | null;
    loading: boolean;
    error: string | null;
  };
  /** Même sens que sur la carte : la file arrive par échéance croissante, et
   * « En retard » se lit du plus récent au plus ancien. */
  plusRecentesDAbord?: boolean;
  onClose: () => void;
}) {
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);

  const page = etat.data;
  const lignes = useMemo<LigneRelance[]>(() => {
    const contenu = (page?.content ?? []).map((r) => ({ ...r, id: r.interactionId }));
    return plusRecentesDAbord ? contenu.reverse() : contenu;
  }, [page, plusRecentesDAbord]);

  function ouvrir(interactionId: string) {
    const r = lignes.find((l) => l.id === interactionId);
    if (r) setFiche({ id: r.prospectionId, pre: !!r.preProspection });
  }

  return (
    <Modal title={titre} onClose={onClose} width="min(1180px, calc(100vw - 2rem))" pleineHauteur>
      {etat.loading && !page && <LoadingState />}
      {etat.error && <ErrorState message={etat.error} />}
      {!etat.error && page && (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          <div className="shrink-0 text-body text-muted-foreground">
            {page.totalElements} relance{page.totalElements > 1 ? 's' : ''}
            {/* La file est censée tenir dans le lot chargé ; si ce n'est plus
                le cas, le dire plutôt que de laisser croire à une liste
                complète. */}
            {page.content.length < page.totalElements && (
              <span className="text-(--amber)"> — {page.content.length} affichées, la file dépasse le lot chargé.</span>
            )}
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
            {lignes.length === 0 ? (
              <EmptyState title="Rien à afficher" message="Aucune relance dans cette file." />
            ) : (
              <DataGrid
                cleOrdre="dashboard-relances"
                rows={lignes}
                colonnes={COLONNES}
                onOuvrir={ouvrir}
                libelleLigne={(r) => `Ouvrir la fiche de ${r.prospectNom || 'ce lead'}`}
                bandeauRegroupement={false}
              />
            )}
          </div>
          {note && <p className="shrink-0 text-micro text-muted-foreground">{note}</p>}
        </div>
      )}

      <FicheProspectionLazy fiche={fiche} onClose={() => setFiche(null)} />
    </Modal>
  );
}
