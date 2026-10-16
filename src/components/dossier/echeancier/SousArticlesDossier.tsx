import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../SearchableSelect';
import { Badge, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import {
  ajouterSousArticle,
  listSousArticles,
  listSousArticlesDisponibles,
  retirerSousArticle,
} from '../../../lib/apiDossierSousListes';
import { useAuth } from '../../../lib/auth';
import { useConfirm } from '../../../lib/confirmContext';
import { formatCurrency, formatPercentValue, formatSurface } from '../../../lib/format';
import { estAdministrateur } from '../../../lib/roles';
import { useApi } from '../../../lib/useApi';
import { useEcriture } from '../../../lib/useEcriture';
import type { SousArticleDto, SousArticlesDto } from '../../../types/dossierSousListes';

function Ajout({ dossierId, onAjoute }: Readonly<{ dossierId: string; onAjoute: () => Promise<void> }>) {
  const disponibles = useApi(() => listSousArticlesDisponibles(dossierId), [dossierId]);
  const [articleId, setArticleId] = useState<string | null>(null);
  const { occupe, executer } = useEcriture();
  const items = (disponibles.data ?? []).map((a) => ({
    value: a.id,
    label: [a.code, a.categorie, a.superficie ? formatSurface(a.superficie) : null, `${formatCurrency(a.prixHT)} HT`]
      .filter(Boolean)
      .join(' · '),
  }));

  async function ajouter() {
    if (!articleId) return;
    const ok = await executer(async () => {
      await ajouterSousArticle(dossierId, articleId);
      await Promise.all([onAjoute(), disponibles.refetch()]);
    }, 'Sous-article ajouté.');
    if (ok) setArticleId(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-64 flex-1">
        <SearchableSelect
          label="Sous-article libre"
          items={items}
          value={articleId}
          onValueChange={setArticleId}
          size="sm"
          emptyMessage="Aucun sous-article libre dans la tranche."
        />
      </div>
      <Button type="button" size="sm" disabled={occupe || !articleId} onClick={() => void ajouter()}>
        <Plus data-icon="inline-start" /> Ajouter
      </Button>
    </div>
  );
}

function Totaux({ s }: Readonly<{ s: SousArticlesDto }>) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-micro text-muted-foreground">
      <span>Prix avant remise HT <b className="tabular-nums text-foreground">{formatCurrency(s.prixAvantRemiseHT)}</b></span>
      <span>Remise <b className="tabular-nums text-foreground">{formatPercentValue(s.remisePercent, 4)}</b> ({formatCurrency(s.remiseMontantHT)} HT)</span>
      <span>Prix après remise <b className="tabular-nums text-foreground">{formatCurrency(s.prixApresRemiseTTC)}</b> TTC</span>
    </div>
  );
}

function Ligne({ l, peutModifier, onRetirer }: Readonly<{ l: SousArticleDto; peutModifier: boolean; onRetirer: (l: SousArticleDto) => void }>) {
  return (
    <TableRow>
      <TableCell className="font-medium">{l.code || '—'}</TableCell>
      <TableCell>{l.categorie || '—'}</TableCell>
      <TableCell className="text-right tabular-nums">{formatSurface(l.superficie)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(l.prixAvantRemiseHT)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(l.prixTTC)}</TableCell>
      <TableCell>{l.affecteParDefaut && <Badge tone="info">Affecté par défaut</Badge>}</TableCell>
      <TableCell className="text-right">
        {peutModifier && !l.affecteParDefaut && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer ${l.code ?? 'le sous-article'}`} onClick={() => onRetirer(l)}>
            <Trash2 />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Sous-articles du dossier : ajout / retrait recalculent le taux de remise, pas son montant. */
export default function SousArticlesDossier({ dossierId, onChanged }: Readonly<{ dossierId: string; onChanged: () => Promise<void> }>) {
  const sousArticles = useApi(() => listSousArticles(dossierId), [dossierId], 'dossier-sous-articles');
  const { user } = useAuth();
  const peutModifier = estAdministrateur(user);
  const confirm = useConfirm();
  const { executer } = useEcriture();

  async function relire() {
    await Promise.all([sousArticles.refetch(), onChanged()]);
  }

  async function retirer(l: SousArticleDto) {
    const ok = await confirm({ message: `Retirer ${l.code ?? 'ce sous-article'} du dossier ? Le taux de remise sera recalculé.`, confirmLabel: 'Retirer' });
    if (ok) await executer(async () => { await retirerSousArticle(dossierId, l.id); await relire(); }, 'Sous-article retiré.');
  }

  return (
    <section className="flex flex-col gap-2" aria-label="Sous-articles">
      <h3 className="text-label font-semibold text-foreground">Sous-articles</h3>
      {sousArticles.loading && !sousArticles.data && <LoadingState />}
      {sousArticles.error && <ErrorState message={sousArticles.error} />}
      {!sousArticles.error && sousArticles.data && (
        <>
          <Totaux s={sousArticles.data} />
          {sousArticles.data.lignes.length === 0 ? (
            <p className="text-label text-muted-foreground">Aucun sous-article sur ce dossier.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Code</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Superficie</TableHead>
                  <TableHead className="text-right">Prix HT</TableHead>
                  <TableHead className="text-right">Prix TTC remisé</TableHead>
                  <TableHead />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sousArticles.data.lignes.map((l) => (
                  <Ligne key={l.id} l={l} peutModifier={peutModifier} onRetirer={(x) => void retirer(x)} />
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
      {peutModifier && <Ajout dossierId={dossierId} onAjoute={relire} />}
    </section>
  );
}
