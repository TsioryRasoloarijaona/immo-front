/** Clés React pour des lignes sans identifiant : la clé composite reçoit un
 * suffixe d'occurrence, deux lignes identiques (échéances égales) ne collisionnent pas. */
export function avecCles<T>(items: readonly T[], base: (item: T) => string): { item: T; cle: string }[] {
  const vues = new Map<string, number>();
  return items.map((item) => {
    const b = base(item);
    const n = vues.get(b) ?? 0;
    vues.set(b, n + 1);
    return { item, cle: `${b}#${n}` };
  });
}
