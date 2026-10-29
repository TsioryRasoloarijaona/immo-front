import { useRef, useState } from 'react';
import { Download, Lock, LockOpen } from 'lucide-react';
import ChangerStatutEtude from '../ChangerStatutEtude';
import OngletsEtude from '../OngletsEtude';
import ActionAdmin from '../../patrimoine/ActionAdmin';
import ChampFiche from '../../fiche/ChampFiche';
import FenetrePatrimoine from '../../patrimoine/fiche/FenetrePatrimoine';
import { useSuppression } from '../../patrimoine/fiche/outilsFiche';
import { Badge } from '../../ui';
import { bloquerEtude, debloquerEtude, deleteEtudeFaisabilite, exporterEtude, getEtudeFaisabilite } from '../../../lib/apiFaisabilite';
import { useAuth } from '../../../lib/auth';
import { useConfirm } from '../../../lib/confirmContext';
import { toneStatut } from '../../../lib/faisabilite';
import type { VoisinsFiche } from '../../../lib/fenetreFiche';
import { formatDate, formatPercent } from '../../../lib/format';
import { estAdministrateur } from '../../../lib/roles';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, refetchAllApis, useApi } from '../../../lib/useApi';
import type { EtudeFaisabiliteDto } from '../../../types/faisabilite';

function BandeEtude({ e }: Readonly<{ e: EtudeFaisabiliteDto }>) {
  return (
    <>
      <ChampFiche libelle="Société" valeur={e.societeLibelle} />
      <ChampFiche libelle="Date" valeur={formatDate(e.dateDocument)} />
      <ChampFiche libelle="Code" valeur={e.code} />
      <ChampFiche libelle="Description" valeur={e.description} />
      <ChampFiche libelle="Statut" valeur={e.statutLibelle} />
      <ChampFiche libelle="Prospection terrain" valeur={e.prospectionTerrainDescription} />
      <ChampFiche libelle="Terrain" valeur={e.terrainLibelle} />
      <ChampFiche libelle="Taux de concrétisation" valeur={e.pourcentageConcretisation == null ? undefined : formatPercent(e.pourcentageConcretisation, 2)} />
      <ChampFiche libelle="Bloquée" type="case" valeur={e.bloquee} />
    </>
  );
}

/** Fiche de l'étude de faisabilité en fenêtre flottante : les onglets de `OngletsEtude` sont gardés tels quels. */
export default function FicheEtudeFenetre({ id, voisins, onFermer }: Readonly<{ id: string; voisins?: VoisinsFiche; onFermer: () => void }>) {
  const { data: fiche, error, refetch } = useApi(() => getEtudeFaisabilite(id), [id]);
  const [version, setVersion] = useState(0);
  const [onglet, setOnglet] = useState('identite');
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const declencheur = useRef<(() => void) | null>(null);
  const confirm = useConfirm();
  const showToast = useToast();
  const { user } = useAuth();
  const suppression = useSuppression({
    titre: "Supprimer l'étude",
    message: "L'étude, ses unités de base, ses tranches et son historique seront supprimés. Continuer ?",
    action: async () => {
      await deleteEtudeFaisabilite(id);
      showToast('Étude supprimée.');
    },
    apres: onFermer,
  });

  /** Relit l'étude, puis remonte les onglets pour repartir d'un brouillon propre. */
  async function rafraichir() {
    await refetch();
    refetchAllApis();
    setVersion((v) => v + 1);
  }

  async function agir(action: () => Promise<unknown>, titre: string, message: string, libelle: string, reussite: string) {
    if (!(await confirm({ title: titre, message, confirmLabel: libelle }))) return;
    setErreurAction(null);
    try {
      await action();
      showToast(reussite);
    } catch (err) {
      setErreurAction(errorMessage(err));
    }
  }

  async function exporter(code: string) {
    setErreurAction(null);
    try {
      await exporterEtude(id, code);
    } catch (err) {
      setErreurAction(errorMessage(err));
    }
  }

  const bascule = fiche?.bloquee
    ? () => agir(async () => { await debloquerEtude(id); await rafraichir(); }, "Débloquer l'étude", "L'étude redevient modifiable. Continuer ?", 'Débloquer', 'Étude débloquée.')
    : () => agir(async () => { await bloquerEtude(id); await rafraichir(); }, "Bloquer l'étude", "Bloquer enregistre l'étude (contrôles Verif) puis la verrouille. Continuer ?", 'Bloquer', 'Étude bloquée.');
  const modifiable = estAdministrateur(user) && fiche?.bloquee === false;

  return (
    <FenetrePatrimoine
      type="etude"
      nature="Étude de faisabilité"
      titre={fiche ? fiche.description || fiche.code : 'Étude de faisabilité'}
      badge={
        fiche && (
          <>
            {fiche.statutLibelle && <Badge tone={toneStatut(fiche.statutCouleur)}>{fiche.statutLibelle}</Badge>}
            {fiche.bloquee && <Badge tone="neutral">Bloquée</Badge>}
          </>
        )
      }
      voisins={voisins}
      onFermer={onFermer}
      enEdition={modifiable}
      trace={fiche ? { creePar: fiche.userCreate, creeLe: fiche.userCreateDateTime, modifiePar: fiche.userUpdate, modifieLe: fiche.userUpdateDateTime } : undefined}
      etat={{ chargement: !fiche, erreur: fiche ? null : error, pret: !!fiche, introuvable: "Cette étude n'existe pas." }}
      erreur={erreurAction ?? suppression.erreur}
      ruban={() => ({
        enregistrer: modifiable ? { onClick: () => declencheur.current?.() } : undefined,
        propres: fiche ? [{ id: 'export', libelle: 'Export Excel', icone: Download, onClick: () => void exporter(fiche.code) }] : [],
        enSuite: fiche && (
          <>
            <ChangerStatutEtude etudeId={id} bloquee={fiche.bloquee} onFait={() => void rafraichir()} />
            <ActionAdmin variant="outline" onClick={() => void bascule()} libelle={fiche.bloquee ? 'Débloquer' : 'Bloquer'}
              icone={fiche.bloquee ? <LockOpen data-icon="inline-start" /> : <Lock data-icon="inline-start" />} />
          </>
        ),
        supprimer: suppression.supprimer,
      })}
      bande={fiche && <BandeEtude e={fiche} />}
      contenuBas={
        fiche && (
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <OngletsEtude key={version} fiche={fiche} recharger={refetch} onEnregistre={() => void rafraichir()}
              ongletInitial={onglet} onOngletChange={setOnglet} declencheurRef={declencheur} />
          </div>
        )
      }
    />
  );
}
