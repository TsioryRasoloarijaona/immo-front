import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Eye, MapPin } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getEvenementsCalendrier } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { usePreview } from '../../lib/previewContext';
import { isVisiteEvenement } from '../../lib/domain';
import { formatDate, formatHeure } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { EvenementCalendrierDto } from '../../types';

// Les anciens RDV sont à `T00:00:00` (saisis sans heure) : `formatHeure` les rend « jour entier »,
// sans inventer d'horaire.

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const mondayOffset = (first.getDay() + 6) % 7; // getDay(): 0=dimanche
  const gridStart = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function eventTone(ev: EvenementCalendrierDto): 'amber' | 'info' {
  return isVisiteEvenement(ev) ? 'amber' : 'info';
}

function EventPill({ ev, onClick }: Readonly<{ ev: EvenementCalendrierDto; onClick: () => void }>) {
  const visite = isVisiteEvenement(ev);
  const heure = formatHeure(ev.dateDebut);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-1.5 truncate rounded px-1.5 py-0.75 text-left text-micro font-medium',
        visite ? 'bg-(--amber-bg) text-(--amber)' : 'bg-(--info-bg) text-(--info)'
      )}
      title={`${heure ? `${heure} — ` : ''}${ev.sujet || (visite ? 'Visite' : 'Rendez-vous')}`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {heure && <span className="shrink-0 tabular-nums">{heure}</span>}
      <span className="truncate">{ev.prospectNom || ev.sujet || (visite ? 'Visite' : 'RDV')}</span>
    </button>
  );
}

function EventCard({ ev }: Readonly<{ ev: EvenementCalendrierDto }>) {
  const { previewProspection } = usePreview();
  const visite = isVisiteEvenement(ev);
  const heure = formatHeure(ev.dateDebut);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={eventTone(ev)}>{visite ? 'Visite' : 'Rendez-vous'}</Badge>
        {ev.resultatDescription && ev.resultatDescription !== ev.resultatCode && (
          <span className="text-micro text-muted-foreground">{ev.resultatDescription}</span>
        )}
      </div>
      <div className="text-label font-semibold text-foreground">{ev.prospectNom || 'Prospect inconnu'}</div>
      {ev.sujet && <div className="text-body text-muted-foreground">{ev.sujet}</div>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted-foreground">
        {heure && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="size-3" /> {heure}
          </span>
        )}
        {ev.lieu && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {ev.lieu}
          </span>
        )}
        {ev.commercialNom && <span>Commercial : {ev.commercialNom}</span>}
      </div>
      {ev.prospectionId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 self-start"
          onClick={() => previewProspection(ev.prospectionId as string)}
        >
          <Eye data-icon="inline-start" /> Voir la prospection
        </Button>
      )}
    </div>
  );
}

