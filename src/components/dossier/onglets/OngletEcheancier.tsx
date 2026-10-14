import { ErrorState, LoadingState } from '../../ui';
import { LigneActivite } from '../../FicheShell';
import Pagination from '../../Pagination';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../../ui/table';
import { addEcheance, addReglement } from '../../../lib/api';
import { todayISO } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { DossierDetailDto, EcheanceDto, PageDto } from '../../../types';
import AjoutEcheance from '../echeancier/AjoutEcheance';
import LigneEcheance from '../echeancier/LigneEcheance';

export default function OngletEcheancier({
  dossier: d,
  echeances,
  onPageChange,
  onChanged,
  fromCreation,
}: Readonly<{
  dossier: DossierDetailDto;
  echeances: ApiState<PageDto<EcheanceDto>>;
  onPageChange: (page: number) => void;
  /** Relit l'échéancier et les montants après une écriture. */
  onChanged: () => Promise<void>;
  fromCreation: boolean;
}>) {
  return (
    <div className="flex flex-col gap-2.5 p-3">
      <LigneActivite
        action={
          <AjoutEcheance
            onAdd={async (body) => {
              await addEcheance(d.id, body);
              await onChanged();
            }}
            // Lu au montage seulement : sans données chargées, rester fermé plutôt
            // que proposer une échéance du montant total sur un schéma déjà rempli.
            initialOpen={fromCreation && echeances.data?.totalElements === 0}
            initialMontant={d.totalAPayer ?? d.prix ?? undefined}
            initialDate={todayISO()}
          />
        }
      >
        {echeances.data && echeances.data.content.length === 0 && (
          <span>Aucune ligne dans le schéma de financement pour ce dossier.</span>
        )}
      </LigneActivite>
      {echeances.loading && !echeances.data && <LoadingState />}
      {echeances.error && <ErrorState message={echeances.error} />}
      {echeances.data && echeances.data.content.length > 0 && (
        <div>
          <Table containerClassName="overflow-visible">
            <TableHeader className="sticky top-0 z-1">
              <TableRow className="hover:bg-transparent">
                <TableHead />
                <TableHead>Catégorie</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {echeances.data.content.map((l) => (
                <LigneEcheance
                  key={l.id}
                  dossierId={d.id}
                  echeance={l}
                  onReglementAdded={async (echeanceId, body) => {
                    await addReglement(d.id, echeanceId, body);
                    await onChanged();
                  }}
                  onReglementChanged={onChanged}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {echeances.data && (
        <Pagination
          page={echeances.data.page}
          totalPages={echeances.data.totalPages}
          totalElements={echeances.data.totalElements}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
