import type { Editor, Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import type { CatalogueChampsDto, ChampModeleDto } from '../../types/modeles';
import {
  AttributsModele,
  BlocConditionnel,
  ChampModele,
  ConditionPassage,
  EtiquettesModele,
  RepeterPassage,
  SautPage,
  type Etiqueteur,
} from './extensions';

/** Portée d'une condition : le paragraphe courant, le passage sélectionné ou un bloc de paragraphes. */
export type PorteeCondition = 'paragraphe' | 'passage' | 'bloc';

export const IMAGE_MAX_OCTETS = 500 * 1024;

/** Mêmes extensions pour le corps, l'en-tête et le pied : un seul HTML restreint. */
export function extensionsModele(etiqueteur: { courant: Etiqueteur }): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      blockquote: false,
      code: false,
      codeBlock: false,
      strike: false,
      link: false,
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({ allowBase64: true, inline: false }),
    RepeterPassage,
    ConditionPassage,
    ChampModele,
    BlocConditionnel,
    SautPage,
    AttributsModele,
    EtiquettesModele.configure({ etiqueteur }),
  ];
}

/** Index cle → champ, listes comprises, pour les libellés et les étiquettes. */
export function indexChamps(catalogue: CatalogueChampsDto | null): Map<string, ChampModeleDto> {
  const index = new Map<string, ChampModeleDto>();
  for (const g of catalogue?.groupes ?? []) for (const c of g.champs) index.set(c.cle, c);
  for (const l of catalogue?.listes ?? []) for (const c of l.champs) index.set(c.cle, c);
  return index;
}

export function creerEtiqueteur(catalogue: CatalogueChampsDto | null): Etiqueteur {
  const champs = indexChamps(catalogue);
  const listes = new Map((catalogue?.listes ?? []).map((l) => [l.cle, l.libelle]));
  return ({ si, valeur, repeter }) => {
    if (repeter) return `↻ ${listes.get(repeter) ?? repeter}`;
    if (!si) return null;
    const champ = champs.get(si);
    const libelle = champ?.libelle ?? si;
    if (champ?.type === 'BOOLEEN') return `si ${libelle} = ${valeur === 'false' ? 'non' : 'oui'}`;
    return `si ${libelle} renseigné`;
  };
}

/** Liste ↻ qui englobe le curseur : seuls ses champs y sont insérables. */
export function listeCourante(editor: Editor): string | null {
  const { $from } = editor.state.selection;
  for (let profondeur = $from.depth; profondeur > 0; profondeur--) {
    const repeter: unknown = $from.node(profondeur).attrs.repeter;
    if (typeof repeter === 'string' && repeter) return repeter;
  }
  const marque = $from.marks().find((m) => m.type.name === 'repeterPassage');
  const repeter: unknown = marque?.attrs.repeter;
  return typeof repeter === 'string' ? repeter : null;
}

export function insererChamp(editor: Editor, champ: ChampModeleDto): void {
  editor.chain().focus().insertContent({ type: 'champ', attrs: { cle: champ.cle, libelle: champ.libelle } }).run();
}

function blocCourant(editor: Editor): 'listItem' | 'paragraph' {
  return editor.isActive('listItem') ? 'listItem' : 'paragraph';
}

export function appliquerCondition(editor: Editor, si: string, valeur: string | null, portee: PorteeCondition): void {
  const attrs = { si, valeur };
  const chaine = editor.chain().focus();
  if (portee === 'passage') chaine.setMark('conditionPassage', attrs).run();
  else if (portee === 'bloc') chaine.wrapIn('blocConditionnel', attrs).run();
  else chaine.updateAttributes(blocCourant(editor), attrs).run();
}

export function appliquerRepetition(editor: Editor, liste: string): void {
  const attrs = { repeter: liste };
  const chaine = editor.chain().focus();
  if (editor.isActive('tableRow')) chaine.updateAttributes('tableRow', attrs).run();
  else if (!editor.state.selection.empty) chaine.setMark('repeterPassage', attrs).run();
  else chaine.updateAttributes(blocCourant(editor), attrs).run();
}

/** Retire condition et répétition de la sélection, du bloc courant et du bloc conditionnel englobant. */
export function retirerRegles(editor: Editor): void {
  const vide = { si: null, valeur: null, repeter: null };
  const chaine = editor
    .chain()
    .focus()
    .unsetMark('conditionPassage', { extendEmptyMarkRange: true })
    .unsetMark('repeterPassage', { extendEmptyMarkRange: true })
    .updateAttributes('paragraph', vide)
    .updateAttributes('listItem', vide)
    .updateAttributes('tableRow', { repeter: null });
  if (editor.isActive('blocConditionnel')) chaine.lift('blocConditionnel');
  chaine.run();
}

/** Ce que TipTap ajoute pour son propre rendu (largeurs de colonnes, `colgroup`) et que le serveur refuse. */
export function nettoyerHtmlModele(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.querySelectorAll('colgroup').forEach((e) => e.remove());
  doc.querySelectorAll('table').forEach((e) => e.removeAttribute('style'));
  doc.querySelectorAll('td, th').forEach((e) => {
    e.removeAttribute('colwidth');
    if (e.getAttribute('colspan') === '1') e.removeAttribute('colspan');
    if (e.getAttribute('rowspan') === '1') e.removeAttribute('rowspan');
  });
  doc.querySelectorAll('img').forEach((img) => {
    for (const nom of img.getAttributeNames()) if (nom !== 'src' && nom !== 'alt') img.removeAttribute(nom);
  });
  return doc.body.innerHTML;
}

/** En-tête ou pied vide (« <p></p> ») : rien à enregistrer. */
export function htmlOuNull(html: string): string | null {
  const propre = nettoyerHtmlModele(html);
  return propre === '' || propre === '<p></p>' ? null : propre;
}

export function lireImage(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (fichier.type !== 'image/png' && fichier.type !== 'image/jpeg') {
      reject(new Error('Image PNG ou JPEG seulement.'));
      return;
    }
    if (fichier.size > IMAGE_MAX_OCTETS) {
      reject(new Error('Image trop lourde : 500 Ko au plus.'));
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      if (typeof lecteur.result === 'string') resolve(lecteur.result);
      else reject(new Error("Lecture de l'image impossible."));
    };
    lecteur.onerror = () => reject(new Error("Lecture de l'image impossible."));
    lecteur.readAsDataURL(fichier);
  });
}
