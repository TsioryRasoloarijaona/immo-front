import { useState } from 'react';
import type { ColonneLecture } from '../patrimoine/TableauLecture';
import DialogueConfigWorkflow from './DialogueConfigWorkflow';
import TableConfigWorkflow from './TableConfigWorkflow';
import { creerTransitionEtude, modifierTransitionEtude, supprimerTransitionEtude } from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import type { ApiState } from '../../lib/useApi';
import { SECTIONS_TRANSITION, type ContexteConfig } from '../../lib/workflowFaisabilite';
import type { TransitionEtudeConfigDto } from '../../types/faisabilite';

const libelle = (t: TransitionEtudeConfigDto) => t.description || 'transition';

const AIDE_ROLES = "Seuls l'Administrateur et la Direction Générale peuvent ouvrir une étude : un autre rôle coché reste sans effet. "
  + 'Une transition sans rôle est permise mais personne ne peut l\'emprunter.';

/** Transitions d'étude (`StkFeasibilityStudyWorkFlow`) : liste, rôles, champs et documents exigés. */
export default function SectionTransitionsEtude({ etat, contexte }: Readonly<{ etat: ApiState<TransitionEtudeConfigDto[]>; contexte: ContexteConfig }>) {
  const lecture = !estAdministrateur(useAuth().user);
  const showToast = useToast();
  /** `undefined` : fermé ; `null` : création. */
  const [edition, setEdition] = useState<TransitionEtudeConfigDto | null | undefined>(undefined);
  const roles = contexte.listes.roles;

  const colonnes: ColonneLecture<TransitionEtudeConfigDto>[] = [
    { titre: 'Ordre', rendu: (t) => t.sorting ?? '—' },
    { titre: 'Description', rendu: (t) => libelle(t) },
    { titre: 'Passage', rendu: (t) => `${t.statutDepartLibelle ?? '—'} → ${t.statutArriveeLibelle ?? '—'}` },
    {
      titre: 'Rôles',
      rendu: (t) => (t.roles?.length ? t.roles.map((r) => roles.find((x) => x.value === r)?.label ?? r).join(', ') : 'Aucun'),
    },
    { titre: 'Champs exigés', rendu: (t) => t.champsObligatoires?.length ?? 0 },
    { titre: 'Documents', rendu: (t) => t.documents?.length ?? 0 },
  ];

  async function valider(corps: Record<string, unknown>, documents: TransitionEtudeConfigDto['documents']) {
    const body = { ...corps, documents } as TransitionEtudeConfigDto;
    await (edition?.id ? modifierTransitionEtude(edition.id, body) : creerTransitionEtude(body));
    showToast('Transition enregistrée.');
    await etat.refetch();
  }

  return (
    <>
      <TableConfigWorkflow titre="Transitions" etat={etat} colonnes={colonnes} libelleAjout="Nouvelle transition" nom={libelle}
        onOuvrir={setEdition} supprimer={supprimerTransitionEtude} />
      {edition !== undefined && (
        <DialogueConfigWorkflow titre={edition ? `Transition ${libelle(edition)}` : 'Nouvelle transition'} sections={SECTIONS_TRANSITION}
          source={edition ?? { sorting: 1 }} listes={contexte.listes} typesDocument={contexte.typesDocument} lecture={lecture} aide={AIDE_ROLES}
          onValider={valider} onClose={() => setEdition(undefined)} />
      )}
    </>
  );
}
