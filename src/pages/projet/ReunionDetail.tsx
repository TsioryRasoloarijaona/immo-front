import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import RubanFiche from '../../components/fiche/RubanFiche';
import SearchableSelect from '../../components/SearchableSelect';
import Champ from '../../components/dossier/echeancier/Champ';
import OngletAvancements from '../../components/projet/reunions/OngletAvancements';
import OngletDecisions from '../../components/projet/reunions/OngletDecisions';
import OngletIntervenants from '../../components/projet/reunions/OngletIntervenants';
import TableContacts from '../../components/projet/reunions/TableContacts';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import {
  ajouterMaitresOuvrage, creerReunion, getChoixReunions, getReunion, majMaitreOuvrage, modifierReunion, supprimerMaitreOuvrage,
  supprimerReunion,
} from '../../lib/apiReunions';
import { useConfirm } from '../../lib/confirmContext';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { referentielItems } from '../../lib/referentiels';
import {
  corpsDepuis, erreurParChamp, erreursObligatoires, MESSAGE_ENREGISTRER_AVANT, MESSAGE_SUPPRESSION, modifiee, NOUVELLE_REUNION,
  saisieDepuis, saisieVide, type CleChamp, type EcrireFiche,
} from '../../lib/saisieReunion';
import { avecValeur, useChoixPersonnes } from '../../lib/useChoixRendezVous';
import { useEcriture } from '../../lib/useEcriture';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { ReunionFicheDto } from '../../types/reunions';
import { fournisseursItems, useReferentielsProjet } from './hooks';

const ONGLETS = [
  { valeur: 'maitres', libelle: "Maître d'ouvrage" },
  { valeur: 'intervenants', libelle: 'Intervenants' },
  { valeur: 'decisions', libelle: 'Décisions' },
  { valeur: 'avancements', libelle: 'Avancements' },
] as const;
type Onglet = (typeof ONGLETS)[number]['valeur'];

type Props = Readonly<{
  /** Création : projet et type choisis dans la liste. */
  projetId: string | null;
  typeId: string | null;
  ongletInitial: string | null;
  voisins?: VoisinsFiche;
  onFermer: () => void;
  onCree: (id: string, onglet?: string) => void;
}>;

function Erreur({ texte }: Readonly<{ texte?: string }>) {
  return texte ? <p role="alert" className="text-micro text-destructive">{texte}</p> : null;
}

function ongletDepuis(v: string | null): Onglet {
  return ONGLETS.find((o) => o.valeur === v)?.valeur ?? 'maitres';
}

