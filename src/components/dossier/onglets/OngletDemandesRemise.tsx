import { useState } from 'react';
import { Send, X } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { FieldGroup } from '../../ui/field';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Textarea } from '../../ui/textarea';
import { annulerDemandeRemise, demanderRemise, listerDemandesRemiseDossier } from '../../../lib/apiRemise';
import { useAuth } from '../../../lib/auth';
import { formatDate, formatPercentValue } from '../../../lib/format';
import { estAgence } from '../../../lib/roles';
import { useApi } from '../../../lib/useApi';
import { useEcriture } from '../../../lib/useEcriture';
import type { BadgeTone } from '../../../types';
import type { DemandeRemiseDto, StatutDemandeRemise } from '../../../types/remise';
import Champ from '../echeancier/Champ';

const STATUTS: Record<StatutDemandeRemise, { libelle: string; tone: BadgeTone }> = {
  EN_ATTENTE: { libelle: 'En attente', tone: 'amber' },
  ACCEPTEE: { libelle: 'Acceptée', tone: 'success' },
  REFUSEE: { libelle: 'Refusée', tone: 'warning' },
  ANNULEE: { libelle: 'Annulée', tone: 'neutral' },
};

function Formulaire({ tauxActuel, bloque, occupe, onEnvoyer }: Readonly<{
  tauxActuel: number | undefined;
  bloque: boolean;
  occupe: boolean;
  onEnvoyer: (taux: number, motif: string) => Promise<boolean>;
}>) {
  const [taux, setTaux] = useState('');
  const [motif, setMotif] = useState('');
  const valeur = Number(taux.replace(',', '.'));
  const valide = taux.trim() !== '' && valeur > 0 && valeur <= 100 && motif.trim() !== '';

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onEnvoyer(valeur, motif.trim()).then((ok) => {
          if (ok) { setTaux(''); setMotif(''); }
        });
      }}
    >
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[14rem_minmax(0,1fr)]">
          <Champ id="remise-taux" libelle="Taux de remise total demandé (%)">
            <Input id="remise-taux" inputMode="decimal" value={taux} onChange={(e) => setTaux(e.target.value)} />
            <span className="text-micro text-muted-foreground">Taux actuel : {formatPercentValue(tauxActuel)}</span>
          </Champ>
          <Champ id="remise-motif" libelle="Motif">
            <Textarea id="remise-motif" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Champ>
        </div>
      </FieldGroup>
      <BarreIcones className="flex items-center justify-end gap-1">
        <Button type="submit" variant="outline" size="sm" disabled={!valide || bloque || occupe}>
          <Send /> Envoyer la demande
        </Button>
      </BarreIcones>
      {bloque && <p className="text-micro text-muted-foreground">Une demande est déjà en attente de décision.</p>}
    </form>
  );
}

function Historique({ lignes, lecture, occupe, onAnnuler }: Readonly<{
  lignes: DemandeRemiseDto[];
  lecture: boolean;
  occupe: boolean;
  onAnnuler: (d: DemandeRemiseDto) => void;
}>) {
  if (lignes.length === 0) return <EmptyState title="Aucune demande de remise" />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Taux demandé</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Taux accordé</TableHead>
          <TableHead>Motif du refus</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {lignes.map((l) => (
          <TableRow key={l.id}>
            <TableCell>{formatDate(l.demandeLe)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPercentValue(l.tauxDemande)}</TableCell>
            <TableCell className="max-w-64 truncate" title={l.motif}>{l.motif}</TableCell>
            <TableCell><Badge tone={STATUTS[l.statut].tone}>{STATUTS[l.statut].libelle}</Badge></TableCell>
            <TableCell className="text-right tabular-nums">{l.tauxAccorde == null ? '—' : formatPercentValue(l.tauxAccorde)}</TableCell>
            <TableCell className="max-w-64 truncate" title={l.motifRefus ?? undefined}>{l.motifRefus ?? '—'}</TableCell>
            <TableCell className="text-right">
              {!lecture && l.statut === 'EN_ATTENTE' && (
                <BarreIcones className="flex items-center justify-end gap-1">
                  <Button type="button" variant="ghost" size="sm" disabled={occupe} onClick={() => onAnnuler(l)}>
                    <X /> Annuler la demande
                  </Button>
                </BarreIcones>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Onglet Demandes de remise : l'agence demande et annule ; le siège lit l'historique (il modifie la remise par le prix). */
export default function OngletDemandesRemise({ dossierId, tauxActuel }: Readonly<{ dossierId: string; tauxActuel: number | undefined }>) {
  const demandes = useApi(() => listerDemandesRemiseDossier(dossierId), [dossierId], 'dossier-demandes-remise');
  const agence = estAgence(useAuth().user);
  const { occupe, executer } = useEcriture();
  const lignes = demandes.data ?? [];

  const envoyer = (taux: number, motif: string) =>
    executer(async () => { await demanderRemise(dossierId, { taux, motif }); await demandes.refetch(); }, 'Demande de remise envoyée.');
  const annuler = (d: DemandeRemiseDto) =>
    void executer(async () => { await annulerDemandeRemise(d.id); await demandes.refetch(); }, 'Demande annulée.');

  return (
    <div className="flex flex-col gap-3 p-3">
      {agence && (
        <Formulaire tauxActuel={tauxActuel} bloque={lignes.some((l) => l.statut === 'EN_ATTENTE')} occupe={occupe} onEnvoyer={envoyer} />
      )}
      {demandes.loading && !demandes.data && <LoadingState />}
      {demandes.error && <ErrorState message={demandes.error} />}
      {!demandes.error && demandes.data && <Historique lignes={lignes} lecture={!agence} occupe={occupe} onAnnuler={annuler} />}
    </div>
  );
}
