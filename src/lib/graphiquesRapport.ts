// Calculs géométriques des graphiques SVG de rapports (aucune dépendance).

const BASES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

/** Cinq teintes du thème, puis les mêmes éclaircies : la légende textuelle lève toute ambiguïté. */
export function couleurSerie(i: number): string {
  const base = BASES[i % BASES.length];
  return i < BASES.length ? base : `color-mix(in oklch, ${base} 55%, var(--background))`;
}

/** Plafond « rond » de l'axe et ses graduations (0 inclus). */
export function graduations(maximum: number, nombre = 4): { plafond: number; valeurs: number[] } {
  if (maximum <= 0) return { plafond: 1, valeurs: [0, 1] };
  const brut = maximum / nombre;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = ([1, 2, 2.5, 5, 10].find((m) => m * puissance >= brut) ?? 10) * puissance;
  const valeurs: number[] = [];
  for (let v = 0; v <= maximum + pas / 2; v += pas) valeurs.push(v);
  return { plafond: valeurs.at(-1) ?? pas, valeurs };
}

function point(cx: number, cy: number, r: number, angle: number): string {
  return `${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`;
}

/** Part de camembert entre deux angles (radians, départ à midi) ; une part pleine se dessine en cercle à part. */
export function cheminPart(cx: number, cy: number, r: number, debut: number, fin: number): string {
  const grand = fin - debut > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${point(cx, cy, r, debut)} A ${r} ${r} 0 ${grand} 1 ${point(cx, cy, r, fin)} Z`;
}
