import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ErrorState, LoadingState } from '../../ui';
import { creerReceptionLot, getReceptionLot, modifierReceptionLot, supprimerReceptionLot } from '../../../lib/apiProjet';
import { listTiers } from '../../../lib/apiAdministration';
import { useConfirm } from '../../../lib/confirmContext';
import { useConfirmationSortie } from '../../../lib/useConfirmationSortie';
import { errorMessage, refetchAllApis, useApi, useDebouncedValue } from '../../../lib/useApi';
import type { FamilleTiers } from '../../../types/administration';
import type { ReceptionDetailDto, ReceptionSaisieDto, RemboursementsLotDto } from '../../../types/projet';

const CHAMP = 'h-6 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1 text-body hover:border-border focus:border-ring focus:outline-none';
const SELECT = 'h-8 w-full rounded-md border bg-background px-2 text-body';
const FAMILLES: { valeur: FamilleTiers; libelle: string }[] = [
  { valeur: 'fournisseurs', libelle: 'Fournisseurs' },
  { valeur: 'contacts', libelle: 'Contacts' },
  { valeur: 'banques', libelle: 'Banques' },
  { valeur: 'organismes', libelle: 'Organismes' },
  { valeur: 'personnels', libelle: 'Personnels' },
];

interface Etat {
  code: string;
  description: string;
  dateReception: string;
  lieu: string;
  demandeeParFournisseur: boolean;
  typeId: string;
  genreId: string;
  reserves: { cle: string; id: string | null; description: string; levee: boolean }[];
  invites: { cle: string; id: string | null; tiersId: string | null; nom: string }[];
}

function etatDepuis(d: ReceptionDetailDto | null): Etat {
  return {
    code: d?.code ?? '',
    description: d?.description ?? '',
    dateReception: d?.dateReception ?? new Date().toISOString().slice(0, 10),
    lieu: d?.lieu ?? '',
    demandeeParFournisseur: d?.demandeeParFournisseur ?? false,
    typeId: d?.typeId ?? '',
    genreId: d?.genreId ?? '',
    reserves: (d?.reserves ?? []).map((r) => ({ cle: r.id, id: r.id, description: r.description ?? '', levee: r.levee })),
    invites: (d?.tiersInvites ?? []).map((t) => ({ cle: t.id, id: t.id, tiersId: t.tiersId, nom: t.tiers ?? '' })),
  };
}

function versSaisie(e: Etat, ordre: number | null): ReceptionSaisieDto {
  return {
    ordre,
    code: e.code || null,
    description: e.description || null,
    dateReception: e.dateReception || null,
    lieu: e.lieu || null,
    demandeeParFournisseur: e.demandeeParFournisseur,
    typeId: e.typeId || null,
    genreId: e.genreId || null,
    reserves: e.reserves.map((r, i) => ({ id: r.id, ordre: i + 1, description: r.description || null, levee: r.levee })),
    tiersInvites: e.invites.map((t, i) => ({ id: t.id, ordre: i + 1, tiersId: t.tiersId })),
  };
}

function Champ({ libelle, children }: Readonly<{ libelle: string; children: React.ReactNode }>) {
  return (
    <label className="flex flex-col gap-0.5 text-micro text-muted-foreground">
      {libelle}
      {children}
    </label>
  );
}

