import { dateDepuisJour, libelleTache, numeroJour, plageTache, type LigneTache } from '../../../lib/planification';
import type { TachePlanificationDto } from '../../../types/planification';

export const HAUTEUR_LIGNE = 24;
export const HAUTEUR_ENTETE = 32;
const MARGE_JOURS = 3;
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

interface Barre { tache: TachePlanificationDto; ligne: number; debut: number; fin: number }

/** Point d'attache d'une flèche : début ou fin de la barre, au milieu de sa ligne. */
function attache(b: Barre, bord: 'debut' | 'fin', x: (j: number) => number): [number, number] {
  return [x(bord === 'debut' ? b.debut : b.fin), HAUTEUR_ENTETE + b.ligne * HAUTEUR_LIGNE + HAUTEUR_LIGNE / 2];
}

const BORDS: Record<string, ['debut' | 'fin', 'debut' | 'fin']> = {
  FIN_DEBUT: ['fin', 'debut'],
  DEBUT_DEBUT: ['debut', 'debut'],
  FIN_FIN: ['fin', 'fin'],
  DEBUT_FIN: ['debut', 'fin'],
};

function chemin([x1, y1]: [number, number], [x2, y2]: [number, number]): string {
  const sortie = x1 + 6;
  const entree = x2 - 6;
  const milieu = y1 === y2 ? y1 : y1 + Math.sign(y2 - y1) * (HAUTEUR_LIGNE / 2);
  return `M${x1},${y1} H${sortie} V${milieu} H${entree} V${y2} H${x2}`;
}

/** Diagramme de Gantt dessiné à la main : barres, avancement, flèches de prédécesseurs, ligne d'aujourd'hui. */
export default function GanttSvg({ lignes, pxParJour, selection, onSelect, onOuvrir }: Readonly<{
  lignes: LigneTache[];
  pxParJour: number;
  selection: string | null;
  onSelect: (id: string) => void;
  onOuvrir: (id: string) => void;
}>) {
  const barres: Barre[] = lignes.flatMap(({ tache }, ligne) => {
    const plage = plageTache(tache);
    return plage ? [{ tache, ligne, ...plage }] : [];
  });
  const aujourdhui = numeroJour(new Date().toISOString());
  const bornes = [...barres.flatMap((b) => [b.debut, b.fin]), ...(aujourdhui === null ? [] : [aujourdhui])];
  const premier = bornes.length ? Math.min(...bornes) - MARGE_JOURS : 0;
  const dernier = bornes.length ? Math.max(...bornes) + MARGE_JOURS : 30;
  const x = (jour: number) => (jour - premier) * pxParJour;
  const largeur = x(dernier);
  const hauteur = HAUTEUR_ENTETE + lignes.length * HAUTEUR_LIGNE;
  const parId = new Map(barres.map((b) => [b.tache.id, b]));

  const mois: { jour: number; libelle: string }[] = [];
  for (let j = premier; j <= dernier; j++) {
    const d = dateDepuisJour(j);
    if (d.getUTCDate() === 1 || j === premier) mois.push({ jour: j, libelle: `${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}` });
  }

  return (
    <svg width={largeur} height={hauteur} role="img" aria-label="Diagramme de Gantt des tâches" className="block">
      <defs>
        <marker id="fleche-gantt" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" className="fill-muted-foreground" />
        </marker>
      </defs>
      <rect x={0} y={0} width={largeur} height={HAUTEUR_ENTETE} className="fill-muted" />
      {mois.map((m) => (
        <g key={m.jour}>
          <line x1={x(m.jour)} x2={x(m.jour)} y1={0} y2={hauteur} className="stroke-border" />
          <text x={x(m.jour) + 4} y={20} className="fill-muted-foreground text-[10px]">{m.libelle}</text>
        </g>
      ))}
      {lignes.map(({ tache }, i) => (
        <rect key={tache.id} x={0} y={HAUTEUR_ENTETE + i * HAUTEUR_LIGNE} width={largeur} height={HAUTEUR_LIGNE}
          className={tache.id === selection ? 'fill-primary/10' : 'fill-transparent'} />
      ))}
      {aujourdhui !== null && (
        <line x1={x(aujourdhui)} x2={x(aujourdhui)} y1={HAUTEUR_ENTETE} y2={hauteur} className="stroke-destructive" strokeDasharray="4 3">
          <title>Aujourd'hui</title>
        </line>
      )}
      {barres.flatMap((b) => b.tache.predecesseurs.flatMap((p) => {
        const pred = parId.get(p.tacheId);
        if (!pred) return [];
        const [bordPred, bordSucc] = BORDS[p.type ?? 'FIN_DEBUT'];
        return [(
          <path key={`${pred.tache.id}-${b.tache.id}`} d={chemin(attache(pred, bordPred, x), attache(b, bordSucc, x))}
            fill="none" className="stroke-muted-foreground" strokeWidth={1} markerEnd="url(#fleche-gantt)" />
        )];
      }))}
      {barres.map((b) => {
        const y = HAUTEUR_ENTETE + b.ligne * HAUTEUR_LIGNE + 5;
        const largeurBarre = Math.max(x(b.fin) - x(b.debut), 2);
        const avancement = Math.min(Math.max(b.tache.avancement ?? 0, 0), 100) / 100;
        return (
          <g key={b.tache.id} role="button" tabIndex={0} aria-label={libelleTache(b.tache)} className="cursor-pointer"
            onClick={() => onSelect(b.tache.id)} onDoubleClick={() => onOuvrir(b.tache.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOuvrir(b.tache.id); else if (e.key === ' ') onSelect(b.tache.id); }}>
            <title>{`${b.tache.code} ${b.tache.description ?? ''} — ${Math.round(avancement * 100)} %`}</title>
            {b.tache.jalon ? (
              <rect x={x(b.debut) - 7} y={y + 1} width={14} height={14} transform={`rotate(45 ${x(b.debut)} ${y + 8})`} className="fill-primary" />
            ) : (
              <>
                <rect x={x(b.debut)} y={y} width={largeurBarre} height={14} rx={2} className="fill-primary/30 stroke-primary" />
                <rect x={x(b.debut)} y={y} width={largeurBarre * avancement} height={14} rx={2} className="fill-primary" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
