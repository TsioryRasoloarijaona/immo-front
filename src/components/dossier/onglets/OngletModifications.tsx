import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import {
  ajouterModification,
  getModifications,
  modifierModification,
  supprimerModification,
} from '../../../lib/apiDossierSousListes';
import { useConfirm } from '../../../lib/confirmContext';
import { schemaEquilibre, toneEtatModification } from '../../../lib/dossierSousListes';
import { formatCurrency, formatDate } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { useEcriture } from '../../../lib/useEcriture';
import type { ModificationDto, ModificationRequest, ModificationsDto } from '../../../types/dossierSousListes';
import ModificationDialog from '../echeancier/ModificationDialog';

function Synthese({ m }: Readonly<{ m: ModificationsDto }>) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-micro text-muted-foreground">
      <span>Montant des modifications <b className="tabular-nums text-foreground">{formatCurrency(m.montantTTC)}</b> TTC</span>
      <span><b className="tabular-nums text-foreground">{formatCurrency(m.montantHT)}</b> HT</span>
      <Badge tone={m.integreAuPrix ? 'info' : 'neutral'}>{m.integreAuPrix ? 'Intégré au prix de vente' : 'Hors prix de vente'}</Badge>
      {!m.integreAuPrix && !schemaEquilibre(m.ecartSchema) && (
        <Badge tone="amber">Écart avec le schéma {formatCurrency(m.ecartSchema)}</Badge>
      )}
    </div>
  );
}

function Lignes({
  lignes,
  onModifier,
  onSupprimer,
}: Readonly<{ lignes: ModificationDto[]; onModifier: (m: ModificationDto) => void; onSupprimer: (m: ModificationDto) => void }>) {
  if (lignes.length === 0) return <EmptyState title="Aucune demande de modification" />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Description</TableHead>
          <TableHead>Demande</TableHead>
          <TableHead>État</TableHead>
          <TableHead className="text-right">Coût</TableHead>
          <TableHead className="text-right">Prix HT</TableHead>
          <TableHead className="text-right">Prix TTC</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignes.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="max-w-64 truncate">{m.description || '—'}</TableCell>
            <TableCell>{formatDate(m.dateDemande)}</TableCell>
            <TableCell><Badge tone={toneEtatModification(m.etat)}>{m.etatLibelle || '—'}</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(m.cout)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(m.prixHT)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(m.prixTTC)}</TableCell>
            <TableCell className="text-right">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Modifier la demande" onClick={() => onModifier(m)}>
                <Pencil />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer la demande" onClick={() => onSupprimer(m)}>
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Onglet Modifications : demandes du client ; acceptées ou réalisées, elles alimentent `ModificationsAmount`. */
export default function OngletModifications({ dossierId, onChanged }: Readonly<{ dossierId: string; onChanged: () => Promise<void> }>) {
  const modifications = useApi(() => getModifications(dossierId), [dossierId], 'dossier-modifications');
  // `null` = fermé ; `'nouvelle'` = création ; sinon la demande éditée.
  const [edition, setEdition] = useState<ModificationDto | 'nouvelle' | null>(null);
  const confirm = useConfirm();
  const { occupe, executer } = useEcriture();

  async function relire() {
    await Promise.all([modifications.refetch(), onChanged()]);
  }

  async function enregistrer(corps: ModificationRequest) {
    const cible = edition;
    const ok = await executer(async () => {
      if (cible && cible !== 'nouvelle') await modifierModification(dossierId, cible.id, corps);
      else await ajouterModification(dossierId, corps);
      await relire();
    }, 'Demande enregistrée.');
    if (ok) setEdition(null);
  }

  async function supprimer(m: ModificationDto) {
    const ok = await confirm({ message: `Supprimer la demande « ${m.description ?? ''} » ?`, confirmLabel: 'Supprimer' });
    if (ok) await executer(async () => { await supprimerModification(dossierId, m.id); await relire(); }, 'Demande supprimée.');
  }

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setEdition('nouvelle')}>
          <Plus data-icon="inline-start" /> Nouvelle demande
        </Button>
      </div>
      {modifications.loading && !modifications.data && <LoadingState />}
      {modifications.error && <ErrorState message={modifications.error} />}
      {!modifications.error && modifications.data && (
        <>
          <Synthese m={modifications.data} />
          <Lignes lignes={modifications.data.modifications} onModifier={setEdition} onSupprimer={(m) => void supprimer(m)} />
        </>
      )}
      {edition && (
        <ModificationDialog
          initiale={edition === 'nouvelle' ? null : edition}
          occupe={occupe}
          onValider={enregistrer}
          onFermer={() => setEdition(null)}
        />
      )}
    </div>
  );
}
