import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Ban, ClipboardCheck, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CadreFiche, { EnteteFiche } from '../../components/CadreFiche';
import FicheShell, { OngletsLigne } from '../../components/FicheShell';
import { ChampLecture, GrilleFiche } from '../../components/ChampsFiche';
import { PointerReglementModal, ReglementDocumentsJoints } from '../../components/ReglementPreuves';
import { messageErreurStatut } from '../../lib/reglementRegles';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { getEncaissement, modifierStatutReglement } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../lib/confirmContext';
import {
  encaissementCompteDansLesTotaux,
  encaissementEtatLabel,
  encaissementEtatTone,
  reglementModifiable,
} from '../../lib/domain';
import BoutonsRecu from '../../components/encaissements/BoutonsRecu';
import type { EncaissementDetailDto } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format';

type EncaissementTab = 'affectations' | 'documents';

type PanneauTab = 'montants' | 'tracabilite';

export default function EncaissementDetail() {
  const { id = '' } = useParams();
  return <FicheEncaissement key={id} id={id} />;
}

function FicheEncaissement({ id }: Readonly<{ id: string }>) {
  const { data: e, loading, error, refetch } = useApi(() => getEncaissement(id), [id]);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [tab, setTab] = useState<EncaissementTab>('affectations');
  const [panneauTab, setPanneauTab] = useState<PanneauTab>('montants');
  const [pointageOuvert, setPointageOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreurStatut, setErreurStatut] = useState<string | null>(null);

  if (loading && !e) return <PageShell title="Encaissement"><LoadingState /></PageShell>;
  if (error) {
    return (
      <PageShell title="Encaissement" crumbs={[{ label: 'Ventes' }, { label: 'Encaissements', to: '/encaissements' }]}>
        <ErrorState message={error} />
      </PageShell>
    );
  }
  if (!e) {
    return (
      <PageShell title="Encaissement introuvable" crumbs={[{ label: 'Ventes' }, { label: 'Encaissements', to: '/encaissements' }]}>
        <p>Ce règlement n'existe pas.</p>
      </PageShell>
    );
  }

  const affectations = e.affectations ?? [];
  const dossiers = new Set(affectations.map((a) => a.dossierCode).filter(Boolean));
  const totalAffecte = affectations.reduce((s, a) => s + (a.montantAffecte ?? 0), 0);
  const { affecteCompte, libelleTotalAffecte, dossierRecu } = syntheseAffectations(e);

  /* Portée des endpoints de preuve et de pointage (`/api/dossiers/{id}/reglements/…`) :
     le serveur accepte n'importe quel dossier des affectations. Le repli couvre
     un `dossierId` que le DTO déclare optionnel. */
  const dossierPortee = e.dossierId ?? affectations[0]?.dossierId;
  const modifiable = reglementModifiable(e.etat);

  const intitule = [
    e.typeLibelle,
    e.banqueNom,
    e.reference ? `N° ${e.reference}` : null,
    e.dateDocument ? `du ${formatDate(e.dateDocument)}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  async function annuler() {
    if (!e || !dossierPortee) return;
    const ok = await confirm({
      title: 'Annuler le règlement',
      message: `Annuler définitivement ce règlement de ${formatCurrency(e.montantBrut)} ? Cet état est terminal : il ne pourra plus être pointé.`,
      confirmLabel: 'Annuler le règlement',
      cancelLabel: 'Revenir',
    });
    if (!ok) return;
    setBusy(true);
    setErreurStatut(null);
    try {
      await modifierStatutReglement(dossierPortee, e.id, { statut: 'CANCELED' });
      void refetch();
    } catch (err) {
      setErreurStatut(messageErreurStatut(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CadreFiche
      title={intitule || e.reference || 'Règlement'}
      crumbs={[{ label: 'Ventes' }, { label: 'Encaissements', to: '/encaissements' }]}
      fullHeight
      icon={<Wallet />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      entete={
        <EnteteFiche code={e.reference} nom={intitule || 'Règlement'}>
          <Badge tone={encaissementEtatTone(e.etat)}>{encaissementEtatLabel(e.etat)}</Badge>
          {/* Deux encodages du même fait, écrits ensemble par le serveur — pointer sans date est un 400. */}
          <span
            className="text-micro text-muted-foreground"
            title="Date d'encaissement effectif, écrite par le pointage. Vide tant que le règlement est en cours."
          >
            {e.dateReglement ? `pointé le ${formatDate(e.dateReglement)}` : 'non pointé'}
          </span>
          <Badge tone={e.comptabilise ? 'success' : 'neutral'}>
            {e.comptabilise ? 'Comptabilisé' : 'Non comptabilisé'}
          </Badge>
          {e.remisAuCentre && <Badge tone="info">Remis au centre</Badge>}
          <span className="text-label font-semibold tabular-nums text-foreground">{formatCurrency(e.montantBrut)}</span>
        </EnteteFiche>
      }
      actions={
        <span className="flex items-center gap-2">
          {dossierRecu && <BoutonsRecu dossierId={dossierRecu} reglementId={e.id} reference={e.reference} />}
          <Button variant="outline" size="sm" onClick={() => navigate('/encaissements')}>
            Retour à la liste
          </Button>
        </span>
      }
    >
      <FicheShell
        ongletActif={tab}
        onOngletChange={(v) => setTab(v as EncaissementTab)}
        /* Lecture seule : `/api/encaissements/{id}` n'est servi qu'en GET. Seul le
           statut s'écrit, par la barre d'action. */
        formulaire={
          <Card padded={false} className="h-full">
            <div className="p-3">
              <GrilleFiche>
                <ChampLecture label="Entité" valeur={e.entiteLibelle} />
                <ChampLecture label="Date pièce" valeur={formatDate(e.dateDocument)} />
                <ChampLecture label="Échéance" valeur={formatDate(e.dateEcheance)} />
                <ChampLecture label="Type" valeur={e.typeLibelle} />
                <ChampLecture label="Référence" valeur={e.reference} />
                <ChampLecture label="Banque" valeur={e.banqueNom} />
                <ChampLecture label="Compte" valeur={e.compteCode} />
                <ChampLecture label="Dépôt" valeur={e.depotCode} />

                <ChampLecture label="Tiers réglant" valeur={e.tierNom} />
                {/* Le payeur peut différer du tiers du règlement : pas un doublon. */}
                <ChampLecture label="Versement effectué par" valeur={e.tierPayeurNom} />
                <ChampLecture label="N° de reçu" valeur={e.recuCode} />
                <ChampLecture label="Libellé" valeur={e.description} multiligne />
                {e.notes && <ChampLecture label="Notes" valeur={e.notes} multiligne apres={8} />}
              </GrilleFiche>
            </div>
          </Card>
        }
        panneau={
          <Card padded={false} className="flex h-full flex-col">
            <Tabs
              value={panneauTab}
              onValueChange={(v) => setPanneauTab(v as PanneauTab)}
              className="flex min-h-0 flex-1 flex-col gap-2 p-3"
            >
              <OngletsLigne
                onglets={[
                  { id: 'montants', libelle: 'Montants' },
                  { id: 'tracabilite', libelle: 'Traçabilité' },
                ]}
              />

              <TabsContent value="montants" className="min-h-0 flex-1 overflow-auto">
                <table className="w-full text-body">
                  <tbody>
                    <LigneMontant libelle="Montant brut" valeur={e.montantBrut} fort />
                    <LigneMontant libelle="Montant affecté" valeur={affecteCompte} />
                    <LigneMontant libelle="Reste à affecter" valeur={e.montantBrutRestant} alerte />
                    <LigneMontant libelle="Montant net" valeur={e.montantNet} separe />
                    <LigneMontant libelle="Montant base" valeur={e.montantBase} />
                  </tbody>
                </table>
              </TabsContent>

              <TabsContent value="tracabilite" className="min-h-0 flex-1 overflow-auto">
                <FieldGrid>
                  <Field label="Remis au centre" value={e.remisAuCentre ? 'Oui' : 'Non'} />
                  <Field label="Date de remise" value={formatDate(e.dateRemiseAuCentre)} />
                  <Field label="Bordereau" value={e.bordereauCode} />
                  <Field label="Date de bordereau" value={formatDate(e.dateBordereau)} />
                </FieldGrid>
                <div className="mt-2 border-t border-border pt-2">
                  <FieldGrid>
                    <Field label="Saisi par" value={e.creePar} />
                    <Field label="Saisi le" value={formatDateTime(e.creeLe)} />
                    <Field label="Modifié par" value={e.modifiePar} />
                    <Field label="Modifié le" value={formatDateTime(e.modifieLe)} />
                  </FieldGrid>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        }
        /* Montée sur `IN_WORK` seulement : `POINTED` et `CANCELED` sont terminaux
           côté serveur (409). */
        barreAction={
          modifiable && dossierPortee ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-2">
              <span className="text-label font-medium text-foreground">Règlement en cours</span>
              <span className="min-w-0 text-micro text-muted-foreground">
                Le pointage constate l'encaissement. Il exige une date et au moins une preuve de paiement — déposez-la
                dans l'onglet « Documents joints ».
              </span>
              {erreurStatut && <span className="text-micro text-destructive">{erreurStatut}</span>}
              <div className="ml-auto flex items-center gap-1.5">
                <Button variant="ghost" size="sm" disabled={busy} onClick={annuler}>
                  <Ban data-icon="inline-start" /> Annuler le règlement
                </Button>
                <Button size="sm" disabled={busy} onClick={() => setPointageOuvert(true)}>
                  <ClipboardCheck data-icon="inline-start" /> Pointer
                </Button>
              </div>
            </div>
          ) : undefined
        }
        onglets={[
          {
            id: 'affectations',
            libelle: 'Affectations',
            compteur: affectations.length,
            contenu: (
              affectations.length === 0 ? (
                <EmptyState
                  title="Pas encore imputé"
                  message="Ce règlement est encaissé mais n'a été affecté à aucune échéance."
                />
              ) : (
                <>
                  {dossiers.size > 1 && (
                    <p className="border-b border-border px-3 py-2 text-body text-muted-foreground">
                      Ce règlement solde des échéances de{' '}
                      <strong className="text-foreground">{dossiers.size} dossiers</strong>.
                    </p>
                  )}
                  {/* `overflow-visible` : le panneau d'onglet défile, l'en-tête y colle. */}
                  <Table containerClassName="overflow-visible">
                    <TableHeader className="sticky top-0 z-1">
                      <TableRow className="hover:bg-card">
                        <TableHead>Dossier</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Affecté</TableHead>
                        <TableHead className="text-right">Montant échéance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affectations.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            {a.dossierId ? (
                              <Link to={`/dossiers/${a.dossierId}`} className="text-(--info) hover:underline">
                                {a.dossierCode || 'Voir'}
                              </Link>
                            ) : (
                              a.dossierCode
                            )}
                          </TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.echeanceCode}>
                            {a.echeanceDescription || a.echeanceCode}
                          </TableCell>
                          <TableCell>{a.categorie ? <Badge tone="neutral">{a.categorie}</Badge> : null}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(a.dateEcheance)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatCurrency(a.montantAffecte)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(a.montantEcheance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell colSpan={4} className="text-micro text-muted-foreground">
                          {libelleTotalAffecte}
                        </TableCell>
                        <TableCell className="text-right text-micro font-semibold tabular-nums">
                          {formatCurrency(totalAffecte)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </>
              )
            ),
          },
          {
            id: 'documents',
            libelle: 'Documents joints',
            contenu: dossierPortee ? (
              <ReglementDocumentsJoints
                dossierId={dossierPortee}
                reglementId={e.id}
                statut={e.etat}
                /* Les preuves conditionnent le pointage : un dépôt doit débloquer la
                   barre d'action sans recharger. */
                onChanged={refetch}
              />
            ) : (
              <EmptyState
                title="Preuves indisponibles"
                message="Les justificatifs sont rattachés au dossier portant l'échéance, et ce règlement n'en désigne aucun."
              />
            ),
          },
        ]}
      />

      {pointageOuvert && dossierPortee && (
        <PointerReglementModal
          dossierId={dossierPortee}
          /* `EncaissementDetailDto` et `ReglementDto` décrivent la même ligne
             `StlSettlement` sous d'autres noms, cf. `ReglementAPointer`. */
          reglement={{
            id: e.id,
            montant: e.montantBrut,
            typeLibelle: e.typeLibelle,
            payeurNom: e.tierPayeurNom,
          }}
          onClose={() => setPointageOuvert(false)}
          onPointed={refetch}
        />
      )}
    </CadreFiche>
  );
}

function syntheseAffectations(e: EncaissementDetailDto) {
  const annule = !encaissementCompteDansLesTotaux(e.etat);
  return {
    // Affecté du serveur (brut − restant) : 0 pour un règlement annulé, dont les affectations restent listées.
    affecteCompte: (e.montantBrut ?? 0) - (e.montantBrutRestant ?? 0),
    libelleTotalAffecte: annule ? 'Total affecté (règlement annulé : hors totaux)' : 'Total affecté',
    // Le reçu est un document du dossier : celui de la première affectation.
    dossierRecu: e.affectations?.[0]?.dossierId,
  };
}

function couleurMontant(colore: boolean | undefined, fort: boolean | undefined): string {
  if (colore) return 'font-semibold text-(--warning)';
  return fort ? '' : 'text-foreground';
}

function LigneMontant({
  libelle,
  valeur,
  fort,
  alerte,
  separe,
}: Readonly<{
  libelle: string;
  valeur: number | undefined;
  fort?: boolean;
  alerte?: boolean;
  separe?: boolean;
}>) {
  const reste = valeur ?? 0;
  const colore = alerte && Math.abs(reste) > 0.005;
  return (
    <tr className={separe ? 'border-t border-border' : undefined}>
      <th scope="row" className="py-1 pr-2 text-left text-body font-normal text-muted-foreground">
        {libelle}
      </th>
      <td
        className={[
          'py-1 text-right tabular-nums',
          fort ? 'text-label font-semibold text-foreground' : 'text-body',
          couleurMontant(colore, fort),
        ].join(' ')}
      >
        {formatCurrency(valeur)}
      </td>
    </tr>
  );
}
