import { useEffect, useState } from 'react';
import { ArrowLeft, FilePlus, Lock, Plus, Save, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ErrorState, LoadingState } from '../../ui';
import { creerAvenantLot, getAvenantLot, getBordereauLot, getLot, modifierAvenantLot, supprimerAvenantLot } from '../../../lib/apiProjet';
import { getReferentielsProjetConfig } from '../../../lib/apiProjetConfig';
import { useConfirm } from '../../../lib/confirmContext';
import { formatCurrency } from '../../../lib/format';
import {
  depuisBordereau,
  etatDepuisDetail,
  etatNeuf,
  ligneVide,
  totauxAvenant,
  versSaisie,
  type CleRetenue,
  type DefautsAvenant,
  type EtatAvenant,
} from '../../../lib/saisieAvenant';
import { useConfirmationSortie } from '../../../lib/useConfirmationSortie';
import { errorMessage, refetchAllApis, useApi } from '../../../lib/useApi';
import type { ReferentielItemDto } from '../../../types';
import type { AvenantDetailDto, BordereauDto, LigneAvenantSaisieDto, LigneBordereauDto, LotDetailDto, RetenueAvenantDto } from '../../../types/projet';
import BlocRetenuesAvenant from './BlocRetenuesAvenant';
import GrilleLignesAvenant from './GrilleLignesAvenant';
import SelecteurBordereauAvenant from './SelecteurBordereauAvenant';

interface Props {
  lotId: string;
  avenantId: string | null;
  onRetour: () => void;
  onModifie?: (modifie: boolean) => void;
}

function Champ({ libelle, children }: Readonly<{ libelle: string; children: React.ReactNode }>) {
  return (
    <label className="flex flex-col gap-0.5 text-micro text-muted-foreground">
      {libelle}
      {children}
    </label>
  );
}

function defautsDuLot(lot: LotDetailDto, bordereau: BordereauDto): DefautsAvenant {
  return {
    tauxTVA: bordereau.tvaParDefaut ?? lot.tvaDefaut,
    categorieId: bordereau.categorieParDefautId,
    taux: { garantie: lot.tauxRetenueGarantie, prorata: lot.tauxCompteProrata, assuranceDEC: lot.tauxAssuranceDEC, assuranceTRC: lot.tauxAssuranceTRC },
  };
}

