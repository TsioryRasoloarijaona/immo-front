import { useState } from 'react';
import { ClipboardCheck, Eye, FileText, Trash2, Upload } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getComptesReferentiel,
  listReglementPiecesJointes,
  modifierStatutReglement,
  openReglementPieceJointeFichier,
  removeReglementPieceJointe,
  uploadReglementPieceJointe,
  urlReglementPieceJointeFichier,
} from '../lib/api';
import { useConfirm } from '../lib/confirmContext';
import { messageErreurStatut, raisonPreuveVerrouillee } from '../lib/reglementRegles';
import { formatCurrency, formatDate, toApiDateTime, todayISO } from '../lib/format';
import { referentielItems } from '../lib/referentiels';
import { useApi } from '../lib/useApi';
import { cn } from '../lib/utils';
import type { PieceJointeDto } from '../types';

/* Partagé par la fiche dossier et la fiche encaissement : ces règles serveur ne
 * doivent exister qu'une fois. Les endpoints sont scopés par dossier, d'où le
 * `dossierId` exigé des deux appelants. */

/** Contrat minimal : `EncaissementDetailDto` nomme autrement les mêmes champs
 * (`montantBrut`, `tierPayeurNom`) de la même ligne `StlSettlement`. */
export type ReglementAPointer = {
  id: string;
  montant?: number | null;
  typeLibelle?: string | null;
  payeurNom?: string | null;
  /** Société du règlement : restreint la liste des comptes ; absente, tous les comptes. */
  societeId?: string | null;
};

/** Ni type ni description obligatoires : les justificatifs réels n'en portent pas. */
export function ReglementPieceUpload({
  dossierId,
  reglementId,
  onAdded,
}: Readonly<{
  dossierId: string;
  reglementId: string;
  onAdded: () => void;
}>) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-8 min-w-0 max-w-60 flex-1 cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-2.5 text-body text-muted-foreground hover:border-ring">
        <Upload className="size-3.5 shrink-0" />
        <span className="truncate">{file ? file.name : 'Choisir un fichier…'}</span>
        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <Input
        placeholder="Légende (ex. Chèque BMCE n° 123)"
        className="min-w-0 flex-1 basis-40"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        disabled={busy || !file}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            await uploadReglementPieceJointe(dossierId, reglementId, file, description.trim() || undefined);
            setFile(null);
            setDescription('');
            onAdded();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'envoi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Envoi…' : 'Déposer'}
      </Button>
      {error && <span className="text-micro text-destructive">{error}</span>}
    </div>
  );
}

/** Consultable quel que soit le statut : un règlement legacy pointé sans pièce
 * reste valide, la règle de preuve ne joue qu'à la transition. */
export function ReglementPiecesJointesPanel({
  dossierId,
  reglementId,
  statut,
  refreshKey,
  onChanged,
}: Readonly<{
  dossierId: string;
  reglementId: string;
  /** Optionnel comme sur ReglementDto : une ligne legacy peut ne pas en porter. */
  statut?: string;
  refreshKey: number;
  onChanged: () => void;
}>) {
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglementId), [dossierId, reglementId, refreshKey]);

  const raisonBlocage = raisonPreuveVerrouillee(statut, pieces.data?.length);

  return (
    <div className="mt-1.5 flex flex-col gap-2 rounded-lg bg-muted/30 px-2.5 py-2">
      <span className="text-micro font-medium text-muted-foreground">Preuves de paiement</span>
      {pieces.loading && <span className="text-micro text-muted-foreground">Chargement…</span>}
      {pieces.error && <span className="text-micro text-destructive">{pieces.error}</span>}
      {pieces.data && pieces.data.length === 0 && (
        <span className="text-micro text-muted-foreground">Aucune preuve déposée.</span>
      )}
      {pieces.data?.map((p) => (
        <ReglementPieceJointeRow
          key={p.id}
          dossierId={dossierId}
          reglementId={reglementId}
          piece={p}
          onDeleted={onChanged}
          raisonBlocage={raisonBlocage}
        />
      ))}
      <ReglementPieceUpload dossierId={dossierId} reglementId={reglementId} onAdded={onChanged} />
    </div>
  );
}

