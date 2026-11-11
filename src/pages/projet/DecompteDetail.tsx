import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageShell from '../../components/PageShell';
import BarreActionsDecompte, { type ActionDecompte } from '../../components/projet/BarreActionsDecompte';
import DialogueRecalculDecompte from '../../components/projet/DialogueRecalculDecompte';
import FormulaireRetenuesDecompte from '../../components/projet/FormulaireRetenuesDecompte';
import { Badge, Card, Field, FieldGrid } from '../../components/ui';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import {
  definirDernierDecompte,
  enregistrerDecompte,
  getDecompte,
  getLignesRechargeesDecompte,
  recalculerDecompte,
  supprimerDecompte,
} from '../../lib/apiProjet';
import { useConfirm } from '../../lib/confirmContext';
import { formatCurrency, formatDate } from '../../lib/format';
import { demandeDepuis, lignesSaisies, saisieDepuis, type SaisieDecompte } from '../../lib/saisieDecompte';
import type { DecompteDetailDto } from '../../types/projet';
import { BadgeStatut, EtatFiche } from './commun';
import { useFiche } from './hooks';
import { TablesDecompte } from './TablesDecompte';

const AVANT_NET: [string, (d: DecompteDetailDto) => number | null][] = [
  ['Montant HT', (d) => d.montantHT],
  ['TVA', (d) => d.montantTVA],
  ['Montant TTC', (d) => d.montantTTC],
  ['Travaux supplémentaires', (d) => d.travauxSupplementaires],
  ['Retenue de garantie', (d) => d.retenueGarantie],
  ['Avance amortie', (d) => d.avanceAmortie],
  ['Avance sur décompte', (d) => d.avanceSurDecompte],
  ['Compte prorata', (d) => d.compteProrata],
  ['Assurance DEC', (d) => d.assuranceDEC],
  ['Assurance TRC', (d) => d.assuranceTRC],
  ['Retenues non remboursables', (d) => d.retenuesNonRemboursables],
  ['Retenues remboursables', (d) => d.retenuesRemboursables],
  ['Fluctuations', (d) => d.fluctuations],
];

const APRES_NET: [string, (d: DecompteDetailDto) => number | null][] = [
  ['Cumul TTC', (d) => d.cumulTTC],
  ['Cumul net de retenue de garantie', (d) => d.cumulNetRetenueGarantie],
];

function Ligne({ libelle, valeur, fort }: Readonly<{ libelle: string; valeur: number | null; fort?: boolean }>) {
  return (
    <TableRow className={fort ? 'font-semibold' : undefined}>
      <TableCell>{libelle}</TableCell>
      <TableCell className="text-right">{formatCurrency(valeur)}</TableCell>
    </TableRow>
  );
}

function Montants({ d }: Readonly<{ d: DecompteDetailDto }>) {
  return (
    <Card title="Montants" padded={false}>
      <Table>
        <TableBody>
          {AVANT_NET.map(([libelle, valeur]) => (
            <Ligne key={libelle} libelle={libelle} valeur={valeur(d)} />
          ))}
          <Ligne libelle="Net à payer" valeur={d.netAPayer} fort />
          <Ligne libelle="Net recalculé (Arpent)" valeur={d.netAPayerRecalcule} />
          {APRES_NET.map(([libelle, valeur]) => (
            <Ligne key={libelle} libelle={libelle} valeur={valeur(d)} />
          ))}
        </TableBody>
      </Table>
      {d.ecartSignificatif && (
        <div role="alert" className="m-3 flex items-center gap-2 rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
          <AlertTriangle aria-hidden className="size-4 shrink-0" />
          Écart avec OMRAN : {formatCurrency(d.ecartNetAPayer)}
        </div>
      )}
    </Card>
  );
}

