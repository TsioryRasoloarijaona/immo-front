import { useState, type ComponentType } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  FilePlus2,
  Folder,
  History,
  Link2,
  MessageSquare,
  TrendingUp,
  UserPlus,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';
import { listActionsRecentes } from '../lib/api';
import { useApi } from '../lib/useApi';
import { usePreview, type FicheCible } from '../lib/previewContext';
import { formatHeure, formatJourRelatif } from '../lib/format';
import { cn } from '../lib/utils';
import type { ActionRecente, CibleActionRecente, PorteeActionsRecentes, TypeActionRecente } from '../types';

const PAGE = 20;
const CLE_ONGLET = 'actionsRecentes.onglet';

// Partiel : un type ajouté côté serveur retombe sur l'icône par défaut.
const ICONES: Partial<Record<TypeActionRecente, ComponentType<{ className?: string }>>> = {
  PRE_PROSPECTION_CREEE: UserPlus,
  PROSPECT_CREE: UserRoundPlus,
  PROSPECT_RATTACHE: Link2,
  TRANSFORMEE_EN_PROSPECTION: ArrowRightLeft,
  PROSPECTION_CREEE: FilePlus2,
  ETAPE_CHANGEE: TrendingUp,
  ARCHIVEE: Archive,
  DESARCHIVEE: ArchiveRestore,
  COMMERCIAL_ASSIGNE: UserRoundPlus,
  COMMERCIAL_REAFFECTE: ArrowRightLeft,
  DOSSIER_STATUT: Folder,
  INTERACTION: MessageSquare,
  AUTRE: History,
};

const CIBLES: Record<CibleActionRecente, { libelle: string; article: string; couleur: string }> = {
  PRE_PROSPECTION: { libelle: 'Pré-prospection', article: 'la pré-prospection', couleur: 'var(--sec-preprospection)' },
  PROSPECTION: { libelle: 'Prospection', article: 'la prospection', couleur: 'var(--sec-prospection)' },
  DOSSIER: { libelle: 'Dossier', article: 'le dossier', couleur: 'var(--sec-dossier)' },
};

function ficheDeLaCible(type: CibleActionRecente, id: string): FicheCible {
  if (type === 'DOSSIER') return { type: 'dossier', id };
  return { type: 'prospection', id, pre: type === 'PRE_PROSPECTION' };
}

function lireOnglet(): PorteeActionsRecentes {
  try {
    return window.localStorage.getItem(CLE_ONGLET) === 'EQUIPE' ? 'EQUIPE' : 'MOI';
  } catch {
    return 'MOI';
  }
}

function ecrireOnglet(portee: PorteeActionsRecentes): void {
  try {
    window.localStorage.setItem(CLE_ONGLET, portee);
  } catch {
    // Stockage indisponible (navigation privée) : l'onglet n'est simplement pas retenu.
  }
}

