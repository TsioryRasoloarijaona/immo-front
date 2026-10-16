import { useRef, type ReactNode } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  GitBranch,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Repeat,
  Rows3,
  SeparatorHorizontal,
  Table as IconeTableau,
  Trash2,
  Underline,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { insererImage, retirerRegles } from '../../lib/editeurModele/commandes';

function Bouton({
  titre,
  actif,
  desactive,
  onClick,
  children,
}: Readonly<{ titre: string; actif?: boolean; desactive?: boolean; onClick: () => void; children: ReactNode }>) {
  return (
    <button
      type="button"
      title={titre}
      aria-label={titre}
      aria-pressed={actif}
      disabled={desactive}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4',
        actif && 'bg-(--brand-bg) text-(--brand)',
      )}
    >
      {children}
    </button>
  );
}

function Separateur() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

/** Barre d'outils de l'éditeur actif (corps, en-tête ou pied). */
export default function BarreOutilsModele({
  editor,
  onCondition,
  onRepeter,
  onErreur,
}: Readonly<{
  editor: Editor;
  onCondition: () => void;
  onRepeter: () => void;
  onErreur: (message: string) => void;
}>) {
  const fichier = useRef<HTMLInputElement>(null);
  const etat = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      gras: e.isActive('bold'),
      italique: e.isActive('italic'),
      souligne: e.isActive('underline'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      numerote: e.isActive('heading', { numero: true }),
      puces: e.isActive('bulletList'),
      numeros: e.isActive('orderedList'),
      gauche: e.isActive({ textAlign: 'left' }),
      centre: e.isActive({ textAlign: 'center' }),
      droite: e.isActive({ textAlign: 'right' }),
      justifie: e.isActive({ textAlign: 'justify' }),
      tableau: e.isActive('table'),
    }),
  });

  const chaine = () => editor.chain().focus();

  async function ajouterImage(f: File | undefined) {
    if (!f) return;
    try {
      await insererImage(editor, f);
    } catch (err) {
      onErreur(err instanceof Error ? err.message : "Image refusée.");
    } finally {
      if (fichier.current) fichier.current.value = '';
    }
  }

  return (
    <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-card px-1.5 py-1">
      <Bouton titre="Gras" actif={etat.gras} onClick={() => chaine().toggleBold().run()}><Bold /></Bouton>
      <Bouton titre="Italique" actif={etat.italique} onClick={() => chaine().toggleItalic().run()}><Italic /></Bouton>
      <Bouton titre="Souligné" actif={etat.souligne} onClick={() => chaine().toggleUnderline().run()}><Underline /></Bouton>
      <Separateur />
      <Bouton titre="Titre 1" actif={etat.h1} onClick={() => chaine().toggleHeading({ level: 1 }).run()}><Heading1 /></Bouton>
      <Bouton titre="Titre 2" actif={etat.h2 && !etat.numerote} onClick={() => chaine().toggleHeading({ level: 2 }).run()}><Heading2 /></Bouton>
      <Bouton titre="Titre 3" actif={etat.h3} onClick={() => chaine().toggleHeading({ level: 3 }).run()}><Heading3 /></Bouton>
      <Bouton
        titre="Titre de section numéroté (1-, 2-… à la génération)"
        actif={etat.numerote}
        onClick={() =>
          etat.numerote
            ? chaine().updateAttributes('heading', { numero: false }).run()
            : chaine().setHeading({ level: 2 }).updateAttributes('heading', { numero: true }).run()
        }
      >
        <Hash />
      </Bouton>
      <Separateur />
      <Bouton titre="Liste à puces" actif={etat.puces} onClick={() => chaine().toggleBulletList().run()}><List /></Bouton>
      <Bouton titre="Liste numérotée" actif={etat.numeros} onClick={() => chaine().toggleOrderedList().run()}><ListOrdered /></Bouton>
      <Separateur />
      <Bouton titre="Aligner à gauche" actif={etat.gauche} onClick={() => chaine().setTextAlign('left').run()}><AlignLeft /></Bouton>
      <Bouton titre="Centrer" actif={etat.centre} onClick={() => chaine().setTextAlign('center').run()}><AlignCenter /></Bouton>
      <Bouton titre="Aligner à droite" actif={etat.droite} onClick={() => chaine().setTextAlign('right').run()}><AlignRight /></Bouton>
      <Bouton titre="Justifier" actif={etat.justifie} onClick={() => chaine().setTextAlign('justify').run()}><AlignJustify /></Bouton>
      <Separateur />
      <Bouton
        titre="Insérer un tableau"
        onClick={() => chaine().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <IconeTableau />
      </Bouton>
      <Bouton titre="Ajouter une ligne" desactive={!etat.tableau} onClick={() => chaine().addRowAfter().run()}><Rows3 /></Bouton>
      <Bouton titre="Supprimer la ligne" desactive={!etat.tableau} onClick={() => chaine().deleteRow().run()}><Minus /></Bouton>
      <Bouton titre="Supprimer le tableau" desactive={!etat.tableau} onClick={() => chaine().deleteTable().run()}><Trash2 /></Bouton>
      <Bouton titre="Image (PNG ou JPEG, 500 Ko au plus)" onClick={() => fichier.current?.click()}><ImagePlus /></Bouton>
      <input
        ref={fichier}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void ajouterImage(e.target.files?.[0])}
      />
      <Bouton titre="Saut de page" onClick={() => chaine().insertContent({ type: 'sautPage' }).run()}><SeparatorHorizontal /></Bouton>
      <Separateur />
      <Bouton titre="Condition : afficher selon un champ" onClick={onCondition}><GitBranch /></Bouton>
      <Bouton titre="Répéter pour chaque élément d'une liste" onClick={onRepeter}><Repeat /></Bouton>
      <Bouton titre="Retirer condition et répétition" onClick={() => retirerRegles(editor)}><Eraser /></Bouton>
    </div>
  );
}
