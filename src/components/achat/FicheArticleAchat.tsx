import { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../Modal';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { oublierLecturesRecentes } from '../../lib/api';
import { listChoixReferentiel } from '../../lib/apiReferentielsAdmin';
import { creerArticleAchat, listerSousFamillesAchat, modifierArticleAchat } from '../../lib/apiArticlesAchat';
import { corpsDepuis, type BrouillonArticle } from '../../lib/articlesAchat';
import { useConfirm } from '../../lib/confirmContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-60';
const ROUTE = '/api/referentiels-admin/choix/';

const MONTANTS_TVA: { montant: 'prixUnitaireHT' | 'coutLogistiqueHT' | 'coutIndirectHT' | 'coutFinancierHT' | 'prixVenteHT';
  tva: 'coutLogistiqueTva' | 'coutIndirectTva' | 'coutFinancierTva' | 'venteTva' | null; libelle: string }[] = [
  { montant: 'prixUnitaireHT', tva: null, libelle: 'P.U. HT' },
  { montant: 'coutLogistiqueHT', tva: 'coutLogistiqueTva', libelle: 'Coût logistique' },
  { montant: 'coutIndirectHT', tva: 'coutIndirectTva', libelle: 'Coût indirect' },
  { montant: 'coutFinancierHT', tva: 'coutFinancierTva', libelle: 'Coût financier' },
  { montant: 'prixVenteHT', tva: 'venteTva', libelle: 'Vente P.U.' },
];

/** Fiche d'un article d'achat : création (`id` absent), modification ou lecture seule (`lecture`) ; erreur serveur affichée telle quelle. */
export default function FicheArticleAchat({ id, initial, lecture, onClose, onEnregistre }: Readonly<{
  id?: UUID;
  initial: BrouillonArticle;
  lecture: boolean;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const confirm = useConfirm();
  const categories = useApi(() => listChoixReferentiel(`${ROUTE}categories-comptables`), [], 'achat-choix-categories');
  const familles = useApi(() => listChoixReferentiel(`${ROUTE}familles-achat`), [], 'achat-choix-familles');
  const sousFamilles = useApi(listerSousFamillesAchat, [], 'achat-sous-familles');
  const [b, setB] = useState<BrouillonArticle>(initial);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const modifie = JSON.stringify(b) !== JSON.stringify(initial);
  const maj = (cle: keyof BrouillonArticle, valeur: string) => setB((p) => ({ ...p, [cle]: valeur }));
  const sousFamillesVisibles = (sousFamilles.data ?? []).filter((s) => !b.familleId || s.familleId === b.familleId);

  function changerFamille(familleId: string) {
    const courante = sousFamilles.data?.find((s) => s.id === b.sousFamilleId);
    setB((p) => ({ ...p, familleId, sousFamilleId: courante && courante.familleId !== familleId ? '' : p.sousFamilleId }));
  }

  function changerSousFamille(sousFamilleId: string) {
    const choisie = sousFamilles.data?.find((s) => s.id === sousFamilleId);
    setB((p) => ({ ...p, sousFamilleId, familleId: choisie?.familleId ?? p.familleId }));
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const corps = corpsDepuis(b);
      await (id ? modifierArticleAchat(id, corps) : creerArticleAchat(corps));
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  async function fermer() {
    if (!modifie || lecture) return onClose();
    const ok = await confirm({
      title: 'Enregistrer les modifications ?',
      message: 'Des modifications n\'ont pas été enregistrées.',
      confirmLabel: 'Enregistrer',
      cancelLabel: 'Ne pas enregistrer',
    });
    if (ok) await enregistrer();
    else onClose();
  }

  return (
    <Modal title={id ? `Article ${initial.code}` : 'Nouvel article'} onClose={() => void fermer()} width={760}>
      <form onSubmit={(e) => { e.preventDefault(); void enregistrer(); }} className="flex flex-col gap-3">
        {!lecture && (
          <BarreIcones className="flex items-center gap-1">
            <Button type="submit" variant="ghost" size="sm" disabled={envoi}><Save /> Enregistrer</Button>
          </BarreIcones>
        )}
        <fieldset disabled={lecture} className="grid grid-cols-2 gap-3 border-0 p-0">
          <Field>
            <FieldLabel htmlFor="aa-code">Code *</FieldLabel>
            <Input id="aa-code" value={b.code} onChange={(e) => maj('code', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="aa-unite">Unité</FieldLabel>
            <Input id="aa-unite" value={b.unite} onChange={(e) => maj('unite', e.target.value)} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="aa-desc">Description *</FieldLabel>
            <Input id="aa-desc" value={b.description} onChange={(e) => maj('description', e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="aa-cat">Catégorie *</FieldLabel>
            <select id="aa-cat" className={CLASSE_SELECT} value={b.categorieComptableId} onChange={(e) => maj('categorieComptableId', e.target.value)}>
              <option value="" />
              {categories.data?.map((c) => <option key={c.id} value={c.id}>{[c.code, c.description].filter(Boolean).join(' — ')}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="aa-fam">Famille</FieldLabel>
            <select id="aa-fam" className={CLASSE_SELECT} value={b.familleId} onChange={(e) => changerFamille(e.target.value)}>
              <option value="" />
              {familles.data?.map((f) => <option key={f.id} value={f.id}>{[f.code, f.description].filter(Boolean).join(' — ')}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="aa-sf">Sous-famille *</FieldLabel>
            <select id="aa-sf" className={CLASSE_SELECT} value={b.sousFamilleId} onChange={(e) => changerSousFamille(e.target.value)}>
              <option value="" />
              {sousFamillesVisibles.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.description}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="aa-fodec">FODEC (%)</FieldLabel>
            <Input id="aa-fodec" type="number" step="any" value={b.fodec} onChange={(e) => maj('fodec', e.target.value)} />
          </Field>
          {MONTANTS_TVA.map(({ montant, tva, libelle }) => (
            <div key={montant} className="col-span-2 grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor={`aa-${montant}`}>{libelle} HT</FieldLabel>
                <Input id={`aa-${montant}`} type="number" step="any" value={b[montant]} onChange={(e) => maj(montant, e.target.value)} />
              </Field>
              {tva && (
                <Field>
                  <FieldLabel htmlFor={`aa-${tva}`}>{libelle} TVA (%)</FieldLabel>
                  <Input id={`aa-${tva}`} type="number" step="any" value={b[tva]} onChange={(e) => maj(tva, e.target.value)} />
                </Field>
              )}
            </div>
          ))}
          <Field className="col-span-2">
            <FieldLabel htmlFor="aa-notes">Notes</FieldLabel>
            <Input id="aa-notes" value={b.notes} onChange={(e) => maj('notes', e.target.value)} />
          </Field>
        </fieldset>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </form>
    </Modal>
  );
}
