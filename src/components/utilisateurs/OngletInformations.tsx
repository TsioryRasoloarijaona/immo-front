import type { ChangeEvent } from 'react';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import type { SaisieUtilisateur } from '../../lib/saisieUtilisateur';
import type { UtilisateurReferencesDto } from '../../types/utilisateurs';
import type { ReferentielItemDto } from '../../types';

type Cle = keyof SaisieUtilisateur;
type CleTexte = 'code' | 'description' | 'email' | 'telephone' | 'mobile' | 'smtpServeur' | 'smtpPort';
type CleCase = 'smtpSsl' | 'inactif' | 'avecNotification' | 'peutMasquerNotification' | 'accesMobile';

const CASES: ReadonlyArray<{ cle: CleCase; libelle: string }> = [
  { cle: 'inactif', libelle: 'Inactif' },
  { cle: 'avecNotification', libelle: 'Avec notification' },
  { cle: 'peutMasquerNotification', libelle: 'Peut masquer la notification' },
  { cle: 'accesMobile', libelle: 'Accès mobile' },
  { cle: 'smtpSsl', libelle: 'SMTP SSL' },
];

const CLASSE_SELECT = 'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-body';

function Liste({ id, libelle, valeur, items, onChange }: Readonly<{
  id: string;
  libelle: string;
  valeur: string;
  items: ReferentielItemDto[];
  onChange: (valeur: string) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      <select id={id} className={CLASSE_SELECT} value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>{i.description || i.code}</option>
        ))}
      </select>
    </Field>
  );
}

/** Onglet Informations : identité, contacts, personnel, accès web, SMTP et drapeaux. */
export default function OngletInformations({ saisie, refs, codeFige, erreurs, onChange, onPersonnel }: Readonly<{
  saisie: SaisieUtilisateur;
  refs: UtilisateurReferencesDto;
  codeFige: boolean;
  erreurs: Partial<Record<Cle, string>>;
  onChange: (patch: Partial<SaisieUtilisateur>) => void;
  onPersonnel: (id: string) => void;
}>) {
  const texte = (cle: CleTexte, libelle: string, max = 255) => (
    <Field>
      <FieldLabel htmlFor={`utilisateur-${cle}`}>{libelle}</FieldLabel>
      <Input
        id={`utilisateur-${cle}`}
        value={saisie[cle]}
        maxLength={max}
        disabled={cle === 'code' && codeFige}
        readOnly={cle === 'code' && codeFige}
        aria-invalid={erreurs[cle] ? true : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ [cle]: e.target.value })}
      />
      {erreurs[cle] && <p role="alert" className="text-micro text-destructive">{erreurs[cle]}</p>}
    </Field>
  );
  return (
    <div className="grid grid-cols-2 content-start gap-3">
      {texte('code', codeFige ? 'Code' : 'Code *')}
      {texte('description', 'Description *')}
      {texte('email', 'Email')}
      {texte('telephone', 'Téléphone')}
      {texte('mobile', 'Mobile')}
      <Liste id="utilisateur-personnel" libelle="Personnel" valeur={saisie.personnelId} items={refs.personnels} onChange={onPersonnel} />
      <Liste id="utilisateur-culture" libelle="Culture web" valeur={saisie.cultureWebId} items={refs.cultures} onChange={(v) => onChange({ cultureWebId: v })} />
      <Liste id="utilisateur-role-web" libelle="Rôle web" valeur={saisie.roleWebId} items={refs.roles} onChange={(v) => onChange({ roleWebId: v })} />
      {texte('smtpServeur', 'SMTP serveur')}
      {texte('smtpPort', 'SMTP port', 5)}
      <fieldset className="col-span-full grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-border p-3">
        <legend className="px-1 text-label font-medium">Options</legend>
        {CASES.map(({ cle, libelle }) => (
          <label key={cle} className="flex items-center gap-2 text-body">
            <input type="checkbox" checked={saisie[cle]} onChange={(e) => onChange({ [cle]: e.target.checked })} />
            {libelle}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
