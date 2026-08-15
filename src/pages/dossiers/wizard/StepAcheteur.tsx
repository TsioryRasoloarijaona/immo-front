import { Card } from '../../../components/ui';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import type { Person } from '../../../types';

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
        </div>
      </FieldGroup>
    </Card>
  );
}