function EditeurAvenant({
  lotId,
  detail,
  defauts,
  lignesBordereau,
  categories,
  onRetour,
  onModifie,
}: Readonly<{
  lotId: string;
  detail: AvenantDetailDto | null;
  defauts: DefautsAvenant;
  lignesBordereau: LigneBordereauDto[];
  categories: ReferentielItemDto[];
  onRetour: () => void;
  onModifie?: (modifie: boolean) => void;
}>) {
  const confirm = useConfirm();
  const [etat, setEtat] = useState<EtatAvenant>(() => (detail ? etatDepuisDetail(detail) : etatNeuf(defauts, new Date().toISOString().slice(0, 10))));
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [selecteur, setSelecteur] = useState(false);
  const lectureSeule = detail !== null && !detail.modifiable;
  const totaux = totauxAvenant(etat);

  useConfirmationSortie(modifie);
  useEffect(() => onModifie?.(modifie), [modifie, onModifie]);

  function muter(fn: (e: EtatAvenant) => EtatAvenant) {
    setEtat(fn);
    setModifie(true);
    setErreur(null);
  }

  const changerLigne = (id: string, patch: Partial<LigneAvenantSaisieDto>) => muter((e) => ({ ...e, lignes: e.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const changerRetenue = (cle: CleRetenue, r: RetenueAvenantDto) => muter((e) => ({ ...e, retenues: { ...e.retenues, [cle]: r } }));
  const ajouterLignes = (nouvelles: (rang: number) => LigneAvenantSaisieDto[]) => muter((e) => ({ ...e, lignes: [...e.lignes, ...nouvelles(e.lignes.length + 1)] }));

  async function retour() {
    if (modifie && !(await confirm({ title: 'Abandonner les modifications ?', message: 'Les modifications non enregistrées de cette fiche seront perdues.', confirmLabel: 'Abandonner' }))) return;
    onRetour();
  }

  async function ecrire(action: () => Promise<unknown>) {
    setEnCours(true);
    setErreur(null);
    try {
      await action();
      refetchAllApis();
      setModifie(false);
      onRetour();
    } catch (err: unknown) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(false);
    }
  }

  const enregistrer = () => ecrire(() => (detail ? modifierAvenantLot(lotId, detail.id, versSaisie(etat)) : creerAvenantLot(lotId, versSaisie(etat))));

  async function supprimer() {
    if (detail && (await confirm('Êtes-vous sûr de vouloir supprimer cet avenant ?'))) await ecrire(() => supprimerAvenantLot(lotId, detail.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void enregistrer()}>
          <Save /> Enregistrer
        </Button>
        {detail?.supprimable && (
          <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={() => void supprimer()}>
            <Trash2 /> Supprimer
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => void retour()}>
          <ArrowLeft /> Retour à la liste
        </Button>
      </BarreIcones>
      {erreur && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-body text-destructive">
          {erreur}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Champ libelle="Code">
          <Input readOnly value={detail?.code ?? ''} placeholder="Attribué à l'enregistrement" />
        </Champ>
        <Champ libelle="Description">
          <Input readOnly value={detail?.description ?? ''} />
        </Champ>
        <Champ libelle="Fournisseur">
          <Input readOnly value={detail?.fournisseur ?? ''} />
        </Champ>
        <Champ libelle="Date">
          <Input type="date" value={etat.date} onChange={(e) => muter((s) => ({ ...s, date: e.target.value }))} />
        </Champ>
        <Champ libelle="Référence interne">
          <Input value={etat.referenceInterne} onChange={(e) => muter((s) => ({ ...s, referenceInterne: e.target.value }))} />
        </Champ>
        <Champ libelle="Notes">
          <Input value={etat.notes} onChange={(e) => muter((s) => ({ ...s, notes: e.target.value }))} />
        </Champ>
      </div>
      {lectureSeule && (
        <p className="flex items-center gap-1 text-body text-muted-foreground" title="Avenant facturé : lignes et retenues non modifiables">
          <Lock className="size-3.5" aria-hidden /> Avenant facturé{detail.factureCode ? ` (${detail.factureCode})` : ''} : lignes et retenues figées.
        </p>
      )}
      <BlocRetenuesAvenant retenues={etat.retenues} ttc={totaux.ttc} parMontantAutorise={detail?.retenuesParMontantAutorisees ?? true} lectureSeule={lectureSeule} onChanger={changerRetenue} />
      {!lectureSeule && (
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => ajouterLignes((rang) => [ligneVide(rang, defauts)])}>
            <Plus /> Ajouter une ligne
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelecteur((o) => !o)}>
            <FilePlus /> Depuis le bordereau
          </Button>
        </BarreIcones>
      )}
      {selecteur && !lectureSeule && (
        <SelecteurBordereauAvenant
          lignes={lignesBordereau}
          onFermer={() => setSelecteur(false)}
          onAjouter={(choisies) => {
            ajouterLignes((rang) => choisies.map((l, i) => depuisBordereau(l, rang + i)));
            setSelecteur(false);
          }}
        />
      )}
      <GrilleLignesAvenant lignes={etat.lignes} categories={categories} lectureSeule={lectureSeule} onChanger={changerLigne} onSupprimer={(id) => muter((e) => ({ ...e, lignes: e.lignes.filter((l) => l.id !== id) }))} />
      <dl className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-body">
        {(
          [
            ['Total HT', totaux.ht],
            ['TVA', totaux.tva],
            ['Total TTC', totaux.ttc],
            ['Net à payer', totaux.net],
          ] as const
        ).map(([libelle, valeur]) => (
          <div key={libelle} className="flex gap-2">
            <dt className="text-muted-foreground">{libelle}</dt>
            <dd className="font-medium">{formatCurrency(valeur)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Fiche d'un avenant (existant ou neuf) ; remplace la liste dans le corps de la modale. */
export default function FicheAvenant({ lotId, avenantId, onRetour, onModifie }: Readonly<Props>) {
  const detail = useApi<AvenantDetailDto | null>(() => (avenantId ? getAvenantLot(lotId, avenantId) : Promise.resolve(null)), [lotId, avenantId]);
  const lot = useApi(() => getLot(lotId), [lotId]);
  const bordereau = useApi(() => getBordereauLot(lotId), [lotId]);
  const categories = useApi(getReferentielsProjetConfig, [], 'projet-config-referentiels').data?.categoriesDepense ?? [];
  const erreur = detail.error ?? lot.error ?? bordereau.error;
  if (erreur) return <ErrorState message={erreur} />;
  if (!lot.data || !bordereau.data || (avenantId && !detail.data)) return <LoadingState />;
  return (
    <EditeurAvenant
      lotId={lotId}
      detail={detail.data}
      defauts={defautsDuLot(lot.data, bordereau.data)}
      lignesBordereau={bordereau.data.lignes}
      categories={categories}
      onRetour={onRetour}
      onModifie={onModifie}
    />
  );
}
