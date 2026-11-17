import { useState } from 'react';
import { Save, SaveAll, X } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import FenetreFiche from '../fiche/FenetreFiche';
import type { SearchableSelectOption } from '../SearchableSelect';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { ChampListe, ChampNombre, ChampTexte } from './champsSaisieAchat';
import GrilleLignesSaisieAchat from './GrilleLignesSaisieAchat';
import TotauxSaisieAchat from './TotauxSaisieAchat';
import VentilationProjetsSaisie from './VentilationProjetsSaisie';
import { ApiError, oublierLecturesRecentes } from '../../lib/api';
import { creerPieceAchat, getDocumentAchat, getModelePieceAchat, getReferentielsAchat, modifierPieceAchat } from '../../lib/apiAchat';
import { getReferentielPatrimoine } from '../../lib/apiPatrimoine';
import { getReferentielsProjet, listLots } from '../../lib/apiProjet';
import { messageActionPieceAchat } from '../../lib/actionsPieceAchat';
import { useConfirm } from '../../lib/confirmContext';
import { intituleDocumentAchat } from '../../lib/documentsAchat';
import {
  champErreurServeur, depuisDetail, depuisModele, tvaParDefautPourcent, verifier, versRequete, type BrouillonPiece,
} from '../../lib/saisiePieceAchat';
import { refetchAllApis, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { DocumentAchatDetailDto, ModelePieceAchatDto, ReferentielsAchatDto } from '../../types/achat';

const NATURE = "Pièce d'achat";

interface Listes {
  societes: SearchableSelectOption[];
  modules: SearchableSelectOption[];
  fournisseurs: SearchableSelectOption[];
  projets: SearchableSelectOption[];
  typesLot: SearchableSelectOption[];
  declencheurs: SearchableSelectOption[];
  categories: SearchableSelectOption[];
}

type Element = { id: UUID | null; code?: string | null; description?: string | null };
const options = (items: Element[]): SearchableSelectOption[] =>
  items.flatMap((i) => (i.id ? [{ value: i.id, label: [i.code, i.description].filter(Boolean).join(' — ') || i.id }] : []));

function listesDe(r: ReferentielsAchatDto, categories: Element[], personnels: Element[]): Listes {
  return {
    societes: options(r.societes),
    modules: r.modules.flatMap((m) => (m.id ? [{ value: m.id, label: m.libelle }] : [])),
    fournisseurs: r.fournisseurs.map((f) => ({ value: f.id, label: f.nom ?? f.id })),
    projets: options(r.projets),
    typesLot: r.typesLot.map((t) => ({ value: t.id, label: t.libelle ?? t.code ?? t.id })),
    declencheurs: options(personnels),
    categories: options(categories),
  };
}

function ChampLecture({ id, libelle, valeur }: Readonly<{ id: string; libelle: string; valeur: string | null }>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      <Input id={id} readOnly value={valeur ?? '—'} />
    </Field>
  );
}

type Maj = (patch: Partial<BrouillonPiece>) => void;

function EnteteSaisie({ b, maj, erreurs, listes, statut, dossierGroupement, factureSource }: Readonly<{
  b: BrouillonPiece;
  maj: Maj;
  erreurs: Record<string, string>;
  listes: Listes;
  statut: string | null;
  dossierGroupement: string | null;
  factureSource: string | null;
}>) {
  const { data: lots } = useApi(
    () => (b.projetId ? listLots({ projetIds: [b.projetId] }, { page: 0, size: 200 }) : Promise.resolve(null)),
    [b.projetId],
  );
  const texte = (id: keyof BrouillonPiece, libelle: string, type: 'text' | 'date' = 'text', requis = false) => (
    <ChampTexte id={`saisie-${id}`} libelle={libelle} type={type} requis={requis} erreur={erreurs[id]}
      valeur={b[id] as string} onChange={(v) => maj({ [id]: v })} />
  );
  const liste = (id: keyof BrouillonPiece, libelle: string, items: SearchableSelectOption[], requis = false) => (
    <ChampListe id={`saisie-${id}`} libelle={libelle} items={items} requis={requis} erreur={erreurs[id]}
      valeur={b[id] as UUID | null} onChange={(v) => maj({ [id]: v })} />
  );
  const nombre = (id: 'montantRegul' | 'timbreFiscal', libelle: string) => (
    <Field data-invalid={!!erreurs[id]}>
      <FieldLabel htmlFor={`saisie-${id}`}>{libelle} *</FieldLabel>
      <ChampNombre id={`saisie-${id}`} libelle={libelle} valeur={b[id]} onChange={(v) => maj({ [id]: v })} />
      <FieldError>{erreurs[id]}</FieldError>
    </Field>
  );
  return (
    <div className="grid grid-cols-3 gap-3">
      {texte('dateDocument', 'Date pièce', 'date', true)}
      {texte('dateEcheance', 'Échéance (vide = calculée)', 'date')}
      {b.nature === 'ORDER' && texte('dateLivraisonSouhaitee', 'Livraison souhaitée', 'date')}
      {liste('societeId', 'Entité (société)', listes.societes, true)}
      {liste('moduleId', 'Module', listes.modules, true)}
      {liste('fournisseurId', 'Fournisseur', listes.fournisseurs, true)}
      <ChampListe id="saisie-projetId" libelle="Projet" items={listes.projets} valeur={b.projetId} erreur={erreurs.projetId}
        onChange={(v) => maj({ projetId: v, lotId: null })} />
      <ChampListe id="saisie-lotId" libelle="Lot" items={options(lots?.content ?? [])} valeur={b.lotId} erreur={erreurs.lotId}
        onChange={(v) => maj({ lotId: v })} disabled={!b.projetId || b.nature === 'REFUND'} />
      {liste('typeMarcheId', 'Type', listes.typesLot, true)}
      {liste('declencheurId', 'Déclencheur', listes.declencheurs)}
      {texte('personneAContacter', 'Personne à contacter')}
      {texte('referenceInterne', 'Référence interne')}
      {texte('referenceBureauOrdre', "Réf. bureau d'ordre")}
      {liste('categorieId', 'Catégorie (pièce sans ligne)', listes.categories)}
      {texte('notes', 'Note')}
      {texte('notes2', 'Note 2')}
      <ChampLecture id="saisie-dossierGroupement" libelle="Dossier de groupement" valeur={dossierGroupement} />
      <ChampLecture id="saisie-statut" libelle="Statut" valeur={statut} />
      {nombre('montantRegul', 'Montant de régularisation')}
      {nombre('timbreFiscal', 'Timbre fiscal')}
      {b.nature === 'REFUND' && <ChampsAvoir b={b} maj={maj} factureSource={factureSource} />}
    </div>
  );
}

