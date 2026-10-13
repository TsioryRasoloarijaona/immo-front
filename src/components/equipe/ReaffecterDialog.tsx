import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Modal from '../Modal';
import RefSelect from '../RefSelect';
import ListeLeadsReaffecter from './ListeLeadsReaffecter';
import FicheProspectionLazy, { type FicheOuverte } from '../dashboard/FicheProspectionLazy';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { reaffecterProspections } from '../../lib/api';
import { formatDate, formatNumber } from '../../lib/format';
import { choixCommerciaux, filtreLeadsDe, ongletParDefaut, phraseReaffectation, type OngletLeads } from '../../lib/equipe';
import { useLeadsPagines } from '../../lib/useLeadsPagines';
import { useToast } from '../../lib/toastContext';
import type { CommercialEquipeDto } from '../../types';

/**
 * Leads ouverts du commercial — pré-prospections et prospections — reçus dans la période et sur le projet de
 * l'écran, les plus récents d'abord ; la sélection des deux onglets part en un seul lot (FEATURE-reaffecter-filtres.md §3).
 */
export default function ReaffecterDialog({
  source,
  commerciaux,
  dates,
  projet,
  projetLibelle,
  onClose,
  onFait,
}: Readonly<{
  source: CommercialEquipeDto;
  commerciaux: readonly CommercialEquipeDto[];
  /** Période effective de l'écran (`periodeEffective`). */
  dates: { du: string; au: string };
  projet: string | null;
  projetLibelle: string | null;
  onClose: () => void;
  onFait: () => void;
}>) {
  const toast = useToast();
  const filtre = filtreLeadsDe(source.commercialId ?? '', dates, projet);
  const pre = useLeadsPagines('pre', filtre);
  const prospections = useLeadsPagines('prospection', filtre);
  const [ongletChoisi, setOngletChoisi] = useState<OngletLeads | null>(null);
  const [selPre, setSelPre] = useState<Set<string>>(new Set());
  const [selProspections, setSelProspections] = useState<Set<string>>(new Set());
  const [commercialId, setCommercialId] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lesDeuxChargees = pre.chargee && prospections.chargee;
  const onglet = ongletChoisi
    ?? ongletParDefaut(lesDeuxChargees ? pre.total : undefined, lesDeuxChargees ? prospections.total : undefined);
  const ids = [...selPre, ...selProspections];

  async function reaffecter() {
    if (!commercialId || ids.length === 0) return;
    setBusy(true);
    setErreur(null);
    try {
      const r = await reaffecterProspections({ prospectionIds: ids, commercialId, motif: motif.trim() || null });
      toast({ texte: phraseReaffectation(r), variante: 'succes' });
      onFait();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la réaffectation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Leads de ${source.nom ?? source.code ?? '—'}`} onClose={onClose} width={680}>
      <div className="flex flex-col gap-3">
        <p className="text-micro text-muted-foreground">
          Reçues du {formatDate(dates.du)} au {formatDate(dates.au)} · {projetLibelle ?? 'Tous mes projets'}
        </p>
        <Tabs value={onglet} onValueChange={(v) => setOngletChoisi(v as OngletLeads)}>
          <TabsList className="w-full">
            <TabsTrigger value="pre">Pré-prospections ({pre.chargee ? formatNumber(pre.total) : '…'})</TabsTrigger>
            <TabsTrigger value="prospection">
              Prospections ({prospections.chargee ? formatNumber(prospections.total) : '…'})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pre">
            <ListeLeadsReaffecter
              liste={pre}
              vide="Aucune pré-prospection ouverte sur la période"
              selection={selPre}
              onSelection={setSelPre}
              onOuvrir={(id) => setFiche({ id, pre: true })}
            />
          </TabsContent>
          <TabsContent value="prospection">
            <ListeLeadsReaffecter
              liste={prospections}
              vide="Aucune prospection ouverte sur la période"
              selection={selProspections}
              onSelection={setSelProspections}
              onOuvrir={(id) => setFiche({ id, pre: false })}
            />
          </TabsContent>
        </Tabs>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField>
            <FieldLabel htmlFor="reaff-commercial">Nouveau commercial *</FieldLabel>
            <RefSelect
              id="reaff-commercial"
              value={commercialId}
              onChange={setCommercialId}
              items={choixCommerciaux(commerciaux, source.commercialId)}
              placeholder="Choisir…"
            />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reaff-motif">Motif (facultatif)</FieldLabel>
            <Input id="reaff-motif" value={motif} maxLength={120} onChange={(e) => setMotif(e.target.value)} />
          </FormField>
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void reaffecter()} disabled={busy || !commercialId || ids.length === 0}>
          <ArrowRightLeft data-icon="inline-start" /> {busy ? 'Réaffectation…' : `Réaffecter (${ids.length})`}
        </Button>
      </DialogFooter>
      <FicheProspectionLazy fiche={fiche} onClose={() => setFiche(null)} />
    </Modal>
  );
}
