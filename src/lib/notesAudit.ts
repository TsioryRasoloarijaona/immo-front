import type { ActionAudit, BadgeTone } from '../types';

const ACTIONS: Record<ActionAudit, { libelle: string; tone: BadgeTone }> = {
  Added: { libelle: 'Ajout', tone: 'success' },
  Modified: { libelle: 'Modification', tone: 'info' },
  Deleted: { libelle: 'Suppression', tone: 'warning' },
};

function estActionAudit(code: string | null | undefined): code is ActionAudit {
  return code === 'Added' || code === 'Modified' || code === 'Deleted';
}

/** Code brut d'OMRAN → libellé français ; un code inconnu reste affiché tel quel. */
export function actionAudit(code: string | null | undefined): { libelle: string; tone: BadgeTone } {
  if (estActionAudit(code)) return ACTIONS[code];
  return { libelle: code ?? '—', tone: 'neutral' };
}

const ECHAPPEMENTS: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Saisie en texte simple → HTML d'une note (un paragraphe par bloc, retours à la ligne en `<br>`).
 * Le serveur assainit de toute façon : ceci évite seulement qu'un « < » saisi devienne une balise. */
export function texteVersHtml(texte: string): string {
  return texte
    .trim()
    .split(/\n{2,}/)
    .map((bloc) => bloc.replaceAll(/[&<>"']/g, (c) => ECHAPPEMENTS[c] ?? c).replaceAll('\n', '<br>'))
    .map((bloc) => `<p>${bloc}</p>`)
    .join('');
}