export function ReglementPieceJointeRow({
  dossierId,
  reglementId,
  piece,
  onDeleted,
  raisonBlocage,
  actionsSeules,
}: Readonly<{
  dossierId: string;
  reglementId: string;
  piece: PieceJointeDto;
  onDeleted: () => void;
  /** Renseignée quand la suppression est interdite : motif affiché, bouton désactivé. */
  raisonBlocage?: string;
  /** Les boutons seuls, pour réutiliser la suppression et son garde-fou 409 sans les dupliquer. */
  actionsSeules?: boolean;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'preuve-paiement'}${ext ? '.' + ext : ''}`;

  // Cf. PieceJointeRow : navigation vers le stockage, rien d'asynchrone.
  function handle() {
    setError(null);
    try {
      openReglementPieceJointeFichier(dossierId, reglementId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    }
  }

  // `raisonBlocage` couvre le cas connu ; le 409 reste rattrapé pour les courses
  // (son `detail` est déjà dans `ApiError.message`).
  async function handleDelete() {
    const ok = await confirm({
      title: 'Supprimer la preuve de paiement',
      message: `Supprimer « ${piece.description || filename} » ? Cette suppression est irréversible depuis l’application.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await removeReglementPieceJointe(dossierId, reglementId, piece.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  }

  const actions = (
    <span className={cn('flex shrink-0 items-center gap-0.5', !actionsSeules && 'ml-auto')}>
      <Button type="button" variant="ghost" size="icon-xs" title="Ouvrir la preuve dans un onglet" onClick={handle}>
        <Eye />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title={raisonBlocage ?? 'Supprimer la preuve de paiement'}
        aria-label="Supprimer la preuve de paiement"
        disabled={busy || !!raisonBlocage}
        onClick={handleDelete}
      >
        <Trash2 />
      </Button>
    </span>
  );

  if (actionsSeules) {
    return (
      <>
        {error && <span className="shrink-0 text-micro text-destructive">{error}</span>}
        {actions}
      </>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-micro">
      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate text-foreground">{piece.description || filename}</span>
      {piece.dateCreation && <span className="shrink-0 text-muted-foreground">{formatDate(piece.dateCreation)}</span>}
      {piece.creePar && <span className="shrink-0 text-muted-foreground">{piece.creePar}</span>}
      {error && <span className="shrink-0 text-destructive">{error}</span>}
      {actions}
    </div>
  );
}

/** Comptes de la société du règlement ; le serveur refuse un compte d'une autre société (400). */
function ChampComptePointage({
  societeId,
  value,
  onChange,
}: Readonly<{ societeId?: string | null; value: string | null; onChange: (id: string | null) => void }>) {
  const comptes = useApi(() => getComptesReferentiel(societeId), [societeId]);
  const items = referentielItems(comptes.data ?? []);
  return (
    <FormField>
      <FieldLabel htmlFor="pointage-compte">Compte *</FieldLabel>
      <Select items={items} value={value ?? ''} onValueChange={(v) => onChange(v || null)}>
        <SelectTrigger id="pointage-compte">
          <SelectValue placeholder={comptes.loading ? 'Chargement…' : 'Choisir le compte…'} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {comptes.error && <span className="text-micro text-destructive">{comptes.error}</span>}
      {!comptes.error && comptes.data?.length === 0 && (
        <span className="text-micro text-(--amber)">Aucun compte pour la société de ce règlement.</span>
      )}
    </FormField>
  );
}

/** Règles serveur : `dateReglement` et `compteId` obligatoires (400), au moins une
 * pièce jointe (409), date après le dernier rapprochement du compte (409). On lit
 * les pièces d'abord pour proposer le dépôt ici ; les messages serveur sont
 * affichés tels quels. */
export function PointerReglementModal({
  dossierId,
  reglement,
  onClose,
  onPointed,
}: Readonly<{
  dossierId: string;
  reglement: ReglementAPointer;
  onClose: () => void;
  onPointed: () => Promise<void>;
}>) {
  const [dateReglement, setDateReglement] = useState(todayISO());
  const [compteId, setCompteId] = useState<string | null>(null);
  const [piecesVersion, setPiecesVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglement.id), [dossierId, reglement.id, piecesVersion]);
  const sansPreuve = !!pieces.data && pieces.data.length === 0;

  return (
    <Modal title="Pointer le règlement" onClose={onClose} width={560}>
      <div className="flex flex-col gap-4">
        <p className="text-body text-muted-foreground">
          Constater l'encaissement de <span className="font-semibold text-foreground">{formatCurrency(reglement.montant)}</span>
          {reglement.typeLibelle ? ` (${reglement.typeLibelle})` : ''}
          {reglement.payeurNom ? `, réglé par ${reglement.payeurNom}` : ''}. Le règlement passera à
          « Pointé », un état définitif.
        </p>

        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="pointage-date">Date d'encaissement</FieldLabel>
            <Input
              id="pointage-date"
              type="date"
              value={dateReglement}
              onChange={(e) => setDateReglement(e.target.value)}
            />
          </FormField>
          <ChampComptePointage societeId={reglement.societeId} value={compteId} onChange={setCompteId} />
        </FieldGroup>

        <div className="flex flex-col gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
          <span className="text-micro font-medium text-muted-foreground">Preuve de paiement</span>
          {pieces.loading && <span className="text-micro text-muted-foreground">Chargement…</span>}
          {pieces.error && <span className="text-micro text-destructive">{pieces.error}</span>}
          {sansPreuve && (
            <span className="text-micro text-(--amber)">
              Déposez d'abord une preuve de paiement (chèque scanné, avis de virement…) : elle est
              obligatoire pour pointer.
            </span>
          )}
          {pieces.data?.map((p) => (
            <ReglementPieceJointeRow
              key={p.id}
              dossierId={dossierId}
              reglementId={reglement.id}
              piece={p}
              onDeleted={() => setPiecesVersion((v) => v + 1)}
            />
          ))}
          <ReglementPieceUpload
            dossierId={dossierId}
            reglementId={reglement.id}
            onAdded={() => setPiecesVersion((v) => v + 1)}
          />
        </div>

        {error && <p className="text-micro text-destructive">{error}</p>}
      </div>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Annuler</Button>
        <Button
          type="button"
          disabled={busy || !dateReglement || !compteId || sansPreuve || pieces.loading}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await modifierStatutReglement(dossierId, reglement.id, {
                statut: 'POINTED',
                dateReglement: toApiDateTime(dateReglement) ?? null,
                compteId,
              });
              await onPointed();
              onClose();
            } catch (err) {
              setError(messageErreurStatut(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <ClipboardCheck data-icon="inline-start" /> Pointer
        </Button>
      </DialogFooter>
    </Modal>
  );
}


/* L'`<iframe>` marche parce que le stockage sert en `inline` sans X-Frame-Options
   ni CSP. Son `src` vise l'endpoint, jamais l'URL présignée qu'il renvoie :
   celle-ci expire en quelques minutes. */

/** `PieceJointeDto` ne porte pas de type MIME : l'extension est le seul signal. */
const EXTENSIONS_AVEC_APERCU = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'txt']);

