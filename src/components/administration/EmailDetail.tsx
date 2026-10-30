import { ErrorState, Field, FieldGrid, LoadingState } from '../ui';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import { getEmail } from '../../lib/apiAdministration';
import { libelleOuiNon } from '../../lib/emailHistorique';
import { BadgeEnvoye } from './EmailTable';

export default function EmailDetail({ id }: Readonly<{ id: string }>) {
  const { data, loading, error } = useApi(() => getEmail(id), [id], 'admin-email');
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <>
          <FieldGrid>
            <Field label="Date" value={formatDateTime(data.date)} />
            <Field label="Utilisateur" value={data.utilisateur} />
            <Field label="Expéditeur" value={data.expediteur} />
            <Field label="Destinataires" value={data.destinataires} />
            <Field label="Copie" value={data.copie} />
            <Field label="Copie cachée" value={data.copieCachee} />
            <Field label="Objet" value={data.objet} />
            <Field label="Libellé de l'objet" value={data.libelleObjet} />
            <Field label="Automatique" value={libelleOuiNon(data.automatique)} />
            <Field label="Envoyé" value={<BadgeEnvoye envoye={data.envoye} />} />
          </FieldGrid>
          {data.erreur && (
            <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-body text-destructive">
              <p className="text-micro font-medium">Erreur</p>
              <p className="break-words whitespace-pre-wrap">{data.erreur}</p>
            </div>
          )}
          <div>
            <p className="mb-1 text-micro font-medium text-muted-foreground">
              Corps{data.html ? ' · Contenu HTML affiché en texte' : ''}
            </p>
            <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted/30 p-2.5 font-mono text-body break-words whitespace-pre-wrap">
              {data.corps ?? ''}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
