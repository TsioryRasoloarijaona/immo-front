import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Field as FormField, FieldDescription, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { ChoixSimple } from '../virements/CadreVirements';
import type { Cle, Valeurs } from './proprietaire';
import type { TypeProprietaire } from './types';

const NATURES: { value: TypeProprietaire; label: string }[] = [
  { value: 'PERSONNE', label: 'Une personne' },
  { value: 'SOCIETE', label: 'Une société' },
];
const SANS_CIVILITE = 'aucune';
/** Mr / Mme, plus la civilité reprise telle quelle si elle est autre (« M. », « Mlle »…). */
function civilites(actuelle: string) {
  const items = [{ value: SANS_CIVILITE, label: '—' }, { value: 'Mr', label: 'Mr' }, { value: 'Mme', label: 'Mme' }];
  return actuelle && !items.some((i) => i.value === actuelle) ? [...items, { value: actuelle, label: actuelle }] : items;
}

/** Syndic-admod `proprietaires/formulaire.tsx` : étape 1 « qui est-ce ? », étape 2 « ses papiers ». */
export default function FormulaireProprietaire({
  initial,
  enCours,
  erreur,
  onEnvoyer,
  onAnnuler,
}: Readonly<{ initial: Valeurs; enCours: boolean; erreur: string | null; onEnvoyer: (v: Valeurs) => void; onAnnuler: () => void }>) {
  const [v, setV] = useState<Valeurs>(initial);
  const [etape, setEtape] = useState<1 | 2>(1);
  const societe = v.type === 'SOCIETE';
  const champ = (cle: Cle, libelle: string, aide?: string) => (
    <FormField>
      <FieldLabel htmlFor={`sy-pr-${cle}`}>{libelle}</FieldLabel>
      <Input id={`sy-pr-${cle}`} value={v[cle]} maxLength={200} onChange={(e) => setV({ ...v, [cle]: e.target.value })} />
      {aide && <FieldDescription>{aide}</FieldDescription>}
    </FormField>
  );
  const nomManquant = societe ? !v.societe_nom.trim() : !v.nom.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (etape === 1) setEtape(2);
        else onEnvoyer(v);
      }}
      autoComplete="off"
      noValidate
    >
      {etape === 1 ? (
        <FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="sy-pr-nature">Qui est-ce ?</FieldLabel>
              <ChoixSimple id="sy-pr-nature" items={NATURES} value={v.type} onChange={(type) => setV({ ...v, type })} />
            </FormField>
            {!societe && (
              <FormField>
                <FieldLabel htmlFor="sy-pr-civilite">Civilité</FieldLabel>
                <ChoixSimple
                  id="sy-pr-civilite"
                  items={civilites(initial.civilite)}
                  value={v.civilite || SANS_CIVILITE}
                  onChange={(c) => setV({ ...v, civilite: c === SANS_CIVILITE ? '' : c })}
                />
              </FormField>
            )}
          </div>
          {societe ? champ('societe_nom', 'Nom de la société') : champ('nom', 'Nom de famille')}
          {societe ? champ('representant', 'Personne qui la représente') : champ('prenom', 'Prénom')}
        </FieldGroup>
      ) : (
        <FieldGroup>
          {!societe && champ('cin', 'Numéro de CIN')}
          {societe && champ('societe_ice', 'ICE')}
          {societe && champ('societe_rc', 'RC')}
          {champ('telephone', 'Téléphone')}
          {!societe && champ('nom_usage', 'Autre nom sur les relevés de banque', 'À remplir seulement si la banque écrit son nom autrement.')}
        </FieldGroup>
      )}
      {erreur && (
        <p role="alert" className="mt-3 text-body text-destructive">
          {erreur}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {etape === 1 ? (
          <Button type="button" variant="ghost" onClick={onAnnuler}>
            Annuler
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setEtape(1)}>
            Retour
          </Button>
        )}
        <Button type="submit" disabled={enCours || (etape === 1 && nomManquant)}>
          {etape === 1 ? 'Continuer' : 'Enregistrer'}
        </Button>
        <span className="text-body text-muted-foreground">{etape === 1 ? 'Étape 1 sur 2 — qui est-ce ?' : 'Étape 2 sur 2 — ses papiers.'}</span>
      </div>
    </form>
  );
}