/** Spécifique à l'avoir : facture source, case « Avoir financier », HT/TVA saisissables seulement sans ligne. */
function ChampsAvoir({ b, maj, factureSource }: Readonly<{ b: BrouillonPiece; maj: Maj; factureSource: string | null }>) {
  const sansLigne = b.lignes.length === 0;
  const montant = (id: 'montantHT' | 'montantTVA', libelle: string) => (
    <Field>
      <FieldLabel htmlFor={`saisie-${id}`}>{libelle}</FieldLabel>
      <ChampNombre id={`saisie-${id}`} libelle={libelle} valeur={b[id]} onChange={(v) => maj({ [id]: v })} />
    </Field>
  );
  return (
    <>
      <ChampLecture id="saisie-factureSource" libelle="Facture source" valeur={factureSource} />
      <Field orientation="horizontal">
        <input id="saisie-avoirFinancier" type="checkbox" checked={b.avoirFinancier} className="m-0 accent-(--brand)"
          onChange={(e) => maj({ avoirFinancier: e.target.checked })} />
        <FieldLabel htmlFor="saisie-avoirFinancier">Avoir financier</FieldLabel>
      </Field>
      {sansLigne && montant('montantHT', 'Montant HT')}
      {sansLigne && montant('montantTVA', 'Montant TVA')}
    </>
  );
}

type Enregistre = (piece: DocumentAchatDetailDto, fermer: boolean) => void;