// Le panneau n'est monté qu'ouvert : chaque ouverture relit le flux, il n'y a pas de polling.
export default function ActionsRecentes() {
  const [ouvert, setOuvert] = useState(false);
  const [portee, setPortee] = useState<PorteeActionsRecentes>(lireOnglet);
  const { isMobile, setOpenMobile } = useSidebar();
  const { ouvrirFicheProspection, ouvrirFicheDossier, ouvrirFicheProspect } = usePreview();

  const changerPortee = (valeur: PorteeActionsRecentes) => {
    setPortee(valeur);
    ecrireOnglet(valeur);
  };

  const ouvrir = (cible: FicheCible) => {
    setOuvert(false);
    setOpenMobile(false);
    // Popover fermé d'abord : deux pièges à focus ouverts en même temps se
    // disputent le focus. Le timer survit au démontage de la barre mobile.
    window.setTimeout(() => {
      if (cible.type === 'prospection') ouvrirFicheProspection(cible.id, cible.pre);
      else if (cible.type === 'dossier') ouvrirFicheDossier(cible.id);
      else ouvrirFicheProspect(cible.id);
    }, 0);
  };

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<PopoverTrigger />} isActive={ouvert} tooltip="Actions récentes">
            <History aria-hidden />
            Actions récentes
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <PopoverContent
        side={isMobile ? 'top' : 'right'}
        align="end"
        aria-label="Actions récentes"
        className="flex max-h-[min(70vh,36rem)] w-[min(26rem,calc(100vw-2rem))] flex-col gap-0 p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
          <h2 className="text-label font-semibold text-foreground">Actions récentes</h2>
          <PopoverClose
            render={<Button variant="ghost" size="icon-sm" aria-label="Fermer les actions récentes" />}
          >
            <X aria-hidden />
          </PopoverClose>
        </div>
        <Tabs
          value={portee}
          onValueChange={(v) => changerPortee(v as PorteeActionsRecentes)}
          className="min-h-0 flex-1 gap-0"
        >
          <div className="px-3.5 pt-2.5 pb-1">
            <TabsList className="w-full">
              <TabsTrigger value="MOI">Mes actions</TabsTrigger>
              <TabsTrigger value="EQUIPE">Équipe</TabsTrigger>
            </TabsList>
          </div>
          {/* Une clé par onglet : changer d'onglet repart d'une liste neuve (pas de « Voir plus » hérité). */}
          <TabsContent value={portee} className="flex min-h-0 flex-col">
            <ListeActions key={portee} portee={portee} onOuvrir={ouvrir} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function ListeActions({
  portee,
  onOuvrir,
}: Readonly<{
  portee: PorteeActionsRecentes;
  onOuvrir: (cible: FicheCible) => void;
}>) {
  const { data, loading, error, refetch } = useApi(() => listActionsRecentes(portee, PAGE), [portee]);
  const [suite, setSuite] = useState<ActionRecente[]>([]);
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const [erreurSuite, setErreurSuite] = useState<string | null>(null);
  const [fin, setFin] = useState(false);

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <p className="text-label font-medium text-foreground">Impossible de charger les actions récentes.</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!data) {
    return loading ? <Squelette /> : null;
  }

  // Les ids déjà affichés sont écartés : un « Voir plus » rejoué ne duplique rien.
  const vus = new Set(data.map((a) => a.id));
  const actions = [...data, ...suite.filter((a) => !vus.has(a.id))];

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
        <p className="text-label font-medium text-foreground">Aucune action récente.</p>
        {portee === 'MOI' && (
          <p className="max-w-64 text-xs text-muted-foreground">
            Vos transformations, changements d'étape, notes et archivages apparaîtront ici.
          </p>
        )}
      </div>
    );
  }

  const peutContinuer = !fin && data.length === PAGE;

  const voirPlus = () => {
    const derniere = actions[actions.length - 1];
    setSuiteEnCours(true);
    setErreurSuite(null);
    listActionsRecentes(portee, PAGE, derniere)
      .then((page) => {
        setSuite((avant) => [...avant, ...page]);
        if (page.length < PAGE) setFin(true);
      })
      .catch((e: unknown) => setErreurSuite(e instanceof Error ? e.message : 'Erreur inconnue.'))
      .finally(() => setSuiteEnCours(false));
  };

  const groupes: { jour: string; actions: ActionRecente[] }[] = [];
  for (const action of actions) {
    const jour = action.date.slice(0, 10);
    const dernier = groupes.at(-1);
    if (dernier?.jour === jour) dernier.actions.push(action);
    else groupes.push({ jour, actions: [action] });
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2.5" aria-busy={loading}>
      {groupes.map((g) => (
        <section key={g.jour} aria-label={formatJourRelatif(g.jour)}>
          <h3 className="sticky top-0 z-10 bg-popover px-2 pt-2.5 pb-1 text-micro font-semibold tracking-wide text-muted-foreground uppercase">
            {formatJourRelatif(g.jour)}
          </h3>
          <ul className="flex flex-col">
            {g.actions.map((a) => (
              <LigneAction key={a.id} action={a} equipe={portee === 'EQUIPE'} onOuvrir={onOuvrir} />
            ))}
          </ul>
        </section>
      ))}
      {erreurSuite && (
        <p role="alert" className="px-2 pt-2 text-xs text-destructive">
          {erreurSuite}
        </p>
      )}
      {peutContinuer && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={voirPlus} disabled={suiteEnCours}>
            {suiteEnCours ? 'Chargement…' : 'Voir plus'}
          </Button>
        </div>
      )}
    </div>
  );
}

function LigneAction({
  action,
  equipe,
  onOuvrir,
}: Readonly<{
  action: ActionRecente;
  equipe: boolean;
  onOuvrir: (cible: FicheCible) => void;
}>) {
  const Icone = ICONES[action.type] ?? History;
  const cible = CIBLES[action.cibleType];
  const prospectId =
    action.type === 'PROSPECT_CREE' || action.type === 'PROSPECT_RATTACHE' ? action.prospectId : null;

  return (
    <li className="flex gap-2.5 rounded-md px-2 py-2 hover:bg-muted/60">
      <span className="w-10 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
        {formatHeure(action.date) ?? '00:00'}
      </span>
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-label leading-snug text-foreground">
          <span className="font-medium">{action.cibleLibelle}</span>
          <span className="text-muted-foreground"> — </span>
          <span className="break-words">{action.libelle}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span
            className="rounded-full border border-border px-1.5 py-px text-micro font-medium"
            style={{ color: cible.couleur }}
          >
            {cible.libelle}
          </span>
          {equipe && (
            <span className={cn('text-muted-foreground', !action.auteurNom && 'italic')}>
              {action.auteurNom ? `par ${action.auteurNom}` : 'auteur inconnu'}
            </span>
          )}
          <button
            type="button"
            onClick={() => onOuvrir(ficheDeLaCible(action.cibleType, action.cibleId))}
            aria-label={`Ouvrir ${cible.article} ${action.cibleLibelle}`}
            className="rounded-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Ouvrir
          </button>
          {prospectId && (
            <button
              type="button"
              onClick={() => onOuvrir({ type: 'prospect', id: prospectId })}
              aria-label={`Ouvrir la fiche du prospect ${action.cibleLibelle}`}
              className="rounded-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Prospect
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function Squelette() {
  return (
    <div aria-busy className="flex flex-col gap-3 px-3.5 py-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-2.5">
          <Skeleton className="h-3.5 w-9" />
          <Skeleton className="size-4 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
