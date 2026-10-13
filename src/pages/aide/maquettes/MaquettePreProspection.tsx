import { Check, Plus, Upload } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette, FenetreMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const LIGNES = [
  ['PPR-000118', 'Leila Bennis', 'FACEBOOK', 'TRANCHE 2'],
  ['PPR-000117', 'Mehdi Squalli', 'SITE WEB', 'TRANCHE 1'],
  ['PPR-000116', 'Ghita Fassi', 'INSTAGRAM', 'TRANCHE 2'],
  ['PPR-000115', 'Rachid Amrani', 'PANNEAU', 'TRANCHE 1'],
] as const;

export default function MaquettePreProspection(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran
      titre="Pré-prospections"
      entree="Pré-prospections"
      fil={['Ventes', 'Pré-prospections']}
      actions={
        <>
          <Button type="button" size="sm" variant="outline" {...cible(4, 'bas')}>
            <Upload data-icon="inline-start" /> Importer des leads
          </Button>
          <Button type="button" size="sm" {...cible(1, 'bas')}>
            <Plus data-icon="inline-start" /> Nouvelle pré-prospection
          </Button>
        </>
      }
      {...lien}
    >
      <div className="relative">
        <div className="flex flex-col rounded-xl border border-border bg-card opacity-50">
          {LIGNES.map((l) => (
            <div key={l[0]} className="grid grid-cols-4 gap-2 border-b border-border px-3 py-1.5 text-body last:border-b-0">
              {l.map((c) => <span key={c} className="truncate text-muted-foreground">{c}</span>)}
            </div>
          ))}
        </div>
        <FenetreMaquette
          titre="Nouvelle pré-prospection"
          className="relative -mt-20 ml-auto w-[88%]"
          pied={
            <>
              <Button type="button" variant="outline">Annuler</Button>
              <Button type="button" {...cible(3, 'gauche')}>
                <Check data-icon="inline-start" /> Créer la pré-prospection
              </Button>
            </>
          }
        >
          <Card title="Contact">
            <div className="grid grid-cols-3 gap-3">
              <ChampMaquette libelle="Nom *" valeur="Salma Idrissi" repere={2} cote="gauche" />
              <ChampMaquette libelle="Téléphone" valeur="06 00 00 00 01" />
              <ChampMaquette libelle="Email" valeur="salma.idrissi@exemple.ma" />
            </div>
          </Card>
          <Card title="Prospection">
            <div className="grid grid-cols-3 gap-3">
              <ChampMaquette libelle="Projet" valeur="Projet Les Jardins" liste />
              <ChampMaquette libelle="Tranche" valeur="Tranche 2" liste />
              <ChampMaquette libelle="Article" liste />
              <ChampMaquette libelle="Source de contact" valeur="FACEBOOK" liste />
              <ChampMaquette libelle="Support" valeur="CAMPAGNE AUTOMNE" liste />            </div>
          </Card>
        </FenetreMaquette>
      </div>
    </MaquetteEcran>
  );
}
