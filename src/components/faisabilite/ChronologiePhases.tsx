import { Card } from '../ui';
import { formatDate, texteBrut } from '../../lib/format';
import { PHASES } from '../../lib/faisabilite';
import type { ValeursFaisabilite } from '../../types/faisabilite';

/** Les 7 phases de l'étude dans l'ordre, avec les dates que le serveur vient de calculer. */
export default function ChronologiePhases({ valeurs }: Readonly<{ valeurs: ValeursFaisabilite }>) {
  const lues: Record<string, unknown> = { ...valeurs };
  return (
    <Card title="Chronologie">
      <ol className="flex flex-col gap-2.5 border-l border-border pl-4">
        {PHASES.map(([libelle, cle]) => {
          const duree = texteBrut(lues[`duree${cle}`]);
          return (
            <li key={cle} className="relative text-body">
              <span aria-hidden className="absolute top-1.5 -left-[1.31rem] size-2 rounded-full bg-(--brand)" />
              <span className="font-medium text-foreground">{libelle}</span>
              <span className="ml-2 text-muted-foreground">
                {formatDate(texteBrut(lues[`debut${cle}`]))} → {formatDate(texteBrut(lues[`fin${cle}`]))}
                {duree !== '' && ` (${duree} mois)`}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
