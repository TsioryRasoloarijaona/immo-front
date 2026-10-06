import { useState, type ReactNode } from 'react';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { todayISO } from '../../../lib/format';
import ApercuCourrier from './ApercuCourrier';
import { ChoixSimple } from './CadreVirements';
import { majVirements, nouvelId, type ModeEntete, type PoliceDocument, type Societe, type TypeVirement } from './donnees';

const POLICE_ITEMS: { value: PoliceDocument; label: string }[] = [
  { value: 'helvetica', label: 'Sans empattement (Helvetica)' },
  { value: 'times', label: 'Avec empattements (Times)' },
];
const ENTETE_ITEMS: { value: ModeEntete; label: string }[] = [
  { value: 'logo', label: 'Image (logo)' },
  { value: 'texte', label: 'Texte' },
  { value: 'aucun', label: 'Aucun' },
];
const APERCU_ITEMS: { value: TypeVirement; label: string }[] = [
  { value: 'fournisseur', label: 'Aperçu : règlement fournisseur' },
  { value: 'salaire', label: 'Aperçu : salaire' },
];

const VIERGE: Omit<Societe, 'id'> = {
  nom: '',
  banque: '',
  ville: '',
  compte: '',
  signataire: '',
  parDefaut: false,
  police: 'helvetica',
  enteteMode: 'logo',
  enteteTitre: '',
  enteteTaille: 22,
  enteteSousTitre: '',
  enteteDroite: '',
  enteteFilet: false,
  objet: 'Ordre de virements bancaires Express',
  corpsFournisseur:
    'Par le débit de notre compte n° {compte} ouvert dans vos livres au nom de la société {societe}, nous vous prions de bien vouloir effectuer le virement suivant :',
  ligneFournisseur: '{montant} DH à la Société {beneficiaire}',
  corpsSalaire:
    'Par le débit de notre compte n° {compte} ouvert au nom de la société {societe}, nous vous prions de bien vouloir virer le salaire suivant :',
  ligneSalaire: '{montant} DH à {beneficiaire}',
  signataireGauche: '',
  pied: '',
  cloture: true,
  salutationGrasse: false,
  societeGrasse: true,
  montantsGras: true,
  beneficiaireGras: false,
};

const LIGNE_EXEMPLE = { fournisseur: { beneficiaire: 'SOTRAMEC SARL', rib: '230 780 4521873211004500 12', montant: 185000 }, salaire: { beneficiaire: 'Monsieur Othman DIOURI', rib: '230 780 0000998877665544 10', montant: 18500 } };

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-border pb-1 text-label font-semibold text-foreground">{titre}</h2>
      {children}
    </section>
  );
}

