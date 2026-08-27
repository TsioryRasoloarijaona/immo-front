import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, MapPin } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { getEvenementsCalendrier } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { usePreview } from '../../lib/previewContext';
import { isVisiteEvenement } from '../../lib/domain';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { EvenementCalendrierDto } from '../../types';

// Calendrier — vue mensuelle des rendez-vous/visites planifiés, backed by
// GET /api/calendrier/evenements (V4) : une entrée par interaction dont le
// résultat impliquait une date de RDV (Rendez vous pris / RDV reporté / Le
// prospect veut faire une visite du projet — voir InteractionForm.tsx).
// L'input `type="date"` de ce formulaire ne capture jamais d'heure, donc les
// événements sont traités ici comme des créneaux "jour entier", pas
// horodatés — on n'invente pas une heure que la donnée ne porte pas.

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

/** 6 semaines (42 jours), du lundi précédant (ou incluant) le 1er du mois au
 * dimanche suivant — grille fixe pour un rendu stable quel que soit le mois. */
function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const mondayOffset = (first.getDay() + 6) % 7; // getDay(): 0=dimanche
  const gridStart = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function eventTone(ev: EvenementCalendrierDto): 'amber' | 'info' {
  return isVisiteEvenement(ev) ? 'amber' : 'info';
}

function EventPill({ ev, onClick }: { ev: EvenementCalendrierDto; onClick: () => void }) {
  const visite = isVisiteEvenement(ev);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-1.5 truncate rounded px-1.5 py-0.75 text-left text-[11px] font-medium',
        visite ? 'bg-(--amber-bg) text-(--amber)' : 'bg-(--info-bg) text-(--info)'
      )}
      title={ev.sujet || (visite ? 'Visite' : 'Rendez-vous')}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{ev.prospectNom || ev.sujet || (visite ? 'Visite' : 'RDV')}</span>
    </button>
  );
}

function EventCard({ ev }: { ev: EvenementCalendrierDto }) {
  const { previewProspection } = usePreview();
  const visite = isVisiteEvenement(ev);

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={eventTone(ev)}>{visite ? 'Visite' : 'Rendez-vous'}</Badge>
        {ev.resultatDescription && ev.resultatDescription !== ev.resultatCode && (
          <span className="text-[11px] text-muted-foreground">{ev.resultatDescription}</span>
        )}
      </div>
      <div className="text-[13.5px] font-semibold text-foreground">{ev.prospectNom || 'Prospect inconnu'}</div>
      {ev.sujet && <div className="text-[12.5px] text-muted-foreground">{ev.sujet}</div>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
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
    <PageShell title="Calendrier" crumbs={[{ label: 'Calendrier' }]}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4.5 py-3">
            <div className="text-[15px] font-semibold text-foreground">
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
            <div>
              <div className="grid grid-cols-7 border-b border-border">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {grid.map((day) => {
                  const iso = toISODate(day);
                  const inMonth = day.getMonth() === month.getMonth();
                  const isToday = iso === todayISO;
                  const isSelected = iso === selectedDate;
                  const dayEvents = eventsByDay.get(iso) ?? [];
                  return (
                    // A day cell embeds EventPill buttons, so it can't be a
                    // <button> itself (nested interactive elements are
                    // invalid HTML and broke rendering) — div+role="button"
                    // instead, same pattern as the clickable TableRows
                    // elsewhere in this app.
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
                        'flex min-h-23 cursor-pointer flex-col items-stretch gap-1 border-b border-r border-border p-1.5 text-left transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0 hover:bg-(--neutral-bg)',
                        !inMonth && 'bg-(--muted)',
                        isSelected && 'bg-(--brand-bg) hover:bg-(--brand-bg)'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex size-6 items-center justify-center self-start rounded-full text-[12px] font-medium',
                          !inMonth && 'text-muted-foreground/60',
                          inMonth && !isToday && 'text-foreground',
                          isToday && 'bg-primary font-semibold text-primary-foreground'
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <EventPill key={ev.interactionId} ev={ev} onClick={() => setSelectedDate(iso)} />
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="px-1.5 text-[10.5px] font-medium text-muted-foreground">+{dayEvents.length - 2} autre(s)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title={`Le ${formatDate(selectedDate)}`}>
            {selectedEvents.length === 0 ? (
              <EmptyState title="Rien de prévu" message="Aucun rendez-vous ni visite ce jour-là." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {selectedEvents.map((ev) => (
                  <EventCard key={ev.interactionId} ev={ev} />
                ))}
              </div>
            )}
          </Card>

          <Card title="À venir">
            {upcoming.length === 0 ? (
              <EmptyState title="Rien à venir" message="Aucun rendez-vous ou visite planifié pour les prochains jours." />
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
                      <div className="truncate text-[12.5px] font-medium text-foreground">{ev.prospectNom || ev.sujet || '—'}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDate(ev.dateDebut)}</div>
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
