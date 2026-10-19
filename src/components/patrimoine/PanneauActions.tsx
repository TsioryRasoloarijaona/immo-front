import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import AjoutActionDialog from '../dossier/AjoutActionDialog';
import { TableActions } from '../dossier/onglets/OngletActions';
import { creerActionArticle, listActionsArticle } from '../../lib/apiAudit';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';

/** Actions (GEN0005) d'un article, dossiers compris ; saisie réservée à l'Administrateur. */
export default function PanneauActions({ articleId }: Readonly<{ articleId: string }>) {
  const { user } = useAuth();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const actions = useApi(() => listActionsArticle(articleId), [articleId]);

  return (
    <div className="flex flex-col gap-3">
      {estAdministrateur(user) && (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setAjoutOuvert(true)}>
          <Plus data-icon="inline-start" /> Ajouter une action
        </Button>
      )}
      {actions.error && <ErrorState message={actions.error} />}
      {!actions.error && !actions.data && <LoadingState />}
      {!actions.error && actions.data?.length === 0 && (
        <EmptyState title="Aucune action" message="Aucune action n'a encore été saisie sur cet article." />
      )}
      {!actions.error && actions.data && actions.data.length > 0 && <TableActions actions={actions.data} />}
      {ajoutOuvert && (
        <AjoutActionDialog
          enregistrer={(body) => creerActionArticle(articleId, body)}
          onClose={() => setAjoutOuvert(false)}
          onCreated={() => {
            setAjoutOuvert(false);
            void actions.refetch();
          }}
        />
      )}
    </div>
  );
}