function extensionNue(piece: PieceJointeDto): string {
  return (piece.extension ?? '').replace(/^\./, '').toLowerCase();
}

function nomFichierPiece(piece: PieceJointeDto): string {
  const ext = extensionNue(piece);
  return `${piece.description || 'preuve-paiement'}${ext ? '.' + ext : ''}`;
}

export function ReglementDocumentsJoints({
  dossierId,
  reglementId,
  statut,
  onChanged,
}: Readonly<{
  dossierId: string;
  reglementId: string;
  statut?: string;
  /** Le nombre de preuves conditionne le pointage : le parent doit se réévaluer à chaque dépôt. */
  onChanged?: () => void;
}>) {
  const [version, setVersion] = useState(0);
  const [selectionneId, setSelectionneId] = useState<string | null>(null);
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglementId), [dossierId, reglementId, version]);

  function rafraichir() {
    setVersion((v) => v + 1);
    onChanged?.();
  }

  const liste = pieces.data ?? [];
  /* Sélection dérivée, pas synchronisée : supprimer la pièce affichée bascule sur
     la suivante sans effet ni état mort. */
  const selectionnee = liste.find((p) => p.id === selectionneId) ?? liste.at(0);
  const raisonBlocage = raisonPreuveVerrouillee(statut, liste.length);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 p-3 lg:flex-row">
      <div className="flex min-h-0 shrink-0 flex-col gap-2 lg:w-80">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-micro font-medium text-muted-foreground">Preuves de paiement</span>
          {pieces.data && <span className="text-micro tabular-nums text-muted-foreground">{liste.length}</span>}
        </div>

        <ReglementPieceUpload dossierId={dossierId} reglementId={reglementId} onAdded={rafraichir} />

        {pieces.loading && !pieces.data && <span className="text-micro text-muted-foreground">Chargement…</span>}
        {pieces.error && <span className="text-micro text-destructive">{pieces.error}</span>}
        {pieces.data && liste.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-2.5 py-3 text-micro text-muted-foreground">
            Aucune preuve déposée.
            {statut === 'IN_WORK' && " Le règlement ne pourra pas être pointé tant qu'il n'en porte aucune."}
          </p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
          {liste.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectionneId(p.id)}
              aria-current={p.id === selectionnee?.id}
              className={cn(
                'flex w-full min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 text-left text-body',
                p.id === selectionnee?.id
                  ? 'border-(--info-border) bg-(--info-bg)'
                  : 'border-transparent hover:bg-muted/50',
              )}
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-foreground">{p.description || nomFichierPiece(p)}</span>
                <span className="truncate text-micro text-muted-foreground">
                  {[extensionNue(p).toUpperCase() || null, p.dateCreation ? formatDate(p.dateCreation) : null, p.creePar]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg bg-muted/30">
        {!selectionnee ? (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-body text-muted-foreground">
            Déposez un chèque scanné, un avis de virement ou un reçu pour l'afficher ici.
          </div>
        ) : (
          <ApercuPiece
            dossierId={dossierId}
            reglementId={reglementId}
            piece={selectionnee}
            raisonBlocage={raisonBlocage}
            onDeleted={rafraichir}
          />
        )}
      </div>
    </div>
  );
}

