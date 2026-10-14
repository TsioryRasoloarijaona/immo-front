import { useState } from 'react';
import { ArrowUpRight, Eye, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { referentielItems, useTypesPieceJointe } from '../../../lib/referentiels';
import { formatDate } from '../../../lib/format';
import { pieceJointeTypeTone } from '../../../lib/domain';
import { openPieceJointeFichier, removePieceJointe, uploadPieceJointe } from '../../../lib/api';
import { useConfirm } from '../../../lib/confirmContext';
import type { ApiState } from '../../../lib/useApi';
import type { PieceJointeDto } from '../../../types';

function PieceJointeRow({
  dossierId,
  piece,
  onDeleted,
}: Readonly<{
  dossierId: string;
  piece: PieceJointeDto;
  onDeleted: () => void;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'document'}${ext ? '.' + ext : ''}`;

  // Pas de bouton « Télécharger » : l'URL présignée est servie en `Content-Disposition: inline`,
  // il ferait la même chose qu'« Ouvrir » (le distinguer demanderait un paramètre côté API).
  function handle() {
    setError(null);
    try {
      openPieceJointeFichier(dossierId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'opération.');
    }
  }

  // Suppression logique côté serveur, mais aucune API pour restaurer : irréversible pour l'utilisateur.
  async function handleDelete() {
    const ok = await confirm({
      title: 'Supprimer la pièce jointe',
      message: `Supprimer « ${filename} » du dossier ? Cette suppression est irréversible depuis l’application.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await removePieceJointe(dossierId, piece.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-foreground">{filename}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{piece.creePar || '—'}</TableCell>
      <TableCell>
        {piece.type ? <Badge tone={pieceJointeTypeTone(piece.type)}>{piece.type}</Badge> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">{formatDate(piece.dateCreation)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {error && <span className="text-micro text-destructive">{error}</span>}
          <Button type="button" variant="ghost" size="sm" onClick={handle}>
            <Eye data-icon="inline-start" /> Ouvrir <ArrowUpRight data-icon="inline-end" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Supprimer la pièce jointe"
            aria-label={`Supprimer ${filename}`}
            disabled={busy}
            onClick={handleDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function AjoutPieceJointe({
  dossierId,
  onClose,
  onAdded,
}: Readonly<{
  dossierId: string;
  onClose: () => void;
  onAdded: () => void;
}>) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typesPieceJointe = useTypesPieceJointe();
  const typesPieceJointeItems = referentielItems(typesPieceJointe.data);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2.5">
      <label className="flex h-8 min-w-0 max-w-70 flex-1 cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-2.5 text-body text-muted-foreground hover:border-ring">
        <Upload className="size-3.5 shrink-0" />
        <span className="truncate">{file ? file.name : 'Choisir un fichier…'}</span>
        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <Input
        placeholder="Description (optionnel)"
        className="w-45"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Select items={typesPieceJointeItems} value={typeId} onValueChange={(v) => setTypeId(v)}>
        <SelectTrigger size="sm" className="w-45">
          <SelectValue placeholder={typesPieceJointe.loading ? 'Chargement…' : 'Type (optionnel)'} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {typesPieceJointeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <span className="text-micro text-destructive">{error}</span>}
      <Button
        type="button"
        size="sm"
        disabled={busy || !file}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            await uploadPieceJointe(dossierId, file, description.trim() || undefined, typeId || undefined);
            onAdded();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'envoi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Envoi…' : 'Envoyer'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
    </div>
  );
}

export default function OngletPiecesJointes({
  dossierId,
  pieces,
}: Readonly<{ dossierId: string; pieces: ApiState<PieceJointeDto[]> }>) {
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  return (
    <div className="p-3">
      <Card
        title={`Pièces jointes (${pieces.data?.length ?? 0})`}
        action={
          !ajoutOuvert && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAjoutOuvert(true)}>
              <Plus data-icon="inline-start" /> Ajouter une pièce jointe
            </Button>
          )
        }
      >
        {pieces.loading && !pieces.data && <LoadingState />}
        {pieces.error && <ErrorState message={pieces.error} />}
        {ajoutOuvert && (
          <AjoutPieceJointe
            dossierId={dossierId}
            onClose={() => setAjoutOuvert(false)}
            onAdded={() => {
              setAjoutOuvert(false);
              void pieces.refetch();
            }}
          />
        )}
        {pieces.data && pieces.data.length === 0 && !ajoutOuvert && (
          <EmptyState title="Aucune pièce jointe" message="Aucun document n'a été attaché à ce dossier." />
        )}
        {pieces.data && pieces.data.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Fichier</TableHead>
                  <TableHead>Déposé par</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieces.data.map((p) => (
                  <PieceJointeRow key={p.id} dossierId={dossierId} piece={p} onDeleted={() => void pieces.refetch()} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
