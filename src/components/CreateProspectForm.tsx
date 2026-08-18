import { useState } from 'react';
import Modal from './Modal';
import type { Person } from '../types';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PERSON_GENDER_OPTIONS, PERSON_TITLE_OPTIONS } from '../lib/domain';

export interface CreateProspectInitial {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

// The étape intermédiaire between a raw Pré-Prospection and "Transformer en
// prospection" — on the real Omran screen (see omaran_visual/prospect-creation.png)
// "Créer Prospect" opens a full contact record, not a 3-field modal: Nom/
// Prénom/coordonnées AND a profile section (ville, adresse, profession,
// enfants). This mirrors the fields the fiche Prospect actually surfaces
// afterward on the Contact card (ProspectionDetail's Aperçu tab), so nothing
// captured here is invisible once saved. Full legal-identity fields from the
// real screen (forme juridique, pièce d'identité, situation familiale,
// régime matrimonial…) have no home in this prototype's Person model and
// aren't fabricated — see CLAUDE.md "Data honesty note".
export default function CreateProspectForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CreateProspectInitial;
  onClose: () => void;
  onSubmit: (person: Person) => void;
}) {
  const [title, setTitle] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [profession, setProfession] = useState('');
  const [nbrChildren, setNbrChildren] = useState('');

  const titleItems = [{ label: '— Non renseigné —', value: null as string | null }, ...PERSON_TITLE_OPTIONS.map((t) => ({ label: t, value: t as string | null }))];
  const genderItems = [{ label: '— Non renseigné —', value: null as string | null }, ...PERSON_GENDER_OPTIONS.map((g) => ({ label: g, value: g as string | null }))];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;
    const id = crypto.randomUUID();
    onSubmit({
      id,
      code: `TMP-${id.slice(0, 6).toUpperCase()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      idNumber: idNumber.trim(),
      idPlace: '',
      idDate: null,
      birthDate: null,
      birthPlace: '',
      profession: profession.trim(),
      isProspect: true,
      isOldCustomer: false,
      nbrChildren: Number(nbrChildren) || 0,
      fatherName: '',
      motherName: '',
      title: title ?? undefined,
      gender: gender ?? undefined,
      nationality: nationality.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal title="Créer la fiche prospect" onClose={onClose} width={520}>
      <form onSubmit={handleSubmit}>
        {(initial?.firstName || initial?.phone) && (
          <p className="mb-3.5 text-xs text-muted-foreground">
            Identité et coordonnées pré-remplies depuis la pré-prospection — vérifiez et complétez avant de valider.
          </p>
        )}

        <div className="mb-1.5 text-[11.5px] font-semibold text-foreground">Identité & coordonnées</div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="title">Titre</FieldLabel>
              <Select items={titleItems} value={title} onValueChange={(v) => setTitle(v as string | null)}>
                <SelectTrigger id="title">
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
              <FieldLabel htmlFor="gender">Sexe</FieldLabel>
              <Select items={genderItems} value={gender} onValueChange={(v) => setGender(v as string | null)}>
                <SelectTrigger id="gender">
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
              <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="lastName">Nom</FieldLabel>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="mobile">Mobile</FieldLabel>
              <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </FormField>
            <FormField className="sm:col-span-2">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
          </div>
        </FieldGroup>

        <div className="mt-4 mb-1.5 border-t border-border pt-4 text-[11.5px] font-semibold text-foreground">Profil</div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="city">Ville</FieldLabel>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="nationality">Nationalité</FieldLabel>
              <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </FormField>
            <FormField className="sm:col-span-2">
              <FieldLabel htmlFor="address">Adresse</FieldLabel>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="idNumber">Pièce d'identité (CIN)</FieldLabel>
              <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="profession">Profession</FieldLabel>
              <Input id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="nbrChildren">Enfants</FieldLabel>
              <Input id="nbrChildren" type="number" min={0} value={nbrChildren} onChange={(e) => setNbrChildren(e.target.value)} />
            </FormField>
          </div>
        </FieldGroup>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
