import { ArrowUpRight, Pencil, Send } from 'lucide-react';
import { Badge, Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { formatCurrency } from '../../../lib/format';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette, EnteteMaquette, OngletsMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const ONGLETS = [['Étape'], ['Autres tranches', 0], ['Choix article'], ['Profils'], ['Autres'], ['Offres', 1], ['Actions', 6]] as const;

export default function MaquetteOffre(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran
      titre="Prospection"
      entree="Prospections"
      fil={['Prospections']}
      entete={
        <EnteteMaquette code="PRO-000456" nom="Karim Alaoui">
          <Badge tone="progress">4 APRES VISITES</Badge>
        </EnteteMaquette>
      }
      {...lien}
    >
      <OngletsMaquette onglets={ONGLETS} actif="Choix article" cibles={{ 'Choix article': [1, 'haut'], Offres: [5, 'haut'] }} />
      <Card title="Choix article" action={<Button type="button" variant="ghost" size="sm"><Pencil data-icon="inline-start" /> Modifier</Button>}>
        <div className="flex flex-col gap-1.5">
          <span className="text-micro font-medium text-muted-foreground">Tranche principale</span>
          <span className="inline-flex w-fit items-center gap-1 rounded-md bg-(--neutral-bg) px-2.5 py-1 text-body font-semibold text-primary">
            Projet Les Jardins — Tranche 2 <ArrowUpRight className="size-2.5" />
          </span>
          <span className="text-body text-foreground">
            <span className="font-semibold">B-204</span> · Appartement · 3 chambres · 98 m² · {formatCurrency(1050000)}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2.5" {...cible(2, 'gauche')}>
            <span className="text-micro font-medium text-muted-foreground">Offre de prix :</span>
            <Button type="button" variant="outline" size="sm">
              <Send data-icon="inline-start" /> Fermer
            </Button>
          </div>
          <div className="flex items-end gap-3">
            <div className="w-36"><ChampMaquette libelle="Remise (%)" valeur="3" /></div>
            <div className="w-44"><ChampMaquette libelle="Prix imposé TTC" /></div>
            <div className="w-56"><ChampMaquette libelle="Mode de paiement" valeur="Crédit bancaire" liste /></div>
          </div>
          <ChampMaquette libelle="Note reprise sur l'offre (optionnel)" />
          <Button type="button" size="sm" className="w-fit" {...cible(3, 'droite')}>Établir et envoyer l'offre</Button>
          <div {...cible(4, 'gauche')} className="flex flex-col gap-0.5 rounded-lg bg-muted/40 p-3">
            <span className="text-label font-medium text-foreground">Offre OFR-000789 · {formatCurrency(1018500)}</span>
            <span className="text-micro text-(--success)">Email : envoyé à karim.alaoui@exemple.ma.</span>
            <span className="text-micro text-(--success)">WhatsApp : envoyé à 06 00 00 00 02.</span>
          </div>
        </div>
      </Card>
    </MaquetteEcran>
  );
}
