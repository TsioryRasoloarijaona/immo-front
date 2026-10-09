import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, FileDown, Plus, X } from 'lucide-react';
import { Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { formatCurrency, todayISO } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { creerOrdre, creerOrdreGroupe, lienPdfOrdre, listerBeneficiaires, listerSocietes } from '../../../lib/virements';
import { cn } from '../../../lib/utils';
import ApercuCourrier from './ApercuCourrier';
import CadreVirements, { ChoixSimple, type ContexteCharge } from './CadreVirements';
import { rafraichir } from './contexte';
import { libelleChoixType, natureDuType, normaliser, pluriel } from './donnees';
import OrdreDetailDialog from './OrdreDetailDialog';
import type { Beneficiaire, Ordre, TypeVirement } from './types';
import { useNotification } from './useNotification';

type Mode = 'seul' | 'groupe';
type Ligne = { cle: number; nom: string; montant: string };

const MODE_ITEMS: { value: Mode; label: string }[] = [
  { value: 'seul', label: 'Un seul bénéficiaire' },
  { value: 'groupe', label: 'Plusieurs bénéficiaires — virement groupé' },
];

let compteurLignes = 0;
const ligne = (nom = '', montant = ''): Ligne => ({ cle: ++compteurLignes, nom, montant });

function montantSaisi(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function NouvelOrdre() {
  return <CadreVirements ecran="Nouvel ordre">{(ctx) => <Formulaire ctx={ctx} />}</CadreVirements>;
}

function libelleRib(rib: string | undefined, nom: string): string {
  if (rib) return `RIB ${rib}`;
  return nom.trim() ? 'Bénéficiaire non enregistré' : ' ';
}

function libelleGenerer(enCours: boolean, groupe: boolean): string {
  if (enCours) return 'Enregistrement…';
  return groupe ? 'Générer le PDF groupé' : 'Générer le PDF';
}

/** Générer = un seul appel : le service construit et archive le PDF dans la même transaction que l'ordre. */
function Formulaire({ ctx }: Readonly<{ ctx: ContexteCharge }>) {
  const { meta, revision } = ctx;
  const navigate = useNavigate();
  const toasts = useNotification();
  const societesApi = useApi(listerSocietes, [revision]);
  const beneficiairesApi = useApi(listerBeneficiaires, [revision]);

  const [choixSociete, setChoixSociete] = useState<number | null>(null);
  const [type, setType] = useState<TypeVirement>('fournisseur');
  const [mode, setMode] = useState<Mode>('seul');
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [lignes, setLignes] = useState<Ligne[]>(() => [ligne(), ligne()]);
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [lignesFautives, setLignesFautives] = useState<Set<number>>(new Set());
  const [enCours, setEnCours] = useState(false);
  const [genere, setGenere] = useState<{ ordres: Ordre[]; groupe: string | null } | null>(null);
  const [ordreOuvert, setOrdreOuvert] = useState<number | null>(null);

  const societes = societesApi.data ?? [];
  const beneficiaires = beneficiairesApi.data ?? [];
  const societe =
    societes.find((s) => s.id === choixSociete) ?? societes.find((s) => s.par_defaut) ?? societes.at(0);

  const parNom = useMemo(() => {
    const m = new Map<string, Beneficiaire>();
    for (const b of beneficiairesApi.data ?? []) m.set(b.nom.trim().toLowerCase(), b);
    return m;
  }, [beneficiairesApi.data]);
  const ribDe = (n: string) => parNom.get(n.trim().toLowerCase())?.rib ?? '';
  const nature = natureDuType(type);
  const suggestions = beneficiaires.filter((b) => b.type === nature);

  const typeItems = Object.keys(meta.types_virement).map((t) => ({ value: t as TypeVirement, label: libelleChoixType(meta, t) }));
  const aReunir = (meta.dossiers[type] ?? [])
    .filter((t) => t !== 'ordre_pdf')
    .map((t) => (meta.types_pieces[t]?.libelle ?? t).toLowerCase())
    .join(', ');

  // Lignes entièrement vides ignorées, à l'envoi comme dans l'aperçu. Ce total n'est qu'un aperçu de saisie :
  // le seul chiffre calculé à l'écran, les autres viennent du serveur.
  const lignesRemplies = lignes.filter((l) => l.nom.trim() || l.montant.trim());
  const lignesCourrier =
    mode === 'seul'
      ? [{ beneficiaire: nom, rib: ribDe(nom), montant: montantSaisi(montant) }]
      : lignesRemplies.map((l) => ({ beneficiaire: l.nom, rib: ribDe(l.nom), montant: montantSaisi(l.montant) }));
  const totalSaisi = lignesRemplies.reduce((s, l) => s + (montantSaisi(l.montant) ?? 0), 0);

  function changerMode(m: Mode) {
    if (m === mode) return;
    if (m === 'groupe') setLignes([ligne(nom, montant), ligne()]);
    else {
      const premiere = lignes.find((l) => l.nom.trim() || l.montant.trim());
      setNom(premiere?.nom ?? '');
      setMontant(premiere?.montant ?? '');
    }
    setMode(m);
    setErreur(null);
    setLignesFautives(new Set());
  }

  function majLigne(cle: number, patch: Partial<Ligne>) {
    setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, ...patch } : l)));
  }

  /** Le serveur refait ces contrôles. */
  function controler(): string | null {
    setLignesFautives(new Set());
    if (!societe) return 'Aucune société émettrice : ajoutez-en une dans l\'écran « Sociétés ».';
    if (mode === 'seul') {
      if (!nom.trim() || !ribDe(nom) || !montantSaisi(montant) || !date) return 'Merci de remplir tous les champs obligatoires.';
      return null;
    }
    if (!date) return 'Merci de remplir tous les champs obligatoires.';
    if (lignesRemplies.length < 2) return 'Un virement groupé compte au moins deux bénéficiaires.';
    const vus = new Set<string>();
    for (const l of lignesRemplies) {
      const n = lignes.indexOf(l) + 1;
      if (!ribDe(l.nom)) {
        setLignesFautives(new Set([l.cle]));
        return `Ligne ${n} : « ${l.nom.trim() || '—'} » n'est pas un bénéficiaire enregistré. Ajoutez-le dans l'onglet « Bénéficiaires ».`;
      }
      if (!montantSaisi(l.montant)) {
        setLignesFautives(new Set([l.cle]));
        return `Ligne ${n} : le montant doit être supérieur à zéro.`;
      }
      const cle = normaliser(l.nom);
      if (vus.has(cle)) {
        setLignesFautives(new Set([l.cle]));
        return `Ligne ${n} : « ${l.nom.trim()} » figure deux fois.`;
      }
      vus.add(cle);
    }
    return null;
  }

  async function generer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (enCours) return;
    const refus = controler();
    setErreur(refus);
    if (refus || !societe) return;
    setEnCours(true);
    // `controler()` a déjà refusé tout montant absent ou nul : le repli à 0 n'est jamais pris.
    const montantControle = (saisie: string) => montantSaisi(saisie) ?? 0;
    try {
      const entete = { date_virement: date, reference: reference.trim(), societe_id: societe.id, type_virement: type };
      if (mode === 'seul') {
        const o = await creerOrdre({ ...entete, fournisseur_nom: nom.trim(), rib: ribDe(nom), montant: montantControle(montant) });
        setGenere({ ordres: [o], groupe: null });
      } else {
        const r = await creerOrdreGroupe({
          ...entete,
          lignes: lignesRemplies.map((l) => ({ fournisseur_nom: l.nom.trim(), rib: ribDe(l.nom), montant: montantControle(l.montant) })),
        });
        setGenere({ ordres: r.ordres, groupe: r.groupe });
      }
      setNom('');
      setMontant('');
      setLignes([ligne(), ligne()]);
      setReference('');
      // Le serveur a pu créer un bénéficiaire ou mettre à jour un RIB.
      rafraichir();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setEnCours(false);
    }
  }

  if (societesApi.error && !societesApi.data) return <ErrorState message={societesApi.error} />;
  if (!societesApi.data) return <LoadingState />;
  if (societes.length === 0) {
    return <EmptyState title="Aucune société émettrice" message="Ajoutez la société émettrice des ordres dans l'écran « Sociétés »." />;
  }

  const premier = genere?.ordres[0];
  const dernier = genere?.ordres[genere.ordres.length - 1];
  const aJoindreAChacun = (genere?.ordres.length ?? 0) > 1 ? ' (à joindre à chacun)' : '';

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(340px,460px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card title="Détails du virement">
          <form onSubmit={generer} autoComplete="off" noValidate>
            <datalist id="vo-suggestions">
              {suggestions.map((b) => (
                <option key={b.id} value={b.nom} />
              ))}
            </datalist>
            <FieldGroup>
              {/* Masqué tant qu'il n'y a qu'une société : il n'apprendrait rien. */}
              {societes.length > 1 && societe && (
                <FormField>
                  <FieldLabel htmlFor="vo-societe">Société émettrice</FieldLabel>
                  <ChoixSimple
                    id="vo-societe"
                    items={societes.map((s) => ({ value: String(s.id), label: s.nom }))}
                    value={String(societe.id)}
                    onChange={(v) => setChoixSociete(Number(v))}
                  />
                </FormField>
              )}

              <FormField>
                <FieldLabel htmlFor="vo-type">Type de virement</FieldLabel>
                <ChoixSimple id="vo-type" items={typeItems} value={type} onChange={setType} />
                <p className="text-micro text-muted-foreground">
                  Le courrier dira « {type === 'salaire' ? 'un virement de salaire' : 'un virement'} ». Dossier à réunir : {aReunir}.
                </p>
              </FormField>

              <FormField>
                <FieldLabel htmlFor="vo-mode">Bénéficiaires</FieldLabel>
                <ChoixSimple id="vo-mode" items={MODE_ITEMS} value={mode} onChange={changerMode} />
              </FormField>

              {mode === 'seul' ? (
                <>
                  <FormField>
                    <FieldLabel htmlFor="vo-beneficiaire">{type === 'salaire' ? 'Bénéficiaire' : 'Fournisseur'}</FieldLabel>
                    <Input
                      id="vo-beneficiaire"
                      list="vo-suggestions"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder={type === 'salaire' ? 'Nom du salarié' : 'Nom du fournisseur'}
                      maxLength={200}
                    />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="vo-rib">RIB</FieldLabel>
                    <Input id="vo-rib" value={ribDe(nom)} readOnly tabIndex={-1} placeholder="Rempli d'après le bénéficiaire" className="font-mono" />
                    <p className="text-micro text-muted-foreground">
                      Nouveau bénéficiaire ? Ajoutez-le dans l'onglet «{' '}
                      <Link to="/outils/virements/beneficiaires" className="text-primary underline-offset-2 hover:underline">
                        Bénéficiaires
                      </Link>{' '}
                      ».
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
                    <div
                      key={l.cle}
                      className={cn(
                        'grid grid-cols-[minmax(0,1fr)_7rem_auto] items-start gap-1.5 rounded-md',
                        lignesFautives.has(l.cle) && 'bg-destructive/10 ring-1 ring-destructive/40',
                      )}
                    >
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Input
                          list="vo-suggestions"
                          aria-label={`Bénéficiaire de la ligne ${i + 1}`}
                          placeholder={`Bénéficiaire ${i + 1}`}
                          value={l.nom}
                          onChange={(e) => majLigne(l.cle, { nom: e.target.value })}
                          maxLength={200}
                        />
                        <span className="truncate px-1 font-mono text-micro text-muted-foreground" title={ribDe(l.nom)}>
                          {libelleRib(ribDe(l.nom), l.nom)}
                        </span>
                      </div>
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
                        title={lignes.length <= 2 ? 'Un virement groupé garde au moins deux lignes' : 'Retirer la ligne'}
                        disabled={lignes.length <= 2}
                        onClick={() => setLignes((ls) => ls.filter((x) => x.cle !== l.cle))}
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  <p className="text-body text-muted-foreground">
                    {pluriel(lignesRemplies.length, 'bénéficiaire')} · total{' '}
                    <span className="font-semibold text-foreground">{formatCurrency(totalSaisi)}</span>
                  </p>
                  <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setLignes((ls) => [...ls, ligne()])}>
                    <Plus data-icon="inline-start" /> Ajouter un bénéficiaire
                  </Button>
                </fieldset>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField>
                  <FieldLabel htmlFor="vo-date">Date</FieldLabel>
                  <Input id="vo-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="vo-reference">Référence (facultatif)</FieldLabel>
                  <Input id="vo-reference" value={reference} maxLength={200} onChange={(e) => setReference(e.target.value)} placeholder="Ex : Décompte n°7" />
                </FormField>
              </div>
            </FieldGroup>

            {erreur && (
              <p role="alert" className="mt-3 text-body text-destructive">
                {erreur}
              </p>
            )}

            <Button type="submit" className="mt-4 w-full" disabled={enCours}>
              <FileDown data-icon="inline-start" />
              {libelleGenerer(enCours, mode === 'groupe')}
            </Button>
          </form>
        </Card>

        {genere && premier && dernier && (
          <Card accent="var(--success)">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--success)" />
                <div className="text-body">
                  <p className="text-foreground">
                    {genere.ordres.length > 1 ? (
                      <>
                        Ordres <strong className="font-mono">{premier.numero}</strong> à <strong className="font-mono">{dernier.numero}</strong> enregistrés
                        dans l'historique.
                      </>
                    ) : (
                      <>
                        Ordre <strong className="font-mono">{premier.numero}</strong> enregistré dans l'historique.
                      </>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {premier.manquants.length === 0
                      ? 'Le dossier est complet.'
                      : `Il reste à y joindre ${premier.manquants.join(', ').toLowerCase()}${aJoindreAChacun}.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    genere.groupe
                      ? navigate(`/outils/virements/historique?groupe=${encodeURIComponent(genere.groupe)}`)
                      : setOrdreOuvert(premier.id)
                  }
                >
                  Compléter le dossier
                </Button>
                <a href={lienPdfOrdre(premier.id, true)} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  <Download data-icon="inline-start" /> Télécharger le PDF
                </a>
                <Button type="button" variant="ghost" size="sm" onClick={() => setGenere(null)}>
                  Plus tard
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card title="Aperçu du courrier">
        <div className="flex justify-center rounded-lg bg-muted/60 p-4 sm:p-6">
          <ApercuCourrier societe={societe} type={type} lignes={lignesCourrier} date={date} reference={reference.trim()} className="max-w-[620px]" />
        </div>
      </Card>

      {ordreOuvert !== null && <OrdreDetailDialog ordreId={ordreOuvert} meta={meta} moi={ctx.moi} onClose={() => setOrdreOuvert(null)} toasts={toasts} />}
      {toasts.noeud}
    </div>
  );
}
