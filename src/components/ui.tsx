import type { ReactNode } from 'react';
import { AlertTriangle, Building2, Check, ChevronRight, Info, Loader2, X, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '../types';
import { Badge as ShadcnBadge } from './ui/badge';
import { Card as ShadcnCard, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { Avatar as ShadcnAvatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';
import { ETIQUETTE_CHAMP, GRILLE_CHAMPS, LIGNE_CHAMP, TEXTE_ETIQUETTE, VALEUR_CHAMP } from '../lib/ficheChamp';

/** Ne pas retirer : le glyphe rend le statut lisible sans la couleur
 * (accessibilité daltoniens, WCAG). `neutral` n'en a pas, volontairement :
 * l'absence de glyphe signifie « rien à signaler ». */
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
}: Readonly<{
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}>) {
  const Glyphe = TONE_GLYPH[tone];
  return (
    <ShadcnBadge variant={tone} className={cn('gap-1', className)}>
      {/* `data-badge-dot` est un crochet CSS d'index.css : ne pas le renommer. */}
      {Glyphe && <Glyphe aria-hidden data-badge-dot="" className="size-3 shrink-0" />}
      {children}
    </ShadcnBadge>
  );
}

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
}: Readonly<{
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: BadgeTone;
}>) {
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
}: Readonly<{
  label: string;
  value: ReactNode;
  muted?: boolean;
}>) {
  const isEmpty = value === null || value === undefined || value === '' || value === '—';
  return (
    <div className={LIGNE_CHAMP}>
      <dt className={cn(ETIQUETTE_CHAMP, TEXTE_ETIQUETTE)} title={label}>{label}</dt>
      <dd className={cn(VALEUR_CHAMP, (muted || isEmpty) && 'font-normal text-muted-foreground')}>
        {isEmpty ? '—' : value}
      </dd>
    </div>
  );
}

export function FieldGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <dl className={GRILLE_CHAMPS}>{children}</dl>;
}

export function Card({
  title,
  action,
  children,
  padded = true,
  className,
  accent,
}: Readonly<{
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  className?: string;
  /** Une couleur CSS, ex. `var(--sec-dossier)`. */
  accent?: string;
}>) {
  return (
    <ShadcnCard
      className={cn('gap-0 py-0', accent && 'border-l-2', className)}
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      {title && (
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

/** Garde la page précédente à l'écran pendant un rechargement (rendre sur
 * `data`, pas sur `!loading`). `pointer-events-none` empêche de cliquer une
 * ligne sur le point d'être remplacée. */
export function ResultsRegion({
  loading,
  className,
  children,
}: Readonly<{
  loading: boolean;
  className?: string;
  children: ReactNode;
}>) {
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

export function ErrorState({ message }: Readonly<{ message: string }>) {
  return (
    <Empty className="border-none py-17.5">
      <EmptyHeader>
        <EmptyTitle>Impossible de charger les données</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: Readonly<{
  title: string;
  message?: string;
  action?: ReactNode;
}>) {
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

export function TogglePill({ on, onLabel = 'Activé', offLabel = 'Désactivé' }: Readonly<{ on: boolean; onLabel?: string; offLabel?: string }>) {
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

export function Chip({ children, warning }: Readonly<{ children: ReactNode; warning?: boolean }>) {
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

/** Sans ce bandeau, une liste filtrée côté serveur au périmètre du commercial
 * passerait pour une perte de données. `projets` vide = aucune restriction. */
export function PerimetreBanner({ projets }: Readonly<{ projets: { code: string }[] }>) {
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

/** `false` (compte sans adresse ou envoi inactif) : le mot de passe affiché est le
 * seul exemplaire. `true` ne promet que le déclenchement, l'envoi est asynchrone. */
export function EnvoiMailNotice({ envoye, destinataire }: Readonly<{ envoye?: boolean; destinataire?: string | null }>) {
  if (envoye === undefined) return null;
  if (!envoye) {
    return (
      <p role="alert" className="rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
        Aucun email envoyé — transmettez ces identifiants. Le mot de passe ne sera plus jamais affiché.
      </p>
    );
  }
  return (
    <p role="status" className="rounded-md border border-(--info-border) bg-(--info-bg) px-3 py-2 text-body text-(--info)">
      Identifiants envoyés{destinataire ? ` à ${destinataire}` : ''}. La remise n'est pas garantie : gardez-les
      sous la main jusqu'à confirmation.
    </p>
  );
}

export function Avatar({ name, small }: Readonly<{ name: string | null | undefined; small?: boolean }>) {
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
