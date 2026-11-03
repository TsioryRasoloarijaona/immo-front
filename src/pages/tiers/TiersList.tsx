import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Trash2, Upload } from 'lucide-react';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import { oublierLecturesRecentes } from '../../lib/api';
import { listNaturesTiers, listTiers, supprimerTiers } from '../../lib/apiAdministration';
import { CONFIG_TIERS } from '../../lib/colonnesTiers';
import { grilleDepuisCatalogue, useColonnesVisibles } from '../../lib/colonnes';
import { useConfirm } from '../../lib/confirmContext';
import { formatNumber, pluriel } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi, useDebouncedValue } from '../../lib/useApi';
import type { FamilleTiers, LigneTiersDto } from '../../types/administration';

const TAILLE_PAGE = 50;

/** `/administration/<famille>` : liste d'une famille de tiers, Administrateur seul. */
export default function TiersList({ famille }: Readonly<{ famille: FamilleTiers }>) {
  const cfg = CONFIG_TIERS[famille];
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [natureId, setNatureId] = useState<string | null>(null);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const recherche = useDebouncedValue(search).trim();

  const { data, loading, error } = useApi(
    () => listTiers(famille, { recherche: recherche || undefined, natureId: natureId ?? undefined, page, size: TAILLE_PAGE }),
    [famille, recherche, natureId, page, version],
  );
  const natures = useApi(() => (cfg.filtreNature ? listNaturesTiers(famille) : Promise.resolve([])), [famille, cfg.filtreNature]);
  const itemsNature = (natures.data ?? []).map((n) => ({ value: n.id, label: n.libelle || n.code || n.id }));

  const colonnes = useColonnesVisibles(`tiers-${famille}`, cfg.catalogue, cfg.disposition);
  const grille = useMemo(
    () => grilleDepuisCatalogue<LigneTiersDto>(colonnes.colonnes, cfg.disposition.poids, 'description'),
    [colonnes.colonnes, cfg.disposition.poids],
  );

  const rows = data?.content ?? [];
  const filtre = recherche !== '' || natureId !== null;
  const ouvrir = (id: string) => void navigate(`${cfg.chemin}/${id}`);

  function apresFiltre<T>(set: (v: T) => void) {
    return (v: T) => {
      setPage(0);
      setChoisie(null);
      set(v);
    };
  }

  function reinitialiser() {
    setPage(0);
    setChoisie(null);
    setSearch('');
    setNatureId(null);
  }

  async function supprimer() {
    const ligne = rows.find((r) => r.id === choisie);
    if (!ligne) return;
    const message = `Supprimer ${ligne.description || ligne.code || 'cette fiche'} ?`;
    if (!(await confirmer({ message, confirmLabel: 'Supprimer', cancelLabel: 'Annuler' }))) return;
    try {
      await supprimerTiers(famille, ligne.id);
      toast('Supprimé.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    setChoisie(null);
    setVersion((n) => n + 1);
  }

  const titre = data ? `${cfg.titre} (${formatNumber(data.totalElements)})` : cfg.titre;

  return (
    <CadreListe
      titre={titre}
      cle={`administration-${famille}`}
      reserveAdmin
      lignes={data ? pluriel(data.totalElements, cfg.sujet) : undefined}
      selecteur={
        <ColumnSelector compact catalogue={colonnes.catalogueServi} visibles={colonnes.visibles} onBasculer={colonnes.basculer}
          onReinitialiser={colonnes.reinitialiser} estDefaut={colonnes.estDefaut} />
      }
      panneau={{
        puces: [...puceUnique(itemsNature, natureId), ...(search ? [`« ${search} »`] : [])],
        recherche: { valeur: search, onChange: apresFiltre(setSearch), placeholder: 'Code, description, e-mail, ICE…' },
        onReinitialiser: reinitialiser,
        children: cfg.filtreNature && (
          <BoiteFiltre titre="Nature" mode="unique" items={itemsNature} valeur={natureId} onChange={apresFiltre(setNatureId)} />
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: cfg.aucun, filtresActifs: filtre, onReinitialiser: reinitialiser } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: apresFiltre(setPage) } : undefined}
      actions={[{ id: 'rafraichir', onClick: () => { oublierLecturesRecentes(); setVersion((n) => n + 1); } }]}
      propres={[
        { id: 'ouvrir', libelle: `Ouvrir le ${cfg.sujet}`, icone: FolderOpen, disabled: !choisie, onClick: () => choisie && ouvrir(choisie) },
        { id: 'supprimer', libelle: `Supprimer le ${cfg.sujet}`, icone: Trash2, disabled: !choisie, onClick: () => void supprimer() },
        { id: 'importer', libelle: `Importer des ${cfg.titre.toLowerCase()}`, icone: Upload, onClick: () => void navigate(`/articles/import?type=${famille}`) },
      ]}
      admin={{ nouveau: { libelle: `Nouveau ${cfg.sujet}`, onClick: () => void navigate(`${cfg.chemin}/nouveau`) } }}
    >
      <DataGrid
        cleOrdre={`tiers-${famille}`}
        rows={rows}
        colonnes={grille}
        onOuvrir={ouvrir}
        libelleLigne={(r) => `Ouvrir ${r.description || r.code || ''}`.trim()}
        selection={{
          ids: new Set(choisie ? [choisie] : []),
          onToggle: (id) => setChoisie((c) => (c === id ? null : id)),
          onToggleAll: () => setChoisie(null),
        }}
      />
    </CadreListe>
  );
}
