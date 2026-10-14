import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { ajouterCadeau, listCadeaux, modifierCadeau, supprimerCadeau } from '../../../lib/apiDossierSousListes';
import { useAuth } from '../../../lib/auth';
import { useConfirm } from '../../../lib/confirmContext';
import { formatCurrency, formatDate } from '../../../lib/format';
import { gereLesCadeaux } from '../../../lib/roles';
import { useApi } from '../../../lib/useApi';
import { useEcriture } from '../../../lib/useEcriture';
import type { CadeauDto, CadeauRequest } from '../../../types/dossierSousListes';
import CadeauDialog from '../echeancier/CadeauDialog';

function Ligne({
  c,
  gere,
  onModifier,
  onSupprimer,
}: Readonly<{ c: CadeauDto; gere: boolean; onModifier: (c: CadeauDto) => void; onSupprimer: (c: CadeauDto) => void }>) {
  return (
    <TableRow>
      <TableCell className="font-medium">{c.cadeau || 'À choisir'}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(c.prix)}</TableCell>
      <TableCell>{c.raison || '—'}</TableCell>
      <TableCell>{formatDate(c.dateBon)}</TableCell>
      <TableCell>
        {c.livre ? <Badge tone="success">Livré le {formatDate(c.dateLivraison)}</Badge> : <Badge tone="progress">À livrer</Badge>}
      </TableCell>
      <TableCell>{c.cadeauId && !c.disponible && <Badge tone="amber">Hors stock</Badge>}</TableCell>
      <TableCell className="text-right">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Modifier le cadeau" onClick={() => onModifier(c)}>
          <Pencil />
        </Button>
        {gere && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer le cadeau" onClick={() => onSupprimer(c)}>
            <Trash2 />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Onglet Cadeaux : ajout et suppression réservés à l'Administrateur et au Commercial Chef. */
export default function OngletCadeaux({ dossierId }: Readonly<{ dossierId: string }>) {
  const cadeaux = useApi(() => listCadeaux(dossierId), [dossierId], 'dossier-cadeaux');
  const { user } = useAuth();
  const gere = gereLesCadeaux(user);
  const [edition, setEdition] = useState<CadeauDto | 'nouveau' | null>(null);
  const confirm = useConfirm();
  const { occupe, executer } = useEcriture();

  async function enregistrer(corps: CadeauRequest) {
    const cible = edition;
    const ok = await executer(async () => {
      if (cible && cible !== 'nouveau') await modifierCadeau(dossierId, cible.id, corps);
      else await ajouterCadeau(dossierId, corps);
      await cadeaux.refetch();
    }, 'Cadeau enregistré.');
    if (ok) setEdition(null);
  }

  async function supprimer(c: CadeauDto) {
    const ok = await confirm({ message: `Supprimer le cadeau « ${c.cadeau ?? 'à choisir'} » ?`, confirmLabel: 'Supprimer' });
    if (ok) await executer(async () => { await supprimerCadeau(dossierId, c.id); await cadeaux.refetch(); }, 'Cadeau supprimé.');
  }

  const lignes = cadeaux.data ?? [];
  return (
    <div className="flex flex-col gap-2.5 p-3">
      {gere && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setEdition('nouveau')}>
            <Plus data-icon="inline-start" /> Ajouter un cadeau
          </Button>
        </div>
      )}
      {cadeaux.loading && !cadeaux.data && <LoadingState />}
      {cadeaux.error && <ErrorState message={cadeaux.error} />}
      {!cadeaux.error && cadeaux.data && lignes.length === 0 && <EmptyState title="Aucun cadeau sur ce dossier" />}
      {!cadeaux.error && cadeaux.data && lignes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Cadeau</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Date du bon</TableHead>
              <TableHead>Livraison</TableHead>
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((c) => (
              <Ligne key={c.id} c={c} gere={gere} onModifier={setEdition} onSupprimer={(x) => void supprimer(x)} />
            ))}
          </TableBody>
        </Table>
      )}
      {edition && (
        <CadeauDialog
          dossierId={dossierId}
          initial={edition === 'nouveau' ? null : edition}
          raisonModifiable={gere}
          occupe={occupe}
          onValider={enregistrer}
          onFermer={() => setEdition(null)}
        />
      )}
    </div>
  );
}
