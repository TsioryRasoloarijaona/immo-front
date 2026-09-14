import { useState } from 'react';
import { ClipboardCheck, Eye, FileText, Trash2, Upload } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import {
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
import { useApi } from '../lib/useApi';
import { cn } from '../lib/utils';
import type { PieceJointeDto } from '../types';

/* Les preuves de paiement d'un règlement, et son pointage.
 *
 * Ce bloc vivait dans `DossierDetail`, où il ne servait que l'échéancier. Il
 * est sorti ici parce qu'un **deuxième** écran en a besoin : la fiche
 * encaissement, qui est le même règlement vu par l'autre bout. Les règles que
 * ces composants font respecter sont celles du serveur, et elles ne doivent
 * exister qu'une fois :
 *
 *   - pointer exige au moins une preuve de paiement (409 sinon), d'où le dépôt
 *     proposé dans la boîte de pointage elle-même ;
 *   - pointer exige une date d'encaissement (400 sinon) ;
 *   - `POINTED` et `CANCELED` sont terminaux (409 au retour) ;
 *   - un règlement pointé ne peut pas perdre sa **dernière** preuve (409).
 *
 * Les deux appelants passent un `dossierId` : les endpoints sont scopés
 * `/api/dossiers/{id}/reglements/{reglementId}/…`. La fiche encaissement le
 * tient de `EncaissementDetailDto.dossierId` — vérifié présent et accepté par
 * ces endpoints sur les 332 règlements servis, y compris les 7 à cheval sur
 * plusieurs dossiers, où **tous** les dossiers des affectations sont acceptés
 * indifféremment. */

/** Ce dont le pointage a besoin d'un règlement, et rien de plus.
 *
 * `ReglementDto` le satisfait tel quel ; `EncaissementDetailDto` s'y adapte en
 * une ligne. Les deux décrivent la **même** ligne `StlSettlement`, avec des
 * noms de champs différents selon le bout par lequel on la regarde :
 * `montant` / `montantBrut`, `payeurNom` / `tierPayeurNom`. Élargir la
 * signature à ce contrat minimal évite de fabriquer un faux `ReglementDto`
 * côté fiche encaissement pour satisfaire un type trop large. */
export type ReglementAPointer = {
  id: string;
  montant?: number | null;
  typeLibelle?: string | null;
  payeurNom?: string | null;
};

/** Dépôt d'une preuve de paiement sur un règlement — même coquille que
 * `AddPieceJointeRow` (input fichier masqué derrière un label pointillé),
 * en plus compact : ni type ni description obligatoires, les justificatifs
 * réels n'en portent pas. Partagé par le panneau « Preuves de paiement » et
 * la boîte de pointage, pour que déposer une preuve se fasse au même endroit
 * qu'on l'exige. */
export function ReglementPieceUpload({
  dossierId,
  reglementId,
  onAdded,
}: {
  dossierId: string;
  reglementId: string;
  onAdded: () => void;
}) {
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
        className="w-55"
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

/** Les justificatifs d'encaissement d'un règlement (chèque scanné, avis de
 * virement, reçu). Toujours consultable, quel que soit le statut : les
 * règlements legacy pointés sans pièce jointe restent parfaitement valides —
 * la règle de preuve ne s'applique qu'au moment de la transition. */
export function ReglementPiecesJointesPanel({
  dossierId,
  reglementId,
  statut,
  refreshKey,
  onChanged,
}: {
  dossierId: string;
  reglementId: string;
  /** Optionnel comme sur ReglementDto : une ligne legacy peut ne pas en porter. */
  statut?: string;
  refreshKey: number;
  onChanged: () => void;
}) {
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglementId), [dossierId, reglementId, refreshKey]);

  const raisonBlocage = raisonPreuveVerrouillee(statut, pieces.data?.length);

  return (
    <div className="mt-1.5 flex flex-col gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2">
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
}: {
  dossierId: string;
  reglementId: string;
  piece: PieceJointeDto;
  onDeleted: () => void;
  /** Renseignée quand la suppression est interdite : sert de motif affiché et
   * désactive le bouton. Le parent décide, la ligne se contente d'obéir. */
  raisonBlocage?: string;
  /** Ne rendre que le couple de boutons, sans le libellé ni les métadonnées.
   * L'onglet « Documents joints » les affiche déjà ailleurs — dans sa liste et
   * dans l'en-tête de l'aperçu. Les redire ici les dirait trois fois ; les
   * reprendre dans un composant séparé dupliquerait la suppression et son
   * garde-fou 409. */
  actionsSeules?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'preuve-paiement'}${ext ? `.${ext}` : ''}`;

  // Cf. PieceJointeRow : navigation vers le stockage, rien d'asynchrone.
  function handle() {
    setError(null);
    try {
      openReglementPieceJointeFichier(dossierId, reglementId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    }
  }

  // Le garde-fou `raisonBlocage` désactive déjà le bouton dans le cas connu
  // (dernière preuve d'un règlement pointé) ; le 409 reste rattrapé ici pour
  // les courses et les lignes rafraîchies entre-temps. Son `detail` est déjà
  // porté par `ApiError.message`, on le montre tel quel.
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

/** Pointage d'un règlement : `IN_WORK → POINTED`.
 *
 * Deux règles serveur, toutes deux exposées ici plutôt que subies :
 * `dateReglement` est obligatoire (400 sinon), et le règlement doit porter au
 * moins une pièce jointe (409 sinon). Plutôt que d'envoyer la requête pour en
 * récolter un 409, on lit d'abord les pièces jointes et on propose le dépôt
 * dans la boîte elle-même — c'est exactement la séquence décrite par la spec
 * (créer → déposer la preuve → pointer). Le 409 reste géré en dernier recours
 * (course, ou ligne legacy), en affichant les `transitionsAutorisees` du
 * ProblemDetail quand le serveur en fournit. */
export function PointerReglementModal({
  dossierId,
  reglement,
  onClose,
  onPointed,
}: {
  dossierId: string;
  reglement: ReglementAPointer;
  onClose: () => void;
  onPointed: () => Promise<void>;
}) {
  const [dateReglement, setDateReglement] = useState(todayISO());
  const [piecesVersion, setPiecesVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglement.id), [dossierId, reglement.id, piecesVersion]);
  const sansPreuve = !!pieces.data && pieces.data.length === 0;

  return (
    <Modal title="Pointer le règlement" onClose={onClose} width={480}>
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
        </FieldGroup>

        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
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
          disabled={busy || !dateReglement || sansPreuve || pieces.loading}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await modifierStatutReglement(dossierId, reglement.id, {
                statut: 'POINTED',
                dateReglement: toApiDateTime(dateReglement) ?? null,
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


/* ---------------------------------------------------------------------------
   L'onglet « Documents joints » — la version pleine page des mêmes preuves.

   Le panneau replié plus haut tient dans une ligne d'échéancier : il liste, et
   c'est tout. Ici la place existe, donc on **rend** le fichier au lieu de le
   décrire — maître-détail, la liste à gauche, la pièce elle-même à droite.

   C'est mesuré, pas supposé. Le stockage sert ces fichiers en
   `Content-Disposition: inline`, avec leur vrai `content-type`
   (`application/pdf`, `image/jpeg` sur les pièces réelles) et **sans**
   `X-Frame-Options` ni `Content-Security-Policy` : un `<iframe>` les affiche
   donc. Le `src` vise l'endpoint et jamais l'URL présignée qu'il renvoie,
   celle-ci n'étant valable que quelques minutes.
   --------------------------------------------------------------------------- */

/** Extensions que le navigateur affiche de lui-même. Le reste — `.docx` au
 * premier chef — n'a pas d'aperçu : autant le dire, plutôt que de montrer un
 * cadre vide ou de déclencher un téléchargement surprise. `PieceJointeDto` ne
 * porte pas de type MIME, l'extension est le seul signal disponible (même
 * limite que `mimeForExtension` dans `lib/api.ts`). */
const EXTENSIONS_AVEC_APERCU = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'txt']);

function extensionNue(piece: PieceJointeDto): string {
  return (piece.extension ?? '').replace(/^\./, '').toLowerCase();
}

function nomFichierPiece(piece: PieceJointeDto): string {
  const ext = extensionNue(piece);
  return `${piece.description || 'preuve-paiement'}${ext ? `.${ext}` : ''}`;
}

export function ReglementDocumentsJoints({
  dossierId,
  reglementId,
  statut,
  onChanged,
}: {
  dossierId: string;
  reglementId: string;
  statut?: string;
  /** Prévenir le parent : le nombre de preuves conditionne le pointage, donc
   * la barre d'action au-dessus doit se réévaluer à chaque dépôt. */
  onChanged?: () => void;
}) {
  const [version, setVersion] = useState(0);
  const [selectionneId, setSelectionneId] = useState<string | null>(null);
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglementId), [dossierId, reglementId, version]);

  function rafraichir() {
    setVersion((v) => v + 1);
    onChanged?.();
  }

  const liste = pieces.data ?? [];
  /* Sélection dérivée plutôt que synchronisée : la pièce retenue est celle
     qu'on a cliquée tant qu'elle existe, la plus récente sinon. Supprimer la
     pièce affichée bascule donc sur la suivante, sans effet ni état mort. */
  const selectionnee = liste.find((p) => p.id === selectionneId) ?? liste[0];
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-muted/20">
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
}: {
  dossierId: string;
  reglementId: string;
  piece: PieceJointeDto;
  raisonBlocage?: string;
  onDeleted: () => void;
}) {
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
        /* `key` sur l'URL : sans elle, changer de pièce réutilise le document
           déjà chargé dans le cadre au lieu d'en demander un autre. Fond blanc
           en dur — un chèque scanné est un document papier, il ne suit pas le
           thème de l'application. */
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
