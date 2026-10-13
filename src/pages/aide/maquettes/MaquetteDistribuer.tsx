import { Send, Shuffle } from 'lucide-react';
import LignesADistribuer from '../../../components/equipe/LignesADistribuer';
import { Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { formatDate } from '../../../lib/format';
import type { LigneADistribuerDto } from '../../../types';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const rien = () => undefined;

const ligne = (id: string, nom: string, trancheCode: string, dateDocument: string): LigneADistribuerDto => ({
  id,
  code: `PPR-0001${id}`,
  nom,
  trancheCode,
  dateDocument,
  dejaTraitee: false,
});

const LIGNES = [
  ligne('21', 'Leila Bennis', 'TRANCHE 2', '2026-09-20'),
  ligne('22', 'Mehdi Squalli', 'TRANCHE 1', '2026-09-28'),
  ligne('23', 'Ghita Fassi', 'TRANCHE 2', '2026-10-05'),
  ligne('24', 'Rachid Amrani', 'TRANCHE 1', '2026-10-11'),
];

const COCHEES: ReadonlySet<string> = new Set(['21', '22']);

export default function MaquetteDistribuer(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran titre="Mon équipe" entree="Distribution & équipe" fil={['Ventes', 'Mon équipe']} {...lien}>
      <div className="flex items-start gap-2">
        <div {...cible(1, 'bas')} className="flex flex-1 items-center gap-2.5 rounded-xl border border-border bg-card p-3">
          <span className="text-body font-medium text-muted-foreground">Période</span>
          <span className="w-28"><ChampMaquette valeur={formatDate('2026-09-13')} /></span>
          <span className="text-body text-muted-foreground">au</span>
          <span className="w-28"><ChampMaquette valeur={formatDate('2026-10-13')} /></span>
          <Button type="button" variant="outline" size="sm">30 jours</Button>
          <Button type="button" variant="outline" size="sm">90 jours</Button>
          <Button type="button" variant="outline" size="sm">Ce mois</Button>
        </div>
        <div className="w-56">
          <ChampMaquette libelle="Projet" valeur="Tous mes projets" liste />
        </div>
      </div>
      <div {...cible(2)}>
        <Card
          title="À distribuer"
          action={
            <span className="flex items-center gap-4 text-label">
              <span className="text-muted-foreground">4 en attente · la plus ancienne depuis 23 j</span>
              <span className="flex items-center gap-2 text-foreground">
                <span className="size-3.5 rounded-sm border border-input" /> Voir tout (y compris déjà traitées)
              </span>
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 text-label text-foreground">
                <span className="size-3.5 rounded-sm border border-input" /> Tout cocher
              </span>
              <span className="ml-auto w-60"><ChampMaquette valeur="Amine Kettani" liste /></span>
              <Button type="button" {...cible(3, 'haut')}>
                <Send data-icon="inline-start" /> Distribuer (2)
              </Button>
              <Button type="button" variant="outline" {...cible(4, 'haut')}>
                <Shuffle data-icon="inline-start" /> Répartir automatiquement (2)
              </Button>
            </div>
            <div {...cible(5, 'gauche', 'li button')}>
              <LignesADistribuer lignes={LIGNES} selection={COCHEES} onBasculer={rien} onOuvrir={rien} />
            </div>
          </div>
        </Card>
      </div>
    </MaquetteEcran>
  );
}
