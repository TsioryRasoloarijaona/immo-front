import { Link } from 'react-router-dom';
import type { OffreDeDepart } from '../../lib/offreDossier';

/** Haut du formulaire Nouveau dossier ouvert depuis une offre (`?offre=`) : d'où vient le préremplissage. */
export default function BandeauOffreDepart({ offre, demandee }: Readonly<{ offre: OffreDeDepart; demandee: boolean }>) {
  if (!demandee) return null;
  if (offre.erreur) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-label text-destructive">
        Offre illisible ({offre.erreur}) : le formulaire n'est pas prérempli depuis elle.
      </div>
    );
  }
  const devis = offre.devis;
  if (!devis) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-2">
      <span className="text-label font-medium text-foreground">
        Prérempli depuis l'offre{' '}
        <Link to={`/offres/${devis.id}`} className="text-(--info) hover:underline">
          {devis.code ?? devis.id}
        </Link>
      </span>
      <span className="text-micro text-muted-foreground">
        Relisez puis enregistrez : rien n'est créé avant « Créer le dossier ».
      </span>
    </div>
  );
}
