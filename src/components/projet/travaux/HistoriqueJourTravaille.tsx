import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { getHistoriqueJourTravaille } from '../../../lib/apiTravauxChantier';
import { formatDateTime } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';

/** Panneau « Historique » d'un jour travaillé (lignes StrHistory, la plus récente en tête). */
export default function HistoriqueJourTravaille({ id, version }: Readonly<{ id: string; version: string | null }>) {
  const historique = useApi(() => getHistoriqueJourTravaille(id), [id, version]);
  const lignes = historique.data ?? [];
  return (
    <section className="flex flex-col gap-1" aria-label="Historique">
      <h3 className="text-label font-medium">Historique</h3>
      {historique.error && <ErrorState message={historique.error} />}
      {!historique.error && !historique.data && <LoadingState />}
      {!historique.error && historique.data && lignes.length === 0 && <EmptyState title="Aucun historique" />}
      {!historique.error && lignes.length > 0 && (
        <table className="w-full text-body">
          <thead>
            <tr className="text-left text-micro text-muted-foreground">
              <th className="px-1.5 py-1">Date</th>
              <th className="px-1.5 py-1">Utilisateur</th>
              <th className="px-1.5 py-1">Description</th>
              <th className="px-1.5 py-1">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={`${l.date ?? ''}-${i}`} className="border-t">
                <td className="px-1.5 py-1 whitespace-nowrap">{formatDateTime(l.date)}</td>
                <td className="px-1.5 py-1">{l.utilisateur ?? '—'}</td>
                <td className="px-1.5 py-1">{l.description ?? '—'}</td>
                <td className="px-1.5 py-1">{l.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
