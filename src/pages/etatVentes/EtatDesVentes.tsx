import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageListe from '../../components/liste/PageListe';
import type { LigneEtatVentes } from '../../components/etatVentes/EtatVentesTable';
import { PerimetreBanner } from '../../components/ui';
import { OngletsLigne } from '../../components/FicheShell';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import PanneauListeEtatVentes from '../../components/etatVentes/PanneauListeEtatVentes';
import PanneauSyntheseEtatVentes from '../../components/etatVentes/PanneauSyntheseEtatVentes';
import { getSyntheseEtatVentes } from '../../lib/api';
import {
  FILTRES_ETAT_VENTES_DEFAUT,
  ONGLETS_ETAT_VENTES,
  filtresDepuisChoix,
  ongletEtatVentes,
  paramsEtatVentes,
  type ChoixSynthese,
  type FiltresListeEtatVentes,
  type FiltresSyntheseEtatVentes,
} from '../../lib/etatVentes';
import { useCascadeTranches } from '../../lib/cascadeTranches';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { usePreview } from '../../lib/previewContext';

const SYNTHESE_DEFAUT: FiltresSyntheseEtatVentes = { entiteId: [], trancheId: [], projetId: [], categorieId: [] };

export default function EtatDesVentes() {
  const { ouvrirFicheArticle, ouvrirFicheDossier } = usePreview();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const onglet = ongletEtatVentes(searchParams.get('onglet'));

  const [filtresSynthese, setFiltresSynthese] = useState(SYNTHESE_DEFAUT);
  const [filtres, setFiltres] = useState<FiltresListeEtatVentes>(FILTRES_ETAT_VENTES_DEFAUT);
  const cascadeSynthese = useCascadeTranches(filtresSynthese);
  const paramsSynthese = paramsEtatVentes({ ...FILTRES_ETAT_VENTES_DEFAUT, ...filtresSynthese }, cascadeSynthese.params(true));
  // Les statuts viennent de la synthèse : la liste en a besoin pour son filtre et ses libellés.
  const synthese = useApi(
    () => getSyntheseEtatVentes(paramsSynthese),
    [JSON.stringify(paramsSynthese)],
    'etat-des-ventes-synthese',
  );

  function choisirOnglet(id: string, remplacer = true) {
    setSearchParams({ onglet: ongletEtatVentes(id) }, { replace: remplacer });
  }

  function choisir(choix: ChoixSynthese) {
    setFiltres(filtresDepuisChoix(choix, filtresSynthese));
    choisirOnglet('liste', false);
  }

  function ouvrir(ligne: LigneEtatVentes) {
    if (ligne.dossierId) ouvrirFicheDossier(ligne.dossierId);
    else ouvrirFicheArticle(ligne.articleId);
  }

  return (
    <PageListe titre="État des ventes">
      <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />
      <Tabs value={onglet} onValueChange={(v: string) => choisirOnglet(v)} className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 px-3 pt-2">
          <OngletsLigne onglets={[...ONGLETS_ETAT_VENTES]} />
        </div>
        <TabsContent value={onglet} className="flex min-h-0 flex-1 flex-col">
          {onglet === 'synthese' ? (
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <PanneauSyntheseEtatVentes
                filtres={filtresSynthese}
                setFiltres={setFiltresSynthese}
                cascade={cascadeSynthese}
                synthese={synthese}
                onChoisir={choisir}
              />
            </div>
          ) : (
            <PanneauListeEtatVentes
              filtres={filtres}
              setFiltres={setFiltres}
              statuts={synthese.data?.statuts ?? []}
              onOuvrir={ouvrir}
            />
          )}
        </TabsContent>
      </Tabs>
    </PageListe>
  );
}