function FenetreReunion({ initiale, projetId, typeId, ongletInitial, voisins, onFermer, onCree }: Props & Readonly<{ initiale: ReunionFicheDto | null }>) {
  const [fiche, setFiche] = useState(initiale);
  const base = fiche ? saisieDepuis(fiche) : saisieVide();
  const [saisie, setSaisie] = useState(base);
  const [erreurs, setErreurs] = useState<Partial<Record<CleChamp, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet | null>(initiale ? ongletDepuis(ongletInitial) : null);
  const confirmer = useConfirm();
  const { executer } = useEcriture();
  const personnes = useChoixPersonnes();
  const projet = fiche?.projetId ?? projetId ?? undefined;
  const choix = useApi(() => getChoixReunions(projet), [projet], 'reunions-choix');
  const referentiels = useReferentielsProjet();
  const lots = referentielItems(choix.data?.lots ?? []);
  const fournisseurs = fournisseursItems(referentiels.data);
  const aEnregistrer = !fiche || modifiee(saisie, base);
  const surveillants = avecValeur(personnes, fiche?.surveillantId ?? null, fiche?.surveillant ?? null);
  const libelleProjet = fiche?.projet ?? referentiels.data?.projets.find((p) => p.id === projetId)?.code ?? '';
  const libelleType = fiche?.type ?? choix.data?.types.find((t) => t.id === typeId)?.description ?? '';
  const maj = (cle: CleChamp) => (valeur: string) => setSaisie((s) => ({ ...s, [cle]: valeur }));
  const ecrire: EcrireFiche = (action, succes) => executer(async () => setFiche(await action()), succes);

  async function enregistrer(ongletApres?: Onglet): Promise<boolean> {
    setMessage(null);
    const manque = erreursObligatoires(saisie);
    setErreurs(manque);
    if (Object.keys(manque).length > 0) return false;
    try {
      const corps = corpsDepuis(saisie);
      if (fiche) {
        const r = await modifierReunion(fiche.id, corps);
        setFiche(r);
        setSaisie(saisieDepuis(r));
      } else {
        const r = await creerReunion({ ...corps, projetId: projetId ?? '', typeId: typeId ?? '' });
        onCree(r.id, ongletApres);
      }
      refetchAllApis();
      return true;
    } catch (err) {
      const { cle, texte } = erreurParChamp(errorMessage(err));
      if (cle) setErreurs({ [cle]: texte });
      else setMessage(texte);
      return false;
    }
  }

  async function changerOnglet(v: Onglet) {
    if (aEnregistrer) {
      if (!(await confirmer({ title: 'Enregistrer', message: MESSAGE_ENREGISTRER_AVANT, confirmLabel: 'Enregistrer' }))) return;
      if (!(await enregistrer(v)) || !fiche) return;
    }
    setOnglet(v);
  }

  async function supprimer() {
    if (!fiche || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    if (await executer(() => supprimerReunion(fiche.id))) {
      refetchAllApis();
      onFermer();
    }
  }

  function contenu(f: ReunionFicheDto) {
    const listes = { lots, fournisseurs, statuts: choix.data?.statuts ?? [] };
    return (
      <>
        <TabsContent value="maitres">
          <TableContacts
            contacts={f.maitresOuvrage}
            onAjouter={(ids) => void ecrire(() => ajouterMaitresOuvrage(f.id, ids))}
            onMaj={(ligneId, corps) => void ecrire(() => majMaitreOuvrage(f.id, ligneId, corps))}
            onSupprimer={(ligneId) => void ecrire(() => supprimerMaitreOuvrage(f.id, ligneId))}
          />
        </TabsContent>
        <TabsContent value="intervenants"><OngletIntervenants fiche={f} ecrire={ecrire} {...listes} /></TabsContent>
        <TabsContent value="decisions"><OngletDecisions fiche={f} ecrire={ecrire} {...listes} /></TabsContent>
        <TabsContent value="avancements"><OngletAvancements fiche={f} ecrire={ecrire} /></TabsContent>
      </>
    );
  }

  return (
    <FenetreFiche nature="Réunion de chantier" titre={fiche?.reference || 'Nouvelle réunion'} voisins={voisins} onFermer={onFermer}
      enEdition={modifiee(saisie, base)}>
      <RubanFiche enregistrer={{ onClick: () => void enregistrer(), disabled: !aEnregistrer }} propres={[]}
        supprimer={fiche ? { onClick: () => void supprimer() } : undefined} />
      {message && <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message}</p>}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Champ id="reu-ordre" libelle="O.D.T."><Input id="reu-ordre" value={fiche?.ordre ?? ''} disabled readOnly /></Champ>
          <Champ id="reu-reference" libelle="Référence P.V.">
            <Input id="reu-reference" value={saisie.reference} placeholder="Générée si vide" maxLength={50}
              onChange={(e) => maj('reference')(e.target.value)} aria-invalid={erreurs.reference ? true : undefined} />
            <Erreur texte={erreurs.reference} />
          </Champ>
          <Champ id="reu-projet" libelle="Projet"><Input id="reu-projet" value={libelleProjet} disabled readOnly /></Champ>
          <Champ id="reu-type" libelle="Type"><Input id="reu-type" value={libelleType} disabled readOnly /></Champ>
          <Champ id="reu-date" libelle="Date *">
            <Input id="reu-date" type="date" value={saisie.date} onChange={(e) => maj('date')(e.target.value)} aria-invalid={erreurs.date ? true : undefined} />
            <Erreur texte={erreurs.date} />
          </Champ>
          <Champ id="reu-surveillant" libelle="Surveillant">
            <SearchableSelect id="reu-surveillant" items={surveillants} value={saisie.surveillantId || null} placeholder="Choisir…"
              emptyMessage="Aucun choix" className="w-full min-w-0" onValueChange={(v) => maj('surveillantId')(v ?? '')} />
          </Champ>
          <Champ id="reu-prochaine" libelle="Prochaine réunion">
            <div className="flex items-center gap-2">
              <input type="checkbox" aria-label="Prévoir une prochaine réunion" checked={saisie.avecProchaine}
                onChange={(e) => setSaisie((s) => ({ ...s, avecProchaine: e.target.checked }))} />
              <Input id="reu-prochaine" type="date" value={saisie.prochaineDate} disabled={!saisie.avecProchaine}
                onChange={(e) => maj('prochaineDate')(e.target.value)} aria-invalid={erreurs.prochaineDate ? true : undefined} />
            </div>
            <Erreur texte={erreurs.prochaineDate} />
          </Champ>
          <div className="col-span-full">
            <Champ id="reu-note" libelle="Note">
              <Textarea id="reu-note" rows={2} value={saisie.note} onChange={(e) => maj('note')(e.target.value)} />
              <Erreur texte={erreurs.note} />
            </Champ>
          </div>
        </div>
        <Tabs value={onglet} onValueChange={(v: Onglet) => void changerOnglet(v)} className="min-h-0">
          <TabsList>
            {ONGLETS.map((o) => <TabsTrigger key={o.valeur} value={o.valeur}>{o.libelle}</TabsTrigger>)}
          </TabsList>
          {fiche ? contenu(fiche) : <p className="text-body text-muted-foreground">Enregistrez la réunion pour saisir ses onglets.</p>}
        </Tabs>
      </div>
    </FenetreFiche>
  );
}

/** Fiche d'une réunion de chantier en fenêtre (`id` = `nouveau` en création). */
export default function ReunionDetail({ id, ...props }: Props & Readonly<{ id: string }>) {
  const creation = id === NOUVELLE_REUNION;
  const reunion = useApi(() => (creation ? Promise.resolve(null) : getReunion(id)), [id]);
  const manque = creation && (!props.projetId || !props.typeId);

  if (manque || reunion.error || (!creation && !reunion.data)) {
    return (
      <FenetreFiche nature="Réunion de chantier" titre="Réunion de chantier" voisins={props.voisins} onFermer={props.onFermer}>
        {manque && <ErrorState message="Vous devez d'abord sélectionner un projet et un type !" />}
        {!manque && reunion.error && (
          <div className="flex flex-col items-center gap-2 p-4">
            <ErrorState message={reunion.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void reunion.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!manque && !reunion.error && <LoadingState />}
      </FenetreFiche>
    );
  }
  return <FenetreReunion key={id} initiale={reunion.data} {...props} />;
}
