import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import ContactBoutons from './ContactBoutons';
import type { FicheOuverte } from '../dashboard/FicheProspectionLazy';
import type { CanalContact } from '../../lib/contact';
import { formatDate, formatHeure, formatNumber, formatRecuIlYa } from '../../lib/format';
import type { LeadJourneeDto, RelanceJourneeDto } from '../../types';

/** Clic sur le nom = la fiche en fenêtre, sans quitter « Ma journée ». */
type Ouvrir = (fiche: FicheOuverte) => void;

function Ligne({ nom, fiche, onOuvrir, detail, droite }: Readonly<{
  nom: string;
  fiche: FicheOuverte;
  onOuvrir: Ouvrir;
  detail: string;
  droite: ReactNode;
}>) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2">
      <div className="flex min-w-0 flex-col items-start">
        <button
          type="button"
          onClick={() => onOuvrir(fiche)}
          className="max-w-full truncate text-left text-label font-semibold text-foreground hover:text-primary"
        >
          {nom}
        </button>
        <span className="max-w-full truncate text-micro text-muted-foreground">{detail}</span>
      </div>
      {droite}
    </li>
  );
}

function joindre(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

export function LigneLead({ lead, onOuvrir }: Readonly<{ lead: LeadJourneeDto; onOuvrir: Ouvrir }>) {
  const nom = lead.nom || lead.code || 'Sans nom';
  return (
    <Ligne
      nom={nom}
      fiche={{ id: lead.prospectionId, pre: true }}
      onOuvrir={onOuvrir}
      detail={joindre(lead.source, lead.projetCode ?? lead.trancheCode)}
      droite={
        <span className="flex shrink-0 items-center gap-1 text-micro text-muted-foreground">
          <Clock aria-hidden className="size-3" />
          {formatRecuIlYa(lead.ageJours)}
        </span>
      }
    />
  );
}

/** `retard` : l'échéance est dite en jours (« prévue il y a 3 jours ») plutôt qu'en heure. */
export function LigneRelance({ relance, onOuvrir, onContact, retard = false, action }: Readonly<{
  relance: RelanceJourneeDto;
  onOuvrir: Ouvrir;
  /** Après Appeler / WhatsApp : la page ouvre « noter l'échange » avec le type d'action du canal. */
  onContact?: (relance: RelanceJourneeDto, canal: CanalContact) => void;
  retard?: boolean;
  action?: ReactNode;
}>) {
  const nom = relance.nom || 'Sans nom';
  const quand = retard
    ? `Prévue le ${formatDate(relance.echeance)} (il y a ${formatNumber(relance.joursDeRetard)} j)`
    : formatHeure(relance.echeance);
  return (
    <Ligne
      nom={nom}
      fiche={{ id: relance.prospectionId, pre: relance.preProspection }}
      onOuvrir={onOuvrir}
      detail={joindre(quand, relance.resultat, relance.projetCode ?? relance.trancheCode, relance.message)}
      droite={action ?? (
        <ContactBoutons
          nom={nom}
          telephone={relance.telephone}
          indicatif={relance.indicatif}
          onContact={onContact ? (canal) => onContact(relance, canal) : undefined}
        />
      )}
    />
  );
}
