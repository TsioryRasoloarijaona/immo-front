import type { TotauxDocumentsAchatDto } from '../../types/achat';
import { formatCurrency, pluriel } from '../../lib/format';

function Chiffre({ libelle, valeur, alerte }: Readonly<{ libelle: string; valeur: string; alerte?: boolean }>) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-micro font-semibold tracking-wide text-muted-foreground uppercase">{libelle}</span>
      <span className={alerte ? 'text-label font-semibold text-destructive tabular-nums' : 'text-label font-semibold text-foreground tabular-nums'}>{valeur}</span>
    </span>
  );
}

export type ModeTotauxAchat = 'devis' | 'depenses' | 'simple' | 'commande';

/** Totaux serveur de tout le filtre (toutes pages) ; le reste dû ne compte que les restes positifs. */
export default function BandeTotauxAchat({ totaux, mode }: Readonly<{ totaux: TotauxDocumentsAchatDto; mode: ModeTotauxAchat }>) {
  const devis = mode === 'devis';
  const depenses = mode === 'depenses';
  const agregats = mode === 'commande' ? totaux.agregats : null;
  return (
    <div role="status" className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-border bg-card px-3 py-1.5">
      {devis && <Chiffre libelle="HT" valeur={formatCurrency(totaux.montantHT)} />}
      {devis && <Chiffre libelle="TVA" valeur={formatCurrency(totaux.montantTVA)} />}
      {devis && <Chiffre libelle="TTC" valeur={formatCurrency(totaux.montantTTC)} />}
      {!devis && <Chiffre libelle="Pièces" valeur={pluriel(totaux.nombre, 'pièce')} />}
      <Chiffre libelle="Net à payer" valeur={formatCurrency(totaux.montantAPayer)} />
      {depenses && <Chiffre libelle="Réglé" valeur={formatCurrency(totaux.montantRegle)} />}
      {depenses && <Chiffre libelle="Reste dû" valeur={formatCurrency(totaux.resteDu)} alerte />}
      {agregats && <Chiffre libelle="Facturé TTC" valeur={formatCurrency(agregats.factureTTC)} />}
      {agregats && <Chiffre libelle="Livré TTC" valeur={formatCurrency(agregats.livreTTC)} />}
      {agregats && <Chiffre libelle="Reste à livrer TTC" valeur={formatCurrency(agregats.resteALivrerTTC)} />}
      {agregats && <Chiffre libelle="Réglé" valeur={formatCurrency(agregats.regle)} />}
      {agregats && <Chiffre libelle="Reste à payer total" valeur={formatCurrency(agregats.resteAPayerTotal)} alerte />}
    </div>
  );
}
