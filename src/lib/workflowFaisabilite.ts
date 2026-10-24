import { ApiError } from './api';
import type { Choix, ChampDef, SectionSaisie, TypeChamp } from './saisiePatrimoine';
import type { TransitionPossibleDto } from '../types/faisabilite';

const champ = (nom: string, libelle: string, type: TypeChamp, extra: Partial<ChampDef> = {}): ChampDef => ({ nom, libelle, type, ...extra });

/** Listes de choix des dialogues de configuration (clés des champs `liste` / `multi`) et types de document. */
export interface ContexteConfig {
  listes: Record<string, Choix>;
  typesDocument: Choix;
}

export const SECTIONS_STATUT:SectionSaisie[] = [
  {
    titre: 'Statut',
    champs: [
      champ('sorting', 'Ordre', 'entier'),
      champ('code', 'Code', 'texte', { obligatoire: true }),
      champ('description', 'Description', 'texte', { obligatoire: true }),
      champ('typeEtatId', "Type d'état", 'liste', { obligatoire: true, liste: 'typesEtat', champLibelle: 'typeEtatLibelle' }),
      champ('delai', 'Durée de vie', 'entier'),
      champ('couleur', 'Couleur (nom .NET, ex. Green)', 'texte'),
      champ('notes', 'Notes', 'texteLong'),
    ],
  },
  { titre: 'Champs obligatoires du statut', champs: [champ('champsObligatoires', 'Champs exigés pour atteindre ce statut', 'multi', { liste: 'champs' })] },
];

export const SECTIONS_TRANSITION: SectionSaisie[] = [
  {
    titre: 'Transition',
    champs: [
      champ('sorting', 'Ordre', 'entier'),
      champ('description', 'Description', 'texte', { obligatoire: true }),
      champ('statutDepartId', 'Statut de départ', 'liste', { obligatoire: true, liste: 'statuts', champLibelle: 'statutDepartLibelle' }),
      champ('statutArriveeId', "Statut d'arrivée", 'liste', { obligatoire: true, liste: 'statuts', champLibelle: 'statutArriveeLibelle' }),
      champ('noteObligatoire', 'Note obligatoire (sans effet)', 'booleen'),
      champ('avecNotification', 'Avec notification (sans effet)', 'booleen'),
      champ('envoyerEmail', 'Envoyer un e-mail (sans effet)', 'booleen'),
    ],
  },
  {
    titre: 'Rôles autorisés',
    champs: [champ('roles', 'Rôles pouvant emprunter la transition', 'multi', { liste: 'roles' })],
  },
  { titre: 'Champs obligatoires de la transition', champs: [champ('champsObligatoires', "Champs exigés pour l'emprunter", 'multi', { liste: 'champs' })] },
];

/** Descriptions des transitions permises, portées par le 409 `ProblemDetail` d'un passage interdit. */
export function transitionsPermises(err: unknown): string[] {
  const liste = err instanceof ApiError ? err.problem?.transitionsAutorisees : undefined;
  return Array.isArray(liste) ? liste.map(String) : [];
}

/** Prérequis non satisfaits d'une transition, tels que le serveur les compte. */
export function prerequisManquants(t: TransitionPossibleDto): string[] {
  return [
    ...t.champsObligatoires.filter((c) => !c.renseigne).map((c) => `Champ à renseigner : ${c.libelle}`),
    ...t.documentsRequis.filter((d) => !d.fourni).map((d) => `Document à joindre : ${d.typeLibelle ?? 'type inconnu'}`),
  ];
}
