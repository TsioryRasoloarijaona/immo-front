import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, FileDown, Plus, X } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import SearchableSelect from '../../../components/SearchableSelect';
import { formatCurrency, todayISO } from '../../../lib/format';
import ApercuCourrier from './ApercuCourrier';
import CadreVirements, { ChoixSimple } from './CadreVirements';
import { useNotification } from './useNotification';
import OrdreDetailDialog from './OrdreDetailDialog';
import {
  LIBELLE_TYPE,
  majVirements,
  natureDuType,
  nouvelId,
  piecesVides,
  prochainNumero,
  useVirements,
  type Ordre,
  type TypeVirement,
} from './donnees';

type Mode = 'seul' | 'groupe';
type Ligne = { cle: string; beneficiaireId: string | null; montant: string };

const TYPE_ITEMS = (Object.keys(LIBELLE_TYPE) as TypeVirement[]).map((t) => ({ value: t, label: LIBELLE_TYPE[t] }));
const MODE_ITEMS: { value: Mode; label: string }[] = [
  { value: 'seul', label: 'Un seul bénéficiaire' },
  { value: 'groupe', label: 'Plusieurs bénéficiaires — virement groupé' },
];

function ligneVide(): Ligne {
  return { cle: nouvelId('l'), beneficiaireId: null, montant: '' };
}

/** « Nouvel ordre » : le formulaire à gauche, le courrier à droite, mis à jour
 * à chaque frappe. La génération est simulée : l'ordre (ou un ordre par ligne
 * pour un virement groupé) entre dans l'historique, aucun PDF n'est produit. */
