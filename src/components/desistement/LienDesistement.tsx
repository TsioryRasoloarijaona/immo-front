import { Link } from 'react-router-dom';
import { Badge } from '../ui';
import { ETATS_DESISTEMENT, useDesistementDuDossier } from '../../lib/desistements';

/** Rien tant qu'il n'y a pas de désistement : l'onglet garde alors sa forme actuelle. */
export default function LienDesistement({ dossierId }: Readonly<{ dossierId: string }>) {
  const { data: d } = useDesistementDuDossier(dossierId);
  if (!d) return null;
  const etat = ETATS_DESISTEMENT[d.etat];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-body">
      <span className="text-muted-foreground">Désistement</span>
      <Link to={`/desistements/${d.id}`} className="font-medium text-foreground hover:underline">
        {d.code ?? 'Ouvrir la fiche'}
      </Link>
      <Badge tone={etat.tone}>{etat.libelle}</Badge>
    </div>
  );
}