function CarteFacture({ d }: Readonly<{ d: DecompteDetailDto }>) {
  const f = d.facture;
  return (
    <Card title="Facture">
      {f ? (
        <FieldGrid>
          <Field label="Code" value={<Link className="underline" to={`/projet/depenses/factures/${f.id}`}>{f.code}</Link>} />
          <Field label="Statut" value={<BadgeStatut libelle={f.statutDescription ?? f.statutCode} />} />
          <Field label="Date" value={formatDate(f.dateDocument)} />
          <Field label="Échéance" value={formatDate(f.dateEcheance)} />
          <Field label="Montant HT" value={formatCurrency(f.montantHT)} />
          <Field label="Montant TTC" value={formatCurrency(f.montantTTC)} />
          <Field label="Montant à payer" value={formatCurrency(f.montantAPayer)} />
          <Field label="Régularisation" value={formatCurrency(f.regularisation)} />
          <Field label="Réglé" value={formatCurrency(d.montantRegle)} />
          <Field label="Reste à régler" value={formatCurrency(d.resteARegler)} />
        </FieldGrid>
      ) : (
        <p className="text-body text-muted-foreground">Décompte non facturé</p>
      )}
    </Card>
  );
}

function Document({ d, saisie, lectureSeule, onChange }: Readonly<{ d: DecompteDetailDto; saisie: SaisieDecompte; lectureSeule: boolean; onChange: (patch: Partial<SaisieDecompte>) => void }>) {
  return (
    <Card title="Document">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-body">
          Date
          <Input type="date" aria-label="Date" className="w-40" value={saisie.dateDocument} disabled={lectureSeule} onChange={(e) => onChange({ dateDocument: e.target.value })} />
        </div>
        <div className="flex items-center justify-between gap-3 text-body">
          Réf. interne
          <Input aria-label="Réf. interne" className="w-56" value={saisie.referenceInterne} disabled={lectureSeule} onChange={(e) => onChange({ referenceInterne: e.target.value })} />
        </div>
        <div className="flex items-start justify-between gap-3 text-body">
          Note
          <Textarea aria-label="Note" className="w-56" value={saisie.notes} disabled={lectureSeule} onChange={(e) => onChange({ notes: e.target.value })} />
        </div>
        <FieldGrid>
          <Field label="Tiers" value={d.fournisseurNom} />
          <Field label="Travaux du mois" value={formatCurrency(d.montantTTC)} />
          <Field label="Cumul précédent" value={formatCurrency(d.cumulPrecedentTTC)} />
        </FieldGrid>
      </div>
    </Card>
  );
}

