import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import BoutonExporter from '../../components/BoutonExporter';
import PageShell from '../../components/PageShell';
import FiltresRapport from '../../components/rapports/FiltresRapport';
import SectionRapport from '../../components/rapports/SectionRapport';
import DetailMoisPrevisions from '../../components/suiviPrevisions/DetailMoisPrevisions';
import { ResultsRegion, EmptyState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { oublierLecturesRecentes } from '../../lib/api';
import { cheminExportSuiviPrevisions, getParametresSuiviPrevisions, getSuiviPrevisions } from '../../lib/apiSuiviPrevisions';
import { formatDateTime } from '../../lib/format';
import { enIssue, lireValeurs, parametreManquant, valeursDe, valeursServeur, versRecherche } from '../../lib/rapports';
import { useApi } from '../../lib/useApi';
import type { ParametreRapportDto } from '../../types/rapports';

const TITRE = 'Suivi des prévisions de vente';
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function Reessayer({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Réessayer
    </Button>
  );
}

function Suivi({ parametres }: Readonly<{ parametres: ParametreRapportDto[] }>) {
  const [recherche, setRecherche] = useSearchParams();
  const cleUrl = recherche.toString();
  const appliquees = useMemo(() => lireValeurs(parametres, new URLSearchParams(cleUrl)), [parametres, cleUrl]);
  const [saisie, setSaisie] = useState(appliquees);
  const [cleVue, setCleVue] = useState(cleUrl);
  const [mois, setMois] = useState<number | null>(null);
  if (cleVue !== cleUrl) {
    setCleVue(cleUrl);
    setSaisie(appliquees);
  }

  const envoi = valeursServeur(parametres, appliquees);
  const cleEnvoi = JSON.stringify(envoi);
  const manquant = parametreManquant(parametres, envoi);
  const { data, loading, error, refetch } = useApi(
    () => (manquant ? Promise.resolve(null) : enIssue(getSuiviPrevisions(envoi), [400])),
    [cleEnvoi],
  );
  const issue = data && 'donnees' in data ? data.donnees : null;
  const refus = data && 'statut' in data ? data : null;

  const tranches = parametres.find((p) => p.nom === 'trancheId');
  const aucuneTranche = tranches !== undefined && tranches.options.length === 0;
  const choisies = valeursDe(envoi, 'trancheId');
  const libellesTranches = (tranches?.options ?? []).filter((o) => choisies.includes(o.valeur)).map((o) => o.libelle);
  const portee = libellesTranches.length > 0 ? libellesTranches.join(', ') : 'Tous les projets';
  const annee = valeursDe(envoi, 'annee')[0] ?? '';

  function actualiser() {
    oublierLecturesRecentes();
    setRecherche(versRecherche(saisie));
    if (cleEnvoi === JSON.stringify(valeursServeur(parametres, saisie))) void refetch();
  }

  return (
    <PageShell title={TITRE} actions={<BoutonExporter chemin={cheminExportSuiviPrevisions()} params={envoi} nomListe="suivi-previsions" disabled={!issue} />}>
      <div className="flex flex-col gap-4">
        <FiltresRapport
          parametres={parametres}
          valeurs={saisie}
          onChange={(nom, vals) => setSaisie((s) => ({ ...s, [nom]: vals }))}
          onActualiser={actualiser}
          enCours={loading}
          erreur={refus?.message ?? null}
        />
        {aucuneTranche && <EmptyState title="Aucune tranche visible pour votre profil." />}
        {!manquant && loading && !data && <Skeleton className="h-48 w-full" />}
        {error && <EmptyState title="Impossible de charger le suivi des prévisions" message={error} action={<Reessayer onClick={() => void refetch()} />} />}
        {!error && issue && (
          <ResultsRegion loading={loading} className="gap-4">
            {issue.avertissements.map((a) => (
              <p key={a} role="status" className="flex items-center gap-2 rounded-lg border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
                <AlertTriangle aria-hidden className="size-4 shrink-0" />
                {a}
              </p>
            ))}
            <div className="flex flex-wrap gap-2">
              {MOIS.map((m, i) => (
                <Button key={m} type="button" variant="outline" size="sm" onClick={() => setMois(i + 1)}>
                  Détail : {m}
                </Button>
              ))}
            </div>
            {issue.sections.map((s) => (
              <SectionRapport key={s.id} section={s} />
            ))}
            <p className="text-micro text-muted-foreground">Généré le {formatDateTime(issue.genereLe)}</p>
          </ResultsRegion>
        )}
      </div>
      {mois !== null && <DetailMoisPrevisions titre={`${MOIS[mois - 1]} ${annee} — ${portee}`} mois={mois} valeurs={envoi} onClose={() => setMois(null)} />}
    </PageShell>
  );
}

export default function SuiviPrevisions() {
  const { data, error, refetch } = useApi(() => getParametresSuiviPrevisions(), []);
  if (error) {
    return (
      <PageShell title={TITRE}>
        <EmptyState title="Impossible de charger le suivi des prévisions" message={error} action={<Reessayer onClick={() => void refetch()} />} />
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell title={TITRE}>
        <Skeleton className="h-48 w-full" />
      </PageShell>
    );
  }
  return <Suivi parametres={data} />;
}