function Case({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-body text-foreground">
      <input type="checkbox" className="size-3.5 shrink-0 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

/** Société émettrice : identité bancaire et modèle de courrier, avec
 * l'aperçu du courrier à côté — le modèle se règle en le regardant, pas en
 * générant un PDF d'essai à chaque retouche. */
export default function SocieteDialog({
  societe,
  onClose,
  notifier,
}: {
  societe?: Societe;
  onClose: () => void;
  notifier: (msg: string) => void;
}) {
  const [s, setS] = useState<Societe>(() => societe ?? { ...VIERGE, id: nouvelId('s') });
  const [apercu, setApercu] = useState<TypeVirement>('fournisseur');
  const maj = (patch: Partial<Societe>) => setS((x) => ({ ...x, ...patch }));

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    majVirements((etat) => {
      // Une seule société présélectionnée : cocher celle-ci décoche les autres.
      const autres = etat.societes.map((x) => (s.parDefaut && x.id !== s.id ? { ...x, parDefaut: false } : x));
      return {
        ...etat,
        societes: societe ? autres.map((x) => (x.id === s.id ? s : x)) : [...autres, s],
      };
    });
    notifier(societe ? `Société « ${s.nom} » modifiée.` : `Société « ${s.nom} » ajoutée.`);
    onClose();
  }

  const champ = (id: keyof Societe, libelle: string, props: { placeholder?: string; mono?: boolean; required?: boolean } = {}) => (
    <FormField>
      <FieldLabel htmlFor={`so-${id}`}>{libelle}</FieldLabel>
      <Input
        id={`so-${id}`}
        value={String(s[id] ?? '')}
        onChange={(e) => maj({ [id]: e.target.value } as Partial<Societe>)}
        placeholder={props.placeholder}
        required={props.required}
        className={props.mono ? 'font-mono' : undefined}
      />
    </FormField>
  );

  const texte = (id: keyof Societe, libelle: string, props: { placeholder?: string; rows?: number; required?: boolean } = {}) => (
    <FormField>
      <FieldLabel htmlFor={`so-${id}`}>{libelle}</FieldLabel>
      <Textarea
        id={`so-${id}`}
        rows={props.rows ?? 2}
        value={String(s[id] ?? '')}
        onChange={(e) => maj({ [id]: e.target.value } as Partial<Societe>)}
        placeholder={props.placeholder}
        required={props.required}
      />
    </FormField>
  );

  return (
    <Modal title={societe ? `Modifier ${societe.nom}` : 'Ajouter une société'} onClose={onClose} width="min(1180px, calc(100vw - 2rem))">
      <p className="-mt-2 mb-3 text-body text-muted-foreground">
        Identité bancaire et modèle de courrier. Ces valeurs sont imprimées telles quelles sur le courrier envoyé à la banque.
      </p>
      <form onSubmit={enregistrer}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <FieldGroup>
            <Section titre="Identité">
              <div className="grid gap-3 sm:grid-cols-2">
                {champ('nom', 'Nom de la société', { placeholder: 'Ex : GHRIZA', required: true })}
                {champ('banque', 'Banque', { placeholder: 'Ex : CIH BANK', required: true })}
                {champ('ville', 'Ville', { placeholder: 'Ex : CASABLANCA', required: true })}
                {champ('compte', 'Numéro de compte', { placeholder: 'Ex : 8152915221009500', mono: true, required: true })}
                {champ('signataire', 'Signataire', { placeholder: 'Ex : M. Ali Jamal DIOURI', required: true })}
                <FormField>
                  <FieldLabel htmlFor="so-logo">Logo (facultatif)</FieldLabel>
                  <Input id="so-logo" type="file" accept=".png,.jpg,.jpeg" onChange={() => notifier('Maquette : le logo n\'est pas enregistré.')} />
                </FormField>
              </div>
              <p className="text-micro text-muted-foreground">
                Le logo est un bandeau sur toute la largeur du document, coordonnées comprises : une image large convient le
                mieux (1416 × 234 px pour GHRIZA). PNG ou JPG, 2 Mo maximum.
              </p>
              <Case checked={s.parDefaut} onChange={(v) => maj({ parDefaut: v })}>
                Présélectionner cette société dans le formulaire
              </Case>
            </Section>

            <Section titre="Modèle de courrier">
              <p className="text-micro text-muted-foreground">
                Relevé sur le courrier réel de la société. Entre accolades, <code className="font-mono">{'{societe}'}</code>,{' '}
                <code className="font-mono">{'{compte}'}</code>, <code className="font-mono">{'{montant}'}</code> et{' '}
                <code className="font-mono">{'{beneficiaire}'}</code> sont remplacés à la génération.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField>
                  <FieldLabel htmlFor="so-police">Police du document</FieldLabel>
                  <ChoixSimple id="so-police" items={POLICE_ITEMS} value={s.police} onChange={(v) => maj({ police: v })} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="so-entete">En-tête</FieldLabel>
                  <ChoixSimple id="so-entete" items={ENTETE_ITEMS} value={s.enteteMode} onChange={(v) => maj({ enteteMode: v })} />
                </FormField>
              </div>

              {s.enteteMode === 'texte' && (
                <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                    {texte('enteteTitre', "Titre de l'en-tête", { placeholder: 'Ex : DIOURI ARCHI SARL' })}
                    <FormField>
                      <FieldLabel htmlFor="so-taille">Taille (pt)</FieldLabel>
                      <Input
                        id="so-taille"
                        type="number"
                        min={8}
                        max={48}
                        value={s.enteteTaille}
                        onChange={(e) => maj({ enteteTaille: Number(e.target.value) || 22 })}
                      />
                    </FormField>
                  </div>
                  {texte('enteteSousTitre', 'Sous-titre (facultatif)', { placeholder: 'Ex : Siège Social : 26 Avenue Mers Sultan' })}
                  {texte('enteteDroite', 'Bloc de droite (facultatif)', { placeholder: 'Téléphone, e-mail, ICE, RC…', rows: 3 })}
                  <Case checked={s.enteteFilet} onChange={(v) => maj({ enteteFilet: v })}>
                    Trait horizontal sous l'en-tête
                  </Case>
                </div>
              )}

              {champ('objet', 'Objet', { placeholder: 'Ex : Ordre de virements bancaires Express', required: true })}
            </Section>

            <Section titre="Règlement d'un fournisseur">
              {texte('corpsFournisseur', 'Phrase du corps', { rows: 3, required: true })}
              {champ('ligneFournisseur', 'Ligne de virement', { placeholder: '{montant} DH à la Société {beneficiaire}', required: true })}
            </Section>

            <Section titre="Salaire du personnel">
              {texte('corpsSalaire', 'Phrase du corps', { rows: 3, required: true })}
              {champ('ligneSalaire', 'Ligne de virement', { placeholder: '{montant} DH à {beneficiaire}', required: true })}
              <p className="-mt-1 text-micro text-muted-foreground">
                La civilité se tape avec le nom du bénéficiaire (« Monsieur Othman DIOURI »), pour ne pas la figer dans le modèle.
              </p>
              {champ('signataireGauche', 'Second signataire, à gauche (facultatif)', { placeholder: 'Ex : {beneficiaire}' })}
              <p className="-mt-1 text-micro text-muted-foreground">
                Le bénéficiaire contresigne, comme sur le courrier ADMOD. Laisser vide pour n'avoir qu'une signature.
              </p>
            </Section>

            <Section titre="Mise en forme">
              {texte('pied', 'Pied de page (facultatif)', { placeholder: 'Ex : ICE : 003775054000075' })}
              <div className="grid gap-2 sm:grid-cols-2">
                <Case checked={s.cloture} onChange={(v) => maj({ cloture: v })}>Paragraphe de remerciement final</Case>
                <Case checked={s.salutationGrasse} onChange={(v) => maj({ salutationGrasse: v })}>« Madame, Monsieur, » en gras</Case>
                <Case checked={s.societeGrasse} onChange={(v) => maj({ societeGrasse: v })}>Nom de la société en gras</Case>
                <Case checked={s.montantsGras} onChange={(v) => maj({ montantsGras: v })}>Montant, compte et RIB en gras</Case>
                <Case checked={s.beneficiaireGras} onChange={(v) => maj({ beneficiaireGras: v })}>Nom du bénéficiaire en gras</Case>
              </div>
            </Section>
          </FieldGroup>

          <div className="flex flex-col gap-2 lg:sticky lg:top-0">
            <ChoixSimple items={APERCU_ITEMS} value={apercu} onChange={setApercu} />
            <div className="rounded-lg bg-muted/60 p-3">
              <ApercuCourrier societe={s} type={apercu} lignes={[LIGNE_EXEMPLE[apercu]]} date={todayISO()} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
