import { useMemo } from 'react';
import { Combobox, ComboboxContent, ComboboxItem, ComboboxTrigger } from './ui/combobox';

export interface SearchableSelectOption {
  label: string;
  value: string;
}

export default function SearchableSelect({
  id,
  items,
  value,
  onValueChange,
  placeholder,
  size,
  disabled,
  className,
  emptyMessage,
  label,
}: Readonly<{
  id?: string;
  items: SearchableSelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  label?: string;
}>) {
  // '' vaut « aucune sélection » : l'option « — Non renseigné — » de RefSelect
  // doit garder l'aspect du placeholder.
  const selected = useMemo(() => (value ? items.find((i) => i.value === value) ?? null : null), [items, value]);

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(next) => onValueChange(next ? (next).value : null)}
      isItemEqualToValue={(a: SearchableSelectOption | null, b: SearchableSelectOption | null) => a?.value === b?.value}
    >
      <ComboboxTrigger id={id} size={size} placeholder={placeholder} disabled={disabled} className={className} label={label} />
      <ComboboxContent emptyMessage={emptyMessage}>
        {(item: unknown) => {
          const option = item as SearchableSelectOption;
          return (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          );
        }}
      </ComboboxContent>
    </Combobox>
  );
}
