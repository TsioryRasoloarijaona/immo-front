import { formatCurrency } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import { sommesAffichees, type TonSomme } from '../../../lib/dossierListe';
import type { ColonneDto, PageGroupesDto, ValeurAgregat } from '../../../types';
import type { TotauxDossiersDto } from '../../../types/dossierListe';

const LIBELLES: { cle: string; libelle: string }[] = [
  { cle: 'prixHt', libelle: 'Σ Prix HT' },
  { cle: 'prix', libelle: 'Σ Prix TTC' },
  { cle: 'totalAPayer', libelle: 'Σ Total à payer' },
];

const CLASSE_TON: Record<TonSomme, string> = {
  regle: 'text-(--success)',
  reste: 'text-destructive',
  neutre: 'text-foreground',
};

function nombre(valeur: ValeurAgregat | undefined): number | null {
  if (typeof valeur === 'number') return valeur;
  if (typeof valeur === 'string' && valeur.trim() !== '') return Number(valeur);
  return null;
}

function Somme({ libelle, valeur, classe }: Readonly<{ libelle: string; valeur: number | null; classe?: string }>) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{libelle}</dt>
      <dd className={cn('font-semibold tabular-nums', classe)}>{formatCurrency(valeur)}</dd>
    </div>
  );
}

/**
 * Totaux Σ en tête de la liste, calculés par le serveur sur tout le résultat filtré (hors lots libres) :
 * prix et total à payer (`/groupes`), puis les montants par nature des colonnes affichées (`/totaux`).
 */
export default function TotauxDossiers({
  totaux,
  montants,
  colonnes,
}: Readonly<{
  totaux: PageGroupesDto | null | undefined;
  montants: TotauxDossiersDto | null | undefined;
  colonnes: readonly ColonneDto[];
}>) {
  if (!totaux) return null;
  return (
    <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-body" aria-label="Totaux de la liste">
      {LIBELLES.map(({ cle, libelle }) => (
        <Somme key={cle} libelle={libelle} valeur={nombre(totaux.totaux[cle])} />
      ))}
      {sommesAffichees(colonnes, montants).map((s) => (
        <Somme key={s.nom} libelle={`Σ ${s.libelle}`} valeur={s.valeur} classe={CLASSE_TON[s.ton]} />
      ))}
    </dl>
  );
}
