import { useState } from 'react';
import { Eye, FileText, Trash2, Upload } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import ActionAdmin from './ActionAdmin';
import SaisiePieceChamps from './SaisiePieceChamps';
import TableauLecture, { type ColonneLecture } from './TableauLecture';
import { deposerPiecePatrimoine, listPiecesPatrimoine, ouvrirPiecePatrimoine, supprimerPiecePatrimoine } from '../../lib/apiArticleOnglets';
import { useConfirm } from '../../lib/confirmContext';
import { pieceJointeTypeTone } from '../../lib/domain';
import { formatDate } from '../../lib/format';
import { errorMessage, useApi } from '../../lib/useApi';
import type { PieceJointeDto } from '../../types';
import type { PorteurPieces, SaisiePieceJointe } from '../../types/articleOnglets';

function nomFichier(p: PieceJointeDto) {
  const ext = p.extension?.replace(/^\./, '');
  const suffixe = ext ? `.${ext}` : '';
  return `${p.description || 'document'}${suffixe}`;
}

function FormulaireDepot({ porteur, id, onFini }: Readonly<{ porteur: PorteurPieces; id: string; onFini: (depose: boolean) => void }>) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [saisie, setSaisie] = useState<SaisiePieceJointe>({});
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    if (!fichier) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await deposerPiecePatrimoine(porteur, id, fichier, { ...saisie, description: saisie.description?.trim() || undefined });
      onFini(true);
    } catch (err) {
      setErreur(errorMessage(err));
      setEnvoi(false);
    }
  }

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg bg-muted/40 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-8 min-w-0 max-w-70 flex-1 cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-2.5 text-body text-muted-foreground hover:border-ring">
          <Upload className="size-3.5 shrink-0" />
          <span className="truncate">{fichier ? fichier.name : 'Choisir un fichier…'}</span>
          <input type="file" className="hidden" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
        </label>
        <SaisiePieceChamps valeur={saisie} onChange={setSaisie} />
        <Button type="button" size="sm" disabled={envoi || !fichier} onClick={() => void envoyer()}>
          {envoi ? 'Envoi…' : 'Envoyer'}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={envoi} onClick={() => onFini(false)}>Annuler</Button>
      </div>
      {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
    </div>
  );
}

/** Pièces jointes d'un article, d'une tranche ou d'un programme ; dépôt et suppression : Administrateur. */
export default function PiecesJointesBloc({ porteur, id }: Readonly<{ porteur: PorteurPieces; id: string }>) {
  const pieces = useApi(() => listPiecesPatrimoine(porteur, id), [porteur, id]);
  const confirm = useConfirm();
  const [depotOuvert, setDepotOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function supprimer(p: PieceJointeDto) {
    const oui = await confirm({
      title: 'Supprimer la pièce jointe',
      message: `Supprimer « ${nomFichier(p)} » ? Cette suppression est irréversible depuis l'application.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!oui) return;
    setErreur(null);
    try {
      await supprimerPiecePatrimoine(porteur, id, p.id);
      void pieces.refetch();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  const colonnes: ColonneLecture<PieceJointeDto>[] = [
    {
      titre: 'Fichier',
      rendu: (p) => (
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <FileText className="size-4 shrink-0 text-muted-foreground" /> {nomFichier(p)}
        </span>
      ),
    },
    { titre: 'Groupe', rendu: (p) => p.groupe || '—' },
    { titre: 'Type', rendu: (p) => (p.type ? <Badge tone={pieceJointeTypeTone(p.type)}>{p.type}</Badge> : '—') },
    { titre: 'Déposé par', rendu: (p) => p.creePar || '—' },
    { titre: 'Date', rendu: (p) => formatDate(p.dateCreation) },
    {
      titre: 'Actions',
      droite: true,
      rendu: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => ouvrirPiecePatrimoine(porteur, id, p.id)}>
            <Eye data-icon="inline-start" /> Ouvrir
          </Button>
          <ActionAdmin onClick={() => void supprimer(p)} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
        </div>
      ),
    },
  ];

  return (
    <Card
      title={`Pièces jointes (${pieces.data?.length ?? 0})`}
      action={!depotOuvert && <ActionAdmin onClick={() => setDepotOuvert(true)} libelle="Ajouter une pièce jointe" variant="outline" />}
    >
      {depotOuvert && (
        <FormulaireDepot
          porteur={porteur}
          id={id}
          onFini={(depose) => {
            setDepotOuvert(false);
            if (depose) void pieces.refetch();
          }}
        />
      )}
      {erreur && <p role="alert" className="mb-2 text-label text-destructive">{erreur}</p>}
      {pieces.error && <ErrorState message={pieces.error} />}
      {!pieces.error && !pieces.data && <LoadingState />}
      {!pieces.error && pieces.data?.length === 0 && <EmptyState title="Aucune pièce jointe" message="Aucun fichier n'est attaché." />}
      {!pieces.error && pieces.data && pieces.data.length > 0 && (
        <TableauLecture lignes={pieces.data} colonnes={colonnes} cle={(p) => p.id} />
      )}
    </Card>
  );
}
