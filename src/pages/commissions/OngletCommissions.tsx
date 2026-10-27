import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import BoutonExporter from '../../components/BoutonExporter';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import Modal from '../../components/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import {
  cheminExportCommissions,
  genererDocumentAPayer,
  getDocumentDeLigne,
  getLignesCommission,
  supprimerCommissions,
} from '../../lib/apiCommissions';
import { useConfirm } from '../../lib/confirmContext';
import { formatCurrency, formatDate } from '../../lib/format';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { DocumentCommissionDto, DroitsCommissionDto, LigneCommissionCalculeeDto } from '../../types/commissions';
import DialogueMontantCommission from './DialogueMontantCommission';
import { lire } from './lecture';

const COLONNES: ColonneGrille<LigneCommissionCalculeeDto>[] = [
  { nom: 'commercial', libelle: 'Commercial / Gestionnaire', largeur: 12 },
  { nom: 'tranche', libelle: 'Tranche', largeur: 8 },
  { nom: 'categorie', libelle: 'Catégorie', largeur: 8 },
  { nom: 'dossierCode', libelle: 'Dossier', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'type', libelle: 'Type', largeur: 10 },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'montant', libelle: 'Montant', type: 'MONTANT', largeur: 8 },
  { nom: 'modeCalcul', libelle: 'Mode de calcul', largeur: 10 },
  { nom: 'articleCode', libelle: 'Article', largeur: 8 },
  { nom: 'statut', libelle: 'Statut', largeur: 8 },
  { nom: 'documentCode', libelle: 'Code facture', largeur: 8 },
  { nom: 'regle', libelle: 'Réglé', type: 'MONTANT', largeur: 8, classe: 'font-bold text-(--success)' },
  { nom: 'reste', libelle: 'Reste', type: 'MONTANT', largeur: 8, classe: 'font-bold text-destructive' },
];

const RAISON_VERROU = 'Cette ligne a un document à payer : elle ne peut plus être modifiée.';
const MESSAGE_SANS_DOCUMENT = "Cette ligne n'a pas encore un document à payer!";

