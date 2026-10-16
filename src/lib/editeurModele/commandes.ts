import type { Editor, Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import type { CatalogueChampsDto, ChampModeleDto } from '../../types/modeles';
import { deposerImageModele, urlImageModele } from '../apiModeles';
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

/** `<img data-image="id">` : affichée dans l'éditeur par l'URL de l'API, enregistrée sans `src`. */
const ImageModele = Image.extend({
  parseHTML() {
    return [{ tag: 'img[data-image]' }];
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      dataImage: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-image'),
        renderHTML: (attrs: Record<string, unknown>) =>
          typeof attrs.dataImage === 'string' ? { 'data-image': attrs.dataImage } : {},
      },
      src: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const id = el.getAttribute('data-image');
          return id ? urlImageModele(id) : null;
        },
      },
    };
  },
});

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
    ImageModele.configure({ allowBase64: false, inline: false }),
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
  // `src` ne sert qu'à l'affichage dans l'éditeur : le serveur le refuse.
  doc.querySelectorAll('img').forEach((img) => {
    for (const nom of img.getAttributeNames()) if (nom !== 'data-image' && nom !== 'alt') img.removeAttribute(nom);
  });
  return doc.body.innerHTML;
}

/** En-tête ou pied vide (« <p></p> ») : rien à enregistrer. */
export function htmlOuNull(html: string): string | null {
  const propre = nettoyerHtmlModele(html);
  return propre === '' || propre === '<p></p>' ? null : propre;
}

/** Dépose l'image dans le stockage puis l'insère par son id ; le serveur revérifie type et poids. */
export async function insererImage(editor: Editor, fichier: File): Promise<void> {
  if (fichier.type !== 'image/png' && fichier.type !== 'image/jpeg') throw new Error('Image PNG ou JPEG seulement.');
  if (fichier.size > IMAGE_MAX_OCTETS) throw new Error('Image trop lourde : 500 Ko au plus.');
  const image = await deposerImageModele(fichier);
  editor
    .chain()
    .focus()
    .insertContent({ type: 'image', attrs: { dataImage: image.id, src: urlImageModele(image.id) } })
    .run();
}
