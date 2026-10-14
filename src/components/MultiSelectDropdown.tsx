import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '../lib/utils';

/** `CheckboxItem` garde le menu ouvert entre deux clics (`closeOnClick` vaut
 * `false` par défaut) : plusieurs cases se cochent d'un coup. */
export default function MultiSelectDropdown({
  label,
  ariaLabel,
  placeholder,
  value,
  onChange,
  items,
  disabled,
  badge,
  className,
  entete,
}: Readonly<{
  /** À omettre quand l'étiquette est déjà posée à côté, sinon elle est répétée. */
  label?: string;
  /** Nom accessible du déclencheur, quand `label` est omis : sans lui un
   * lecteur d'écran n'annoncerait que « Tous ». */
  ariaLabel?: string;
  placeholder: string;
  value?: string[];
  onChange?: (values: string[]) => void;
  items: { label: string; value: string }[];
  disabled?: boolean;
  badge?: ReactNode;
  className?: string;
  /** Rendu en tête du menu, avant les éléments (ex. une case hors liste). */
  entete?: ReactNode;
}>) {
  const selected = value ?? [];

  function toggle(itemValue: string) {
    onChange?.(selected.includes(itemValue) ? selected.filter((v) => v !== itemValue) : [...selected, itemValue]);
  }

  let triggerLabel = placeholder;
  if (selected.length === 1) triggerLabel = items.find((i) => i.value === selected[0])?.label ?? placeholder;
  else if (selected.length > 1) triggerLabel = `${selected.length} sélectionnés`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        className={cn(
          'flex h-8 max-w-55 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50',
          className,
        )}
      >
        {label && <span className="shrink-0 text-muted-foreground">{label} :</span>}
        <span className={cn('truncate', selected.length > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {triggerLabel}
        </span>
        {badge}
        <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 w-56" align="start">
        {entete}
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
