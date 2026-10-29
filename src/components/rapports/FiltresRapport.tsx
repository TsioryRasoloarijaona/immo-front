import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import SelectFiltre from '../SelectFiltre';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InputGroup, InputGroupInput } from '../ui/input-group';
import ChampTranchesCascade from './ChampTranchesCascade';
import { plagePeriode, raccourciCourant, RACCOURCIS_PERIODE, type RaccourciPeriode } from '../../lib/periodes';
import type { ValeursRapport } from '../../lib/apiRapports';
import { valeursDe } from '../../lib/rapports';
import type { ParametreRapportDto } from '../../types/rapports';

type ChoixRaccourci = RaccourciPeriode | 'perso';

const RACCOURCIS: { label: string; value: ChoixRaccourci }[] = [
  ...RACCOURCIS_PERIODE,
  { label: 'Période personnalisée', value: 'perso' },
];

const TYPES_A_OPTIONS = new Set(['TRANCHES', 'COMMERCIAUX', 'CHOIX']);

type Changer = (nom: string, valeurs: string[]) => void;

function Champ({ libelle, obligatoire, children }: Readonly<{ libelle: string; obligatoire: boolean; children: ReactNode }>) {
  return (
    <div role="group" aria-label={libelle} className="flex flex-col gap-1">
      <span className="text-micro text-muted-foreground">
        {libelle}
        {obligatoire && <span aria-hidden> *</span>}
      </span>
      {children}
    </div>
  );
}

function ChampDate({ parametre, valeurs, changer }: Readonly<{ parametre: ParametreRapportDto; valeurs: ValeursRapport; changer: Changer }>) {
  return (
    <InputGroup className="w-32.5">
      <InputGroupInput
        type="date"
        aria-label={parametre.libelle}
        value={valeursDe(valeurs, parametre.nom).at(0) ?? ''}
        onChange={(e) => changer(parametre.nom, e.target.value ? [e.target.value] : [])}
      />
    </InputGroup>
  );
}

/** `du` + `au` : raccourcis de période d'OMRAN et deux dates. */
function ChampPeriode({ du, au, valeurs, changer }: Readonly<{ du: ParametreRapportDto; au: ParametreRapportDto; valeurs: ValeursRapport; changer: Changer }>) {
  const debut = valeursDe(valeurs, du.nom).at(0) ?? '';
  const fin = valeursDe(valeurs, au.nom).at(0) ?? '';
  function appliquer(choix: ChoixRaccourci) {
    if (choix === 'perso') return;
    const plage = plagePeriode(choix);
    changer(du.nom, plage.debut ? [plage.debut] : []);
    changer(au.nom, plage.fin ? [plage.fin] : []);
  }
  return (
    <Champ libelle="Période" obligatoire={du.obligatoire || au.obligatoire}>
      <div className="flex flex-wrap items-center gap-1.5">
        <SelectFiltre ariaLabel="Raccourci de période" items={RACCOURCIS} value={raccourciCourant(debut, fin) ?? 'perso'} onChange={appliquer} />
        <ChampDate parametre={du} valeurs={valeurs} changer={changer} />
        <ChampDate parametre={au} valeurs={valeurs} changer={changer} />
      </div>
    </Champ>
  );
}

function ChampListe({ parametre: p, valeurs, changer }: Readonly<{ parametre: ParametreRapportDto; valeurs: ValeursRapport; changer: Changer }>) {
  const items = p.options.map((o) => ({ label: o.libelle, value: o.valeur }));
  const choisies = valeursDe(valeurs, p.nom);
  if (p.multiple) {
    return <MultiSelectDropdown ariaLabel={p.libelle} placeholder="Tous" value={choisies} onChange={(v) => changer(p.nom, v)} items={items} />;
  }
  return (
    <ChoixUnique
      items={items}
      value={choisies[0] ?? null}
      placeholder="Choisir"
      largeur="w-48"
      tous={p.obligatoire ? undefined : 'Tous'}
      onChange={(v) => changer(p.nom, v ? [v] : [])}
    />
  );
}

function ChampSaisie({ parametre: p, valeurs, changer }: Readonly<{ parametre: ParametreRapportDto; valeurs: ValeursRapport; changer: Changer }>) {
  const numerique = p.type === 'ANNEE' || p.type === 'ENTIER';
  let min: number | undefined;
  let max: number | undefined;
  if (p.type === 'ANNEE') {
    min = 1900;
    max = 2200;
  } else if (p.type === 'ENTIER') {
    min = p.min ?? undefined;
    max = p.max ?? undefined;
  }
  return (
    <Input
      type={numerique ? 'number' : 'text'}
      aria-label={p.libelle}
      className="w-32"
      min={min}
      max={max}
      value={valeursDe(valeurs, p.nom).at(0) ?? ''}
      onChange={(e) => changer(p.nom, e.target.value ? [e.target.value] : [])}
    />
  );
}

function ChampBooleen({ parametre: p, valeurs, changer }: Readonly<{ parametre: ParametreRapportDto; valeurs: ValeursRapport; changer: Changer }>) {
  return (
    <label className="flex h-8 items-center gap-2 text-body">
      <input
        type="checkbox"
        checked={valeursDe(valeurs, p.nom).at(0) === 'true'}
        onChange={(e) => changer(p.nom, [e.target.checked ? 'true' : 'false'])}
      />
      {p.libelle}
    </label>
  );
}

function ChampParametre(props: Readonly<{ parametre: ParametreRapportDto; valeurs: ValeursRapport; changer: Changer }>) {
  const { parametre: p } = props;
  if (p.type === 'BOOLEEN') return <ChampBooleen {...props} />;
  if (p.nom === 'trancheId') return <ChampTranchesCascade valeurs={props.valeurs} changer={props.changer} />;
  let champ: ReactNode;
  if (TYPES_A_OPTIONS.has(p.type)) champ = <ChampListe {...props} />;
  else if (p.type === 'DATE') champ = <ChampDate {...props} />;
  else champ = <ChampSaisie {...props} />;
  return (
    <Champ libelle={p.libelle} obligatoire={p.obligatoire}>
      {champ}
    </Champ>
  );
}

/** Formulaire déduit des `parametres` du descripteur : aucune connaissance d'un rapport particulier. */
export default function FiltresRapport({
  parametres,
  valeurs,
  onChange,
  onActualiser,
  enCours,
  erreur,
}: Readonly<{
  parametres: ParametreRapportDto[];
  valeurs: ValeursRapport;
  onChange: Changer;
  onActualiser: () => void;
  enCours: boolean;
  erreur: string | null;
}>) {
  const du = parametres.find((p) => p.nom === 'du' && p.type === 'DATE');
  const au = parametres.find((p) => p.nom === 'au' && p.type === 'DATE');
  const autres = parametres.filter((p) => p !== du && p !== au);
  return (
    <form
      className="flex flex-wrap items-end gap-x-4 gap-y-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        onActualiser();
      }}
    >
      {du && au && <ChampPeriode du={du} au={au} valeurs={valeurs} changer={onChange} />}
      {(du && au ? autres : parametres).map((p) => (
        <ChampParametre key={p.nom} parametre={p} valeurs={valeurs} changer={onChange} />
      ))}
      <Button type="submit" size="sm" disabled={enCours}>
        <RefreshCw data-icon="inline-start" className={enCours ? 'animate-spin' : undefined} /> Actualiser
      </Button>
      {erreur && (
        <p role="alert" className="basis-full text-body text-destructive">
          {erreur}
        </p>
      )}
    </form>
  );
}
