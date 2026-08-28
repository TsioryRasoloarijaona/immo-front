import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import type { BadgeTone } from '../types';
import { Badge as ShadcnBadge } from './ui/badge';
import { Card as ShadcnCard, CardAction, CardContent, CardHeader, CardTitle } from './ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { Avatar as ShadcnAvatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ShadcnBadge variant={tone} className={cn('gap-1.5', className)}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
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
  progress: { fg: 'var(--brand)', bg: 'var(--brand-bg)' },
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
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={cn('text-[19px] font-semibold tracking-tight', tone === 'neutral' && 'text-foreground')} style={tone !== 'neutral' ? { color: fg } : undefined}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
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
      <div className="mb-0 text-[11px] font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          'break-words text-[13px] font-medium text-foreground',
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
        <CardHeader className="gap-0 border-b border-border py-1.75">
          <CardTitle className="flex items-center gap-1.5 text-[13px]">
            {accent && <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: accent }} />}
            {title}
          </CardTitle>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={padded ? 'py-2.5' : 'px-0 py-0'}>{children}</CardContent>
    </ShadcnCard>
  );
}

export function LoadingState() {
  return (
    <Empty className="border-none py-17.5">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-[13px] text-muted-foreground">Chargement des données…</p>
    </Empty>
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

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Empty className="border-none py-17.5">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

/** Same amber "Bientôt" pill used in ModuleSwitcher for not-yet-active
 * modules — reused here for filter controls that are visually built but
 * still waiting on backend support. */
export function SoonBadge({ children = 'Bientôt' }: { children?: ReactNode }) {
  return (
    <span className="rounded-full bg-(--amber-bg) px-1.75 py-0.5 text-[10px] font-bold text-(--amber)">
      {children}
    </span>
  );
}

export function TogglePill({ on, onLabel = 'Activé', offLabel = 'Désactivé' }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold',
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
