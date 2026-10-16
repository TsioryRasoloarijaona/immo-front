import { useId, useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { ChampCase } from './ChampsSaisie';
import type { EditionDossier } from '../../../lib/editionDossier';
import type { ModifierDossierRequest } from '../../../types/edition';

type CleSaisieRemise = 'remiseMontantHT' | 'remisePourcentage' | 'prixVenteHT' | 'prixVenteTTC';

/** Les quatre saisies exclusives de la remise ; chacune repart de sa valeur actuelle. */
const MODES: { cle: CleSaisieRemise; choix: string; libelle: string }[] = [
  { cle: 'remiseMontantHT', choix: 'Montant HT', libelle: 'Remise HT (DH)' },
  { cle: 'remisePourcentage', choix: 'Pourcentage du total HT', libelle: 'Remise (%)' },
  { cle: 'prixVenteHT', choix: 'Prix de vente HT', libelle: 'Prix de vente HT (DH)' },
  { cle: 'prixVenteTTC', choix: 'Prix de vente TTC', libelle: 'Prix de vente TTC (DH)' },
];

/** Saisie française (« 12,5 ») → nombre ; vide ou invalide → null. */
function nombre(texte: string): number | null {
  const n = Number(texte.replace(/\s/g, '').replace(',', '.'));
  return texte.trim() === '' || Number.isNaN(n) ? null : n;
}

/** Seules la saisie de remise et la TVA réellement changées partent : un envoi recalcule tous les prix du dossier. */
function corpsPrix(
  saisie: { mode: CleSaisieRemise; remise: string; tva: string; forcer: boolean },
  initial: { valeurs: Record<CleSaisieRemise, number>; tvaPourcent: number },
): ModifierDossierRequest {
  const corps: ModifierDossierRequest = {};
  const valeur = nombre(saisie.remise);
  const remiseChangee = valeur != null && valeur !== initial.valeurs[saisie.mode];
  if (remiseChangee) corps[saisie.mode] = valeur;
  const tauxTva = nombre(saisie.tva);
  if (tauxTva != null && tauxTva !== initial.tvaPourcent) corps.tva = tauxTva / 100;
  if (saisie.forcer && remiseChangee) corps.forcerRemise = true;
  return corps;
}

/**
 * Remise (montant HT, pourcentage ou prix de vente HT / TTC) et TVA de l'en-tête (`Sale.cs:RecalcDiscount`) : le
 * serveur garde le montant, recalcule le taux et refuse un dépassement de plafond sans « Dépasser le plafond ».
 * Remise verrouillée (`champsVerrouilles`) : seule la TVA reste modifiable.
 */
export default function PrixDialog({
  edition,
  remiseMontantHT,
  remisePourcentage,
  prixVenteHT,
  prixVenteTTC,
  tauxTva,
  onClose,
}: Readonly<{
  edition: EditionDossier;
  remiseMontantHT: number;
  /** Taux actuel, 0–100. */
  remisePourcentage: number;
  prixVenteHT: number;
  prixVenteTTC: number;
  tauxTva: number;
  onClose: () => void;
}>) {
  const idRemise = useId();
  const idTva = useId();
  const verrouillee = edition.verrouille('remise');
  const tvaPourcent = Math.round(tauxTva * 10000) / 100;
  const valeurs: Record<CleSaisieRemise, number> = {
    remiseMontantHT,
    remisePourcentage: Math.round(remisePourcentage * 10000) / 10000,
    prixVenteHT,
    prixVenteTTC,
  };
  const [mode, setMode] = useState<CleSaisieRemise>('remiseMontantHT');
  const [remise, setRemise] = useState(String(remiseMontantHT));
  const [tva, setTva] = useState(String(tvaPourcent));
  const [forcer, setForcer] = useState(false);
  const libelle = MODES.find((m) => m.cle === mode)?.libelle;

  // Une valeur laissée dans le champ changerait de sens (50 DH → 50 %) : la saisie repart de la valeur actuelle
  // du mode choisi à chaque bascule.
  function changerMode(suivant: CleSaisieRemise) {
    setMode(suivant);
    setRemise(String(valeurs[suivant]));
  }

  async function enregistrer() {
    const corps = corpsPrix({ mode, remise, tva, forcer }, { valeurs, tvaPourcent });
    if (await edition.enregistrer(corps)) onClose();
  }

  return (
    <Modal title="Modifier la remise et la TVA" onClose={onClose} width={480}>
      <div className="flex flex-col gap-3">
        <fieldset disabled={verrouillee} className="flex flex-col gap-3 disabled:opacity-60">
          <legend className="sr-only">Saisie de la remise</legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-body">
            {MODES.map((m) => (
              <label key={m.cle} className="flex items-center gap-1.5">
                <input type="radio" name="mode-remise" checked={mode === m.cle} onChange={() => changerMode(m.cle)} />
                {m.choix}
              </label>
            ))}
          </div>
          <div>
            <label htmlFor={idRemise} className="mb-0.5 block text-micro font-medium text-muted-foreground">{libelle}</label>
            <Input id={idRemise} inputMode="decimal" value={remise} onChange={(e) => setRemise(e.target.value)} />
          </div>
          <ChampCase label="Dépasser le plafond de remise de l'article" checked={forcer} onChange={setForcer} />
        </fieldset>
        {verrouillee && (
          <p role="status" className="text-micro text-muted-foreground">
            Remise verrouillée : l'article n'a pas de plafond de remise et votre rôle n'atteint pas le deuxième niveau.
          </p>
        )}
        <div>
          <label htmlFor={idTva} className="mb-0.5 block text-micro font-medium text-muted-foreground">TVA (%)</label>
          <Input id={idTva} inputMode="decimal" value={tva} onChange={(e) => setTva(e.target.value)} />
        </div>
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
