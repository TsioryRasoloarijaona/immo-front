import { Card } from '../../../components/ui';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { PERSON_GENDER_OPTIONS, PERSON_TITLE_OPTIONS } from '../../../lib/domain';
import type { Person } from '../../../types';

const titleItems = [{ label: '— Non renseigné —', value: null as string | null }, ...PERSON_TITLE_OPTIONS.map((t) => ({ label: t, value: t as string | null }))];
const genderItems = [{ label: '— Non renseigné —', value: null as string | null }, ...PERSON_GENDER_OPTIONS.map((g) => ({ label: g, value: g as string | null }))];

export default function StepAcheteur({
  client,
  onChange,
}: {
  client: Person;
  onChange: (client: Person) => void;
}) {
  function set<K extends keyof Person>(key: K, value: Person[K]) {
    onChange({ ...client, [key]: value });
  }

  return (
    <Card title="Acheteur(s)">
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Coordonnées reprises de la fiche prospect liée — à ajuster si besoin avant d'ouvrir le dossier.
      </p>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <FormField>
            <FieldLabel htmlFor="w-title">Titre</FieldLabel>
            <Select items={titleItems} value={client.title ?? null} onValueChange={(v) => set('title', (v as string | null) ?? undefined)}>
              <SelectTrigger id="w-title">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {titleItems.map((item) => (
                    <SelectItem key={item.value ?? '__none'} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-gender">Sexe</FieldLabel>
            <Select items={genderItems} value={client.gender ?? null} onValueChange={(v) => set('gender', (v as string | null) ?? undefined)}>
              <SelectTrigger id="w-gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {genderItems.map((item) => (
                    <SelectItem key={item.value ?? '__none'} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-firstName">Prénom</FieldLabel>
            <Input
              id="w-firstName"
              value={client.firstName}
              onChange={(e) => {
                const firstName = e.target.value;
                onChange({ ...client, firstName, name: `${firstName} ${client.lastName}`.trim() });
              }}
            />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-lastName">Nom</FieldLabel>
            <Input
              id="w-lastName"
              value={client.lastName}
              onChange={(e) => {
                const lastName = e.target.value;
                onChange({ ...client, lastName, name: `${client.firstName} ${lastName}`.trim() });
              }}
            />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-phone">Téléphone</FieldLabel>
            <Input id="w-phone" value={client.phone} onChange={(e) => set('phone', e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-mobile">Mobile</FieldLabel>
            <Input id="w-mobile" value={client.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-email">Email</FieldLabel>
            <Input id="w-email" type="email" value={client.email} onChange={(e) => set('email', e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-city">Ville</FieldLabel>
            <Input id="w-city" value={client.city} onChange={(e) => set('city', e.target.value)} />
          </FormField>
          <FormField className="sm:col-span-2">
            <FieldLabel htmlFor="w-address">Adresse</FieldLabel>
            <Input id="w-address" value={client.address} onChange={(e) => set('address', e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-nationality">Nationalité</FieldLabel>
            <Input id="w-nationality" value={client.nationality ?? ''} onChange={(e) => set('nationality', e.target.value || undefined)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="w-idNumber">Pièce d'identité (CIN)</FieldLabel>
            <Input id="w-idNumber" value={client.idNumber} onChange={(e) => set('idNumber', e.target.value)} />
          </FormField>
        </div>
      </FieldGroup>
    </Card>
  );
}
