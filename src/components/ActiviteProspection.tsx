import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Badge, Card, Field, FieldGrid } from './ui';
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
 * `activite` entier, traité par `ActiviteCard`. */
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

/** Rangs 2 à 4 du guide : relance, parcours, contexte. Le rang 1
 * (`joursInactivite`, `nbInteractions`) vit dans l'en-tête de la fiche, où il
 * est toujours visible, et le lien de conversion dans `DossierIssuBanner`.
 *
 * Les chaînes vides des cinq colonnes légataires concernées sont déjà
 * normalisées en `null` par le backend, verrouillé par un test (guide §2.3) :
 * un simple test de nullité suffit ici, inutile de re-tester `=== ''`. */
export function ActiviteCard({
  activite,
  accent,
}: {
  activite?: ActiviteProspectionDto | null;
  accent?: string;
}) {
  if (!activite) {
    return (
      <Card title="Activité" accent={accent}>
        <p className="text-label leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Indicateurs non disponibles</span> pour cette
          fiche. Ils proviennent d'une vue de la base légataire qui ne couvre ni les
          pré-prospections, ni les prospections créées depuis cette application. Ce n'est pas une
          absence d'activité — le journal des actions reste la source.
        </p>
      </Card>
    );
  }

  const a = activite;
  const nbVisites = a.nbVisites ?? 0;

  return (
    <Card title="Activité" accent={accent}>
      <FieldGrid>
        <Field label="Dernière action" value={a.derniereActionDate ? formatDateTime(a.derniereActionDate) : undefined} />
        <Field
          label="Dernière communication"
          value={a.derniereCommunicationDate ? formatDateTime(a.derniereCommunicationDate) : undefined}
        />
        <Field
          label="Résultat"
          value={a.derniereCommunicationResultat ? <Badge tone="neutral">{a.derniereCommunicationResultat}</Badge> : undefined}
        />
      </FieldGrid>

      {a.derniereCommunicationMessage && (
        <div className="mt-3">
          <div className="mb-1.5 text-micro font-medium text-muted-foreground">Dernier échange</div>
          <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-label leading-relaxed text-foreground">
            {a.derniereCommunicationMessage}
          </div>
        </div>
      )}

      {/* Bloc masqué en entier plutôt qu'une ligne « Aucune relance » : il ne
          concerne qu'un quart des fiches (guide §1 rang 2), et une grille de
          tirets sur les trois autres quarts noie ce qui compte. */}
      {a.alerteActiveDate && (
        <div className="mt-3 rounded-md border border-(--amber-border) bg-(--amber-bg) px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-(--amber)">
            <span className="font-semibold">Relance en cours</span>
            <span>· échéance {formatDate(a.alerteActiveDate)}</span>
          </div>
          {a.alerteActiveRaison && <div className="mt-1 text-label text-foreground">{a.alerteActiveRaison}</div>}
        </div>
      )}

      <div className="mt-3 border-t border-border pt-3">
        {nbVisites > 0 ? (
          <FieldGrid>
            <Field label="Visites" value={`${nbVisites}`} />
            <Field label="Première visite" value={a.premiereVisiteDate ? formatDate(a.premiereVisiteDate) : undefined} />
            <Field label="Dernière visite" value={a.derniereVisiteDate ? formatDate(a.derniereVisiteDate) : undefined} />
          </FieldGrid>
        ) : (
          /* Ici le bloc `activite` existe : un compteur à zéro veut bien dire
             « aucune visite », contrairement à son absence (guide §2.2). */
          <p className="text-label text-muted-foreground">Aucune visite enregistrée.</p>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <FieldGrid>
          {/* 99 % — la fiche n'exposait jusqu'ici que la tranche. */}
          <Field label="Projet" value={a.projetLibelle || a.projetCode} />
          <Field label="CIN" value={a.cin} />
        </FieldGrid>
      </div>
    </Card>
  );
}
