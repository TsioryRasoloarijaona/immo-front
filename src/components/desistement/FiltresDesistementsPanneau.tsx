import { RotateCcw, Search } from 'lucide-react';
import ChoixUnique from '../ChoixUnique';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { PLAGES_DESISTEMENTS, type FiltresDesistements } from '../../lib/desistements';

/** Filtres serveur de « Désistements » ; `changer` remet la pagination à zéro côté page. */
export default function FiltresDesistementsPanneau({
  filtres,
  changer,
  reinitialiser,
  tranches,
}: Readonly<{
  filtres: FiltresDesistements;
  changer: <K extends keyof FiltresDesistements>(cle: K, valeur: FiltresDesistements[K]) => void;
  reinitialiser: () => void;
  tranches: { label: string; value: string }[];
}>) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-55 flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Recherche — n° de demande, dossier, client…"
            value={filtres.q}
            onChange={(e) => changer('q', e.target.value)}
          />
        </InputGroup>
        <ChoixUnique
          items={tranches}
          tous="Toutes les tranches"
          value={filtres.trancheId}
          placeholder="Tranche…"
          largeur="w-52"
          onChange={(v) => changer('trancheId', v)}
        />
        <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {PLAGES_DESISTEMENTS.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span className="text-micro font-medium text-muted-foreground">{p.label}</span>
            <InputGroup className="w-32.5">
              <InputGroupInput type="date" aria-label={`${p.label} du`} value={filtres[p.du]} onChange={(e) => changer(p.du, e.target.value)} />
            </InputGroup>
            <InputGroup className="w-32.5">
              <InputGroupInput type="date" aria-label={`${p.label} au`} value={filtres[p.au]} onChange={(e) => changer(p.au, e.target.value)} />
            </InputGroup>
          </div>
        ))}
      </div>
    </div>
  );
}
