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
import { encaissementEtatLabel, encaissementEtatTone, reglementModifiable } from '../../lib/domain';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format';

/** La zone large, en bas — les deux onglets du logiciel de bureau pour
 * lesquels un endpoint existe. Le troisième, « Historique », n'en a aucun :
 * un onglet vide coûte un clic pour apprendre qu'il n'y a rien. */
type EncaissementTab = 'affectations' | 'documents';

/** Le panneau étroit, à droite du formulaire. */
type PanneauTab = 'montants' | 'tracabilite';

export default function EncaissementDetail() {
  const { id } = useParams();
  const { data: e, loading, error, refetch } = useApi(() => getEncaissement(id!), [id]);
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
  /* Combien de dossiers ce règlement touche réellement. Mesuré sur les 332
     règlements servis : 7 en touchent plusieurs, et ce sont précisément ceux
     que la liste présentait de travers, en n'affichant que le premier. */
  const dossiers = new Set(affectations.map((a) => a.dossierCode).filter(Boolean));
  const totalAffecte = affectations.reduce((s, a) => s + (a.montantAffecte ?? 0), 0);

  /* Le dossier qui sert de portée aux endpoints de preuve et de pointage, tous
     scopés `/api/dossiers/{id}/reglements/{reglementId}/…`. Mesuré sur les 332
     règlements : `dossierId` est toujours renseigné et toujours l'un des
     dossiers des affectations — et sur les 7 règlements à cheval, le serveur
     accepte **n'importe lequel** d'entre eux. Le repli sur la première
     affectation ne couvre donc aucun cas réel connu ; il évite seulement de
     faire dépendre l'écran d'un champ que le DTO déclare optionnel. */
  const dossierPortee = e.dossierId ?? affectations[0]?.dossierId;
  const modifiable = reglementModifiable(e.etat);

  /* Le titre du logiciel de bureau, reconstitué : « CHÈQUE CIH N° 2007416 du
     31/12/2025 ». C'est ainsi que le comptable nomme la pièce à l'oral, et
     aucun champ ne le porte seul. */
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
      refetch();
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
      /* Ligne 1 — la barre de titre de la pièce du logiciel de bureau
         (« CHÈQUE CIH N° 2007416 du 31/12/2025 ») plus son état. Référence,
         type, banque, date de pièce et date de pointage n'y sont donc plus
         répétés dans la grille ; tiers et entité restent dans la grille. */
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
        <Button variant="outline" size="sm" onClick={() => navigate('/encaissements')}>
          Retour à la liste
        </Button>
      }
    >
      <FicheShell
        ongletActif={tab}
        onOngletChange={(v) => setTab(v as EncaissementTab)}
        /* ---------------------------------------------------------------
           Bande 2a — le formulaire, les deux colonnes de champs du logiciel de
           bureau réunies. **En lecture seule, et ce n'est pas un choix** :
           `/api/encaissements/{id}` est servi en GET uniquement. La seule
           écriture possible sur un règlement est son statut, portée par la
           barre d'action plus bas.
           --------------------------------------------------------------- */
        formulaire={
          <Card padded={false} className="h-full">
            <div className="p-3">
              <GrilleFiche>
                <ChampLecture label="Entité" valeur={e.entiteLibelle} />
                <ChampLecture label="Échéance" valeur={formatDate(e.dateEcheance)} />
                <ChampLecture label="Compte" valeur={e.compteCode} />
                <ChampLecture label="Dépôt" valeur={e.depotCode} />

                <ChampLecture label="Tiers réglant" valeur={e.tierNom} />
                {/* Le payeur peut différer du tiers du règlement. Mesuré
                    332/332 renseigné, avec 94 valeurs distinctes : ce n'est
                    pas un doublon du tiers. */}
                <ChampLecture label="Versement effectué par" valeur={e.tierPayeurNom} />
                <ChampLecture label="N° de reçu" valeur={e.recuCode} />
                <ChampLecture label="Libellé" valeur={e.description} multiligne />
                {e.notes && <ChampLecture label="Notes" valeur={e.notes} multiligne apres={8} />}
              </GrilleFiche>
            </div>
          </Card>
        }
        /* ---------------------------------------------------------------
           Bande 2b — la synthèse. Le logiciel de bureau la pose en bandeau
           sous son formulaire : Montant brut / Reste à affecter / Affecté.
           Elle doit rester lisible pendant qu'on parcourt les affectations du
           bas, d'où le panneau latéral plutôt qu'une carte de plus dans la
           pile.
           --------------------------------------------------------------- */
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
                    {/* Vérifié 80/80 : brut − reste = la somme des affectations
                        de l'onglet du bas. Les deux nombres se recoupent, ils
                        ne se contredisent pas — d'où l'affichage des deux. */}
                    <LigneMontant libelle="Affecté" valeur={totalAffecte} />
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
        /* ---------------------------------------------------------------
           La barre d'action — le seul point d'écriture de l'écran. Elle n'est
           montée que sur un règlement `IN_WORK` : `POINTED` et `CANCELED` sont
           terminaux côté serveur, et proposer un bouton qui finira en 409 est
           pire que de ne pas le proposer.
           --------------------------------------------------------------- */
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
        /* ---------------------------------------------------------------
           Bande 3 — la zone large. Deux onglets sur les trois du logiciel de
           bureau : « Historique » n'a aucun endpoint, il est consigné en
           demande backend plutôt qu'affiché vide.
           --------------------------------------------------------------- */
        onglets={[
          {
            id: 'affectations',
            libelle: 'Affectations',
            compteur: affectations.length,
            contenu: (
              /* La réponse à « ce règlement, il a payé quoi ? ». Elle n'a
                 longtemps pas existé : la fiche montrait un champ « Dossier »
                 unique, alimenté par le `dossierCode` de la *première* ligne.
                 Mesuré, sept règlements réels soldent des échéances de deux ou
                 trois dossiers différents — la fiche en affichait un et
                 masquait le reste. */
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
                          {/* Le montant total de l'échéance, pour voir d'un
                              coup si ce seul règlement la solde ou s'il n'en
                              paie qu'une part. */}
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(a.montantEcheance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell colSpan={4} className="text-micro text-muted-foreground">
                          Total affecté
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
                /* Le nombre de preuves conditionne le pointage : un dépôt doit
                   pouvoir débloquer la barre d'action sans recharger la page. */
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
             `StlSettlement` avec des noms différents — l'adaptation tient en
             trois champs, cf. `ReglementAPointer`. */
          reglement={{
            id: e.id,
            montant: e.montantBrut,
            typeLibelle: e.typeLibelle,
            payeurNom: e.tierPayeurNom,
          }}
          onClose={() => setPointageOuvert(false)}
          onPointed={async () => {
            refetch();
          }}
        />
      )}
    </CadreFiche>
  );
}

/** Une ligne de la synthèse. Le rouge du reste à affecter est repris du
 * logiciel de bureau, qui le porte aussi — mais il ne porte pas
 * l'information seul : la ligne est étiquetée et les montants sont alignés. */
function LigneMontant({
  libelle,
  valeur,
  fort,
  alerte,
  separe,
}: {
  libelle: string;
  valeur: number | undefined;
  /** Le montant brut, la seule valeur que l'on cherche des yeux. */
  fort?: boolean;
  /** Coloré uniquement quand il reste réellement quelque chose à imputer. */
  alerte?: boolean;
  /** Trait de séparation au-dessus : sépare la synthèse d'affectation des
   * montants de la pièce, qui ne s'additionnent pas entre eux. */
  separe?: boolean;
}) {
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
          colore ? 'font-semibold text-(--warning)' : fort ? '' : 'text-foreground',
        ].join(' ')}
      >
        {formatCurrency(valeur)}
      </td>
    </tr>
  );
}