export default function Calendrier() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));

  const grid = useMemo(() => buildGrid(month), [month]);
  const gridStartISO = toISODate(grid[0]);
  const gridEndISO = toISODate(grid[grid.length - 1]);

  const { data, loading, error } = useApi(
    () => getEvenementsCalendrier(`${gridStartISO}T00:00:00`, `${gridEndISO}T23:59:59`),
    [gridStartISO, gridEndISO],
  );

  const events = useMemo(() => data ?? [], [data]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EvenementCalendrierDto[]>();
    for (const ev of events) {
      const day = (ev.dateDebut ?? '').slice(0, 10);
      if (!day) continue;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ev);
    }
    // L'ISO se compare tel quel ; les RDV « jour entier » (minuit) passent en tête.
    for (const list of map.values()) list.sort((a, b) => (a.dateDebut ?? '').localeCompare(b.dateDebut ?? ''));
    return map;
  }, [events]);

  const todayISO = toISODate(new Date());
  const selectedEvents = eventsByDay.get(selectedDate) ?? [];

  const upcoming = useMemo(
    () =>
      events
        .filter((ev) => (ev.dateDebut ?? '').slice(0, 10) >= todayISO)
        .sort((a, b) => (a.dateDebut ?? '').localeCompare(b.dateDebut ?? ''))
        .slice(0, 6),
    [events, todayISO],
  );

  return (
    <PageShell title="Calendrier" crumbs={[{ label: 'Calendrier' }]} icon={<Calendar />} accent="var(--sec-accent)" accentBg="var(--sec-accent-bg)" fullHeight>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-1 lg:flex-row">
        <Card
          padded={false}
          className="flex min-h-[420px] flex-1 flex-col lg:min-h-0 [&>[data-slot=card-content]]:flex [&>[data-slot=card-content]]:min-h-0 [&>[data-slot=card-content]]:flex-1 [&>[data-slot=card-content]]:flex-col"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2">
            <div className="text-title font-semibold text-foreground">
              {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
                Aujourd'hui
              </Button>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Mois précédent" onClick={() => setMonth((m) => addMonths(m, -1))}>
                <ChevronLeft />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Mois suivant" onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRight />
              </Button>
            </div>
          </div>

          {loading && <div className="p-4"><LoadingState /></div>}
          {error && <div className="p-4"><ErrorState message={error} /></div>}

          {!loading && !error && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="grid shrink-0 grid-cols-7 border-b border-border">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="px-2 py-1.5 text-center text-micro font-medium text-muted-foreground">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
                {grid.map((day) => {
                  const iso = toISODate(day);
                  const inMonth = day.getMonth() === month.getMonth();
                  const isToday = iso === todayISO;
                  const isSelected = iso === selectedDate;
                  const dayEvents = eventsByDay.get(iso) ?? [];
                  return (
                    // Pas un <button> : la cellule contient des boutons EventPill, et des
                    // éléments interactifs imbriqués sont du HTML invalide.
                    <div
                      role="button"
                      tabIndex={0}
                      key={iso}
                      onClick={() => setSelectedDate(iso)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDate(iso);
                        }
                      }}
                      className={cn(
                        'flex min-h-0 cursor-pointer flex-col items-stretch gap-0.5 overflow-hidden border-b border-r border-border p-1 text-left transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0 hover:bg-(--neutral-bg)',
                        !inMonth && 'bg-(--muted)',
                        isSelected && 'bg-(--brand-bg) hover:bg-(--brand-bg)'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex size-5.5 shrink-0 items-center justify-center self-start rounded-full text-body font-medium',
                          !inMonth && 'text-muted-foreground/60',
                          inMonth && !isToday && 'text-foreground',
                          isToday && 'bg-primary font-semibold text-primary-foreground'
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <EventPill key={ev.interactionId} ev={ev} onClick={() => setSelectedDate(iso)} />
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="px-1.5 text-micro font-medium text-muted-foreground">+{dayEvents.length - 2} autre(s)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <div className="flex min-h-0 w-full flex-col gap-3 lg:w-[320px] lg:shrink-0">
          <Card
            title={`Le ${formatDate(selectedDate)}`}
            className="flex min-h-0 flex-col [&>[data-slot=card-content]]:min-h-0 [&>[data-slot=card-content]]:overflow-y-auto"
          >
            {selectedEvents.length === 0 ? (
              <p className="py-1 text-body text-muted-foreground">Rien de prévu — aucun rendez-vous ni visite ce jour-là.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {selectedEvents.map((ev) => (
                  <EventCard key={ev.interactionId} ev={ev} />
                ))}
              </div>
            )}
          </Card>

          <Card
            title="À venir"
            className="flex min-h-0 flex-col [&>[data-slot=card-content]]:min-h-0 [&>[data-slot=card-content]]:overflow-y-auto"
          >
            {upcoming.length === 0 ? (
              <p className="py-1 text-body text-muted-foreground">Aucun rendez-vous ou visite planifié pour les prochains jours.</p>
            ) : (
              <div className="flex flex-col">
                {upcoming.map((ev) => (
                  <button
                    type="button"
                    key={ev.interactionId}
                    onClick={() => setSelectedDate((ev.dateDebut ?? '').slice(0, 10))}
                    className="flex items-center gap-2.5 border-b border-border py-2 text-left last:border-b-0"
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', isVisiteEvenement(ev) ? 'bg-(--amber)' : 'bg-(--info)')} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body font-medium text-foreground">{ev.prospectNom || ev.sujet || '—'}</div>
                      <div className="text-micro text-muted-foreground tabular-nums">
                        {formatDate(ev.dateDebut)}
                        {formatHeure(ev.dateDebut) && ` à ${formatHeure(ev.dateDebut)}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
