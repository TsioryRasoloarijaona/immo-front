import { useState } from 'react';
import { Ban, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import SearchableSelect from '../../components/SearchableSelect';
import Champ from '../../components/dossier/echeancier/Champ';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  ajouterFournisseurDemandeAchat,
  ecarterFournisseurDemandeAchat,
  getFournisseursDemandeAchat,
  modifierFournisseurDemandeAchat,
  reactiverFournisseurDemandeAchat,
  supprimerFournisseurDemandeAchat,
} from '../../lib/apiDemandesAchat';
import { useConfirm } from '../../lib/confirmContext';
import { jourSaisi, useTiersParType } from '../../lib/editionDossier';
import { formatDate } from '../../lib/format';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { DemandeAchatFiche, FournisseurDemandeAchat, SaisieFournisseurDemandeAchat } from '../../types/demandesAchat';

const COLONNES: ColonneGrille<FournisseurDemandeAchat>[] = [
  { nom: 'fournisseur', libelle: 'Fournisseur', valeur: (f) => f.fournisseur?.libelle ?? '', largeur: 16 },
  { nom: 'referenceOdt', libelle: 'Réf. O.D.T.', valeur: (f) => f.referenceOdt ?? '' },
  { nom: 'lettreEnvoyee', libelle: 'Lettre envoyée le', type: 'DATE', rendu: (f) => formatDate(f.lettreEnvoyee) },
  { nom: 'retraitDossier', libelle: 'Retrait du dossier le', type: 'DATE', rendu: (f) => formatDate(f.retraitDossier) },
  { nom: 'depot', libelle: 'Dépôt le', type: 'DATE', rendu: (f) => formatDate(f.depot) },
  { nom: 'ecarte', libelle: 'Écarté', valeur: (f) => (f.ecarte ? 'Oui' : 'Non') },
  { nom: 'notes', libelle: 'Notes', valeur: (f) => f.notes ?? '', largeur: 16 },
];

type Brouillon = Record<'fournisseurId' | 'referenceOdt' | 'lettreEnvoyee' | 'retraitDossier' | 'depot' | 'notes', string>;

function brouillonDepuis(f: FournisseurDemandeAchat | null): Brouillon {
  return {
    fournisseurId: f?.fournisseur?.id ?? '', referenceOdt: f?.referenceOdt ?? '', lettreEnvoyee: jourSaisi(f?.lettreEnvoyee),
    retraitDossier: jourSaisi(f?.retraitDossier), depot: jourSaisi(f?.depot), notes: f?.notes ?? '',
  };
}

function corpsDepuis(b: Brouillon): SaisieFournisseurDemandeAchat {
  const vide = (v: string) => v.trim() || null;
  return {
    fournisseurId: b.fournisseurId || null, referenceOdt: vide(b.referenceOdt), lettreEnvoyee: vide(b.lettreEnvoyee),
    retraitDossier: vide(b.retraitDossier), depot: vide(b.depot), notes: vide(b.notes),
  };
}

const DATES: { cle: 'lettreEnvoyee' | 'retraitDossier' | 'depot'; libelle: string }[] = [
  { cle: 'lettreEnvoyee', libelle: 'Lettre envoyée le' },
  { cle: 'retraitDossier', libelle: 'Retrait du dossier le' },
  { cle: 'depot', libelle: 'Dépôt le' },
];

