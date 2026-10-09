import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { creerCleApi } from '../../lib/api';
import { PORTEES_CLE_API, PORTEES_N8N } from '../../lib/clesApi';
import type { CleApiCreeeDto, PorteeCleApi } from '../../types';

/** Création d'une clé d'API — `POST /api/cles-api`. Trois champs, dont deux
 * obligatoires : le nom (unique, il devient aussi le code du compte de
 * service) et au moins une portée. Le préréglage coché est celui de n8n,
 * le cas d'usage qui a motivé la fonctionnalité (FEATURE §8).
 *
 * `compteCode` reste un champ libre et non un sélecteur de comptes : le cas
 * nominal est de laisser le serveur créer le compte, et un sélecteur
 * inviterait à rattacher la clé à un compte humain — dont elle hériterait
 * le périmètre, ce que la FEATURE ne recommande pas. */
export default function CreerCleApiDialog({
  onClose,
  onCreated,
}: Readonly<{
  onClose: () => void;
  /** Reçoit le secret en clair : à afficher **tout de suite**, il ne sera
   * plus jamais renvoyé. */
  onCreated: (resultat: CleApiCreeeDto) => void;
}>) {
  const [nom, setNom] = useState('');
  const [portees, setPortees] = useState<Set<PorteeCleApi>>(new Set(PORTEES_N8N));
  const [compteCode, setCompteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const canSubmit = nom.trim().length > 0 && nom.trim().length <= 100 && portees.size > 0;

  function basculer(code: PorteeCleApi) {
    setPortees((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErreur(null);
    try {
      const resultat = await creerCleApi({
        nom: nom.trim(),
        // Dans l'ordre du référentiel, pas dans l'ordre des clics.
        portees: PORTEES_CLE_API.map((p) => p.code).filter((c) => portees.has(c)),
        compteCode: compteCode.trim() || undefined,
      });
      onCreated(resultat);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nouvelle clé d'API" onClose={onClose} width={520}>
      <form onSubmit={creer}>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="ca-nom">Nom du client *</FieldLabel>
            <Input
              id="ca-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="n8n"
              maxLength={100}
              autoFocus
              required
            />
            <p className="text-micro text-muted-foreground">
              Unique. Devient aussi le nom du compte de service, donc l'auteur de tout ce que la clé écrira.
            </p>
          </FormField>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label font-medium text-foreground">Portées *</legend>
            {PORTEES_CLE_API.map((p) => (
              <label key={p.code} className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border px-3 py-2 hover:bg-muted/40 has-checked:border-primary/40 has-checked:bg-primary/5">
                <input
                  type="checkbox"
                  className="mt-0.5 size-3.5 shrink-0 accent-primary"
                  checked={portees.has(p.code)}
                  onChange={() => basculer(p.code)}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body font-medium text-foreground">{p.libelle}</span>
                  <span className="text-micro text-muted-foreground">{p.description}</span>
                </span>
              </label>
            ))}
            {portees.size === 0 && (
              <p className="text-micro text-destructive">Au moins une portée est requise : sans elle, la clé ne pourrait rien appeler.</p>
            )}
          </fieldset>

          <FormField>
            <FieldLabel htmlFor="ca-compte">Compte de service existant (optionnel)</FieldLabel>
            <Input
              id="ca-compte"
              value={compteCode}
              onChange={(e) => setCompteCode(e.target.value)}
              placeholder="Code AdmUser — laisser vide pour en créer un"
            />
            <p className="text-micro text-muted-foreground">
              Vide : un compte est créé au nom de la clé, sans employé ni rôle. Un compte humain lui transmettrait
              son périmètre commercial.
            </p>
          </FormField>
        </FieldGroup>

        {erreur && <p className="mt-3 text-body text-destructive">{erreur}</p>}

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button type="submit" disabled={!canSubmit || busy}>
            <KeyRound data-icon="inline-start" /> {busy ? 'Création…' : 'Créer la clé'}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
