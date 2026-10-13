import { useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { referentielItems, useBanques, useTypesReglement } from '../../../lib/referentiels';
import { formatCurrency, toApiDateTime, todayISO } from '../../../lib/format';
import { listPayeurs } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import type { CreerReglementRequest } from '../../../types';

function placeholderPayeur(chargement: boolean, aucunPayeur: boolean): string {
  if (chargement) return 'Chargement…';
  return aucunPayeur ? 'Aucun acquéreur rattaché' : 'Acquéreur ou co-acquéreur';
}

function AideMontant({
  invalide,
  depasse,
  reste,
}: Readonly<{ invalide: boolean; depasse: boolean; reste: number | undefined }>) {
  if (invalide) return <p className="mt-1 text-micro text-destructive">Le montant doit être strictement positif.</p>;
  if (depasse) {
    return (
      <p className="mt-1 text-micro text-destructive">
        Dépasse le reste à régler sur cette échéance ({formatCurrency(reste)}).
      </p>
    );
  }
  if (reste === undefined) return null;
  return <p className="mt-1 text-micro text-muted-foreground">Reste à régler : {formatCurrency(reste)}</p>;
}

// `typeId` vient de `types-reglement` (StlSettlementType), pas de `modes-paiement`. Banque et référence
// exigées selon le type (400 sinon). Pas de date de règlement effectif : 400 à la création, elle se
// saisit au pointage.
export default function AjoutReglement({
  dossierId,
  echeanceId,
  reste,
  onAdd,
}: Readonly<{
  dossierId: string;
  echeanceId: string;
  reste: number | undefined;
  onAdd: (echeanceId: string, body: CreerReglementRequest) => Promise<void>;
}>) {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState('');
  const [dateEcheance, setDateEcheance] = useState(todayISO());
  const [typeId, setTypeId] = useState<string | null>(null);
  const [banqueId, setBanqueId] = useState<string | null>(null);
  const [payeurId, setPayeurId] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typesReglement = useTypesReglement();
  const banques = useBanques();
  // Un appel par ligne d'échéance en apparence, mais le cache GET de `request()` (déduplication
  // des requêtes en vol) les réduit à un seul.
  const payeurs = useApi(() => listPayeurs(dossierId), [dossierId]);
  const typesReglementItems = typesReglement.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const banquesItems = referentielItems(banques.data);
  const payeursItems = (payeurs.data ?? []).map((p) => ({
    label: [p.nom || p.id, p.pieceIdentite].filter(Boolean).join(' · '),
    value: p.id,
  }));
  const aucunPayeur = !!payeurs.data && payeurs.data.length === 0;
  const selectedType = typesReglement.data.find((t) => t.id === typeId);
  const banqueRequired = selectedType?.banqueObligatoire ?? false;
  const referenceRequired = selectedType?.referenceObligatoire ?? false;

  // Reprend les refus serveur (montant ≤ 0 ou > reste) avant l'aller-retour.
  const montantNumber = montant.trim() === '' ? null : Number(montant);
  const montantInvalide = montantNumber !== null && (Number.isNaN(montantNumber) || montantNumber <= 0);
  const montantDepasse = montantNumber !== null && reste !== undefined && montantNumber > reste;

  function reset() {
    setOpen(false);
    setMontant('');
    setDateEcheance(todayISO());
    setTypeId(null);
    setBanqueId(null);
    setPayeurId(null);
    setReference('');
    setError(null);
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Règlement
      </Button>
    );
  }

  return (
    <Modal title="Ajouter un règlement" onClose={reset} width={440}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!typeId || !payeurId || montantNumber === null) return;
          setBusy(true);
          setError(null);
          try {
            await onAdd(echeanceId, {
              montant: montantNumber,
              dateEcheance: toApiDateTime(dateEcheance) ?? null,
              typeId,
              payeurId,
              banqueId: banqueRequired ? banqueId || undefined : undefined,
              reference: reference || undefined,
            });
            reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="reg-montant">Montant</FieldLabel>
            <Input id="reg-montant" type="number" min={0} step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} />
            <AideMontant invalide={montantInvalide} depasse={montantDepasse} reste={reste} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-date-echeance">Date d'échéance</FieldLabel>
            <Input id="reg-date-echeance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-payeur">Réglé par</FieldLabel>
            <Select items={payeursItems} value={payeurId} onValueChange={(v) => setPayeurId(v)} disabled={aucunPayeur}>
              <SelectTrigger id="reg-payeur" className="w-full">
                <SelectValue placeholder={placeholderPayeur(payeurs.loading, aucunPayeur)} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {payeursItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {aucunPayeur && (
              <p className="mt-1 text-micro text-destructive">
                Ce dossier n'a aucun acquéreur rattaché : impossible d'enregistrer un règlement.
              </p>
            )}
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-type">Type de règlement</FieldLabel>
            <Select
              items={typesReglementItems}
              value={typeId}
              onValueChange={(v) => {
                setTypeId(v);
                setBanqueId(null);
              }}
            >
              <SelectTrigger id="reg-type" className="w-full">
                <SelectValue placeholder={typesReglement.loading ? 'Chargement…' : 'Type de règlement'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {typesReglementItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          {banqueRequired && (
            <FormField>
              <FieldLabel htmlFor="reg-banque">Banque</FieldLabel>
              <Select items={banquesItems} value={banqueId} onValueChange={(v) => setBanqueId(v)}>
                <SelectTrigger id="reg-banque" className="w-full">
                  <SelectValue placeholder={banques.loading ? 'Chargement…' : 'Banque'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {banquesItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormField>
          )}
          {referenceRequired && (
            <FormField>
              <FieldLabel htmlFor="reg-reference">Référence (n° de chèque…)</FieldLabel>
              <Input id="reg-reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
            </FormField>
          )}
        </FieldGroup>
        {error && <p className="mt-3 text-micro text-destructive">{error}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
          <Button
            type="submit"
            disabled={
              busy ||
              montantNumber === null ||
              montantInvalide ||
              montantDepasse ||
              !typeId ||
              !payeurId ||
              (banqueRequired && !banqueId) ||
              (referenceRequired && !reference)
            }
          >
            Ok
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
