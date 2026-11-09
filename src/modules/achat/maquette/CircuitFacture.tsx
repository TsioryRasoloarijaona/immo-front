import { useState } from 'react';
import { Send } from 'lucide-react';
import { Badge, Field, FieldGrid } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { LIGNES_FOURNISSEURS, SOCIETE } from '../../../components/maquette/communes';
import { useActionMaquette } from '../../../components/maquette/useActionMaquette';
import type { Ligne } from '../../../components/maquette/types';
import { formatCurrency } from '../../../lib/format';
import { useToast } from '../../../lib/toastContext';
import { TRANSITIONS } from './donnees';

const ETAPES = ['EN COURS', 'VALIDÉ DG', 'VALIDE POUR PAIEMENT', 'CLOTURÉ'];
const COMPTE_PAYEUR = 'Banque Atlantique du Maroc — 011 780 0009988776655443 21';

function DialogueVirement({ facture, ouvert, onChange }: Readonly<{ facture: Ligne; ouvert: boolean; onChange: (o: boolean) => void }>) {
  const afficher = useToast();
  const rib = LIGNES_FOURNISSEURS.find((f) => f.raison === facture.fournisseur)?.rib;
  return (
    <Dialog open={ouvert} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer en virement</DialogTitle>
          <DialogDescription>Récapitulatif de l’ordre de virement pour la facture {facture.numero}.</DialogDescription>
        </DialogHeader>
        <FieldGrid>
          <Field label="Bénéficiaire" value={facture.fournisseur} />
          <Field label="RIB du fournisseur" value={rib} />
          <Field label="Société payeuse" value={SOCIETE} />
          <Field label="Compte payeur" value={COMPTE_PAYEUR} />
          <Field label="Montant (reste à payer)" value={formatCurrency(Number(facture.reste))} />
        </FieldGrid>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button
            onClick={() => {
              onChange(false);
              afficher('Maquette : action non branchée');
            }}
          >
            Confirmer l’envoi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Circuit de paiement d'une facture : statut courant, transitions permises, bouton d'envoi en virement. */
export default function CircuitFacture({ facture }: Readonly<{ facture: Ligne }>) {
  const agir = useActionMaquette();
  const [ouvert, setOuvert] = useState(false);
  const statut = String(facture.statut);
  const rang = ETAPES.indexOf(statut);
  const suivantes = TRANSITIONS.filter((t) => t.origine === statut);
  const toneEtape = (i: number) => (i < rang ? 'success' : 'neutral');
  return (
    <section className="mt-3 rounded-xl border border-border bg-card p-3">
      <h3 className="mb-2 text-body font-medium">Circuit de paiement</h3>
      <div className="flex flex-wrap items-center gap-1.5">
        {rang < 0 && <Badge tone="amber">{statut}</Badge>}
        {ETAPES.map((e, i) => (
          <Badge key={e} tone={i === rang ? 'progress' : toneEtape(i)}>{e}</Badge>
        ))}
      </div>
      {suivantes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suivantes.map((t) => (
            <Button key={`${t.cible}-${t.role}`} variant="outline" size="sm" onClick={() => agir()}>
              Passer à « {t.cible} » ({t.role})
            </Button>
          ))}
        </div>
      )}
      {statut === 'VALIDE POUR PAIEMENT' && Number(facture.reste) > 0 && (
        <Button size="sm" className="mt-3" onClick={() => setOuvert(true)}>
          <Send aria-hidden /> Envoyer en virement
        </Button>
      )}
      <DialogueVirement facture={facture} ouvert={ouvert} onChange={setOuvert} />
    </section>
  );
}
