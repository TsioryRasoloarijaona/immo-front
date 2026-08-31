import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '../lib/utils';

/**
 * A dropdown-trigger multi-select filter: a compact single-line button that
 * opens a checkbox list on click, instead of an always-open box — keeps the
 * filter bar to one row so the table underneath gets the vertical space
 * back. Built on the shadcn/base-ui dropdown menu's `CheckboxItem` (stays
 * open across clicks by default — `closeOnClick` defaults to `false` for
 * checkbox items, so multiple boxes can be ticked in one open menu).
 */
export default function MultiSelectDropdown({
  label,
  placeholder,
  value,
  onChange,
  items,
  disabled,
  badge,
  className,
}: {
  label: string;
  placeholder: string;
  value?: string[];
  onChange?: (values: string[]) => void;
  items: { label: string; value: string }[];
  disabled?: boolean;
  badge?: ReactNode;
  className?: string;
}) {
  const selected = value ?? [];

  function toggle(itemValue: string) {
    onChange?.(selected.includes(itemValue) ? selected.filter((v) => v !== itemValue) : [...selected, itemValue]);
  }

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (items.find((i) => i.value === selected[0])?.label ?? placeholder)
        : `${selected.length} sélectionnés`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'flex h-8 max-w-55 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50',
          className,
        )}
      >
        <span className="shrink-0 text-muted-foreground">{label} :</span>
        <span className={cn('truncate', selected.length > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {triggerLabel}
        </span>
        {badge}
        <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 w-56" align="start">
        {items.length === 0 ? (
          <p className="px-2 py-2 text-body text-muted-foreground">Aucun élément.</p>
        ) : (
          items.map((item) => (
            <DropdownMenuCheckboxItem
              key={item.value}
              checked={selected.includes(item.value)}
              onCheckedChange={() => toggle(item.value)}
            >
              {item.label}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
