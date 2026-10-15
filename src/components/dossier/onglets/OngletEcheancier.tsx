import { ErrorState, LoadingState } from '../../ui';
import { LigneActivite } from '../../FicheShell';
import Pagination from '../../Pagination';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../../ui/table';
import { useState } from 'react';
import { addEcheance, getReglementsDossier } from '../../../lib/api';
import { getEtatSchema, supprimerEcheance } from '../../../lib/apiDossierSousListes';
import { useAuth } from '../../../lib/auth';
import { useConfirm } from '../../../lib/confirmContext';
import { estAdministrateur } from '../../../lib/roles';
import { arrondiCentime } from '../../../lib/dossierSousListes';
import { formatCurrency, formatDate, todayISO } from '../../../lib/format';
import { useApi, type ApiState } from '../../../lib/useApi';
import { useEcriture } from '../../../lib/useEcriture';
import type { DossierDetailDto, EcheanceDto, PageDto } from '../../../types';
import AjoutEcheance from '../echeancier/AjoutEcheance';
import AjoutReglement from '../echeancier/AjoutReglement';
import ReglementsDossier from '../echeancier/ReglementsDossier';
import EtatSchemaBandeau from '../echeancier/EtatSchemaBandeau';
import GenererPeriodicite from '../echeancier/GenererPeriodicite';
import LigneEcheance from '../echeancier/LigneEcheance';
import ModalitePaiementDialog from '../echeancier/ModalitePaiementDialog';

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
  const etat = useApi(() => getEtatSchema(d.id), [d.id], 'dossier-etat-schema');
  const reglements = useApi(() => getReglementsDossier(d.id), [d.id]);
  const [versionReglements, setVersionReglements] = useState(0);
  const confirm = useConfirm();
  const { executer } = useEcriture();
  const administrateur = estAdministrateur(useAuth().user);

  // Le serveur reporte l'écart sur une autre ligne : l'état du schéma change à chaque écriture.
  async function relire() {
    await Promise.all([onChanged(), etat.refetch(), reglements.refetch()]);
  }

  async function apresReglement() {
    setVersionReglements((v) => v + 1);
    await relire();
  }

  async function supprimer(e: EcheanceDto) {
    const ok = await confirm({
      title: "Supprimer l'échéance",
      message: `${e.categorie ?? 'Échéance'} du ${formatDate(e.dateEcheance)}, ${formatCurrency(e.montant)}. L'écart est reporté sur la dernière ligne d'autofinancement (à défaut, de crédit).`,
      confirmLabel: 'Supprimer',
    });
    if (ok) await executer(async () => { await supprimerEcheance(d.id, e.id); await relire(); }, 'Échéance supprimée.');
  }

  return (
    <div className="flex flex-col gap-2.5 p-3">
      {!etat.error && etat.data && <EtatSchemaBandeau etat={etat.data} />}
      <LigneActivite
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <ModalitePaiementDialog dossierId={d.id} />
            <AjoutReglement dossierId={d.id} variante="entete" onCree={apresReglement} />
            <GenererPeriodicite dossierId={d.id} montantInitial={etat.data?.montantInitialPeriodicite} onGenere={relire} />
            <AjoutEcheance
              onAdd={async (body) => {
                await addEcheance(d.id, body);
                await relire();
              }}
              // Lu au montage seulement : sans données chargées, rester fermé plutôt
              // que proposer une échéance du montant total sur un schéma déjà rempli.
              initialOpen={fromCreation && echeances.data?.totalElements === 0}
              initialMontant={arrondiCentime(d.totalAPayer ?? d.prix)}
              initialDate={todayISO()}
            />
          </div>
        }
      >
        {echeances.data && echeances.data.content.length === 0 && (
          <span>Aucune ligne dans le schéma de financement pour ce dossier.</span>
        )}
      </LigneActivite>
      {echeances.loading && !echeances.data && <LoadingState />}
      {echeances.error && <ErrorState message={echeances.error} />}
      {!echeances.error && echeances.data && echeances.data.content.length > 0 && (
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
                  versionReglements={versionReglements}
                  onReglementAdded={apresReglement}
                  onReglementChanged={relire}
                  onSupprimer={administrateur ? (e) => void supprimer(e) : undefined}
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
      <ReglementsDossier dossierId={d.id} reglements={reglements} onChanged={apresReglement} />
    </div>
  );
}
