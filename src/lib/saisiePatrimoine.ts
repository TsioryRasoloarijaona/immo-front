import { useState } from 'react';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatRatio, formatSurface, texteBrut, toApiDateTime } from './format';

/** Formulaires programme / tranche / article : champs déclarés une fois, saisis en texte, convertis à l'envoi. */
/** `multi` : cases d'une liste, ids joints par `,` dans le brouillon, tableau sur le fil (vues d'un article). */
export type TypeChamp = 'texte' | 'texteLong' | 'date' | 'montant' | 'entier' | 'surface' | 'pourcent' | 'ratio' | 'booleen' | 'liste'
  | 'multi';

export type Choix = { label: string; value: string }[];

export interface ChampDef {
  /** Nom du champ sur le fil (DTO d'écriture et de détail). */
  nom: string;
  libelle: string;
  type: TypeChamp;
  obligatoire?: boolean;
  /** Clé de la liste de choix fournie au rendu (type `liste`). */
  liste?: string;
  /** Liste : champ du DTO de détail qui porte le libellé ; défaut `xxxId` → `xxxLibelle`. */
  champLibelle?: string;
  /** Affiché sur la fiche et grisé dans le formulaire (calculé par le serveur). */
  lectureSeule?: boolean;
}

/** Libellés des ids d'un champ `liste` ou `multi` dont le détail ne porte que l'id. */
function libellesDepuis(liste: Choix, ids: unknown): string | undefined {
  const tous = Array.isArray(ids) ? ids : [ids];
  const libelles = liste.filter((c) => tous.includes(c.value)).map((c) => c.label);
  return libelles.length > 0 ? libelles.join(', ') : undefined;
}

/** Valeur d'un champ (hors case à cocher) pour la fiche en lecture, `undefined` si vide (affiché « — »). */
export function valeurFiche(def: ChampDef, source: object, liste?: Choix): string | undefined {
  const valeurs = source as Record<string, unknown>;
  if (liste) return libellesDepuis(liste, valeurs[def.nom]);
  const v = def.type === 'liste' ? valeurs[def.champLibelle ?? def.nom.replace(/Id$/, 'Libelle')] : valeurs[def.nom];
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v !== 'number') return def.type === 'date' ? formatDate(texteBrut(v)) : texteBrut(v);
  switch (def.type) {
    case 'montant':
      return formatCurrency(v);
    case 'pourcent':
      return formatPercent(v, 2);
    case 'ratio':
      return formatRatio(v);
    case 'surface':
      return formatSurface(v);
    default:
      return formatNumber(v);
  }
}

export interface SectionSaisie {
  titre: string;
  champs: ChampDef[];
}

export type Brouillon = Record<string, string | boolean>;

const arrondi = (n: number) => Math.round(n * 1e8) / 1e8;

function texteBrouillon(def: ChampDef, valeur: unknown): string {
  if (def.type === 'multi') return Array.isArray(valeur) ? valeur.map(String).sort((a, b) => a.localeCompare(b)).join(',') : '';
  if (typeof valeur !== 'string' && typeof valeur !== 'number') return '';
  if (def.type === 'pourcent') return String(arrondi(Number(valeur) * 100));
  if (def.type === 'date') return String(valeur).slice(0, 10);
  return String(valeur);
}

function versFil(def: ChampDef, valeur: string | boolean): unknown {
  if (def.type === 'booleen') return valeur === true;
  const texte = String(valeur);
  if (def.type === 'texte' || def.type === 'texteLong') return texte;
  if (def.type === 'multi') return texte === '' ? [] : texte.split(',');
  if (texte.trim() === '') return undefined;
  switch (def.type) {
    case 'date':
      return toApiDateTime(texte);
    case 'pourcent':
      return arrondi(Number(texte) / 100);
    case 'montant':
    case 'entier':
    case 'surface':
    case 'ratio':
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
 * ferait recalculer côté serveur, et toucherait un champ protégé d'un article occupé. Une date, une liste ou un
 * nombre effacé part dans `champsAVider`.
 */
export function corpsDepuis(champs: ChampDef[], brouillon: Brouillon, initial?: Brouillon): Record<string, unknown> {
  const corps: Record<string, unknown> = {};
  const aVider: string[] = [];
  for (const c of champs) {
    if (c.lectureSeule || (initial && initial[c.nom] === brouillon[c.nom])) continue;
    const valeur = versFil(c, brouillon[c.nom]);
    if (valeur !== undefined && !(initial === undefined && valeur === '')) corps[c.nom] = valeur;
    else if (valeur === undefined && initial) aVider.push(c.nom);
  }
  if (aVider.length > 0) corps.champsAVider = aVider;
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
