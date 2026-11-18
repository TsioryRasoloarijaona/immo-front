import { useState } from 'react';
import { Download, RefreshCw, RotateCcw } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import PageListe from '../../components/liste/PageListe';
import PrevisionsProjetDetail from '../../components/projet/PrevisionsProjetDetail';
import { EmptyState, ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { oublierLecturesRecentes } from '../../lib/api';
import { exporterPrevisionsProjet, getPrevisionsProjet, getProjetsPrevisions } from '../../lib/apiProjet';
import { enIssue } from '../../lib/rapports';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import { SqueletteGrille } from './commun';

const ACCES_REFUSE = 'Accès refusé';

function Erreur({ message, onReessayer }: Readonly<{ message: string; onReessayer: () => void }>) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ErrorState message={message} />
      <Button type="button" variant="outline" size="sm" onClick={onReessayer}>
        <RotateCcw data-icon="inline-start" /> Réessayer
      </Button>
    </div>
  );
}

export default function PrevisionsProjet() {
  const showToast = useToast();
  const [projetId, setProjetId] = useState<string | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const projets = useApi(() => enIssue(getProjetsPrevisions(), [403]), [], 'projet-previsions-projets');
  const previsions = useApi(() => (projetId ? enIssue(getPrevisionsProjet(projetId), [403, 404]) : Promise.resolve(null)), [projetId]);

  const listeProjets = projets.data && 'donnees' in projets.data ? projets.data.donnees : [];
  const items = listeProjets.map((p) => ({ value: p.id, label: p.description }));
  const issue = previsions.data;
  // la réponse du projet précédent reste en mémoire pendant le chargement du suivant
  const d = issue && 'donnees' in issue && issue.donnees.projetId === projetId ? issue.donnees : null;
  const statut = issue && 'statut' in issue ? issue.statut : null;
  const refuse = (projets.data && 'statut' in projets.data) || statut === 403;

  function rafraichir() {
    oublierLecturesRecentes();
    void projets.refetch();
    void previsions.refetch();
  }

  async function exporter() {
    if (!d) return;
    setExportEnCours(true);
    try {
      await exporterPrevisionsProjet(d.projetId, `Prévision projet - ${d.projetDescription}.xlsx`);
    } catch (err) {
      showToast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setExportEnCours(false);
    }
  }

  function contenu() {
    if (refuse) return <EmptyState title={ACCES_REFUSE} message="Vous n'avez pas accès aux prévisions des projets." />;
    if (projets.error) return <Erreur message={projets.error} onReessayer={rafraichir} />;
    if (!projetId) return <EmptyState title="Choisissez un projet" />;
    if (previsions.error) return <Erreur message={previsions.error} onReessayer={rafraichir} />;
    if (statut === 404) return <EmptyState title="Projet introuvable" message="Ce projet n'existe pas ou n'est pas dans votre périmètre." />;
    if (!d) return <SqueletteGrille />;
    return <PrevisionsProjetDetail key={d.projetId} d={d} />;
  }

  return (
    <PageListe titre="Prévisions des lots">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2">
        <span className="flex items-center gap-1.5 text-body text-muted-foreground">
          Projet
          <Select items={items} value={projetId} onValueChange={(v) => setProjetId(v)}>
            <SelectTrigger aria-label="Projet" className="min-w-64">
              <SelectValue placeholder="Choisir un projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </span>
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={rafraichir}>
            <RefreshCw /> Rafraîchir
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={!d || exportEnCours} onClick={() => void exporter()}>
            <Download /> Exporter
          </Button>
        </BarreIcones>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 py-2">{contenu()}</div>
    </PageListe>
  );
}
