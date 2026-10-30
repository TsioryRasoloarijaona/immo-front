import type { UtilisateurEcritureDto, UtilisateurFicheDto } from '../types/utilisateurs';

export const NOUVEAU_UTILISATEUR = 'nouveau';

/** Champs texte et listes en chaînes (`''` = vide), cases en booléens : un formulaire contrôlé n'accepte pas `null`. */
export interface SaisieUtilisateur {
  code: string;
  description: string;
  email: string;
  telephone: string;
  mobile: string;
  personnelId: string;
  cultureWebId: string;
  roleWebId: string;
  smtpServeur: string;
  smtpPort: string;
  smtpSsl: boolean;
  inactif: boolean;
  avecNotification: boolean;
  peutMasquerNotification: boolean;
  accesMobile: boolean;
}

/** Un compte créé est inactif tant que l'administrateur ne l'active pas (le serveur le force aussi). */
export function saisieDepuisFiche(f: UtilisateurFicheDto | null): SaisieUtilisateur {
  return {
    code: f?.code ?? '',
    description: f?.description ?? '',
    email: f?.email ?? '',
    telephone: f?.telephone ?? '',
    mobile: f?.mobile ?? '',
    personnelId: f?.personnelId ?? '',
    cultureWebId: f?.cultureWebId ?? '',
    roleWebId: f?.roleWebId ?? '',
    smtpServeur: f?.smtpServeur ?? '',
    smtpPort: f?.smtpPort == null ? '' : String(f.smtpPort),
    smtpSsl: f?.smtpSsl ?? false,
    inactif: f?.inactif ?? true,
    avecNotification: f?.avecNotification ?? false,
    peutMasquerNotification: f?.peutMasquerNotification ?? false,
    accesMobile: f?.accesMobile ?? false,
  };
}

export function saisieModifiee(a: SaisieUtilisateur, b: SaisieUtilisateur): boolean {
  return (Object.keys(a) as (keyof SaisieUtilisateur)[]).some((cle) => a[cle] !== b[cle]);
}

/** Création : le code est envoyé ; modification : jamais (immuable). Un identifiant vide n'est pas envoyé. */
export function corpsUtilisateur(s: SaisieUtilisateur, creation: boolean): UtilisateurEcritureDto {
  const port = Number.parseInt(s.smtpPort, 10);
  return {
    ...(creation && { code: s.code.trim() }),
    description: s.description.trim(),
    email: s.email,
    telephone: s.telephone,
    mobile: s.mobile,
    smtpServeur: s.smtpServeur,
    ...(Number.isNaN(port) ? {} : { smtpPort: port }),
    smtpSsl: s.smtpSsl,
    inactif: s.inactif,
    avecNotification: s.avecNotification,
    peutMasquerNotification: s.peutMasquerNotification,
    accesMobile: s.accesMobile,
    ...(s.personnelId && { personnelId: s.personnelId }),
    ...(s.cultureWebId && { cultureWebId: s.cultureWebId }),
    ...(s.roleWebId && { roleWebId: s.roleWebId }),
  };
}

export function memesIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
