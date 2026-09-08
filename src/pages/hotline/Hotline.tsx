import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, ChevronRight, Phone, PhoneOff, Search, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CreateProspectForm from '../../components/CreateProspectForm';
import { Avatar, Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { TimelineList, TimelineRow } from '../../components/Timeline';
import { getDossier, getProspection, rechercherHotline } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { etapeBadgeTone, interactionIcon, personDisplayName, prospectionDisplayName } from '../../lib/domain';
import { toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format';
import type { DossierListItemDto, HotlineFicheDto, ProspectionListItemDto } from '../../types';

// Hotline — recherche instantanée "qui m'appelle ?" par numéro de téléphone,
// pour un agent qui décroche. Backed by GET /api/hotline/recherche (V4) :
// jamais 404, `connu: false` + listes vides si personne ne correspond, et
// une liste séparée d'appels passés jamais rattachés à une fiche formelle.
// Toute l'info utile (identité complète, prospections, dossiers, règlements,
// interactions, historique) s'affiche directement sur cette page — l'agent
// est en ligne avec l'appelant, il ne doit pas avoir à naviguer ailleurs
// pour voir qui il a au bout du fil. "Voir la fiche complète" reste
// disponible seulement pour éditer la fiche ou aller plus loin.

type HotlineTab = 'general' | 'prospections' | 'dossiers' | 'reglements' | 'interactions' | 'historique';

/** One row of the fiche's "Prospections" tab — expands in place instead of
 * navigating away (the agent is on a live call, they shouldn't lose the
 * fiche to look at one linked prospection). The full detail
 * (`ProspectionDetailDto`) is fetched lazily via `getProspection` on first
 * expand, same pattern as `ProspectDetail.tsx`'s equivalent row. A separate
 * explicit "Fiche complète" button still lets the agent jump to the full
 * page when they actually need to act on it (change étape, log an
 * interaction, etc.) — expanding in place only covers "let me see what
 * this is about". */
function HotlineProspectionRow({ prospection: p, expanded, onToggle }: { prospection: ProspectionListItemDto; expanded: boolean; onToggle: () => void }) {
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
        <TableCell><Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge></TableCell>
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
                  <Field label="Surface" value={detail.data.surface != null ? `${detail.data.surface}${detail.data.surfaceJusqua ? ` à ${detail.data.surfaceJusqua}` : ''} m²` : undefined} />
                  <Field label="Budget" value={detail.data.prix != null ? `${formatCurrency(detail.data.prix)}${detail.data.prixJusqua ? ` à ${formatCurrency(detail.data.prixJusqua)}` : ''}` : undefined} />
                  <Field label="Avance" value={detail.data.avance != null ? formatCurrency(detail.data.avance) : undefined} />
                  {detail.data.fermee && <Field label="Raison de fermeture" value={detail.data.raisonFermeture || detail.data.raisonFermetureTexte} />}
                </FieldGrid>
                {detail.data.notes && (
                  <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-2.5 text-body text-foreground">
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

/** Same expand-in-place pattern as `HotlineProspectionRow`, for the fiche's
 * "Dossiers" tab — full `DossierDetailDto` fetched lazily via `getDossier`. */
function HotlineDossierRow({ dossier: d, expanded, onToggle }: { dossier: DossierListItemDto; expanded: boolean; onToggle: () => void }) {
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
        <TableCell><Badge tone={toneForStatus(d.statut)}>{d.statut || '—'}</Badge></TableCell>
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
                  <Field label="Remise" value={detail.data.remise != null ? `${Math.round(detail.data.remise * 100)} %` : undefined} />
                  <Field label="Avance" value={detail.data.montantAvance != null ? formatCurrency(detail.data.montantAvance) : undefined} />
                  <Field label="Mode de paiement" value={detail.data.modePaie} />
                </FieldGrid>
                {detail.data.notes && (
                  <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-2.5 text-body text-foreground">
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

function FicheCard({ fiche }: { fiche: HotlineFicheDto }) {
  const navigate = useNavigate();
  const { tier } = fiche;
  const name = personDisplayName(tier);
  const prospections = fiche.prospections ?? [];
  const dossiers = fiche.dossiers ?? [];
  const reglements = fiche.reglements ?? [];
  const interactions = fiche.interactions ?? [];
  const historique = fiche.historique ?? [];
  // Tabs instead of one long stacked page — an agent mid-call needs to jump
  // straight to "Dossiers" or "Prospections" without scrolling past
  // identity fields and a full historique first.
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
                <Field label="Mobile" value={tier.mobile} />
                <Field label="Téléphone" value={tier.telephone} />
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
                  <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-label leading-relaxed text-foreground">
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
              <div className="overflow-x-auto rounded-md border border-border">
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
              <div className="overflow-x-auto rounded-md border border-border">
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
              <div className="overflow-x-auto rounded-md border border-border">
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
              <div className="rounded-md border border-border p-3">
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
              <div className="rounded-md border border-border p-3">
                <TimelineList>
                  {historique.map((h, i) => (
                    <TimelineRow
                      key={h.id}
                      dernier={i === historique.length - 1}
                      titre={h.workflowDescription || h.statutDescription || 'Événement'}
                      meta={`${formatDateTime(h.date)} · ${h.utilisateur || 'Système'}`}
                      note={h.description}
                    />
                  ))}
                </TimelineList>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

export default function Hotline() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [createForProspectionId, setCreateForProspectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, loading, error } = useApi(
    () => (query ? rechercherHotline(query) : Promise.resolve(null)),
    [query, refreshToken],
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  function submit() {
    setQuery(input.trim());
  }

  const fiches = data?.fiches ?? [];
  const appelsSansFiche = data?.appelsSansFiche ?? [];

  return (
    <PageShell title="Hotline" crumbs={[{ label: 'Hotline' }]} icon={<Phone />} accent="var(--sec-accent)" accentBg="var(--sec-accent-bg)">
      <Card>
        <form
          className="flex flex-wrap items-end gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex min-w-65 flex-1 flex-col gap-1">
            <label htmlFor="hotline-tel" className="text-micro font-medium text-muted-foreground">
              Numéro de téléphone de l'appelant
            </label>
            <Input
              id="hotline-tel"
              autoFocus
              inputMode="tel"
              placeholder="06 12 34 56 78"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-10 text-title"
            />
          </div>
          <Button type="submit" size="lg" disabled={!input.trim()}>
            <Search data-icon="inline-start" /> Rechercher
          </Button>
        </form>
        <p className="mt-2.5 text-body text-muted-foreground">
          Espaces, tirets, parenthèses et indicatif pays sont ignorés — "+212 6 12 34 56 78", "212612345678" et
          "0612345678" sont reconnus comme le même numéro.
        </p>
      </Card>

      {!query && (
        <div className="mt-4">
          <EmptyState title="En attente d'un numéro" message="Saisissez le numéro de l'appelant pour voir instantanément qui il est." />
        </div>
      )}

      {query && loading && <div className="mt-4"><LoadingState /></div>}
      {query && error && <div className="mt-4"><ErrorState message={error} /></div>}

      {query && !loading && !error && data && (
        <div className="mt-4 flex flex-col gap-4">
          <Card padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3.5">
              <div className="flex items-center gap-2.5">
                {data.connu ? (
                  <Phone className="size-4.5 text-(--success)" />
                ) : (
                  <PhoneOff className="size-4.5 text-muted-foreground" />
                )}
                <div>
                  <div className="text-title font-semibold text-foreground">{data.telephoneRecherche || query}</div>
                  <div className="text-micro text-muted-foreground">Numéro normalisé : {data.telephoneNormalise || '—'}</div>
                </div>
              </div>
              <Badge tone={data.connu ? 'success' : 'neutral'}>{data.connu ? 'Numéro connu' : 'Numéro inconnu'}</Badge>
            </div>
          </Card>

          {fiches.length === 0 && (
            <EmptyState
              title="Aucune fiche existante"
              message="Personne n'est enregistré avec ce numéro dans le système."
            />
          )}

          {fiches.map((f) => (
            <FicheCard key={f.tier.id} fiche={f} />
          ))}

          {appelsSansFiche.length > 0 && (
            <Card title={`Appels antérieurs sans fiche (${appelsSansFiche.length})`}>
              <p className="mb-3 text-body text-muted-foreground">
                Ce numéro a déjà été démarché, mais n'a jamais été rattaché à une fiche formelle — proposez la
                création d'une fiche prospect à l'appelant.
              </p>
              <div className="flex flex-col gap-2">
                {appelsSansFiche.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-md border border-border px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-label font-medium text-foreground">{prospectionDisplayName(p)}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-micro text-muted-foreground">
                        <span>{formatDate(p.dateDocument)}</span>
                        {p.origine && <span>· {p.origine}</span>}
                        {p.commercialNom && <span>· {p.commercialNom}</span>}
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCreateForProspectionId(p.id)}>
                      <UserPlus data-icon="inline-start" /> Créer une fiche
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {createForProspectionId && (
        <CreateProspectForm
          preProspectionId={createForProspectionId}
          initial={{ phone: data?.telephoneRecherche }}
          onClose={() => setCreateForProspectionId(null)}
          onSubmit={() => {
            setCreateForProspectionId(null);
            setRefreshToken((t) => t + 1);
            showToast('Fiche créée — relancez la recherche pour la voir apparaître.');
          }}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-label font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
