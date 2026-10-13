// Liens « Appeler » et « WhatsApp » du parcours commercial (FEATURE-parcours-commercial.md §4).
// Lien seulement : rien n'est envoyé par l'application.

import { sansAccents } from './colonnes';

const INDICATIF_PAR_DEFAUT = '212';

export type CanalContact = 'appel' | 'whatsapp';

// Codes `ComActionMessageType` d'OMRAN, comparés sans casse ni accents.
const TYPE_DU_CANAL: Record<CanalContact, string> = { appel: 'telephone sortant', whatsapp: 'message sortant' };

/** Type d'action à présélectionner pour noter l'échange qui suit un clic Appeler / WhatsApp. */
export function typeActionDuCanal(
  types: readonly { id: string; code?: string }[],
  canal: CanalContact | undefined,
): string | undefined {
  if (!canal) return undefined;
  return types.find((t) => sansAccents((t.code ?? '').trim()) === TYPE_DU_CANAL[canal])?.id;
}

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
