import type { ComponentProps, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import CadreListe from '../patrimoine/CadreListe';
import type { OutilPropre } from '../liste/BarreOutilsFlottante';
import { pluriel } from '../../lib/format';
import type { ApiState } from '../../lib/useApi';

/** Liste non paginée (entités, actionnaires, groupes, études) : création réservée à l'Administrateur. */
export default function ListeAdmin<T extends { id: string; code?: string; description?: string }>({
  titre, chemin, libelleNouveau, etat, colonnes, panneau, selecteur, exportListe, importer, propres, sujet, aucun, filtre = false,
}: Readonly<{
  titre: string;
  /** `/actionnaires` : fiche `<chemin>/<id>`, création `<chemin>/nouveau`. */
  chemin: string;
  libelleNouveau: string;
  etat: ApiState<T[]>;
  colonnes: ColonneGrille<T>[];
  panneau?: ComponentProps<typeof CadreListe>['panneau'];
  selecteur?: ReactNode;
  exportListe?: ComponentProps<typeof CadreListe>['exportListe'];
  /** Page d'import, pour l'Administrateur. */
  importer?: string;
  propres?: OutilPropre[];
  /** Nom d'une ligne pour le décompte, et la phrase de liste vide accordée (« Aucune étude »). */
  sujet: string;
  aucun: string;
  /** Une recherche ou un filtre est posé (message de liste vide). */
  filtre?: boolean;
}>) {
  const navigate = useNavigate();
  const { data, loading, error } = etat;
  return (
    <CadreListe
      titre={titre}
      cle={chemin.replace('/', '')}
      lignes={data ? pluriel(data.length, sujet) : undefined}
      selecteur={selecteur}
      panneau={panneau}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={data?.length === 0 ? { aucun, filtresActifs: filtre, onReinitialiser: panneau?.onReinitialiser ?? (() => undefined) } : null}
      propres={propres}
      admin={{
        nouveau: { libelle: libelleNouveau, onClick: () => void navigate(`${chemin}/nouveau`) },
        actions: importer ? [{ id: 'importer', onClick: () => void navigate(importer) }] : [],
      }}
      exportListe={exportListe}
    >
      <DataGrid cleOrdre={chemin} rows={data ?? []} colonnes={colonnes} onOuvrir={(id) => void navigate(`${chemin}/${id}`)}
        libelleLigne={(r) => `Ouvrir ${r.description || r.code || ''}`.trim()} />
    </CadreListe>
  );
}
