import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import DataGrid from '../../DataGrid';
import { formatCurrency } from '../../../lib/format';
import { COLONNES_BORDEREAU_LIGNES, idsGroupeEtDescendants } from '../../../lib/sousFenetresLot';
import { cn } from '../../../lib/utils';
import type { GroupeBordereauDto, LigneBordereauDto, TotauxBordereauDto } from '../../../types/projet';

function NoeudGroupe({
  groupe,
  enfants,
  ouverts,
  selection,
  niveau,
  onBasculer,
  onChoisir,
}: Readonly<{
  groupe: GroupeBordereauDto;
  enfants: Map<string | null, GroupeBordereauDto[]>;
  ouverts: Set<string>;
  selection: string | null;
  niveau: number;
  onBasculer: (id: string) => void;
  onChoisir: (id: string) => void;
}>) {
  const fils = enfants.get(groupe.id) ?? [];
  const ouvert = ouverts.has(groupe.id);
  return (
    <li>
      <div className="flex items-center" style={{ paddingLeft: niveau * 12 }}>
        {fils.length > 0 ? (
          <button type="button" aria-label={ouvert ? 'Replier' : 'Déplier'} className="p-0.5" onClick={() => onBasculer(groupe.id)}>
            {ouvert ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <button
          type="button"
          className={cn('truncate rounded-sm px-1 py-0.5 text-left text-body hover:bg-muted', selection === groupe.id && 'bg-muted font-semibold')}
          onClick={() => onChoisir(groupe.id)}
        >
          {[groupe.code, groupe.description].filter(Boolean).join(' · ') || '—'}
        </button>
      </div>
      {ouvert && fils.length > 0 && (
        <ul>
          {fils.map((f) => (
            <NoeudGroupe key={f.id} groupe={f} enfants={enfants} ouverts={ouverts} selection={selection} niveau={niveau + 1} onBasculer={onBasculer} onChoisir={onChoisir} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Bordereau : arbre des groupes à gauche (la sélection filtre les lignes), grille et totaux à droite. */
export default function BordereauAvecArbre({
  groupes,
  lignes,
  totaux,
  cleOrdre,
}: Readonly<{ groupes: GroupeBordereauDto[]; lignes: LigneBordereauDto[]; totaux: TotauxBordereauDto; cleOrdre: string }>) {
  const [selection, setSelection] = useState<string | null>(null);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const enfants = useMemo(() => {
    const m = new Map<string | null, GroupeBordereauDto[]>();
    for (const g of groupes) m.set(g.parentId, [...(m.get(g.parentId) ?? []), g]);
    return m;
  }, [groupes]);
  const lignesVisibles = useMemo(() => {
    if (!selection) return lignes;
    const ids = idsGroupeEtDescendants(groupes, selection);
    return lignes.filter((l) => l.groupeId !== null && ids.has(l.groupeId));
  }, [lignes, groupes, selection]);

  function basculer(id: string) {
    setOuverts((prev) => {
      const suivant = new Set(prev);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  }

  return (
    <div className="flex gap-3">
      {groupes.length > 0 && (
        <nav aria-label="Groupes du bordereau" className="w-56 shrink-0 overflow-auto rounded-md border p-1">
          <button
            type="button"
            className={cn('w-full rounded-sm px-1 py-0.5 text-left text-body hover:bg-muted', selection === null && 'bg-muted font-semibold')}
            onClick={() => setSelection(null)}
          >
            Tous
          </button>
          <ul>
            {(enfants.get(null) ?? []).map((g) => (
              <NoeudGroupe key={g.id} groupe={g} enfants={enfants} ouverts={ouverts} selection={selection} niveau={0} onBasculer={basculer} onChoisir={setSelection} />
            ))}
          </ul>
        </nav>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <DataGrid rows={lignesVisibles} colonnes={COLONNES_BORDEREAU_LIGNES} cleOrdre={cleOrdre} bandeauRegroupement={false} />
        <p className="text-right text-body text-muted-foreground">
          Total HT <b className="text-foreground">{formatCurrency(totaux.totalHT)}</b> · TVA <b className="text-foreground">{formatCurrency(totaux.totalTVA)}</b> · TTC{' '}
          <b className="text-foreground">{formatCurrency(totaux.totalTTC)}</b>
        </p>
      </div>
    </div>
  );
}
