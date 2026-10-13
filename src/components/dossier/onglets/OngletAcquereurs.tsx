import { Badge, ErrorState, Field, FieldGrid, LoadingState } from '../../ui';
import { formatPercentValue, formatTelephone } from '../../../lib/format';
import { getClient, listPayeurs } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import type { DossierDetailDto } from '../../../types';

// `PayeurDto.quotePart` est un pourcentage 0–100, `DossierDetailDto.quotePart` une fraction
// (1,00 = 100 %) : même nom, deux échelles, deux formatages.
function AcquereursDossier({ dossierId }: Readonly<{ dossierId: string }>) {
  const payeurs = useApi(() => listPayeurs(dossierId), [dossierId], 'dossier-payeurs');

  if (payeurs.loading && !payeurs.data) return <LoadingState />;
  if (payeurs.error) return <ErrorState message={payeurs.error} />;
  const lignes = payeurs.data ?? [];
  if (lignes.length === 0) {
    return <p className="text-label text-muted-foreground">Aucun acquéreur enregistré sur ce dossier.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {lignes.map((pa) => (
        <div key={pa.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/30 p-2.5">
          <Badge tone={pa.role === 'ACQUEREUR_PRINCIPAL' ? 'info' : 'neutral'}>
            {pa.role === 'ACQUEREUR_PRINCIPAL' ? 'Principal' : 'Co-acquéreur'}
          </Badge>
          <span className="min-w-0 truncate text-label font-medium text-foreground">{pa.nom || pa.id}</span>
          {pa.pieceIdentite && <span className="text-body text-muted-foreground">{pa.pieceIdentite}</span>}
          {/* Toujours nul sur l'acquéreur principal : pas de tiret, il se lirait
              comme une quote-part manquante. */}
          {typeof pa.quotePart === 'number' && (
            <span className="ml-auto text-label font-semibold tabular-nums text-foreground">{formatPercentValue(pa.quotePart)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OngletAcquereurs({ dossier: d }: Readonly<{ dossier: DossierDetailDto }>) {
  const client = useApi(() => (d.clientId ? getClient(d.clientId) : Promise.resolve(null)), [d.clientId], 'dossier-client');

  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        {client.loading && !client.data && <LoadingState />}
        {client.error && <ErrorState message={client.error} />}
        <FieldGrid>
          <Field label="Nom" value={d.clientNom} />
          <Field label="Commercial" value={d.commercialNom} />
          {/* Acteur distinct du commercial, pas un synonyme. */}
          <Field label="Responsable de vente" value={d.responsableVenteNom} />
          <Field label="Notaire" value={d.avocatNom} />
          {client.data && (
            <>
              <Field
                label="Téléphone"
                value={
                  client.data.telephone
                    ? formatTelephone(client.data.telephone, client.data.indicatifTelephone)
                    : formatTelephone(client.data.mobile, client.data.indicatifMobile)
                }
              />
              <Field label="Email" value={client.data.email} />
              <Field label="Ville" value={client.data.ville} />
              <Field label="Adresse" value={client.data.adresse} />
              <Field label="Type" value={client.data.type} />
            </>
          )}
        </FieldGrid>
      </div>
      <div className="border-t border-border pt-3">
        <AcquereursDossier dossierId={d.id} />
      </div>
    </div>
  );
}
