import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Phone, PhoneOff, Search, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CreateProspectForm from '../../components/CreateProspectForm';
import { Avatar, Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { rechercherHotline } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { etapeBadgeTone, interactionIcon, personDisplayName, prospectionDisplayName } from '../../lib/domain';
import { toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency, formatDate } from '../../lib/format';
import type { HotlineFicheDto } from '../../types';

// Hotline — recherche instantanée "qui m'appelle ?" par numéro de téléphone,
// pour un agent qui décroche. Backed by GET /api/hotline/recherche (V4) :
// jamais 404, `connu: false` + listes vides si personne ne correspond, et
// une liste séparée d'appels passés jamais rattachés à une fiche formelle.
// Toute l'info utile (identité complète, prospections, dossiers, règlements,
// interactions, historique) s'affiche directement sur cette page — l'agent
// est en ligne avec l'appelant, il ne doit pas avoir à naviguer ailleurs
// pour voir qui il a au bout du fil. "Voir la fiche complète" reste
// disponible seulement pour éditer la fiche ou aller plus loin.

function FicheCard({ fiche }: { fiche: HotlineFicheDto }) {
  const navigate = useNavigate();
  const { tier } = fiche;
  const name = personDisplayName(tier);
  const prospections = fiche.prospections ?? [];
  const dossiers = fiche.dossiers ?? [];
  const reglements = fiche.reglements ?? [];
  const interactions = fiche.interactions ?? [];
  const historique = fiche.historique ?? [];

  return (
    <Card
      title={
        <div className="flex items-center gap-2.5">
          <Avatar name={name} small />
          <div className="flex flex-col">
            <span>{name}</span>
            {tier.code && <span className="text-[11px] font-normal text-muted-foreground">{tier.code}</span>}
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
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Pièce d'identité</div>
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
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Notes</div>
            <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
              {tier.notes}
            </div>
          </div>
        )}

        {prospections.length > 0 && (
          <div>
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Prospections ({prospections.length})</div>
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Étape</TableHead>
                    <TableHead>Origine</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospections.map((p) => (
                    <TableRow key={p.id} tabIndex={0} role="link" className="cursor-pointer" onClick={() => navigate(`/prospections/${p.id}`)}>
                      <TableCell className="font-medium text-foreground">{p.code || prospectionDisplayName(p)}</TableCell>
                      <TableCell><Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.origine || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.prix ? formatCurrency(p.prix) : '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {dossiers.length > 0 && (
          <div>
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Dossiers de vente ({dossiers.length})</div>
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Total à payer</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((d) => (
                    <TableRow key={d.id} tabIndex={0} role="link" className="cursor-pointer" onClick={() => navigate(`/dossiers/${d.id}`)}>
                      <TableCell className="font-medium text-foreground">{d.code}</TableCell>
                      <TableCell><Badge tone={toneForStatus(d.statut)}>{d.statut || '—'}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {reglements.length > 0 && (
          <div>
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Règlements ({reglements.length})</div>
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
          </div>
        )}

        {interactions.length > 0 && (
          <div>
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Actions récentes ({interactions.length})</div>
            <div className="flex flex-col rounded-md border border-border p-3">
              {interactions.map((c, i) => (
                <div className="relative flex gap-3 pb-3.5 last:pb-0" key={c.id}>
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                    {i < interactions.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-foreground">
                      <span className="inline-flex text-[var(--brand)]">{interactionIcon(c.entrante)}</span>
                      {c.actionType || (c.entrante ? 'Entrant' : 'Sortant')}
                      {c.resultat && <Badge tone={c.dateRdv ? 'success' : 'neutral'}>{c.resultat}</Badge>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.date)} · {c.employeNom || 'Système'}</div>
                    {c.description && <div className="mt-1 text-[12.5px] text-foreground">{c.description}</div>}
                    {(c.dateRdv || c.dateAlerte) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.dateRdv && <Badge tone="success">RDV le {formatDate(c.dateRdv)}</Badge>}
                        {c.dateAlerte && <Badge tone="warning">Alerte jusqu'au {formatDate(c.dateAlerte)}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {historique.length > 0 && (
          <div>
            <div className="mb-2 text-[11.5px] font-medium text-muted-foreground">Historique ({historique.length})</div>
            <div className="flex flex-col rounded-md border border-border p-3">
              {historique.map((h, i) => (
                <div className="relative flex gap-3 pb-3.5 last:pb-0" key={h.id}>
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                    {i < historique.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="text-[13px] font-semibold text-foreground">{h.workflowDescription || h.statutDescription || 'Événement'}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(h.date)} · {h.utilisateur || 'Système'}</div>
                    {h.description && <div className="mt-1 text-[12.5px] text-foreground">{h.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
    <PageShell title="Hotline" crumbs={[{ label: 'Hotline' }]}>
      <Card>
        <form
          className="flex flex-wrap items-end gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex min-w-[260px] flex-1 flex-col gap-1">
            <label htmlFor="hotline-tel" className="text-[11.5px] font-medium text-muted-foreground">
              Numéro de téléphone de l'appelant
            </label>
            <Input
              id="hotline-tel"
              autoFocus
              inputMode="tel"
              placeholder="06 12 34 56 78"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-10 text-[15px]"
            />
          </div>
          <Button type="submit" size="lg" disabled={!input.trim()}>
            <Search data-icon="inline-start" /> Rechercher
          </Button>
        </form>
        <p className="mt-2.5 text-[12px] text-muted-foreground">
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
                  <Phone className="size-[18px] text-[var(--success)]" />
                ) : (
                  <PhoneOff className="size-[18px] text-muted-foreground" />
                )}
                <div>
                  <div className="text-[14.5px] font-semibold text-foreground">{data.telephoneRecherche || query}</div>
                  <div className="text-[11.5px] text-muted-foreground">Numéro normalisé : {data.telephoneNormalise || '—'}</div>
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
              <p className="mb-3 text-[12.5px] text-muted-foreground">
                Ce numéro a déjà été démarché, mais n'a jamais été rattaché à une fiche formelle — proposez la
                création d'une fiche prospect à l'appelant.
              </p>
              <div className="flex flex-col gap-2">
                {appelsSansFiche.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-md border border-border px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-foreground">{prospectionDisplayName(p)}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
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
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-[13px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
