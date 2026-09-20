import type { ReactNode } from 'react';
import { AlertTriangle, Building2, Check, ChevronRight, Info, Loader2, X, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '../types';
import { Badge as ShadcnBadge } from './ui/badge';
import { Card as ShadcnCard, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { Avatar as ShadcnAvatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

/** Glyphe par ton — **c'est ici que vit le sens des statuts.**
 *
 * La palette est achromatique (voir l'en-tête d'index.css), donc la couleur ne
 * peut plus distinguer « abouti » de « annulé ». Le pas de gris classe
 * l'*attention* ; ce glyphe nomme le *genre*.
 *
 * Dérivé du ton et non du statut métier : les six fonctions de `lib/`
 * (`toneForStatus`, `etapeBadgeTone`, `encaissementEtatTone`,
 * `pieceJointeTypeTone`, `echeanceCategorieTone`, `echeanceStatutTone`)
 * retournent déjà un `BadgeTone`. Une table sur les six tons couvre donc les
 * 215 sites d'appel **sans en toucher un seul**, et un statut ajouté plus tard
 * héritera de son glyphe gratuitement.
 *
 * `neutral` n'en a pas, volontairement : c'est le défaut, il concerne la
 * majorité des lignes, et un glyphe partout ne distingue plus rien. L'absence
 * de glyphe *est* l'information « rien à signaler ».
 *
 * Icônes SVG et non emoji ni caractères : à 11px un emoji rend selon la police
 * système et casse l'alignement vertical. */
const TONE_GLYPH: Record<BadgeTone, LucideIcon | null> = {
  neutral: null,
  info: Info,
  progress: ChevronRight,
  success: Check,
  amber: AlertTriangle,
  warning: X,
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  const Glyphe = TONE_GLYPH[tone];
  return (
    <ShadcnBadge variant={tone} className={cn('gap-1', className)}>
      {/* `data-badge-dot` est conservé comme crochet CSS (index.css s'en sert
          pour ajuster la pastille en cellule de tableau) même si ce n'est plus
          un point : le renommer aurait cassé la règle sans rien apporter. */}
      {Glyphe && <Glyphe aria-hidden data-badge-dot="" className="size-3 shrink-0" />}
      {children}
    </ShadcnBadge>
  );
}

/** Same reserved status hues `Badge`/`BadgeTone` draw from (see index.css) —
 * `StatCard`'s `tone` prop reuses them rather than inventing new colors, so
 * a "warning" stat and a "warning" badge always mean the same thing. */
const STAT_TONE_VARS: Record<BadgeTone, { fg: string; bg: string }> = {
  neutral: { fg: 'var(--muted-foreground)', bg: 'var(--neutral-bg)' },
  info: { fg: 'var(--info)', bg: 'var(--info-bg)' },
  progress: { fg: 'var(--progress)', bg: 'var(--progress-bg)' },
  success: { fg: 'var(--success)', bg: 'var(--success-bg)' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-bg)' },
  amber: { fg: 'var(--amber)', bg: 'var(--amber-bg)' },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  /** Colors the icon chip and the value text — same palette as `Badge`'s
   * `tone`. Defaults to the plain neutral look every StatCard had before. */
  tone?: BadgeTone;
}) {
  const { fg, bg } = STAT_TONE_VARS[tone];
  return (
    <ShadcnCard size="sm" className="gap-1.5 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        {icon && (
          <span
            aria-hidden
            className="flex size-5.5 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.25"
            style={{ color: fg, background: bg }}
          >
            {icon}
          </span>
        )}
        <span className="text-body font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={cn('text-page font-semibold tracking-tight', tone === 'neutral' && 'text-foreground')} style={tone !== 'neutral' ? { color: fg } : undefined}>
        {value}
      </div>
      {sub && <div className="text-micro text-muted-foreground">{sub}</div>}
    </ShadcnCard>
  );
}

export function Field({
  label,
  value,
  muted,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === '' || value === '—';
  return (
    <div className="min-w-0">
      <div className="mb-0 text-micro font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          'break-words text-label font-medium text-foreground',
          (muted || isEmpty) && 'font-normal text-muted-foreground'
        )}
      >
        {isEmpty ? '—' : value}
      </div>
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-4 gap-y-2.5">{children}</div>;
}

export function Card({
  title,
  action,
  children,
  padded = true,
  className,
  accent,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  className?: string;
  /** Optional section-identity accent (a CSS color, e.g.
   * `var(--sec-dossier)` — see index.css's "Section-identity accents"
   * block) — tints a left border plus a small dot before the title.
   * Purely a secondary/decorative cue, same rule as PageShell's icon chip:
   * the title text still names the card, color just reinforces which
   * entity it belongs to. */
  accent?: string;
}) {
  return (
    <ShadcnCard
      className={cn('gap-0 py-0', accent && 'border-l-2', className)}
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      {title && (
        /* py-2.5 (était 1.75) : respiration de la référence Uxerflow — le
           chrome s'aère, la grille de données garde sa densité. */
        <CardHeader className="gap-0 border-b border-border py-2.5">
          <CardTitle className="flex items-center gap-1.5 text-label">
            {accent && <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: accent }} />}
            {title}
          </CardTitle>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={padded ? 'py-3' : 'px-0 py-0'}>{children}</CardContent>
    </ShadcnCard>
  );
}

export function LoadingState() {
  return (
    <Empty className="border-none py-17.5">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-label text-muted-foreground">Chargement des données…</p>
    </Empty>
  );
}