function Saisie({ titre, creer, tvaDefaut, listes, statut, piece, onFermer, onEnregistre }: Readonly<{
  titre: string;
  /** Lu au montage seulement : chaque appel numérote de nouvelles clés de ligne. */
  creer: () => BrouillonPiece;
  tvaDefaut: number | null;
  listes: Listes;
  statut: string | null;
  piece?: DocumentAchatDetailDto;
  onFermer: () => void;
  onEnregistre: Enregistre;
}>) {
  const confirmer = useConfirm();
  const [initial] = useState(creer);
  const [b, setB] = useState(initial);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [lectureSeule, setLectureSeule] = useState(false);
  const idSource = piece || initial.nature !== 'REFUND' ? undefined : initial.sources.at(0);
  const source = useApi(() => (idSource ? getDocumentAchat(idSource) : Promise.resolve(null)), [idSource]);
  const factureSource = piece?.factureSourceCode ?? source.data?.code ?? null;
  const modifie = JSON.stringify(b) !== JSON.stringify(initial);
  const maj: Maj = (patch) => setB((prec) => ({ ...prec, ...patch }));

  async function annuler() {
    const ok = !modifie || (await confirmer({
      title: 'Abandonner la saisie ?',
      message: 'Les modifications non enregistrées de cette fiche seront perdues.',
      confirmLabel: 'Abandonner',
      cancelLabel: 'Continuer la saisie',
    }));
    if (ok) onFermer();
  }

  function echec(err: unknown) {
    const texte = messageActionPieceAchat(err);
    const statutHttp = err instanceof ApiError ? err.status : 0;
    if (statutHttp === 404) {
      onFermer();
      return;
    }
    if (statutHttp === 403) {
      setLectureSeule(true);
      setMessage('Droit insuffisant');
      return;
    }
    const champ = statutHttp === 400 ? champErreurServeur(texte) : null;
    if (champ) setErreurs({ [champ]: texte });
    else setMessage(texte);
  }

  async function enregistrer(fermer: boolean) {
    const trouvees = verifier(b);
    setErreurs(trouvees);
    setMessage(null);
    if (Object.keys(trouvees).length > 0) return;
    setEnCours(true);
    try {
      const requete = versRequete(b);
      const resp = piece ? await modifierPieceAchat(piece.id, requete) : await creerPieceAchat(requete);
      oublierLecturesRecentes();
      refetchAllApis();
      onEnregistre(resp, fermer);
    } catch (err) {
      oublierLecturesRecentes();
      if (err instanceof ApiError && err.status === 404) refetchAllApis();
      echec(err);
    } finally {
      setEnCours(false);
    }
  }

  const bloque = enCours || lectureSeule;
  return (
    <FenetreFiche nature={NATURE} titre={titre} onFermer={onFermer} enEdition={modifie && !lectureSeule}>
      <BarreIcones className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-1">
        <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => void enregistrer(false)}>
          <Save /> Enregistrer
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => void enregistrer(true)}>
          <SaveAll /> Enregistrer et fermer
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => void annuler()}>
          <X /> Annuler
        </Button>
        {message && <span role="alert" className="ml-2 text-body text-destructive">{message}</span>}
      </BarreIcones>
      <fieldset disabled={lectureSeule} className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 py-3">
        <legend className="sr-only">{titre}</legend>
        <EnteteSaisie b={b} maj={maj} erreurs={erreurs} listes={listes} statut={statut} dossierGroupement={piece?.dossierGroupement ?? null} factureSource={factureSource} />
        <GrilleLignesSaisieAchat lignes={b.lignes} onChange={(lignes) => maj({ lignes })} categories={listes.categories} tvaDefaut={tvaDefaut} erreur={erreurs.lignes} />
        <VentilationProjetsSaisie parts={b.parts} onChange={(parts) => maj({ parts })} projets={listes.projets} parCategorie={piece?.ventilation ?? []} erreur={erreurs.ventilation} />
        <TotauxSaisieAchat b={b} piece={piece && !modifie ? piece : null} />
      </fieldset>
    </FenetreFiche>
  );
}

/**
 * Saisie d'une pièce d'achat : création depuis le modèle d'une nature, ou modification de `piece`.
 * `onEnregistre(p, fermer)` : « Enregistrer » ouvre la fiche de `p`, « Enregistrer et fermer » ferme tout.
 */
export default function FormulairePieceAchatFenetre({ nature, sources, piece, onFermer, onEnregistre }: Readonly<{
  nature?: string;
  /** Pièces dont on génère `nature` ; absent = création libre. */
  sources?: UUID[];
  piece?: DocumentAchatDetailDto;
  onFermer: () => void;
  onEnregistre: Enregistre;
}>) {
  const cleSources = sources?.join(',');
  const modele = useApi<ModelePieceAchatDto | null>(
    () => (piece || !nature ? Promise.resolve(null) : getModelePieceAchat(nature, sources)),
    [nature, cleSources, piece?.id],
  );
  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const projet = useApi(() => getReferentielsProjet(), [], 'projet-referentiels');
  const personnels = useApi(() => getReferentielPatrimoine('personnels'), [], 'patrimoine-personnels');

  const libelleNature = referentiels.data?.natures.find((n) => n.code === nature)?.libelle ?? nature ?? '';
  const titre = piece ? `Modifier ${intituleDocumentAchat(piece) || NATURE.toLowerCase()}` : `Nouvelle pièce — ${libelleNature}`;
  const erreur = modele.error ?? referentiels.error ?? projet.error;
  const modelePret = piece !== undefined || modele.data !== null || !modele.loading;

  if (erreur || !modelePret || !referentiels.data || !projet.data) {
    let corps = <LoadingState />;
    if (erreur) corps = <ErrorState message={erreur} />;
    return <FenetreFiche nature={NATURE} titre={titre} onFermer={onFermer}>{corps}</FenetreFiche>;
  }
  const m = modele.data;
  let creer: () => BrouillonPiece;
  let tvaDefaut: number | null;
  let statut: string | null;
  if (piece) {
    creer = () => depuisDetail(piece);
    tvaDefaut = piece.lignes.at(0)?.tauxTVA ?? null;
    statut = piece.statutDescription ?? piece.statutCode;
  } else if (m) {
    creer = () => depuisModele(m);
    tvaDefaut = tvaParDefautPourcent(m);
    statut = m.statutDepartLibelle;
  } else {
    return (
      <FenetreFiche nature={NATURE} titre={titre} onFermer={onFermer}>
        <EmptyState title="Saisie impossible" message="Aucun modèle de pièce n'est disponible pour cette nature." />
      </FenetreFiche>
    );
  }
  const listes = listesDe(referentiels.data, projet.data.categories, personnels.data ?? []);
  return (
    <Saisie key={piece?.id ?? `${nature}-${cleSources}`} titre={titre} creer={creer} tvaDefaut={tvaDefaut} listes={listes} statut={statut}
      piece={piece} onFermer={onFermer} onEnregistre={onEnregistre} />
  );
}
