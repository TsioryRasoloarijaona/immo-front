import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Badge } from '../../components/ui';
import { Button } from '../../components/ui/button';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { listCategoriesModeles, listModelesAdmin } from '../../lib/apiModeles';
import { formatDateTime, pluriel } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { useApi } from '../../lib/useApi';
import type { ModeleDocumentAdminDto } from '../../types/modeles';
import NouveauModeleDialog from './NouveauModeleDialog';

const TOUTES = '';

/** `/modeles-documents` : tous les modèles, actifs et inactifs (FEATURE-modeles-documents.md §9). */
export default function ModelesDocumentsList() {
  const navigate = useNavigate();
  const [categorie, setCategorie] = useState(TOUTES);
  const [creation, setCreation] = useState(false);
  const categories = useApi(() => listCategoriesModeles(), [], 'modeles-categories');
  const { data, loading, error } = useApi(() => listModelesAdmin(categorie || undefined), [categorie], 'modeles-admin');

  const libellesCategories = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.code, c.libelle])),
    [categories.data],
  );

  const colonnes = useMemo<ColonneGrille<ModeleDocumentAdminDto>[]>(
    () => [
      {
        nom: 'libelle',
        libelle: 'Libellé',
        largeur: 18,
        classe: 'font-medium text-foreground',
        titre: (r) => `Ouvrir « ${r.libelle} » dans l'éditeur`,
        rendu: (r) => (
          <Link to={`/modeles-documents/${r.id}`} className="text-(--brand) hover:underline">
            {r.libelle}
          </Link>
        ),
      },
      { nom: 'code', libelle: 'Code', largeur: 14, classe: 'font-mono text-muted-foreground' },
      {
        nom: 'categorie',
        libelle: 'Catégorie',
        largeur: 11,
        valeur: (r) => libellesCategories.get(r.categorie) ?? r.categorie,
      },
      { nom: 'ordre', libelle: 'Ordre', largeur: 6, type: 'NOMBRE' },
      {
        nom: 'actif',
        libelle: 'Statut',
        largeur: 8,
        valeur: (r) => (r.actif ? 'Actif' : 'Inactif'),
        rendu: (r) => (r.actif ? <Badge tone="success">Actif</Badge> : <Badge tone="neutral">Inactif</Badge>),
      },
      {
        nom: 'versionCourante',
        libelle: 'Version',
        largeur: 6,
        valeur: (r) => (r.versionCourante ? `v${r.versionCourante}` : '—'),
      },
      {
        nom: 'modifieLe',
        libelle: 'Modifié',
        largeur: 14,
        classe: 'text-muted-foreground',
        valeur: (r) => r.modifieLe ?? '',
        rendu: (r) => (
          <>
            <div className="truncate">{formatDateTime(r.modifieLe)}</div>
            {r.modifiePar && <div className="truncate text-micro">par {r.modifiePar}</div>}
          </>
        ),
      },
      {
        nom: 'actions',
        libelle: 'Actions',
        largeur: 8,
        rendu: (r) => (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => void navigate(`/modeles-documents/${r.id}`)}>
              <Pencil data-icon="inline-start" /> Éditer
            </Button>
          </div>
        ),
      },
    ],
    [libellesCategories, navigate],
  );

  const itemsCategories = (categories.data ?? []).map((c) => ({ value: c.code, label: c.libelle }));
  const peutCreer = !!categories.data?.length;

  return (
    <CadreListe
      titre="Modèles de documents"
      cle="modeles-documents"
      reserveAdmin
      lignes={data ? pluriel(data.length, 'modèle') : undefined}
      panneau={{
        puces: puceUnique(itemsCategories, categorie || null),
        onReinitialiser: () => setCategorie(TOUTES),
        children: (
          <BoiteFiltre titre="Catégorie" mode="unique" items={itemsCategories} valeur={categorie || null}
            onChange={(v) => setCategorie(v ?? TOUTES)} />
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      avant={
        <p className="shrink-0 text-micro text-muted-foreground">
          Documents imprimés depuis une fiche : texte fixe et champs remplis à la génération, en PDF ou Word.
        </p>
      }
      vide={data?.length === 0 ? {
        aucun: 'Aucun modèle',
        filtresActifs: !!categorie,
        onReinitialiser: () => setCategorie(TOUTES),
        message: "Aucun modèle n'existe encore.",
      } : null}
      admin={{ nouveau: peutCreer ? { libelle: 'Nouveau modèle', onClick: () => setCreation(true) } : undefined }}
      dialogues={creation && categories.data && (
        <NouveauModeleDialog
          categories={categories.data}
          onClose={() => setCreation(false)}
          onCree={(m) => {
            setCreation(false);
            void navigate(`/modeles-documents/${m.id}`);
          }}
        />
      )}
    >
      <DataGrid rows={data ?? []} colonnes={colonnes} cleOrdre="modeles-documents" />
    </CadreListe>
  );
}
