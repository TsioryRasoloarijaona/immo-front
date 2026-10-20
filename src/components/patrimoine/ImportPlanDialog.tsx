import { useState } from 'react';
import Modal from '../Modal';
import { Badge } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { importerPlanSvg } from '../../lib/apiPlans';
import { pluriel } from '../../lib/format';
import { referentielItems, useEtages } from '../../lib/referentiels';
import { errorMessage } from '../../lib/useApi';
import type { BadgeTone } from '../../types';
import type { BilanImportPlanDto, ResultatTrace } from '../../types/plans';

const RESULTATS: Record<ResultatTrace, { libelle: string; ton: BadgeTone }> = {
  AJOUTE: { libelle: 'Ajouté', ton: 'success' },
  MODIFIE: { libelle: 'Modifié', ton: 'info' },
  INCHANGE: { libelle: 'Inchangé', ton: 'neutral' },
  INTROUVABLE: { libelle: 'Introuvable', ton: 'warning' },
};

function Bilan({ bilan }: Readonly<{ bilan: BilanImportPlanDto }>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-muted-foreground">
        {bilan.apercu ? 'Aperçu : rien n\'est encore écrit. ' : 'Import terminé. '}
        {bilan.planCree ? 'Nouveau plan' : 'Plan existant mis à jour'} — {pluriel(bilan.lignes.length, 'tracé')}.
      </p>
      <Table containerClassName="max-h-80 overflow-y-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Article</TableHead>
            <TableHead>Résultat</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bilan.lignes.map((l, i) => (
            <TableRow key={`${l.code}-${i}`}>
              <TableCell className="font-mono text-micro">{l.code ?? '—'}</TableCell>
              <TableCell><Badge tone={RESULTATS[l.resultat].ton}>{RESULTATS[l.resultat].libelle}</Badge></TableCell>
              <TableCell>{l.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Import SVG d'un étage (Administrateur) : « Vérifier » (aperçu sans écriture) puis « Importer ». Messages du serveur tels quels. */
export default function ImportPlanDialog({ trancheId, onClose, onImporte }: Readonly<{
  trancheId: string;
  onClose: () => void;
  onImporte: () => void;
}>) {
  const etages = useEtages();
  const [etageId, setEtageId] = useState<string | null>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [bilan, setBilan] = useState<BilanImportPlanDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const items = referentielItems(etages.data);
  const termine = bilan !== null && !bilan.apercu;

  async function lancer(apercu: boolean) {
    if (!etageId || !fichier) return;
    setOccupe(true);
    setErreur(null);
    try {
      const resultat = await importerPlanSvg(trancheId, etageId, fichier, apercu);
      setBilan(resultat);
      if (!apercu) onImporte();
    } catch (err) {
      setBilan(null);
      setErreur(errorMessage(err));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <Modal title="Importer un plan SVG" onClose={onClose} width={720}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="plan-etage">Étage *</FieldLabel>
            <Select items={items} value={etageId} onValueChange={(v) => { setEtageId(v || null); setBilan(null); }} disabled={termine}>
              <SelectTrigger id="plan-etage" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>{items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="plan-fichier">Fichier SVG *</FieldLabel>
            <input
              id="plan-fichier"
              type="file"
              accept=".svg,image/svg+xml"
              disabled={termine}
              className="text-body file:mr-2 file:rounded-md file:border file:border-border file:bg-background file:px-2 file:py-1"
              onChange={(e) => { setFichier(e.target.files?.[0] ?? null); setBilan(null); }}
            />
          </Field>
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        {bilan && <Bilan bilan={bilan} />}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>{termine ? 'Fermer' : 'Annuler'}</Button>
        {!termine && (
          <>
            <Button type="button" variant="outline" disabled={!etageId || !fichier || occupe} onClick={() => void lancer(true)}>
              Vérifier
            </Button>
            <Button type="button" disabled={!etageId || !fichier || occupe} onClick={() => void lancer(false)}>
              {occupe ? 'Import…' : 'Importer'}
            </Button>
          </>
        )}
      </DialogFooter>
    </Modal>
  );
}
