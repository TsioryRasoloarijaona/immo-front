import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getEncaissement } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { encaissementEtatLabel, encaissementEtatTone } from '../../lib/domain';
import { formatCurrency, formatDate } from '../../lib/format';

export default function EncaissementDetail() {
  const { id } = useParams();
  const { data: e, loading, error } = useApi(() => getEncaissement(id!), [id]);
  const navigate = useNavigate();

  if (loading) return <PageShell title="Encaissement"><LoadingState /></PageShell>;
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
  /* Combien de dossiers ce règlement touche réellement. Mesuré sur 80
     règlements : un seul en touche plus d'un, mais c'est précisément celui que
     la liste présentait de travers, en n'affichant que le premier. */
  const dossiers = new Set(affectations.map((a) => a.dossierCode).filter(Boolean));
  const totalAffecte = affectations.reduce((s, a) => s + (a.montantAffecte ?? 0), 0);

  return (
    <PageShell
      title={e.reference || 'Règlement'}
      crumbs={[
        { label: 'Ventes' },
        { label: 'Encaissements', to: '/encaissements' },
        { label: e.reference || '' },
      ]}
      icon={<Wallet />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/encaissements')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-hero font-semibold tracking-tight text-foreground">{e.reference || 'Règlement'}</h2>
        <Badge tone={encaissementEtatTone(e.etat)}>{encaissementEtatLabel(e.etat)}</Badge>
        <Badge tone={e.comptabilise ? 'success' : 'neutral'}>{e.comptabilise ? 'Comptabilisé' : 'Non comptabilisé'}</Badge>
        {e.remisAuCentre && <Badge tone="info">Remis au centre</Badge>}
      </div>

      <div className="flex flex-col gap-3">
        <Card title="Détails" accent="var(--sec-dossier)">
          <FieldGrid>
            <Field label="Tiers réglant" value={e.tierNom} />
            {/* Le payeur peut différer du tiers du règlement. Mesuré 332/332
                renseigné, avec 94 valeurs distinctes : ce n'est pas un doublon
                du tiers. */}
            <Field label="Versement effectué par" value={e.tierPayeurNom} />
            <Field label="Date pièce" value={formatDate(e.dateDocument)} />
            <Field label="Échéance" value={formatDate(e.dateEcheance)} />
            <Field label="Date règlement" value={formatDate(e.dateReglement)} />
            <Field label="Type" value={e.typeLibelle} />
            <Field label="Banque" value={e.banqueNom} />
            <Field label="Compte" value={e.compteCode} />
            <Field label="Dépôt" value={e.depotCode} />
            <Field label="Entité" value={e.entiteLibelle} />
            <Field label="Libellé" value={e.description} />
          </FieldGrid>
        </Card>

        {/* -------------------------------------------------------------------
            Les affectations. C'est la réponse à « ce règlement, il a payé
            quoi ? », et elle n'existait pas : la fiche montrait un champ
            « Dossier » unique, alimenté par le `dossierCode` de la *première*
            ligne. Mesuré, un règlement réel solde trois échéances sur trois
            dossiers différents — la fiche en affichait un et masquait deux.
            ------------------------------------------------------------------- */}
        <Card
          title="Affectations"
          accent="var(--sec-dossier)"
          padded={false}
        >
          {affectations.length === 0 ? (
            <EmptyState
              title="Pas encore imputé"
              message="Ce règlement est encaissé mais n'a été affecté à aucune échéance."
            />
          ) : (
            <>
              {dossiers.size > 1 && (
                <p className="border-b border-border px-3 py-2 text-body text-muted-foreground">
                  Ce règlement solde des échéances de <strong className="text-foreground">{dossiers.size} dossiers</strong>.
                </p>
              )}
              <Table>
                <TableHeader>
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
                          <button
                            type="button"
                            className="text-(--info) hover:underline"
                            onClick={() => navigate(`/dossiers/${a.dossierId}`)}
                          >
                            {a.dossierCode || 'Voir'}
                          </button>
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
                      {/* Le montant total de l'échéance, pour voir d'un coup si
                          ce seul règlement la solde ou s'il n'en paie qu'une
                          part. */}
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
          )}
        </Card>

        <Card title="Montants" accent="var(--sec-dossier)">
          <FieldGrid>
            <Field label="Montant brut" value={formatCurrency(e.montantBrut)} />
            {/* Vérifié 80/80 : brut − reste = la somme des affectations
                ci-dessus. Les deux nombres se recoupent, ils ne se
                contredisent pas. */}
            <Field label="Reste à affecter" value={formatCurrency(e.montantBrutRestant)} />
            <Field label="Montant net" value={formatCurrency(e.montantNet)} />
            <Field label="Montant base" value={formatCurrency(e.montantBase)} />
          </FieldGrid>
        </Card>

        <Card title="Suivi" accent="var(--sec-dossier)">
          <FieldGrid>
            <Field label="N° de reçu" value={e.recuCode} />
            <Field label="Remis au centre" value={e.remisAuCentre ? 'Oui' : 'Non'} />
            <Field label="Date de remise" value={formatDate(e.dateRemiseAuCentre)} />
            <Field label="Bordereau" value={e.bordereauCode} />
            <Field label="Date de bordereau" value={formatDate(e.dateBordereau)} />
            <Field label="Créé par" value={e.creePar} />
            <Field label="Modifié par" value={e.modifiePar} />
          </FieldGrid>
        </Card>

        {e.notes && (
          <Card title="Notes">
            <p className="text-label text-foreground">{e.notes}</p>
          </Card>
        )}

        {/* Ce qui manque encore à `GET /api/encaissements/{id}`, après la
            livraison qui a apporté les affectations et le bloc Suivi :
            retenue à la source et montant du timbre (mesurés non nuls mais
            **toujours à zéro**, donc écartés du catalogue côté serveur),
            notaire, dossier de groupe, C.R.A.S. et devise. Demande consignée
            dans instructions/from_front.md (#3). */}
      </div>
    </PageShell>
  );
}
