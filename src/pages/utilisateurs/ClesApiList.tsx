import { useMemo, useState } from 'react';
import { Ban, Bot, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { listClesApi, regenererCleApi, revoquerCleApi } from '../../lib/api';
import { libellePortee } from '../../lib/clesApi';
import { useConfirm } from '../../lib/confirmContext';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';
import type { CleApiCreeeDto, CleApiDto } from '../../types';
import AdminGuard from './AdminGuard';
import CreerCleApiDialog from './CreerCleApiDialog';
import SecretCleApiDialog from './SecretCleApiDialog';

type StatutFilter = 'all' | 'actives' | 'revoquees';

const STATUT_ITEMS: { label: string; value: StatutFilter }[] = [
  { label: 'Toutes les clés', value: 'all' },
  { label: 'Actives', value: 'actives' },
  { label: 'Révoquées', value: 'revoquees' },
];

function correspondStatut(c: CleApiDto, statut: StatutFilter): boolean {
  if (statut === 'all') return true;
  return statut === 'actives' ? c.actif !== false : c.actif === false;
}

/* `/api/cles-api` renvoie la liste entière : pas de pagination serveur. Régénérer et
   révoquer sont irréversibles (le client est cassé tant que le nouveau secret n'est pas
   posé) ; le secret n'apparaît qu'une fois, dans `SecretCleApiDialog`. */
export default function ClesApiList() {
  const confirm = useConfirm();
  const [statut, setStatut] = useState<StatutFilter>('all');
  const [creation, setCreation] = useState(false);
  const [secret, setSecret] = useState<{ resultat: CleApiCreeeDto; mode: 'creation' | 'regeneration' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const { data, loading, error, refetch } = useApi(() => listClesApi(), [], 'cles-api');

  const rows = useMemo(() => (data ?? []).filter((c) => correspondStatut(c, statut)), [data, statut]);

  async function regenerer(c: CleApiDto) {
    const ok = await confirm({
      title: 'Régénérer le secret ?',
      message: `L'ancien secret de « ${c.nom} » cessera d'être accepté immédiatement : le client sera coupé tant que le nouveau n'est pas configuré. Le nouveau secret ne sera affiché qu'une fois.`,
      confirmLabel: 'Régénérer',
    });
    if (!ok) return;
    setBusyId(c.id);
    try {
      const resultat = await regenererCleApi(c.id);
      setSecret({ resultat, mode: 'regeneration' });
      await refetch();
    } catch (err) {
      toast({ texte: err instanceof Error ? err.message : 'Échec de la régénération.', variante: 'erreur' });
    } finally {
      setBusyId(null);
    }
  }

  async function revoquer(c: CleApiDto) {
    const ok = await confirm({
      title: 'Révoquer la clé ?',
      message: `« ${c.nom} » sera refusée dès maintenant. La révocation est définitive : pour rétablir l'accès, il faudra créer une nouvelle clé. Le compte de service n'est pas touché.`,
      confirmLabel: 'Révoquer',
    });
    if (!ok) return;
    setBusyId(c.id);
    try {
      await revoquerCleApi(c.id);
      await refetch();
      toast(`Clé « ${c.nom} » révoquée.`);
    } catch (err) {
      toast({ texte: err instanceof Error ? err.message : 'Échec de la révocation.', variante: 'erreur' });
    } finally {
      setBusyId(null);
    }
  }

  const colonnes = useMemo<ColonneGrille<CleApiDto>[]>(
    () => [
      {
        nom: 'nom',
        libelle: 'Client',
        largeur: 14,
        classe: 'font-medium text-foreground',
        titre: (r) => r.nom || undefined,
        rendu: (r) => (
          <>
            {r.nom || '—'}
            {r.clePrefixe && (
              <div className="truncate font-mono text-micro font-normal text-muted-foreground" title="Préfixe de la clé, pour la reconnaître côté client">
                {r.clePrefixe}…
              </div>
            )}
          </>
        ),
      },
      {
        nom: 'dateCreation',
        libelle: 'Créée',
        largeur: 12,
        classe: 'text-muted-foreground',
        valeur: (r) => r.dateCreation ?? '',
        rendu: (r) => (
          <>
            <div className="truncate">{r.dateCreation ? formatDateTime(r.dateCreation) : '—'}</div>
            {r.creePar && <div className="truncate text-micro">par {r.creePar}</div>}
          </>
        ),
      },
      {
        nom: 'portees',
        libelle: 'Portées',
        largeur: 18,
        valeur: (r) => (r.portees ?? []).map(libellePortee).join(', '),
        rendu: (r) =>
          r.portees && r.portees.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {r.portees.map((p) => (
                <Badge key={p} tone={p.endsWith('_ECRIRE') ? 'progress' : 'neutral'}>
                  {libellePortee(p)}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        nom: 'compteNom',
        libelle: 'Compte de service',
        largeur: 12,
        classe: 'text-muted-foreground',
        valeur: (r) => r.compteNom || r.compteCode || '',
        titre: (r) => [r.compteNom, r.compteCode].filter(Boolean).join(' · ') || undefined,
        rendu: (r) => (
          <>
            <div className="truncate">{r.compteNom || r.compteCode || '—'}</div>
            {r.compteCode && r.compteCode !== r.compteNom && <div className="truncate text-micro">{r.compteCode}</div>}
          </>
        ),
      },
      {
        nom: 'statut',
        libelle: 'Statut',
        largeur: 11,
        valeur: (r) => (r.actif === false ? 'Révoquée' : 'Active'),
        rendu: (r) =>
          r.actif === false ? (
            <div className="flex flex-col items-start gap-0.5">
              <Badge tone="warning">Révoquée</Badge>
              {(r.revoqueLe || r.revoquePar) && (
                <span className="truncate text-micro text-muted-foreground">
                  {[r.revoqueLe && formatDateTime(r.revoqueLe), r.revoquePar].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          ) : (
            <Badge tone="success">Active</Badge>
          ),
      },
      {
        nom: 'dernierUsage',
        libelle: 'Dernier usage',
        largeur: 11,
        classe: 'text-muted-foreground',
        valeur: (r) => r.dernierUsage ?? '',
        rendu: (r) => (r.dernierUsage ? formatDateTime(r.dernierUsage) : <span title="Aucune requête acceptée avec cette clé">Jamais</span>),
      },
      {
        nom: 'actions',
        libelle: 'Actions',
        largeur: 16,
        rendu: (r) =>
          r.actif === false ? (
            <span className="text-micro text-muted-foreground">—</span>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Button type="button" variant="outline" size="sm" disabled={busyId === r.id} onClick={() => void regenerer(r)}>
                <RefreshCw data-icon="inline-start" /> Régénérer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={busyId === r.id}
                onClick={() => void revoquer(r)}
              >
                <Ban data-icon="inline-start" /> Révoquer
              </Button>
            </div>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerer/revoquer ne changent qu'avec busyId
    [busyId],
  );

  const nbActives = (data ?? []).filter((c) => c.actif !== false).length;

  return (
    <AdminGuard
      title="Clés d'API"
      crumbs={[{ label: 'Administration' }, { label: "Clés d'API" }]}
      icon={<Bot />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select items={STATUT_ITEMS} value={statut} onValueChange={(v) => setStatut(v as StatutFilter)}>
              <SelectTrigger className="w-45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-micro text-muted-foreground">
              Pour les clients machine (n8n, agents) — envoyée dans l'en-tête <code className="font-mono">X-Api-Key</code>. Le front, lui, reste sur le cookie.
            </p>
          </div>
          <Button type="button" onClick={() => setCreation(true)}>
            <Plus data-icon="inline-start" /> Nouvelle clé
          </Button>
        </div>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {rows.length} clé{rows.length > 1 ? 's' : ''}
              {statut === 'all' && data.length > 0 && ` · ${nbActives} active${nbActives > 1 ? 's' : ''}`}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={statut !== 'all' ? 'Aucun résultat' : 'Aucune clé'}
                message={
                  statut !== 'all'
                    ? 'Aucune clé ne correspond au filtre.'
                    : "Aucune clé d'API n'existe encore. Créez-en une pour brancher n8n ou un agent."
                }
                action={
                  statut !== 'all' ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setStatut('all')}>
                      <RotateCcw data-icon="inline-start" /> Toutes les clés
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={() => setCreation(true)}>
                      <Plus data-icon="inline-start" /> Nouvelle clé
                    </Button>
                  )
                }
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid rows={rows} colonnes={colonnes} cleOrdre="cles-api" />
              </div>
            )}
          </ResultsRegion>
        )}
      </div>

      {creation && (
        <CreerCleApiDialog
          onClose={() => setCreation(false)}
          onCreated={(resultat) => {
            // Le secret d'abord, la liste ensuite : rien ne doit s'intercaler avant la copie.
            setCreation(false);
            setSecret({ resultat, mode: 'creation' });
            void refetch();
          }}
        />
      )}
      {secret && <SecretCleApiDialog resultat={secret.resultat} mode={secret.mode} onClose={() => setSecret(null)} />}
    </AdminGuard>
  );
}
