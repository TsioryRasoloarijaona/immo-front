import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toApiDateTime } from '../../lib/format';
import { choixDe, libelleChoix, type ColonneOnglet, type Valeur } from '../../lib/ongletsTranche';
import type { BlocCommissionDto } from '../../types';

/**
 * Saisie d'un nombre ; `pourcent` : saisi en %, transmis en fraction ; `entier` : tronqué (int32 sur le fil).
 * Non contrôlé pour garder « 12, » en cours de frappe.
 */
function SaisieNombre({ libelle, pourcent, entier = false, valeur, onChange }: Readonly<{
  libelle: string;
  pourcent: boolean;
  entier?: boolean;
  valeur: Valeur;
  onChange: (v: number | null) => void;
}>) {
  const facteur = pourcent ? 100 : 1;
  const initiale = typeof valeur === 'number' ? String(Math.round(valeur * facteur * 1e4) / 1e4) : '';
  const lire = (texte: string) => (entier ? Math.trunc(Number(texte)) : Number(texte) / facteur);
  return (
    <Input type="number" inputMode={entier ? 'numeric' : 'decimal'} step={entier ? 1 : 'any'} aria-label={libelle}
      defaultValue={initiale} className="h-7 w-28" onChange={(e) => onChange(e.target.value === '' ? null : lire(e.target.value))} />
  );
}

/** Bloc de commission : la case « en % » bascule entre le montant fixe et le pourcentage du prix de vente TTC. */
function SaisieBloc({ libelle, bloc, onChange }: Readonly<{
  libelle: string;
  bloc: BlocCommissionDto;
  onChange: (b: BlocCommissionDto) => void;
}>) {
  const enPourcent = bloc.baseSurMontant === false;
  return (
    <div className="flex items-center gap-1.5">
      <SaisieNombre key={String(enPourcent)} libelle={`${libelle} (${enPourcent ? '%' : 'montant'})`} pourcent={enPourcent}
        valeur={enPourcent ? bloc.pourcentage : bloc.montant}
        onChange={(n) => onChange(enPourcent ? { ...bloc, pourcentage: n } : { ...bloc, montant: n })} />
      <label className="flex items-center gap-1 whitespace-nowrap text-micro text-muted-foreground">
        <input type="checkbox" checked={enPourcent} onChange={(e) => onChange({ ...bloc, baseSurMontant: !e.target.checked })} />
        en % du TTC
      </label>
    </div>
  );
}

/** Cellule en saisie d'une grille d'onglet de tranche. */
export default function SaisieOnglet<L>({ colonne, ligne, onChange }: Readonly<{
  colonne: ColonneOnglet<L>;
  ligne: L;
  onChange: (v: Valeur) => void;
}>) {
  const valeur = ligne[colonne.nom] as Valeur;
  const texte = typeof valeur === 'string' ? valeur : '';
  switch (colonne.type) {
    case 'case':
      return <input type="checkbox" aria-label={colonne.libelle} checked={!!valeur} onChange={(e) => onChange(e.target.checked)} />;
    case 'date':
      return (
        <Input type="date" aria-label={colonne.libelle} value={texte.slice(0, 10)} className="h-7 w-36"
          onChange={(e) => onChange(toApiDateTime(e.target.value) ?? null)} />
      );
    case 'texte':
      return <Input aria-label={colonne.libelle} value={texte} className="h-7 min-w-40" onChange={(e) => onChange(e.target.value)} />;
    case 'bloc':
      return <SaisieBloc libelle={colonne.libelle} bloc={typeof valeur === 'object' && valeur ? valeur : {}} onChange={onChange} />;
    case 'choix': {
      const items: { label: string; value: string | null }[] = choixDe(colonne, ligne).map((c) => ({ label: libelleChoix(c), value: c.id }));
      if (colonne.facultatif) items.unshift({ label: '—', value: null });
      return (
        <Select items={items} value={texte || null} onValueChange={(v) => onChange(v)}>
          <SelectTrigger aria-label={colonne.libelle} className="h-7 min-w-48"><SelectValue placeholder="Choisir…" /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((i) => <SelectItem key={i.value ?? ''} value={i.value}>{i.label}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }
    default:
      return <SaisieNombre libelle={colonne.libelle} pourcent={colonne.type === 'pourcent'} entier={colonne.type === 'entier'}
        valeur={valeur} onChange={onChange} />;
  }
}
