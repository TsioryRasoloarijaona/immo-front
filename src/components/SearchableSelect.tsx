import { useMemo } from 'react';
import { Combobox, ComboboxContent, ComboboxItem, ComboboxTrigger } from './ui/combobox';

export interface SearchableSelectOption {
  label: string;
  value: string;
}

/** Drop-in replacement for the plain `<Select items={…} value={…}
 * onValueChange={…}><SelectTrigger>…<SelectContent>…</Select>` block used
 * everywhere in the app — same `items`/`value`/`onValueChange` contract,
 * so swapping one for the other is mechanical, but the trigger is a real
 * text field: typing filters the list instead of only scrolling it. Built
 * on `@base-ui/react/combobox` (the same vendor as the plain `Select`
 * already in use, just the search-capable sibling component). Single-select
 * only — `MultiSelectDropdown` covers the multi-select case with its own
 * built-in search box. */
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
}: {
  id?: string;
  items: SearchableSelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  /** "Label :" prefix pill, matching `MultiSelectDropdown` — see `ComboboxTrigger`. */
  label?: string;
}) {
  // An empty string is treated the same as no selection at all (RefSelect's
  // prepended "— Non renseigné —" item uses `value: ''`) — otherwise that
  // item would render as a real selection (foreground text) instead of the
  // muted placeholder look every other unselected field gets.
  const selected = useMemo(() => (value ? items.find((i) => i.value === value) ?? null : null), [items, value]);

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(next) => onValueChange(next ? (next as SearchableSelectOption).value : null)}
      isItemEqualToValue={(a: SearchableSelectOption, b: SearchableSelectOption) => a?.value === b?.value}
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
