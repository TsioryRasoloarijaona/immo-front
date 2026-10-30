import { memo, useCallback, useMemo, useState } from 'react';
import { CheckCheck, ChevronDown, ChevronRight, Eye, Square } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { basculerNoeud, indicesVisibles, lectureSeule, structurerArbre, toutCocher, type StructureArbre } from '../../lib/arbreDroits';
import { pluriel } from '../../lib/format';
import { useDebouncedValue } from '../../lib/useApi';
import type { NoeudDroitDto } from '../../types/roles';

type MajCoches = (f: (c: Set<string>) => Set<string>) => void;

const LARGEUR_RETRAIT = 16;

const LigneDroit = memo(function LigneDroit({ noeud, indice, coche, ouvrable, ouvert, desactive, onBasculer, onOuvrir }: Readonly<{
  noeud: NoeudDroitDto;
  indice: number;
  coche: boolean;
  ouvrable: boolean;
  ouvert: boolean;
  desactive: boolean;
  onBasculer: (indice: number, valeur: boolean) => void;
  onOuvrir: (indice: number) => void;
}>) {
  const Chevron = ouvert ? ChevronDown : ChevronRight;
  return (
    <li className="flex items-center gap-1 py-0.5" style={{ paddingLeft: (noeud.profondeur ?? 0) * LARGEUR_RETRAIT }}>
      {ouvrable ? (
        <button type="button" className="size-4 shrink-0 text-muted-foreground" aria-expanded={ouvert}
          aria-label={`${ouvert ? 'Replier' : 'Déplier'} ${noeud.description ?? noeud.code}`} onClick={() => onOuvrir(indice)}>
          <Chevron aria-hidden className="size-4" />
        </button>
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <label className="flex min-w-0 items-center gap-2 text-body">
        <input type="checkbox" checked={coche} disabled={desactive} onChange={(e) => onBasculer(indice, e.target.checked)} />
        <span className="truncate">{noeud.description || noeud.code}</span>
        <span className="shrink-0 text-micro text-muted-foreground">{noeud.type}</span>
      </label>
    </li>
  );
});

function Arbre({ noeuds, coches, onChange, desactive }: Readonly<{
  noeuds: NoeudDroitDto[];
  coches: ReadonlySet<string>;
  onChange: MajCoches;
  desactive: boolean;
}>) {
  const structure: StructureArbre = useMemo(() => structurerArbre(noeuds), [noeuds]);
  const [ouverts, setOuverts] = useState<ReadonlySet<number>>(new Set());
  const [saisie, setSaisie] = useState('');
  const requete = useDebouncedValue(saisie);
  const visibles = useMemo(() => indicesVisibles(structure, ouverts, requete), [structure, ouverts, requete]);
  const enRecherche = requete.trim() !== '';

  const basculer = useCallback((i: number, valeur: boolean) => onChange((c) => basculerNoeud(structure, c, i, valeur)), [structure, onChange]);
  const ouvrir = useCallback((i: number) => setOuverts((o) => {
    const suivant = new Set(o);
    if (!suivant.delete(i)) suivant.add(i);
    return suivant;
  }), []);

  return (
    <section className="col-span-full flex min-h-0 flex-col gap-2" aria-label="Droits">
      <div className="flex flex-wrap items-center gap-2">
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" disabled={desactive} onClick={() => onChange(() => toutCocher(structure))}>
            <CheckCheck data-icon="inline-start" /> Sélectionner tout
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={desactive} onClick={() => onChange(() => new Set())}>
            <Square data-icon="inline-start" /> Désélectionner tout
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={desactive} onClick={() => onChange((c) => lectureSeule(structure, c))}>
            <Eye data-icon="inline-start" /> En lecture seule
          </Button>
        </BarreIcones>
        <Input aria-label="Rechercher un droit" placeholder="Rechercher un droit…" className="w-56" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        <span className="ml-auto text-body text-muted-foreground">{pluriel(coches.size, 'droit coché', 'droits cochés')}</span>
      </div>
      <ul className="max-h-80 min-h-24 overflow-auto rounded-md border border-border p-2">
        {visibles.map((i) => (
          <LigneDroit key={structure.noeuds[i].code} noeud={structure.noeuds[i]} indice={i} coche={coches.has(structure.noeuds[i].code)}
            ouvrable={!enRecherche && structure.fins[i] > i + 1} ouvert={ouverts.has(i)} desactive={desactive} onBasculer={basculer} onOuvrir={ouvrir} />
        ))}
        {visibles.length === 0 && <li className="p-2 text-body text-muted-foreground">Aucun droit</li>}
      </ul>
    </section>
  );
}

/** Arbre des droits : replié par défaut, seuls les enfants des nœuds ouverts sont montés ; lignes mémoïsées. */
export default memo(Arbre);
