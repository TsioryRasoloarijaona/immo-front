import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useApi } from '../../../lib/useApi';
import { ErreurVirement, listerBeneficiaires, listerSocietes, modifierOrdre } from '../../../lib/virements';
import { ChoixSimple } from './CadreVirements';
import { rafraichir } from './contexte';
import { libelleChoixType, statutItems } from './donnees';
import ModaleSaisie from './ModaleSaisie';
import type { Meta, ModifierOrdre, Moi, Ordre, StatutOrdre, TypeVirement } from './types';
import type { Notifications } from './useNotification';

type Brouillon = {
  societe_id: string;
  type_virement: TypeVirement;
  fournisseur_nom: string;
  rib: string;
  montant: string;
  date_virement: string;
  reference: string;
  statut: StatutOrdre;
  note: string;
};

/** Ce qu'un non-admin peut modifier sur un ordre émis (règle du service). */
const CHAMPS_UTILISATEUR: (keyof Brouillon)[] = ['statut', 'reference', 'note'];

function depuis(o: Ordre): Brouillon {
  return {
    societe_id: o.societe_id != null ? String(o.societe_id) : '',
    type_virement: o.type_virement,
    fournisseur_nom: o.fournisseur_nom,
    rib: o.rib,
    montant: String(o.montant),
    date_virement: o.date_virement,
    reference: o.reference ?? '',
    statut: o.statut,
    note: o.note ?? '',
  };
}

