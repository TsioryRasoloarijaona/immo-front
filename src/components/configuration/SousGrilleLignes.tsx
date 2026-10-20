import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import ChampReferentiel from './ChampReferentiel';
import { brouillonDepuis, type Choix } from '../../lib/saisiePatrimoine';
import { defDe, itemsDe, type LigneBrouillon } from '../../lib/referentielsAdmin';
import type { ChampReferentielDto } from '../../types/referentielsAdmin';

/** Lignes enfants éditables d'un référentiel (ex. contenances d'un type de présentation). */
export default function SousGrilleLignes({ champ, lignes, onChange, choix, desactive }: Readonly<{
  champ: ChampReferentielDto;
  lignes: LigneBrouillon[];
  onChange: (lignes: LigneBrouillon[]) => void;
  choix: Record<string, Choix>;
  desactive: boolean;
}>) {
  const sousChamps = champ.champs ?? [];
  const modifier = (cle: string, nom: string, valeur: string | boolean) =>
    onChange(lignes.map((l) => (l._cle === cle ? { ...l, [nom]: valeur } : l)));
  return (
    <fieldset className="flex flex-col gap-2 sm:col-span-2">
      <legend className="mb-1 text-label font-medium text-foreground">{champ.libelle}</legend>
      {lignes.length === 0 && <p className="text-micro text-muted-foreground">Aucune ligne.</p>}
      {lignes.map((l) => (
        <div key={l._cle} className="flex items-end gap-2 rounded-md border border-border p-2">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            {sousChamps.map((s) => (
              <ChampReferentiel key={s.nom} champ={s} id={`${l._cle}-${s.nom}`} valeur={l[s.nom] ?? ''} items={itemsDe(s, choix)}
                desactive={desactive} onChange={(v) => modifier(l._cle, s.nom, v)} />
            ))}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" disabled={desactive} aria-label="Retirer la ligne"
            onClick={() => onChange(lignes.filter((x) => x._cle !== l._cle))}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" disabled={desactive}
        onClick={() => onChange([...lignes, { ...brouillonDepuis(sousChamps.map(defDe)), _cle: crypto.randomUUID() }])}>
        <Plus data-icon="inline-start" /> Ajouter une ligne
      </Button>
    </fieldset>
  );
}
