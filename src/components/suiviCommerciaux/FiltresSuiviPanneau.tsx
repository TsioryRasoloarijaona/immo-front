import { RotateCcw, Search } from 'lucide-react';
import ChoixUnique from '../ChoixUnique';
import { Button } from '../ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { JOINT_ITEMS, TYPE_ITEMS, type FiltresListeSuivi } from '../../lib/suiviCommerciaux';

type Item = { label: string; value: string };

/** Filtres serveur de la liste des interactions ; `commerciaux` vide (commercial seul) masque le choix. */
export default function FiltresSuiviPanneau({
  filtres,
  changer,
  reinitialiser,
  commerciaux,
}: Readonly<{
  filtres: FiltresListeSuivi;
  changer: <K extends keyof FiltresListeSuivi>(cle: K, valeur: FiltresListeSuivi[K]) => void;
  reinitialiser: () => void;
  commerciaux: Item[];
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="min-w-55 flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Recherche — personne, résultat, code de prospection…"
          value={filtres.search}
          onChange={(e) => changer('search', e.target.value)}
        />
      </InputGroup>
      {commerciaux.length > 0 && (
        <ChoixUnique
          items={commerciaux}
          tous="Tous les commerciaux"
          value={filtres.commercialCle}
          placeholder="Commercial…"
          largeur="w-48"
          onChange={(v) => changer('commercialCle', v)}
        />
      )}
      <ChoixUnique items={TYPE_ITEMS} tous="Tous les types" value={filtres.type} placeholder="Type…" largeur="w-40" onChange={(v) => changer('type', v)} />
      <ChoixUnique items={JOINT_ITEMS} tous="Joints ou non" value={filtres.joint} placeholder="Joint…" largeur="w-44" onChange={(v) => changer('joint', v)} />
      <InputGroup className="w-32.5">
        <InputGroupInput type="date" aria-label="Du" value={filtres.du} onChange={(e) => changer('du', e.target.value)} />
      </InputGroup>
      <InputGroup className="w-32.5">
        <InputGroupInput type="date" aria-label="Au" value={filtres.au} onChange={(e) => changer('au', e.target.value)} />
      </InputGroup>
      <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
        <RotateCcw data-icon="inline-start" /> Réinitialiser
      </Button>
    </div>
  );
}
