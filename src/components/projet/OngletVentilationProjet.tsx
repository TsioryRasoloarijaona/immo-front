import { useMemo } from 'react';
import type { ColonneGrille } from '../DataGrid';
import { deleteVentilationProjet, listVentilationsProjet, saveVentilationProjet } from '../../lib/apiProjetConfig';
import { formatPercent } from '../../lib/format';
import { CHAMPS_VENTILATION, totalVentilation } from '../../lib/saisieVentilationProjet';
import { useApi } from '../../lib/useApi';
import type { ReferentielItemDto, UUID } from '../../types';
import type { VentilationTrancheDto, VentilationTrancheEcritureDto } from '../../types/projetConfig';
import OngletLignesProjet from './OngletLignesProjet';

const COLONNES: ColonneGrille<VentilationTrancheDto>[] = [
  { nom: 'taux', libelle: 'Taux', type: 'POURCENTAGE', largeur: 8 },
  {
    nom: 'tranche', libelle: 'Tranche', largeur: 20,
    valeur: (l) => `${l.trancheCode ?? ''} ${l.trancheDescription ?? ''}`.trim(),
  },
];

/** Ventilation du projet par tranches : la somme des taux ne dépasse pas 100 % (le serveur refuse sinon). */
export default function OngletVentilationProjet({ projetId, tranches }: Readonly<{ projetId: UUID; tranches: ReferentielItemDto[] }>) {
  const lignes = useApi(() => listVentilationsProjet(projetId), [projetId]);
  const choix = useMemo(() => ({
    trancheId: tranches.map((t) => ({ value: t.id, label: t.description ?? t.code ?? '—' })),
  }), [tranches]);
  const total = totalVentilation(lignes.data ?? []);

  return (
    <OngletLignesProjet champs={CHAMPS_VENTILATION} choix={choix} lignes={lignes} colonnes={COLONNES}
      vide="Aucune ventilation" libelleLigne={(l) => l.trancheCode ?? l.trancheDescription ?? 'Tranche'}
      enregistrer={(corps, ligne) => saveVentilationProjet(projetId, corps as unknown as VentilationTrancheEcritureDto, ligne?.id)}
      supprimer={(l) => deleteVentilationProjet(projetId, l.id)}
      pied={(
        <p className={`text-body font-semibold ${total > 1 ? 'text-destructive' : 'text-foreground'}`}>
          Σ {formatPercent(total, 2)}
        </p>
      )} />
  );
}
