import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { calculerPrevisionsEtude } from '../../lib/apiFaisabilite';
import { toApiDateTime } from '../../lib/format';
import { errorMessage, useDebouncedValue } from '../../lib/useApi';
import type { EtudeFaisabiliteDto, LignePrevisionDto, SaisiePrevisionDto } from '../../types/faisabilite';

type Mode = 'unite' | 'reference' | 'aucun';
type Pilote = 'ratio' | 'montantHt' | 'montant';
interface Item { label: string; value: string }

const MODES: Item[] = [
  { label: 'Par unité (quantité × prix unitaire)', value: 'unite' },
  { label: "En pourcentage d'une autre ligne", value: 'reference' },
  { label: 'Aucun montant', value: 'aucun' },
];

const modeDe = (s: SaisiePrevisionDto): Mode => {
  if (s.uniteEtudeId) return 'unite';
  return s.categorieReferenceId ? 'reference' : 'aucun';
};

/** Nombre affiché dans une saisie (pas de notation exponentielle, 6 décimales au plus). */
const texteNombre = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(Math.round(n * 1e6) / 1e6));

const echelle = (n: number | null | undefined, facteur: number) => (n === null || n === undefined ? null : n * facteur);

function ChampNombre({ id, libelle, valeur, onChange, desactive }: Readonly<{
  id: string; libelle: string; valeur: string; onChange: (v: string) => void; desactive?: boolean;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      <Input id={id} type="number" step="any" min={0} value={valeur} disabled={desactive} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function ChoixListe({ libelle, items, valeur, onChange }: Readonly<{ libelle: string; items: Item[]; valeur: string; onChange: (v: string) => void }>) {
  return (
    <Field>
      <FieldLabel>{libelle}</FieldLabel>
      <Select items={items} value={valeur || null} onValueChange={(v) => onChange(v ?? '')}>
        <SelectTrigger aria-label={libelle} className="w-full min-w-0"><SelectValue placeholder="Choisir…" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>{items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * Ligne de prévision : unité ou pourcentage d'une autre ligne. Ratio, montant HT et montant se saisissent dans les deux sens ;
 * seul le dernier champ modifié part (priorité serveur ratio > HT > TTC), les autres viennent de l'aperçu `/calcul`.
 */
export default function DialogueLignePrevision({ etudeId, fiche, libelle, saisie, autres, references, onValider, onClose }: Readonly<{
  etudeId: string;
  fiche: EtudeFaisabiliteDto;
  libelle: string;
  saisie: SaisiePrevisionDto;
  autres: SaisiePrevisionDto[];
  references: LignePrevisionDto[];
  onValider: (saisie: SaisiePrevisionDto) => void;
  onClose: () => void;
}>) {
  const [mode, setMode] = useState<Mode>(modeDe(saisie));
  const [ratioInitial, setRatioInitial] = useState(saisie.ratio ?? null);
  const [uniteId, setUniteId] = useState(saisie.uniteEtudeId ?? '');
  const [referenceId, setReferenceId] = useState(saisie.categorieReferenceId ?? '');
  const [tva, setTva] = useState(texteNombre(echelle(saisie.tauxTva, 100)));
  const [pourProjet, setPourProjet] = useState(saisie.estPourProjet !== false);
  const [date, setDate] = useState((saisie.dateApplication ?? '').slice(0, 10));
  const [saisi, setSaisi] = useState<{ cle: Pilote; texte: string } | null>(null);
  const [apercu, setApercu] = useState<LignePrevisionDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const enPourcent = mode === 'reference';
  const facteur = enPourcent ? 100 : 1;
  const nombreSaisi = saisi === null || saisi.texte === '' ? null : Number(saisi.texte);

  function construire(): SaisiePrevisionDto {
    const corps: SaisiePrevisionDto = {
      categorieId: saisie.categorieId,
      uniteEtudeId: mode === 'unite' && uniteId ? uniteId : null,
      categorieReferenceId: mode === 'reference' && referenceId ? referenceId : null,
      ratio: ratioInitial,
      tauxTva: tva === '' ? null : Number(tva) / 100,
      estPourProjet: pourProjet,
      dateApplication: date ? toApiDateTime(date) ?? null : null,
    };
    if (saisi === null || nombreSaisi === null) return corps;
    if (saisi.cle === 'ratio') return { ...corps, ratio: nombreSaisi / facteur };
    return { ...corps, ratio: null, [saisi.cle]: nombreSaisi };
  }

  const cle = useDebouncedValue(JSON.stringify(construire()));
  useEffect(() => {
    let perime = false;
    void calculerPrevisionsEtude(etudeId, [...autres, JSON.parse(cle) as SaisiePrevisionDto]).then((r) => {
      if (perime) return;
      setApercu(r.lignes.find((l) => l.categorieId === saisie.categorieId) ?? null);
      setErreur(null);
    }, (err: unknown) => {
      if (!perime) setErreur(errorMessage(err));
    });
    return () => { perime = true; };
  }, [cle, etudeId, autres, saisie.categorieId]);

  const valeur = (c: Pilote, depuisApercu: number | null | undefined) => {
    if (saisi?.cle === c) return saisi.texte;
    return texteNombre(echelle(depuisApercu, c === 'ratio' ? facteur : 1));
  };
  const unites: Item[] = fiche.unites.flatMap((u) => (u.id ? [{ label: u.uniteCode ?? u.uniteLibelle ?? u.id, value: u.id }] : []));
  const refs: Item[] = references.filter((l) => l.categorieId !== saisie.categorieId).map((l) => ({ label: l.libelle ?? l.categorieId, value: l.categorieId }));

  return (
    <Modal title={`Ligne de prévision — ${libelle}`} onClose={onClose} width={640}>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <ChoixListe libelle="Base de calcul" items={MODES} valeur={mode} onChange={(v) => { setMode(v as Mode); setSaisi(null); setRatioInitial(null); }} />
        {mode === 'unite' && <ChoixListe libelle="Unité de l'étude" items={unites} valeur={uniteId} onChange={setUniteId} />}
        {mode === 'reference' && <ChoixListe libelle="Ligne de référence" items={refs} valeur={referenceId} onChange={setReferenceId} />}
        <ChampNombre id="lp-ratio" libelle={enPourcent ? 'Ratio (%)' : 'Prix unitaire'} desactive={mode === 'aucun'}
          valeur={valeur('ratio', apercu?.ratio)} onChange={(texte) => setSaisi({ cle: 'ratio', texte })} />
        <ChampNombre id="lp-ht" libelle="Montant HT" desactive={mode === 'aucun'} valeur={valeur('montantHt', apercu?.montantHtPropre)}
          onChange={(texte) => setSaisi({ cle: 'montantHt', texte })} />
        <ChampNombre id="lp-ttc" libelle="Montant TTC" desactive={mode === 'aucun'} valeur={valeur('montant', apercu?.montantPropre)}
          onChange={(texte) => setSaisi({ cle: 'montant', texte })} />
        <ChampNombre id="lp-tva" libelle="TVA (%, vide = TVA par défaut)" valeur={tva} onChange={setTva} />
        <Field>
          <FieldLabel htmlFor="lp-date">Traiter au début du projet (date)</FieldLabel>
          <Input id="lp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 self-end py-1.5 text-label text-foreground">
          <input type="checkbox" checked={pourProjet} onChange={(e) => setPourProjet(e.target.checked)} /> Visible module Projet
        </label>
      </div>
      {erreur && <p role="alert" className="mt-3 text-body text-destructive">{erreur}</p>}
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={erreur !== null || (mode === 'unite' && !uniteId) || (mode === 'reference' && !referenceId)} onClick={() => onValider(construire())}>Appliquer</Button>
      </DialogFooter>
    </Modal>
  );
}
