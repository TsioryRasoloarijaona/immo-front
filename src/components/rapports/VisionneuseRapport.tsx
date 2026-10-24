import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import BoutonExporter from '../BoutonExporter';
import PageShell from '../PageShell';
import { ResultsRegion, EmptyState } from '../ui';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { oublierLecturesRecentes } from '../../lib/api';
import { cheminExportRapport, getResultatRapport } from '../../lib/apiRapports';
import { formatDateTime } from '../../lib/format';
import { cheminRapports, enIssue, libelleRapport, lireValeurs, parametreManquant, valeursServeur, versRecherche } from '../../lib/rapports';
import { useApi } from '../../lib/useApi';
import type { DescripteurRapportDto, ResultatRapportDto, SectionRapportDto } from '../../types/rapports';
import AccesRapport from './AccesRapport';
import FiltresRapport from './FiltresRapport';
import { useRenduSpecifique } from './RenduSpecifique';
import SectionRapport from './SectionRapport';

const rendreSection = (section: SectionRapportDto) => <SectionRapport key={section.id} section={section} />;

function Contenu({ descripteur, resultat, valeurs }: Readonly<{ descripteur: DescripteurRapportDto; resultat: ResultatRapportDto; valeurs: Record<string, string[]> }>) {
  const specifique = useRenduSpecifique(descripteur.module, descripteur.code);
  if (specifique === undefined) return <Skeleton className="h-40 w-full" />;
  const propre = specifique?.({ descripteur, valeurs, resultat, sectionParDefaut: rendreSection });
  if (propre) return <>{propre}</>;
  if (resultat.sections.length === 0) return <EmptyState title="Aucune donnée pour ces filtres" />;
  return <>{resultat.sections.map(rendreSection)}</>;
}

/** Filtres déduits du descripteur (valeurs dans l'URL), résultat du serveur, export Excel. */
export default function VisionneuseRapport({ descripteur }: Readonly<{ descripteur: DescripteurRapportDto }>) {
  const { module, code, parametres } = descripteur;
  const [recherche, setRecherche] = useSearchParams();
  const cleUrl = recherche.toString();
  const appliquees = useMemo(() => lireValeurs(parametres, new URLSearchParams(cleUrl)), [parametres, cleUrl]);
  const [saisie, setSaisie] = useState(appliquees);
  const [cleVue, setCleVue] = useState(cleUrl);
  if (cleVue !== cleUrl) {
    setCleVue(cleUrl);
    setSaisie(appliquees);
  }

  const envoi = valeursServeur(parametres, appliquees);
  const cleEnvoi = JSON.stringify(envoi);
  const manquant = parametreManquant(parametres, envoi);
  const titre = libelleRapport(descripteur.libelle);
  const { data, loading, error, refetch } = useApi(
    () => (manquant ? Promise.resolve(null) : enIssue(getResultatRapport(module, code, envoi), [400, 403, 404])),
    [module, code, cleEnvoi],
  );
  const issue = data && 'donnees' in data ? data.donnees : null;
  const refus = data && 'statut' in data ? data : null;

  function actualiser() {
    oublierLecturesRecentes();
    setRecherche(versRecherche(saisie));
    if (cleEnvoi === JSON.stringify(valeursServeur(parametres, saisie))) void refetch();
  }

  if (refus && refus.statut !== 400) return <AccesRapport module={module} statut={refus.statut} titre={titre} />;
  return (
    <PageShell
      title={titre}
      crumbs={[{ label: 'Rapports', to: cheminRapports(module) }, { label: titre }]}
      actions={<BoutonExporter chemin={cheminExportRapport(module, code)} params={envoi} nomListe={code} disabled={!issue} />}
    >
      <div className="flex flex-col gap-4">
        <FiltresRapport
          parametres={parametres}
          valeurs={saisie}
          onChange={(nom, vals) => setSaisie((s) => ({ ...s, [nom]: vals }))}
          onActualiser={actualiser}
          enCours={loading}
          erreur={refus?.message ?? null}
        />
        {manquant && <EmptyState title={`Choisissez ${manquant.libelle} pour afficher le rapport.`} />}
        {!manquant && loading && !data && <Skeleton className="h-48 w-full" />}
        {error && (
          <EmptyState
            title="Impossible de charger le rapport"
            message={error}
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Réessayer
              </Button>
            }
          />
        )}
        {!error && issue && (
          <ResultsRegion loading={loading} className="gap-4">
            {issue.avertissements.map((a) => (
              <p key={a} role="status" className="flex items-center gap-2 rounded-lg border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
                <AlertTriangle aria-hidden className="size-4 shrink-0" />
                {a}
              </p>
            ))}
            <Contenu descripteur={descripteur} resultat={issue} valeurs={appliquees} />
            <p className="text-micro text-muted-foreground">Généré le {formatDateTime(issue.genereLe)}</p>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
