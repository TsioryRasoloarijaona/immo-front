import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Lock, Save, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ErrorState, LoadingState } from '../../ui';
import { creerPieceLot, getPieceLot, modifierPieceLot, supprimerPieceLot } from '../../../lib/apiProjet';
import { useConfirm } from '../../../lib/confirmContext';
import { formatCurrency, todayISO } from '../../../lib/format';
import { etatDepuis, TITRES_PIECE_LOT, validerPiece, versSaisie, type EtatPieceLot, type PieceOuverte } from '../../../lib/saisiePieceLot';
import { useConfirmationSortie } from '../../../lib/useConfirmationSortie';
import { errorMessage, refetchAllApis, useApi } from '../../../lib/useApi';
import type { PieceLotDetailDto, PieceLotModeleDto } from '../../../types/projet';

interface Props {
  lotId: string;
  piece: PieceOuverte;
  onRetour: () => void;
  onModifie?: (modifie: boolean) => void;
}

function Champ({ libelle, children }: Readonly<{ libelle: string; children: ReactNode }>) {
  return (
    <label className="flex flex-col gap-0.5 text-micro text-muted-foreground">
      {libelle}
      {children}
    </label>
  );
}

function etatInitial(source: PieceLotModeleDto | PieceLotDetailDto): EtatPieceLot {
  const etat = etatDepuis(source);
  return 'id' in source ? etat : { ...etat, date: etat.date || todayISO() };
}

function Editeur({ lotId, piece, detail, onRetour, onModifie }: Readonly<Props & { detail: PieceLotDetailDto | null }>) {
  const confirm = useConfirm();
  const source = detail ?? piece.modele;
  const [etat, setEtat] = useState<EtatPieceLot | null>(() => (source ? etatInitial(source) : null));
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const lectureSeule = detail !== null && !detail.modifiable;

  useConfirmationSortie(modifie);
  useEffect(() => onModifie?.(modifie), [modifie, onModifie]);

  if (!source || !etat) return null;

  function muter(patch: Partial<EtatPieceLot>) {
    setEtat((e) => (e ? { ...e, ...patch } : e));
    setModifie(true);
    setErreur(null);
  }

  async function retour() {
    if (modifie && !(await confirm({ title: 'Abandonner les modifications ?', message: 'Les modifications non enregistrées de cette fiche seront perdues.', confirmLabel: 'Abandonner' }))) return;
    onRetour();
  }

  async function ecrire(action: () => Promise<unknown>) {
    setEnCours(true);
    setErreur(null);
    try {
      await action();
      refetchAllApis();
      setModifie(false);
      onRetour();
    } catch (err: unknown) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrer() {
    const invalide = etat ? validerPiece(etat) : null;
    if (invalide || !etat) {
      setErreur(invalide);
      return;
    }
    await ecrire(() => (detail ? modifierPieceLot(lotId, detail.id, versSaisie(etat, piece.nature, false)) : creerPieceLot(lotId, versSaisie(etat, piece.nature, true))));
  }

  async function supprimer() {
    if (detail && (await confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?'))) await ecrire(() => supprimerPieceLot(lotId, detail.id));
  }

  const reference = detail?.reference ?? piece.modele?.reference ?? '';
  const maximum = piece.modele?.montantMaximum ?? null;

  return (
    <div className="flex flex-col gap-3">
      <BarreIcones className="flex items-center gap-1">
        {!lectureSeule && (
          <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void enregistrer()}>
            <Save /> Enregistrer
          </Button>
        )}
        {detail?.supprimable && (
          <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void supprimer()}>
            <Trash2 /> Supprimer
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => void retour()}>
          <ArrowLeft /> Retour à la liste
        </Button>
      </BarreIcones>
      <h3 className="text-body font-semibold">{TITRES_PIECE_LOT[piece.nature]}</h3>
      {erreur && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-body text-destructive">
          {erreur}
        </div>
      )}
      {lectureSeule && (
        <p className="flex items-center gap-1 text-body text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> Pièce {detail.statut ? `« ${detail.statut} » ` : ''}: non modifiable.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Champ libelle="Code">
          <Input readOnly value={detail?.code ?? ''} placeholder="Attribué à l'enregistrement" />
        </Champ>
        <Champ libelle="Référence">
          <Input readOnly value={reference} />
        </Champ>
        <Champ libelle="Fournisseur">
          <Input readOnly value={detail?.fournisseur ?? piece.modele?.fournisseur ?? ''} />
        </Champ>
        <Champ libelle="Date">
          <Input type="date" disabled={lectureSeule} value={etat.date} onChange={(e) => muter({ date: e.target.value })} />
        </Champ>
        <Champ libelle="Échéance">
          <Input type="date" disabled={lectureSeule} value={etat.echeance} onChange={(e) => muter({ echeance: e.target.value })} />
        </Champ>
        <Champ libelle={maximum === null ? 'Montant TTC' : `Montant TTC (Reste : ${formatCurrency(maximum)})`}>
          <Input type="number" step="0.01" disabled={lectureSeule} value={etat.montantTTC} onChange={(e) => muter({ montantTTC: e.target.value })} />
        </Champ>
        {piece.nature === 'MARKET_WARRANTY' && (
          <Champ libelle="Pénalité sur retenue de garantie">
            <Input type="number" step="0.01" disabled={lectureSeule} value={etat.penaliteRg} onChange={(e) => muter({ penaliteRg: e.target.value })} />
          </Champ>
        )}
        <Champ libelle="Notes">
          <Input disabled={lectureSeule} value={etat.notes} onChange={(e) => muter({ notes: e.target.value })} />
        </Champ>
      </div>
      {detail && (
        <dl className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-body">
          {(
            [
              ['Montant HT', detail.montantHT],
              ['TVA', detail.montantTVA],
            ] as const
          ).map(([libelle, valeur]) => (
            <div key={libelle} className="flex gap-2">
              <dt className="text-muted-foreground">{libelle}</dt>
              <dd className="font-medium">{valeur === null ? '—' : formatCurrency(valeur)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Fiche d'une pièce à payer du lot (avance, remboursement de RG ou de prorata) ; remplace la liste dans la modale. */
export default function FichePieceLot(props: Readonly<Props>) {
  const { lotId, piece } = props;
  const detail = useApi<PieceLotDetailDto | null>(() => (piece.id ? getPieceLot(lotId, piece.id) : Promise.resolve(null)), [lotId, piece.id]);
  if (detail.error) {
    return (
      <div className="flex flex-col gap-3">
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={props.onRetour}>
            <ArrowLeft /> Retour à la liste
          </Button>
        </BarreIcones>
        <ErrorState message={detail.error} />
      </div>
    );
  }
  if (piece.id && !detail.data) return <LoadingState />;
  return <Editeur {...props} detail={detail.data} />;
}
