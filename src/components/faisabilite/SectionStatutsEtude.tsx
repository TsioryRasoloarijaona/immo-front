import { useState } from 'react';
import { Badge } from '../ui';
import type { ColonneLecture } from '../patrimoine/TableauLecture';
import DialogueConfigWorkflow from './DialogueConfigWorkflow';
import TableConfigWorkflow from './TableConfigWorkflow';
import { creerStatutEtude, modifierStatutEtude, supprimerStatutEtude } from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import { toneStatut } from '../../lib/faisabilite';
import { estAdministrateur } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import type { ApiState } from '../../lib/useApi';
import { SECTIONS_STATUT, type ContexteConfig } from '../../lib/workflowFaisabilite';
import type { StatutEtudeConfigDto, TransitionEtudeConfigDto } from '../../types/faisabilite';

const COLONNES: ColonneLecture<StatutEtudeConfigDto>[] = [
  { titre: 'Ordre', rendu: (s) => s.sorting ?? '—' },
  { titre: 'Code', rendu: (s) => <Badge tone={toneStatut(s.couleur ?? null)}>{s.code}</Badge> },
  { titre: 'Description', rendu: (s) => s.description || '—' },
  { titre: "Type d'état", rendu: (s) => s.typeEtatLibelle || '—' },
  { titre: 'Champs exigés', rendu: (s) => s.champsObligatoires?.length ?? 0 },
  { titre: 'Documents', rendu: (s) => s.documents?.length ?? 0 },
];

const libelle = (s: StatutEtudeConfigDto) => s.description || s.code || 'statut';

/** Statuts d'étude (`StkFeasibilityStudyStatus`) : liste et dialogue d'édition. */
export default function SectionStatutsEtude({ etat, transitions, contexte }: Readonly<{
  etat: ApiState<StatutEtudeConfigDto[]>;
  /** Relue après un enregistrement : les transitions affichent les libellés de statut. */
  transitions: ApiState<TransitionEtudeConfigDto[]>;
  contexte: ContexteConfig;
}>) {
  const lecture = !estAdministrateur(useAuth().user);
  const showToast = useToast();
  /** `undefined` : fermé ; `null` : création. */
  const [edition, setEdition] = useState<StatutEtudeConfigDto | null | undefined>(undefined);

  async function valider(corps: Record<string, unknown>, documents: StatutEtudeConfigDto['documents']) {
    const body = { ...corps, documents } as StatutEtudeConfigDto;
    await (edition?.id ? modifierStatutEtude(edition.id, body) : creerStatutEtude(body));
    showToast('Statut enregistré.');
    await Promise.all([etat.refetch(), transitions.refetch()]);
  }

  return (
    <>
      <TableConfigWorkflow titre="Statuts" etat={etat} colonnes={COLONNES} libelleAjout="Nouveau statut" nom={libelle}
        onOuvrir={setEdition} supprimer={supprimerStatutEtude} />
      {edition !== undefined && (
        <DialogueConfigWorkflow titre={edition ? `Statut ${libelle(edition)}` : 'Nouveau statut'} sections={SECTIONS_STATUT}
          source={edition ?? { sorting: 1 }} listes={contexte.listes} typesDocument={contexte.typesDocument} lecture={lecture}
          onValider={valider} onClose={() => setEdition(undefined)} />
      )}
    </>
  );
}
