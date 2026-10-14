import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, BellDot, Folder, Phone } from 'lucide-react';
import CadreFiche, { EnteteFiche, type VarianteFiche } from '../../components/CadreFiche';
import { Badge, ErrorState, LoadingState } from '../../components/ui';
import FicheShell from '../../components/FicheShell';
import { Button } from '../../components/ui/button';
import ActionsFicheDossier from '../../components/dossier/ActionsFicheDossier';
import BandeauxDossier from '../../components/dossier/BandeauxDossier';
import FormulaireDossier from '../../components/dossier/FormulaireDossier';
import PanneauDossier from '../../components/dossier/PanneauDossier';
import OngletAcquereurs from '../../components/dossier/onglets/OngletAcquereurs';
import OngletActions from '../../components/dossier/onglets/OngletActions';
import OngletAnnulation from '../../components/dossier/onglets/OngletAnnulation';
import OngletArticles from '../../components/dossier/onglets/OngletArticles';
import OngletAutres from '../../components/dossier/onglets/OngletAutres';
import OngletAutresMontants from '../../components/dossier/onglets/OngletAutresMontants';
import OngletDates from '../../components/dossier/onglets/OngletDates';
import OngletDatesAutres from '../../components/dossier/onglets/OngletDatesAutres';
import OngletDocumentsGeneres from '../../components/dossier/onglets/OngletDocumentsGeneres';
import OngletEcheancier from '../../components/dossier/onglets/OngletEcheancier';
import OngletHistorique from '../../components/dossier/onglets/OngletHistorique';
import OngletPiecesJointes from '../../components/dossier/onglets/OngletPiecesJointes';
import OngletStatut from '../../components/dossier/onglets/OngletStatut';
import { formatDate, formatPercent, toApiDateTime } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import {
  changerStatutDossier,
  getArticle,
  getDossier,
  getEtapesSuivantes,
  getFicheDossier,
  getMontantsDossier,
  listActionsDossier,
  listEcheances,
  listHistoriqueDossier,
  listPiecesJointes,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useToast } from '../../lib/toastContext';
import type { DossierDetailDto, DossierFicheDto } from '../../types';

export default function DossierDetail() {
  // La route `/dossiers/:id` garantit le paramètre.
  const { id = '' } = useParams();
  return <FicheDossier key={id} id={id} />;
}

function EnteteDossier({
  dossier: d,
  fiche,
  sorti,
}: Readonly<{ dossier: DossierDetailDto; fiche: DossierFicheDto | null; sorti: boolean }>) {
  return (
    <EnteteFiche
      code={d.code}
      nom={
        d.clientId ? (
          <Link to={`/clients/${d.clientId}`} className="hover:underline" title="Ouvrir la fiche client">
            {d.clientNom || 'Voir le client'}
          </Link>
        ) : (
          d.clientNom || d.code || 'Dossier'
        )
      }
    >
      <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>
      {d.dateValiditeStatut && (
        <span className={fiche?.statut.expire ? 'text-micro font-medium text-(--warning)' : 'text-micro text-muted-foreground'}>
          {fiche?.statut.expire ? 'expiré depuis le' : "valide jusqu'au"} {formatDate(d.dateValiditeStatut)}
        </span>
      )}
      {sorti && <Badge tone="warning">Dossier sorti</Badge>}
      {fiche?.instructionNonLue && <BellDot aria-label="Instruction non lue" className="size-4 text-(--info)" />}
      {/* Fraction (1 = 100 %) : ne s'affiche qu'en indivision. */}
      {typeof d.quotePart === 'number' && d.quotePart !== 1 && (
        <span className="text-micro font-medium text-foreground">Quote-part {formatPercent(d.quotePart, 2)}</span>
      )}
    </EnteteFiche>
  );
}