/** Seuls les champs changés partent dans le `PATCH` : le service refait le PDF dès qu'un champ imprimé change. */
export default function ModifierOrdreDialog({
  ordre,
  meta,
  moi,
  onClose,
  toasts,
}: Readonly<{
  ordre: Ordre;
  meta: Meta;
  moi: Moi;
  onClose: () => void;
  toasts: Notifications;
}>) {
  const admin = moi.admin;
  const societesApi = useApi(() => (admin ? listerSocietes() : Promise.resolve([])), [admin]);
  const beneficiairesApi = useApi(() => (admin ? listerBeneficiaires() : Promise.resolve([])), [admin]);
  const initial = depuis(ordre);
  const [b, setB] = useState<Brouillon>(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const maj = (patch: Partial<Brouillon>) => setB((x) => ({ ...x, ...patch }));

  // Rétrogradé en cours d'édition (403 → `/moi` relu) : il garde sa saisie, seuls ses champs permis partent.
  const changes = (Object.keys(initial) as (keyof Brouillon)[]).filter(
    (k) => b[k] !== initial[k] && (admin || CHAMPS_UTILISATEUR.includes(k)),
  );
  const modifie = changes.length > 0;

  const societes = societesApi.data ?? [];
  const beneficiaires = beneficiairesApi.data ?? [];
  // Une société supprimée depuis n'est plus listée : gardée en option pour ne pas afficher un choix vide.
  const societeItems = [
    ...societes.map((s) => ({ value: String(s.id), label: s.nom })),
    ...(initial.societe_id && !societes.some((s) => String(s.id) === initial.societe_id)
      ? [{ value: initial.societe_id, label: ordre.societe_nom ?? '—' }]
      : []),
  ];

  function changerNom(nom: string) {
    const connu = beneficiaires.find((x) => x.nom.trim().toLowerCase() === nom.trim().toLowerCase());
    maj(connu ? { fournisseur_nom: nom, rib: connu.rib } : { fournisseur_nom: nom });
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (enCours) return;
    if (!modifie) {
      toasts.notifier('Aucune modification à enregistrer.', 'avertissement');
      return;
    }
    const corps: ModifierOrdre = {};
    for (const k of changes) {
      if (k === 'montant') {
        const n = Number(b.montant.replace(',', '.'));
        if (!Number.isFinite(n) || n <= 0) return setErreur('Le montant doit être supérieur à zéro.');
        corps.montant = n;
      } else if (k === 'societe_id') corps.societe_id = Number(b.societe_id);
      else if (k === 'statut') corps.statut = b.statut;
      else if (k === 'type_virement') corps.type_virement = b.type_virement;
      else corps[k] = b[k].trim();
    }
    setErreur(null);
    setEnCours(true);
    try {
      const o = await modifierOrdre(ordre.id, corps);
      rafraichir();
      toasts.notifier(`Ordre ${o.numero} modifié avec succès.`);
      onClose();
    } catch (err) {
      // 400 près du formulaire ; un 403 se signale aussi en toast.
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.');
      if (err instanceof ErreurVirement && err.status === 403) toasts.notifierErreur(err);
    } finally {
      setEnCours(false);
    }
  }

  const sousTitre = ordre.groupe
    ? `Ordre du virement groupé ${ordre.groupe} : société, type, date et référence s'appliquent à tout le groupe, et le PDF commun sera regénéré.`
    : 'Le PDF archivé sera regénéré avec les nouvelles valeurs.';

  return (
    <ModaleSaisie titre={`Modifier ${ordre.numero}`} modifie={modifie} onClose={onClose} width={620}>
      {(fermer) => (
        <form onSubmit={enregistrer} autoComplete="off" noValidate>
          <p className="-mt-2 mb-3 text-body text-muted-foreground">
            {admin ? sousTitre : 'Seuls le statut, la référence et la note se modifient ici ; le reste est réservé aux administrateurs.'}
          </p>
          <FieldGroup>
            {admin && (
              <>
                <datalist id="mo-suggestions">
                  {beneficiaires.map((x) => (
                    <option key={x.id} value={x.nom} />
                  ))}
                </datalist>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField>
                    <FieldLabel htmlFor="mo-societe">Société émettrice</FieldLabel>
                    <ChoixSimple id="mo-societe" items={societeItems} value={b.societe_id} onChange={(v) => maj({ societe_id: v })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="mo-type">Type de virement</FieldLabel>
                    <ChoixSimple
                      id="mo-type"
                      items={Object.keys(meta.types_virement).map((t) => ({ value: t as TypeVirement, label: libelleChoixType(meta, t) }))}
                      value={b.type_virement}
                      onChange={(v) => maj({ type_virement: v })}
                    />
                  </FormField>
                </div>
                <FormField>
                  <FieldLabel htmlFor="mo-beneficiaire">Bénéficiaire</FieldLabel>
                  <Input id="mo-beneficiaire" list="mo-suggestions" value={b.fournisseur_nom} maxLength={200} onChange={(e) => changerNom(e.target.value)} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="mo-rib">RIB</FieldLabel>
                  <Input id="mo-rib" className="font-mono" value={b.rib} maxLength={60} onChange={(e) => maj({ rib: e.target.value })} />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField>
                    <FieldLabel htmlFor="mo-montant">Montant (DH)</FieldLabel>
                    <Input
                      id="mo-montant"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={b.montant}
                      onChange={(e) => maj({ montant: e.target.value })}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="mo-date">Date</FieldLabel>
                    <Input id="mo-date" type="date" value={b.date_virement} onChange={(e) => maj({ date_virement: e.target.value })} />
                  </FormField>
                </div>
              </>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="mo-reference">Référence (facultatif)</FieldLabel>
                <Input id="mo-reference" value={b.reference} maxLength={200} onChange={(e) => maj({ reference: e.target.value })} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="mo-statut">Statut</FieldLabel>
                <ChoixSimple id="mo-statut" items={statutItems(meta)} value={b.statut} onChange={(v) => maj({ statut: v })} />
              </FormField>
            </div>
            <FormField>
              <FieldLabel htmlFor="mo-note">Note (facultatif)</FieldLabel>
              <Textarea id="mo-note" rows={2} maxLength={2000} value={b.note} onChange={(e) => maj({ note: e.target.value })} />
            </FormField>
          </FieldGroup>
          {erreur && (
            <p role="alert" className="mt-3 text-body text-destructive">
              {erreur}
            </p>
          )}
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={fermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      )}
    </ModaleSaisie>
  );
}
