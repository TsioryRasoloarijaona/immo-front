import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCode2, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { listCategoriesModeles, listModelesAdmin } from '../../lib/apiModeles';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { ModeleDocumentAdminDto } from '../../types/modeles';
import AdminGuard from '../utilisateurs/AdminGuard';
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
      { nom: 'libelle', libelle: 'Libellé', largeur: 18, classe: 'font-medium text-foreground' },
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

  return (
    <AdminGuard
      title="Modèles de documents"
      crumbs={[{ label: 'Administration' }, { label: 'Modèles de documents' }]}
      icon={<FileCode2 />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Catégorie"
              className="h-8 rounded-md border border-input bg-background px-2 text-body text-foreground"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            >
              <option value={TOUTES}>Toutes les catégories</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.code} value={c.code}>{c.libelle}</option>
              ))}
            </select>
            <p className="text-micro text-muted-foreground">
              Documents imprimés depuis une fiche : texte fixe et champs remplis à la génération, en PDF ou Word.
            </p>
          </div>
          <Button type="button" disabled={!categories.data?.length} onClick={() => setCreation(true)}>
            <Plus data-icon="inline-start" /> Nouveau modèle
          </Button>
        </div>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {data.length} modèle{data.length > 1 ? 's' : ''}
            </div>
            {data.length === 0 ? (
              <EmptyState
                title="Aucun modèle"
                message={categorie ? 'Aucun modèle dans cette catégorie.' : "Aucun modèle n'existe encore."}
                action={
                  categorie ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setCategorie(TOUTES)}>
                      <RotateCcw data-icon="inline-start" /> Toutes les catégories
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid rows={data} colonnes={colonnes} cleOrdre="modeles-documents" />
              </div>
            )}
          </ResultsRegion>
        )}
      </div>

      {creation && categories.data && (
        <NouveauModeleDialog
          categories={categories.data}
          onClose={() => setCreation(false)}
          onCree={(m) => {
            setCreation(false);
            void navigate(`/modeles-documents/${m.id}`);
          }}
        />
      )}
    </AdminGuard>
  );
}
