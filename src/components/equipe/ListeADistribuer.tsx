import { useState } from 'react';
import { Send } from 'lucide-react';
import RefSelect from '../RefSelect';
import RepartirAutomatiquement from './RepartirAutomatiquement';
import FicheProspectionLazy, { type FicheOuverte } from '../dashboard/FicheProspectionLazy';
import { Button } from '../ui/button';
import { Card, EmptyState, ErrorState, LoadingState } from '../ui';
import { distribuerPreProspections, getADistribuer, getTranchesReferentiel, listPreProspections } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { basculer, bornesPeriodeEquipe, choixCommerciaux, phraseDistribution } from '../../lib/equipe';
import { formatDate, formatNumber } from '../../lib/format';
import { useToast } from '../../lib/toastContext';
import type { CommercialEquipeDto } from '../../types';

const TAILLE = 100;

/**
 * Pré-prospections sans commercial de la période et du projet de l'écran, les plus anciennes d'abord ; tout le lot
 * coché part au commercial choisi, ou rien (FEATURE-equipe-commerciale.md §10). Le parent la remonte (`key`) quand
 * la période ou le projet change, ce qui vide la sélection.
 */
export default function ListeADistribuer({
  periode,
  projet,
  commerciaux,
  onFait,
}: Readonly<{
  periode: { du: string; au: string };
  projet: string | null;
  commerciaux: readonly CommercialEquipeDto[];
  onFait: () => void;
}>) {
  const toast = useToast();
  const { dateDebut, dateFin } = bornesPeriodeEquipe(periode);
  const compte = useApi(
    () => getADistribuer({ du: periode.du || undefined, au: periode.au || undefined, projet: projet ?? undefined }),
    [periode.du, periode.au, projet],
    'equipe-a-distribuer',
  );
  // La liste des pré-prospections ne filtre que par tranche : un projet = ses tranches ; un projet sans tranche n'a rien.
  const liste = useApi(async () => {
    const tranches = projet ? (await getTranchesReferentiel(projet)).map((t) => t.id) : undefined;
    if (tranches?.length === 0) return [];
    const page = await listPreProspections(
      { ouvertes: true, dateDebut, dateFin, trancheId: tranches },
      { page: 0, size: TAILLE, sort: ['docDate,asc'] },
    );
    return page.content.filter((l) => !l.commercialId);
  }, [dateDebut, dateFin, projet], 'equipe-a-distribuer-lignes');
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lignes = liste.data ?? [];
  const toutesCochees = lignes.length > 0 && lignes.every((l) => selection.has(l.id));

  async function distribuer() {
    if (!commercialId || selection.size === 0) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await distribuerPreProspections({ preProspectionIds: [...selection], commercialId });
      toast({ texte: phraseDistribution(r), variante: 'succes' });
      setSelection(new Set());
      onFait();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la distribution.');
    } finally {
      setBusy(false);
    }
  }

  let resume = '…';
  if (compte.data) {
    resume = compte.data.nombre === 0
      ? 'Aucune en attente sur la période'
      : `${formatNumber(compte.data.nombre)} en attente · la plus ancienne depuis ${formatNumber(compte.data.agePlusAncienneJours)} j`;
  }

  return (
    <Card title="À distribuer" action={<span className="text-label text-muted-foreground">{resume}</span>}>
      <div className="flex flex-col gap-3">
        {liste.loading && !liste.data && <LoadingState />}
        {liste.error && <ErrorState message={liste.error} />}
        {!liste.error && liste.data && lignes.length === 0 && (
          <EmptyState title="Rien à distribuer" message="Toutes les pré-prospections ouvertes de la période ont déjà un commercial." />
        )}
        {lignes.length > 0 && (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-label text-foreground">
                <input
                  type="checkbox"
                  className="size-3.5"
                  checked={toutesCochees}
                  onChange={() => setSelection(toutesCochees ? new Set() : new Set(lignes.map((l) => l.id)))}
                />
                Tout cocher
              </label>
              <div className="w-full sm:ml-auto sm:w-72">
                <RefSelect
                  id="dist-commercial"
                  value={commercialId}
                  onChange={setCommercialId}
                  items={choixCommerciaux(commerciaux)}
                  placeholder="Choisir un commercial…"
                />
              </div>
              <Button type="button" onClick={() => void distribuer()} disabled={busy || !commercialId || selection.size === 0}>
                <Send data-icon="inline-start" /> {busy ? 'Distribution…' : `Distribuer (${selection.size})`}
              </Button>
              <RepartirAutomatiquement
                ids={selection.size > 0 ? [...selection] : lignes.map((l) => l.id)}
                onFait={() => {
                  setSelection(new Set());
                  onFait();
                }}
                onErreur={setErreur}
              />
            </div>
            {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
            <ul className="flex max-h-[60vh] flex-col overflow-y-auto rounded-md border border-border">
              {lignes.map((l) => {
                const nom = l.prospectNom || l.tempDescription || '—';
                return (
                  <li key={l.id} className="flex items-center gap-2.5 border-b border-border px-2.5 py-1.5 last:border-b-0 hover:bg-muted/60">
                    <input
                      type="checkbox"
                      className="size-3.5 shrink-0"
                      aria-label={`Sélectionner ${nom}`}
                      checked={selection.has(l.id)}
                      onChange={() => setSelection((s) => basculer(s, l.id))}
                    />
                    <span className="w-20 shrink-0 font-mono text-micro text-muted-foreground">{l.code}</span>
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-body font-medium text-foreground underline-offset-2 hover:underline"
                      onClick={() => setFiche({ id: l.id, pre: true })}
                    >
                      {nom}
                    </button>
                    <span className="shrink-0 text-micro text-muted-foreground">{l.trancheCode ?? 'sans tranche'}</span>
                    <span className="w-20 shrink-0 text-right text-micro text-muted-foreground">{formatDate(l.dateDocument)}</span>
                  </li>
                );
              })}
            </ul>
            {compte.data && compte.data.nombre > lignes.length && (
              <p className="text-micro text-muted-foreground">
                Les {formatNumber(lignes.length)} plus anciennes sont affichées ; distribuez-les pour voir la suite.
              </p>
            )}
          </>
        )}
      </div>
      <FicheProspectionLazy fiche={fiche} onClose={() => setFiche(null)} />
    </Card>
  );
}
