import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, CalendarClock, ChevronDown, Download, Map, Pencil, Printer, Trash2, TrendingUp } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ArticlesTranche from '../../components/patrimoine/ArticlesTranche';
import ChampsSpecifiques from '../../components/patrimoine/ChampsSpecifiques';
import DialogueChargerDepuisTranche from '../../components/patrimoine/DialogueChargerDepuisTranche';
import DialogueMiseAJourSchemas from '../../components/patrimoine/DialogueMiseAJourSchemas';
import DialoguePremieresRelances from '../../components/patrimoine/DialoguePremieresRelances';
import DialoguePrevisionsBase from '../../components/patrimoine/DialoguePrevisionsBase';
import DialogueFicheReservation from '../../components/patrimoine/impressions/DialogueFicheReservation';
import DialogueRelance2 from '../../components/patrimoine/impressions/DialogueRelance2';
import MenuImprimerTranche from '../../components/patrimoine/impressions/MenuImprimerTranche';
import { SectionFiche } from '../../components/patrimoine/FicheSections';
import PiecesJointesBloc from '../../components/patrimoine/PiecesJointesBloc';
import FicheShell from '../../components/FicheShell';
import { Badge, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button, buttonVariants } from '../../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { getTranche } from '../../lib/api';
import { deleteTranche } from '../../lib/apiPatrimoine';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import { libelleTrace } from '../../lib/format';
import { ongletsTransverses } from '../../lib/ongletsTransverses';
import { SECTIONS_TRANCHE } from '../../lib/saisieTranche';
import { useOngletsTranche } from '../../lib/useOngletsTranche';

type DialogueTranche = 'previsions' | 'schemas' | 'charger' | 'relances' | 'relance2' | 'reservation';

export default function TrancheDetail() {
  const { id = '' } = useParams();
  return <FicheTranche key={id} id={id} />;
}

/** Actions secondaires d'administration regroupées : la barre d'actions tient sur une ligne à 1 280 px. */
function MenuAutresActions({ onDialogue, onSupprimer }: Readonly<{ onDialogue: (d: DialogueTranche) => void; onSupprimer: () => void }>) {
  const { user } = useAuth();
  if (!estAdministrateur(user)) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Plus <ChevronDown className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuItem onClick={() => onDialogue('previsions')}><TrendingUp /> Prévisions de base</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDialogue('schemas')}><CalendarClock /> Mettre à jour les schémas de financement</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDialogue('charger')}><Download /> Charger à partir d'une autre tranche</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDialogue('relances')}><Printer /> Imprimer les premières relances</DropdownMenuItem>
        <DropdownMenuItem onClick={onSupprimer}><Trash2 /> Supprimer</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FicheTranche({ id }: Readonly<{ id: string }>) {
  const { data: t, loading, error, refetch } = useApi(() => getTranche(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<DialogueTranche | null>(null);
  const [version, setVersion] = useState(0);
  const [onglet, setOnglet] = useState(SECTIONS_TRANCHE[0].titre);
  const ongletsTranche = useOngletsTranche(id, () => void refetch());

  async function supprimer() {
    const oui = await confirm({
      title: 'Supprimer la tranche',
      message: 'La tranche, ses onglets, ses habilitations, pièces jointes et notes seront supprimés. Continuer ?',
      confirmLabel: 'Supprimer',
    });
    if (!oui) return;
    try {
      await deleteTranche(id);
      void navigate('/tranches');
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  // `!t` : un rechargement (plancher couvert enregistré) garde la fiche et l'onglet ouvert.
  if (loading && !t) return <PageShell title="Tranche"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranche"><ErrorState message={error} /></PageShell>;
  if (!t) {
    return (
      <PageShell title="Tranche introuvable" crumbs={[{ label: 'Tranches', to: '/tranches' }]}>
        <p>Cette tranche n'existe pas.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t.description || t.code || 'Tranche'}
      crumbs={[{ label: 'Tranches', to: '/tranches' }, { label: t.code || '' }]}
      icon={<Building2 />}
      fullHeight
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void navigate(`/tranches/${id}/plans`)}>
            <Map data-icon="inline-start" /> Plans
          </Button>
          <MenuImprimerTranche trancheId={id} onDialogue={setDialogue} />
          <MenuAutresActions onDialogue={setDialogue} onSupprimer={() => void supprimer()} />
          <ActionAdmin to={`/tranches/${id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
          <ActionAdmin to={`/articles/nouveau?trancheId=${id}`} libelle="Nouvel article" />
        </div>
      }
    >
      <FicheShell
        key={version}
        ongletActif={onglet}
        onOngletChange={setOnglet}
        rembourrer
        identite={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-title font-semibold tracking-tight text-foreground">{t.description}</h2>
            <span className="font-mono text-micro text-muted-foreground">{t.code}</span>
            {t.standingLibelle && <Badge tone="info">{t.standingLibelle}</Badge>}
            {t.estEnVente && <Badge tone="info">Vente</Badge>}
            {t.estEnLocation && <Badge tone="info">Location</Badge>}
            {erreurSuppression && <span role="alert" className="text-label text-destructive">{erreurSuppression}</span>}
          </div>
        }
        onglets={[
          ...SECTIONS_TRANCHE.map((section) => ({
            id: section.titre,
            libelle: section.titre,
            contenu: <SectionFiche section={section} source={t} />,
          })),
          {
            id: 'tracabilite',
            libelle: 'Traçabilité',
            contenu: (
              <FieldGrid>
                <Field label="Entité" value={t.entiteCode} />
                <Field label="Créé par" value={libelleTrace(t.creePar, t.creeLe)} />
                <Field label="Modifié par" value={libelleTrace(t.modifiePar, t.modifieLe)} />
              </FieldGrid>
            ),
          },
          { id: 'articles', libelle: 'Articles', contenu: <ArticlesTranche trancheId={id} /> },
          ...ongletsTranche,
          { id: 'pieces', libelle: 'Pièces jointes', contenu: <PiecesJointesBloc porteur="tranches" id={id} /> },
          { id: 'champs', libelle: 'Champs spécifiques', contenu: <ChampsSpecifiques porteur="tranche" id={id} /> },
          ...ongletsTransverses('tranche', id),
        ]}
      />

      {dialogue === 'previsions' && <DialoguePrevisionsBase trancheId={id} onClose={() => setDialogue(null)} />}
      {dialogue === 'schemas' && <DialogueMiseAJourSchemas trancheId={id} onClose={() => setDialogue(null)} />}
      {dialogue === 'relances' && <DialoguePremieresRelances trancheId={id} onClose={() => setDialogue(null)} />}
      {dialogue === 'relance2' && <DialogueRelance2 trancheId={id} onClose={() => setDialogue(null)} />}
      {dialogue === 'reservation' && <DialogueFicheReservation trancheId={id} onClose={() => setDialogue(null)} />}
      {dialogue === 'charger' && (
        <DialogueChargerDepuisTranche trancheId={id} onClose={() => setDialogue(null)}
          onCharge={() => { setVersion((v) => v + 1); void refetch(); }} />
      )}
    </PageShell>
  );
}
