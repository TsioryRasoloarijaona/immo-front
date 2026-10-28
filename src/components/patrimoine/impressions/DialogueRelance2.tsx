import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import Modal from '../../Modal';
import LienFiche from '../../LienFiche';
import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { ouvrirBlobDansOnglet } from '../../../lib/api';
import { getApercuRelance2, lettresRelance2, STATUTS_RELANCE_2 } from '../../../lib/apiImpressionsTranche';
import { canonicalStatusLabel } from '../../../lib/dossierStatus';
import { formatCurrency, formatDate, pluriel } from '../../../lib/format';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { ApercuRelance2Dto } from '../../../types/impressionsTranche';

const LIBELLES_STATUT: Record<string, string> = {
  CONCRETISATION: 'Concrétisation',
  MEILLEURTAUX: 'Meilleur taux',
  'ENVOI AU NOTAIRE': 'Envoi au notaire',
  'CREDIT EN COURS': 'Crédit en cours',
  'CREDIT ACCORDE': 'Crédit accordé',
};

const libelleStatut = (code: string | null) => (code ? LIBELLES_STATUT[code] : undefined) ?? canonicalStatusLabel(code);

function Lignes({ data }: Readonly<{ data: ApercuRelance2Dto }>) {
  return (
    <Table containerClassName="max-h-72 overflow-y-auto">
      <TableHeader>
        <TableRow>
          <TableHead>Dossier</TableHead>
          <TableHead>Article</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Acquéreur</TableHead>
          <TableHead>Co-acquéreur</TableHead>
          <TableHead className="text-right">Prix</TableHead>
          <TableHead className="text-right">Réglé</TableHead>
          <TableHead className="text-right">Reste</TableHead>
          <TableHead>Relance 2</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.lignes.map((l) => (
          <TableRow key={`${l.dossierId}-${l.acquereur ?? ''}-${l.estCoAcquereur}`}>
            <TableCell><LienFiche cible={{ type: 'dossier', id: l.dossierId }} className="font-mono text-micro hover:underline">{l.codeDossier ?? '—'}</LienFiche></TableCell>
            <TableCell>{l.article ?? '—'}</TableCell>
            <TableCell>{libelleStatut(l.statut)}</TableCell>
            <TableCell>{l.acquereur ?? '—'}</TableCell>
            <TableCell>{l.estCoAcquereur ? 'Oui' : 'Non'}</TableCell>
            <TableCell className="text-right">{formatCurrency(l.prixVente)}</TableCell>
            <TableCell className="text-right">{formatCurrency(l.prixRegle)}</TableCell>
            <TableCell className="text-right">{formatCurrency(l.reste)}</TableCell>
            <TableCell>{formatDate(l.dateRelance2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Ecartes({ data }: Readonly<{ data: ApercuRelance2Dto }>) {
  if (data.ecartes.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-label font-medium text-foreground">Écartés (reste ≤ 0)</h3>
      <p className="text-label text-muted-foreground">Aucune lettre : le reste à payer est nul ou négatif</p>
      <ul className="text-label">
        {data.ecartes.map((e) => (
          <li key={e.dossierId} className="flex flex-wrap gap-x-3">
            <LienFiche cible={{ type: 'dossier', id: e.dossierId }} className="font-mono text-micro hover:underline">{e.codeDossier ?? '—'}</LienFiche>
            <span>{e.article ?? '—'}</span>
            <span>{e.client ?? '—'}</span>
            <span>{libelleStatut(e.statut)}</span>
            <span>Reste {formatCurrency(e.reste)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Apercu({ trancheId, statuts, onClose }: Readonly<{ trancheId: string; statuts: string[]; onClose: () => void }>) {
  const { data, error } = useApi(() => getApercuRelance2(trancheId, statuts), [trancheId, statuts.join('|')]);
  const [erreurPdf, setErreurPdf] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  function imprimer() {
    setErreurPdf(null);
    setOccupe(true);
    ouvrirBlobDansOnglet(() => lettresRelance2(trancheId, statuts))
      .catch((err: unknown) => setErreurPdf(errorMessage(err)))
      .finally(() => setOccupe(false));
  }

  const vide = data?.dossiers === 0;
  return (
    <>
      <div className="flex flex-col gap-3">
        {error && <ErrorState message={error} />}
        {!error && !data && <LoadingState />}
        {!error && vide && <EmptyState title="Aucun dossier de la tranche n'a un statut à relancer." />}
        {!error && data && !vide && (
          <>
            <p className="text-label text-muted-foreground">
              {pluriel(data.dossiers, 'dossier')}, {pluriel(data.lettres, 'lettre')}
            </p>
            {data.lignes.length > 0 && <Lignes data={data} />}
            <Ecartes data={data} />
          </>
        )}
        {!error && data && !data.modeleActif && (
          <p role="status" className="text-label text-foreground">
            Texte livré par défaut utilisé — personnalisable dans <Link to="/modeles-documents" className="underline">Modèles de documents</Link>
          </p>
        )}
        {erreurPdf && <p role="alert" className="text-label text-destructive">{erreurPdf}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
        <Button type="button" disabled={occupe || !data || data.lettres === 0} onClick={imprimer}>
          <Printer data-icon="inline-start" /> Imprimer
        </Button>
      </DialogFooter>
    </>
  );
}

/** « Relance 2 par statut » (Administrateur, Direction Générale) : aperçu en lecture seule puis lettres en PDF. */
export default function DialogueRelance2({ trancheId, onClose }: Readonly<{ trancheId: string; onClose: () => void }>) {
  const [statuts, setStatuts] = useState<string[]>([...STATUTS_RELANCE_2]);

  const basculer = (code: string) => setStatuts((cur) => (
    cur.includes(code) ? cur.filter((c) => c !== code) : STATUTS_RELANCE_2.filter((c) => c === code || cur.includes(c))
  ));

  return (
    <Modal title="Relance 2 par statut" onClose={onClose} width={960}>
      <fieldset className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        <legend className="mb-1 text-label text-muted-foreground">Statuts à relancer</legend>
        {STATUTS_RELANCE_2.map((code) => (
          <label key={code} className="flex items-center gap-1.5 text-body">
            <input type="checkbox" checked={statuts.includes(code)} onChange={() => basculer(code)} />
            {libelleStatut(code)}
          </label>
        ))}
      </fieldset>
      {statuts.length === 0 ? (
        <>
          <EmptyState title="Cochez au moins un statut." />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </>
      ) : (
        <Apercu key={statuts.join('|')} trancheId={trancheId} statuts={statuts} onClose={onClose} />
      )}
    </Modal>
  );
}
