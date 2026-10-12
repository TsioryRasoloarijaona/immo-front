import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Field as FormField, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  messageDuChamp,
  valeurAffichee,
  valeurSaisie,
  type DefChamp,
  type ErreurSaisie,
  type GenreChamp,
} from '../../lib/saisiePatrimoine';
import { cn } from '../../lib/utils';

export interface OptionSelect {
  label: string;
  value: string;
}

function suffixe(genre: GenreChamp): string {
  if (genre === 'taux') return ' (%)';
  if (genre === 'montant') return ' (DH)';
  return '';
}

/** Une grille de champs décrits par `defs`, lus et écrits dans `form` par leur nom de champ DTO. */
export function ChampsDeclares<T extends object>({
  prefixe,
  defs,
  form,
  onChange,
  erreur,
  references,
}: Readonly<{
  prefixe: string;
  defs: readonly DefChamp<T>[];
  form: Partial<T>;
  onChange: (nom: keyof T & string, valeur: unknown) => void;
  erreur: ErreurSaisie | null;
  /** Options des champs `reference`, par nom de champ. */
  references?: Partial<Record<string, OptionSelect[]>>;
}>) {
  return (
    <GrilleSaisie>
      {defs.map((def) => (
        <ChampDeclare
          key={def.nom}
          id={`${prefixe}-${def.nom}`}
          def={def}
          valeur={(form as Record<string, unknown>)[def.nom]}
          onChange={(v) => onChange(def.nom, v)}
          message={messageDuChamp(erreur, def.nom)}
          options={references?.[def.nom]}
        />
      ))}
    </GrilleSaisie>
  );
}

function ChampDeclare<T>({
  id,
  def,
  valeur,
  onChange,
  message,
  options,
}: Readonly<{
  id: string;
  def: DefChamp<T>;
  valeur: unknown;
  onChange: (v: unknown) => void;
  message: string | null;
  options?: OptionSelect[];
}>) {
  if (def.genre === 'reference') {
    return (
      <ChampSelect
        id={id}
        libelle={def.libelle}
        requis={def.requis}
        desactive={def.desactive}
        options={options ?? []}
        valeur={typeof valeur === 'string' ? valeur : undefined}
        onChange={onChange}
        message={message}
        effacable={!def.requis}
      />
    );
  }
  if (def.genre === 'case') {
    return (
      <label htmlFor={id} className={cn('flex items-center gap-2 self-end pb-1.5 text-label', def.large && 'sm:col-span-2')}>
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-primary"
          checked={valeur === true}
          disabled={def.desactive}
          onChange={(e) => onChange(e.target.checked)}
        />
        {def.libelle}
      </label>
    );
  }
  const texte = valeurAffichee(def.genre, valeur);
  const changer = (t: string) => onChange(valeurSaisie(def.genre, t));
  return (
    <ChampCadre id={id} libelle={`${def.libelle}${suffixe(def.genre)}`} requis={def.requis} message={message} large={def.large || def.genre === 'texteLong'}>
      {def.genre === 'texteLong' ? (
        <Textarea id={id} value={texte} disabled={def.desactive} aria-invalid={!!message} onChange={(e) => changer(e.target.value)} />
      ) : (
        <Input
          id={id}
          type={typeInput(def.genre)}
          inputMode={def.genre === 'texte' || def.genre === 'date' ? undefined : 'decimal'}
          value={texte}
          disabled={def.desactive}
          aria-invalid={!!message}
          onChange={(e) => changer(e.target.value)}
        />
      )}
    </ChampCadre>
  );
}

function typeInput(genre: GenreChamp): string {
  if (genre === 'date') return 'date';
  if (genre === 'texte') return 'text';
  return 'number';
}

export function GrilleSaisie({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</div>;
}

export function ChampCadre({
  id,
  libelle,
  requis,
  message,
  large,
  children,
}: Readonly<{ id: string; libelle: string; requis?: boolean; message?: string | null; large?: boolean; children: ReactNode }>) {
  return (
    <FormField className={cn(large && 'sm:col-span-2')} data-invalid={!!message || undefined}>
      <FieldLabel htmlFor={id}>
        {libelle}
        {requis && ' *'}
      </FieldLabel>
      {children}
      {message && <FieldError>{message}</FieldError>}
    </FormField>
  );
}

export function ChampSelect({
  id,
  libelle,
  options,
  valeur,
  onChange,
  requis,
  desactive,
  message,
  aide,
  effacable,
}: Readonly<{
  id: string;
  libelle: string;
  options: OptionSelect[];
  valeur: string | undefined;
  onChange: (v: string | undefined) => void;
  requis?: boolean;
  desactive?: boolean;
  message?: string | null;
  aide?: string;
  /** Bouton « Effacer » : la valeur repart en `champsAVider` à l'enregistrement. */
  effacable?: boolean;
}>) {
  return (
    <ChampCadre id={id} libelle={libelle} requis={requis} message={message}>
      <div className="flex items-center gap-1.5">
        <Select items={options} value={valeur ?? null} disabled={desactive} onValueChange={(v) => onChange((v as string) || undefined)}>
          <SelectTrigger id={id} className="w-full min-w-0" aria-invalid={!!message}>
            <SelectValue placeholder="Choisir…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {effacable && valeur && !desactive && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Effacer « ${libelle} »`} onClick={() => onChange(undefined)}>
            <X />
          </Button>
        )}
      </div>
      {aide && <p className="text-micro text-muted-foreground">{aide}</p>}
    </ChampCadre>
  );
}

/** Erreur répétée sous le formulaire (le champ en faute peut être dans une section repliée hors écran). */
export function PiedFormulaire({
  erreur,
  enCours,
  libelle,
  onAnnuler,
  onValider,
  desactive,
}: Readonly<{
  erreur: ErreurSaisie | null;
  enCours: boolean;
  libelle: string;
  onAnnuler: () => void;
  onValider: () => void;
  desactive?: boolean;
}>) {
  return (
    <>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur.message}</p>}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onAnnuler} disabled={enCours}>Annuler</Button>
        <Button type="button" onClick={onValider} disabled={enCours || desactive}>
          <Check data-icon="inline-start" /> {enCours ? 'Enregistrement…' : libelle}
        </Button>
      </div>
    </>
  );
}
