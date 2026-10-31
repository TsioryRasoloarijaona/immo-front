import { RESTRICTIONS } from '../../lib/saisieRole';
import type { ReferentielItemDto } from '../../types';
import type { RestrictionsRoleDto } from '../../types/roles';

/** Onglets Rôles et Comptes de dépôt : une case par élément du référentiel. */
export function ListeCases({ titre, items, coches, onChange }: Readonly<{
  titre: string;
  items: ReferentielItemDto[];
  coches: readonly string[];
  onChange: (ids: string[]) => void;
}>) {
  if (items.length === 0) return <p className="text-body text-muted-foreground">Aucun élément</p>;
  return (
    <fieldset className="grid grid-cols-2 gap-x-4 gap-y-1">
      <legend className="sr-only">{titre}</legend>
      {items.map((i) => (
        <label key={i.id} className="flex items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={coches.includes(i.id)}
            onChange={(e) => onChange(e.target.checked ? [...coches, i.id] : coches.filter((c) => c !== i.id))}
          />
          {i.description || i.code}
        </label>
      ))}
    </fieldset>
  );
}

/** Calculées par le serveur à partir des rôles du compte : lecture seule. */
export function RestrictionsLues({ restrictions }: Readonly<{ restrictions: RestrictionsRoleDto }>) {
  return (
    <fieldset className="grid grid-cols-2 gap-x-4 gap-y-1">
      <legend className="sr-only">Restrictions</legend>
      {RESTRICTIONS.map(({ cle, libelle }) => (
        <label key={cle} className="flex items-center gap-2 text-body">
          <input type="checkbox" checked={!!restrictions[cle]} disabled readOnly />
          {libelle}
        </label>
      ))}
    </fieldset>
  );
}
