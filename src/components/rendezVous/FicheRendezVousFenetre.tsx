import { useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import FenetreFiche from '../fiche/FenetreFiche';
import RubanFiche from '../fiche/RubanFiche';
import { useSuppression } from '../patrimoine/fiche/outilsFiche';
import SearchableSelect from '../SearchableSelect';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import ChampTier from './ChampTier';
import { creerRendezVous, getRendezVous, modifierRendezVous, supprimerRendezVous } from '../../lib/apiRendezVous';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import {
  corpsDepuis, erreurParChamp, erreursObligatoires, NOUVEAU_RENDEZ_VOUS, saisieDepuis, saisieVide,
  type CleChamp,
} from '../../lib/saisieRendezVous';
import { avecValeur, useChoixPersonnes } from '../../lib/useChoixRendezVous';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { RendezVousDto } from '../../types/rendezVous';

type Props = Readonly<{ voisins?: VoisinsFiche; onFermer: () => void; onCree: (id: string) => void }>;
type Erreurs = Partial<Record<CleChamp, string>>;

function Champ({ id, libelle, erreur, plein, children }: Readonly<{
  id: string;
  libelle: string;
  erreur?: string;
  plein?: boolean;
  children: ReactNode;
}>) {
  return (
    <Field className={plein ? 'col-span-full' : undefined}>
      <FieldLabel htmlFor={id}>{libelle}</FieldLabel>
      {children}
      {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
    </Field>
  );
}

function FenetreRendezVous({ rdv, dateInitiale, voisins, onFermer, onCree, onMaj }: Props & Readonly<{
  rdv: RendezVousDto | null;
  dateInitiale: string;
  onMaj: (r: RendezVousDto) => void;
}>) {
  const base = rdv ? saisieDepuis(rdv) : saisieVide(dateInitiale);
  const [saisie, setSaisie] = useState(base);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [message, setMessage] = useState<string | null>(null);
  const personnes = useChoixPersonnes();
  const { erreur: erreurSuppression, supprimer } = useSuppression({
    titre: 'Supprimer le rendez-vous',
    message: 'Le rendez-vous sera supprimé. Continuer ?',
    action: () => supprimerRendezVous(rdv?.id ?? ''),
    apres: onFermer,
  });
  const modifiee = (Object.keys(base) as CleChamp[]).some((c) => saisie[c] !== base[c]);
  const maj = (cle: CleChamp) => (valeur: string) => setSaisie((s) => ({ ...s, [cle]: valeur }));
  const saisir = (cle: CleChamp) => ({ id: `rdv-${cle}`, value: saisie[cle], onChange: (e: { target: { value: string } }) => maj(cle)(e.target.value) });
  const listeDeclencheur = avecValeur(personnes, rdv?.declencheurId ?? null, rdv?.declencheurNom ?? null);
  const listePersonnel = avecValeur(personnes, rdv?.gestionnaireId ?? null, rdv?.gestionnaireNom ?? null);

  async function enregistrer() {
    setMessage(null);
    const manque = erreursObligatoires(saisie);
    setErreurs(manque);
    if (Object.keys(manque).length > 0) return;
    try {
      const corps = corpsDepuis(saisie, !!rdv);
      const r = rdv ? await modifierRendezVous(rdv.id, corps) : await creerRendezVous(corps);
      refetchAllApis();
      if (rdv) {
        onMaj(r);
        setSaisie(saisieDepuis(r));
      }
      else onCree(r.id);
    } catch (err) {
      const { cle, texte } = erreurParChamp(errorMessage(err));
      if (cle) setErreurs({ [cle]: texte });
      else setMessage(texte);
    }
  }

  return (
    <FenetreFiche nature="Rendez-vous" titre={rdv?.code || 'Nouveau rendez-vous'} voisins={voisins} onFermer={onFermer} enEdition={modifiee}>
      <RubanFiche
        enregistrer={{ onClick: () => void enregistrer(), disabled: !modifiee }}
        propres={[]}
        supprimer={rdv ? supprimer : undefined}
      />
      {(message ?? erreurSuppression) && (
        <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message ?? erreurSuppression}</p>
      )}
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-auto p-4">
        <Champ id="rdv-code" libelle="Code">
          <Input id="rdv-code" value={rdv?.code ?? ''} disabled readOnly />
        </Champ>
        <Champ id="rdv-declencheurId" libelle="Déclencheur">
          <SearchableSelect id="rdv-declencheurId" items={listeDeclencheur} value={saisie.declencheurId || null} placeholder="Choisir…"
            emptyMessage="Aucun choix" className="w-full min-w-0" onValueChange={(v) => maj('declencheurId')(v ?? '')} />
        </Champ>
        <Champ id="rdv-description" libelle="Description *" plein erreur={erreurs.description}>
          <Input {...saisir('description')} aria-invalid={erreurs.description ? true : undefined} />
        </Champ>
        <Champ id="rdv-datePrevue" libelle="Date prévisionnelle *" erreur={erreurs.datePrevue}>
          <Input {...saisir('datePrevue')} type="datetime-local" aria-invalid={erreurs.datePrevue ? true : undefined} />
        </Champ>
        <Champ id="rdv-dureePrevue" libelle="Durée prévisionnelle" erreur={erreurs.dureePrevue}>
          <Input {...saisir('dureePrevue')} type="number" min={0} step={1} />
        </Champ>
        <Champ id="rdv-dateFinPrevue" libelle="Date fin prévisionnelle" erreur={erreurs.dateFinPrevue}>
          <Input {...saisir('dateFinPrevue')} type="datetime-local" aria-invalid={erreurs.dateFinPrevue ? true : undefined} />
        </Champ>
        <Champ id="rdv-gestionnaireId" libelle="Personnel">
          <SearchableSelect id="rdv-gestionnaireId" items={listePersonnel} value={saisie.gestionnaireId || null} placeholder="Choisir…"
            emptyMessage="Aucun choix" className="w-full min-w-0" onValueChange={(v) => maj('gestionnaireId')(v ?? '')} />
        </Champ>
        <ChampTier valeur={saisie.tierId} libelleInitial={rdv?.tierNom ?? null} erreur={erreurs.tierId} onChange={maj('tierId')} />
        <Champ id="rdv-source" libelle="Source">
          <Input id="rdv-source" value={rdv?.sourceLibelle ?? ''} disabled readOnly />
        </Champ>
        <Champ id="rdv-source-entite" libelle="Entité de la source">
          <Input id="rdv-source-entite" value={rdv?.sourceEntite ?? ''} disabled readOnly />
        </Champ>
        <Champ id="rdv-notes" libelle="Notes" plein erreur={erreurs.notes}>
          <Textarea id="rdv-notes" rows={3} maxLength={1000} value={saisie.notes} onChange={(e) => maj('notes')(e.target.value)} />
        </Champ>
      </div>
    </FenetreFiche>
  );
}

/** Fiche d'un rendez-vous en fenêtre (`id` = `nouveau` en création, `dateInitiale` préremplit la date). */
export default function FicheRendezVousFenetre({ id, dateInitiale = '', voisins, onFermer, onCree }: Props & Readonly<{ id: string; dateInitiale?: string }>) {
  const creation = id === NOUVEAU_RENDEZ_VOUS;
  const rdv = useApi(() => (creation ? Promise.resolve(null) : getRendezVous(id)), [id]);
  const [maj, setMaj] = useState<RendezVousDto | null>(null);
  const courant = maj?.id === id ? maj : rdv.data;

  if (rdv.error || (!creation && !courant)) {
    return (
      <FenetreFiche nature="Rendez-vous" titre="Rendez-vous" voisins={voisins} onFermer={onFermer}>
        {rdv.error ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <ErrorState message={rdv.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void rdv.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        ) : (
          <LoadingState />
        )}
      </FenetreFiche>
    );
  }
  return <FenetreRendezVous key={id} rdv={courant} dateInitiale={dateInitiale} voisins={voisins} onFermer={onFermer} onCree={onCree} onMaj={setMaj} />;
}
