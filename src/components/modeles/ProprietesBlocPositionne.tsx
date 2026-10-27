import { useEditorState, type Editor } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import {
  PAGE_HAUTEUR_CM,
  PAGE_LARGEUR_CM,
  TAILLE_MAX_PT,
  TAILLE_MIN_PT,
  bornerBloc,
  type AlignementBloc,
  type AttributsBloc,
} from '../../lib/editeurModele/blocPositionne';

type CleNombre = 'x' | 'y' | 'l' | 'h' | 'taille';

const CHAMPS: { cle: CleNombre; libelle: string; min: number; max: number; pas: number }[] = [
  { cle: 'x', libelle: 'X (cm)', min: 0, max: PAGE_LARGEUR_CM, pas: 0.1 },
  { cle: 'y', libelle: 'Y (cm)', min: 0, max: PAGE_HAUTEUR_CM, pas: 0.1 },
  { cle: 'l', libelle: 'Largeur (cm)', min: 0.5, max: PAGE_LARGEUR_CM, pas: 0.1 },
  { cle: 'h', libelle: 'Hauteur (cm)', min: 0.5, max: PAGE_HAUTEUR_CM, pas: 0.1 },
  { cle: 'taille', libelle: 'Taille (pt)', min: TAILLE_MIN_PT, max: TAILLE_MAX_PT, pas: 0.25 },
];

/** Position, taille et mise en forme du bloc positionné sélectionné (origine : coin haut gauche de la page). */
export default function ProprietesBlocPositionne({ editor }: Readonly<{ editor: Editor }>) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: e }) => (e.isActive('blocPositionne') ? (e.getAttributes('blocPositionne') as AttributsBloc) : null),
  });
  if (!attrs) return null;

  const appliquer = (partiel: Partial<AttributsBloc>) =>
    editor.chain().updateAttributes('blocPositionne', bornerBloc({ ...attrs, ...partiel })).run();

  return (
    <fieldset className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
      <legend className="sr-only">Bloc positionné</legend>
      {CHAMPS.map(({ cle, libelle, min, max, pas }) => (
        <Field key={cle} className="w-24">
          <FieldLabel htmlFor={`bloc-${cle}`}>{libelle}</FieldLabel>
          <Input
            id={`bloc-${cle}`}
            type="number"
            min={min}
            max={max}
            step={pas}
            value={attrs[cle]}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value);
              if (!Number.isNaN(n)) appliquer({ [cle]: n });
            }}
          />
        </Field>
      ))}
      <Field className="w-28">
        <FieldLabel htmlFor="bloc-align">Alignement</FieldLabel>
        <select
          id="bloc-align"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-body"
          value={attrs.align}
          onChange={(e) => appliquer({ align: e.target.value as AlignementBloc })}
        >
          <option value="left">Gauche</option>
          <option value="center">Centré</option>
          <option value="right">Droite</option>
        </select>
      </Field>
      <label className="flex h-8 cursor-pointer items-center gap-2 text-body text-foreground">
        <input
          type="checkbox"
          className="size-3.5 accent-primary"
          checked={attrs.gras}
          onChange={(e) => appliquer({ gras: e.target.checked })}
        />
        Gras
      </label>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteNode('blocPositionne').run()}>
        <Trash2 data-icon="inline-start" /> Supprimer le bloc
      </Button>
    </fieldset>
  );
}
