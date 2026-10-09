import { AlertTriangle, Check } from 'lucide-react';
import Modal from '../../../components/Modal';
import { Badge, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { formatCurrency, formatDate } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { lireDossierBeneficiaire } from '../../../lib/virements';
import { cn } from '../../../lib/utils';
import { pluriel } from './donnees';

interface EtatDossier {
  nb_ordres: number;
  nb_incomplets: number;
  dossier_complet: boolean;
}

function classeEtat(d: EtatDossier): string {
  if (d.nb_ordres === 0) return 'bg-muted text-muted-foreground';
  return d.dossier_complet ? 'bg-(--success-bg) text-(--success)' : 'bg-(--amber-bg) text-(--amber)';
}

function messageEtat(d: EtatDossier): string {
  if (d.nb_ordres === 0) return 'Aucun ordre de virement pour ce bénéficiaire.';
  if (d.dossier_complet) {
    const pieces = d.nb_ordres > 1 ? `les ${d.nb_ordres} ordres ont toutes leurs pièces` : "l'ordre a toutes ses pièces";
    return `Dossier complet — ${pieces}.`;
  }
  const plusieurs = d.nb_incomplets > 1;
  return `${d.nb_incomplets} ${plusieurs ? 'ordres' : 'ordre'} sur ${d.nb_ordres} ${plusieurs ? 'sont incomplets' : 'est incomplet'}.`;
}

/** Ouvrir un ordre ferme cette fenêtre : c'est la page qui enchaîne sur sa fiche. */
export default function DossierBeneficiaireDialog({
  beneficiaire,
  onClose,
  onOuvrirOrdre,
}: Readonly<{
  beneficiaire: { id: number; nom: string };
  onClose: () => void;
  onOuvrirOrdre: (ordreId: number) => void;
}>) {
  const { data: d, error } = useApi(() => lireDossierBeneficiaire(beneficiaire.id), [beneficiaire.id]);

  return (
    <Modal title={`Dossier — ${beneficiaire.nom}`} onClose={onClose} width={760}>
      {!d && (error ? <ErrorState message={error} /> : <LoadingState />)}
      {d && (
        <div className="flex flex-col gap-3">
          <p className="-mt-2 text-body text-muted-foreground">
            {pluriel(d.nb_ordres, 'ordre')} · {formatCurrency(d.total_montant)} virés au total
            {d.par_societe.length > 1 && ` · ${d.par_societe.length} sociétés émettrices`}
          </p>

          <div
            className={cn(
              'flex items-start gap-2 rounded-lg px-3 py-2 text-body',
              classeEtat(d),
            )}
          >
            {d.nb_ordres > 0 && (d.dossier_complet ? <Check className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />)}
            <span>{messageEtat(d)}</span>
          </div>

          {d.par_societe.length > 1 && (
            <table className="w-full text-body">
              <thead className="text-micro text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-1 text-left font-medium">Société</th>
                  <th className="py-1 text-right font-medium">Ordres</th>
                  <th className="py-1 text-right font-medium">Total versé</th>
                </tr>
              </thead>
              <tbody>
                {d.par_societe.map((s) => (
                  <tr key={s.societe_nom} className="border-b border-border/60">
                    <td className="py-1">{s.societe_nom}</td>
                    <td className="py-1 text-right tabular-nums">{s.nb_ordres}</td>
                    <td className="py-1 text-right tabular-nums">{formatCurrency(s.total_montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {d.ordres.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-body">
                <thead className="bg-muted/50 text-micro text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">N°</th>
                    <th className="px-2 py-1 text-left font-medium">Date</th>
                    <th className="px-2 py-1 text-left font-medium">Société</th>
                    <th className="px-2 py-1 text-right font-medium">Montant</th>
                    <th className="px-2 py-1 text-left font-medium">Manque</th>
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {d.ordres.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="px-2 py-1 font-mono font-medium text-foreground">{o.numero}</td>
                      <td className="px-2 py-1">{formatDate(o.date_virement)}</td>
                      <td className="px-2 py-1">
                        {o.societe_nom ?? '—'}
                        {o.type_virement === 'salaire' && (
                          <Badge tone="info" className="ml-1">
                            Salaire
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right tabular-nums">{formatCurrency(o.montant)}</td>
                      <td className="px-2 py-1">
                        {o.dossier_complet ? (
                          <Badge tone="success">Complet</Badge>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {o.manquants.map((m) => (
                              <Badge key={m} tone="amber">
                                {m}
                              </Badge>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <Button type="button" variant="outline" size="xs" onClick={() => onOuvrirOrdre(o.id)}>
                          Ouvrir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </DialogFooter>
    </Modal>
  );
}
