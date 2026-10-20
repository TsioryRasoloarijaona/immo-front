import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, ChevronRight, Phone, PhoneOff, UserPlus } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from './ui';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { TimelineList, TimelineRow } from './Timeline';
import HistoriqueStatuts from './HistoriqueStatuts';
import { getDossier, getProspection } from '../lib/api';
import { useApi } from '../lib/useApi';
import { etapeBadgeTone, interactionIcon, personDisplayName, prospectionDisplayName } from '../lib/domain';
import { canonicalStatusLabel, toneForStatus } from '../lib/dossierStatus';
import { formatCurrency, formatDate, formatDateTime, formatFourchetteMontant, formatFourchetteSurface, formatPercentValue, formatTelephone } from '../lib/format';
import type { DossierListItemDto, HotlineFicheDto, HotlineResultDto, ProspectionListItemDto } from '../types';

type HotlineTab = 'general' | 'prospections' | 'dossiers' | 'reglements' | 'interactions' | 'historique';

// Dépliée sur place plutôt que navigation : l'agent est en ligne, il ne doit pas perdre la fiche.
function HotlineProspectionRow({ prospection: p, expanded, onToggle }: Readonly<{ prospection: ProspectionListItemDto; expanded: boolean; onToggle: () => void }>) {
  const navigate = useNavigate();
  const detail = useApi(() => (expanded ? getProspection(p.id) : Promise.resolve(null)), [expanded, p.id]);

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} la prospection ${p.code || ''}`}
        className="cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-medium text-foreground">{p.code || prospectionDisplayName(p)}</TableCell>
        <TableCell><Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Archivée' : p.etape || '—'}</Badge></TableCell>
        <TableCell className="text-muted-foreground">{p.origine || '—'}</TableCell>
        <TableCell className="text-right tabular-nums">{p.prix ? formatCurrency(p.prix) : '—'}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-body" onClick={() => navigate(`/prospections/${p.id}`)}>
            Fiche complète <ArrowUpRight className="size-3" />
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/30 py-3">
            {detail.loading && <LoadingState />}
            {detail.error && <ErrorState message={detail.error} />}
            {detail.data && (
              <div className="flex flex-col gap-2.5">
                <FieldGrid>
                  <Field label="Support" value={detail.data.origineSupport} />
                  <Field label="Vocation" value={detail.data.vocation} />
                  <Field label="Type de contact" value={detail.data.typeContact} />
                  <Field label="Surface" value={formatFourchetteSurface(detail.data.surface, detail.data.surfaceJusqua)} />
                  <Field label="Budget" value={formatFourchetteMontant(detail.data.prix, detail.data.prixJusqua)} />
                  <Field label="Avance" value={detail.data.avance != null ? formatCurrency(detail.data.avance) : undefined} />
                  {detail.data.fermee && <Field label="Raison de fermeture" value={detail.data.raisonFermeture || detail.data.raisonFermetureTexte} />}
                </FieldGrid>
                {detail.data.notes && (
                  <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-body text-foreground">
                    {detail.data.notes}
                  </div>
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function HotlineDossierRow({ dossier: d, expanded, onToggle }: Readonly<{ dossier: DossierListItemDto; expanded: boolean; onToggle: () => void }>) {
  const navigate = useNavigate();
  const detail = useApi(() => (expanded ? getDossier(d.id) : Promise.resolve(null)), [expanded, d.id]);

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} le dossier ${d.code || ''}`}
        className="cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-medium text-foreground">{d.code}</TableCell>
        <TableCell><Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge></TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-body" onClick={() => navigate(`/dossiers/${d.id}`)}>
            Fiche complète <ArrowUpRight className="size-3" />
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/30 py-3">
            {detail.loading && <LoadingState />}
            {detail.error && <ErrorState message={detail.error} />}
            {detail.data && (
              <div className="flex flex-col gap-2.5">
                {detail.data.articles && detail.data.articles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.data.articles.map((a) => (
                      <Badge key={a.id} tone="neutral">{a.code || a.description || '—'}</Badge>
                    ))}
                  </div>
                )}
                <FieldGrid>
                  <Field label="Commercial" value={detail.data.commercialNom} />
                  <Field label="Prix avant remise" value={detail.data.prixAvantRemise != null ? formatCurrency(detail.data.prixAvantRemise) : undefined} />
                  <Field label="Remise" value={detail.data.remise != null ? formatPercentValue(detail.data.remise) : undefined} />
                  <Field label="Avance" value={detail.data.montantAvance != null ? formatCurrency(detail.data.montantAvance) : undefined} />
                  <Field label="Mode de paiement" value={detail.data.modePaie} />
                </FieldGrid>
                {detail.data.notes && (
                  <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-body text-foreground">
                    {detail.data.notes}
                  </div>
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function FicheCard({ fiche }: Readonly<{ fiche: HotlineFicheDto }>) {
  const navigate = useNavigate();
  const { tier } = fiche;
  const name = personDisplayName(tier);
  const prospections = fiche.prospections ?? [];
  const dossiers = fiche.dossiers ?? [];
  const reglements = fiche.reglements ?? [];
  const interactions = fiche.interactions ?? [];
  const historique = fiche.historique ?? [];
  const [tab, setTab] = useState<HotlineTab>('general');
  const [expandedProspectionId, setExpandedProspectionId] = useState<string | null>(null);
  const [expandedDossierId, setExpandedDossierId] = useState<string | null>(null);

  return (
    <Card
      padded={false}
      title={
        <div className="flex items-center gap-2.5">
          <Avatar name={name} small />
          <div className="flex flex-col">
            <span>{name}</span>
            {tier.code && <span className="text-micro font-normal text-muted-foreground">{tier.code}</span>}
          </div>
          {tier.type && <Badge tone="info">{tier.type}</Badge>}
          {tier.estAncienClient && <Badge tone="success">Ancien client</Badge>}
        </div>
      }
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/prospects/${tier.id}`)}>
          Voir la fiche complète <ArrowUpRight data-icon="inline-end" />
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as HotlineTab)} className="gap-0">
        <TabsList className="px-4.5">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="prospections">
            Prospections {prospections.length > 0 && <Badge tone="neutral" className="ml-1.5">{prospections.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="dossiers">
            Dossiers {dossiers.length > 0 && <Badge tone="neutral" className="ml-1.5">{dossiers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reglements">
            Règlements {reglements.length > 0 && <Badge tone="neutral" className="ml-1.5">{reglements.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="interactions">
            Interactions {interactions.length > 0 && <Badge tone="neutral" className="ml-1.5">{interactions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <div className="p-4.5">
          <TabsContent value="general">
            <div className="flex flex-col gap-5">
              <FieldGrid>
                <Field label="Mobile" value={formatTelephone(tier.mobile, tier.indicatifMobile)} />
                <Field label="Téléphone" value={formatTelephone(tier.telephone, tier.indicatifTelephone)} />
                <Field label="Téléphone 2" value={tier.telephone2} />
                <Field label="Email" value={tier.email} />
                <Field label="Commercial référent" value={tier.commercialNom} />
                <Field label="Ville" value={tier.ville} />
                <Field label="Adresse" value={tier.adresse} />
                <Field label="Code postal" value={tier.codePostal} />
                <Field label="Pays" value={tier.pays} />
                <Field label="Pays de résidence" value={tier.paysResidence} />
                <Field label="Nationalité" value={tier.nationalite} />
                <Field label="Date de naissance" value={tier.dateNaissance ? formatDate(tier.dateNaissance) : undefined} />
                <Field label="Lieu de naissance" value={tier.lieuNaissance} />
                <Field label="Situation familiale" value={tier.situationFamiliale} />
                <Field label="Enfants" value={tier.nombreEnfants ? String(tier.nombreEnfants) : undefined} />
                <Field label="Profession" value={tier.profession} />
                <Field label="Employeur" value={tier.employeur} />
                <Field label="Ancien client" value={tier.estAncienClient ? 'Oui' : 'Non'} />
              </FieldGrid>

              {tier.pieceIdentite && (tier.pieceIdentite.numero || tier.pieceIdentite.type) && (
                <div>
                  <div className="mb-2 text-micro font-medium text-muted-foreground">Pièce d'identité</div>
                  <FieldGrid>
                    <Field label="Type" value={tier.pieceIdentite.type} />
                    <Field label="Numéro" value={tier.pieceIdentite.numero} />
                    <Field label="Délivrée le" value={tier.pieceIdentite.delivreeLe ? formatDate(tier.pieceIdentite.delivreeLe) : undefined} />
                    <Field label="Valide jusqu'au" value={tier.pieceIdentite.valideJusquau ? formatDate(tier.pieceIdentite.valideJusquau) : undefined} />
                  </FieldGrid>
                </div>
              )}

              {tier.notes && (
                <div>
                  <div className="mb-2 text-micro font-medium text-muted-foreground">Notes</div>
                  <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-label leading-relaxed text-foreground">
                    {tier.notes}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="prospections">
            {prospections.length === 0 ? (
              <EmptyState title="Aucune prospection" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8" />
                      <TableHead>Code</TableHead>
                      <TableHead>Étape</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospections.map((p) => (
                      <HotlineProspectionRow
                        key={p.id}
                        prospection={p}
                        expanded={expandedProspectionId === p.id}
                        onToggle={() => setExpandedProspectionId(expandedProspectionId === p.id ? null : p.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dossiers">
            {dossiers.length === 0 ? (
              <EmptyState title="Aucun dossier" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8" />
                      <TableHead>Code</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Total à payer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossiers.map((d) => (
                      <HotlineDossierRow
                        key={d.id}
                        dossier={d}
                        expanded={expandedDossierId === d.id}
                        onToggle={() => setExpandedDossierId(expandedDossierId === d.id ? null : d.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reglements">
            {reglements.length === 0 ? (
              <EmptyState title="Aucun règlement" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date de règlement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reglements.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-foreground">{r.code}</TableCell>
                        <TableCell className="text-muted-foreground">{r.type}</TableCell>
                        <TableCell className="text-muted-foreground">{r.dossierCode || '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(r.montant)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.dateReglement)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interactions">
            {interactions.length === 0 ? (
              <EmptyState title="Aucune interaction" />
            ) : (
              <div className="rounded-lg bg-muted/30 p-3">
                <TimelineList>
                  {interactions.map((c, i) => (
                    <TimelineRow
                      key={c.id}
                      dernier={i === interactions.length - 1}
                      titre={
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex text-(--brand)">{interactionIcon(c.entrante)}</span>
                          {c.actionType || (c.entrante ? 'Entrant' : 'Sortant')}
                          {c.resultat && <Badge tone={c.dateRdv ? 'success' : 'neutral'}>{c.resultat}</Badge>}
                        </span>
                      }
                      meta={`${formatDateTime(c.date)} · ${c.employeNom || 'Système'}`}
                      note={c.note}
                      badges={
                        (c.dateRdv || c.dateAlerte) && (
                          <>
                            {c.dateRdv && <Badge tone="success">RDV le {formatDateTime(c.dateRdv)}</Badge>}
                            {c.dateAlerte && <Badge tone="warning">Alerte jusqu'au {formatDate(c.dateAlerte)}</Badge>}
                          </>
                        )
                      }
                    />
                  ))}
                </TimelineList>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historique">
            {historique.length === 0 ? (
              <EmptyState title="Aucun historique" />
            ) : (
              <HistoriqueStatuts lignes={historique} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

function libelleResultat(parNom: boolean, connu: boolean | undefined, nbFiches: number): string {
  if (!parNom) return connu ? 'Numéro connu' : 'Numéro inconnu';
  if (!connu) return 'Nom inconnu';
  const s = nbFiches > 1 ? 's' : '';
  return `${nbFiches} fiche${s} trouvée${s}`;
}

export default function HotlineResultat({
  data,
  query,
  onCreerFiche,
}: Readonly<{
  data: HotlineResultDto;
  query: string;
  onCreerFiche?: (prospectionId: string) => void;
}>) {
  const fiches = data.fiches ?? [];
  const appelsSansFiche = data.appelsSansFiche ?? [];

  return (
    <div className="flex flex-col gap-3">
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3.5">
          <div className="flex items-center gap-2.5">
            {data.connu ? (
              <Phone className="size-4.5 text-(--success)" />
            ) : (
              <PhoneOff className="size-4.5 text-muted-foreground" />
            )}
            <div>
              <div className="text-title font-semibold text-foreground">
                {data.nomRecherche || data.telephoneRecherche || query}
              </div>
              {/* Recherche par nom : `telephoneNormalise` est toujours null, ce n'est pas une donnée manquante. */}
              {data.critere !== 'NOM' && (
                <div className="text-micro text-muted-foreground">
                  Numéro normalisé : {data.telephoneNormalise || '—'}
                </div>
              )}
            </div>
          </div>
          <Badge tone={data.connu ? 'success' : 'neutral'}>
            {libelleResultat(data.critere === 'NOM', data.connu, fiches.length)}
          </Badge>
        </div>
      </Card>

      {/* Sans ce bandeau le plafond serveur est invisible : l'agent conclurait que la personne n'existe pas. */}
      {data.tronque && (
        <p
          role="status"
          className="rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)"
        >
          Plus de 20 fiches portent ce nom : seules les 20 premières sont affichées. Précisez votre recherche
          (nom complet, ou recherche par téléphone) pour trouver la bonne personne.
        </p>
      )}

      {fiches.length === 0 && (
        <EmptyState
          title="Aucune fiche existante"
          message={
            data.critere === 'NOM'
              ? "Aucune fiche ne porte ce nom dans le système."
              : "Personne n'est enregistré avec ce numéro dans le système."
          }
        />
      )}

      {fiches.map((f) => (
        <FicheCard key={f.tier.id} fiche={f} />
      ))}

      {appelsSansFiche.length > 0 && (
        <Card title={`Appels antérieurs sans fiche (${appelsSansFiche.length})`}>
          <p className="mb-3 text-body text-muted-foreground">
            Ce numéro a déjà été démarché, mais n'a jamais été rattaché à une fiche formelle
            {onCreerFiche ? " — proposez la création d'une fiche prospect à l'appelant." : '.'}
          </p>
          <div className="flex flex-col gap-2">
            {appelsSansFiche.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-label font-medium text-foreground">{prospectionDisplayName(p)}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-micro text-muted-foreground">
                    <span>{formatDate(p.dateDocument)}</span>
                    {p.origine && <span>· {p.origine}</span>}
                    {p.commercialNom && <span>· {p.commercialNom}</span>}
                  </div>
                </div>
                {onCreerFiche && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onCreerFiche(p.id)}>
                    <UserPlus data-icon="inline-start" /> Créer une fiche
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
