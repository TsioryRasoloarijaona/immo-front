import SearchableSelect from './SearchableSelect';

export default function RefSelect({
  id,
  value,
  onChange,
  items,
  placeholder,
  size,
  label,
}: Readonly<{
  id: string;
  value: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
  size?: 'sm' | 'default';
  /** Pastille « Label : valeur », à la hauteur d'un `MultiSelectDropdown` voisin.
   * À omettre pour un champ qui a son propre `FieldLabel`. */
  label?: string;
}>) {
  const allItems = [{ label: placeholder ?? '— Non renseigné —', value: '' }, ...items];
  return (
    <SearchableSelect
      id={id}
      items={allItems}
      value={value ?? ''}
      onValueChange={(v) => onChange(v || null)}
      placeholder={placeholder}
      size={size}
      label={label}
    />
  );
}
