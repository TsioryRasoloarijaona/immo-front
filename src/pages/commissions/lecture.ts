import { ApiError } from '../../lib/api';

export const MESSAGE_ACCES_REFUSE = "Vous n'avez pas accès aux commissions.";
export const MESSAGE_TRANCHE_INTROUVABLE = 'Tranche introuvable.';

/** `useApi` ne garde que le message : 403 et 404 y reçoivent leur texte fixe pour que l'écran les reconnaisse. */
export async function lire<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) throw new Error(MESSAGE_ACCES_REFUSE, { cause: err });
    if (err instanceof ApiError && err.status === 404) throw new Error(MESSAGE_TRANCHE_INTROUVABLE, { cause: err });
    throw err;
  }
}
