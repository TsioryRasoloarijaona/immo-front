import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import EtatListe from '../patrimoine/EtatListe';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import DialogueCredit from './DialogueCredit';
import { listFinancementsEtude, remplacerFinancementsEtude } from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { MESSAGE_BLOQUEE } from '../../lib/faisabilite';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { EtudeFaisabiliteDto, FinancementFaisabiliteDto } from '../../types/faisabilite';

const ENTETES = ['Description', 'Date', 'Déblocage', 'Montant à régler', 'Remboursements', 'Périodicité (mois)', 'Grâce (mois)', 'Taux de charge', 'Écart de principal'];

/** Crédits de l'étude : chaque ajout, modification ou retrait envoie la liste complète. */
export default function OngletFinancement({ fiche, onEnregistre }: Readonly<{ fiche: EtudeFaisabiliteDto; onEnregistre: () => void }>) {
  const { user } = useAuth();
  const lecture = !estAdministrateur(user) || fiche.bloquee;
  const confirm = useConfirm();
  const showToast = useToast();
  const [version, setVersion] = useState(0);
  const etat = useApi(() => listFinancementsEtude(fiche.id), [fiche.id, version]);
  const [edition, setEdition] = useState<FinancementFaisabiliteDto | 'nouveau' | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(lignes: FinancementFaisabiliteDto[]) {
    await remplacerFinancementsEtude(fiche.id, lignes);
    setVersion((v) => v + 1);
    showToast('Financement enregistré.');
    onEnregistre();
  }

  async function retirer(credit: FinancementFaisabiliteDto) {
    if (!(await confirm({ title: 'Supprimer le crédit', message: 'Le crédit et ses remboursements seront supprimés. Continuer ?', confirmLabel: 'Supprimer' }))) return;
    setErreur(null);
    try {
      await enregistrer((etat.data ?? []).filter((c) => c.id !== credit.id));
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  function valider(credit: FinancementFaisabiliteDto) {
    const liste = etat.data ?? [];
    return enregistrer(credit.id ? liste.map((c) => (c.id === credit.id ? credit : c)) : [...liste, credit]);
  }

  return (
    <div className="flex flex-col gap-3">
      {fiche.bloquee && <p className="text-micro text-muted-foreground">{MESSAGE_BLOQUEE}</p>}
      {!lecture && (
        <div>
          <Button type="button" size="sm" variant="outline" onClick={() => setEdition('nouveau')}><Plus data-icon="inline-start" /> Ajouter un crédit</Button>
        </div>
      )}
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      <EtatListe etat={etat} vide={{ titre: 'Aucun crédit', message: "Aucun déblocage de crédit n'est saisi pour cette étude." }}>
        {(credits) => (
          <Table>
            <TableHeader>
              <TableRow>
                {ENTETES.map((e) => <TableHead key={e}>{e}</TableHead>)}
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((c) => (
                <TableRow key={c.id ?? c.dateDeblocage}>
                  <TableCell>{c.description || '—'}</TableCell>
                  <TableCell>{formatDate(c.dateDeblocage)}</TableCell>
                  <TableCell>{formatCurrency(c.montant)}</TableCell>
                  <TableCell>{formatCurrency(c.montantARegler)}</TableCell>
                  <TableCell>{formatNumber(c.nombreRemboursements)}</TableCell>
                  <TableCell>{formatNumber(c.periodiciteMois)}</TableCell>
                  <TableCell>{formatNumber(c.periodeGraceMois)}</TableCell>
                  <TableCell>{formatPercent(c.tauxCharge, 2)}</TableCell>
                  <TableCell className={c.ecartBase ? 'font-medium text-amber-600' : undefined}>{formatCurrency(c.ecartBase ?? 0)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={lecture ? 'Voir le crédit' : 'Éditer le crédit'}
                        onClick={() => setEdition(c)}><Pencil /></Button>
                      {!lecture && (
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer le crédit" onClick={() => void retirer(c)}><Trash2 /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </EtatListe>
      {edition && (
        <DialogueCredit etudeId={fiche.id} credit={edition === 'nouveau' ? null : edition} lecture={lecture}
          onValider={valider} onClose={() => setEdition(null)} />
      )}
    </div>
  );
}
