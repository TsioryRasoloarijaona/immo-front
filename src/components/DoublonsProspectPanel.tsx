import { AlertTriangle, ArrowUpRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from './ui';
import { Button } from './ui/button';
import { formatDate } from '../lib/format';
import type { CritereDoublon, ProspectDoublonDto } from '../types';

const CRITERE_LIBELLE: Record<CritereDoublon, string> = {
  NOM: 'Même nom',
  TELEPHONE: 'Même téléphone',
  EMAIL: 'Même email',
};

const TYPE_LIBELLE: Record<string, string> = {
  PRO: 'Prospect',
  PRORNT: 'Prospect location',
  CLI: 'Client',
  CLIRNT: 'Client location',
};

/** Le 409 `doublons` est une question, pas une erreur : ambre et non rouge, les homonymes
 * sont le cas courant. Un `TELEPHONE` ou `EMAIL` (`warning`) pèse plus qu'un `NOM` (`amber`). */
export default function DoublonsProspectPanel({
  doublons,
  libelleChoisir,
  onChoisir,
  onNouveauContact,
  busy,
}: {
  doublons: ProspectDoublonDto[];
  libelleChoisir: string;
  onChoisir: (doublon: ProspectDoublonDto) => void;
  /** Renvoyer la même création avec `ignorerDoublons: true`. */
  onNouveauContact: () => void;
  busy?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label="Fiches existantes correspondant à cette identité"
      className="rounded-lg border border-(--amber-border) bg-(--amber-bg) px-3.5 py-3"
    >
      <p className="flex items-start gap-2 text-body font-medium text-(--amber)">
        <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {doublons.length === 1
          ? 'Une fiche existante correspond à cette identité. Est-ce cette personne ?'
          : `${doublons.length} fiches existantes correspondent à cette identité. Est-ce l'une de ces personnes ?`}
      </p>

      <ul className="mt-2.5 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {doublons.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-md bg-card/70 px-3 py-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  to={`/prospects/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-body font-semibold text-foreground underline-offset-2 hover:underline"
                  title="Ouvrir la fiche dans un nouvel onglet"
                >
                  {d.nom || [d.prenom, d.nomFamille].filter(Boolean).join(' ') || d.raisonSociale || 'Sans nom'}
                  <ArrowUpRight aria-hidden className="size-2.5 text-muted-foreground" />
                </Link>
                {d.code && <span className="text-micro text-muted-foreground">{d.code}</span>}
                {d.type && (
                  <span className="text-micro text-muted-foreground">· {TYPE_LIBELLE[d.type] ?? d.type}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label text-muted-foreground">
                <span>{d.mobile || d.telephone || '—'}</span>
                <span>{d.email || '—'}</span>
                {d.ville && <span>{d.ville}</span>}
                {d.dateCreation && <span>créée le {formatDate(d.dateCreation)}</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {d.criteres.map((c) => (
                  <Badge key={c} tone={c === 'NOM' ? 'amber' : 'warning'}>
                    {CRITERE_LIBELLE[c]}
                  </Badge>
                ))}
              </div>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onChoisir(d)}>
              {libelleChoisir}
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-(--amber-border) pt-3">
        <span className="text-label text-muted-foreground">Aucune de ces fiches n'est la bonne personne ?</span>
        <Button type="button" size="sm" disabled={busy} onClick={onNouveauContact}>
          <UserPlus data-icon="inline-start" /> Nouveau contact
        </Button>
      </div>
    </div>
  );
}
