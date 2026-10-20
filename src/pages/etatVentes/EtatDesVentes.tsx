import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChartNoAxesColumn } from 'lucide-react';
import PageShell from '../../components/PageShell';
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
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { usePreview } from '../../lib/previewContext';

const SYNTHESE_DEFAUT: FiltresSyntheseEtatVentes = { trancheId: [], projetId: null, categorieId: [] };

export default function EtatDesVentes() {
  const { ouvrirFicheArticle } = usePreview();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const onglet = ongletEtatVentes(searchParams.get('onglet'));

  const [filtresSynthese, setFiltresSynthese] = useState(SYNTHESE_DEFAUT);
  const [filtres, setFiltres] = useState<FiltresListeEtatVentes>(FILTRES_ETAT_VENTES_DEFAUT);
  // Les statuts viennent de la synthèse : la liste en a besoin pour son filtre et ses libellés.
  const synthese = useApi(
    () => getSyntheseEtatVentes(paramsEtatVentes({ ...FILTRES_ETAT_VENTES_DEFAUT, ...filtresSynthese })),
    [JSON.stringify(filtresSynthese)],
    'etat-des-ventes-synthese',
  );

  function choisirOnglet(id: string, remplacer = true) {
    setSearchParams({ onglet: ongletEtatVentes(id) }, { replace: remplacer });
  }

  function choisir(choix: ChoixSynthese) {
    setFiltres(filtresDepuisChoix(choix, filtresSynthese));
    choisirOnglet('liste', false);
  }

  return (
    <PageShell
      title="État des ventes"
      crumbs={[{ label: 'Ventes' }, { label: 'État des ventes' }]}
      icon={<ChartNoAxesColumn />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex flex-col gap-4">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />
        <Tabs value={onglet} onValueChange={(v: string) => choisirOnglet(v)} className="gap-3">
          <OngletsLigne onglets={[...ONGLETS_ETAT_VENTES]} />
          <TabsContent value={onglet}>
            {onglet === 'synthese' ? (
              <PanneauSyntheseEtatVentes
                filtres={filtresSynthese}
                setFiltres={setFiltresSynthese}
                synthese={synthese}
                onChoisir={choisir}
              />
            ) : (
              <PanneauListeEtatVentes
                filtres={filtres}
                setFiltres={setFiltres}
                statuts={synthese.data?.statuts ?? []}
                onOuvrir={ouvrirFicheArticle}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
