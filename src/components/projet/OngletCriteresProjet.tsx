import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { ColonneGrille } from '../DataGrid';
import { Button } from '../ui/button';
import { deleteCritereProjet, listCriteresProjet, saveCritereProjet } from '../../lib/apiProjetConfig';
import type { ChampDef } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import type { ReferentielItemDto, UUID } from '../../types';
import type { CritereAvancementDto, CritereAvancementEcritureDto } from '../../types/projetConfig';
import DialogueImportCriteres from './DialogueImportCriteres';
import OngletLignesProjet from './OngletLignesProjet';

const CHAMPS: ChampDef[] = [
  { nom: 'ordre', libelle: 'O.D.T.', type: 'entier' },
  { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
  { nom: 'categorieId', libelle: 'Catégorie', type: 'liste', obligatoire: true },
];

const COLONNES: ColonneGrille<CritereAvancementDto>[] = [
  { nom: 'ordre', libelle: 'O.D.T.', type: 'NOMBRE', largeur: 6 },
  { nom: 'description', libelle: 'Description', largeur: 24 },
  {
    nom: 'categorie', libelle: 'Catégorie', largeur: 14,
    valeur: (l) => l.categorieDescription ?? l.categorieCode ?? '',
  },
];

/** Critères d'avancement du projet ; l'import remplace toutes les lignes. */
export default function OngletCriteresProjet({ projetId, categories }: Readonly<{ projetId: UUID; categories: ReferentielItemDto[] }>) {
  const toast = useToast();
  const [importOuvert, setImport] = useState(false);
  const lignes = useApi(() => listCriteresProjet(projetId), [projetId]);
  const choix = useMemo(() => ({
    categorieId: categories.map((c) => ({ value: c.id, label: c.description ?? c.code ?? '—' })),
  }), [categories]);

  return (
    <>
      <OngletLignesProjet champs={CHAMPS} choix={choix} lignes={lignes} colonnes={COLONNES}
        vide="Aucun critère d'avancement" libelleLigne={(l) => l.description ?? 'Critère'}
        enregistrer={(corps, ligne) => saveCritereProjet(projetId, corps as unknown as CritereAvancementEcritureDto, ligne?.id)}
        supprimer={(l) => deleteCritereProjet(projetId, l.id)}
        barre={<Button type="button" variant="ghost" size="sm" onClick={() => setImport(true)}><Download /> Importer depuis un autre projet</Button>} />
      {importOuvert && (
        <DialogueImportCriteres projetId={projetId} onClose={() => setImport(false)}
          onImporte={() => { setImport(false); toast('Critères importés.'); void lignes.refetch(); }} />
      )}
    </>
  );
}
