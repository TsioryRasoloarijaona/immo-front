// Liens « Appeler » et « WhatsApp » du parcours commercial (FEATURE-parcours-commercial.md §4).
// Lien seulement : rien n'est envoyé par l'application.

const INDICATIF_PAR_DEFAUT = '212';

function chiffres(valeur: string | null | undefined): string {
  return (valeur ?? '').replaceAll(/\D/g, '');
}

/** `tel:` garde le numéro tel que saisi (le téléphone sait le composer), `null` sans chiffre. */
export function lienAppel(numero: string | null | undefined): string | null {
  const brut = (numero ?? '').trim();
  return chiffres(brut) ? `tel:${brut.replaceAll(/\s/g, '')}` : null;
}

/**
 * `https://wa.me/<indicatif sans +><numéro sans 0 initial>`. Sans indicatif connu (numéro du formulaire),
 * le Maroc ; un numéro déjà international (`+212…`, `00212…`) est gardé tel quel.
 */
export function lienWhatsApp(numero: string | null | undefined, indicatif?: string | null): string | null {
  const brut = (numero ?? '').trim();
  let local = chiffres(brut);
  if (!local) return null;
  if (brut.startsWith('+')) return `https://wa.me/${local}`;
  if (local.startsWith('00')) return `https://wa.me/${local.slice(2)}`;
  const prefixe = chiffres(indicatif) || INDICATIF_PAR_DEFAUT;
  while (local.startsWith('0')) local = local.slice(1);
  return `https://wa.me/${prefixe}${local}`;
}
