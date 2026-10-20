import { useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import GrilleOnglet from './GrilleOnglet';
import { Button } from '../ui/button';
import { getFraisTerrain, saveFraisTerrain, validerFraisTerrain } from '../../lib/apiTerrains';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { useTiersParType } from '../../lib/editionDossier';
import { formatCurrency } from '../../lib/format';
import { choixDepuisLignes, colonnesFrais, normaliserFrais, nouveauFrais } from '../../lib/fraisTerrain';
import { somme } from '../../lib/ongletsTranche';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import type { FactureFraisTerrainDto, LigneFraisTerrainDto, TerrainDetailDto } from '../../types/terrains';

/**
 * Onglet « Coûts » : frais du terrain (grille réconciliée) et « Valider pour règlement », qui crée la facture
 * fournisseur du frais ; les refus du serveur (fournisseur absent, déjà validé…) s'affichent tels quels.
 */
export default function FraisTerrain({ terrain, onModifie }: Readonly<{ terrain: TerrainDetailDto; onModifie: () => void }>) {
  const admin = estAdministrateur(useAuth().user);
  const confirm = useConfirm();
  const [rechargement, setRechargement] = useState(0);
  const [facture, setFacture] = useState<FactureFraisTerrainDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const types = useApi(() => (admin ? listLignesReferentiel('types-frais') : Promise.resolve([])), [admin]);
  const fournisseurs = useTiersParType('FOU', admin);
  const colonnes = colonnesFrais(
    choixDepuisLignes(types.data ?? undefined),
    fournisseurs.items.map((f) => ({ id: f.value, description: f.label })),
  );

  async function valider(fraisId: string, montant: number) {
    const oui = await confirm({
      title: 'Valider pour règlement',
      message: `Une facture fournisseur de ${formatCurrency(montant)} sera créée pour ce frais, qui ne sera plus modifiable ni supprimable. Continuer ?`,
      confirmLabel: 'Valider',
    });
    if (!oui) return;
    setErreur(null);
    setFacture(null);
    try {
      setFacture(await validerFraisTerrain(terrain.id, fraisId));
      setRechargement((n) => n + 1);
      onModifie();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Validation impossible.');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {types.error && <p role="alert" className="text-body text-destructive">{types.error}</p>}
      {facture && (
        <p role="status" className="text-body text-foreground">
          Facture <span className="font-medium">{facture.code}</span> — {formatCurrency(facture.montant)} créée.
        </p>
      )}
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      <GrilleOnglet<LigneFraisTerrainDto>
        source={{
          cle: `${terrain.id}/frais/${rechargement}`,
          charger: () => getFraisTerrain(terrain.id),
          enregistrer: (lignes) => saveFraisTerrain(terrain.id, { lignes }),
        }}
        colonnes={colonnes}
        nouvelle={nouveauFrais(terrain.fournisseur?.id)}
        normaliser={normaliserFrais}
        figee={(l) => l.valide === true}
        onEnregistre={onModifie}
        pied={(lignes) => (
          <p className="text-body text-muted-foreground">
            Total des frais : <span className="font-medium text-foreground">{formatCurrency(somme(lignes, (l) => l.montant))}</span>
          </p>
        )}
        action={admin ? (ligne, modifie) => (ligne.id && ligne.valide !== true ? (
          <Button type="button" size="sm" variant="outline" disabled={modifie}
            title={modifie ? "Enregistrez d'abord les modifications" : undefined}
            onClick={() => void valider(ligne.id ?? '', ligne.montant)}>
            <FileCheck2 data-icon="inline-start" /> Valider pour règlement
          </Button>
        ) : null) : undefined}
      />
    </div>
  );
}