function Fiche({ initial }: Readonly<{ initial: DecompteDetailDto }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const [d, setD] = useState(initial);
  const [saisie, setSaisie] = useState(() => saisieDepuis(initial));
  const [lignes, setLignes] = useState(() => lignesSaisies(initial.lignes));
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [dialogue, setDialogue] = useState(false);
  const lectureSeule = !d.peutModifier;

  function appliquer(x: DecompteDetailDto) {
    setD(x);
    setSaisie(saisieDepuis(x));
    setLignes(lignesSaisies(x.lignes));
  }

  // 400 et 409 : le `detail` du serveur est le message de l'erreur.
  async function executer(travail: () => Promise<void>) {
    setOccupe(true);
    setErreur(null);
    setInfo(null);
    try {
      await travail();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'L’opération a échoué.');
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer() {
    const ok = await confirmer({ title: 'Supprimer le décompte', message: `Supprimer le décompte ${d.code ?? ''} ? Cette action est définitive.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    await executer(async () => {
      await supprimerDecompte(d.id);
      void navigate('/projet/decomptes');
    });
  }

  function agir(action: ActionDecompte) {
    if (action === 'enregistrer') void executer(async () => appliquer(await enregistrerDecompte(d.id, demandeDepuis(saisie, lignes))));
    if (action === 'dernier') void executer(async () => appliquer(await definirDernierDecompte(d.id)));
    if (action === 'recalculer') void executer(async () => appliquer(await recalculerDecompte(d.id)));
    if (action === 'lignes') setDialogue(true);
    if (action === 'supprimer') void supprimer();
  }

  function rechargerLignes(date: string) {
    void executer(async () => {
      setLignes(lignesSaisies(await getLignesRechargeesDecompte(d.id, date)));
      setDialogue(false);
      setInfo('Aperçu des lignes rechargé : les quantités saisies sont effacées. Enregistrez pour l’appliquer.');
    });
  }

  const totaux = (
    <>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Montants d={d} />
        <div className="flex flex-col gap-3">
          <Document d={d} saisie={saisie} lectureSeule={lectureSeule} onChange={(p) => setSaisie((s) => ({ ...s, ...p }))} />
          <CarteFacture d={d} />
        </div>
      </div>
      <FormulaireRetenuesDecompte
        saisie={saisie}
        lectureSeule={lectureSeule}
        onNombre={(cle, valeur) => setSaisie((s) => ({ ...s, nombres: { ...s.nombres, [cle]: valeur } }))}
        onCase={(cle, valeur) => setSaisie((s) => ({ ...s, cases: { ...s.cases, [cle]: valeur } }))}
      />
      <Card title="Informations">
        <FieldGrid>
          <Field label="Créé le" value={formatDate(d.dateCreation)} />
          <Field label="Créé par" value={d.creePar} />
          <Field label="Modifié le" value={formatDate(d.dateModification)} />
          <Field label="Modifié par" value={d.modifiePar} />
        </FieldGrid>
      </Card>
    </>
  );

  return (
    <PageShell
      title={`Décompte ${d.code ?? ''}`}
      crumbs={[{ label: 'Décomptes', to: '/projet/decomptes' }, { label: d.code ?? '…' }]}
      actions={<BarreActionsDecompte d={d} occupe={occupe} onAction={agir} />}
      entete={
        <>
          <span className="text-body text-muted-foreground">Décompte n° {d.numero ?? '—'} · {formatDate(d.dateDocument)}</span>
          <Link className="text-body underline" to={`/projet/lots/${d.lotId}`}>
            Lot {d.lotCode ?? d.lotDescription ?? ''}
          </Link>
          <span className="text-body text-muted-foreground">{[d.projetCode, d.fournisseurNom].filter(Boolean).join(' · ')}</span>
          {d.dernier && <Badge tone="info">Dernier décompte</Badge>}
          {d.verrouille && <Badge tone="warning">Verrouillé{d.motifVerrou ? ` : ${d.motifVerrou}` : ''}</Badge>}
        </>
      }
    >
      <div className="flex flex-col gap-3 p-4 md:px-7">
        {erreur && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
            <AlertTriangle aria-hidden className="size-4 shrink-0" />
            {erreur}
          </div>
        )}
        {info && <div role="status" className="rounded-md border border-border bg-muted px-3 py-2 text-body">{info}</div>}
        <TablesDecompte
          totaux={totaux}
          reglements={d.reglements}
          lignes={lignes}
          approvisionnements={d.approvisionnements}
          extras={d.extras}
          retenues={d.retenues}
          lectureSeule={lectureSeule}
          onQuantite={(id, quantite) => setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, quantiteSaisie: quantite } : l)))}
        />
      </div>
      {dialogue && <DialogueRecalculDecompte
          titre="Recharger les lignes jusqu’à la date"
          description="Les lignes sont recalculées à partir du bordereau et les quantités saisies sont effacées. Rien n’est enregistré tant que vous n’avez pas enregistré le décompte."
          confirmation="Recharger les lignes"
          dateInitiale={d.dateDocument ?? ''} enCours={occupe} onAnnuler={() => setDialogue(false)} onConfirmer={rechargerLignes} />}
    </PageShell>
  );
}

export default function DecompteDetail() {
  const { id = '' } = useParams();
  const etat = useFiche(() => getDecompte(id), id);
  if (etat.data) return <Fiche key={id} initial={etat.data} />;
  return (
    <PageShell key={id} title="Décompte" crumbs={[{ label: 'Décomptes', to: '/projet/decomptes' }, { label: '…' }]}>
      <EtatFiche etat={etat}>{() => null}</EtatFiche>
    </PageShell>
  );
}
