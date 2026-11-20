import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import RubanFiche from '../../components/fiche/RubanFiche';
import SearchableSelect from '../../components/SearchableSelect';
import Champ from '../../components/dossier/echeancier/Champ';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ApiError } from '../../lib/api';
import { toApiDateTime } from '../../lib/format';
import { getModificationProjet, getReferentielsModifications, modifierModificationProjet } from '../../lib/apiTravauxChantier';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import { useEcriture } from '../../lib/useEcriture';
import type { EtatModification, ModificationRequest } from '../../types/dossierSousListes';
import type { EtatModificationProjetDto, ModificationProjetLigneDto } from '../../types/travauxChantier';

type Props = Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>;

type Saisie = {
  description: string; dateDemande: string; dateValidationTechnique: string; dateValidationClient: string;
  cout: string; montantHT: string; montantTTC: string; etat: string; notes: string;
};
type Cle = keyof Saisie;

const NOMBRES: Cle[] = ['cout', 'montantHT', 'montantTTC'];
const LIBELLES_ERREUR: Record<string, Cle> = {
  description: 'description', dateDemande: 'dateDemande', dateValidationTechnique: 'dateValidationTechnique',
  dateValidationClient: 'dateValidationClient', cout: 'cout', prixHT: 'montantHT', prixTTC: 'montantTTC', etat: 'etat', notes: 'notes',
};

const jour = (v: string | null) => (v ?? '').slice(0, 10);
const nombre = (v: number | null) => (v === null ? '' : String(v));

function saisieDepuis(m: ModificationProjetLigneDto): Saisie {
  return {
    description: m.description ?? '', dateDemande: jour(m.dateDemande), dateValidationTechnique: jour(m.dateValidationTechnique),
    dateValidationClient: jour(m.dateValidationClient), cout: nombre(m.cout), montantHT: nombre(m.montantHT),
    montantTTC: nombre(m.montantTTC), etat: m.etat?.code ?? '', notes: m.notes ?? '',
  };
}

function corpsDepuis(s: Saisie): ModificationRequest {
  const opt = (v: string) => v || undefined;
  const num = (v: string) => (v === '' ? undefined : Number(v.replace(',', '.')));
  return {
    description: opt(s.description), dateDemande: toApiDateTime(s.dateDemande),
    dateValidationTechnique: toApiDateTime(s.dateValidationTechnique), dateValidationClient: toApiDateTime(s.dateValidationClient), cout: num(s.cout), prixHT: num(s.montantHT), prixTTC: num(s.montantTTC),
    etat: opt(s.etat) as EtatModification | undefined, notes: opt(s.notes),
  };
}

/** Un 400 nomme le champ fautif au début du message (« prixHT : … ») ; sinon message global. */
function erreurParChamp(texte: string): { cle?: Cle; texte: string } {
  const nom = /^\s*(\w+)\s*:/.exec(texte)?.[1];
  const cle = nom ? LIBELLES_ERREUR[nom] : undefined;
  return cle ? { cle, texte: texte.replace(/^\s*\w+\s*:\s*/, '') } : { texte };
}

function Erreur({ texte }: Readonly<{ texte?: string }>) {
  return texte ? <p role="alert" className="text-micro text-destructive">{texte}</p> : null;
}

function Lecture({ id, libelle, valeur }: Readonly<{ id: string; libelle: string; valeur: string | null }>) {
  return <Champ id={id} libelle={libelle}><Input id={id} value={valeur ?? ''} disabled readOnly /></Champ>;
}

