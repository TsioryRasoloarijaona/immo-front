import { useState } from 'react';
import { Pencil, Plus, RefreshCw, Tags, Trash2 } from 'lucide-react';
import BarreIcones from '../../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import { PastilleCouleur } from '../../../components/configuration/SelecteurCouleur';
import DialogueStatutLot from '../../../components/projet/DialogueStatutLot';
import TableauxTransitionsLot from '../../../components/projet/TableauxTransitionsLot';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { urlImageStatut } from '../../../lib/apiAchatConfig';
import { oublierLecturesRecentes } from '../../../lib/api';
import { deleteStatutLot, listStatutsLot, listTransitionsLot } from '../../../lib/apiProjetConfig';
import { useConfirm } from '../../../lib/confirmContext';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { UUID } from '../../../types';
import type { StatutLotDto } from '../../../types/projetConfig';

/** Les noms .NET (`LimeGreen`…) sont des noms CSS ; un nom inconnu donne un gris neutre. */
const couleurAffichee = (nom: string) => (CSS.supports('color', nom) ? nom : 'gray');

const COLONNES: ColonneGrille<StatutLotDto>[] = [
  { nom: 'ordre', libelle: 'O.D.T.', type: 'NOMBRE', largeur: 5 },
  {
    nom: 'imageId', libelle: 'Image', largeur: 5, sansSomme: true, valeur: (s) => (s.imageId ? 'Oui' : ''),
    rendu: (s) => (s.imageId ? <img src={urlImageStatut(s.imageId)} alt="" className="size-6 object-contain" /> : '—'),
  },
  {
    nom: 'couleur', libelle: 'Couleur', largeur: 10,
    rendu: (s) => (s.couleur ? <span className="flex items-center gap-2"><PastilleCouleur nom={couleurAffichee(s.couleur)} />{s.couleur}</span> : '—'),
  },
  { nom: 'code', libelle: 'Code', largeur: 14 },
  { nom: 'description', libelle: 'Description', largeur: 22 },
  { nom: 'categorie', libelle: 'Type', largeur: 12 },
  { nom: 'duree', libelle: 'Durée de vie (jours)', type: 'NOMBRE', largeur: 8 },
  { nom: 'notes', libelle: 'Notes', largeur: 16 },
];

interface Genre { id: UUID; libelle: string }

/** Statuts et transitions de lot, un tableau par genre : ajout, modification, suppression (403 / 409 affichés). */
export default function StatutsLotList() {
  const statuts = useApi(listStatutsLot, [], 'projet-config-statuts-lot');
  const transitions = useApi(listTransitionsLot, [], 'projet-config-transitions-lot');
  const confirm = useConfirm();
  const toast = useToast();
  const [edition, setEdition] = useState<{ genre: Genre; statut: StatutLotDto | null } | null>(null);

  const lignes = [...(statuts.data ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const genres = new Map<UUID, Genre>();
  for (const s of lignes) genres.set(s.groupeId, { id: s.groupeId, libelle: s.genre ?? s.groupeCode ?? 'Autres' });
  for (const t of transitions.data ?? []) if (!genres.has(t.genreId)) genres.set(t.genreId, { id: t.genreId, libelle: t.genre ?? 'Autres' });
  const liste = [...genres.values()];
  const rafraichir = () => { void statuts.refetch(); void transitions.refetch(); };

  async function supprimer(s: StatutLotDto) {
    const ok = await confirm({ title: 'Supprimer le statut ?', message: `« ${s.code ?? ''} » sera supprimé.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await deleteStatutLot(s.id);
      toast('Statut supprimé.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    rafraichir();
  }

  const chargement = (statuts.loading && !statuts.data) || (transitions.loading && !transitions.data);
  const erreur = statuts.error ?? transitions.error;

  return (
    <PageShell title="Statuts de lot" icon={<Tags />}
      crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: 'Statuts de lot' }]}
      actions={(
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={rafraichir}><RefreshCw /> Rafraîchir</Button>
        </BarreIcones>
      )}>
      <div className="flex flex-col gap-5 p-4 md:px-7">
        {chargement && <LoadingState />}
        {erreur && (
          <>
            <ErrorState message={erreur} />
            <Button type="button" variant="outline" className="self-center" onClick={rafraichir}>Réessayer</Button>
          </>
        )}
        {!erreur && statuts.data && liste.length === 0 && <EmptyState title="Aucun statut" message="Aucun statut de lot n'est configuré." />}
        {!erreur && liste.length > 0 && (
          <Tabs defaultValue="statuts">
            <TabsList>
              <TabsTrigger value="statuts">Statuts</TabsTrigger>
              <TabsTrigger value="transitions">Transitions</TabsTrigger>
            </TabsList>
            <TabsContent value="statuts" className="flex flex-col gap-5 pt-3">
              {liste.map((genre) => {
                const duGenre = lignes.filter((s) => s.groupeId === genre.id);
                return (
                  <section key={genre.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-label font-medium text-foreground">{genre.libelle}</h2>
                      <BarreIcones className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEdition({ genre, statut: null })}><Plus /> Ajouter un statut</Button>
                      </BarreIcones>
                    </div>
                    {duGenre.length === 0 && <EmptyState title="Aucun statut" />}
                    {duGenre.length > 0 && (
                      <div className="overflow-auto rounded-xl border border-border bg-card">
                        <DataGrid cleOrdre={`projet-config-statuts-lot-${genre.id}`} rows={duGenre} colonnes={COLONNES}
                          libelleLigne={(s) => s.code ?? ''}
                          actions={(s) => (
                            <BarreIcones className="flex items-center justify-center gap-1">
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEdition({ genre, statut: s })}><Pencil /> Modifier</Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(s)}><Trash2 /> Supprimer</Button>
                            </BarreIcones>
                          )} />
                      </div>
                    )}
                  </section>
                );
              })}
            </TabsContent>
            <TabsContent value="transitions" className="flex flex-col gap-5 pt-3">
              {liste.map((genre) => (
                <TableauxTransitionsLot key={genre.id} genreId={genre.id} genreLibelle={genre.libelle} onChange={rafraichir}
                  lignes={(transitions.data ?? []).filter((t) => t.genreId === genre.id)} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
      {edition && (
        <DialogueStatutLot key={edition.statut?.id ?? 'ajout'} statut={edition.statut} genreId={edition.genre.id}
          genreLibelle={edition.genre.libelle}
          ordreDefaut={lignes.filter((s) => s.groupeId === edition.genre.id).length + 1}
          onClose={() => setEdition(null)} onEnregistre={() => { setEdition(null); rafraichir(); }} />
      )}
    </PageShell>
  );
}
