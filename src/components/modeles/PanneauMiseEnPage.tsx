import { EditorContent, type Editor } from '@tiptap/react';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';

export interface Marges {
  margeHaut: number;
  margeBas: number;
  margeGauche: number;
  margeDroite: number;
}

export interface Proprietes {
  libelle: string;
  ordre: number;
  actif: boolean;
}

const LIBELLES_MARGES: { cle: keyof Marges; libelle: string }[] = [
  { cle: 'margeHaut', libelle: 'Haut' },
  { cle: 'margeBas', libelle: 'Bas' },
  { cle: 'margeGauche', libelle: 'Gauche' },
  { cle: 'margeDroite', libelle: 'Droite' },
];

function bornerMarge(texte: string): number {
  const n = Number.parseInt(texte, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(60, Math.max(0, n));
}

/** Propriétés du modèle, marges en mm, en-tête et pied (même HTML restreint que le corps). */
export default function PanneauMiseEnPage({
  proprietes,
  onProprietes,
  marges,
  onMarges,
  enTete,
  pied,
}: Readonly<{
  proprietes: Proprietes;
  onProprietes: (p: Proprietes) => void;
  marges: Marges;
  onMarges: (m: Marges) => void;
  enTete: Editor | null;
  pied: Editor | null;
}>) {
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
      <section className="flex flex-col gap-2">
        <h3 className="text-micro font-medium tracking-wide text-muted-foreground uppercase">Modèle</h3>
        <Field>
          <FieldLabel htmlFor="mep-libelle">Libellé</FieldLabel>
          <Input
            id="mep-libelle"
            value={proprietes.libelle}
            maxLength={200}
            onChange={(e) => onProprietes({ ...proprietes, libelle: e.target.value })}
          />
        </Field>
        <div className="flex items-end gap-2">
          <Field className="w-24">
            <FieldLabel htmlFor="mep-ordre">Ordre</FieldLabel>
            <Input
              id="mep-ordre"
              type="number"
              value={proprietes.ordre}
              onChange={(e) => onProprietes({ ...proprietes, ordre: Number.parseInt(e.target.value, 10) || 0 })}
            />
          </Field>
          <label className="flex h-8 cursor-pointer items-center gap-2 text-body text-foreground">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={proprietes.actif}
              onChange={(e) => onProprietes({ ...proprietes, actif: e.target.checked })}
            />
            Actif (proposé dans « Imprimer »)
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-micro font-medium tracking-wide text-muted-foreground uppercase">Marges (mm) · A4</h3>
        <div className="grid grid-cols-2 gap-2">
          {LIBELLES_MARGES.map(({ cle, libelle }) => (
            <Field key={cle}>
              <FieldLabel htmlFor={`mep-${cle}`}>{libelle}</FieldLabel>
              <Input
                id={`mep-${cle}`}
                type="number"
                min={0}
                max={60}
                value={marges[cle]}
                onChange={(e) => onMarges({ ...marges, [cle]: bornerMarge(e.target.value) })}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="text-micro font-medium tracking-wide text-muted-foreground uppercase">En-tête de page</h3>
        <div className="editeur-modele-zone rounded-md border border-border bg-card px-2 py-1">
          {enTete && <EditorContent editor={enTete} />}
        </div>
        <h3 className="mt-1 text-micro font-medium tracking-wide text-muted-foreground uppercase">Pied de page</h3>
        <div className="editeur-modele-zone rounded-md border border-border bg-card px-2 py-1">
          {pied && <EditorContent editor={pied} />}
        </div>
        <p className="text-micro text-muted-foreground">
          Répétés sur chaque page. Un logo y est possible (PNG ou JPEG, 500 Ko au plus).
        </p>
      </section>
    </div>
  );
}
