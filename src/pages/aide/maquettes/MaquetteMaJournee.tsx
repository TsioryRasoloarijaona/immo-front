import { Check, Inbox } from 'lucide-react';
import BlocJournee from '../../../components/parcours/BlocJournee';
import { LigneLead, LigneRelance } from '../../../components/parcours/LignesJournee';
import { Button } from '../../../components/ui/button';
import type { LeadJourneeDto, RelanceJourneeDto } from '../../../types';
import MaquetteEcran from './MaquetteEcran';
import { cible, type LienReperes } from './reperes';

const rien = () => undefined;

const LEADS: LeadJourneeDto[] = [
  { prospectionId: 'lead-1', nom: 'Salma Idrissi', telephone: '0600000001', source: 'FACEBOOK', projetCode: 'LES JARDINS', ageJours: 0 },
  { prospectionId: 'lead-2', nom: 'Karim Alaoui', telephone: '0600000002', source: 'SITE WEB', projetCode: 'LES JARDINS', ageJours: 1 },
];

const relance = (id: string, nom: string, heure: string, resultat: string, retard = 0): RelanceJourneeDto => ({
  interactionId: id,
  prospectionId: id,
  preProspection: false,
  nom,
  telephone: '0600000003',
  projetCode: 'RÉSIDENCE AL WAHA',
  echeance: `2026-10-${retard ? '10' : '13'}T${heure}:00`,
  joursDeRetard: retard,
  resultat,
});

const APPELS = [relance('r-1', 'Nadia Tazi', '10:30', 'À rappeler'), relance('r-2', 'Youssef Berrada', '15:00', 'Intéressé')];
const VISITE = relance('v-1', 'Hind Chraibi', '11:00', 'Rendez-vous visite');
const RETARD = relance('t-1', 'Omar Lahlou', '09:00', 'À rappeler', 3);

export default function MaquetteMaJournee(lien: Readonly<LienReperes>) {
  return (
    <MaquetteEcran titre="Ma journée" entree="Ma journée" fil={['Ma journée']} {...lien}>
      <div {...cible(1)} className="flex items-baseline gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-title font-semibold text-foreground">Bonjour Amine</span>
        <span className="text-body text-muted-foreground">2 leads à trier · 2 appels · 1 visite · 1 en retard</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div {...cible(6, 'gauche', 'li button')}>
          <BlocJournee
            titre="À faire maintenant"
            sousTitre="nouveaux leads à rappeler"
            total={2}
            affichees={2}
            vide=""
            pied={
              <>
                <span className="text-micro text-muted-foreground">Plus un lead attend, moins il répond.</span>
                <Button type="button" size="sm" {...cible(2, 'gauche')}>
                  <Inbox data-icon="inline-start" /> Trier (2)
                </Button>
              </>
            }
          >
            {LEADS.map((l) => <LigneLead key={l.prospectionId} lead={l} onOuvrir={rien} />)}
          </BlocJournee>
        </div>
        <div {...cible(3, 'haut', 'li a + a')}>
          <BlocJournee titre="Appels et relances du jour" total={2} affichees={2} vide="">
            {APPELS.map((r) => <LigneRelance key={r.interactionId} relance={r} onOuvrir={rien} />)}
          </BlocJournee>
        </div>
        <BlocJournee titre="Visites du jour" total={1} affichees={1} vide="">
          <LigneRelance
            relance={VISITE}
            onOuvrir={rien}
            action={
              <Button type="button" size="sm" variant="outline" {...cible(4, 'droite')}>
                <Check data-icon="inline-start" /> Visite faite
              </Button>
            }
          />
        </BlocJournee>
        <div {...cible(5)}>
          <BlocJournee titre="En retard" alerte total={1} affichees={1} vide="">
            <LigneRelance relance={RETARD} onOuvrir={rien} retard />
          </BlocJournee>
        </div>
      </div>
    </MaquetteEcran>
  );
}
