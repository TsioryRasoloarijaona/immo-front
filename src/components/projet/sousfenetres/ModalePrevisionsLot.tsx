import { useState, type ReactNode } from 'react';
import { ChevronsLeft, ChevronsRight, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { getSaisiePrevisionsLot, putPrevisionsLot } from '../../../lib/apiProjet';
import { useConfirm } from '../../../lib/confirmContext';
import { formatCurrency, formatPercent } from '../../../lib/format';
import {
  ajouterPoint,
  avecHT,
  avecTTC,
  changerPoint,
  copierPoints,
  dureeDe,
  erreurSaisie,
  appliquerProposition,
  etatDepuisDto,
  finDe,
  retirerPoint,
  versRequete,
  type EtatSaisie,
  type OngletPrevisions,
} from '../../../lib/saisiePrevisions';
import { errorMessage, refetchAllApis, useApi } from '../../../lib/useApi';
import { cn } from '../../../lib/utils';
import type { PrevisionsLotDto, PrevisionsSaisieLotDto } from '../../../types/projet';
import BarreIcones from '../../BarreIcones';
import { ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import BoutonsAlignementModeles from './BoutonsAlignementModeles';
import GrillePointsPrevision from './GrillePointsPrevision';

type NomOnglet = 'previsions' | 'base';

const SAISIE = 'h-7 w-full rounded-sm border border-input bg-transparent px-2 text-body disabled:opacity-70';

function Champ({ libelle, children }: Readonly<{ libelle: string; children: ReactNode }>) {
  return (
    <label className="flex flex-col gap-0.5 text-micro text-muted-foreground">
      {libelle}
      {children}
    </label>
  );
}

const nombre = (v: string) => (v === '' ? null : Number(v));

function Lecture({ libelle, valeur }: Readonly<{ libelle: string; valeur: string | string[] }>) {
  return (
    <div>
      <dt className="text-micro text-muted-foreground">{libelle}</dt>
      <dd className="text-body tabular-nums">
        {typeof valeur === 'string'
          ? valeur
          : valeur.map((m, i) => (
              <span key={m + String(i)}>
                {i > 0 && ' / '}
                <span className="whitespace-nowrap">{m}</span>
              </span>
            ))}
      </dd>
    </div>
  );
}

function ChampsDates({ onglet, editable, onChanger }: Readonly<{ onglet: OngletPrevisions; editable: boolean; onChanger: (o: OngletPrevisions) => void }>) {
  return (
    <>
      <Champ libelle="Date début">
        <input type="date" disabled={!editable} className={SAISIE} value={onglet.debut} onChange={(e) => onChanger({ ...onglet, debut: e.target.value })} />
      </Champ>
      <Champ libelle="Durée (j)">
        <input type="number" min={0} disabled={!editable} className={SAISIE} value={onglet.duree ?? ''} onChange={(e) => onChanger({ ...onglet, duree: nombre(e.target.value) })} />
      </Champ>
      <Champ libelle="Date fin">
        <input
          type="date"
          disabled={!editable}
          className={SAISIE}
          value={finDe(onglet.debut, onglet.duree)}
          onChange={(e) => onChanger({ ...onglet, duree: dureeDe(onglet.debut, e.target.value) })}
        />
      </Champ>
    </>
  );
}

function ChampsBase({ etat, taux, editable, onChanger }: Readonly<{ etat: EtatSaisie; taux: number; editable: boolean; onChanger: (e: EtatSaisie) => void }>) {
  return (
    <>
      <Champ libelle="Est. de base HT">
        <input type="number" step="any" disabled={!editable} className={SAISIE} value={etat.ht ?? ''} onChange={(e) => onChanger(avecHT(etat, nombre(e.target.value), taux))} />
      </Champ>
      <Champ libelle="TVA">
        <input type="text" disabled className={SAISIE} value={formatCurrency(etat.tva)} readOnly />
      </Champ>
      <Champ libelle="Est. de base TTC">
        <input type="number" step="any" disabled={!editable} className={SAISIE} value={etat.ttc ?? ''} onChange={(e) => onChanger(avecTTC(etat, nombre(e.target.value), taux))} />
      </Champ>
    </>
  );
}

function Saisie({ saisie, onModifie, onEnregistre, onAnnuler }: Readonly<{ saisie: PrevisionsSaisieLotDto; onModifie: () => void; onEnregistre: (d: PrevisionsLotDto) => void; onAnnuler: () => void }>) {
  const [etat, setEtat] = useState(() => etatDepuisDto(saisie));
  const [onglet, setOnglet] = useState<NomOnglet>('previsions');
  const [selection, setSelection] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [dirty, setDirty] = useState(false);
  const baseEditable = saisie.estimationDeBaseModifiable;
  const actif = onglet === 'base';
  const taux = saisie.tvaParDefaut ?? 0;

  function maj(neuf: EtatSaisie) {
    setEtat(neuf);
    setDirty(true);
    setErreur(null);
    onModifie();
  }
  const majOnglet = (fn: (o: OngletPrevisions) => OngletPrevisions) => maj({ ...etat, [onglet]: fn(etat[onglet]) });
  const ongletEdite = actif ? !baseEditable : false;

  function ajouter() {
    const { onglet: neuf, cle } = ajouterPoint(etat[onglet]);
    maj({ ...etat, [onglet]: neuf });
    setSelection(cle);
  }

  function copier(de: NomOnglet, vers: NomOnglet) {
    maj({ ...etat, [vers]: copierPoints(etat[de], etat[vers]) });
  }

  async function enregistrer() {
    const refus = erreurSaisie(etat);
    if (refus) {
      setErreur(refus);
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      onEnregistre(await putPrevisionsLot(saisie.lotId, versRequete(etat)));
      refetchAllApis();
    } catch (err: unknown) {
      setErreur(errorMessage(err));
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 lg:grid-cols-[auto_auto_auto_1fr]">
        <Lecture libelle="Description" valeur={saisie.description ?? '—'} />
        <Lecture libelle="Avancement réel" valeur={formatPercent(saisie.avancementReel)} />
        <Lecture libelle="Estimation confidentielle HT / TTC" valeur={[formatCurrency(saisie.estimationConfidentielleHT), formatCurrency(saisie.estimationConfidentielleTTC)]} />
        <Lecture libelle="Marché HT / TVA / TTC" valeur={[formatCurrency(saisie.marcheHT), formatCurrency(saisie.marcheTVA), formatCurrency(saisie.marcheTTC)]} />
      </dl>
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={ongletEdite} onClick={ajouter}>
          <Plus /> Ajouter un point
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={ongletEdite || !selection} onClick={() => {
            if (!selection) return;
            majOnglet((o) => retirerPoint(o, selection));
            setSelection(null);
          }}>
          <Trash2 /> Supprimer le point
        </Button>
        {baseEditable && (
          <Button type="button" variant="ghost" size="sm" onClick={() => copier('previsions', 'base')}>
            <ChevronsRight /> Copier prévisions → est. de base
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => copier('base', 'previsions')}>
          <ChevronsLeft /> Copier est. de base → prévisions
        </Button>
        {saisie.modifiable && (
          <BoutonsAlignementModeles
            lotId={saisie.lotId}
            modifie={dirty}
            grilleVide={etat.previsions.points.length === 0}
            onErreur={setErreur}
            onProposition={(p) => {
              maj(appliquerProposition(etat, p));
              setOnglet('previsions');
            }}
          />
        )}
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void enregistrer()}>
          <Save /> Enregistrer
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={onAnnuler}>
          <Undo2 /> Annuler
        </Button>
      </BarreIcones>
      {erreur && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-body text-destructive">
          {erreur}
        </div>
      )}
      <div role="tablist" className="flex gap-1 border-b">
        {(['previsions', 'base'] as const).map((n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={onglet === n}
            onClick={() => setOnglet(n)}
            className={cn('px-3 py-1.5 text-body', onglet === n ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground')}
          >
            {n === 'previsions' ? 'Prévisions' : 'Prévisions est. de base'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ChampsDates onglet={etat[onglet]} editable={!ongletEdite} onChanger={(o) => maj({ ...etat, [onglet]: o })} />
        {actif && <ChampsBase etat={etat} taux={taux} editable={baseEditable} onChanger={maj} />}
      </div>
      <GrillePointsPrevision
        points={etat[onglet].points}
        prix={actif ? etat.ttc : saisie.prixPrevisions}
        editable={!ongletEdite}
        selection={selection}
        onSelection={setSelection}
        onChanger={(cle, patch) => majOnglet((o) => changerPoint(o, cle, patch))}
      />
    </div>
  );
}

/** Saisie des prévisions d'un lot : fermeture confirmée tant que des modifications ne sont pas enregistrées. */
export default function ModalePrevisionsLot({ lotId, onFermer, onEnregistre }: Readonly<{ lotId: string; onFermer: () => void; onEnregistre: (d: PrevisionsLotDto) => void }>) {
  const confirm = useConfirm();
  const { data, loading, error } = useApi(() => getSaisiePrevisionsLot(lotId), [lotId]);
  const [modifie, setModifie] = useState(false);

  async function demanderFermeture() {
    if (!modifie || (await confirm({ title: 'Abandonner les modifications ?', message: 'Les modifications non enregistrées de cette fiche seront perdues.', confirmLabel: 'Abandonner' }))) {
      onFermer();
    }
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && void demanderFermeture()}>
      <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Modifier les prévisions</DialogTitle>
          <DialogDescription>Dates, durées et avancements prévus du lot.</DialogDescription>
        </DialogHeader>
        {error && <ErrorState message={error} />}
        {!error && !data && loading && <LoadingState />}
        {!error && data && <Saisie saisie={data} onModifie={() => setModifie(true)} onEnregistre={onEnregistre} onAnnuler={() => void demanderFermeture()} />}
      </DialogContent>
    </Dialog>
  );
}
