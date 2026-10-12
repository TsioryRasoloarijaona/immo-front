import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import ContactBoutons from './ContactBoutons';
import { formatDate, formatHeure, formatNumber, formatRecuIlYa } from '../../lib/format';
import type { LeadJourneeDto, RelanceJourneeDto } from '../../types';

function routeFiche(prospectionId: string, preProspection: boolean): string {
  return preProspection ? `/pre-prospections/${prospectionId}` : `/prospections/${prospectionId}`;
}

function Ligne({ nom, vers, detail, droite }: Readonly<{ nom: string; vers: string; detail: string; droite: ReactNode }>) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2">
      <div className="flex min-w-0 flex-col">
        <Link to={vers} className="truncate text-label font-semibold text-foreground no-underline hover:text-primary">
          {nom}
        </Link>
        <span className="truncate text-micro text-muted-foreground">{detail}</span>
      </div>
      {droite}
    </li>
  );
}

function joindre(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

export function LigneLead({ lead }: Readonly<{ lead: LeadJourneeDto }>) {
  const nom = lead.nom || lead.code || 'Sans nom';
  return (
    <Ligne
      nom={nom}
      vers={routeFiche(lead.prospectionId, true)}
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
export function LigneRelance({ relance, retard = false, action }: Readonly<{ relance: RelanceJourneeDto; retard?: boolean; action?: ReactNode }>) {
  const nom = relance.nom || 'Sans nom';
  const quand = retard
    ? `Prévue le ${formatDate(relance.echeance)} (il y a ${formatNumber(relance.joursDeRetard)} j)`
    : formatHeure(relance.echeance);
  return (
    <Ligne
      nom={nom}
      vers={routeFiche(relance.prospectionId, relance.preProspection)}
      detail={joindre(quand, relance.resultat, relance.projetCode ?? relance.trancheCode, relance.message)}
      droite={action ?? <ContactBoutons nom={nom} telephone={relance.telephone} indicatif={relance.indicatif} />}
    />
  );
}
