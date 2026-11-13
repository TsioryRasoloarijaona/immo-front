import type { GroupeSaisieDto } from '../../../types/projet';

const CHAMP = 'h-7 min-w-0 rounded-sm border bg-transparent px-1 text-body focus:border-ring focus:outline-none';

/** Édition en ligne du groupe sélectionné : code, description (obligatoire) et notes. */
export default function FormulaireGroupe({ groupe, onChanger }: Readonly<{ groupe: GroupeSaisieDto; onChanger: (patch: Partial<GroupeSaisieDto>) => void }>) {
  const sansDescription = !groupe.description?.trim();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-2" role="group" aria-label="Groupe sélectionné">
      <input aria-label="Code du groupe" className={`${CHAMP} w-24`} value={groupe.code ?? ''} onChange={(e) => onChanger({ code: e.target.value })} />
      <input
        aria-label="Description du groupe"
        aria-invalid={sansDescription}
        required
        className={`${CHAMP} w-72 ${sansDescription ? 'border-destructive' : ''}`}
        value={groupe.description ?? ''}
        onChange={(e) => onChanger({ description: e.target.value })}
      />
      <input aria-label="Notes du groupe" placeholder="Notes" className={`${CHAMP} min-w-48 flex-1`} value={groupe.notes ?? ''} onChange={(e) => onChanger({ notes: e.target.value || null })} />
      {sansDescription && <span className="text-body text-destructive">Description obligatoire</span>}
    </div>
  );
}
