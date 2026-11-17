import { useState } from 'react';
import { LineChart, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import BarreIcones from '../../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import FicheModeleSimulation from '../../../components/projet/FicheModeleSimulation';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { oublierLecturesRecentes } from '../../../lib/api';
import { deleteModeleSimulation, getModeleSimulation, listModelesSimulation } from '../../../lib/apiProjet';
import { useConfirm } from '../../../lib/confirmContext';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { UUID } from '../../../types';
import type { ModeleSimulationListItemDto, ModeleSimulationSaisieDto } from '../../../types/projet';

const COLONNES: ColonneGrille<ModeleSimulationListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 20 },
  { nom: 'description', libelle: 'Description', largeur: 50 },
  { nom: 'categorie', libelle: 'Catégorie', largeur: 30, valeur: (m) => m.categorie ?? '' },
];

const VIDE: ModeleSimulationSaisieDto = { code: '', description: '', categorieId: null, lignes: [] };

/** Configuration › Modèles de simulation : courbes types temps / avancement / paiement appliquées aux prévisions d'un lot. */
export default function ModelesSimulationList() {
  const modeles = useApi(() => listModelesSimulation(), [], 'projet-config-modeles-simulation');
  const confirm = useConfirm();
  const toast = useToast();
  const [fiche, setFiche] = useState<{ id?: UUID; modele: ModeleSimulationSaisieDto } | null>(null);

  const rafraichir = () => { void modeles.refetch(); };

  async function modifier(m: ModeleSimulationListItemDto) {
    try {
      setFiche({ id: m.id, modele: await getModeleSimulation(m.id) });
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  async function supprimer(m: ModeleSimulationListItemDto) {
    const ok = await confirm({ title: 'Supprimer le modèle ?', message: `« ${m.code} » sera supprimé.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await deleteModeleSimulation(m.id);
      toast('Modèle supprimé.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    rafraichir();
  }

  return (
    <PageShell title="Modèles de simulation" icon={<LineChart />}
      crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: 'Modèles de simulation' }]}
      actions={(
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setFiche({ modele: VIDE })}><Plus /> Nouveau modèle</Button>
          <Button type="button" variant="ghost" size="sm" onClick={rafraichir}><RefreshCw /> Rafraîchir</Button>
        </BarreIcones>
      )}>
      <div className="flex flex-col gap-3 p-4 md:px-7">
        {modeles.loading && !modeles.data && <LoadingState />}
        {modeles.error && (
          <>
            <ErrorState message={modeles.error} />
            <Button type="button" variant="outline" className="self-center" onClick={rafraichir}>Réessayer</Button>
          </>
        )}
        {!modeles.error && modeles.data?.length === 0 && <EmptyState title="Aucun modèle" message="Aucun modèle de simulation n'est configuré." />}
        {!modeles.error && modeles.data && modeles.data.length > 0 && (
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid cleOrdre="projet-config-modeles-simulation" rows={modeles.data} colonnes={COLONNES} libelleLigne={(m) => m.code}
              actions={(m) => (
                <BarreIcones className="flex items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => void modifier(m)}><Pencil /> Modifier</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(m)}><Trash2 /> Supprimer</Button>
                </BarreIcones>
              )} />
          </div>
        )}
      </div>
      {fiche && (
        <FicheModeleSimulation key={fiche.id ?? 'nouveau'} id={fiche.id} modele={fiche.modele}
          onClose={() => setFiche(null)} onEnregistre={() => { setFiche(null); rafraichir(); }} />
      )}
    </PageShell>
  );
}