function ApercuPiece({
  dossierId,
  reglementId,
  piece,
  raisonBlocage,
  onDeleted,
}: Readonly<{
  dossierId: string;
  reglementId: string;
  piece: PieceJointeDto;
  raisonBlocage?: string;
  onDeleted: () => void;
}>) {
  const url = urlReglementPieceJointeFichier(dossierId, reglementId, piece.id);
  const affichable = EXTENSIONS_AVEC_APERCU.has(extensionNue(piece));

  return (
    <>
      <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-border px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground" title={nomFichierPiece(piece)}>
          {piece.description || nomFichierPiece(piece)}
        </span>
        <ReglementPieceJointeRow
          dossierId={dossierId}
          reglementId={reglementId}
          piece={piece}
          onDeleted={onDeleted}
          raisonBlocage={raisonBlocage}
          actionsSeules
        />
      </div>

      {affichable ? (
        /* `key` sur l'URL : sans elle, le cadre garde le document déjà chargé.
           Fond blanc en dur : un document scanné ne suit pas le thème. */
        <iframe
          key={url}
          src={url}
          title={`Aperçu — ${piece.description || nomFichierPiece(piece)}`}
          className="min-h-0 w-full flex-1 rounded-b-lg bg-white"
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-body text-muted-foreground">
            Pas d'aperçu pour un fichier {extensionNue(piece).toUpperCase() || 'de ce type'}.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openReglementPieceJointeFichier(dossierId, reglementId, piece.id)}
          >
            <Eye data-icon="inline-start" /> Ouvrir dans un onglet
          </Button>
        </div>
      )}
    </>
  );
}
