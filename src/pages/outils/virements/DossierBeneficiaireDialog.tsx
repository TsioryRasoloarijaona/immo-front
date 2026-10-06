import { useState } from 'react';
import { AlertTriangle, Check, ChevronRight } from 'lucide-react';
import Modal from '../../../components/Modal';
import { Badge } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { formatCurrency, formatDate } from '../../../lib/format';
import { cn } from '../../../lib/utils';
import OrdreDetailDialog from './OrdreDetailDialog';
import { STATUT_ORDRE, etatDossier, useVirements, type Beneficiaire } from './donnees';

/** Dossier d'un bénéficiaire : ce qui manque, ordre par ordre. Un ordre
 * s'ouvre par-dessus, comme depuis l'historique. */
export default function DossierBeneficiaireDialog({
  beneficiaire,
  onClose,
  notifier,
}: {
  beneficiaire: Beneficiaire;
  onClose: () => void;
  notifier: (msg: string) => void;
}) {
  const { ordres } = useVirements();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const siens = ordres
    .filter((o) => o.beneficiaireId === beneficiaire.id && o.statut !== 'annule')
    .sort((a, b) => b.date.localeCompare(a.date));
  const incomplets = siens.filter((o) => !etatDossier(o).complet);

  return (
    <Modal title={`Dossier — ${beneficiaire.nom}`} onClose={onClose} width={680}>
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 text-body',
            incomplets.length === 0 ? 'bg-(--success-bg) text-(--success)' : 'bg-(--amber-bg) text-(--amber)',
          )}
        >
          {incomplets.length === 0 ? <Check className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
          <span>
            {siens.length === 0
              ? 'Aucun ordre émis pour ce bénéficiaire.'
              : incomplets.length === 0
                ? `Les ${siens.length} ordre${siens.length > 1 ? 's sont' : ' est'} complet${siens.length > 1 ? 's' : ''}.`
                : `${incomplets.length} ordre${incomplets.length > 1 ? 's' : ''} sur ${siens.length} à compléter.`}
          </span>
        </div>

        {siens.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {siens.map((o) => {
              const d = etatDossier(o);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setOuvert(o.id)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-body">
                        <span className="font-mono font-medium text-foreground">{o.numero}</span>
                        <span className="text-muted-foreground">{formatDate(o.date)}</span>
                        <span className="font-medium text-foreground">{formatCurrency(o.montant)}</span>
                        <Badge tone={STATUT_ORDRE[o.statut].ton}>{STATUT_ORDRE[o.statut].libelle}</Badge>
                      </div>
                      <div className="mt-0.5 text-micro text-muted-foreground">
                        {d.complet ? 'Toutes les pièces sont jointes.' : `Manque : ${d.manquantes.join(', ')}`}
                      </div>
                    </div>
                    {d.complet ? <Badge tone="success">Complet</Badge> : <Badge tone="amber">{d.fournies}/{d.requises}</Badge>}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </DialogFooter>

      {ouvert && <OrdreDetailDialog ordreId={ouvert} onClose={() => setOuvert(null)} notifier={notifier} />}
    </Modal>
  );
}
