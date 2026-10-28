/** Puce d'un filtre à plusieurs valeurs : vide si « tout », les libellés jusqu'à deux, sinon « Titre : n ». */
export function puceSelection(titre: string, items: { value: string; label: string }[], valeur: string[]): string[] {
  if (valeur.length === 0) return [];
  if (valeur.length > 2) return [`${titre} : ${valeur.length}`];
  return [valeur.map((v) => items.find((i) => i.value === v)?.label ?? v).join(', ')];
}

/** Puce d'un filtre à valeur unique : vide si « tout ». */
export function puceUnique(items: { value: string; label: string }[], valeur: string | null): string[] {
  if (valeur === null) return [];
  return [items.find((i) => i.value === valeur)?.label ?? valeur];
}