function MessageCreation({ vide }: Readonly<{ vide: boolean }>) {
  if (vide) {
    return (
      <div className="rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-1.5 text-micro text-(--info)">
        Dossier créé. Le schéma de financement est vide ; complétez-le dans l'onglet ci-dessous.
      </div>
    );
  }
  return <div className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-micro text-muted-foreground">Dossier créé.</div>;
}

export function FicheDossier({ id, variante = 'page' }: Readonly<{ id: string; variante?: VarianteFiche }>) {
  const { data: d, loading, error, refetch } = useApi(() => getDossier(id), [id], 'dossier');
  const fiche = useApi(() => getFicheDossier(id), [id], 'dossier-fiche');
  // Ne pas supprimer : `ArticleCompactPreview` lit `statut`, `tranche*`, `salePrice*`, `titreFoncier`,
  // `adresse`, absents d'`ArticleSummaryDto`. Un appel par article (N+1).
  const articleIds = (d?.articles ?? []).map((a) => a.id).join(',');
  const articleDetails = useApi(
    () => (d?.articles && d.articles.length > 0 ? Promise.all(d.articles.map((a) => getArticle(a.id))) : Promise.resolve([])),
    [articleIds],
    'dossier-articles',
  );
  const nextSteps = useApi(() => getEtapesSuivantes(id), [id], 'dossier-etapes');
  const montants = useApi(() => getMontantsDossier(id), [id], 'dossier-montants');
  const [echeancesPage, setEcheancesPage] = useState(0);
  const echeances = useApi(() => listEcheances(id, { page: echeancesPage, size: 20 }), [id, echeancesPage], 'dossier-echeances');
  const pieces = useApi(() => listPiecesJointes(id), [id], 'dossier-pieces');
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listHistoriqueDossier(id, { page: historiquePage, size: 20 }), [id, historiquePage], 'dossier-historique');
  const actions = useApi(() => listActionsDossier(id), [id], 'dossier-actions');
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  // En dialogue, l'URL est celle de la page derrière : `?nouveau` ne la concerne pas.
  const fromCreation = variante === 'page' && searchParams.get('nouveau') === '1';
  const [tab, setTab] = useState('statut');

  // Les `refetch` de useApi sont stables : la fonction l'est aussi (dépendance d'un effet d'OngletActions).
  const relireActionsListe = actions.refetch;
  const relireFiche = fiche.refetch;
  const relireActions = useCallback(() => {
    void relireActionsListe();
    void relireFiche();
  }, [relireActionsListe, relireFiche]);

  // `!d` : avec une valeur en cache, on repeint le dossier connu et la revalidation se fait en fond.
  if (loading && !d) return <CadreFiche variante={variante} title="Dossier de vente"><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche variante={variante} title="Dossier de vente"><ErrorState message={error} /></CadreFiche>;
  if (!d) {
    return (
      <CadreFiche variante={variante} title="Dossier introuvable" crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}>
        <p>Ce dossier n'existe pas.</p>
      </CadreFiche>
    );
  }

  async function relireTout() {
    await Promise.all([refetch(), fiche.refetch(), montants.refetch(), echeances.refetch(), historique.refetch(), actions.refetch()]);
  }

  async function relireEcheancier() {
    await Promise.all([echeances.refetch(), montants.refetch(), fiche.refetch()]);
  }

  const dossierId = d.id;

  // Un refus (400 champs / pièces, 403 rôle, 409 seuil) remonte à l'onglet Statut qui l'affiche en entier.
  async function changerStatut(newStatus: string, note: string, date?: string, ignorerSeuil?: boolean) {
    await changerStatutDossier(dossierId, { statut: newStatus, note: note || undefined, date: toApiDateTime(date), ignorerSeuil });
    await Promise.all([refetch(), nextSteps.refetch(), historique.refetch(), montants.refetch(), fiche.refetch()]);
    // Une sortie libère le lot, une réactivation le réoccupe : sa disponibilité change.
    await articleDetails.refetch();
    showToast(`Statut changé : ${canonicalStatusLabel(newStatus)}.`);
  }

  const echeancesVides = echeances.data?.totalElements === 0;

  return (
    <CadreFiche
      variante={variante}
      title={d.clientNom || d.code || 'Dossier'}
      crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}
      typeFiche="Dossier de vente"
      fullHeight
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      entete={<EnteteDossier dossier={d} fiche={fiche.data} sorti={!!montants.data?.dossierSorti} />}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ActionsFicheDossier dossierId={d.id} commercialNom={d.commercialNom} onChanged={() => void relireTout()} />
          <Button variant="outline" size="sm" onClick={() => showToast('Intégration VOIP à venir.')}>
            <Phone data-icon="inline-start" /> Appeler
          </Button>
          {d.prospectionId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/prospections/${d.prospectionId}`)}>
              <ArrowUpRight data-icon="inline-start" /> Prospection
            </Button>
          )}
          {d.clientId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${d.clientId}`)}>
              <ArrowUpRight data-icon="inline-start" /> Fiche client
            </Button>
          )}
        </div>
      }
    >
      <FicheShell
        ongletActif={tab}
        onOngletChange={setTab}
        identite={
          <div className="flex flex-col gap-1.5">
            <BandeauxDossier fiche={fiche.data} />
            {fromCreation && !echeances.error && echeances.data && <MessageCreation vide={echeancesVides} />}
          </div>
        }
        /* Lecture seule : les champs se modifient dans un autre lot ; ici statut, échéancier et actions. */
        formulaire={<FormulaireDossier dossier={d} enTete={fiche.data?.enTete} />}
        panneau={<PanneauDossier dossier={d} montants={montants} />}
        onglets={[
          {
            id: 'statut',
            libelle: 'Statut',
            contenu: <OngletStatut dossier={d} fiche={fiche.data} etapesSuivantes={nextSteps.data ?? []} onConfirm={changerStatut} />,
          },
          {
            id: 'financier',
            libelle: 'Schéma de financement',
            compteur: echeances.data?.totalElements ?? 0,
            contenu: (
              <OngletEcheancier
                dossier={d}
                echeances={echeances}
                onPageChange={setEcheancesPage}
                onChanged={relireEcheancier}
                fromCreation={fromCreation}
              />
            ),
          },
          { id: 'autres-montants', libelle: 'Autres montants', contenu: <OngletAutresMontants fiche={fiche} /> },
          { id: 'dates', libelle: 'Dates', contenu: <OngletDates fiche={fiche} /> },
          { id: 'dates-autres', libelle: 'Dates autres', contenu: <OngletDatesAutres fiche={fiche} /> },
          { id: 'annulation', libelle: 'Annulation / Résiliation', contenu: <OngletAnnulation fiche={fiche} /> },
          { id: 'autres', libelle: 'Autres', contenu: <OngletAutres fiche={fiche} /> },
          {
            id: 'articles',
            libelle: 'Articles',
            compteur: d.articles?.length ?? 0,
            contenu: <OngletArticles articles={d.articles} details={articleDetails} />,
          },
          { id: 'acquereurs', libelle: 'Acquéreurs', contenu: <OngletAcquereurs dossier={d} /> },
          {
            id: 'actions',
            libelle: 'Actions',
            compteur: actions.data?.actions.length ?? 0,
            contenu: <OngletActions dossierId={d.id} actions={actions} onChanged={relireActions} />,
          },
          {
            id: 'pieces',
            libelle: 'Pièces jointes',
            compteur: pieces.data?.length ?? 0,
            contenu: <OngletPiecesJointes dossierId={d.id} pieces={pieces} />,
          },
          { id: 'documents', libelle: 'Documents générés', contenu: <OngletDocumentsGeneres dossierId={d.id} code={d.code} /> },
          {
            id: 'historique',
            libelle: 'Historique',
            compteur: historique.data?.totalElements ?? 0,
            contenu: <OngletHistorique historique={historique} onPageChange={setHistoriquePage} />,
          },
        ]}
      />
    </CadreFiche>
  );
}
