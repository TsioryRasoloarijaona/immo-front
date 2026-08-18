import { useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import PageShell from '../components/PageShell';
import { Card, EmptyState } from '../components/ui';
import { Button } from '../components/ui/button';
import { usePreview } from '../lib/previewContext';
import { useStore } from '../lib/storeContext';
import { communicationIcon, prospectionDisplayName } from '../lib/domain';
import { todayISO } from '../lib/format';
import { cn } from '../lib/utils';
import type { Communication } from '../types';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

interface AppointmentEntry {
  communication: Communication;
  time: string | null;
  target: { type: 'dossier' | 'prospection'; id: string } | null;
  personName: string;
}

export default function RendezVous() {
  const { communications, prospections, dossiers, loading } = useStore();
  const { previewProspection, previewDossier } = usePreview();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentEntry[]>();
    for (const c of communications) {
      if (!c.appointmentDate) continue;
      const dateKey = c.appointmentDate.slice(0, 10);
      const time = c.appointmentDate.length > 10 ? c.appointmentDate.slice(11, 16) : null;
      const target = c.prospectionId
        ? ({ type: 'prospection', id: c.prospectionId } as const)
        : c.folderId
          ? ({ type: 'dossier', id: c.folderId } as const)
          : null;
      const personName =
        target?.type === 'prospection'
          ? prospectionDisplayName(prospections.find((p) => p.id === target.id) ?? { displayName: '', prospect: null })
          : target?.type === 'dossier'
            ? dossiers.find((d) => d.id === target.id)?.client?.name || 'Client'
            : 'Sans lien';
      const entry: AppointmentEntry = { communication: c, time, target, personName };
      const list = map.get(dateKey);
      if (list) list.push(entry);
      else map.set(dateKey, [entry]);
    }
    for (const list of map.values()) list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    return map;
  }, [communications, prospections, dossiers]);

  const upcoming = useMemo(() => {
    const flat: AppointmentEntry[] = [];
    for (const [dateKey, list] of appointmentsByDate) {
      if (dateKey < today) continue;
      for (const entry of list) flat.push(entry);
    }
    return flat
      .sort((a, b) => {
        const ad = a.communication.appointmentDate ?? '';
        const bd = b.communication.appointmentDate ?? '';
        return ad < bd ? -1 : ad > bd ? 1 : 0;
      })
      .slice(0, 8);
  }, [appointmentsByDate, today]);

  if (loading) return null;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => new Date(year, month, i - startWeekday + 1));

  const totalThisMonth = cells.reduce((sum, date) => {
    if (date.getMonth() !== month) return sum;
    return sum + (appointmentsByDate.get(ymd(date))?.length ?? 0);
  }, 0);

  function openTarget(target: AppointmentEntry['target']): (() => void) | null {
    if (!target) return null;
    return target.type === 'dossier' ? () => previewDossier(target.id) : () => previewProspection(target.id);
  }

  return (
    <PageShell
      title="Rendez-vous"
      crumbs={[{ label: 'Ventes' }, { label: 'Rendez-vous' }]}
      actions={
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mois précédent">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1))}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mois suivant">
            <ChevronRight />
          </Button>
        </div>
      }
    >
      <p className="mb-4 max-w-[640px] text-[12.5px] text-muted-foreground">
        Tous les rendez-vous planifiés (visites, signatures…) depuis une fiche prospection ou un dossier de vente —
        via « Ajouter un appel / une visite ». Cliquez sur un rendez-vous pour ouvrir le dossier ou la prospection
        liée.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="text-[14.5px] font-semibold text-foreground">
              {MONTH_LABELS[month]} {year}
            </h3>
            <span className="text-xs text-muted-foreground">
              {totalThisMonth} rendez-vous ce mois-ci
            </span>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border text-[11px] font-semibold text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="bg-card px-2 py-1.5 text-center">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {cells.map((date) => {
              const key = ymd(date);
              const inMonth = date.getMonth() === month;
              const isToday = key === today;
              const entries = appointmentsByDate.get(key) ?? [];
              const visible = entries.slice(0, 3);
              const overflow = entries.length - visible.length;
              return (
                <div
                  key={key}
                  className={cn('flex min-h-[104px] flex-col gap-1 bg-card p-1.5', !inMonth && 'bg-background/40')}
                >
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      isToday ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                    )}
                  >
                    {date.getDate()}
                  </div>
                  <div className="flex flex-col gap-1">
                    {visible.map((entry) => {
                      const onOpen = openTarget(entry.target);
                      const chip = (
                        <div
                          className={cn(
                            'flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10.5px] font-medium',
                            'bg-[var(--brand-bg)] text-[var(--brand)]',
                            onOpen && 'hover:bg-[var(--brand-border)]',
                          )}
                          title={`${entry.time ? entry.time + ' — ' : ''}${entry.communication.appointmentLabel || entry.communication.actionType} · ${entry.personName}`}
                        >
                          <span className="shrink-0 [&_svg]:size-2.5">{communicationIcon(entry.communication.actionType)}</span>
                          <span className="truncate">
                            {entry.time && <span className="tabular-nums">{entry.time} </span>}
                            {entry.communication.appointmentLabel || entry.personName}
                          </span>
                        </div>
                      );
                      return onOpen ? (
                        <button type="button" key={entry.communication.id} onClick={onOpen} className="block w-full text-left">{chip}</button>
                      ) : (
                        <div key={entry.communication.id}>{chip}</div>
                      );
                    })}
                    {overflow > 0 && (
                      <div className="px-1.5 text-[10.5px] font-medium text-muted-foreground">+{overflow} autre{overflow > 1 ? 's' : ''}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Prochains rendez-vous">
          {upcoming.length === 0 ? (
            <EmptyState
              title="Aucun rendez-vous planifié"
              message="Utilisez « Ajouter un appel / une visite » sur une prospection ou un dossier pour en planifier un."
            />
          ) : (
            <div className="flex flex-col">
              {upcoming.map((entry) => {
                const onOpen = openTarget(entry.target);
                const body = (
                  <>
                    <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-bg)] text-[var(--brand)] [&_svg]:size-[15px]">
                      {communicationIcon(entry.communication.actionType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-foreground">
                        {entry.communication.appointmentLabel || entry.communication.actionType}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{entry.personName}</div>
                    </div>
                    <div className="shrink-0 text-right text-[11.5px] font-semibold text-foreground">
                      {entry.communication.appointmentDate?.slice(8, 10)}/{entry.communication.appointmentDate?.slice(5, 7)}
                      {entry.time && <div className="font-normal text-muted-foreground">{entry.time}</div>}
                    </div>
                  </>
                );
                return onOpen ? (
                  <button
                    type="button"
                    key={entry.communication.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left text-inherit last:border-b-0"
                  >
                    {body}
                  </button>
                ) : (
                  <div key={entry.communication.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {communications.every((c) => !c.appointmentDate) && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          Aucun rendez-vous n'existe encore dans cet échantillon — la planification de RDV est une fonctionnalité de
          ce prototype (non présente dans l'export d'origine), à créer via « Ajouter un appel / une visite ».
        </div>
      )}
    </PageShell>
  );
}
