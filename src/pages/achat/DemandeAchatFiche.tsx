import { useEffect, useState } from 'react';
import { History, RotateCcw, Shuffle } from 'lucide-react';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import RubanFiche from '../../components/fiche/RubanFiche';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { ApiError } from '../../lib/api';
import { getReferentielsAchat } from '../../lib/apiAchat';
import {
  creerDemandeAchat, getDemandeAchat, getTransitionsDemandeAchat, modifierDemandeAchat, supprimerDemandeAchat,
} from '../../lib/apiDemandesAchat';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { useConfirm } from '../../lib/confirmContext';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import { useEcriture } from '../../lib/useEcriture';
import type { DatesDemandeAchat, DemandeAchatFiche as FicheDto } from '../../types/demandesAchat';
import DemandeAchatOnglets from './DemandeAchatOnglets';
import { corpsDepuis, saisieDepuis, type CleSaisie, type Listes } from './saisieDemandeAchat';
import DialogueTransitionDemandeAchat from './DialogueTransitionDemandeAchat';
import HistoriqueDemandeAchat from './HistoriqueDemandeAchat';

type Props = Readonly<{
  id: string;
  voisins?: VoisinsFiche;
  onFermer: () => void;
  onNaviguer?: (id: string) => void;
}>;

const NATURE = 'Demande d\'achat';
const MESSAGE_SUPPRESSION = 'Voulez-vous vraiment supprimer cet enregistrement ?';

function useListes(): Listes {
  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const procedures = useApi(() => listLignesReferentiel('procedures-achat'), [], 'procedures-achat');
  const r = referentiels.data;
  return {
    procedures: (procedures.data ?? []).flatMap((l) => {
      const libelle = [l.description, l.libelle, l.code].find((v): v is string => typeof v === 'string' && v !== '');
      return l.id ? [{ label: libelle ?? l.id, value: l.id }] : [];
    }),
    societes: (r?.societes ?? []).map((s) => ({ label: s.description ?? s.code ?? s.id, value: s.id })),
    projets: (r?.projets ?? []).map((p) => ({ label: p.description ?? p.code ?? p.id, value: p.id })),
    typesLot: (r?.typesLot ?? []).map((t) => ({ label: t.libelle ?? t.code ?? t.id, value: t.id })),
    modules: (r?.modules ?? []).flatMap((m) => (m.id ? [{ label: m.libelle, value: m.id }] : [])),
  };
}

/** Le bouton Statut disparaît quand le compte n'a pas le droit de lire les transitions (403). */
function useDroitStatut(id: string): boolean {
  const [permis, setPermis] = useState(true);
  useEffect(() => {
    if (id === 'nouveau') return;
    getTransitionsDemandeAchat(id).catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 403) setPermis(false);
    });
  }, [id]);
  return permis;
}

function FenetreDemande({ id, initiale, voisins, onFermer, onNaviguer }: Props & Readonly<{ initiale: FicheDto | null }>) {
  const [fiche, setFiche] = useState(initiale);
  const [saisie, setSaisie] = useState(() => saisieDepuis(initiale));
  const [erreurs, setErreurs] = useState<Partial<Record<CleSaisie, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<'statut' | 'historique' | null>(null);
  const confirmer = useConfirm();
  const { executer } = useEcriture();
  const listes = useListes();
  const droitStatut = useDroitStatut(id);
  const verrou = fiche?.estDerniere === false;

  const maj = (cle: CleSaisie) => (v: string) => setSaisie((s) => ({ ...s, [cle]: v }));
  const majDate = (cle: keyof DatesDemandeAchat) => (v: string) => setSaisie((s) => ({ ...s, dates: { ...s.dates, [cle]: v } }));

  async function enregistrer() {
    setMessage(null);
    const manque: Partial<Record<CleSaisie, string>> = {};
    for (const cle of ['procedureId', 'societeId', 'description'] as const) {
      if (!saisie[cle].trim()) manque[cle] = 'Champ obligatoire.';
    }
    setErreurs(manque);
    if (Object.keys(manque).length > 0) return;
    try {
      const corps = corpsDepuis(saisie);
      const r = fiche ? await modifierDemandeAchat(fiche.id, corps) : await creerDemandeAchat(corps);
      refetchAllApis();
      if (fiche) {
        setFiche(r);
        setSaisie(saisieDepuis(r));
      } else if (onNaviguer) onNaviguer(r.id);
      else onFermer();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  async function supprimer() {
    if (!fiche || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    if (await executer(() => supprimerDemandeAchat(fiche.id))) {
      refetchAllApis();
      onFermer();
    }
  }

  const propres = fiche
    ? [
        ...(droitStatut ? [{ id: 'statut', libelle: 'Statut', icone: Shuffle, onClick: () => setDialogue('statut') }] : []),
        { id: 'historique', libelle: 'Historique', icone: History, onClick: () => setDialogue('historique') },
      ]
    : [];

  return (
    <FenetreFiche nature={NATURE} titre={fiche?.code || 'Nouvelle demande d\'achat'} voisins={voisins} onFermer={onFermer}>
      <RubanFiche enregistrer={{ onClick: () => void enregistrer(), disabled: verrou }} propres={propres}
        supprimer={fiche && !verrou ? { onClick: () => void supprimer() } : undefined} />
      {message && <p role="alert" className="shrink-0 px-4 pt-2 text-label text-destructive">{message}</p>}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <DemandeAchatOnglets fiche={fiche} saisie={saisie} maj={maj} majDate={majDate} listes={listes} erreurs={erreurs} />
      </div>
      {fiche && dialogue === 'statut' && (
        <DialogueTransitionDemandeAchat id={fiche.id} statut={fiche.statut?.libelle ?? '—'} onAnnuler={() => setDialogue(null)}
          onFait={(f) => { setFiche(f); setSaisie(saisieDepuis(f)); setDialogue(null); refetchAllApis(); }} />
      )}
      {fiche && dialogue === 'historique' && <HistoriqueDemandeAchat id={fiche.id} onFermer={() => setDialogue(null)} />}
    </FenetreFiche>
  );
}

/** Fiche d'une demande d'achat en fenêtre (`id` = `nouveau` en création). */
export default function DemandeAchatFiche(props: Props) {
  const { id } = props;
  const creation = id === 'nouveau';
  const demande = useApi(() => (creation ? Promise.resolve(null) : getDemandeAchat(id)), [id]);

  if (demande.error || (!creation && !demande.data)) {
    return (
      <FenetreFiche nature={NATURE} titre={NATURE} voisins={props.voisins} onFermer={props.onFermer}>
        {demande.error ? (
          <div className="flex flex-col items-center gap-2 p-4">
            <ErrorState message={demande.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void demande.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        ) : (
          <LoadingState />
        )}
      </FenetreFiche>
    );
  }
  return <FenetreDemande key={id} {...props} initiale={demande.data} />;
}
