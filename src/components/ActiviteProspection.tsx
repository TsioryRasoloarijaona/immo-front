import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from './ui';
import { ElementResume, LigneActivite } from './FicheShell';
import { formatDate, formatDateTime } from '../lib/format';
import type { ActiviteProspectionDto, BadgeTone } from '../types';

// Seuils en jours, à valider avec le métier : le backend n'en impose aucun.
export const SEUIL_INACTIVITE_TIEDE = 30;
export const SEUIL_INACTIVITE_FROID = 90;

// Piège de nommage : `warning` est le rouge de la palette, `amber` son orange.
function toneInactivite(jours: number): BadgeTone {
  if (jours < SEUIL_INACTIVITE_TIEDE) return 'success';
  if (jours < SEUIL_INACTIVITE_FROID) return 'amber';
  return 'warning';
}

export function InactiviteBadge({ jours }: Readonly<{ jours: number }>) {
  return (
    <Badge tone={toneInactivite(jours)}>
      {jours <= 0 ? "Action aujourd'hui" : `${jours} j sans action`}
    </Badge>
  );
}

export function DossierIssuBanner({
  dossierId,
  dossierCode,
  statutDossier,
}: Readonly<{
  dossierId?: string | null;
  dossierCode?: string | null;
  statutDossier?: string | null;
}>) {
  if (!dossierId) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-md border border-(--success-border) bg-(--success-bg) px-3 py-2 text-body text-(--success)">
      <span>
        Prospection transformée en dossier
        {dossierCode ? <span className="font-semibold"> {dossierCode}</span> : null}.
      </span>
      {statutDossier && <Badge tone="success">{statutDossier}</Badge>}
      <Link
        to={`/dossiers/${dossierId}`}
        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline"
      >
        Ouvrir le dossier
        <ArrowUpRight aria-hidden className="size-3.5" />
      </Link>
    </div>
  );
}

// Les chaînes vides arrivent déjà en `null` (normalisées par le backend).
export function ResumeActivite({
  activite,
  tranche,
  premiereNote,
  action,
}: Readonly<{
  activite?: ActiviteProspectionDto | null;
  tranche?: string | null;
  premiereNote?: string | null;
  action?: ReactNode;
}>) {
  if (!activite) {
    return (
      <LigneActivite action={action}>
        <span>
          <span className="font-medium text-foreground">Indicateurs d'activité non disponibles</span> — la vue
          légataire ne couvre ni les pré-prospections ni les prospections créées ici. Ce n'est pas une absence
          d'activité : le journal ci-dessous reste la source.
        </span>
      </LigneActivite>
    );
  }

  const a = activite;
  const nbVisites = a.nbVisites ?? 0;
  const projet = a.projetLibelle || a.projetCode;
  const echangeRedit =
    !!a.derniereCommunicationMessage && premiereNote?.trim() === a.derniereCommunicationMessage.trim();

  return (
    <div className="flex flex-col gap-1.5">
      <LigneActivite action={action}>
        <ElementResume libelle="Dernière action">
          {a.derniereActionDate ? formatDateTime(a.derniereActionDate) : '—'}
        </ElementResume>
        <ElementResume libelle="Dernière comm.">
          {a.derniereCommunicationDate ? formatDateTime(a.derniereCommunicationDate) : '—'}
        </ElementResume>
        {a.derniereCommunicationResultat && (
          <ElementResume libelle="Résultat">{a.derniereCommunicationResultat}</ElementResume>
        )}
        {/* Le bloc existe, donc un zéro signifie bien « aucune visite », pas une donnée manquante. */}
        <ElementResume libelle="Visites">
          {nbVisites}
          {nbVisites > 0 && (
            <span className="font-normal text-muted-foreground tabular-nums">
              {' '}
              · 1re {formatDate(a.premiereVisiteDate)} · dernière {formatDate(a.derniereVisiteDate)}
            </span>
          )}
        </ElementResume>
        {projet && projet !== tranche && <ElementResume libelle="Projet">{projet}</ElementResume>}
        {a.cin && <ElementResume libelle="CIN">{a.cin}</ElementResume>}
        {a.alerteActiveDate && (
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            <Badge tone="amber">Relance jusqu'au {formatDate(a.alerteActiveDate)}</Badge>
            {a.alerteActiveRaison && <span className="text-foreground">{a.alerteActiveRaison}</span>}
          </span>
        )}
      </LigneActivite>
      {a.derniereCommunicationMessage && !echangeRedit && (
        <p className="text-body text-muted-foreground">
          Dernier échange <span className="whitespace-pre-wrap text-foreground">{a.derniereCommunicationMessage}</span>
        </p>
      )}
    </div>
  );
}
