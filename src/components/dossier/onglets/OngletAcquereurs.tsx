import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Badge, ErrorState, Field, FieldGrid, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { formatPercentValue, formatTelephone } from '../../../lib/format';
import { getClient } from '../../../lib/api';
import { getAcquereurs } from '../../../lib/apiDossierSousListes';
import { useApi } from '../../../lib/useApi';
import type { DossierDetailDto } from '../../../types';
import type { AcquereursDto, ProspectionAArchiverDto } from '../../../types/dossierSousListes';
import AcquereursEdition from '../echeancier/AcquereursEdition';
import ArchivageProspectionsDialog from '../echeancier/ArchivageProspectionsDialog';

// `AcquereurDto.quotePart` est un pourcentage 0–100, `DossierDetailDto.quotePart` une fraction
// (1,00 = 100 %) : même nom, deux échelles, deux formatages.
function ListeAcquereurs({ donnees }: Readonly<{ donnees: AcquereursDto }>) {
  return (
    <div className="flex flex-col gap-2">
      {donnees.acquereurs.map((a) => (
        <div key={a.id ?? a.tiersId ?? 'principal'} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/30 p-2.5">
          <Badge tone={a.principal ? 'info' : 'neutral'}>{a.principal ? 'Principal' : 'Co-acquéreur'}</Badge>
          <span className="min-w-0 truncate text-label font-medium text-foreground">{a.nom || '—'}</span>
          {a.pieceIdentite && <span className="text-body text-muted-foreground">{a.pieceIdentite}</span>}
          <span className="ml-auto text-label font-semibold tabular-nums text-foreground">{formatPercentValue(a.quotePart)}</span>
        </div>
      ))}
      <div className="text-right text-micro text-muted-foreground">Total des parts {formatPercentValue(donnees.total)}</div>
    </div>
  );
}

function AcquereursDossier({ dossierId, onChanged }: Readonly<{ dossierId: string; onChanged: () => Promise<void> }>) {
  const acquereurs = useApi(() => getAcquereurs(dossierId), [dossierId], 'dossier-acquereurs');
  const [edition, setEdition] = useState(false);
  const [aArchiver, setAArchiver] = useState<ProspectionAArchiverDto[]>([]);

  if (acquereurs.loading && !acquereurs.data) return <LoadingState />;
  if (acquereurs.error) return <ErrorState message={acquereurs.error} />;
  if (!acquereurs.data) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-label font-semibold text-foreground">Acquéreurs</h3>
        {!edition && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEdition(true)}>
            <Pencil data-icon="inline-start" /> Modifier la répartition
          </Button>
        )}
      </div>
      {edition ? (
        <AcquereursEdition
          dossierId={dossierId}
          donnees={acquereurs.data}
          onAnnuler={() => setEdition(false)}
          onEnregistre={async (resultat) => {
            setEdition(false);
            setAArchiver(resultat.prospectionsAArchiver);
            await Promise.all([acquereurs.refetch(), onChanged()]);
          }}
        />
      ) : (
        <ListeAcquereurs donnees={acquereurs.data} />
      )}
      {aArchiver.length > 0 && (
        <ArchivageProspectionsDialog dossierId={dossierId} prospections={aArchiver} onFerme={() => setAArchiver([])} />
      )}
    </div>
  );
}

export default function OngletAcquereurs({
  dossier: d,
  onChanged,
}: Readonly<{ dossier: DossierDetailDto; onChanged: () => Promise<void> }>) {
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
        <AcquereursDossier dossierId={d.id} onChanged={onChanged} />
      </div>
    </div>
  );
}
