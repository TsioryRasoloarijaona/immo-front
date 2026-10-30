import { useState } from 'react';
import { ArrowRightCircle, RotateCcw } from 'lucide-react';
import FenetreFiche from '../fiche/FenetreFiche';
import RubanFiche from '../fiche/RubanFiche';
import { useSuppression } from '../patrimoine/fiche/outilsFiche';
import { Badge, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import ChampTache from './ChampTache';
import DialogueStatutTache from './DialogueStatutTache';
import { changerStatutTache, creerTache, getTache, listStatutsTaches, modifierTache, supprimerTache } from '../../lib/apiTaches';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import {
  CHAMPS_TACHE, corpsDepuis, erreurParChamp, messageTransition, NOUVELLE_TACHE, saisieDepuis, saisieVide, statutDe, toneStatut,
  type CleChamp,
} from '../../lib/saisieTache';
import { useChoixTaches, type ChoixTaches } from '../../lib/useChoixTaches';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { StatutTacheDto, TacheDto, TransitionTacheDto } from '../../types/taches';

type Props = Readonly<{ voisins?: VoisinsFiche; onFermer: () => void; onCree: (id: string) => void }>;

function FenetreTache({ tache, statuts, choix, voisins, onFermer, onCree, onMaj }: Props & Readonly<{
  tache: TacheDto | null;
  statuts: StatutTacheDto[];
  choix: ChoixTaches;
  onMaj: (t: TacheDto) => void;
}>) {
  const base = tache ? saisieDepuis(tache) : saisieVide();
  const [saisie, setSaisie] = useState(base);
  const [erreurs, setErreurs] = useState<Partial<Record<CleChamp, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [choisie, setChoisie] = useState<TransitionTacheDto | null>(null);
  const { erreur: erreurSuppression, supprimer } = useSuppression({
    titre: 'Supprimer la tâche',
    message: 'La tâche sera supprimée. Son historique de statuts est conservé. Continuer ?',
    action: () => supprimerTache(tache?.id ?? ''),
    apres: onFermer,
  });
  const transitions = tache ? (statutDe(statuts, tache.statutId)?.transitions ?? []) : [];
  const modifiee = CHAMPS_TACHE.some((c) => saisie[c.cle] !== base[c.cle]);

  async function enregistrer() {
    setErreurs({});
    setMessage(null);
    if (!saisie.description.trim()) {
      setErreurs({ description: 'La description est obligatoire.' });
      return;
    }
    try {
      const corps = corpsDepuis(saisie);
      const t = tache ? await modifierTache(tache.id, corps) : await creerTache(corps);
      refetchAllApis();
      if (tache) onMaj(t);
      else onCree(t.id);
    } catch (err) {
      const { cle, texte } = erreurParChamp(errorMessage(err));
      if (cle) setErreurs({ [cle]: texte });
      else setMessage(texte);
    }
  }

  async function passer(t: TransitionTacheDto, commentaire?: string) {
    setChoisie(null);
    setMessage(null);
    try {
      onMaj(await changerStatutTache(tache?.id ?? '', { statutId: t.statutId, commentaire: commentaire || undefined }));
      refetchAllApis();
    } catch (err) {
      setMessage(messageTransition(err));
    }
  }

  return (
    <FenetreFiche
      nature="Tâche"
      titre={tache?.code || 'Nouvelle tâche'}
      badge={tache && <Badge tone={toneStatut(statuts, tache.statutId)}>{tache.statutLibelle ?? statutDe(statuts, tache.statutId)?.code ?? 'Statut inconnu'}</Badge>}
      voisins={voisins}
      onFermer={onFermer}
      enEdition={modifiee}
    >
      <RubanFiche
        enregistrer={{ onClick: () => void enregistrer(), disabled: !modifiee }}
        propres={transitions.map((t) => ({
          id: t.statutId,
          libelle: `Passer à « ${t.code ?? 'statut'} »`,
          icone: ArrowRightCircle,
          onClick: () => (t.commentaireRequis ? setChoisie(t) : void passer(t)),
        }))}
        supprimer={tache ? supprimer : undefined}
      />
      {(message ?? erreurSuppression) && (
        <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message ?? erreurSuppression}</p>
      )}
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-auto p-4">
        <Field>
          <FieldLabel htmlFor="tache-code">Code</FieldLabel>
          <Input id="tache-code" value={tache?.code ?? ''} disabled readOnly />
        </Field>
        {CHAMPS_TACHE.map((c) => (
          <ChampTache key={c.cle} champ={c} valeur={saisie[c.cle]} items={c.liste ? choix[c.liste] : []} erreur={erreurs[c.cle]}
            onChange={(v) => setSaisie((s) => ({ ...s, [c.cle]: v }))} />
        ))}
      </div>
      {choisie && (
        <DialogueStatutTache cible={choisie.code ?? 'statut'} requis={choisie.commentaireRequis}
          onValider={(commentaire) => void passer(choisie, commentaire)} onClose={() => setChoisie(null)} />
      )}
    </FenetreFiche>
  );
}

/** Fiche d'une tâche en fenêtre (`id` = `nouveau` en création). Le statut ne se modifie que par les boutons de transition. */
export default function FicheTacheFenetre({ id, voisins, onFermer, onCree }: Props & Readonly<{ id: string }>) {
  const creation = id === NOUVELLE_TACHE;
  const tache = useApi(() => (creation ? Promise.resolve(null) : getTache(id)), [id]);
  const statuts = useApi(listStatutsTaches, [], 'taches-statuts');
  const choix = useChoixTaches();
  const [maj, setMaj] = useState<TacheDto | null>(null);
  const courante = maj?.id === id ? maj : tache.data;

  if (tache.error || (!creation && !courante)) {
    return (
      <FenetreFiche nature="Tâche" titre="Tâche" voisins={voisins} onFermer={onFermer}>
        {tache.error ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <ErrorState message={tache.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void tache.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        ) : (
          <LoadingState />
        )}
      </FenetreFiche>
    );
  }
  return <FenetreTache key={id} tache={courante} statuts={statuts.data ?? []} choix={choix} voisins={voisins} onFermer={onFermer} onCree={onCree} onMaj={setMaj} />;
}