export default function NouvelOrdre() {
  const { societes, beneficiaires, ordres } = useVirements();
  const [notification, notifier] = useNotification();

  const [societeId, setSocieteId] = useState(() => (societes.find((s) => s.parDefaut) ?? societes[0])?.id ?? '');
  const [type, setType] = useState<TypeVirement>('fournisseur');
  const [mode, setMode] = useState<Mode>('seul');
  const [beneficiaireId, setBeneficiaireId] = useState<string | null>(null);
  const [montant, setMontant] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>(() => [ligneVide(), ligneVide()]);
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [generes, setGeneres] = useState<Ordre[] | null>(null);
  const [ordreOuvert, setOrdreOuvert] = useState<string | null>(null);

  const societe = societes.find((s) => s.id === societeId);
  const nature = natureDuType(type);
  const options = useMemo(
    () => beneficiaires.filter((b) => b.nature === nature).map((b) => ({ value: b.id, label: b.nom })),
    [beneficiaires, nature],
  );
  const parId = (id: string | null) => beneficiaires.find((b) => b.id === id);
  const choisi = parId(beneficiaireId);

  const lignesCourrier =
    mode === 'seul'
      ? [{ beneficiaire: choisi?.nom ?? '', rib: choisi?.rib ?? '', montant: Number(montant) || null }]
      : lignes.map((l) => {
          const b = parId(l.beneficiaireId);
          return { beneficiaire: b?.nom ?? '', rib: b?.rib ?? '', montant: Number(l.montant) || null };
        });
  const total = lignesCourrier.reduce((s, l) => s + (l.montant ?? 0), 0);

  function changerType(t: TypeVirement) {
    // Un salarié n'a rien à faire dans un règlement fournisseur, et
    // inversement : la sélection en cours est vidée plutôt que conservée
    // hors de sa liste.
    setType(t);
    setBeneficiaireId(null);
    setLignes((ls) => ls.map((l) => ({ ...l, beneficiaireId: null })));
  }

  function majLigne(cle: string, patch: Partial<Ligne>) {
    setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, ...patch } : l)));
  }

  function generer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    const valides = lignesCourrier.filter((l) => l.beneficiaire && l.montant && l.montant > 0);
    if (!societe) return setErreur('Choisissez une société émettrice.');
    if (valides.length !== lignesCourrier.length || valides.length === 0) {
      return setErreur('Chaque ligne doit avoir un bénéficiaire enregistré et un montant supérieur à zéro.');
    }
    if (!date) return setErreur('La date est obligatoire.');

    const groupe = valides.length > 1 ? `G-${nouvelId('').slice(-4).toUpperCase()}` : undefined;
    const ids = mode === 'seul' ? [beneficiaireId] : lignes.map((l) => l.beneficiaireId);
    const nouveaux: Ordre[] = valides.map((l, i) => ({
      id: nouvelId('o'),
      numero: prochainNumero(ordres, i),
      date,
      societeId: societe.id,
      type,
      beneficiaireId: ids[i] ?? '',
      beneficiaire: l.beneficiaire,
      rib: l.rib,
      montant: l.montant ?? 0,
      reference: reference.trim(),
      statut: 'emis',
      groupe,
      pieces: piecesVides(type),
      autresPieces: [],
    }));
    majVirements((s) => ({ ...s, ordres: [...nouveaux, ...s.ordres] }));
    setGeneres(nouveaux);
    notifier('Maquette : l\'ordre est ajouté à l\'historique, aucun PDF n\'est produit.');
  }

  function recommencer() {
    setGeneres(null);
    setBeneficiaireId(null);
    setMontant('');
    setLignes([ligneVide(), ligneVide()]);
    setReference('');
  }

  return (
    <CadreVirements ecran="Nouvel ordre">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(340px,440px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card title="Détails du virement">
            <form onSubmit={generer} autoComplete="off">
              <FieldGroup>
                {/* Masqué tant qu'il n'y a qu'une société : il n'apprendrait rien. */}
                {societes.length > 1 && (
                  <FormField>
                    <FieldLabel htmlFor="vo-societe">Société émettrice</FieldLabel>
                    <ChoixSimple
                      id="vo-societe"
                      items={societes.map((s) => ({ value: s.id, label: s.nom }))}
                      value={societeId}
                      onChange={setSocieteId}
                    />
                  </FormField>
                )}

                <FormField>
                  <FieldLabel htmlFor="vo-type">Type de virement</FieldLabel>
                  <ChoixSimple id="vo-type" items={TYPE_ITEMS} value={type} onChange={changerType} />
                  <p className="text-micro text-muted-foreground">Décide de la formulation du courrier et des pièces à réunir.</p>
                </FormField>

                <FormField>
                  <FieldLabel htmlFor="vo-mode">Bénéficiaires</FieldLabel>
                  <ChoixSimple id="vo-mode" items={MODE_ITEMS} value={mode} onChange={setMode} />
                  {mode === 'groupe' && (
                    <p className="text-micro text-muted-foreground">
                      Un seul courrier à la banque, une ligne par bénéficiaire. Chacun garde son propre numéro d'ordre et son
                      dossier de pièces.
                    </p>
                  )}
                </FormField>

                {mode === 'seul' ? (
                  <>
                    <FormField>
                      <FieldLabel htmlFor="vo-beneficiaire">{type === 'salaire' ? 'Salarié' : 'Fournisseur'}</FieldLabel>
                      <SearchableSelect
                        id="vo-beneficiaire"
                        items={options}
                        value={beneficiaireId}
                        onValueChange={setBeneficiaireId}
                        placeholder={type === 'salaire' ? 'Rechercher un salarié…' : 'Rechercher un fournisseur…'}
                        emptyMessage="Aucun bénéficiaire de ce nom."
                      />
                    </FormField>
                    <FormField>
                      <FieldLabel htmlFor="vo-rib">RIB</FieldLabel>
                      <Input id="vo-rib" value={choisi?.rib ?? ''} readOnly placeholder="Sélectionnez un bénéficiaire" className="font-mono" />
                      <p className="text-micro text-muted-foreground">
                        Rempli d'après le bénéficiaire. Nouveau bénéficiaire ? Ajoutez-le dans{' '}
                        <Link to="/outils/virements/beneficiaires" className="text-primary underline-offset-2 hover:underline">
                          Bénéficiaires
                        </Link>
                        .
                      </p>
                    </FormField>
                    <FormField>
                      <FieldLabel htmlFor="vo-montant">Montant (DH)</FieldLabel>
                      <Input
                        id="vo-montant"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                      />
                    </FormField>
                  </>
                ) : (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-label font-medium text-foreground">Lignes du virement</legend>
                    {lignes.map((l, i) => (
                      <div key={l.cle} className="grid grid-cols-[minmax(0,1fr)_7.5rem_auto] items-center gap-1.5">
                        <SearchableSelect
                          items={options}
                          value={l.beneficiaireId}
                          onValueChange={(v) => majLigne(l.cle, { beneficiaireId: v })}
                          placeholder={`Bénéficiaire ${i + 1}`}
                          emptyMessage="Aucun bénéficiaire de ce nom."
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Montant"
                          aria-label={`Montant de la ligne ${i + 1}`}
                          value={l.montant}
                          onChange={(e) => majLigne(l.cle, { montant: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Retirer la ligne ${i + 1}`}
                          title="Retirer la ligne"
                          disabled={lignes.length <= 2}
                          onClick={() => setLignes((ls) => ls.filter((x) => x.cle !== l.cle))}
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setLignes((ls) => [...ls, ligneVide()])}>
                        <Plus data-icon="inline-start" /> Ajouter un bénéficiaire
                      </Button>
                      <span className="text-body text-muted-foreground">
                        Total <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                      </span>
                    </div>
                  </fieldset>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FormField>
                    <FieldLabel htmlFor="vo-date">Date</FieldLabel>
                    <Input id="vo-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="vo-reference">Référence (facultatif)</FieldLabel>
                    <Input id="vo-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex : Décompte n°7" />
                  </FormField>
                </div>
              </FieldGroup>

              {erreur && <p className="mt-3 text-body text-destructive">{erreur}</p>}

              <Button type="submit" className="mt-4 w-full" disabled={generes !== null}>
                <FileDown data-icon="inline-start" /> Générer le PDF
              </Button>
            </form>
          </Card>

          {generes && (
            <Card accent="var(--success)">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--success)" />
                  <div className="text-body">
                    <p className="font-medium text-foreground">
                      {generes.length > 1
                        ? `${generes.length} ordres enregistrés (${generes[0].numero} à ${generes[generes.length - 1].numero}).`
                        : `Ordre ${generes[0].numero} enregistré dans l'historique.`}
                    </p>
                    <p className="text-muted-foreground">Il reste à y joindre les justificatifs.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {generes.map((o) => (
                    <Button key={o.id} type="button" variant="outline" size="sm" onClick={() => setOrdreOuvert(o.id)}>
                      Compléter le dossier{generes.length > 1 ? ` — ${o.beneficiaire}` : ''}
                    </Button>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => notifier('Maquette : aucun PDF archivé à retélécharger.')}>
                    <Download data-icon="inline-start" /> Retélécharger le PDF
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={recommencer}>
                    Plus tard — nouvel ordre
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card title="Aperçu du document">
          <div className="flex justify-center rounded-lg bg-muted/60 p-4 sm:p-6">
            <ApercuCourrier
              societe={societe}
              type={type}
              lignes={lignesCourrier}
              date={date}
              reference={reference.trim()}
              className="max-w-[620px]"
            />
          </div>
        </Card>
      </div>

      {ordreOuvert && <OrdreDetailDialog ordreId={ordreOuvert} onClose={() => setOrdreOuvert(null)} notifier={notifier} />}
      {notification}
    </CadreVirements>
  );
}
