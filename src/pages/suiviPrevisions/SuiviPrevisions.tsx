import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import SectionRapport from '../../components/rapports/SectionRapport';
import DetailMoisPrevisions from '../../components/suiviPrevisions/DetailMoisPrevisions';
import { ResultsRegion, EmptyState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { oublierLecturesRecentes } from '../../lib/api';
import { cheminExportSuiviPrevisions, getParametresSuiviPrevisions, getSuiviPrevisions } from '../../lib/apiSuiviPrevisions';
import { formatDateTime } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection } from '../../lib/pucesFiltres';
import { enIssue, lireValeurs, parametreManquant, valeursDe, valeursParDefaut, valeursServeur, versRecherche } from '../../lib/rapports';
import { useExportListe } from '../../lib/useExportListe';
import { useApi } from '../../lib/useApi';
import type { ParametreRapportDto } from '../../types/rapports';

const TITRE = 'Suivi des prévisions de vente';
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const TYPES_A_OPTIONS = new Set(['TRANCHES', 'COMMERCIAUX', 'CHOIX']);

function Reessayer({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Réessayer
    </Button>
  );
}

function Coque({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <PageListe titre={TITRE}>
      <EnteteListe titre={TITRE} />
      <div className="px-3 pt-2">{children}</div>
    </PageListe>
  );
}

/** Une boîte par paramètre à options ; l'année et les autres saisies libres vont dans les champs du panneau. */
function BoitesParametres({
  parametres,
  saisie,
  changer,
}: Readonly<{ parametres: ParametreRapportDto[]; saisie: Record<string, string[]>; changer: (nom: string, vals: string[]) => void }>) {
  return parametres
    .filter((p) => TYPES_A_OPTIONS.has(p.type))
    .map((p) => {
      const items = p.options.map((o) => ({ label: o.libelle, value: o.valeur }));
      const choisies = valeursDe(saisie, p.nom);
      if (p.multiple) {
        return <BoiteFiltre key={p.nom} titre={p.libelle} mode="multiple" items={items} valeur={choisies} onChange={(v) => changer(p.nom, v)} />;
      }
      return (
        <BoiteFiltre key={p.nom} titre={p.libelle} mode="unique" items={items} valeur={choisies[0] ?? null} onChange={(v) => changer(p.nom, v ? [v] : [])} />
      );
    });
}

function ChampsSaisie({
  parametres,
  saisie,
  changer,
}: Readonly<{ parametres: ParametreRapportDto[]; saisie: Record<string, string[]>; changer: (nom: string, vals: string[]) => void }>) {
  return parametres
    .filter((p) => !TYPES_A_OPTIONS.has(p.type) && p.type !== 'DATE' && p.type !== 'BOOLEEN')
    .map((p) => (
      <Input
        key={p.nom}
        type={p.type === 'ANNEE' || p.type === 'ENTIER' ? 'number' : 'text'}
        aria-label={p.libelle}
        placeholder={p.libelle}
        className="w-28"
        value={valeursDe(saisie, p.nom).at(0) ?? ''}
        onChange={(e) => changer(p.nom, e.target.value ? [e.target.value] : [])}
      />
    ));
}

function Suivi({ parametres }: Readonly<{ parametres: ParametreRapportDto[] }>) {
  const [recherche, setRecherche] = useSearchParams();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('suivi-previsions'));
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
  const exportListe = useExportListe(cheminExportSuiviPrevisions(), envoi, 'suivi-previsions');

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

  function changer(nom: string, vals: string[]) {
    setSaisie((s) => ({ ...s, [nom]: vals }));
  }

  const puces = parametres
    .filter((p) => TYPES_A_OPTIONS.has(p.type))
    .flatMap((p) => puceSelection(p.libelle, p.options.map((o) => ({ label: o.libelle, value: o.valeur })), valeursDe(saisie, p.nom)));
  const decompte = issue ? `Généré le ${formatDateTime(issue.genereLe)}` : undefined;

  return (
    <PageListe titre={TITRE}>
      <EnteteListe titre={TITRE} lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        onReinitialiser={() => setSaisie(valeursParDefaut(parametres))}
        champs={<ChampsSaisie parametres={parametres} saisie={saisie} changer={changer} />}
      >
        <BoitesParametres parametres={parametres} saisie={saisie} changer={changer} />
      </PanneauFiltresCoches>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-3 pt-2 pb-16">
        {refus && (
          <p role="alert" className="text-body text-destructive">
            {refus.message}
          </p>
        )}
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
          </ResultsRegion>
        )}
      </div>
      {mois !== null && <DetailMoisPrevisions titre={`${MOIS[mois - 1]} ${annee} — ${portee}`} mois={mois} valeurs={envoi} onClose={() => setMois(null)} />}
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="suivi-previsions"
        ligneSelectionnee={false}
        actions={[{ id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: !issue || exportListe.enCours }]}
        propres={[{ id: 'actualiser', libelle: 'Actualiser', icone: RefreshCw, onClick: actualiser, disabled: loading }]}
      />
    </PageListe>
  );
}

export default function SuiviPrevisions() {
  const { data, error, refetch } = useApi(() => getParametresSuiviPrevisions(), []);
  if (error) {
    return (
      <Coque>
        <EmptyState title="Impossible de charger le suivi des prévisions" message={error} action={<Reessayer onClick={() => void refetch()} />} />
      </Coque>
    );
  }
  if (!data) {
    return (
      <Coque>
        <Skeleton className="h-48 w-full" />
      </Coque>
    );
  }
  return <Suivi parametres={data} />;
}
