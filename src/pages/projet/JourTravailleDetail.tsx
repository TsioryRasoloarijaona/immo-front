import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import RubanFiche from '../../components/fiche/RubanFiche';
import SearchableSelect from '../../components/SearchableSelect';
import Champ from '../../components/dossier/echeancier/Champ';
import BlocQuantitePrix from '../../components/projet/travaux/BlocQuantitePrix';
import StatutPastille from '../../components/projet/travaux/StatutPastille';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { listClients } from '../../lib/api';
import { listEntitesJuridiques } from '../../lib/apiEntites';
import {
  creerJourTravaille, getJourTravaille, getReferentielsTravaux, modifierJourTravaille, supprimerJourTravaille,
} from '../../lib/apiTravauxChantier';
import { useConfirm } from '../../lib/confirmContext';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { referentielItems } from '../../lib/referentiels';
import { MESSAGE_SUPPRESSION } from '../../lib/saisieReunion';
import {
  appliquerType, corpsDepuis, erreurParChamp, erreursObligatoires, modifiee, NOUVEAU_JOUR, saisieDepuis, saisieVide, type CleChamp,
} from '../../lib/saisieTravauxChantier';
import { avecValeur } from '../../lib/useChoixRendezVous';
import { useEcriture } from '../../lib/useEcriture';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { JourTravailleFicheDto } from '../../types/travauxChantier';
import { useReferentielsProjet } from './hooks';

type Props = Readonly<{
  voisins?: VoisinsFiche;
  onFermer: () => void;
  onCree: (id: string) => void;
}>;

function Erreur({ texte }: Readonly<{ texte?: string }>) {
  return texte ? <p role="alert" className="text-micro text-destructive">{texte}</p> : null;
}

