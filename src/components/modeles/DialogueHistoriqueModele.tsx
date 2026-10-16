import { useState } from 'react';
import { History } from 'lucide-react';
import Modal from '../Modal';
import { Badge, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { listVersionsModele } from '../../lib/apiModeles';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';

/** Versions d'un modèle, la plus récente d'abord ; « Restaurer » recopie la version en nouvelle version courante. */
export default function DialogueHistoriqueModele({
  modeleId,
  onRestaurer,
  onClose,
}: Readonly<{
  modeleId: UUID;
  onRestaurer: (numero: number) => Promise<void>;
  onClose: () => void;
}>) {
  const { data, loading, error } = useApi(() => listVersionsModele(modeleId), [modeleId]);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function restaurer(numero: number) {
    setEnCours(numero);
    setErreur(null);
    try {
      await onRestaurer(numero);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la restauration.');
      setEnCours(null);
    }
  }

  return (
    <Modal title="Historique des versions" onClose={onClose} width={520}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && data.length === 0 && <EmptyState title="Aucune version" message="Ce modèle n'a pas encore été enregistré." />}
      {!error && data && data.length > 0 && (
        <ul className="flex max-h-96 flex-col divide-y divide-border overflow-auto rounded-lg border border-border">
          {data.map((v) => (
            <li key={v.numero} className="flex items-center justify-between gap-2 px-3 py-1.5">
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-body font-medium text-foreground">
                  Version {v.numero}
                  {v.courante && <Badge tone="success">Courante</Badge>}
                </span>
                <span className="block truncate text-micro text-muted-foreground">
                  {formatDateTime(v.creeLe)}
                  {v.creePar ? ` · ${v.creePar}` : ''}
                </span>
              </span>
              {!v.courante && (
                <Button type="button" variant="outline" size="sm" disabled={enCours !== null} onClick={() => void restaurer(v.numero)}>
                  <History data-icon="inline-start" /> {enCours === v.numero ? 'Restauration…' : 'Restaurer'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {erreur && <p role="alert" className="mt-2 text-body text-destructive">{erreur}</p>}
    </Modal>
  );
}
