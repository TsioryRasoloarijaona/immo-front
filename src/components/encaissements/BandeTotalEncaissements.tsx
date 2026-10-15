import { getTotauxEncaissements, type listEncaissements } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, pluriel } from '../../lib/format';

type Filtres = Parameters<typeof listEncaissements>[0];

/** Bande « Total : » d'OMRAN, sur tout le filtre et non la page : `cle` exclut donc la page. Les annulés comptent
 * dans le nombre mais pas dans les sommes (même calcul que les totaux des groupes). */
export default function BandeTotalEncaissements({ filtres, cle }: Readonly<{ filtres: Filtres; cle: string }>) {
  const { data, error } = useApi(() => getTotauxEncaissements(filtres), [cle], 'encaissements-totaux');

  if (error) return <p className="shrink-0 text-micro text-destructive">Totaux indisponibles : {error}</p>;
  if (!data) return null;

  return (
    <div
      className="flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-body"
      aria-label="Totaux sur tout le filtre"
    >
      <span className="font-semibold text-foreground">Total :</span>
      <span className="text-muted-foreground">sur {pluriel(data.nombre, 'règlement')}</span>
      <Montant libelle="Montant brut" valeur={data.montantBrut} fort />
      <Montant libelle="Reste à affecter" valeur={data.montantBrutRestant} alerte />
      <Montant libelle="Montant net" valeur={data.montantNet} />
      <Montant libelle="Base" valeur={data.montantBase} />
    </div>
  );
}

function Montant({
  libelle,
  valeur,
  fort,
  alerte,
}: Readonly<{ libelle: string; valeur: number | undefined; fort?: boolean; alerte?: boolean }>) {
  const reste = alerte && Math.abs(valeur ?? 0) > 0.005;
  let classe = 'text-foreground';
  if (reste) classe = 'font-semibold text-(--warning)';
  else if (fort) classe = 'font-semibold text-foreground';
  return (
    <span className="text-muted-foreground">
      {libelle} <span className={`tabular-nums ${classe}`}>{formatCurrency(valeur ?? 0)}</span>
    </span>
  );
}