function FenetreModification({ initiale, etats, voisins, onFermer }: Omit<Props, 'id'> & Readonly<{ initiale: ModificationProjetLigneDto; etats: EtatModificationProjetDto[] }>) {
  const base = saisieDepuis(initiale);
  const [saisie, setSaisie] = useState(base);
  const [erreurs, setErreurs] = useState<Partial<Record<Cle, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const { occupe, executer } = useEcriture();
  const modifiee = JSON.stringify(saisie) !== JSON.stringify(base);
  const items = etats.map((e) => ({ value: e.code, label: e.libelle }));
  const maj = (cle: Cle) => (valeur: string) => setSaisie((s) => ({ ...s, [cle]: valeur }));

  async function enregistrer() {
    setMessage(null);
    setErreurs({});
    const invalide = NOMBRES.find((c) => saisie[c] !== '' && Number.isNaN(Number(saisie[c].replace(',', '.'))));
    if (invalide) {
      setErreurs({ [invalide]: 'Nombre invalide.' });
      return;
    }
    try {
      await modifierModificationProjet(initiale.id, corpsDepuis(saisie));
      refetchAllApis();
      onFermer();
    } catch (err) {
      const brut = errorMessage(err);
      if (err instanceof ApiError && err.status === 400) {
        const { cle, texte } = erreurParChamp(brut);
        if (cle) setErreurs({ [cle]: texte });
        else setMessage(texte);
      } else {
        setMessage(brut);
      }
    }
  }

  const champDate = (cle: Cle, libelle: string) => (
    <Champ id={`mod-${cle}`} libelle={libelle}>
      <Input id={`mod-${cle}`} type="date" value={saisie[cle]} onChange={(e) => maj(cle)(e.target.value)} aria-invalid={erreurs[cle] ? true : undefined} />
      <Erreur texte={erreurs[cle]} />
    </Champ>
  );
  const champNombre = (cle: Cle, libelle: string) => (
    <Champ id={`mod-${cle}`} libelle={libelle}>
      <Input id={`mod-${cle}`} inputMode="decimal" value={saisie[cle]} onChange={(e) => maj(cle)(e.target.value)} aria-invalid={erreurs[cle] ? true : undefined} />
      <Erreur texte={erreurs[cle]} />
    </Champ>
  );

  return (
    <FenetreFiche nature="Modification" titre={initiale.code ?? 'Modification'} voisins={voisins} onFermer={onFermer} enEdition={modifiee}>
      <RubanFiche enregistrer={{ onClick: () => void executer(enregistrer), disabled: !modifiee || occupe }} propres={[]} />
      {message && <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message}</p>}
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-auto p-4 lg:grid-cols-4">
        <Lecture id="mod-projet" libelle="Projet" valeur={initiale.projet} />
        <Lecture id="mod-code" libelle="Code" valeur={initiale.code} />
        <Lecture id="mod-bloc" libelle="Blok" valeur={initiale.bloc} />
        <Lecture id="mod-acquereur" libelle="Acquéreur" valeur={initiale.acquereur} />
        <Lecture id="mod-etat-dossier" libelle="État du dossier" valeur={initiale.etatDossier} />
        {champDate('dateDemande', 'Date de la demande')}
        {champDate('dateValidationTechnique', 'Validation technique')}
        {champDate('dateValidationClient', 'Validation client')}
        {champNombre('cout', 'Coût')}
        {champNombre('montantHT', 'Montant HT')}
        {champNombre('montantTTC', 'Montant TTC')}
        <Champ id="mod-etat" libelle="État">
          <SearchableSelect id="mod-etat" items={items} value={saisie.etat || null} placeholder="Choisir…" emptyMessage="Aucun choix"
            className="w-full min-w-0" onValueChange={(v) => maj('etat')(v ?? '')} />
          <Erreur texte={erreurs.etat} />
        </Champ>
        <div className="col-span-full">
          <Champ id="mod-description" libelle="Description">
            <Textarea id="mod-description" rows={2} value={saisie.description} onChange={(e) => maj('description')(e.target.value)} />
            <Erreur texte={erreurs.description} />
          </Champ>
        </div>
        <div className="col-span-full">
          <Champ id="mod-notes" libelle="Notes">
            <Textarea id="mod-notes" rows={2} value={saisie.notes} onChange={(e) => maj('notes')(e.target.value)} />
            <Erreur texte={erreurs.notes} />
          </Champ>
        </div>
      </div>
    </FenetreFiche>
  );
}

/** Fiche d'une modification de projet en fenêtre. */
export default function ModificationProjetDetail({ id, ...props }: Props) {
  const modification = useApi(() => getModificationProjet(id), [id]);
  const referentiels = useApi(() => getReferentielsModifications(), [], 'modifications-referentiels');

  if (modification.error || !modification.data) {
    return (
      <FenetreFiche nature="Modification" titre="Modification" voisins={props.voisins} onFermer={props.onFermer}>
        {modification.error ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <ErrorState message={modification.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void modification.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        ) : <LoadingState />}
      </FenetreFiche>
    );
  }
  return <FenetreModification key={id} initiale={modification.data} etats={referentiels.data?.etats ?? []} {...props} />;
}
