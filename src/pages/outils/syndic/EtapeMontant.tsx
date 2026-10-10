import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { formatCurrency, todayISO } from '../../../lib/format';
import { enregistrerPaiementSyndic } from '../../../lib/syndic';
import { ErreurVirement } from '../../../lib/virements';
import { ChoixSimple } from '../virements/CadreVirements';
import { MODE_ITEMS, montantSaisi } from './donnees';
import { soldeChaqueReste, type Lot } from './lots';
import type { ModePaiement, PaiementEnregistre, SaisiePaiement } from './types';
import DetailGroupe from './DetailGroupe';

/** Étape 2 : combien, comment. Le service refait tous les contrôles ; un dépassement (RM-09) se confirme ici. */
export default function EtapeMontant({
  lots,
  onRetour,
  onEnregistre,
}: Readonly<{ lots: Lot[]; onRetour: () => void; onEnregistre: (r: PaiementEnregistre) => void }>) {
  const groupe = lots.length > 1;
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState<ModePaiement>('VIREMENT');
  const [date, setDate] = useState(todayISO());
  const [cheque, setCheque] = useState('');
  const [verse, setVerse] = useState(false);
  const [frais, setFrais] = useState('');
  const [fraisAbsorbes, setFraisAbsorbes] = useState(false);
  const [payeur, setPayeur] = useState('');
  const [detail, setDetail] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const total = montantSaisi(montant);
  // Frais bancaires : virement ou chèque d'un seul appartement ; jamais envoyés quand les champs sont cachés.
  const fraisVisibles = !groupe && mode !== 'ESPECES';

  // RM-09 : l'avertissement de dépassement vaut pour la saisie qui l'a provoqué ; il tombe dès qu'elle change.
  function changerMontant(v: string) {
    setMontant(v);
    setAConfirmer(null);
  }

  function changerDetail(d: Record<string, string>) {
    setDetail(d);
    setAConfirmer(null);
  }

  function changerFrais(v: string) {
    setFrais(v);
    setAConfirmer(null);
  }

  function changerAbsorbes(v: boolean) {
    setFraisAbsorbes(v);
    setAConfirmer(null);
  }

  function changerMode(m: ModePaiement) {
    setMode(m);
    setFrais('');
    setFraisAbsorbes(false);
    setAConfirmer(null);
  }

  function saisie(confirmer: boolean): SaisiePaiement {
    const detailUtile = groupe && total !== null && !soldeChaqueReste(total, lots);
    return {
      lignes: lots.map((l) => ({
        appartement: l.code,
        exercice_id: l.exerciceId,
        montant: detailUtile ? (montantSaisi(detail[l.code] ?? '') ?? undefined) : undefined,
      })),
      montant: total ?? 0,
      mode,
      date,
      numero_cheque: mode === 'CHEQUE' ? cheque.trim() : undefined,
      verse_a_la_banque: mode === 'ESPECES' ? verse : undefined,
      frais: fraisVisibles && frais ? (montantSaisi(frais) ?? undefined) : undefined,
      frais_absorbes: fraisVisibles && fraisAbsorbes,
      payeur: payeur.trim() || undefined,
      confirmerDepassement: confirmer,
    };
  }

  async function envoyer(confirmer: boolean) {
    if (enCours) return;
    if (total === null) {
      setErreur('Le montant n’est pas lisible.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      onEnregistre(await enregistrerPaiementSyndic(saisie(confirmer)));
    } catch (e) {
      if (e instanceof ErreurVirement && e.status === 409 && e.corps.confirmation_requise === true) setAConfirmer(e.erreur);
      else setErreur(e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setEnCours(false);
    }
  }

  const titre = groupe ? `2. Combien, comment ? — ${lots.length} appartements` : `2. Combien, comment ? — ${lots[0]?.code ?? ''}`;

  return (
    <Card title={titre}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAConfirmer(null);
          void envoyer(false);
        }}
        autoComplete="off"
        noValidate
      >
        <FieldGroup>
          <p className="text-body text-muted-foreground">
            Reste à payer sur {lots[0]?.exercice} : {lots.map((l) => `${l.code} ${formatCurrency(l.reste)}`).join(' · ')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="sy-montant">{groupe ? 'Montant total reçu (DH)' : 'Montant reçu (DH)'}</FieldLabel>
              <Input id="sy-montant" inputMode="decimal" placeholder="0,00" value={montant} onChange={(e) => changerMontant(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="sy-date">Date du paiement</FieldLabel>
              <Input id="sy-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="sy-mode">Comment a-t-il payé ?</FieldLabel>
              <ChoixSimple id="sy-mode" items={MODE_ITEMS} value={mode} onChange={changerMode} />
            </FormField>
            {mode === 'CHEQUE' && (
              <FormField>
                <FieldLabel htmlFor="sy-cheque">N° du chèque</FieldLabel>
                <Input id="sy-cheque" value={cheque} maxLength={50} onChange={(e) => setCheque(e.target.value)} />
              </FormField>
            )}
            {mode === 'ESPECES' && (
              <label className="flex items-center gap-2 self-end text-body">
                <input type="checkbox" checked={verse} onChange={(e) => setVerse(e.target.checked)} className="size-4 accent-(--primary)" />
                Versées au guichet de la banque
              </label>
            )}
          </div>

          {groupe && <DetailGroupe lots={lots} total={total} detail={detail} onDetail={changerDetail} />}

          {fraisVisibles && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="sy-frais">Frais retenus par la banque (facultatif)</FieldLabel>
                <Input id="sy-frais" inputMode="decimal" placeholder="0,00" value={frais} onChange={(e) => changerFrais(e.target.value)} />
              </FormField>
              <label className="flex items-center gap-2 self-end text-body">
                <input type="checkbox" checked={fraisAbsorbes} onChange={(e) => changerAbsorbes(e.target.checked)} className="size-4 accent-(--primary)" />
                Le syndic prend les frais à sa charge
              </label>
            </div>
          )}

          <FormField>
            <FieldLabel htmlFor="sy-payeur">Payé par quelqu’un d’autre ? (facultatif)</FieldLabel>
            <Input id="sy-payeur" value={payeur} maxLength={200} onChange={(e) => setPayeur(e.target.value)} placeholder="Nom de la personne qui a versé" />
          </FormField>
        </FieldGroup>

        {erreur && (
          <p role="alert" className="mt-3 text-body text-destructive">
            {erreur}
          </p>
        )}
        {aConfirmer && (
          <div role="alert" className="mt-3 flex flex-col gap-2 rounded-md border border-(--amber) bg-(--amber-bg) p-3 text-body text-(--amber)">
            <span className="flex items-start gap-2">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {aConfirmer}
            </span>
            <Button type="button" variant="outline" size="sm" className="self-start" disabled={enCours} onClick={() => void envoyer(true)}>
              Oui, c’est voulu : enregistrer quand même
            </Button>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="ghost" onClick={onRetour}>
            Retour
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer le paiement'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
