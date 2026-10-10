import { useState } from 'react';
import { Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { formatCurrency, formatDate } from '../../../lib/format';
import { enregistrerReglagesSyndic, lireReglagesSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { rafraichir } from '../virements/contexte';
import { useNotification } from '../virements/useNotification';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import { texteErreur } from './donnees';
import { montantPourSaisie } from './periode';
import type { GroupeReglages, ReglagesSyndic as Reglages } from './types';

interface Champ {
  cle: string;
  libelle: string;
  valeur: (r: Reglages) => string;
  type?: 'date';
}

const texte = (cle: keyof Reglages, libelle: string): Champ => ({ cle, libelle, valeur: (r) => String(r[cle] ?? '') });
const montant = (v: number | null) => (v === null ? '' : montantPourSaisie(v));

/** Les écrans de réglages de syndic-admod qui alimentent les documents (sans comptes, sauvegarde ni démarrage). */
const GROUPES: { groupe: GroupeReglages; titre: string; detail: string; champs: Champ[] }[] = [
  { groupe: 'societe', titre: 'La société', detail: 'En haut de chaque document. Nom et adresse obligatoires.',
    champs: [texte('societe_nom', 'Nom'), texte('adresse', 'Adresse'), texte('telephone', 'Téléphone'), texte('email', 'Adresse e-mail')] },
  { groupe: 'mentions', titre: 'ICE, RC, IF, patente', detail: 'Ceux du syndic, surtout pas ceux de la banque.',
    champs: [texte('ice', 'ICE'), texte('rc', 'RC'), texte('identifiant_fiscal', 'IF'), texte('patente', 'Patente')] },
  { groupe: 'banque', titre: 'Le compte en banque', detail: 'Recopié tel quel sur le papier pour la banque : une erreur ici envoie l’argent ailleurs.',
    champs: [texte('banque_nom', 'Banque'), texte('rib', 'RIB'), texte('iban', 'IBAN'), texte('bic', 'BIC')] },
  { groupe: 'depart', titre: 'Le point de départ du compte', detail: 'Recopiez un relevé : ce qui est daté de ce jour ou après s’y ajoute ou s’en retire.',
    champs: [
      { cle: 'montant', libelle: 'Sur le compte d’après le relevé (DH)', valeur: (r) => montant(r.releve_depart) },
      { cle: 'date', libelle: 'Date du relevé', valeur: (r) => r.releve_depart_date ?? '', type: 'date' },
    ] },
  { groupe: 'signature', titre: 'Le signataire', detail: 'Celui qui signe les documents.', champs: [texte('responsable_commercial', 'Nom du responsable commercial')] },
  { groupe: 'textes', titre: 'Phrase du bas des reçus', detail: 'Les reçus déjà émis gardent le texte du jour de leur émission.',
    champs: [texte('texte_pied_recu', 'Phrase du bas des reçus')] },
  { groupe: 'tarifs', titre: 'Montant par mois et durée', detail: 'Proposés à l’ouverture d’un exercice. Les exercices déjà ouverts ne changent pas.',
    champs: [
      { cle: 'tarif_mensuel', libelle: 'Montant par mois (DH)', valeur: (r) => montant(r.tarif_mensuel_defaut) },
      { cle: 'duree_mois', libelle: 'Nombre de mois', valeur: (r) => String(r.duree_mois_defaut) },
    ] },
];

export default function ReglagesSyndicPage() {
  return <CadreSyndic ecran="Réglages">{(ctx) => <EcranReglages ctx={ctx} />}</CadreSyndic>;
}

function EcranReglages({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const toasts = useNotification();
  // Un non-admin ne demande rien : le service répondrait 403.
  const { data, error } = useApi(() => (ctx.admin ? lireReglagesSyndic() : Promise.resolve(null)), [ctx.admin, ctx.revision]);
  if (!ctx.admin) return <EmptyState title="Réservé aux administrateurs" message="Les réglages du syndic ne s’ouvrent qu’aux administrateurs du service." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className="text-body text-muted-foreground">
        Un exercice s’ouvre aujourd’hui à {formatCurrency(data.tarif_mensuel_defaut)} par mois pendant {data.duree_mois_defaut} mois.
        {data.releve_depart_date && ` Le compte part du relevé du ${formatDate(data.releve_depart_date)}.`}
      </p>
      {data.a_completer.length > 0 && (
        <p className="rounded-md border border-(--amber) bg-(--amber-bg) px-3 py-2 text-body text-(--amber)">
          Les documents s’impriment avec des blancs tant qu’il manque : {data.a_completer.join(', ')}.
        </p>
      )}
      {GROUPES.map((g) => (
        // Remonté quand les valeurs enregistrées changent : le formulaire repart de ce que le service a gardé.
        <Groupe key={`${g.groupe}:${g.champs.map((c) => c.valeur(data)).join('|')}`} {...g} reglages={data} onPhrase={(p) => toasts.notifier(p)} />
      ))}
      {toasts.noeud}
    </div>
  );
}

function Groupe({
  groupe,
  titre,
  detail,
  champs,
  reglages,
  onPhrase,
}: Readonly<{ groupe: GroupeReglages; titre: string; detail: string; champs: Champ[]; reglages: Reglages; onPhrase: (p: string) => void }>) {
  const depart = Object.fromEntries(champs.map((c) => [c.cle, c.valeur(reglages)]));
  const [valeurs, setValeurs] = useState<Record<string, string>>(depart);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const modifie = champs.some((c) => valeurs[c.cle] !== depart[c.cle]);

  async function envoyer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      onPhrase((await enregistrerReglagesSyndic(groupe, valeurs)).phrase);
      rafraichir();
    } catch (err) {
      setErreur(texteErreur(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Card title={titre}>
      <form onSubmit={envoyer} autoComplete="off" noValidate>
        <p className="mb-3 text-body text-muted-foreground">{detail}</p>
        <FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            {champs.map((c) => (
              <FormField key={c.cle}>
                <FieldLabel htmlFor={`sy-rg-${groupe}-${c.cle}`}>{c.libelle}</FieldLabel>
                <Input
                  id={`sy-rg-${groupe}-${c.cle}`}
                  type={c.type ?? 'text'}
                  value={valeurs[c.cle] ?? ''}
                  maxLength={1000}
                  onChange={(e) => setValeurs({ ...valeurs, [c.cle]: e.target.value })}
                />
              </FormField>
            ))}
          </div>
        </FieldGroup>
        {erreur && (
          <p role="alert" className="mt-3 text-body text-destructive">
            {erreur}
          </p>
        )}
        <Button type="submit" size="sm" className="mt-3" disabled={enCours || !modifie}>
          Enregistrer
        </Button>
      </form>
    </Card>
  );
}
