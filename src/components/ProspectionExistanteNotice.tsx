import { ArrowUpRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/format';
import type { ProspectionExistanteDto } from '../types';

/** Le 409 « un prospect, un projet, une prospection »
 * (`FEATURE-doublons-prospect-projet.md` §3), rendu comme une redirection et
 * non comme une erreur : le prospect a déjà une prospection **ouverte** sur
 * ce projet, et c'est là qu'on ajoute un dossier. Le lien est la seule action
 * utile — il n'y a rien à corriger dans le formulaire.
 *
 * Ton `info`, pas `destructive` : l'utilisateur n'a rien fait de faux, le
 * système lui montre où est déjà son travail. `message` est le `detail` du
 * ProblemDetail, qui nomme le prospect et le projet en clair. */
export default function ProspectionExistanteNotice({
  existante,
  message,
  onOuvrir,
}: {
  existante: ProspectionExistanteDto;
  message?: string | null;
  /** Appelé au clic du lien, pour fermer la boîte qui porte l'avis. */
  onOuvrir?: () => void;
}) {
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
          <Link
            to={`/prospections/${existante.id}`}
            onClick={onOuvrir}
            className="inline-flex items-center gap-1 text-body font-semibold text-foreground underline-offset-2 hover:underline"
          >
            Ouvrir la prospection {existante.code || ''}
            <ArrowUpRight aria-hidden className="size-2.5 text-muted-foreground" />
          </Link>
          {details.length > 0 && <span className="text-label text-muted-foreground">{details.join(' · ')}</span>}
        </div>
      </div>
    </div>
  );
}
