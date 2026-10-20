import { Input } from '../ui/input';

/** Noms de couleurs .NET (OMRAN `ColorName`) : CSS les comprend tels quels. */
const COULEURS = [
  'Black', 'Blue', 'Brown', 'Chocolate', 'Coral', 'CornflowerBlue', 'Crimson', 'Cyan', 'DarkGreen', 'DarkOrange',
  'DeepPink', 'DodgerBlue', 'Gold', 'Gray', 'Green', 'HotPink', 'Indigo', 'Khaki', 'Lavender', 'LightBlue',
  'LightGreen', 'Lime', 'Magenta', 'MediumOrchid', 'Navy', 'Orange', 'Orchid', 'Pink', 'Purple', 'Red',
  'RoyalBlue', 'Salmon', 'SeaGreen', 'SkyBlue', 'Teal', 'Tomato', 'Turquoise', 'Violet', 'White', 'Yellow',
];

export function PastilleCouleur({ nom }: Readonly<{ nom: string }>) {
  return <span aria-hidden className="inline-block size-3 shrink-0 rounded-full border border-border" style={{ background: nom }} />;
}

export default function SelecteurCouleur({ id, valeur, onChange, desactive }: Readonly<{
  id: string;
  valeur: string;
  onChange: (valeur: string) => void;
  desactive: boolean;
}>) {
  return (
    <div className="flex items-center gap-2">
      <PastilleCouleur nom={valeur} />
      <Input id={id} list={`${id}-couleurs`} value={valeur} disabled={desactive} placeholder="MediumOrchid, Gold…"
        onChange={(e) => onChange(e.target.value)} />
      <datalist id={`${id}-couleurs`}>
        {COULEURS.map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}
