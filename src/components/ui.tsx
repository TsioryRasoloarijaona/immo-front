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

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <ShadcnCard size="sm" className="gap-2 px-5 py-4.5">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground [&_svg]:size-[15px] [&_svg]:opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-[25px] font-semibold tracking-tight text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
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
      <div className="mb-0.5 text-[11.5px] font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          'break-words text-[13.5px] font-medium text-foreground',
          (muted || isEmpty) && 'font-normal text-muted-foreground'
        )}
      >
        {isEmpty ? '—' : value}
      </div>
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-5 gap-y-4">{children}</div>;
}

export function Card({
  title,
  action,
  children,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <ShadcnCard className="gap-0 py-0">
      {title && (
        <CardHeader className="gap-0 border-b border-border py-4">
          <CardTitle className="text-[14.5px]">{title}</CardTitle>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={padded ? 'py-5' : 'px-0 py-0'}>{children}</CardContent>
    </ShadcnCard>
  );
}

export function LoadingState() {
  return (
    <Empty className="border-none py-[70px]">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-[13px] text-muted-foreground">Chargement des données…</p>
    </Empty>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Empty className="border-none py-[70px]">
      <EmptyHeader>
        <EmptyTitle>Impossible de charger les données</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Empty className="border-none py-[70px]">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

export function TogglePill({ on, onLabel = 'Activé', offLabel = 'Désactivé' }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold',
        on ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--neutral-bg)] text-muted-foreground'
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold [&_svg]:size-[13px]',
        warning
          ? 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]'
          : 'border-[var(--brand-border)] bg-[var(--brand-bg)] text-[var(--brand)]'
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
      <AvatarFallback className="bg-[var(--brand-bg)] font-semibold text-[var(--brand)]">{initials}</AvatarFallback>
    </ShadcnAvatar>
  );
}
