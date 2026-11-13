import { useMemo, useState, type DragEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import DataGrid from '../../DataGrid';
import { formatCurrency } from '../../../lib/format';
import type { Depot, Glisse } from '../../../lib/saisieBordereau';
import { COLONNES_BORDEREAU_LIGNES, idsGroupeEtDescendants } from '../../../lib/sousFenetresLot';
import { cn } from '../../../lib/utils';
import type { GroupeBordereauDto, LigneBordereauDto, TotauxBordereauDto } from '../../../types/projet';

export const TYPE_GLISSE = 'application/x-bordereau';

type GroupeNoeud = Pick<GroupeBordereauDto, 'id' | 'parentId' | 'code' | 'description'>;

/** Mode édition : sélection pilotée de l'extérieur, glisser-déposer, grille de lignes fournie par l'appelant. */
export interface EditionArbre {
  selection: string | null;
  onSelection: (id: string | null) => void;
  onDeposer: (source: Glisse, depot: Depot) => void;
  grille: (groupeIds: Set<string> | null) => ReactNode;
}

function lireGlisse(e: DragEvent): Glisse | null {
  const brut = e.dataTransfer.getData(TYPE_GLISSE);
  return brut ? (JSON.parse(brut) as Glisse) : null;
}

function NoeudGroupe({
  groupe,
  enfants,
  ouverts,
  selection,
  niveau,
  edition,
  onBasculer,
  onChoisir,
}: Readonly<{
  groupe: GroupeNoeud;
  enfants: Map<string | null, GroupeNoeud[]>;
  ouverts: Set<string>;
  selection: string | null;
  niveau: number;
  edition?: EditionArbre;
  onBasculer: (id: string) => void;
  onChoisir: (id: string) => void;
}>) {
  const fils = enfants.get(groupe.id) ?? [];
  const ouvert = edition !== undefined || ouverts.has(groupe.id);

  function deposer(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    const source = lireGlisse(e);
    if (!source || !edition) return;
    const { top, height } = e.currentTarget.getBoundingClientRect();
    edition.onDeposer(source, { type: 'groupe', id: groupe.id, position: e.clientY - top < height / 4 ? 'avant' : 'dans' });
  }

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
          draggable={edition !== undefined}
          onDragStart={(e) => e.dataTransfer.setData(TYPE_GLISSE, JSON.stringify({ type: 'groupe', id: groupe.id } satisfies Glisse))}
          onDragOver={(e) => edition && e.preventDefault()}
          onDrop={deposer}
          className={cn('truncate rounded-sm px-1 py-0.5 text-left text-body hover:bg-muted', selection === groupe.id && 'bg-muted font-semibold')}
          onClick={() => onChoisir(groupe.id)}
        >
          {[groupe.code, groupe.description].filter(Boolean).join(' · ') || '—'}
        </button>
      </div>
      {ouvert && fils.length > 0 && (
        <ul>
          {fils.map((f) => (
            <NoeudGroupe key={f.id} groupe={f} enfants={enfants} ouverts={ouverts} selection={selection} niveau={niveau + 1} edition={edition} onBasculer={onBasculer} onChoisir={onChoisir} />
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
  edition,
}: Readonly<{ groupes: GroupeNoeud[]; lignes: LigneBordereauDto[]; totaux: TotauxBordereauDto; cleOrdre: string; edition?: EditionArbre }>) {
  const [selectionLocale, setSelectionLocale] = useState<string | null>(null);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const selection = edition ? edition.selection : selectionLocale;
  const choisir = edition ? edition.onSelection : setSelectionLocale;
  const enfants = useMemo(() => {
    const m = new Map<string | null, GroupeNoeud[]>();
    for (const g of groupes) m.set(g.parentId, [...(m.get(g.parentId) ?? []), g]);
    return m;
  }, [groupes]);
  const idsSelection = useMemo(() => (selection ? idsGroupeEtDescendants(groupes, selection) : null), [groupes, selection]);
  const lignesVisibles = useMemo(
    () => (idsSelection ? lignes.filter((l) => l.groupeId !== null && idsSelection.has(l.groupeId)) : lignes),
    [lignes, idsSelection],
  );

  function basculer(id: string) {
    setOuverts((prev) => {
      const suivant = new Set(prev);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  }

  function deposerRacine(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    const source = lireGlisse(e);
    if (source) edition?.onDeposer(source, { type: 'racine' });
  }

  return (
    <div className="flex gap-3">
      {(groupes.length > 0 || edition) && (
        <nav aria-label="Groupes du bordereau" className="w-56 shrink-0 overflow-auto rounded-md border p-1">
          <button
            type="button"
            onDragOver={(e) => edition && e.preventDefault()}
            onDrop={deposerRacine}
            className={cn('w-full rounded-sm px-1 py-0.5 text-left text-body hover:bg-muted', selection === null && 'bg-muted font-semibold')}
            onClick={() => choisir(null)}
          >
            Tous
          </button>
          <ul>
            {(enfants.get(null) ?? []).map((g) => (
              <NoeudGroupe key={g.id} groupe={g} enfants={enfants} ouverts={ouverts} selection={selection} niveau={0} edition={edition} onBasculer={basculer} onChoisir={choisir} />
            ))}
          </ul>
        </nav>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {edition ? edition.grille(idsSelection) : <DataGrid rows={lignesVisibles} colonnes={COLONNES_BORDEREAU_LIGNES} cleOrdre={cleOrdre} bandeauRegroupement={false} />}
        <p className="text-right text-body text-muted-foreground">
          Total HT <b className="text-foreground">{formatCurrency(totaux.totalHT)}</b> · TVA <b className="text-foreground">{formatCurrency(totaux.totalTVA)}</b> · TTC{' '}
          <b className="text-foreground">{formatCurrency(totaux.totalTTC)}</b>
        </p>
      </div>
    </div>
  );
}
