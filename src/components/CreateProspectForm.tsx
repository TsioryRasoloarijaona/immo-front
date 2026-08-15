import { useState } from 'react';
import Modal from './Modal';
import type { Person } from '../types';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';

export default function CreateProspectForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (person: Person) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

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
      mobile: '',
      email: '',
      address: '',
      city: '',
      idNumber: '',
      idPlace: '',
      idDate: null,
      birthDate: null,
      birthPlace: '',
      profession: '',
      isProspect: true,
      isOldCustomer: false,
      nbrChildren: 0,
      fatherName: '',
      motherName: '',
    });
    onClose();
  }

  return (
    <Modal title="Créer la fiche prospect" onClose={onClose} width={400}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
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
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
