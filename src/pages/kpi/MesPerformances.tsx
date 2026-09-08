import { useState } from 'react';
import { Coins, Folder, Gauge, Phone, PhoneIncoming, Sparkles, TrendingUp, UserCheck, Users } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState, ResultsRegion, StatCard } from '../../components/ui';
import PeriodeFilterBar from '../../components/kpi/PeriodeFilterBar';
import { emptyPeriode, type Periode } from '../../components/kpi/periode';
import { KpiFamilySection, RatioStat } from '../../components/kpi/KpiMarks';
import { ApiError, getMesPerformances } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatDate, formatHeures, formatNumber } from '../../lib/format';
import type { PerformanceCommercialDto } from '../../types';

/** Le 404 de cet endpoint n'est pas une panne : il dit « ce compte n'est
 * rattaché à aucune fiche employé », donc qu'il n'existe aucun commercial dont
 * parler. Il mérite son propre message, pas un bandeau d'erreur.
 *
 * Or `useApi` aplatit toute erreur en chaîne et jette le `status` (useApi.ts).
 * Plutôt que de refaire un hook de chargement à côté — avec sa garde de réponse
 * périmée à réécrire — on replie le 404 dans la **valeur de succès** : le
 * résultat devient une union discriminée que `useApi` transporte telle quelle. */
type MesPerformancesResultat =
  | { sansEmploye: true }
  | { sansEmploye: false; perf: PerformanceCommercialDto };

function chargerMesPerformances(periode: Periode): Promise<MesPerformancesResultat> {
  return getMesPerformances({ du: periode.du || undefined, au: periode.au || undefined })
    .then((perf): MesPerformancesResultat => ({ sansEmploye: false, perf }))
    .catch((err: unknown): MesPerformancesResultat => {
      if (err instanceof ApiError && err.status === 404) return { sansEmploye: true };
      throw err;
    });
}