function FenetreJour({ initiale, voisins, onFermer, onCree }: Props & Readonly<{ initiale: JourTravailleFicheDto | null }>) {
  const [fiche, setFiche] = useState(initiale);
  const base = fiche ? saisieDepuis(fiche) : saisieVide();
  const [saisie, setSaisie] = useState(base);
  const [erreurs, setErreurs] = useState<Partial<Record<CleChamp, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const confirmer = useConfirm();
  const { executer } = useEcriture();
  const entites = useApi(() => listEntitesJuridiques('true'), [], 'projet-travaux-entites');
  const clients = useApi(() => listClients({}, { size: 200 }), [], 'travaux-clients');
  const choix = useApi(() => getReferentielsTravaux(saisie.projetId || undefined), [saisie.projetId]);
  const referentiels = choix.data;
  const projets = useReferentielsProjet();
  const projetItems = (projets.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const maj = (cle: CleChamp) => (valeur: string) => setSaisie((s) => ({ ...s, [cle]: valeur, ...(cle === 'societeId' ? { employeId: '' } : {}) }));
  const liste = (items: Parameters<typeof referentielItems>[0] | undefined) => referentielItems(items ?? []);
  const entiteItems = (entites.data ?? []).map((e) => ({ value: e.id, label: e.description ?? e.code ?? '—' }));
  const typeItems = (referentiels?.types ?? []).map((t) => ({ value: t.id, label: t.libelle ?? t.code ?? '—' }));
  const clientItems = avecValeur((clients.data?.content ?? []).map((c) => ({ value: c.id, label: c.nomAffiche ?? c.code ?? c.id })), saisie.clientId || null, null);

  const select = (cle: CleChamp, items: { label: string; value: string }[]) => (
    <SearchableSelect id={`jour-${cle}`} items={items} value={saisie[cle] || null} placeholder="Choisir…" emptyMessage="Aucun choix"
      className="w-full min-w-0" onValueChange={(v) => maj(cle)(v ?? '')} />
  );
  const champ = (cle: CleChamp, libelle: string, type = 'text', max?: number) => (
    <Champ id={`jour-${cle}`} libelle={libelle}>
      <Input id={`jour-${cle}`} type={type} value={saisie[cle]} maxLength={max} onChange={(e) => maj(cle)(e.target.value)}
        aria-invalid={erreurs[cle] ? true : undefined} />
      <Erreur texte={erreurs[cle]} />
    </Champ>
  );
  const choisi = (cle: CleChamp, libelle: string, items: { label: string; value: string }[]) => (
    <Champ id={`jour-${cle}`} libelle={libelle}>
      {select(cle, items)}
      <Erreur texte={erreurs[cle]} />
    </Champ>
  );

  async function enregistrer() {
    setMessage(null);
    const manque = erreursObligatoires(saisie);
    setErreurs(manque);
    if (Object.keys(manque).length > 0) return;
    try {
      const corps = corpsDepuis(saisie);
      if (fiche) {
        const r = await modifierJourTravaille(fiche.id, corps);
        setFiche(r);
        setSaisie(saisieDepuis(r));
      } else {
        onCree((await creerJourTravaille(corps)).id);
      }
      refetchAllApis();
    } catch (err) {
      const { cle, texte } = erreurParChamp(errorMessage(err));
      if (cle) setErreurs({ [cle]: texte });
      else setMessage(texte);
    }
  }

  async function supprimer() {
    if (!fiche || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    if (await executer(() => supprimerJourTravaille(fiche.id))) {
      refetchAllApis();
      onFermer();
    }
  }

  return (
    <FenetreFiche nature="Jour travaillé" titre={fiche ? 'Jour travaillé' : 'Nouveau jour travaillé'} voisins={voisins} onFermer={onFermer}
      enEdition={modifiee(saisie, base)}>
      <RubanFiche enregistrer={{ onClick: () => void enregistrer(), disabled: !!fiche && !modifiee(saisie, base) }} propres={[]}
        supprimer={fiche ? { onClick: () => void supprimer() } : undefined} />
      {message && <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message}</p>}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        {fiche && <StatutPastille statut={fiche.statut} />}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {choisi('societeId', 'Entité *', entiteItems)}
          {choisi('projetId', 'Projet', projetItems)}
          <Champ id="jour-typeId" libelle="Type *">
            <SearchableSelect id="jour-typeId" items={typeItems} value={saisie.typeId || null} placeholder="Choisir…" emptyMessage="Aucun choix"
              className="w-full min-w-0"
              onValueChange={(v) => setSaisie((s) => appliquerType({ ...s, typeId: v ?? '' }, referentiels?.types.find((t) => t.id === v)))} />
            <Erreur texte={erreurs.typeId} />
          </Champ>
          {choisi('zoneId', 'Zone *', liste(referentiels?.zones))}
          {champ('date', 'Date *', 'date')}
          {champ('heureDebut', 'Heure début', 'time')}
          {champ('heureFin', 'Heure fin', 'time')}
          {choisi('employeId', 'Personnel', liste(referentiels?.personnel))}
          {choisi('clientId', 'Client', clientItems)}
          {choisi('niveauId', 'Niveau', liste(referentiels?.niveaux))}
          {choisi('articleId', 'Article', liste(referentiels?.articles))}
        </div>
        <BlocQuantitePrix suffixe="" saisie={saisie} erreurs={erreurs} maj={maj} total={fiche?.totalHT} />
        <BlocQuantitePrix suffixe="1" saisie={saisie} erreurs={erreurs} maj={maj} total={fiche?.totalHT1} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {champ('code', 'Code', 'text', 50)}
          <div className="col-span-full">
            <Champ id="jour-description" libelle="Description">
              <Textarea id="jour-description" rows={2} value={saisie.description} onChange={(e) => maj('description')(e.target.value)} />
            </Champ>
          </div>
          <div className="col-span-full">
            <Champ id="jour-notes" libelle="Notes">
              <Textarea id="jour-notes" rows={2} value={saisie.notes} onChange={(e) => maj('notes')(e.target.value)} />
            </Champ>
          </div>
        </div>
      </div>
    </FenetreFiche>
  );
}

/** Fiche d'un jour travaillé en fenêtre (`id` = `nouveau` en création). */
export default function JourTravailleDetail({ id, ...props }: Props & Readonly<{ id: string }>) {
  const creation = id === NOUVEAU_JOUR;
  const jour = useApi(() => (creation ? Promise.resolve(null) : getJourTravaille(id)), [id]);

  if (jour.error || (!creation && !jour.data)) {
    return (
      <FenetreFiche nature="Jour travaillé" titre="Jour travaillé" voisins={props.voisins} onFermer={props.onFermer}>
        {jour.error ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <ErrorState message={jour.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void jour.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        ) : <LoadingState />}
      </FenetreFiche>
    );
  }
  return <FenetreJour key={id} initiale={jour.data} {...props} />;
}
