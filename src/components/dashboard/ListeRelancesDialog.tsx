import { useMemo, useState } from 'react';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import Modal from '../Modal';
import { Badge, EmptyState, ErrorState, LoadingState } from '../ui';
import FicheProspectionLazy, { type FicheOuverte } from './FicheProspectionLazy';
import { formatTelephone } from '../../lib/format';
import type { RelanceProspectionDto } from '../../types';

/** `id` = l'interaction, pas la prospection : une prospection peut porter plusieurs relances. */
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
    /* `stopPropagation` : sinon le clic sur le lien `tel:` ouvrirait aussi la fiche. */
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
    valeur: (r) => formatTelephone(r.telephone),
  },
  { nom: 'dateRelance', libelle: 'Échéance', type: 'DATE', largeur: 8 },
  { nom: 'joursDeRetard', libelle: 'Retard (j)', type: 'NOMBRE', largeur: 7 },
  {
    nom: 'preProspection',
    libelle: 'Type',
    largeur: 9,
    rendu: (r) =>
      r.preProspection ? <Badge tone="amber">Pré-prospection</Badge> : <Badge tone="neutral">Prospection</Badge>,
    valeur: (r) => (r.preProspection ? 'Pré-prospection' : 'Prospection'),
  },
  {
    nom: 'commercialNom',
    libelle: 'Commercial',
    largeur: 14,
    classe: 'text-muted-foreground',
    rendu: (r) => (r.nonAffectee ? 'Non affectée' : r.commercialNom || '—'),
    valeur: (r) => (r.nonAffectee ? 'Non affectée' : (r.commercialNom ?? '')),
  },
  { nom: 'motif', libelle: 'Motif', largeur: 24, classe: 'text-muted-foreground', titre: (r) => r.motif ?? undefined },
  { nom: 'derniereInteractionDate', libelle: 'Dernière action', type: 'DATE', largeur: 9 },
];

/** Aucune requête ici : le tableau de bord passe la file entière déjà chargée,
 * d'où un tri/filtre client légitime (ce n'est pas une page). */
export default function ListeRelancesDialog({
  titre,
  etat,
  plusRecentesDAbord,
  note,
  onClose,
}: Readonly<{
  titre: string;
  note?: string;
  etat: {
    data: { content: RelanceProspectionDto[]; totalElements: number } | null;
    loading: boolean;
    error: string | null;
  };
  /** La file arrive par échéance croissante ; « En retard » se lit à rebours. */
  plusRecentesDAbord?: boolean;
  onClose: () => void;
}>) {
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
