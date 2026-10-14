import { useId, useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { ChampCase } from './ChampsSaisie';
import type { EditionDossier } from '../../../lib/editionDossier';
import type { ModifierDossierRequest } from '../../../types/edition';

type ModeRemise = 'montant' | 'pourcentage';

/** Saisie française (« 12,5 ») → nombre ; vide ou invalide → null. */
function nombre(texte: string): number | null {
  const n = Number(texte.replace(/\s/g, '').replace(',', '.'));
  return texte.trim() === '' || Number.isNaN(n) ? null : n;
}

/** Seuls la remise et la TVA réellement changées partent : un envoi recalcule tous les prix du dossier. */
function corpsPrix(
  saisie: { mode: ModeRemise; remise: string; tva: string; forcer: boolean },
  initial: { remiseMontantHT: number; tvaPourcent: number },
): ModifierDossierRequest {
  const corps: ModifierDossierRequest = {};
  const valeur = nombre(saisie.remise);
  if (valeur != null && saisie.mode === 'pourcentage') corps.remisePourcentage = valeur;
  if (valeur != null && saisie.mode === 'montant' && valeur !== initial.remiseMontantHT) corps.remiseMontantHT = valeur;
  const tauxTva = nombre(saisie.tva);
  if (tauxTva != null && tauxTva !== initial.tvaPourcent) corps.tva = tauxTva / 100;
  if (saisie.forcer && (corps.remiseMontantHT != null || corps.remisePourcentage != null)) corps.forcerRemise = true;
  return corps;
}

/**
 * Remise (montant HT ou pourcentage) et TVA de l'en-tête (`Sale.cs:RecalcDiscount`) : le serveur garde le montant,
 * recalcule le taux et refuse un dépassement de plafond sans « Dépasser le plafond ».
 */
export default function PrixDialog({
  edition,
  remiseMontantHT,
  tauxTva,
  onClose,
}: Readonly<{ edition: EditionDossier; remiseMontantHT: number; tauxTva: number; onClose: () => void }>) {
  const idRemise = useId();
  const idTva = useId();
  const tvaPourcent = Math.round(tauxTva * 10000) / 100;
  const [mode, setMode] = useState<ModeRemise>('montant');
  const [remise, setRemise] = useState(String(remiseMontantHT));
  const [tva, setTva] = useState(String(tvaPourcent));
  const [forcer, setForcer] = useState(false);

  // Un montant laissé dans le champ partirait en pourcentage (50 DH → 50 %) : la saisie repart à chaque bascule.
  function changerMode(suivant: ModeRemise) {
    setMode(suivant);
    setRemise(suivant === 'montant' ? String(remiseMontantHT) : '');
  }

  async function enregistrer() {
    const corps = corpsPrix({ mode, remise, tva, forcer }, { remiseMontantHT, tvaPourcent });
    if (await edition.enregistrer(corps)) onClose();
  }

  return (
    <Modal title="Modifier la remise et la TVA" onClose={onClose} width={440}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 text-body">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode-remise" checked={mode === 'montant'} onChange={() => changerMode('montant')} />
            Montant HT
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode-remise" checked={mode === 'pourcentage'} onChange={() => changerMode('pourcentage')} />
            Pourcentage du total HT
          </label>
        </div>
        <div>
          <label htmlFor={idRemise} className="mb-0.5 block text-micro font-medium text-muted-foreground">
            {mode === 'montant' ? 'Remise HT (DH)' : 'Remise (%)'}
          </label>
          <Input id={idRemise} inputMode="decimal" value={remise} onChange={(e) => setRemise(e.target.value)} />
        </div>
        <div>
          <label htmlFor={idTva} className="mb-0.5 block text-micro font-medium text-muted-foreground">TVA (%)</label>
          <Input id={idTva} inputMode="decimal" value={tva} onChange={(e) => setTva(e.target.value)} />
        </div>
        <ChampCase label="Dépasser le plafond de remise de l'article" checked={forcer} onChange={setForcer} />
        <p className="text-micro text-muted-foreground">
          Le montant de remise est conservé et le taux recalculé ; le schéma de financement n'est pas modifié.
        </p>
        {edition.erreur && <p role="alert" className="text-micro text-destructive">{edition.erreur}</p>}
      </div>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={edition.busy}>Annuler</Button>
        <Button type="button" onClick={() => void enregistrer()} disabled={edition.busy}>
          {edition.busy ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
