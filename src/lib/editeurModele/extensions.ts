import { Extension, Mark, Node } from '@tiptap/react';
import type { Node as PmNode, Mark as PmMark } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/* Extensions de l'éditeur de modèles : elles produisent exactement le HTML restreint du serveur
   (FEATURE-modeles-documents.md §5). Aucune classe ni style hors `text-align` : le serveur les refuse. */

type Attrs = Record<string, unknown>;

const attrTexte = (nom: string) => ({
  default: null,
  parseHTML: (el: HTMLElement) => el.getAttribute(nom),
  renderHTML: (a: Attrs) => (typeof a[cleAttr(nom)] === 'string' ? { [nom]: a[cleAttr(nom)] } : {}),
});

/** `data-repeter` → `repeter`, `data-si` → `si`, `data-valeur` → `valeur`. */
function cleAttr(nom: string): string {
  return nom.replace('data-', '');
}

const ATTRS_CONDITION = { si: attrTexte('data-si'), valeur: attrTexte('data-valeur') };

/** Champ du catalogue : étiquette non modifiable, `<span data-champ="cle">libellé</span>`. */
export const ChampModele = Node.create({
  name: 'champ',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      cle: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-champ') ?? '',
        renderHTML: (a: Attrs) => ({ 'data-champ': a.cle }),
      },
      libelle: {
        default: '',
        parseHTML: (el: HTMLElement) => el.textContent,
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-champ]', priority: 100 }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const libelle = typeof node.attrs.libelle === 'string' && node.attrs.libelle ? node.attrs.libelle : String(node.attrs.cle);
    return ['span', HTMLAttributes, libelle];
  },
  renderText({ node }) {
    return `[${String(node.attrs.libelle || node.attrs.cle)}]`;
  },
});

/** Passage répété (`span data-repeter`) : priorité haute pour envelopper la condition et le gras. */
export const RepeterPassage = Mark.create({
  name: 'repeterPassage',
  priority: 1100,
  inclusive: false,
  addAttributes() {
    return { repeter: attrTexte('data-repeter') };
  },
  parseHTML() {
    return [{ tag: 'span[data-repeter]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

/** Passage conditionnel (`span data-si`). */
export const ConditionPassage = Mark.create({
  name: 'conditionPassage',
  priority: 1050,
  inclusive: false,
  addAttributes() {
    return ATTRS_CONDITION;
  },
  parseHTML() {
    return [{ tag: 'span[data-si]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

/** Bloc conditionnel de plusieurs paragraphes (`div data-si`), ex. la section SAV de l'acte. */
export const BlocConditionnel = Node.create({
  name: 'blocConditionnel',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return ATTRS_CONDITION;
  },
  parseHTML() {
    return [{ tag: 'div[data-si]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
});

export const SautPage = Node.create({
  name: 'sautPage',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-saut-page]' }];
  },
  renderHTML() {
    return ['div', { 'data-saut-page': '' }];
  },
});

/** Attributs posés sur les blocs existants : répétition, condition, numérotation des titres. */
export const AttributsModele = Extension.create({
  name: 'attributsModele',
  addGlobalAttributes() {
    return [
      { types: ['paragraph', 'listItem', 'tableRow'], attributes: { repeter: attrTexte('data-repeter') } },
      { types: ['paragraph', 'listItem'], attributes: ATTRS_CONDITION },
      {
        types: ['heading'],
        attributes: {
          numero: {
            default: false,
            parseHTML: (el: HTMLElement) => el.hasAttribute('data-numero'),
            renderHTML: (a: Attrs) => (a.numero ? { 'data-numero': '' } : {}),
          },
        },
      },
    ];
  },
});

/** Libellé visible d'une condition ou d'une répétition (« si Terrain = non », « ↻ Échéances »). */
export type Etiqueteur = (attrs: { si?: string | null; valeur?: string | null; repeter?: string | null }) => string | null;

interface OptionsEtiquettes {
  etiqueteur: { courant: Etiqueteur };
}

function etiquette(attrs: Attrs, etiqueteur: Etiqueteur): string | null {
  return etiqueteur({
    si: typeof attrs.si === 'string' ? attrs.si : null,
    valeur: typeof attrs.valeur === 'string' ? attrs.valeur : null,
    repeter: typeof attrs.repeter === 'string' ? attrs.repeter : null,
  });
}

function widgetEtiquette(texte: string): HTMLElement {
  const el = document.createElement('span');
  el.className = 'modele-etiquette';
  el.contentEditable = 'false';
  el.textContent = texte;
  return el;
}

function marqueEtiquetee(marks: readonly PmMark[]): PmMark | undefined {
  return marks.find((m) => m.type.name === 'repeterPassage' || m.type.name === 'conditionPassage');
}

function decorationsDe(doc: PmNode, etiqueteur: Etiqueteur): DecorationSet {
  const decorations: Decoration[] = [];
  let precedentes: readonly PmMark[] = [];
  doc.descendants((node, pos) => {
    if (node.isBlock) {
      const texte = etiquette(node.attrs, etiqueteur);
      if (texte) {
        decorations.push(Decoration.node(pos, pos + node.nodeSize, { 'data-etiquette': texte }));
        decorations.push(Decoration.widget(pos + (node.type.name === 'tableRow' ? 2 : 1), () => widgetEtiquette(texte), { side: -1 }));
      }
      precedentes = [];
      return true;
    }
    for (const mark of node.marks) {
      if (marqueEtiquetee([mark]) && !mark.isInSet(precedentes)) {
        const texte = etiquette(mark.attrs, etiqueteur);
        if (texte) decorations.push(Decoration.widget(pos, () => widgetEtiquette(texte), { side: -1 }));
      }
    }
    precedentes = node.marks;
    return false;
  });
  return DecorationSet.create(doc, decorations);
}

/** Liseré et étiquette sur les éléments conditionnels ou répétés, sans toucher au HTML enregistré. */
export const EtiquettesModele = Extension.create<OptionsEtiquettes>({
  name: 'etiquettesModele',
  addOptions() {
    return { etiqueteur: { courant: () => null } };
  },
  addProseMirrorPlugins() {
    const etiqueteur = this.options.etiqueteur;
    return [
      new Plugin({
        key: new PluginKey('etiquettesModele'),
        props: {
          decorations: (state) => decorationsDe(state.doc, etiqueteur.courant),
        },
      }),
    ];
  },
});
