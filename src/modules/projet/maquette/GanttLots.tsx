import { decaler } from '../../../components/maquette/colonnes';
import { CoqueBord } from '../../../components/maquette/EcranBordStatique';
import { formatDate } from '../../../lib/format';
import { LOTS_DEF } from './calcul';
import { LOTS } from './ecransLots';

const DEBUT = LOTS_DEF.map((d) => d.debut).sort((a, b) => a.localeCompare(b))[0];
const FIN = LOTS_DEF.map((d) => d.fin).sort((a, b) => a.localeCompare(b)).at(-1) ?? DEBUT;
const JOURS = (Date.parse(FIN) - Date.parse(DEBUT)) / 86_400_000;
const pctJours = (iso: string): number => ((Date.parse(iso) - Date.parse(DEBUT)) / 86_400_000 / JOURS) * 100;
const MOIS = Array.from({ length: Math.ceil(JOURS / 30) + 1 }, (_, k) => decaler(DEBUT, 30 * k));

/** Diagramme de Gantt statique : une barre par lot, remplie à hauteur de l'avancement. */
export default function GanttLots() {
  return (
    <CoqueBord titre="Gantt" cle="projet.gantt">
      <div className="overflow-auto rounded-xl border border-border bg-card p-3">
        <div className="min-w-[900px]">
          <div className="relative ml-56 h-5 border-b border-border text-micro text-muted-foreground">
            {MOIS.map((m) => (
              <span key={m} className="absolute" style={{ left: `${pctJours(m)}%` }}>{formatDate(m).slice(3)}</span>
            ))}
          </div>
          {LOTS_DEF.map((d, i) => (
            <div key={d.code} className="flex items-center border-b border-border/50 py-1">
              <span className="w-56 shrink-0 truncate pr-2 text-body" title={`${d.code} — ${d.libelle}`}>{d.code} — {d.libelle}</span>
              <div className="relative h-4 flex-1">
                <div
                  className="absolute h-4 overflow-hidden rounded bg-primary/25"
                  style={{ left: `${pctJours(d.debut)}%`, width: `${pctJours(d.fin) - pctJours(d.debut)}%` }}
                  title={`${formatDate(d.debut)} → ${formatDate(d.fin)} · ${d.statut}`}
                >
                  <div className="h-full bg-primary" style={{ width: `${Number(LOTS[i].avancement) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CoqueBord>
  );
}
