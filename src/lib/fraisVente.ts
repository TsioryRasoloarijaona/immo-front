/** Même formule que le serveur (`CalculFraisVente`) : TTC = HT × (1 + TVA), HT = TTC / (1 + TVA), 6 décimales. */
const arrondi6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function montantsFrais(montant: number | undefined, tva: number | undefined, saisiEnTtc: boolean): { ht: number; ttc: number } {
  const coefficient = 1 + (tva ?? 0);
  const saisi = arrondi6(montant ?? 0);
  return saisiEnTtc ? { ht: arrondi6(saisi / coefficient), ttc: saisi } : { ht: saisi, ttc: arrondi6(saisi * coefficient) };
}
