import { ArrowRight, Check, Phone, Plus } from 'lucide-react';
import DoublonsProspectPanel from '../../../components/DoublonsProspectPanel';
import { Badge } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import type { ProspectDoublonDto } from '../../../types';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette, EnteteMaquette, FenetreMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const rien = () => undefined;

const DOUBLON: ProspectDoublonDto = {
  id: 'doublon-1',
  code: 'PRO-004521',
  nom: 'Salma Idrissi',
  mobile: '06 00 00 00 01',
  email: 'salma.idrissi@exemple.ma',
  ville: 'Rabat',
  type: 'PRO',
  criteres: ['NOM', 'TELEPHONE'],
};

export default function MaquetteTransformer(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran
      titre="Pré-prospection"
      entree="Pré-prospections"
      fil={['Pré-prospections']}
      repereFil={1}
      entete={
        <EnteteMaquette code="PPR-000101" nom="Salma Idrissi">
          <Badge tone="amber">Non qualifiée</Badge>
          <Badge tone="neutral">1 A TRAITER</Badge>
        </EnteteMaquette>
      }
      {...lien}
    >
      <div className="flex justify-end gap-1.5">
        <Button type="button" variant="outline" size="sm">
          <Phone data-icon="inline-start" /> Appeler
        </Button>
        <Button type="button" variant="outline" size="sm" className="border-destructive/30 text-destructive">
          Archiver
        </Button>
        <Button type="button" variant="outline" size="sm" {...cible(2, 'gauche')}>
          <Plus data-icon="inline-start" /> Créer prospect
        </Button>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <FenetreMaquette titre="Créer la fiche prospect">
          <div className="grid grid-cols-2 gap-3">
            <ChampMaquette libelle="Prénom" valeur="Salma" />
            <ChampMaquette libelle="Nom" valeur="Idrissi" />
            <ChampMaquette libelle="Téléphone" valeur="06 00 00 00 01" />
            <ChampMaquette libelle="Email" valeur="salma.idrissi@exemple.ma" />
          </div>
          <div {...cible(3, 'gauche', 'button')}>
            <DoublonsProspectPanel doublons={[DOUBLON]} libelleChoisir="Rattacher" onChoisir={rien} onNouveauContact={rien} />
          </div>
        </FenetreMaquette>
        <ArrowRight className="mt-24 size-5 text-muted-foreground" />
        <FenetreMaquette
          titre="Transformer en prospection"
          pied={
            <>
              <Button type="button" variant="outline">Annuler</Button>
              <Button type="button" {...cible(5, 'gauche')}>
                <Check data-icon="inline-start" /> Transformer
              </Button>
            </>
          }
        >
          <ChampMaquette libelle="Commercial *" valeur="Amine Kettani" liste repere={4} cote="gauche" />
          <ChampMaquette libelle="Tranche *" valeur="Tranche 2" liste />
          <ChampMaquette libelle="Article (optionnel)" liste />
        </FenetreMaquette>
      </div>
    </MaquetteEcran>
  );
}
