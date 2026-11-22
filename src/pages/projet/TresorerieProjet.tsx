import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import PageListe from '../../components/liste/PageListe';
import GrilleTresorerieProjet, { type CelluleChoisie } from '../../components/projet/GrilleTresorerieProjet';
import PanneauCelluleTresorerie from '../../components/projet/PanneauCelluleTresorerie';
import { SelecteurProjets } from '../../components/projet/TdbCommun';
import { EmptyState, ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { oublierLecturesRecentes } from '../../lib/api';
import { exporterTresorerieProjet, getTresorerieProjet } from '../../lib/apiProjetTdb';
import { enIssue } from '../../lib/rapports';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import { MESSAGE_AUCUN_PROJET, useProjetsChoisis } from '../../lib/useTdbProjet';
import type { FiltresTresorerieProjet, NoeudTresorerieDto } from '../../types/projetTdb';
import { SqueletteGrille } from './commun';

type Onglet = 'projet' | 'fournisseur';

export default function TresorerieProjet() {
  const showToast = useToast();
  const projets = useProjetsChoisis();
  const [annee, setAnnee] = useState(() => new Date().getFullYear());
  const [onglet, setOnglet] = useState<Onglet>('projet');
  const [cellule, setCellule] = useState<CelluleChoisie | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const filtres: FiltresTresorerieProjet = { annee, projets: projets.effectifs };
  const tdb = useApi(
    () => (projets.effectifs.length > 0 ? enIssue(getTresorerieProjet(filtres), [403]) : Promise.resolve(null)),
    [annee, projets.effectifs.join(',')],
  );

  function actualiser() {
    oublierLecturesRecentes();
    void projets.liste.refetch();
    void tdb.refetch();
  }

  async function exporter() {
    setExportEnCours(true);
    try {
      await exporterTresorerieProjet(filtres);
    } catch (err) {
      showToast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setExportEnCours(false);
    }
  }

  function contenu() {
    if (projets.liste.error) return <ErrorState message={projets.liste.error} />;
    if (tdb.error) return <ErrorState message={tdb.error} />;
    if (projets.liste.data && projets.effectifs.length === 0) return <EmptyState title={MESSAGE_AUCUN_PROJET} />;
    const issue = tdb.data;
    if (!issue) return <SqueletteGrille />;
    if ('statut' in issue) {
      return <EmptyState title={issue.statut === 403 ? 'Accès refusé' : 'Indisponible'} message={issue.message} />;
    }
    const noeuds: NoeudTresorerieDto[] = issue.donnees.onglets[onglet];
    if (noeuds.length === 0) return <EmptyState title="Aucune prévision pour cette année" />;
    return <GrilleTresorerieProjet key={onglet} mois={issue.donnees.mois} noeuds={noeuds} onCellule={setCellule} />;
  }

  return (
    <PageListe titre="Trésorerie des projets">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2">
        <span className="flex items-center gap-1.5 text-body text-muted-foreground">
          Année
          <Input
            type="number"
            aria-label="Année"
            className="w-24"
            defaultValue={annee}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1990 && n <= 2100) setAnnee(n);
            }}
          />
        </span>
        <SelecteurProjets options={projets.options} value={projets.choix} onChange={projets.setChoix} />
        <Tabs value={onglet} onValueChange={(v) => setOnglet(v as Onglet)}>
          <TabsList>
            <TabsTrigger value="projet">Projet</TabsTrigger>
            <TabsTrigger value="fournisseur">Fournisseur</TabsTrigger>
          </TabsList>
        </Tabs>
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={actualiser}>
            <RefreshCw /> Actualiser
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={exportEnCours || projets.effectifs.length === 0} onClick={() => void exporter()}>
            <Download /> Exporter en xlsx
          </Button>
        </BarreIcones>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 py-2">{contenu()}</div>
      {cellule && tdb.data && 'donnees' in tdb.data && (
        <PanneauCelluleTresorerie filtres={filtres} cellule={cellule} mois={tdb.data.donnees.mois} onFermer={() => setCellule(null)} />
      )}
    </PageListe>
  );
}
