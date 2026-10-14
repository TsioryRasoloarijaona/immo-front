import { useState } from 'react';
import { Ban, ClipboardCheck, Download, Eye, Paperclip } from 'lucide-react';
import { Badge } from '../../ui';
import { Button } from '../../ui/button';
import { PointerReglementModal, ReglementPiecesJointesPanel } from '../../ReglementPreuves';
import { messageErreurStatut } from '../../../lib/reglementRegles';
import { encaissementEtatLabel, encaissementEtatTone, reglementModifiable } from '../../../lib/domain';
import { formatCurrency, formatDate } from '../../../lib/format';
import {
  downloadAutorisationVersement,
  downloadRecuReglement,
  listEcheanceReglements,
  modifierStatutReglement,
  viewAutorisationVersement,
  viewRecuReglement,
} from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import { useConfirm } from '../../../lib/confirmContext';
import type { ReglementDto } from '../../../types';

function ReglementRecuButton({ dossierId, reglementId }: Readonly<{ dossierId: string; reglementId: string }>) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: 'view' | 'download') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await viewRecuReglement(dossierId, reglementId);
      else await downloadRecuReglement(dossierId, reglementId, `recu-${reglementId}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {error && <span className="text-micro text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon-xs" title="Voir le reçu" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Télécharger le reçu" disabled={!!busy} onClick={() => handle('download')}>
        <Download />
      </Button>
    </span>
  );
}

// Par règlement et non par échéance : compte, mode de versement et tiers payeur vivent sur le règlement.
function AutorisationVersementButton({ dossierId, reglementId }: Readonly<{ dossierId: string; reglementId: string }>) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: 'view' | 'download') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await viewAutorisationVersement(dossierId, reglementId);
      else await downloadAutorisationVersement(dossierId, reglementId, `autorisation-versement-${reglementId}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {error && <span className="text-micro text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon-xs" title="Voir l'autorisation d'encaissement" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Télécharger l'autorisation d'encaissement" disabled={!!busy} onClick={() => handle('download')}>
        <Download />
      </Button>
    </span>
  );
}

const REGLEMENT_ROW_TONE: Record<string, { wrap: string; montant: string }> = {
  success: { wrap: 'border-(--success-border) bg-(--success-bg)', montant: 'text-(--success)' },
  info: { wrap: 'border-(--info-border) bg-(--info-bg)', montant: 'text-foreground' },
  neutral: { wrap: 'border-border bg-muted/30', montant: 'text-muted-foreground line-through' },
};

function ReglementRow({
  dossierId,
  reglement,
  onChanged,
}: Readonly<{
  dossierId: string;
  reglement: ReglementDto;
  onChanged: () => Promise<void>;
}>) {
  const [piecesOuvertes, setPiecesOuvertes] = useState(false);
  const [piecesVersion, setPiecesVersion] = useState(0);
  const [pointageOuvert, setPointageOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const tone = encaissementEtatTone(reglement.statut);
  const rowTone = REGLEMENT_ROW_TONE[tone] ?? REGLEMENT_ROW_TONE.neutral;
  const modifiable = reglementModifiable(reglement.statut);

  async function annuler() {
    const ok = await confirm({
      title: 'Annuler le règlement',
      message: `Annuler définitivement ce règlement de ${formatCurrency(reglement.montant)} ? Cet état est terminal : il ne pourra plus être pointé.`,
      confirmLabel: 'Annuler le règlement',
      cancelLabel: 'Revenir',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await modifierStatutReglement(dossierId, reglement.id, { statut: 'CANCELED' });
      await onChanged();
    } catch (err) {
      setError(messageErreurStatut(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-body ${rowTone.wrap}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <Badge tone={tone}>{encaissementEtatLabel(reglement.statut)}</Badge>
        <span className="font-medium text-foreground">{reglement.typeLibelle || '—'}</span>
        {reglement.banqueNom && <span className="text-muted-foreground">{reglement.banqueNom}</span>}
        {reglement.reference && <span className="text-muted-foreground">Réf. {reglement.reference}</span>}
        {reglement.payeurNom && <span className="text-muted-foreground">Payeur : {reglement.payeurNom}</span>}
        <span className="text-muted-foreground">
          Échéance {formatDate(reglement.dateEcheance)}
          {reglement.dateReglement ? ` · Encaissé le ${formatDate(reglement.dateReglement)}` : ''}
        </span>
        {reglement.notes && <span className="text-muted-foreground italic">{reglement.notes}</span>}
        <span className={`ml-auto font-semibold tabular-nums ${rowTone.montant}`}>{formatCurrency(reglement.montant)}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Preuves de paiement"
          aria-expanded={piecesOuvertes}
          onClick={() => setPiecesOuvertes((o) => !o)}
        >
          <Paperclip />
        </Button>
        <ReglementRecuButton dossierId={dossierId} reglementId={reglement.id} />
        <AutorisationVersementButton dossierId={dossierId} reglementId={reglement.id} />
        {modifiable && (
          <>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setPointageOuvert(true)}>
              <ClipboardCheck data-icon="inline-start" /> Pointer
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={annuler}>
              <Ban data-icon="inline-start" /> Annuler
            </Button>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-micro text-destructive">{error}</p>}
      {piecesOuvertes && (
        <ReglementPiecesJointesPanel
          dossierId={dossierId}
          reglementId={reglement.id}
          statut={reglement.statut}
          refreshKey={piecesVersion}
          onChanged={() => setPiecesVersion((v) => v + 1)}
        />
      )}
      {pointageOuvert && (
        <PointerReglementModal
          dossierId={dossierId}
          reglement={reglement}
          onClose={() => setPointageOuvert(false)}
          onPointed={onChanged}
        />
      )}
    </div>
  );
}

export default function HistoriqueReglementsEcheance({
  dossierId,
  echeanceId,
  refreshKey,
  onChanged,
}: Readonly<{
  dossierId: string;
  echeanceId: string;
  refreshKey: number;
  onChanged: () => Promise<void>;
}>) {
  const { data, loading, error } = useApi(() => listEcheanceReglements(dossierId, echeanceId), [dossierId, echeanceId, refreshKey]);

  if (loading) return <span className="text-body text-muted-foreground">Chargement…</span>;
  if (error) return <span className="text-body text-destructive">{error}</span>;
  if (data && data.length === 0) return <span className="text-body text-muted-foreground">Aucun règlement enregistré.</span>;

  return (
    <div className="flex flex-col gap-1">
      {data?.map((r) => (
        <ReglementRow key={r.id} dossierId={dossierId} reglement={r} onChanged={onChanged} />
      ))}
    </div>
  );
}
