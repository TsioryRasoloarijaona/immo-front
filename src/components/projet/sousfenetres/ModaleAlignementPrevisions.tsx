import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { getAlignementPrevisions, proposerAlignement } from '../../../lib/apiProjet';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../../../lib/format';
import { errorMessage, useApi } from '../../../lib/useApi';
import { cn } from '../../../lib/utils';
import type { AlignementPrevisionsDto, ModeAlignement, PropositionPointsDto } from '../../../types/projet';
import BarreIcones from '../../BarreIcones';
import Modal from '../../Modal';
import { ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';

function Ecart({ libelle, texte, valeur }: Readonly<{ libelle: string; texte: string; valeur: number }>) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{libelle}</dt>
      <dd className={cn('tabular-nums', valeur >= 0 ? 'text-green-600' : 'text-red-600')}>{texte}</dd>
    </div>
  );
}

function Choix({ lotId, alignement, onValide, onClose }: Readonly<{ lotId: string; alignement: AlignementPrevisionsDto; onValide: (p: PropositionPointsDto) => void; onClose: () => void }>) {
  const [mode, setMode] = useState<ModeAlignement>('INCHANGEE');
  const [dateFin, setDateFin] = useState(alignement.finActuelle?.slice(0, 10) ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function valider() {
    setEnvoi(true);
    setErreur(null);
    try {
      onValide(await proposerAlignement(lotId,{ mode, dateFin: mode === 'FIXEE' ? dateFin : null }));
    } catch (err: unknown) {
      setErreur(errorMessage(err));
      setEnvoi(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={envoi || (mode === 'FIXEE' && !dateFin)} onClick={() => void valider()}><Check /> Valider</Button>
        <Button type="button" variant="ghost" size="sm" disabled={envoi} onClick={onClose}><X /> Annuler</Button>
      </BarreIcones>
      <dl className="flex flex-col gap-1 text-body">
        <Ecart libelle="Différence du Montant:" texte={formatCurrency(alignement.ecartMontant)} valeur={alignement.ecartMontant} />
        <Ecart libelle="Différence d'avancement:" texte={formatPercent(alignement.ecartAvancement)} valeur={alignement.ecartAvancement} />
        <Ecart libelle="Différence du temps(en jours):" texte={formatNumber(alignement.ecartJours)} valeur={alignement.ecartJours} />
      </dl>
      <fieldset className="flex flex-col gap-2 text-body">
        <label className="flex items-center gap-2">
          <input type="radio" name="mode-alignement" checked={mode === 'INCHANGEE'} onChange={() => setMode('INCHANGEE')} />
          Laisser la date fin inchangé.
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode-alignement" checked={mode === 'FIXEE'} onChange={() => setMode('FIXEE')} />
          changer la date fin en :
          <input type="date" aria-label="Nouvelle date de fin" disabled={mode !== 'FIXEE'} value={dateFin} onChange={(e) => setDateFin(e.target.value)}
            className="h-7 rounded-sm border border-input bg-transparent px-2 text-body disabled:opacity-70" />
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode-alignement" checked={mode === 'SYSTEME'} onChange={() => setMode('SYSTEME')} />
          Date fin proposé par le système. <span className="tabular-nums text-muted-foreground">{formatDate(alignement.finSysteme)}</span>
        </label>
      </fieldset>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
    </div>
  );
}

/** « Aligner les prévisions au réel » : écarts prévu / réel et choix de la date de fin ; Valider renvoie la grille proposée. */
export default function ModaleAlignementPrevisions({ lotId, onValide, onClose }: Readonly<{ lotId: string; onValide: (p: PropositionPointsDto) => void; onClose: () => void }>) {
  const { data, loading, error } = useApi(() => getAlignementPrevisions(lotId), [lotId]);
  return (
    <Modal title="Aligner les prévisions au réel" onClose={onClose} width={520}>
      {error && <ErrorState message={error} />}
      {!error && !data && loading && <LoadingState />}
      {!error && data && <Choix lotId={lotId} alignement={data} onValide={onValide} onClose={onClose} />}
    </Modal>
  );
}
