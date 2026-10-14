import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';

/** Choix unique d'une barre de filtres. Le nom du filtre est dans chaque libellé
 * (« Archivé : Non ») : le déclencheur n'affiche que la valeur choisie. */
export default function SelectFiltre<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  disabled,
}: Readonly<{
  ariaLabel: string;
  items: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}>) {
  return (
    <Select items={items} value={value} disabled={disabled} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
