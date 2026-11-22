import type { SearchableSelectOption } from '../SearchableSelect';
import { ChampListe, ChampNombre, ChampTexte } from '../achat/champsSaisieAchat';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { formatCurrency } from '../../lib/format';
import { resteAAffecter, STATUTS_SAISIE, totalAffecte } from '../../lib/saisieDecaissement';
import type { SaisieDecaissementDto } from '../../types/tresorerie';

export interface ListesDecaissement {
  societes: SearchableSelectOption[];
  types: SearchableSelectOption[];
  comptes: SearchableSelectOption[];
  banques: SearchableSelectOption[];
  tiers: SearchableSelectOption[];
  tiersAutrui: SearchableSelectOption[];
}

type Maj = (patch: Partial<SaisieDecaissementDto>) => void;

function Lecture({ id, libelle, valeur }: Readonly<{ id: string; libelle: string; valeur: string }>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      <Input id={id} readOnly value={valeur} />
    </Field>
  );
}

/** Champs de l'en-tête d'un décaissement ; l'état et les listes viennent de la fenêtre. */
export default function ChampsDecaissement({ b, maj, listes, societeModifiable, codes }: Readonly<{
  b: SaisieDecaissementDto;
  maj: Maj;
  listes: ListesDecaissement;
  societeModifiable: boolean;
  codes: { codeRecu: string | null; codeFeuillePaiement: string | null; codeFeuilleRs: string | null };
}>) {
  const texte = (id: string, libelle: string, cle: 'reference' | 'notes' | 'dateDocument' | 'dateEcheance' | 'dateDecaissement', type: 'text' | 'date' = 'text') => (
    <ChampTexte id={id} libelle={libelle} type={type} valeur={b[cle] ?? ''} onChange={(v) => maj({ [cle]: v || null })} />
  );
  const liste = (id: string, libelle: string, cle: 'societeId' | 'typeId' | 'compteId' | 'banqueId' | 'fournisseurId' | 'payeurId' | 'notaireId' | 'tiersAutruiId', items: SearchableSelectOption[], extra?: { requis?: boolean; disabled?: boolean }) => (
    <ChampListe id={id} libelle={libelle} items={items} valeur={b[cle] ?? null} onChange={(v) => maj({ [cle]: v })} {...extra} />
  );
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {liste('dec-societe', 'Société', 'societeId', listes.societes, { requis: true, disabled: !societeModifiable })}
      {liste('dec-type', 'Type', 'typeId', listes.types, { requis: true })}
      {texte('dec-reference', 'Référence', 'reference')}
      {texte('dec-date', 'Date pièce', 'dateDocument', 'date')}
      {texte('dec-echeance', 'Échéance', 'dateEcheance', 'date')}
      <Field>
        <FieldLabel htmlFor="dec-montant">Montant *</FieldLabel>
        <ChampNombre id="dec-montant" libelle="Montant" valeur={b.montant || null} onChange={(v) => maj({ montant: v ?? 0 })} />
      </Field>
      {liste('dec-fournisseur', 'Fournisseur', 'fournisseurId', listes.tiers, { requis: true })}
      {liste('dec-payeur', 'Tiers payeur', 'payeurId', listes.tiers)}
      {liste('dec-autrui', 'Tiers autrui', 'tiersAutruiId', listes.tiersAutrui)}
      {liste('dec-notaire', 'Notaire', 'notaireId', listes.tiers)}
      {liste('dec-banque', 'Banque', 'banqueId', listes.banques)}
      {liste('dec-compte', 'Compte', 'compteId', listes.comptes)}
      <ChampListe id="dec-statut" libelle="État" items={STATUTS_SAISIE} valeur={b.statut} onChange={(v) => v && maj({ statut: v as SaisieDecaissementDto['statut'] })} requis />
      {texte('dec-pointage', 'Date de pointage', 'dateDecaissement', 'date')}
      <Lecture id="dec-recu" libelle="Reçu" valeur={codes.codeRecu ?? ''} />
      <Lecture id="dec-pp" libelle="Code P.P" valeur={codes.codeFeuillePaiement ?? ''} />
      <Lecture id="dec-cras" libelle="Code C.R.A.S" valeur={codes.codeFeuilleRs ?? ''} />
      <Lecture id="dec-affecte" libelle="Montant affecté" valeur={formatCurrency(totalAffecte(b.lignes))} />
      <Lecture id="dec-reste" libelle="Reste à affecter" valeur={formatCurrency(resteAAffecter(b))} />
      <div className="md:col-span-3">{texte('dec-notes', 'Notes', 'notes')}</div>
    </div>
  );
}
