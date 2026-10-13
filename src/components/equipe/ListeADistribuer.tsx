import { useState } from 'react';
import { Send } from 'lucide-react';
import RefSelect from '../RefSelect';
import RepartirAutomatiquement, { type CibleRepartition } from './RepartirAutomatiquement';
import LignesADistribuer from './LignesADistribuer';
import EnteteADistribuer from './EnteteADistribuer';
import FicheProspectionLazy, { type FicheOuverte } from '../dashboard/FicheProspectionLazy';
import { Button } from '../ui/button';
import { Card, EmptyState, ErrorState, LoadingState } from '../ui';
import { distribuerPreProspections, getADistribuer, listADistribuer } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { basculer, choixCommerciaux, periodeEffective, phraseDistribution, resumeADistribuer } from '../../lib/equipe';
import { useToast } from '../../lib/toastContext';
import type { CommercialEquipeDto, FiltreADistribuer } from '../../types';

const TAILLE = 100;

/**
 * Pré-prospections sans commercial de la période et du projet de l'écran — par défaut jamais traitées, toutes avec
 * « Voir tout » — les plus anciennes d'abord (FEATURE-a-distribuer-jamais-traitees.md §4). Compteur, liste et
 * répartition par filtre partagent le même filtre ; le parent remonte la carte (`key`) quand période ou projet change.
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
  // Recalées sur la période du haut par le remontage (`key`) de la carte ; modifiables ensuite ici seulement.
  const datesEcran = periodeEffective(periode);
  const [dates, setDates] = useState(datesEcran);
  const [toutes, setToutes] = useState(false);
  const [pages, setPages] = useState(1);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const filtre: FiltreADistribuer = { du: dates.du, au: dates.au, projet: projet ?? undefined, toutes };
  const deps = [dates.du, dates.au, projet, toutes];
  const compte = useApi(() => getADistribuer(filtre), deps, 'equipe-a-distribuer');
  const liste = useApi(async () => {
    const lues = await Promise.all(
      Array.from({ length: pages }, (_, page) => listADistribuer(filtre, { page, size: TAILLE })),
    );
    return { lignes: lues.flatMap((p) => p.content), total: lues[0]?.totalElements ?? 0 };
  }, [...deps, pages], 'equipe-a-distribuer-lignes');

  const lignes = liste.data?.lignes ?? [];
  const toutesCochees = lignes.length > 0 && lignes.every((l) => selection.has(l.id));
  const cible: CibleRepartition = selection.size > 0
    ? { ids: [...selection], nombre: selection.size }
    : { filtre, nombre: compte.data?.nombre ?? 0 };

  /** Tout changement de filtre recharge depuis la première page et vide la sélection. */
  function nouveauFiltre() {
    setPages(1);
    setSelection(new Set());
  }

  function apresEcriture() {
    setSelection(new Set());
    onFait();
  }

  async function distribuer() {
    if (!commercialId || selection.size === 0) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await distribuerPreProspections({ preProspectionIds: [...selection], commercialId });
      toast({ texte: phraseDistribution(r), variante: 'succes' });
      apresEcriture();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la distribution.');
    } finally {
      setBusy(false);
    }
  }

  const entete = (
    <EnteteADistribuer
      resume={resumeADistribuer(compte.data, toutes)}
      dates={dates}
      datesEcran={datesEcran}
      onDates={(d) => {
        setDates(d);
        nouveauFiltre();
      }}
      toutes={toutes}
      onToutes={() => {
        setToutes((t) => !t);
        nouveauFiltre();
      }}
    />
  );

  return (
    <Card title="À distribuer" action={entete}>
      <div className="flex flex-col gap-3">
        {liste.loading && !liste.data && <LoadingState />}
        {liste.error && <ErrorState message={liste.error} />}
        {!liste.error && liste.data && lignes.length === 0 && (
          <EmptyState
            title="Rien à distribuer"
            message={toutes
              ? 'Toutes les pré-prospections ouvertes de la période ont déjà un commercial.'
              : 'Aucune pré-prospection jamais traitée à distribuer sur la période.'}
          />
        )}
        {!liste.error && liste.data && lignes.length > 0 && (
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
              <RepartirAutomatiquement cible={cible} onFait={apresEcriture} onErreur={setErreur} />
            </div>
            {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
            <LignesADistribuer
              lignes={lignes}
              selection={selection}
              onBasculer={(id) => setSelection((s) => basculer(s, id))}
              onOuvrir={(id) => setFiche({ id, pre: true })}
            />
            {liste.data.total > lignes.length && (
              <Button
                type="button"
                variant="outline"
                className="self-center"
                disabled={liste.loading}
                onClick={() => setPages((p) => p + 1)}
              >
                {liste.loading ? 'Chargement…' : 'Afficher plus'}
              </Button>
            )}
          </>
        )}
      </div>
      <FicheProspectionLazy fiche={fiche} onClose={() => setFiche(null)} />
    </Card>
  );
}
