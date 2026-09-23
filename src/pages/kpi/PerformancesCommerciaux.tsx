import { useMemo, useState } from 'react';
import { Coins, Folder, ListChecks, Phone, TrendingUp, Trophy, Users } from 'lucide-react';
import { Card, EmptyState, ErrorState, LoadingState, ResultsRegion, StatCard } from '../../components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import AdminGuard from '../utilisateurs/AdminGuard';
import PeriodeFilterBar from '../../components/kpi/PeriodeFilterBar';
import { emptyPeriode, type Periode } from '../../components/kpi/periode';
import { KpiFamilySection, RankBarRow, RatioStat } from '../../components/kpi/KpiMarks';
import { listPerformancesCommerciaux } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatHeures, formatNumber, formatPercent } from '../../lib/format';
import type { PerformanceCommercialDto } from '../../types';

/** Somme d’un compteur sur tout le classement. */
function somme(rows: PerformanceCommercialDto[], pick: (r: PerformanceCommercialDto) => number | null | undefined): number {
  return rows.reduce((acc, r) => acc + (pick(r) ?? 0), 0);
}

/** Un taux d’ensemble se recalcule à partir des sommes du numérateur et du
 * dénominateur — **jamais en moyennant les pourcentages par personne**, qui est
 * un autre nombre : la moyenne de 100 % (1 dossier sur 1) et de 10 % (5 sur 50)
 * vaut 55 %, alors que le taux réel est 6/51, soit 12 %. Et comme partout,
 * dénominateur nul ⇒ `null`, pas 0. */
function tauxGlobal(numerateur: number, denominateur: number): number | null {
  return denominateur > 0 ? numerateur / denominateur : null;
}

/** Clé React d’une ligne. Depuis FEATURE-suivi-actions.md §7, un compte sans
 * fiche employé a **sa propre ligne** : `commercialId` nul, `utilisateurId`
 * renseigné. Sans ce repli, seize lignes partageraient la clé « undefined ». */
function cleLigne(r: PerformanceCommercialDto): string {
  return r.commercialId ?? r.utilisateurId ?? r.commercialNom ?? '?';
}

/** Les actions par type de tout le classement : sommes par libellé, du plus
 * au moins fréquent — le même ordre que le serveur donne par ligne. */
function actionsParTypeGlobal(rows: PerformanceCommercialDto[]): { type: string; nombre: number }[] {
  const parType = new Map<string, number>();
  for (const r of rows) {
    for (const a of r.actionsParType ?? []) {
      const type = a.type || '(sans type)';
      parType.set(type, (parType.get(type) ?? 0) + (a.nombre ?? 0));
    }
  }
  return [...parType.entries()].map(([type, nombre]) => ({ type, nombre })).sort((a, b) => b.nombre - a.nombre);
}

/** Colonnes du tableau détaillé. `sortable` porte l’accesseur numérique ; le tri
 * se fait côté client, le jeu tenant dans quelques dizaines de lignes. */
type SortKey =
  | 'dossiersCrees'
  | 'montantTotal'
  | 'appelsPasses'
  | 'interactionsTotal'
  | 'rdvObtenus'
  | 'tauxActionVersRdv'
  | 'prospectionsAssignees'
  | 'prospectionsPrisesEnCharge'
  | 'tauxPriseEnCharge'
  | 'tauxAppelVersRdv'
  | 'tauxProspectionVersDossier'
  | 'delaiMedianPremiereReponseHeures';