function DialogueFournisseur({ id, existant, onFermer, onFait }: Readonly<{
  id: string; existant: FournisseurDemandeAchat | null; onFermer: () => void; onFait: () => void;
}>) {
  const [b, setB] = useState(() => brouillonDepuis(existant));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const tiers = useTiersParType('FOU', true);
  const maj = (cle: keyof Brouillon) => (v: string) => setB((s) => ({ ...s, [cle]: v }));

  function valider() {
    setEnCours(true);
    setErreur(null);
    const corps = corpsDepuis(b);
    const appel = existant ? modifierFournisseurDemandeAchat(id, existant.id, corps) : ajouterFournisseurDemandeAchat(id, corps);
    appel.then(onFait).catch((err: unknown) => {
      setEnCours(false);
      setErreur(errorMessage(err));
    });
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{existant ? 'Modifier le fournisseur présélectionné' : 'Ajouter un fournisseur'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-full">
            <Champ id="pre-fournisseur" libelle="Fournisseur *">
              <SearchableSelect id="pre-fournisseur" items={tiers.items} value={b.fournisseurId || null} placeholder="Choisir…"
                emptyMessage={tiers.chargement ? 'Chargement…' : 'Aucun fournisseur'} disabled={existant !== null} className="w-full min-w-0"
                onValueChange={(v) => maj('fournisseurId')(v ?? '')} />
            </Champ>
          </div>
          <Champ id="pre-odt" libelle="Réf. O.D.T.">
            <Input id="pre-odt" value={b.referenceOdt} onChange={(e) => maj('referenceOdt')(e.target.value)} />
          </Champ>
          {DATES.map((d) => (
            <Champ key={d.cle} id={`pre-${d.cle}`} libelle={d.libelle}>
              <Input id={`pre-${d.cle}`} type="date" value={b[d.cle]} onChange={(e) => maj(d.cle)(e.target.value)} />
            </Champ>
          ))}
          <div className="col-span-full">
            <Champ id="pre-notes" libelle="Notes">
              <Textarea id="pre-notes" rows={2} value={b.notes} onChange={(e) => maj('notes')(e.target.value)} />
            </Champ>
          </div>
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="button" disabled={enCours || !b.fournisseurId} onClick={valider}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const HORS_PHASE = 'Hors phase de présélection';

/** Fournisseurs présélectionnés de la demande ; écritures permises en phase présélection, sur la dernière demande. */
export default function OngletPreselectionDemandeAchat({ fiche, verrouille }: Readonly<{ fiche: DemandeAchatFiche; verrouille: boolean }>) {
  const { id } = fiche;
  const liste = useApi(() => getFournisseursDemandeAchat(id), [id]);
  const confirmer = useConfirm();
  const [dialogue, setDialogue] = useState<FournisseurDemandeAchat | 'ajout' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const bloque = verrouille || !fiche.phases.preselection;
  const motif = verrouille ? 'demande en lecture seule' : HORS_PHASE;
  const raison = (libelle: string) => (bloque ? `${libelle} — ${motif}` : libelle);

  async function agir(appel: () => Promise<unknown>) {
    setMessage(null);
    try {
      await appel();
      refetchAllApis();
      void liste.refetch();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  async function supprimer(f: FournisseurDemandeAchat) {
    const ok = await confirmer({ title: 'Supprimer', message: `Retirer ${f.fournisseur?.libelle ?? 'ce fournisseur'} de la présélection ?`, confirmLabel: 'Supprimer' });
    if (ok) await agir(() => supprimerFournisseurDemandeAchat(id, f.id));
  }

  const lignes = liste.data ?? [];
  return (
    <div className="flex flex-col gap-3 pt-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => setDialogue('ajout')}>
          <Plus /> {raison('Ajouter un fournisseur')}
        </Button>
      </BarreIcones>
      {message && <p role="alert" className="text-body text-destructive">{message}</p>}
      {liste.error && <ErrorState message={liste.error} />}
      {!liste.error && !liste.data && <LoadingState />}
      {!liste.error && liste.data && lignes.length === 0 && <EmptyState title="Aucun fournisseur présélectionné" />}
      {!liste.error && lignes.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <DataGrid cleOrdre="achat-da-preselection" rows={lignes} colonnes={COLONNES} bandeauRegroupement={false}
            libelleLigne={(f) => f.fournisseur?.libelle ?? ''}
            actions={(f) => (
              <BarreIcones className="flex items-center justify-center gap-1">
                <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => setDialogue(f)}><Pencil /> {raison('Modifier')}</Button>
                {f.ecarte ? (
                  <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => void agir(() => reactiverFournisseurDemandeAchat(id, f.id))}>
                    <RotateCcw /> {raison('Réactiver')}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => void agir(() => ecarterFournisseurDemandeAchat(id, f.id))}>
                    <Ban /> {raison('Écarter')}
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" disabled={bloque} onClick={() => void supprimer(f)}><Trash2 /> {raison('Supprimer')}</Button>
              </BarreIcones>
            )} />
        </div>
      )}
      {dialogue && (
        <DialogueFournisseur id={id} existant={dialogue === 'ajout' ? null : dialogue} onFermer={() => setDialogue(null)}
          onFait={() => { setDialogue(null); refetchAllApis(); void liste.refetch(); }} />
      )}
    </div>
  );
}
