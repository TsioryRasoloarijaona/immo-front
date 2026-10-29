import { CLASSE_LIGNE } from '../../../components/liste/BoiteFiltre';
import type { Ligne } from './types';

const RESTRICTIONS = [
  'Fichiers attachés : ajout', 'Fichiers attachés : modification', 'Fichiers attachés : suppression', 'Actions : ajout', 'Actions : modification',
  'Actions : suppression', 'Éditions des rapports', 'Audits', 'Champs spécifiques', 'Modification des séquences',
];

/** Bloc titré : les libellés OMRAN des restrictions ne tiennent pas dans la colonne étroite des champs. */
export default function RestrictionsRole({ ligne }: Readonly<{ ligne: Ligne }>) {
  return (
    <section aria-label="Restrictions du rôle" className="mt-3 rounded-lg border border-border">
      <div className="border-b border-border px-2 py-1 text-body font-semibold text-foreground">Avec restriction sur…</div>
      <ul className="grid grid-cols-2 gap-x-6 p-2">
        {RESTRICTIONS.map((r, i) => (
          <li key={r}>
            <label className={CLASSE_LIGNE}>
              <input type="checkbox" className="m-0 accent-(--brand)" checked={ligne[`restr${i + 1}`] === true} readOnly disabled />
              <span className="truncate">{r}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
