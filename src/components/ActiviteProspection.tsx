import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from './ui';
import { ElementResume, LigneActivite } from './FicheShell';
import { formatDate, formatDateTime } from '../lib/format';
import type { ActiviteProspectionDto, BadgeTone } from '../types';

/** Seuils de la pastille d'inactivité, en jours.
 *
 * `GUIDE-FRONT-fiche-prospection.md` §1 les propose (vert < 30 j, orange
 * < 90 j, rouge au-delà) en précisant qu'ils sont **à valider avec le métier** :
 * le backend n'en impose aucun et ne renvoie que le nombre de jours brut. Ils
 * vivent donc ici, en un point unique, pour qu'un arbitrage métier soit une
 * modification de deux nombres et non une chasse à travers les composants. */
export const SEUIL_INACTIVITE_TIEDE = 30;
export const SEUIL_INACTIVITE_FROID = 90;

/** `--warning` est le rouge de la palette (#b02012) et `--amber` son orange
 * (#92580a) — la correspondance avec le vert/orange/rouge du guide n'est donc
 * pas celle que les noms laissent croire. */
function toneInactivite(jours: number): BadgeTone {
  if (jours < SEUIL_INACTIVITE_TIEDE) return 'success';
  if (jours < SEUIL_INACTIVITE_FROID) return 'amber';
  return 'warning';
}

/** Pastille « N j sans action ».
 *
 * `joursInactivite` est renseigné sur **100 %** des prospections de vente et
 * c'est le critère de tri des relances du logiciel de bureau : il ne mérite
 * aucun affichage conditionnel. Le seul cas d'absence est celui du bloc
 * `activite` entier, traité par `ResumeActivite`. */
export function InactiviteBadge({ jours }: { jours: number }) {
  return (
    <Badge tone={toneInactivite(jours)}>
      {jours <= 0 ? "Action aujourd'hui" : `${jours} j sans action`}
    </Badge>
  );
}

/** Bandeau de conversion.
 *
 * `dossierId` n'est renseigné que sur **2 %** des prospections — mais c'est
 * précisément parce qu'il est rare qu'il mérite un bandeau plutôt qu'une ligne
 * de plus dans une grille (guide §1 rang 3). Les 98 % restants ne sont pas une
 * donnée manquante : c'est le taux de conversion réel, 358 dossiers pour
 * 14 118 prospections. D'où le rendu `null` pur, sans « aucun dossier ». */
export function DossierIssuBanner({
  dossierId,
  dossierCode,
  statutDossier,
}: {
  dossierId?: string | null;
  dossierCode?: string | null;
  statutDossier?: string | null;
}) {
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

/** Le résumé d'activité en **une ligne** au-dessus du journal des actions
 * (rangs 2 à 4 du guide : relance, visites, contexte), suivi de l'action la
 * plus fréquente de l'onglet. Le rang 1 (`joursInactivite`) est dans la ligne
 * d'identité, le nombre d'interactions sur l'onglet.
 *
 * Doublons stricts écartés, et seulement quand ils le sont : « Dernier
 * échange » s'il redit la note de la 1re ligne du journal, « Projet » s'il
 * redit la tranche. Les chaînes vides sont déjà normalisées en `null` par le
 * backend. */
export function ResumeActivite({
  activite,
  tranche,
  premiereNote,
  action,
}: {
  activite?: ActiviteProspectionDto | null;
  /** Libellé de la tranche de la fiche, pour écarter un « Projet » identique. */
  tranche?: string | null;
  /** Note de la ligne la plus récente du journal affiché, s'il est chargé. */
  premiereNote?: string | null;
  action?: ReactNode;
}) {
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
        {/* Un compteur à zéro dit bien « aucune visite » ici : le bloc existe (guide §2.2). */}
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
        {/* 2,7 % seulement : jamais de « CIN — » sur les autres fiches. */}
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
