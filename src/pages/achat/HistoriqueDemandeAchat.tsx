import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { getHistoriqueDemandeAchat } from '../../lib/apiDemandesAchat';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';

/** Historique des changements de statut d'une demande d'achat. */
export default function HistoriqueDemandeAchat({ id, onFermer }: Readonly<{ id: string; onFermer: () => void }>) {
  const historique = useApi(() => getHistoriqueDemandeAchat(id), [id]);
  const lignes = historique.data ?? [];
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historique</DialogTitle>
        </DialogHeader>
        {historique.error && <ErrorState message={historique.error} />}
        {!historique.error && !historique.data && <LoadingState />}
        {!historique.error && historique.data && lignes.length === 0 && <EmptyState title="Aucun historique" />}
        {!historique.error && lignes.length > 0 && (
          <table className="w-full text-body">
            <thead>
              <tr className="text-left text-micro text-muted-foreground">
                <th className="px-1.5 py-1">Date</th>
                <th className="px-1.5 py-1">Utilisateur</th>
                <th className="px-1.5 py-1">Statut</th>
                <th className="px-1.5 py-1">Notes</th>
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
      </DialogContent>
    </Dialog>
  );
}
