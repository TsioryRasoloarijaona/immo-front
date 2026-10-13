import { Check, Pencil } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { formatCurrency } from '../../../lib/format';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const SCHEMA = [
  ['AVANCE', 105000],
  ['AUTO-FINANCEMENT', 913500],
  ['FRAIS SYNDIC', 6000],
] as const;

export default function MaquetteCreerDossier(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran titre="Nouveau dossier de vente" entree="Prospections" fil={['Prospections', 'PRO-000456', 'Nouveau dossier']} {...lien}>
      <Card
        title="Sélectionner un article"
        action={
          <Button type="button" variant="ghost" size="sm" {...cible(2, 'gauche')}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
        }
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-micro font-medium text-muted-foreground">Article sélectionné (1) — pré-rempli depuis la prospection</span>
          <span className="rounded-lg bg-muted/40 px-3 py-2 text-body text-foreground">
            <span className="font-semibold">B-204</span> · Appartement · 3 chambres · 98 m² · {formatCurrency(1050000)}
          </span>
        </div>
      </Card>
      <div className="grid grid-cols-2 items-start gap-3">
        <Card title="Prix & remise">
          <div className="grid grid-cols-2 gap-3" {...cible(3, 'gauche')}>
            <ChampMaquette libelle="Prix avant remise (DH) *" valeur="1050000" />
            <ChampMaquette libelle="Remise commerciale" valeur="3" />
            <ChampMaquette libelle="CIN du client *" valeur="AB000000" />
            <ChampMaquette libelle="Mode de paiement *" valeur="Crédit bancaire" liste />
          </div>
        </Card>
        <Card title="Schéma de financement">
          <div className="flex flex-col gap-1.5">
            {SCHEMA.map(([categorie, montant]) => (
              <span key={categorie} className="flex justify-between rounded-lg bg-muted/30 px-3 py-1.5 text-label">
                <span className="font-medium text-foreground">{categorie}</span>
                <span className="tabular-nums text-foreground">{formatCurrency(montant)}</span>
              </span>
            ))}
            <span {...cible(4, 'gauche')} className="mt-1.5 flex justify-between border-t border-border pt-2">
              <span className="text-label font-semibold text-foreground">Total général</span>
              <span className="text-title font-semibold tabular-nums text-foreground">{formatCurrency(1024500)}</span>
            </span>
          </div>
        </Card>
      </div>
      <div className="flex justify-end border-t border-border pt-3">
        <Button type="button" {...cible(5, 'gauche')}>
          <Check data-icon="inline-start" /> Créer le dossier
        </Button>
      </div>
    </MaquetteEcran>
  );
}
