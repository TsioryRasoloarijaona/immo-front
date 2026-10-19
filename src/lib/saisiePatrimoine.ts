import { useState } from 'react';
import { toApiDateTime } from './format';

/** Formulaires programme / tranche / article : champs déclarés une fois, saisis en texte, convertis à l'envoi. */
export type TypeChamp = 'texte' | 'texteLong' | 'date' | 'montant' | 'entier' | 'pourcent' | 'booleen' | 'liste';

export interface ChampDef {
  /** Nom du champ sur le fil (DTO d'écriture et de détail). */
  nom: string;
  libelle: string;
  type: TypeChamp;
  obligatoire?: boolean;
  /** Clé de la liste de choix fournie au rendu (type `liste`). */
  liste?: string;
}

export interface SectionSaisie {
  titre: string;
  champs: ChampDef[];
}

export type Brouillon = Record<string, string | boolean>;

const arrondi = (n: number) => Math.round(n * 1e8) / 1e8;

function texteBrouillon(def: ChampDef, valeur: unknown): string {
  if (typeof valeur !== 'string' && typeof valeur !== 'number') return '';
  if (def.type === 'pourcent') return String(arrondi(Number(valeur) * 100));
  if (def.type === 'date') return String(valeur).slice(0, 10);
  return String(valeur);
}

function versFil(def: ChampDef, valeur: string | boolean): unknown {
  if (def.type === 'booleen') return valeur === true;
  const texte = String(valeur);
  if (def.type === 'texte' || def.type === 'texteLong') return texte;
  if (texte.trim() === '') return undefined;
  switch (def.type) {
    case 'date':
      return toApiDateTime(texte);
    case 'pourcent':
      return arrondi(Number(texte) / 100);
    case 'montant':
    case 'entier':
      return Number(texte);
    default:
      return texte;
  }
}

export function champsDe(sections: SectionSaisie[]): ChampDef[] {
  return sections.flatMap((s) => s.champs);
}

export function brouillonDepuis(champs: ChampDef[], source?: object): Brouillon {
  const valeurs = (source ?? {}) as Record<string, unknown>;
  return Object.fromEntries(champs.map((c) => [
    c.nom,
    c.type === 'booleen' ? valeurs[c.nom] === true : texteBrouillon(c, valeurs[c.nom]),
  ]));
}

/**
 * Corps d'écriture. Avec `initial` (PATCH) : seuls les champs changés partent — renvoyer un prix inchangé le
 * ferait recalculer côté serveur, et toucherait un champ protégé d'un article occupé.
 */
export function corpsDepuis(champs: ChampDef[], brouillon: Brouillon, initial?: Brouillon): Record<string, unknown> {
  const corps: Record<string, unknown> = {};
  for (const c of champs) {
    if (initial && initial[c.nom] === brouillon[c.nom]) continue;
    const valeur = versFil(c, brouillon[c.nom]);
    if (valeur !== undefined && !(initial === undefined && valeur === '')) corps[c.nom] = valeur;
  }
  return corps;
}

/** État d'un formulaire : brouillon, envoi, erreur du serveur et champ qu'elle nomme. */
export function useSaisie(champs: ChampDef[], depart: Brouillon) {
  const [brouillon, setBrouillon] = useState<Brouillon>(depart);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function modifier(nom: string, valeur: string | boolean) {
    setBrouillon((b) => ({ ...b, [nom]: valeur }));
  }

  async function envoyer<T>(action: () => Promise<T>, apres: (resultat: T) => void) {
    setEnvoi(true);
    setErreur(null);
    try {
      apres(await action());
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setEnvoi(false);
    }
  }

  return { brouillon, setBrouillon, modifier, envoi, erreur, champErreur: champEnErreur(erreur, champs), envoyer };
}

/** Le `detail` d'un 400/409 commence par le libellé du champ fautif (« Le code est déjà pris… ») : le retrouver. */
export function champEnErreur(message: string | null, champs: ChampDef[]): string | null {
  if (!message) return null;
  const texte = message.toLowerCase();
  const parLongueur = [...champs].sort((a, b) => b.libelle.length - a.libelle.length);
  return parLongueur.find((c) => texte.includes(c.libelle.toLowerCase()))?.nom ?? null;
}
