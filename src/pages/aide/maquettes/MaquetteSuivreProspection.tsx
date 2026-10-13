import { Phone } from 'lucide-react';
import { InactiviteBadge } from '../../../components/ActiviteProspection';
import { Badge, Field } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { PIPELINE_STAGE_SHORT, PIPELINE_STAGES } from '../../../lib/domain';
import { cn } from '../../../lib/utils';
import MaquetteEcran from './MaquetteEcran';
import { ChampMaquette, EnteteMaquette, OngletsMaquette } from './elements';
import { cible, type LienReperes } from './reperes';

const ETAPE = 2;

const ONGLETS = [['Étape'], ['Autres tranches', 0], ['Choix article'], ['Profils'], ['Autres'], ['Offres', 1], ['Actions', 4]] as const;

export default function MaquetteSuivreProspection(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran
      titre="Prospection"
      entree="Prospections"
      fil={['Prospections']}
      repereFil={1}
      entete={
        <EnteteMaquette code="PRO-000456" nom="Karim Alaoui">
          <Badge tone="progress">3 QUALIFIÉ</Badge>
          <InactiviteBadge jours={9} />
        </EnteteMaquette>
      }
      {...lien}
    >
      <div className="flex justify-end gap-1.5">
        <Button type="button" variant="outline" size="sm">
          <Phone data-icon="inline-start" /> Appeler
        </Button>
        <Button type="button" variant="outline" size="sm" className="border-destructive/30 text-destructive" {...cible(5, 'gauche')}>
          Archiver
        </Button>
        <Button type="button" size="sm">Créer un dossier</Button>
      </div>
      <div className="grid grid-cols-4 gap-3 rounded-xl border border-border bg-card p-3">
        <Field label="Tranche" value="Tranche 2" />
        <Field label="Article" value="B-204" />
        <Field label="Source de contact" value="SITE WEB" />
        <Field label="Téléphone" value="06 00 00 00 02" />
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-(--warning)/40 bg-(--warning-bg) px-3 py-2">
        <span className="text-label font-medium text-foreground">1 modification non enregistrée</span>
        <span className="text-micro text-muted-foreground">Étape</span>
        <span className="ml-auto flex gap-1.5">
          <Button type="button" variant="ghost" size="sm">Annuler</Button>
          <Button type="button" size="sm">Enregistrer</Button>
        </span>
      </div>
      <OngletsMaquette onglets={ONGLETS} actif="Étape" cibles={{ Actions: [3, 'haut'] }} />
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center">
          {PIPELINE_STAGES.map((etape, i) => (
            <div key={etape} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex size-5.5 items-center justify-center rounded-full border-2 text-micro font-bold',
                  i <= ETAPE ? 'border-(--sec-prospection) bg-(--sec-prospection) text-white' : 'border-border bg-(--neutral-bg) text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span className="text-micro text-muted-foreground">{PIPELINE_STAGE_SHORT[etape]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <span className="pb-2 text-micro font-medium text-muted-foreground">Changer d'étape :</span>
          <div className="w-56">
            <ChampMaquette valeur="4 APRES VISITES" liste repere={2} cote="haut" />
          </div>
          <span className="pb-2 text-micro text-(--warning)">modification non enregistrée — le bouton Enregistrer est au-dessus des onglets</span>
        </div>
      </div>
    </MaquetteEcran>
  );
}
