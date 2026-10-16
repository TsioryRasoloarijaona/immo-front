import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { creerModele } from '../../lib/apiModeles';
import type { CategorieModeleDto, ModeleDocumentDetailDto } from '../../types/modeles';

/** Code dérivé du libellé : majuscules sans accents, chiffres et `_` (règle du serveur). */
function codeDepuis(libelle: string): string {
  const brut = libelle
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, '_');
  let debut = 0;
  let fin = brut.length;
  while (debut < fin && brut[debut] === '_') debut++;
  while (fin > debut && brut[fin - 1] === '_') fin--;
  return brut.slice(debut, fin).slice(0, 60);
}

const CODE_VALIDE = /^[A-Z0-9_]{1,60}$/;

/** Création : version 1 vide, puis ouverture de l'éditeur. */
export default function NouveauModeleDialog({
  categories,
  onClose,
  onCree,
}: Readonly<{
  categories: CategorieModeleDto[];
  onClose: () => void;
  onCree: (modele: ModeleDocumentDetailDto) => void;
}>) {
  const [categorie, setCategorie] = useState(categories[0]?.code ?? '');
  const [libelle, setLibelle] = useState('');
  const [code, setCode] = useState('');
  const [codeSaisi, setCodeSaisi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const codeEffectif = codeSaisi ? code : codeDepuis(libelle);
  const valide = categorie !== '' && libelle.trim() !== '' && CODE_VALIDE.test(codeEffectif);

  async function creer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!valide) return;
    setBusy(true);
    setErreur(null);
    try {
      onCree(await creerModele({ categorie, code: codeEffectif, libelle: libelle.trim(), contenu: '<p></p>' }));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la création.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nouveau modèle de document" onClose={onClose} width={480}>
      <form onSubmit={creer}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="nm-categorie">Catégorie</FieldLabel>
            <select
              id="nm-categorie"
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.code} value={c.code}>{c.libelle}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="nm-libelle">Libellé *</FieldLabel>
            <Input
              id="nm-libelle"
              value={libelle}
              maxLength={200}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Lettre de bienvenue"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- boîte de dialogue : le focus initial y est attendu
              autoFocus
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="nm-code">Code *</FieldLabel>
            <Input
              id="nm-code"
              value={codeEffectif}
              maxLength={60}
              onChange={(e) => {
                setCodeSaisi(true);
                setCode(e.target.value.toUpperCase());
              }}
              className="font-mono"
            />
            <p className="text-micro text-muted-foreground">Majuscules, chiffres et _. Unique dans la catégorie et définitif.</p>
          </Field>
        </FieldGroup>
        {erreur && <p role="alert" className="mt-3 text-body text-destructive">{erreur}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button type="submit" disabled={!valide || busy}>
            <FilePlus2 data-icon="inline-start" /> {busy ? 'Création…' : 'Créer et éditer'}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