export default function PerformancesCommerciaux() {
  const [periode, setPeriode] = useState<Periode>(emptyPeriode());
  const [tri, setTri] = useState<SortKey | null>(null);

  const { data, loading, error } = useApi(
    () => listPerformancesCommerciaux({ du: periode.du || undefined, au: periode.au || undefined }),
    [periode.du, periode.au],
    'kpi-commerciaux',
  );

  const rows = useMemo(() => data ?? [], [data]);

  // Sans tri explicite on garde **l’ordre du serveur** : l’endpoint classe déjà
  // par dossiers créés décroissant puis appels passés. Re-trier par défaut
  // reviendrait à défaire le classement qu’on est venu lire.
  const rowsTriees = useMemo(() => {
    if (!tri) return rows;
    return [...rows].sort((a, b) => {
      const va = a[tri] ?? -1;
      const vb = b[tri] ?? -1;
      return (vb as number) - (va as number);
    });
  }, [rows, tri]);

  const totaux = useMemo(() => {
    const appelsPasses = somme(rows, (r) => r.appelsPasses);
    const rdvObtenus = somme(rows, (r) => r.rdvObtenus);
    const prospectionsAssignees = somme(rows, (r) => r.prospectionsAssignees);
    const prospectionsPrisesEnCharge = somme(rows, (r) => r.prospectionsPrisesEnCharge);
    const dossiersCrees = somme(rows, (r) => r.dossiersCrees);
    const montantTotal = somme(rows, (r) => r.montantTotal);
    const interactionsTotal = somme(rows, (r) => r.interactionsTotal);
    return {
      appelsPasses,
      rdvObtenus,
      prospectionsAssignees,
      prospectionsPrisesEnCharge,
      dossiersCrees,
      montantTotal,
      interactionsTotal,
      actionsParType: actionsParTypeGlobal(rows),
      visitesRealisees: somme(rows, (r) => r.visitesRealisees),
      panierMoyen: dossiersCrees > 0 ? montantTotal / dossiersCrees : null,
      tauxPriseEnCharge: tauxGlobal(prospectionsPrisesEnCharge, prospectionsAssignees),
      tauxAppelVersRdv: tauxGlobal(rdvObtenus, appelsPasses),
      tauxActionVersRdv: tauxGlobal(rdvObtenus, interactionsTotal),
      tauxProspectionVersDossier: tauxGlobal(dossiersCrees, prospectionsAssignees),
    };
  }, [rows]);

  const maxDossiers = Math.max(0, ...rows.map((r) => r.dossiersCrees ?? 0));
  const maxAppels = Math.max(0, ...rows.map((r) => r.appelsPasses ?? 0));
  const maxActionsParType = Math.max(0, ...totaux.actionsParType.map((a) => a.nombre));
  /** Comptes sans fiche employé, à signaler sous le classement : leurs
   * actions comptent, leur portefeuille est vide par construction. */
  const comptesSansEmploye = rows.filter((r) => !r.commercialId && r.utilisateurId).length;

  function enTete(key: SortKey, libelle: string, classe = 'text-right') {
    return (
      <TableHead className={classe}>
        <button
          type="button"
          className="cursor-pointer hover:text-foreground"
          aria-pressed={tri === key}
          onClick={() => setTri((t) => (t === key ? null : key))}
        >
          {libelle}
          {tri === key && <span aria-hidden> ↓</span>}
        </button>
      </TableHead>
    );
  }

  return (
    <AdminGuard
      title="Performances commerciales"
      crumbs={[{ label: 'Ventes' }, { label: 'Suivi' }, { label: 'Performances commerciales' }]}
      icon={<Trophy />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
        {/* La description de la page a été retirée, cet avertissement non : il
            change ce que le classement veut dire. Sans lui, une vingtaine de
            lignes se lisent comme l'effectif complet alors que c'est le nombre
            de personnes actives sur la période. Réduit à une ligne, gardé
            contre le tableau qu'il qualifie. */}
        <p className="text-micro text-muted-foreground">
          <strong className="font-medium text-foreground">Seuls les commerciaux actifs</strong> sur
          la période y figurent — une interaction, une prospection assignée ou un dossier. Ce n’est
          pas l’effectif complet.
        </p>

        <PeriodeFilterBar value={periode} onChange={setPeriode} />

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}

        {!error && data && (
          <ResultsRegion loading={loading}>
            {rows.length === 0 ? (
              <EmptyState
                title="Aucune activité sur la période"
                message="Aucun commercial n’a d’interaction, de prospection assignée ni de dossier sur cet intervalle. Élargissez la période."
              />
            ) : (
              /* Redesign 20/09 : la page ne défile plus — le filtre de
                 période reste épinglé, cette zone de résultats porte le
                 seul défilement. */
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                <KpiFamilySection
                  titre={`Ensemble de la période — ${rows.length} commercial${rows.length > 1 ? 'aux' : ''} actif${rows.length > 1 ? 's' : ''}`}
                  description="Les compteurs sont des sommes ; les taux sont recalculés depuis les totaux, jamais moyennés entre les personnes. Le délai médian de première réponse n’apparaît pas ici : une médiane de médianes n’a pas de sens, il se lit par ligne dans le tableau."
                >
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                    <StatCard icon={<Folder />} label="Dossiers créés" value={formatNumber(totaux.dossiersCrees)} tone="success" />
                    <StatCard icon={<Coins />} label="Montant total" value={formatCurrency(totaux.montantTotal)} tone="progress" />
                    <StatCard icon={<TrendingUp />} label="Panier moyen" value={formatCurrency(totaux.panierMoyen)} tone="info" />
                    <StatCard icon={<ListChecks />} label="Actions" value={formatNumber(totaux.interactionsTotal)} sub="hors « Système »" tone="neutral" />
                    <StatCard icon={<Phone />} label="Appels passés" value={formatNumber(totaux.appelsPasses)} tone="info" />
                    <StatCard icon={<Users />} label="Prospections assignées" value={formatNumber(totaux.prospectionsAssignees)} tone="neutral" />
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                    <RatioStat
                      label="Taux de prise en charge"
                      ratio={totaux.tauxPriseEnCharge}
                      numerateur={totaux.prospectionsPrisesEnCharge}
                      denominateur={totaux.prospectionsAssignees}
                      aide="Prospections assignées ayant reçu au moins une interaction."
                    />
                    <RatioStat
                      label="Taux action → RDV"
                      ratio={totaux.tauxActionVersRdv}
                      numerateur={totaux.rdvObtenus}
                      denominateur={totaux.interactionsTotal}
                      aide="Les rendez-vous rapportés à toute l’activité, pas seulement au téléphone."
                    />
                    <RatioStat
                      label="Taux appel → RDV"
                      ratio={totaux.tauxAppelVersRdv}
                      numerateur={totaux.rdvObtenus}
                      denominateur={totaux.appelsPasses}
                    />
                    <RatioStat
                      label="Taux prospection → dossier"
                      ratio={totaux.tauxProspectionVersDossier}
                      numerateur={totaux.dossiersCrees}
                      denominateur={totaux.prospectionsAssignees}
                      aide="Très bruyant sur une période courte."
                    />
                  </div>
                </KpiFamilySection>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <Card title="Classement — dossiers créés">
                    <div className="flex flex-col">
                      {rows.map((r) => (
                        <RankBarRow
                          key={`${cleLigne(r)}-dossiers`}
                          label={r.commercialNom || '—'}
                          value={r.dossiersCrees ?? 0}
                          max={maxDossiers}
                          sub={r.montantTotal ? formatCurrency(r.montantTotal) : undefined}
                        />
                      ))}
                    </div>
                  </Card>
                  <Card title="Classement — appels passés">
                    <div className="flex flex-col">
                      {[...rows]
                        .sort((a, b) => (b.appelsPasses ?? 0) - (a.appelsPasses ?? 0))
                        .map((r) => (
                          <RankBarRow
                            key={`${cleLigne(r)}-appels`}
                            label={r.commercialNom || '—'}
                            value={r.appelsPasses ?? 0}
                            max={maxAppels}
                            sub={`${formatNumber(r.rdvObtenus)} RDV`}
                          />
                        ))}
                    </div>
                  </Card>
                  {/* Le détail de « Actions » par type, sommé sur le classement :
                      téléphone sortant, visite, note, message… La somme des
                      barres égale la carte « Actions » au-dessus. */}
                  <Card title="Actions par type">
                    <div className="flex flex-col">
                      {totaux.actionsParType.length === 0 ? (
                        <p className="text-body text-muted-foreground">Aucune action sur la période.</p>
                      ) : (
                        totaux.actionsParType.map((a) => (
                          <RankBarRow key={a.type} label={a.type} value={a.nombre} max={maxActionsParType} />
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                <Card title="Détail par commercial" padded={false}>
                  <div className="overflow-x-auto">
                    <Table className="min-w-280">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Commercial</TableHead>
                          {enTete('interactionsTotal', 'Actions')}
                          {enTete('appelsPasses', 'Appels')}
                          {enTete('rdvObtenus', 'RDV')}
                          <TableHead className="text-right">Visites</TableHead>
                          {enTete('prospectionsAssignees', 'Prosp. assignées')}
                          {enTete('prospectionsPrisesEnCharge', 'Prises en charge')}
                          {enTete('tauxPriseEnCharge', 'Taux prise en charge')}
                          {enTete('delaiMedianPremiereReponseHeures', 'Délai médian 1re rép.')}
                          {enTete('dossiersCrees', 'Dossiers')}
                          {enTete('montantTotal', 'Montant')}
                          {enTete('tauxActionVersRdv', 'Action → RDV')}
                          {enTete('tauxAppelVersRdv', 'Appel → RDV')}
                          {enTete('tauxProspectionVersDossier', 'Prosp. → dossier')}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rowsTriees.map((r) => (
                          <TableRow key={cleLigne(r)} className="hover:bg-muted/40">
                            <TableCell className="font-medium text-foreground">
                              {r.commercialNom || '—'}
                              {/* Un compte sans fiche employé : ses actions comptent,
                                  son portefeuille est vide par construction. */}
                              {!r.commercialId && r.utilisateurId && (
                                <span className="text-micro font-normal text-muted-foreground"> (compte)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(r.interactionsTotal)}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(r.appelsPasses)}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(r.rdvObtenus)}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {formatNumber(r.visitesRealisees)}
                              <span className="text-micro"> / {formatNumber(r.visitesDecrochees)} décr.</span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(r.prospectionsAssignees)}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(r.prospectionsPrisesEnCharge)}</TableCell>
                            {/* Chaque taux porte sa fraction : sur une période courte le
                                dénominateur est faible et le pourcentage seul induit en erreur. */}
                            <TableCell className="text-right tabular-nums text-foreground">
                              {formatPercent(r.tauxPriseEnCharge)}
                              <span className="text-micro text-muted-foreground">
                                {' '}({formatNumber(r.prospectionsPrisesEnCharge)}/{formatNumber(r.prospectionsAssignees)})
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {formatHeures(r.delaiMedianPremiereReponseHeures)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium text-foreground">{formatNumber(r.dossiersCrees)}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(r.montantTotal)}</TableCell>
                            <TableCell className="text-right tabular-nums text-foreground">
                              {formatPercent(r.tauxActionVersRdv)}
                              <span className="text-micro text-muted-foreground">
                                {' '}({formatNumber(r.rdvObtenus)}/{formatNumber(r.interactionsTotal)})
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-foreground">
                              {formatPercent(r.tauxAppelVersRdv)}
                              <span className="text-micro text-muted-foreground">
                                {' '}({formatNumber(r.rdvObtenus)}/{formatNumber(r.appelsPasses)})
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-foreground">
                              {formatPercent(r.tauxProspectionVersDossier)}
                              <span className="text-micro text-muted-foreground">
                                {' '}({formatNumber(r.dossiersCrees)}/{formatNumber(r.prospectionsAssignees)})
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <p className="max-w-180 text-micro text-muted-foreground">
                  L’activité (actions de tout type, hors « Système ») est comptée pour celui qui l’a
                  saisie ; le portefeuille (prospections assignées, dossiers) pour le commercial
                  assigné. Un responsable qui appelle sur la prospection d’un commercial voit l’appel
                  chez lui — l’écart entre les deux familles est volontaire et se lit.
                  {comptesSansEmploye > 0 && (
                    <>
                      {' '}Les lignes marquées « (compte) » sont des comptes sans fiche employé :
                      leurs actions comptent, ils n’ont pas de portefeuille.
                    </>
                  )}
                </p>
              </div>
            )}
          </ResultsRegion>
        )}
      </div>
    </AdminGuard>
  );
}
