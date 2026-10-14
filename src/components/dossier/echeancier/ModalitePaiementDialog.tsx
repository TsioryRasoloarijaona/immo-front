import { useState } from 'react';
import { Copy, Plus, Trash2, Wallet } from 'lucide-react';
import Modal from '../../Modal';
import SearchableSelect from '../../SearchableSelect';
import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import {
  ajouterModalitePaiement,
  copierSchemaEnModalite,
  listModalitePaiement,
  supprimerModalitePaiement,
} from '../../../lib/apiDossierSousListes';
import { useConfirm } from '../../../lib/confirmContext';
import { lireMontant } from '../../../lib/dossierSousListes';
import { formatCurrency, formatDate, formatPercent, toApiDateTime, todayISO } from '../../../lib/format';
import { referentielItems, useCategoriesEcheance } from '../../../lib/referentiels';
import { useApi } from '../../../lib/useApi';
import { useEcriture } from '../../../lib/useEcriture';
import type { ModalitePaiementDto } from '../../../types/dossierSousListes';

function AjoutLigne({ dossierId, onAjoute }: Readonly<{ dossierId: string; onAjoute: () => Promise<void> }>) {
  const [date, setDate] = useState(todayISO());
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [montant, setMontant] = useState('');
  const categories = referentielItems(useCategoriesEcheance().data);
  const { occupe, executer } = useEcriture();
  const montantLu = lireMontant(montant);

  async function ajouter() {
    if (!categorieId || montantLu === undefined || !date) return;
    const corps = { date: toApiDateTime(date) ?? date, categorieId, montant: montantLu };
    const ok = await executer(async () => {
      await ajouterModalitePaiement(dossierId, corps);
      await onAjoute();
    });
    if (ok) setMontant('');
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input aria-label="Date" type="date" className="w-36" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="min-w-48 flex-1">
        <SearchableSelect label="Catégorie" items={categories} value={categorieId} onValueChange={setCategorieId} size="sm" />
      </div>
      <Input aria-label="Montant TTC" inputMode="decimal" className="w-36" placeholder="Montant TTC" value={montant} onChange={(e) => setMontant(e.target.value)} />
      <Button type="button" size="sm" disabled={occupe || !categorieId || montantLu === undefined} onClick={() => void ajouter()}>
        <Plus data-icon="inline-start" /> Ajouter
      </Button>
    </div>
  );
}

function Lignes({ lignes, onSupprimer }: Readonly<{ lignes: ModalitePaiementDto[]; onSupprimer: (l: ModalitePaiementDto) => void }>) {
  if (lignes.length === 0) {
    return <EmptyState title="Aucune modalité de paiement" message="Copiez le schéma de financement ou ajoutez une ligne." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead className="text-right">Montant TTC</TableHead>
          <TableHead className="text-right">Montant HT</TableHead>
          <TableHead className="text-right">TVA</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignes.map((l) => (
          <TableRow key={l.id}>
            <TableCell>{formatDate(l.date)}</TableCell>
            <TableCell>{l.categorie || '—'}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(l.montant)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(l.montantHT)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(l.tauxTVA, 2)}</TableCell>
            <TableCell className="text-right">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer la ligne" onClick={() => onSupprimer(l)}>
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Contenu({ dossierId }: Readonly<{ dossierId: string }>) {
  const lignes = useApi(() => listModalitePaiement(dossierId), [dossierId]);
  const confirm = useConfirm();
  const { occupe, executer } = useEcriture();

  async function copier() {
    const ok = await confirm({
      title: 'Copier le schéma de financement',
      message: 'Chaque échéance du schéma devient une ligne de modalité de paiement.',
      confirmLabel: 'Copier',
    });
    if (ok) await executer(async () => { await copierSchemaEnModalite(dossierId); await lignes.refetch(); }, 'Schéma copié.');
  }

  async function supprimer(l: ModalitePaiementDto) {
    const ok = await confirm({ message: `Supprimer la ligne ${l.categorie ?? ''} du ${formatDate(l.date)} ?`, confirmLabel: 'Supprimer' });
    if (ok) await executer(async () => { await supprimerModalitePaiement(dossierId, l.id); await lignes.refetch(); });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" disabled={occupe} onClick={() => void copier()}>
          <Copy data-icon="inline-start" /> Copier le schéma de financement
        </Button>
      </div>
      {lignes.loading && !lignes.data && <LoadingState />}
      {lignes.error && <ErrorState message={lignes.error} />}
      {!lignes.error && lignes.data && <Lignes lignes={lignes.data} onSupprimer={(l) => void supprimer(l)} />}
      <AjoutLigne dossierId={dossierId} onAjoute={lignes.refetch} />
    </div>
  );
}

/** Boîte « Modalité de paiement » : le schéma figé à la vente (`ComDocumentPaymentMethod`). */
export default function ModalitePaiementDialog({ dossierId }: Readonly<{ dossierId: string }>) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOuvert(true)}>
        <Wallet data-icon="inline-start" /> Modalité de paiement
      </Button>
      {ouvert && (
        <Modal title="Modalité de paiement" onClose={() => setOuvert(false)} width={760}>
          <Contenu dossierId={dossierId} />
        </Modal>
      )}
    </>
  );
}
