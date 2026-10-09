import { ArrowUpRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/format';
import type { ProspectionExistanteDto } from '../types';

const CLASSE_LIEN =
  'inline-flex items-center gap-1 text-body font-semibold text-foreground underline-offset-2 hover:underline';

/** Le 409 « un prospect, un projet, une prospection » rendu comme une redirection,
 * ton `info` et non `destructive` : l'utilisateur n'a rien fait de faux.
 * `message` est le `detail` du ProblemDetail. */
export default function ProspectionExistanteNotice({
  existante,
  message,
  onOuvrir,
  ouvrirEnDialogue,
}: Readonly<{
  existante: ProspectionExistanteDto;
  message?: string | null;
  onOuvrir?: () => void;
  /** Ouvre la fiche existante sans naviguer (remplace le lien et `onOuvrir`). */
  ouvrirEnDialogue?: (id: string) => void;
}>) {
  const details = [
    existante.projetCode && `Projet ${existante.projetCode}`,
    existante.trancheCode && existante.trancheCode !== existante.projetCode && `Tranche ${existante.trancheCode}`,
    existante.etapeLibelle,
    existante.commercialNom,
    existante.dateDocument && formatDate(existante.dateDocument),
  ].filter(Boolean) as string[];

  return (
    <div
      role="status"
      className="rounded-lg border border-(--info-border) bg-(--info-bg) px-3.5 py-3"
    >
      <p className="flex items-start gap-2 text-body font-medium text-(--info)">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {message || 'Ce prospect a déjà une prospection ouverte sur ce projet.'}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pl-5.5">
        <div className="flex flex-col gap-0.5">
          {ouvrirEnDialogue ? (
            <button
              type="button"
              onClick={() => ouvrirEnDialogue(existante.id)}
              className={`${CLASSE_LIEN} text-left`}
            >
              Ouvrir la prospection {existante.code || ''}
              <ArrowUpRight aria-hidden className="size-2.5 text-muted-foreground" />
            </button>
          ) : (
            <Link to={`/prospections/${existante.id}`} onClick={onOuvrir} className={CLASSE_LIEN}>
              Ouvrir la prospection {existante.code || ''}
              <ArrowUpRight aria-hidden className="size-2.5 text-muted-foreground" />
            </Link>
          )}
          {details.length > 0 && <span className="text-label text-muted-foreground">{details.join(' · ')}</span>}
        </div>
      </div>
    </div>
  );
}
