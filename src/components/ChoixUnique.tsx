import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type Item = { label: string; value: string };

/** Valeur sentinelle du choix « Tous » : sans elle, un filtre choisi ne se retire qu'en réinitialisant tout. */
const TOUS = '__tous';

/** Liste déroulante à choix unique ; `tous` (libellé) ajoute en tête un choix qui rend `null`. */
export default function ChoixUnique({
  items,
  value,
  placeholder,
  largeur,
  tous,
  onChange,
}: Readonly<{
  items: Item[];
  value: string | null;
  placeholder?: string;
  largeur: string;
  tous?: string;
  onChange: (v: string | null) => void;
}>) {
  const choix = tous ? [{ label: tous, value: TOUS }, ...items] : items;
  return (
    <Select items={choix} value={value} onValueChange={(v) => onChange(v === TOUS ? null : v)}>
      <SelectTrigger className={largeur}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {choix.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
