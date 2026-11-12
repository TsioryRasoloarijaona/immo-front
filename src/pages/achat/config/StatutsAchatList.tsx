import { useState } from 'react';
import { Pencil, Plus, RefreshCw, Tags, Trash2 } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import BarreIcones from '../../../components/BarreIcones';
import DialogueStatutAchat from '../../../components/achat/DialogueStatutAchat';
import { PastilleCouleur } from '../../../components/configuration/SelecteurCouleur';
import { Button } from '../../../components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { oublierLecturesRecentes } from '../../../lib/api';
import { listStatutsAchat, supprimerStatutAchat, urlImageStatut } from '../../../lib/apiAchatConfig';
import { useConfirm } from '../../../lib/confirmContext';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { StatutAchatConfigDto } from '../../../types/achatConfig';

/** Les noms .NET (`LimeGreen`…) sont des noms CSS ; un nom inconnu donne un gris neutre. */
const couleurAffichee = (nom: string) => (CSS.supports('color', nom) ? nom : 'gray');

const COLONNES: ColonneGrille<StatutAchatConfigDto>[] = [
  { nom: 'ordre', libelle: 'Ordre', type: 'NOMBRE', largeur: 5 },
  {
    nom: 'imageId', libelle: 'Image', largeur: 5, sansSomme: true, valeur: (s) => (s.imageId ? 'Oui' : ''),
    rendu: (s) => (s.imageId ? <img src={urlImageStatut(s.imageId)} alt="" className="size-6 object-contain" /> : '—'),
  },
  {
    nom: 'couleur', libelle: 'Couleur', largeur: 10,
    rendu: (s) => (s.couleur ? <span className="flex items-center gap-2"><PastilleCouleur nom={couleurAffichee(s.couleur)} />{s.couleur}</span> : <span className="flex items-center gap-2"><PastilleCouleur nom="white" />White</span>),
  },
  { nom: 'code', libelle: 'Code', largeur: 14 },
  { nom: 'description', libelle: 'Description', largeur: 22 },
  { nom: 'categorie', libelle: 'Type', largeur: 12 },
  { nom: 'dureeVieJours', libelle: 'Durée de vie (jours)', type: 'NOMBRE', largeur: 8 },
  { nom: 'okPourPaiement', libelle: 'OK paiement', type: 'BOOLEEN', largeur: 8 },
  { nom: 'valideComptabilite', libelle: 'Validé compta', type: 'BOOLEEN', largeur: 8 },
  { nom: 'lectureSeule', libelle: 'Lecture seule', type: 'BOOLEEN', largeur: 8 },
  { nom: 'notes', libelle: 'Notes', largeur: 16 },
  { nom: 'nombrePieces', libelle: 'Pièces', type: 'NOMBRE', largeur: 6 },
];

/** Statuts des pièces d'achat, triés par ordre : ajout, modification, suppression (droit BuyDocumentStatus, 403 affiché). */
export default function StatutsAchatList() {
  const { data, loading, error, refetch } = useApi(listStatutsAchat, [], 'achat-config-statuts');
  const confirm = useConfirm();
  const toast = useToast();
  const [edition, setEdition] = useState<StatutAchatConfigDto | 'ajout' | null>(null);
  const lignes = [...(data ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  async function supprimer(s: StatutAchatConfigDto) {
    const ok = await confirm({ title: 'Supprimer le statut ?', message: `« ${s.code ?? ''} » sera supprimé.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await supprimerStatutAchat(s.id);
      toast('Statut supprimé.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    await refetch();
  }

  function apresEnregistrement() {
    setEdition(null);
    void refetch();
  }

  return (
    <PageShell title="Statuts des pièces" icon={<Tags />}
      crumbs={[{ label: 'Achat' }, { label: 'Configuration' }, { label: 'Statuts' }]}
      actions={(
        <>
          <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}><RefreshCw /> Rafraîchir</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEdition('ajout')}><Plus /> Ajouter</Button>
        </>
      )}>
      <div className="flex flex-col gap-5 p-4 md:px-7">
        {loading && !data && <LoadingState />}
        {error && (
          <>
            <ErrorState message={error} />
            <Button type="button" variant="outline" className="self-center" onClick={() => void refetch()}>Réessayer</Button>
          </>
        )}
        {!error && data && data.length === 0 && <EmptyState title="Aucun statut configuré" />}
        {!error && lignes.length > 0 && (
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid cleOrdre="achat-config-statuts" rows={lignes} colonnes={COLONNES} libelleLigne={(s) => s.code ?? ''}
              actions={(s) => (
                <BarreIcones className="flex items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEdition(s)}><Pencil /> Modifier</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(s)}><Trash2 /> Supprimer</Button>
                </BarreIcones>
              )} />
          </div>
        )}
      </div>
      {edition && (
        <DialogueStatutAchat key={edition === 'ajout' ? 'ajout' : edition.id} statut={edition === 'ajout' ? null : edition}
          ordreDefaut={(data?.length ?? 0) + 1} onClose={() => setEdition(null)} onEnregistre={apresEnregistrement} />
      )}
    </PageShell>
  );
}