function RechercheTiers({ onChoisir }: Readonly<{ onChoisir: (id: string, nom: string) => void }>) {
  const [famille, setFamille] = useState<FamilleTiers>('fournisseurs');
  const [recherche, setRecherche] = useState('');
  const terme = useDebouncedValue(recherche.trim());
  const { data, error } = useApi(() => (terme ? listTiers(famille, { recherche: terme, size: 8 }) : Promise.resolve(null)), [famille, terme]);
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-2">
        <select aria-label="Famille de tiers" className={SELECT} value={famille} onChange={(e) => setFamille(e.target.value as FamilleTiers)}>
          {FAMILLES.map((f) => (
            <option key={f.valeur} value={f.valeur}>
              {f.libelle}
            </option>
          ))}
        </select>
        <Input aria-label="Rechercher un tiers" placeholder="Rechercher un tiers…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
      </div>
      {error && <p className="text-body text-destructive">{error}</p>}
      {data && data.content.length === 0 && <p className="text-body text-muted-foreground">Aucun tiers trouvé</p>}
      {data && data.content.length > 0 && (
        <ul className="rounded-md border">
          {data.content.map((t) => {
            const nom = t.description ?? t.raisonSociale ?? t.code ?? '';
            return (
              <li key={t.id}>
                <button type="button" className="w-full px-2 py-1 text-left text-body hover:bg-muted" onClick={() => onChoisir(t.id, nom)}>
                  {nom}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EditeurReception({
  lotId,
  detail,
  remb,
  onRetour,
  onModifie,
}: Readonly<{ lotId: string; detail: ReceptionDetailDto | null; remb: RemboursementsLotDto; onRetour: () => void; onModifie?: (modifie: boolean) => void }>) {
  const confirm = useConfirm();
  const [etat, setEtat] = useState<Etat>(() => etatDepuis(detail));
  const [modifie, setModifie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  useConfirmationSortie(modifie);
  useEffect(() => onModifie?.(modifie), [modifie, onModifie]);

  function muter(fn: (e: Etat) => Etat) {
    setEtat(fn);
    setModifie(true);
    setErreur(null);
  }
  const champ = <K extends keyof Etat>(cle: K, valeur: Etat[K]) => muter((e) => ({ ...e, [cle]: valeur }));

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

  function enregistrer() {
    if (!etat.dateReception) {
      setErreur('La date de réception est obligatoire.');
      return;
    }
    const corps = versSaisie(etat, detail?.ordre ?? null);
    void ecrire(() => (detail ? modifierReceptionLot(lotId, detail.id, corps) : creerReceptionLot(lotId, corps)));
  }

  async function supprimer() {
    if (detail && (await confirm('Êtes-vous sûr de vouloir supprimer cette réception ?'))) await ecrire(() => supprimerReceptionLot(lotId, detail.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={enregistrer}>
          <Save /> Enregistrer
        </Button>
        {detail && (
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
          <Input value={etat.code} onChange={(e) => champ('code', e.target.value)} />
        </Champ>
        <Champ libelle="Description">
          <Input value={etat.description} onChange={(e) => champ('description', e.target.value)} />
        </Champ>
        <Champ libelle="Date de réception">
          <Input type="date" required value={etat.dateReception} onChange={(e) => champ('dateReception', e.target.value)} />
        </Champ>
        <Champ libelle="Lieu">
          <Input value={etat.lieu} onChange={(e) => champ('lieu', e.target.value)} />
        </Champ>
        <Champ libelle="Type">
          <select className={SELECT} value={etat.typeId} onChange={(e) => champ('typeId', e.target.value)}>
            <option value="" />
            {remb.typesReception.map((t) => (
              <option key={t.id} value={t.id}>
                {t.libelle}
              </option>
            ))}
          </select>
        </Champ>
        <Champ libelle="Genre">
          <select className={SELECT} value={etat.genreId} onChange={(e) => champ('genreId', e.target.value)}>
            <option value="" />
            {remb.genresReception.map((g) => (
              <option key={g.id} value={g.id}>
                {g.libelle}
              </option>
            ))}
          </select>
        </Champ>
        <label className="flex items-center gap-2 self-end text-body">
          <input type="checkbox" checked={etat.demandeeParFournisseur} onChange={(e) => champ('demandeeParFournisseur', e.target.checked)} /> Demandée par le fournisseur
        </label>
      </div>
      <section className="flex flex-col gap-1">
        <BarreIcones className="flex items-center gap-1">
          <span className="text-body font-medium">Réserves</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => muter((e) => ({ ...e, reserves: [...e.reserves, { cle: crypto.randomUUID(), id: null, description: '', levee: false }] }))}>
            <Plus /> Ajouter une réserve
          </Button>
        </BarreIcones>
        {etat.reserves.length === 0 && <p className="text-body text-muted-foreground">Aucune réserve</p>}
        {etat.reserves.map((r) => (
          <div key={r.cle} className="flex items-center gap-2">
            <input
              type="text"
              aria-label="Description de la réserve"
              className={CHAMP}
              value={r.description}
              onChange={(e) => muter((s) => ({ ...s, reserves: s.reserves.map((x) => (x.cle === r.cle ? { ...x, description: e.target.value } : x)) }))}
            />
            <label className="flex items-center gap-1 whitespace-nowrap text-body">
              <input type="checkbox" checked={r.levee} onChange={(e) => muter((s) => ({ ...s, reserves: s.reserves.map((x) => (x.cle === r.cle ? { ...x, levee: e.target.checked } : x)) }))} /> Levée
            </label>
            <Button type="button" variant="ghost" size="sm" aria-label="Supprimer la réserve" title="Supprimer" onClick={() => muter((s) => ({ ...s, reserves: s.reserves.filter((x) => x.cle !== r.cle) }))}>
              <Trash2 />
            </Button>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-1">
        <span className="text-body font-medium">Tiers invités</span>
        {etat.invites.length === 0 && <p className="text-body text-muted-foreground">Aucun tiers invité</p>}
        {etat.invites.map((t) => (
          <div key={t.cle} className="flex items-center gap-2 text-body">
            <span className="flex-1">{t.nom}</span>
            <Button type="button" variant="ghost" size="sm" aria-label="Retirer le tiers" title="Retirer" onClick={() => muter((s) => ({ ...s, invites: s.invites.filter((x) => x.cle !== t.cle) }))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <RechercheTiers onChoisir={(id, nom) => muter((s) => ({ ...s, invites: [...s.invites, { cle: crypto.randomUUID(), id: null, tiersId: id, nom }] }))} />
      </section>
    </div>
  );
}

/** Fiche d'une réception de retenue de garantie (existante ou neuve) ; remplace la liste dans l'onglet. */
export default function FicheReception({
  lotId,
  receptionId,
  remb,
  onRetour,
  onModifie,
}: Readonly<{ lotId: string; receptionId: string | null; remb: RemboursementsLotDto; onRetour: () => void; onModifie?: (modifie: boolean) => void }>) {
  const detail = useApi<ReceptionDetailDto | null>(() => (receptionId ? getReceptionLot(lotId, receptionId) : Promise.resolve(null)), [lotId, receptionId]);
  if (detail.error) return <ErrorState message={detail.error} />;
  if (receptionId && !detail.data) return <LoadingState />;
  return <EditeurReception lotId={lotId} detail={detail.data} remb={remb} onRetour={onRetour} onModifie={onModifie} />;
}
