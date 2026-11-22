import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import ChoixUnique from '../../components/ChoixUnique';
import PageListe from '../../components/liste/PageListe';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import GrilleBilansProjet from '../../components/projet/GrilleBilansProjet';
import { SelecteurProjets } from '../../components/projet/TdbCommun';
import { EmptyState, ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { oublierLecturesRecentes } from '../../lib/api';
import { exporterBilansProjet, getBilansProjet } from '../../lib/apiProjetTdb';
import { enIssue } from '../../lib/rapports';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import { MESSAGE_AUCUN_PROJET, useProjetsChoisis } from '../../lib/useTdbProjet';
import type { CodeColonneBilan, FiltresBilansProjet } from '../../types/projetTdb';
import { SqueletteGrille } from './commun';

export default function BilansProjet() {
  const showToast = useToast();
  const projets = useProjetsChoisis();
  const [ttc, setTtc] = useState(false);
  const [visibles, setVisibles] = useState<string[]>([]);
  const [colonne1, setColonne1] = useState<string | null>(null);
  const [colonne2, setColonne2] = useState<string | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const filtres: FiltresBilansProjet = {
    projets: projets.effectifs,
    ttc,
    colonne1: (colonne1 ?? undefined) as CodeColonneBilan | undefined,
    colonne2: (colonne2 ?? undefined) as CodeColonneBilan | undefined,
  };
  const bilan = useApi(
    () => (projets.effectifs.length > 0 ? enIssue(getBilansProjet(filtres), [403]) : Promise.resolve(null)),
    [projets.effectifs.join(','), ttc, colonne1, colonne2],
  );
  const donnees = bilan.data && 'donnees' in bilan.data ? bilan.data.donnees : null;
  const itemsColonnes = (donnees?.colonnes ?? []).map((c) => ({ value: c.code, label: c.libelle }));

  function actualiser() {
    oublierLecturesRecentes();
    void projets.liste.refetch();
    void bilan.refetch();
  }

  async function exporter() {
    setExportEnCours(true);
    try {
      await exporterBilansProjet(filtres);
    } catch (err) {
      showToast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setExportEnCours(false);
    }
  }

  function contenu() {
    if (projets.liste.error) return <ErrorState message={projets.liste.error} />;
    if (bilan.error) return <ErrorState message={bilan.error} />;
    if (projets.liste.data && projets.effectifs.length === 0) return <EmptyState title={MESSAGE_AUCUN_PROJET} />;
    if (bilan.data && 'statut' in bilan.data) {
      return <EmptyState title={bilan.data.statut === 403 ? 'Accès refusé' : 'Indisponible'} message={bilan.data.message} />;
    }
    if (!donnees) return <SqueletteGrille />;
    if (donnees.lignes.length === 0) return <EmptyState title="Aucune donnée pour ces projets" />;
    const colonnes = visibles.length > 0 ? donnees.colonnes.filter((c) => visibles.includes(c.code)) : donnees.colonnes;
    return <GrilleBilansProjet colonnes={colonnes} lignes={donnees.lignes} />;
  }

  return (
    <PageListe titre="Bilans des projets">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2">
        <SelecteurProjets options={projets.options} value={projets.choix} onChange={projets.setChoix} />
        <span className="flex items-center gap-3 text-body text-muted-foreground">
          <label className="flex items-center gap-1">
            <input type="radio" name="taxe" checked={!ttc} onChange={() => setTtc(false)} /> HT
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="taxe" checked={ttc} onChange={() => setTtc(true)} /> TTC
          </label>
        </span>
        <MultiSelectDropdown ariaLabel="Colonnes" placeholder="Toutes les colonnes" items={itemsColonnes} value={visibles} onChange={setVisibles} disabled={!donnees} />
        <span className="flex items-center gap-1.5 text-body text-muted-foreground">
          Écart
          <ChoixUnique items={itemsColonnes} value={colonne1} placeholder="Colonne 1" largeur="w-44" tous="Aucune" onChange={setColonne1} />
          <ChoixUnique items={itemsColonnes} value={colonne2} placeholder="Colonne 2" largeur="w-44" tous="Aucune" onChange={setColonne2} />
        </span>
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
    </PageListe>
  );
}
