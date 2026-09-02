import { useMemo } from 'react';
import SearchableSelect from './SearchableSelect';

/** Single-select over a référentiel list (`{ label, value }[]`, see
 * `referentielItems` in `lib/referentiels`), with a built-in "non renseigné"
 * option prepended — every référentiel field on Prospection/Dossier/Devis
 * forms is optional, so this is the shared shape rather than each caller
 * reimplementing the empty-option dance. Shared by `DevisFormSection`,
 * `ArticleCascadePicker`/`ChoixArticleSection` (`ProspectionDetail.tsx`),
 * and any future référentiel-backed form. Thin wrapper over the searchable
 * `SearchableSelect` — typing filters the list instead of only scrolling
 * it, same as every other dropdown in the app. */
export default function RefSelect({
  id,
  value,
  onChange,
  items,
  placeholder,
  size,
  label,
}: {
  id: string;
  value: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
  size?: 'sm' | 'default';
  /** Renders as a "Label : valeur" pill matching `MultiSelectDropdown`'s
   * trigger — for filter rows where this select sits next to
   * `MultiSelectDropdown`s (e.g. Projet/Tranche next to Catégorie/Type):
   * without it, the two components render at different heights with the
   * label on a separate line above, breaking the row's rhythm. Omit for
   * standalone fields with their own `FieldLabel` (unaffected, unchanged
   * look). */
  label?: string;
}) {
  // Sans mémoïsation, ce tableau change d'identité à chaque rendu : le
  // `useMemo` de `SearchableSelect` (`selected`) n'aboutissait jamais et la
  // `Combobox` sous-jacente voyait une nouvelle liste à chaque frappe. Ce
  // composant est utilisé une trentaine de fois, dont onze dans le seul
  // `CreateProspectForm`.
  const allItems = useMemo(
    () => [{ label: placeholder ?? '— Non renseigné —', value: '' }, ...items],
    [placeholder, items],
  );
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
