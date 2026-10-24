import { ErrorState, LoadingState } from '../ui';
import SectionStatutsEtude from './SectionStatutsEtude';
import SectionTransitionsEtude from './SectionTransitionsEtude';
import {
  listChampsObligatoiresEtude, listRolesEtude, listStatutsEtudeConfig, listTransitionsEtudeConfig, listTypesEtatEtude,
} from '../../lib/apiFaisabilite';
import { referentielItems, useTypesPieceJointe } from '../../lib/referentiels';
import { useApi } from '../../lib/useApi';
import type { ContexteConfig } from '../../lib/workflowFaisabilite';

/** Statuts et transitions des études : Administrateur (écriture) et Direction Générale (lecture). */
export default function ConfigWorkflowFaisabilite() {
  const statuts = useApi(() => listStatutsEtudeConfig(), []);
  const transitions = useApi(() => listTransitionsEtudeConfig(), []);
  const roles = useApi(() => listRolesEtude(), []);
  const typesEtat = useApi(() => listTypesEtatEtude(), []);
  const champs = useApi(() => listChampsObligatoiresEtude(), []);
  const typesDocument = useTypesPieceJointe();

  const erreur = roles.error ?? typesEtat.error ?? champs.error ?? typesDocument.error;
  if (erreur) return <ErrorState message={erreur} />;
  if (!roles.data || !typesEtat.data || !champs.data) return <LoadingState />;

  const contexte: ContexteConfig = {
    listes: {
      statuts: (statuts.data ?? []).flatMap((s) => (s.id ? [{ label: s.description || s.code || s.id, value: s.id }] : [])),
      typesEtat: referentielItems(typesEtat.data),
      roles: referentielItems(roles.data),
      champs: champs.data.map((c) => ({ label: c.libelle, value: c.nom })),
    },
    typesDocument: referentielItems(typesDocument.data),
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionStatutsEtude etat={statuts} transitions={transitions} contexte={contexte} />
      <SectionTransitionsEtude etat={transitions} contexte={contexte} />
    </div>
  );
}
