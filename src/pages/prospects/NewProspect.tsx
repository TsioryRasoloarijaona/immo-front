import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Contact } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { createProspect } from '../../lib/api';
import { useAppData, commercialLabel } from '../../lib/appData';
import { referentielItems, useTierTypes } from '../../lib/referentiels';
import type { CreerProspectRequest } from '../../types';

const EMPTY: CreerProspectRequest = {};

// Minimal quick-add form — CreerProspectRequest (POST /api/prospects) has
// no `required` fields at all per the OpenAPI schema (confirmed: neither
// CreerProspectRequest nor ProspectListItemDto/ProspectDetailDto carry any
// tranche/prospection field — a Prospect is a standalone contact record,
// tranche linkage only exists at the Prospection level, see CLAUDE.md).
// Everything else (coordonnées complètes, état civil, pièce d'identité…)
// stays editable afterwards from the "Modifier" button on ProspectDetail.tsx
// — this page only covers what's needed to get a usable record started.
export default function NewProspect() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreerProspectRequest>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { commerciaux } = useAppData();
  const tierTypes = useTierTypes();
  const tierTypeItems = referentielItems(tierTypes.data);
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  function set<K extends keyof CreerProspectRequest>(key: K, value: CreerProspectRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isMorale = !!form.raisonSociale?.trim();
  const canCreate = (form.prenom?.trim() && form.nom?.trim()) || isMorale;

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const prospect = await createProspect(form);
      navigate(`/prospects/${prospect.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Nouveau prospect"
      crumbs={[{ label: 'Ventes' }, { label: 'Prospects', to: '/prospects' }, { label: 'Nouveau prospect' }]}
      icon={<Contact />}
      accent="var(--sec-prospect)"
      accentBg="var(--sec-prospect-bg)"
    >
      <div className="flex max-w-160 flex-col gap-3">
        <Card title="Nouveau prospect" accent="var(--sec-prospect)">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="p-type">Type</FieldLabel>
                <Select items={tierTypeItems} value={form.typeId ?? null} onValueChange={(v) => set('typeId', (v as string) || undefined)}>
                  <SelectTrigger id="p-type" className="w-full">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {tierTypeItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField>
                <FieldLabel htmlFor="p-commercial">Commercial</FieldLabel>
                <Select items={commercialItems} value={form.commercialId ?? null} onValueChange={(v) => set('commercialId', (v as string) || undefined)}>
                  <SelectTrigger id="p-commercial" className="w-full">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {commercialItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField>
                <FieldLabel htmlFor="p-prenom">Prénom {!isMorale && '*'}</FieldLabel>
                <Input id="p-prenom" value={form.prenom ?? ''} onChange={(e) => set('prenom', e.target.value || undefined)} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="p-nom">Nom {!isMorale && '*'}</FieldLabel>
                <Input id="p-nom" value={form.nom ?? ''} onChange={(e) => set('nom', e.target.value || undefined)} />
              </FormField>
              <FormField className="sm:col-span-2">
                <FieldLabel htmlFor="p-raisonSociale">Raison sociale (si personne morale)</FieldLabel>
                <Input id="p-raisonSociale" value={form.raisonSociale ?? ''} onChange={(e) => set('raisonSociale', e.target.value || undefined)} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="p-telephone">Téléphone</FieldLabel>
                <Input id="p-telephone" value={form.telephone ?? ''} onChange={(e) => set('telephone', e.target.value || undefined)} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="p-mobile">Mobile</FieldLabel>
                <Input id="p-mobile" value={form.mobile ?? ''} onChange={(e) => set('mobile', e.target.value || undefined)} />
              </FormField>
              <FormField className="sm:col-span-2">
                <FieldLabel htmlFor="p-email">Email</FieldLabel>
                <Input id="p-email" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value || undefined)} />
              </FormField>
              <FormField className="sm:col-span-2">
                <FieldLabel htmlFor="p-ville">Ville</FieldLabel>
                <Input id="p-ville" value={form.ville ?? ''} onChange={(e) => set('ville', e.target.value || undefined)} />
              </FormField>
            </div>
            {!canCreate && (
              <p className="text-[11px] text-muted-foreground">
                Renseignez prénom + nom, ou une raison sociale, pour pouvoir créer le prospect.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Le reste (coordonnées complètes, état civil, pièce d'identité…) pourra être complété
              depuis la fiche du prospect une fois créé.
            </p>
          </FieldGroup>
        </Card>

        {submitError && <p className="text-[12.5px] text-destructive">{submitError}</p>}

        <div className="flex items-center justify-end border-t border-border pt-4">
          <Button type="button" onClick={handleCreate} disabled={!canCreate || submitting}>
            <Check data-icon="inline-start" /> {submitting ? 'Création…' : 'Créer le prospect'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