/** Wrapper for a list page's results block (count + table + pagination) that
 * keeps the previous page of data on screen while the next one loads, instead
 * of unmounting it behind `LoadingState`.
 *
 * `useApi` already preserves `data` across a refetch — the lists were simply
 * choosing not to render it (`{!loading && !error && …}`), so every filter
 * change or keystroke collapsed the table, the result count and the
 * pagination to a centred spinner and then rebuilt them. That reads as a page
 * reload for what is really a partial update, and it makes the whole region
 * jump. Dimming the stale rows and marking the region `aria-busy` conveys the
 * same "working" state without the layout churn; the full `LoadingState` is
 * kept for the genuine first load, when there is nothing to keep.
 *
 * `pointer-events-none` while busy stops clicks landing on a row that is
 * about to be replaced by a different one. */
export function ResultsRegion({
  loading,
  className,
  children,
}: {
  loading: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-busy={loading}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2.5 transition-opacity duration-200 motion-reduce:transition-none',
        loading && 'pointer-events-none opacity-55',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Empty className="border-none py-17.5">
      <EmptyHeader>
        <EmptyTitle>Impossible de charger les données</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/** `action` renders a way *out* of the empty state — most often "Réinitialiser
 * les filtres" when a list came back empty because the filters excluded
 * everything. Telling someone to "ajustez vos filtres" while making them go
 * find the reset button themselves is a dead end; the escape hatch belongs
 * where the problem is reported. Optional, because plenty of empty states are
 * genuinely just "nothing here yet" with nothing to undo. */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <Empty className="border-none py-17.5">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

/** Same amber "Bientôt" pill used in ModuleSwitcher for not-yet-active
 * modules — reused here for filter controls that are visually built but
 * still waiting on backend support. */
export function SoonBadge({ children = 'Bientôt' }: { children?: ReactNode }) {
  return (
    <span className="rounded-full bg-(--amber-bg) px-1.75 py-0.5 text-micro font-bold text-(--amber)">
      {children}
    </span>
  );
}

export function TogglePill({ on, onLabel = 'Activé', offLabel = 'Désactivé' }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-body font-semibold',
        on ? 'bg-(--success-bg) text-(--success)' : 'bg-(--neutral-bg) text-muted-foreground'
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {on ? onLabel : offLabel}
    </span>
  );
}

export function Chip({ children, warning }: { children: ReactNode; warning?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold [&_svg]:size-3.25',
        warning
          ? 'border-(--warning-border) bg-(--warning-bg) text-(--warning)'
          : 'border-(--brand-border) bg-(--brand-bg) text-(--brand)'
      )}
    >
      {children}
    </span>
  );
}

/** Discreet-but-explicit "Périmètre limité à : ARS, MBR" indicator for the
 * prospections / pré-prospections / dossiers / encaissements lists
 * (FEATURE-perimetre-commercial.md §9.2). A restricted commercial's list is
 * server-filtered to their assigned projects; without this, a short result
 * count reads as a bug or lost data rather than a deliberate restriction.
 * Renders nothing for the unrestricted case (`projets` empty — zero
 * assigned projects, or an Administrateur/Direction Générale account, both
 * of which see everything per §6.2/§6.3), so callers can pass their
 * perimeter unconditionally rather than guarding the render themselves. */
export function PerimetreBanner({ projets }: { projets: { code: string }[] }) {
  if (projets.length === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-md bg-(--info-bg) px-3 py-1.75 text-body text-(--info)">
      <Building2 aria-hidden className="size-3.75 shrink-0" />
      <span>
        Périmètre limité à : <span className="font-semibold">{projets.map((p) => p.code).join(', ')}</span>
      </span>
    </div>
  );
}

/** Sort de l'envoi du mot de passe temporaire, sur les deux écrans qui en
 * génèrent un.
 *
 * `emailEnvoye === false` veut dire que le service d'envoi est inactif : le
 * mot de passe affiché juste à côté est alors **le seul exemplaire existant**,
 * et l'administrateur doit le transmettre lui-même. Sans ce mot, il referme
 * l'écran en supposant que l'employé a reçu son accès, et personne ne
 * s'aperçoit de rien avant que celui-ci ne tente de se connecter.
 *
 * `true` ne promet pas la remise, seulement le déclenchement — l'expédition
 * est asynchrone. Le libellé le dit ainsi plutôt que d'affirmer « envoyé ». */
export function EnvoiMailNotice({ envoye, destinataire }: { envoye?: boolean; destinataire?: string }) {
  if (envoye === undefined) return null;
  if (!envoye) {
    return (
      <p role="alert" className="rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
        Aucun mail n'a pu être envoyé (service d'envoi inactif). Communiquez vous-même le mot de passe
        ci-dessus : il ne sera plus jamais affiché.
      </p>
    );
  }
  return (
    <p role="status" className="rounded-md border border-(--info-border) bg-(--info-bg) px-3 py-2 text-body text-(--info)">
      Envoi déclenché{destinataire ? ` vers ${destinataire}` : ''}. La remise n'est pas garantie : gardez le
      mot de passe ci-dessus sous la main jusqu'à confirmation.
    </p>
  );
}

export function Avatar({ name, small }: { name: string | null | undefined; small?: boolean }) {
  const initials = (() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();
  return (
    <ShadcnAvatar size={small ? 'sm' : 'default'} className="after:hidden">
      <AvatarFallback className="bg-(--brand-bg) font-semibold text-(--brand)">{initials}</AvatarFallback>
    </ShadcnAvatar>
  );
}
