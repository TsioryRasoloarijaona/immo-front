import { useMemo, useState } from 'react';
import { FileSpreadsheet, Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import BarreIcones from '../../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import FicheArticleAchat from '../../../components/achat/FicheArticleAchat';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { oublierLecturesRecentes } from '../../../lib/api';
import { lireArticleAchat, listerArticlesAchat, supprimerArticleAchat } from '../../../lib/apiArticlesAchat';
import { brouillonDepuis, brouillonVide, exporterArticlesCsv, type BrouillonArticle } from '../../../lib/articlesAchat';
import { useConfirm } from '../../../lib/confirmContext';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, useApi, useDebouncedValue } from '../../../lib/useApi';
import type { UUID } from '../../../types';
import type { ArticleAchatDto } from '../../../types/articlesAchat';

const COLONNES: ColonneGrille<ArticleAchatDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 14 },
  { nom: 'description', libelle: 'Description', largeur: 30 },
  { nom: 'unite', libelle: 'Unité', largeur: 8 },
  { nom: 'prixUnitaireHT', libelle: 'P.U. HT', type: 'MONTANT' },
  { nom: 'fodec', libelle: 'FODEC', type: 'POURCENTAGE' },
  { nom: 'coutLogistiqueHT', libelle: 'Coût logistique HT', type: 'MONTANT' },
  { nom: 'coutLogistiqueTva', libelle: 'Coût logistique TVA', type: 'POURCENTAGE' },
  { nom: 'coutIndirectHT', libelle: 'Coût indirect HT', type: 'MONTANT' },
  { nom: 'coutIndirectTva', libelle: 'Coût indirect TVA', type: 'POURCENTAGE' },
  { nom: 'coutFinancierHT', libelle: 'Coût financier HT', type: 'MONTANT' },
  { nom: 'coutFinancierTva', libelle: 'Coût financier TVA', type: 'POURCENTAGE' },
  { nom: 'prixVenteHT', libelle: 'Vente P.U. HT', type: 'MONTANT' },
  { nom: 'venteTva', libelle: 'Vente TVA', type: 'POURCENTAGE' },
  { nom: 'familleCode', libelle: 'Famille', largeur: 12 },
  { nom: 'sousFamilleCode', libelle: 'Sous-famille', largeur: 12 },
  { nom: 'categorieComptableCode', libelle: 'Catégorie', largeur: 12 },
  { nom: 'notes', libelle: 'Notes', largeur: 20 },
];

interface FicheOuverte { id?: UUID; brouillon: BrouillonArticle; lecture: boolean }

/** Achat › Configuration › Articles : liste, fiche en dialogue ; droits (écriture, suppression, export) donnés par le serveur. */
export default function ArticlesAchatList() {
  const [search, setSearch] = useState('');
  const recherche = useDebouncedValue(search.trim());
  const articles = useApi(() => listerArticlesAchat(recherche || undefined), [recherche], 'achat-config-articles');
  const confirm = useConfirm();
  const toast = useToast();
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);

  const liste = useMemo(() => [...(articles.data?.articles ?? [])].sort((a, b) => a.code.localeCompare(b.code, 'fr')), [articles.data]);
  const peutEcrire = articles.data?.peutEcrire ?? false;
  const peutSupprimer = articles.data?.peutSupprimer ?? false;
  const titre = articles.data ? `Articles (${liste.length})` : 'Articles';
  const rafraichir = () => { void articles.refetch(); };

  async function ouvrir(id: UUID, lecture: boolean) {
    try {
      setFiche({ id, brouillon: brouillonDepuis(await lireArticleAchat(id)), lecture });
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  async function supprimer(a: ArticleAchatDto) {
    const ok = await confirm({ title: 'Supprimer', message: 'Voulez-vous vraiment supprimer cet enregistrement ?', confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await supprimerArticleAchat(a.id);
      toast('Article supprimé.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    rafraichir();
  }

  return (
    <PageShell title={titre} icon={<Package />}
      crumbs={[{ label: 'Achat' }, { label: 'Configuration' }, { label: 'Articles' }]}
      actions={(
        <BarreIcones className="flex items-center gap-1">
          {peutEcrire && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setFiche({ brouillon: brouillonVide(), lecture: false })}>
              <Plus /> Nouvel article
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={rafraichir}><RefreshCw /> Rafraîchir</Button>
          {articles.data?.peutExporter && (
            <Button type="button" variant="ghost" size="sm" disabled={liste.length === 0} onClick={() => exporterArticlesCsv(liste)}>
              <FileSpreadsheet /> Exporter vers Excel
            </Button>
          )}
        </BarreIcones>
      )}>
      <div className="flex flex-col gap-3 p-4 md:px-7">
        <Input type="search" aria-label="Rechercher un article" placeholder="Rechercher (code, description, famille…)" className="max-w-sm"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {articles.loading && !articles.data && <LoadingState />}
        {articles.error && (
          <>
            <ErrorState message={articles.error} />
            <Button type="button" variant="outline" className="self-center" onClick={rafraichir}>Réessayer</Button>
          </>
        )}
        {!articles.error && articles.data && liste.length === 0 && <EmptyState title="Aucun article" />}
        {!articles.error && articles.data && liste.length > 0 && (
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid cleOrdre="achat-config-articles" rows={liste} colonnes={COLONNES} bandeauRegroupement={false}
              onOuvrir={(id) => void ouvrir(id, !peutEcrire)}
              libelleLigne={(a) => `Ouvrir l'article ${a.code}`}
              actions={(a) => (
                <BarreIcones className="flex items-center justify-center gap-1">
                  {peutEcrire && <Button type="button" variant="ghost" size="sm" onClick={() => void ouvrir(a.id, false)}><Pencil /> Modifier</Button>}
                  {peutSupprimer && <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(a)}><Trash2 /> Supprimer</Button>}
                </BarreIcones>
              )} />
          </div>
        )}
      </div>
      {fiche && (
        <FicheArticleAchat key={fiche.id ?? 'nouveau'} id={fiche.id} initial={fiche.brouillon} lecture={fiche.lecture}
          onClose={() => setFiche(null)} onEnregistre={() => { setFiche(null); rafraichir(); }} />
      )}
    </PageShell>
  );
}