export default function MesPerformances() {
  const [periode, setPeriode] = useState<Periode>(emptyPeriode());
  const { data: resultat, loading, error } = useApi(
    () => chargerMesPerformances(periode),
    [periode.du, periode.au],
    'kpi-moi',
  );
  const sansEmploye = resultat?.sansEmploye === true;
  const data = resultat && !resultat.sansEmploye ? resultat.perf : null;

  // Le serveur répond 200 avec tous les compteurs à zéro quand rien n’a été
  // fait : c’est une réponse valide, pas un état vide. On l’annonce en une
  // phrase au lieu d’afficher un EmptyState qui laisserait croire à une panne.
  const totalActivite =
    (data?.interactionsTotal ?? 0) + (data?.prospectionsAssignees ?? 0) + (data?.dossiersCrees ?? 0);
  const periodeVide = !!data && totalActivite === 0;

  return (
    <PageShell
      title="Mes performances"
      crumbs={[{ label: 'Profil' }, { label: 'Mes performances' }]}
      icon={<Gauge />}
      accent="var(--brand)"
      accentBg="var(--brand-bg)"
    >
      <div className="flex flex-col gap-3">
        <p className="max-w-180 text-body text-muted-foreground">
          Vos indicateurs sur la période choisie. Les compteurs suivent votre périmètre commercial :
          s’il est restreint, ils sont inférieurs à votre activité réelle.
        </p>

        <PeriodeFilterBar value={periode} onChange={setPeriode} />

        {loading && !data && !sansEmploye && <LoadingState />}
        {error && <ErrorState message={error} />}

        {sansEmploye && (
          <EmptyState
            title="Aucune fiche employé rattachée"
            message="Votre compte n’est relié à aucune fiche employé : il n’y a donc pas de commercial dont mesurer les performances. Un administrateur peut faire le rattachement depuis les comptes utilisateurs."
          />
        )}

        {!error && !sansEmploye && data && (
          <ResultsRegion loading={loading}>
            <div className="flex flex-col gap-5">
              <span className="text-micro text-muted-foreground">
                Du {formatDate(data.du)} au {formatDate(data.au)}
              </span>

              {periodeVide && (
                <Card>
                  <p className="text-body text-muted-foreground">
                    Aucune activité enregistrée sur cette période. Les compteurs ci-dessous sont donc à
                    zéro — ce n’est pas une erreur de chargement. Élargissez la période pour comparer.
                  </p>
                </Card>
              )}

              <KpiFamilySection
                titre="Activité réalisée"
                description="Ce que vous avez saisi vous-même, quelle que soit la personne à qui la prospection est assignée. Un appel passé sur la prospection d’un collègue compte ici."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                  <StatCard icon={<Phone />} label="Appels passés" value={formatNumber(data.appelsPasses)} tone="info" />
                  <StatCard icon={<PhoneIncoming />} label="Appels reçus" value={formatNumber(data.appelsRecus)} tone="neutral" />
                  <StatCard icon={<UserCheck />} label="RDV obtenus" value={formatNumber(data.rdvObtenus)} tone="success" />
                  <StatCard
                    icon={<Sparkles />}
                    label="Visites décrochées"
                    value={formatNumber(data.visitesDecrochees)}
                    sub={`${formatNumber(data.visitesRealisees)} réalisée${(data.visitesRealisees ?? 0) > 1 ? 's' : ''}`}
                    tone="progress"
                  />
                  <StatCard icon={<Users />} label="Interactions" value={formatNumber(data.interactionsTotal)} tone="neutral" />
                </div>
              </KpiFamilySection>

              <KpiFamilySection
                titre="Portefeuille confié"
                description="Les prospections qui vous sont assignées, qu’elles aient été travaillées par vous ou par quelqu’un d’autre. L’écart avec l’activité ci-dessus est normal et se lit."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                  <StatCard icon={<Users />} label="Prospections assignées" value={formatNumber(data.prospectionsAssignees)} tone="info" />
                  <StatCard icon={<UserCheck />} label="Prospections traitées" value={formatNumber(data.prospectionsTraitees)} tone="neutral" />
                  <StatCard icon={<Folder />} label="Prospections clôturées" value={formatNumber(data.prospectionsCloturees)} tone="neutral" />
                  <StatCard
                    icon={<TrendingUp />}
                    label="Délai médian de 1re réponse"
                    value={formatHeures(data.delaiMedianPremiereReponseHeures)}
                    sub="médiane, pas moyenne"
                    tone="amber"
                  />
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                  <RatioStat
                    label="Taux de prise en charge"
                    ratio={data.tauxPriseEnCharge}
                    numerateur={data.prospectionsPrisesEnCharge}
                    denominateur={data.prospectionsAssignees}
                    aide="Prospections assignées ayant reçu au moins une interaction."
                  />
                </div>
              </KpiFamilySection>

              <KpiFamilySection
                titre="Résultat"
                description="Les dossiers issus de ce portefeuille. Sur une période courte le dénominateur des taux est faible : lisez-les toujours avec l’effectif affiché sous le pourcentage."
              >
                <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                  <StatCard icon={<Folder />} label="Dossiers créés" value={formatNumber(data.dossiersCrees)} tone="success" />
                  <StatCard icon={<Coins />} label="Montant total" value={formatCurrency(data.montantTotal)} tone="progress" />
                  <StatCard icon={<TrendingUp />} label="Panier moyen" value={formatCurrency(data.panierMoyen)} tone="info" />
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                  <RatioStat
                    label="Taux appel → RDV"
                    ratio={data.tauxAppelVersRdv}
                    numerateur={data.rdvObtenus}
                    denominateur={data.appelsPasses}
                    aide="Votre efficacité au téléphone."
                  />
                  <RatioStat
                    label="Taux prospection → dossier"
                    ratio={data.tauxProspectionVersDossier}
                    numerateur={data.dossiersCrees}
                    denominateur={data.prospectionsAssignees}
                    aide="À lire avec l’effectif : très bruyant sur une période courte."
                  />
                </div>
              </KpiFamilySection>
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