function DocumentModal({ document, onClose }: Readonly<{ document: DocumentCommissionDto; onClose: () => void }>) {
  return (
    <Modal title={`Document à payer ${document.code ?? ''}`.trim()} onClose={onClose} width={560}>
      <dl className="grid grid-cols-2 gap-2 text-body">
        <dt className="text-muted-foreground">Date</dt>
        <dd>{formatDate(document.date)}</dd>
        <dt className="text-muted-foreground">Commercial</dt>
        <dd>{document.commercial || '—'}</dd>
        <dt className="text-muted-foreground">Montant TTC</dt>
        <dd>{formatCurrency(document.montant)}</dd>
        <dt className="text-muted-foreground">Réglé</dt>
        <dd>{formatCurrency(document.regle)}</dd>
        <dt className="text-muted-foreground">À payer</dt>
        <dd>{formatCurrency(document.reste)}</dd>
        <dt className="text-muted-foreground">Statut</dt>
        <dd>{document.statut || '—'}</dd>
      </dl>
      <ul className="flex flex-col gap-1 text-body">
        {document.lignes.map((l) => (
          <li key={l.ligneId} className="flex justify-between gap-3 border-t border-border pt-1">
            <span>{l.libelle || '—'}</span>
            <span className="tabular-nums">{formatCurrency(l.montant)}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export default function OngletCommissions({
  trancheId,
  droits,
  onChange,
}: Readonly<{ trancheId: UUID; droits: DroitsCommissionDto; onChange: () => void }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const lignes = useApi(() => lire(() => getLignesCommission(trancheId)), [trancheId]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [edition, setEdition] = useState<LigneCommissionCalculeeDto | null>(null);
  const [documentOuvert, setDocumentOuvert] = useState<DocumentCommissionDto | null>(null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);

  const rows = useMemo(() => lignes.data ?? [], [lignes.data]);
  const choisies = useMemo(() => rows.filter((l) => ids.has(l.id)), [rows, ids]);
  const toutModifiable = choisies.length > 0 && choisies.every((l) => l.modifiable);
  const peutModifier = choisies.length === 1 && choisies[0].modifiable;
  const verrouillee = choisies.some((l) => !l.modifiable);

  function basculer(id: string) {
    setIds((prev) => {
      const suivant = new Set(prev);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  }

  async function rafraichir() {
    setIds(new Set());
    await lignes.refetch();
    onChange();
  }

  async function agir(action: () => Promise<unknown>, succes?: string) {
    setMessage(null);
    try {
      await action();
      await rafraichir();
      if (succes) setMessage({ texte: succes, erreur: false });
    } catch (err) {
      setMessage({ texte: errorMessage(err), erreur: true });
    }
  }

  async function supprimer() {
    const ok = await confirmer('Etes-vous sûre de vouloir supprimer cette (ces) ligne(s) !');
    if (ok) await agir(() => supprimerCommissions({ ligneIds: choisies.map((l) => l.id) }));
  }

  async function ouvrirDocument() {
    setMessage(null);
    const ligne = choisies.at(0);
    if (!ligne?.documentId) {
      setMessage({ texte: MESSAGE_SANS_DOCUMENT, erreur: true });
      return;
    }
    try {
      setDocumentOuvert(await getDocumentDeLigne(ligne.id));
    } catch (err) {
      setMessage({ texte: errorMessage(err), erreur: true });
    }
  }

  const raison = verrouillee ? RAISON_VERROU : undefined;

  if (lignes.error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ErrorState message={lignes.error} />
        <Button type="button" variant="outline" size="sm" onClick={() => void lignes.refetch()}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  }
  if (!lignes.data) return <LoadingState />;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {droits.ecriture && (
          <span title={raison}>
            <Button type="button" variant="outline" size="sm" disabled={!peutModifier} onClick={() => setEdition(choisies[0])}>
              Modifier montant
            </Button>
          </span>
        )}
        {droits.suppression && (
          <span title={raison}>
            <Button type="button" variant="outline" size="sm" disabled={!toutModifiable} onClick={() => void supprimer()}>
              Supprimer
            </Button>
          </span>
        )}
        {droits.ecriture && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={choisies.length === 0}
            onClick={() => void agir(() => genererDocumentAPayer({ ligneIds: choisies.map((l) => l.id) }), 'Document à payer généré.')}
          >
            Générer document à payer
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={choisies.length !== 1} onClick={() => void ouvrirDocument()}>
          Ouvrir document à payer
        </Button>
        {droits.impression && <BoutonExporter chemin={cheminExportCommissions(trancheId)} params={{}} nomListe="commissions-tranche" />}
      </div>
      {message && (
        <p role={message.erreur ? 'alert' : 'status'} className={message.erreur ? 'text-body text-destructive' : 'text-body text-(--success)'}>
          {message.texte}
        </p>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <EmptyState title="Aucune commission générée pour cette tranche." />
        ) : (
          <DataGrid
            cleOrdre="commissions-lignes"
            rows={rows}
            colonnes={COLONNES}
            bandeauRegroupement={false}
            selection={{ ids, onToggle: basculer, onToggleAll: (tous) => setIds(new Set(tous)) }}
            onOuvrir={(id) => {
              const dossierId = rows.find((l) => l.id === id)?.dossierId;
              if (dossierId) void navigate(`/dossiers/${dossierId}`);
            }}
            libelleLigne={(l) => `Ouvrir le dossier ${l.dossierCode ?? l.id}`}
          />
        )}
      </div>
      {edition && (
        <DialogueMontantCommission
          ligne={edition}
          onClose={() => setEdition(null)}
          onEnregistre={() => {
            setEdition(null);
            void rafraichir();
          }}
        />
      )}
      {documentOuvert && <DocumentModal document={documentOuvert} onClose={() => setDocumentOuvert(null)} />}
    </div>
  );
}
