import { Node, mergeAttributes } from '@tiptap/react';
import type { Node as PmNode } from '@tiptap/pm/model';

/* Bloc positionné (`div[data-bloc]`) : cadre placé à la page, en cm depuis son coin haut gauche
   (FEATURE-vente-formulaire-barid.md §3.2). Le serveur refuse tout bloc hors page ou hors bornes. */

export const PAGE_LARGEUR_CM = 21;
export const PAGE_HAUTEUR_CM = 29.7;
export const TAILLE_MIN_PT = 6;
export const TAILLE_MAX_PT = 72;
const LARGEUR_MIN_CM = 0.5;
const PX_PAR_CM = 96 / 2.54;

export type AlignementBloc = 'left' | 'center' | 'right';

export interface AttributsBloc {
  x: number;
  y: number;
  l: number;
  h: number;
  taille: number;
  gras: boolean;
  align: AlignementBloc;
}

export const BLOC_PAR_DEFAUT: AttributsBloc = { x: 2, y: 2, l: 6, h: 1, taille: 10, gras: false, align: 'left' };

const borner = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const aLaGrille = (v: number) => Math.round(v * 10) / 10;

/** Ramène le bloc dans la page (x + l ≤ 21, y + h ≤ 29,7), sur la grille de 0,1 cm, taille 6–72 pt. */
export function bornerBloc(a: AttributsBloc): AttributsBloc {
  const l = borner(aLaGrille(a.l), LARGEUR_MIN_CM, PAGE_LARGEUR_CM);
  const h = borner(aLaGrille(a.h), LARGEUR_MIN_CM, PAGE_HAUTEUR_CM);
  return {
    ...a,
    l,
    h,
    x: aLaGrille(borner(a.x, 0, PAGE_LARGEUR_CM - l)),
    y: aLaGrille(borner(a.y, 0, PAGE_HAUTEUR_CM - h)),
    taille: borner(Math.round(a.taille * 4) / 4, TAILLE_MIN_PT, TAILLE_MAX_PT),
  };
}

const attrNombre = (nom: string, defaut: number) => ({
  default: defaut,
  parseHTML: (el: HTMLElement) => {
    const n = Number.parseFloat(el.getAttribute(nom) ?? '');
    return Number.isNaN(n) ? defaut : n;
  },
  renderHTML: (a: Record<string, unknown>) => ({ [nom]: String(a[nom.replace('data-', '')]) }),
});

function alignementDe(valeur: unknown): AlignementBloc {
  return valeur === 'center' || valeur === 'right' ? valeur : 'left';
}

function habiller(dom: HTMLElement, contenu: HTMLElement, noeud: PmNode): void {
  const a = noeud.attrs as AttributsBloc;
  Object.assign(dom.style, { left: `${a.x}cm`, top: `${a.y}cm`, width: `${a.l}cm`, height: `${a.h}cm` });
  Object.assign(contenu.style, {
    fontSize: `${a.taille}pt`,
    fontWeight: a.gras ? '700' : '400',
    textAlign: alignementDe(a.align),
  });
}

function poignee(classe: string, titre: string): HTMLElement {
  const el = document.createElement('span');
  el.className = classe;
  el.title = titre;
  el.contentEditable = 'false';
  return el;
}

export const BlocPositionne = Node.create({
  name: 'blocPositionne',
  group: 'block',
  content: 'inline*',
  marks: '',
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      x: attrNombre('data-x', BLOC_PAR_DEFAUT.x),
      y: attrNombre('data-y', BLOC_PAR_DEFAUT.y),
      l: attrNombre('data-l', BLOC_PAR_DEFAUT.l),
      h: attrNombre('data-h', BLOC_PAR_DEFAUT.h),
      taille: attrNombre('data-taille', BLOC_PAR_DEFAUT.taille),
      gras: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-gras') === 'true',
        renderHTML: (a: Record<string, unknown>) => (a.gras ? { 'data-gras': 'true' } : {}),
      },
      align: {
        default: 'left',
        parseHTML: (el: HTMLElement) => alignementDe(el.getAttribute('data-align')),
        renderHTML: (a: Record<string, unknown>) => ({ 'data-align': alignementDe(a.align) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-bloc]', priority: 100 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-bloc': '' }, HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    // Pas de second bloc par Entrée : un bloc est un cadre, pas un paragraphe.
    return { Enter: () => this.editor.isActive('blocPositionne') };
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'bloc-positionne';
      const deplacer = poignee('bloc-positionne-poignee', 'Déplacer le bloc');
      const contenu = document.createElement('div');
      contenu.className = 'bloc-positionne-contenu';
      const coin = poignee('bloc-positionne-coin', 'Redimensionner le bloc');
      dom.append(deplacer, contenu, coin);
      let courant = node;
      habiller(dom, contenu, node);

      function modifier(partiel: Partial<AttributsBloc>) {
        const pos = getPos();
        if (pos === undefined) return;
        const attrs = bornerBloc({ ...(courant.attrs as AttributsBloc), ...partiel });
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, attrs));
      }

      function glisser(cible: HTMLElement, calcul: (dx: number, dy: number, debut: AttributsBloc) => Partial<AttributsBloc>) {
        cible.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          cible.setPointerCapture(e.pointerId);
          const pos = getPos();
          if (pos !== undefined) editor.chain().focus().setTextSelection(pos + 1).run();
          const debut = { ...(courant.attrs as AttributsBloc) };
          const bouger = (ev: PointerEvent) =>
            modifier(calcul((ev.clientX - e.clientX) / PX_PAR_CM, (ev.clientY - e.clientY) / PX_PAR_CM, debut));
          const finir = () => {
            cible.removeEventListener('pointermove', bouger);
            cible.removeEventListener('pointerup', finir);
            cible.removeEventListener('pointercancel', finir);
          };
          cible.addEventListener('pointermove', bouger);
          cible.addEventListener('pointerup', finir);
          cible.addEventListener('pointercancel', finir);
        });
      }
      glisser(deplacer, (dx, dy, d) => ({ x: d.x + dx, y: d.y + dy }));
      glisser(coin, (dx, dy, d) => ({
        l: Math.min(d.l + dx, PAGE_LARGEUR_CM - d.x),
        h: Math.min(d.h + dy, PAGE_HAUTEUR_CM - d.y),
      }));

      return {
        dom,
        contentDOM: contenu,
        update(maj) {
          if (maj.type !== node.type) return false;
          courant = maj;
          habiller(dom, contenu, maj);
          return true;
        },
        stopEvent: (ev) => ev.target === deplacer || ev.target === coin,
        ignoreMutation: (m) => m.type !== 'selection' && !contenu.contains(m.target),
      };
    };
  },
});
