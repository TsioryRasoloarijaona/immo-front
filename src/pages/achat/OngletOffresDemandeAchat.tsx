import { useState } from 'react';
import { CheckCheck, Columns3, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import SearchableSelect from '../../components/SearchableSelect';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
  creerOffreDemandeAchat,
  deselectionnerOffreDemandeAchat,
  getFournisseursDemandeAchat,
  getOffresDemandeAchat,
  modifierOffreDemandeAchat,
  selectionnerOffreDemandeAchat,
  supprimerOffreDemandeAchat,
} from '../../lib/apiDemandesAchat';
import { useConfirm } from '../../lib/confirmContext';
import { formatCurrency, formatDate } from '../../lib/format';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import type { DemandeAchatFiche, OffreDemandeAchat } from '../../types/demandesAchat';
import ComparaisonOffresDemandeAchat from './ComparaisonOffresDemandeAchat';

const oui = (b: boolean) => (b ? 'Oui' : 'Non');

const COLONNES: ColonneGrille<OffreDemandeAchat>[] = [
  { nom: 'fournisseur', libelle: 'Fournisseur', valeur: (o) => o.fournisseur?.libelle ?? '', largeur: 16 },
  { nom: 'date', libelle: 'Date de dépôt', type: 'DATE', rendu: (o) => formatDate(o.date) },
  { nom: 'totalHT', libelle: 'Total HT', type: 'MONTANT', rendu: (o) => formatCurrency(o.totalHT) },
  { nom: 'totalTTC', libelle: 'Total TTC', type: 'MONTANT', rendu: (o) => formatCurrency(o.totalTTC) },
  { nom: 'selectionnee', libelle: 'Sélectionnée', valeur: (o) => oui(o.selectionnee) },
  { nom: 'ecartee', libelle: 'Écartée', valeur: (o) => oui(o.ecartee) },
];

function DialogueAjoutOffre({ id, onFermer, onFait }: Readonly<{ id: string; onFermer: () => void; onFait: () => void }>) {
  const presel = useApi(() => getFournisseursDemandeAchat(id), [id]);
  const [choix, setChoix] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const items = (presel.data ?? [])
    .filter((f) => !f.ecarte && f.fournisseur)
    .map((f) => ({ label: f.fournisseur?.libelle ?? '', value: f.fournisseur?.id ?? '' }));

  function valider() {
    if (!choix) return;
    setErreur(null);
    creerOffreDemandeAchat(id, { fournisseurId: choix }).then(onFait).catch((err: unknown) => setErreur(errorMessage(err)));
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajouter une offre</DialogTitle></DialogHeader>
        {presel.error && <ErrorState message={presel.error} />}
        <SearchableSelect id="offre-fournisseur" items={items} value={choix} placeholder="Fournisseur présélectionné…"
          emptyMessage="Aucun fournisseur présélectionné" className="w-full min-w-0" onValueChange={setChoix} />
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="button" disabled={!choix} onClick={valider}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialoguePrix({ id, offre, onFermer, onFait }: Readonly<{ id: string; offre: OffreDemandeAchat; onFermer: () => void; onFait: () => void }>) {
  const [prix, setPrix] = useState<Record<string, string>>(() =>
    Object.fromEntries(offre.lignes.map((l) => [l.id, l.prixUnitaireHT === null ? '' : String(l.prixUnitaireHT)])));
  const [erreur, setErreur] = useState<string | null>(null);

  function valider() {
    const corps = offre.lignes
      .filter((l) => prix[l.id] !== '')
      .map((l) => ({ ligneId: l.id, prixUnitaireHT: Number(prix[l.id]) }));
    setErreur(null);
    modifierOffreDemandeAchat(id, offre.id, corps).then(onFait).catch((err: unknown) => setErreur(errorMessage(err)));
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Prix de l'offre — {offre.fournisseur?.libelle ?? offre.code ?? ''}</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-body">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-1.5 py-1">Code</th>
                <th className="px-1.5 py-1">Désignation</th>
                <th className="px-1.5 py-1">Unité</th>
                <th className="px-1.5 py-1 text-right">Quantité</th>
                <th className="px-1.5 py-1 text-right">Prix unitaire HT</th>
              </tr>
            </thead>
            <tbody>
              {offre.lignes.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="px-1.5 py-1">{l.code}</td>
                  <td className="px-1.5 py-1">{l.designation}</td>
                  <td className="px-1.5 py-1">{l.unite}</td>
                  <td className="px-1.5 py-1 text-right tabular-nums">{l.quantite}</td>
                  <td className="px-1.5 py-1">
                    <Input type="number" min="0" step="any" className="text-right" aria-label={`Prix unitaire HT de ${l.code ?? ''}`}
                      value={prix[l.id] ?? ''} onChange={(e) => setPrix((p) => ({ ...p, [l.id]: e.target.value }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="button" onClick={valider}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Ouvert = 'ajout' | 'comparaison' | OffreDemandeAchat | null;

/** Offres des fournisseurs présélectionnés ; saisie en phase offres, sélection en phase sélection. */
export default function OngletOffresDemandeAchat({ fiche, verrouille }: Readonly<{ fiche: DemandeAchatFiche; verrouille: boolean }>) {
  const { id } = fiche;
  const liste = useApi(() => getOffresDemandeAchat(id), [id]);
  const confirmer = useConfirm();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [message, setMessage] = useState<string | null>(null);
  const saisieBloquee = verrouille || !fiche.phases.offres;
  const selectionBloquee = verrouille || !fiche.phases.selection;
  const nom = (bloque: boolean, libelle: string) => (bloque ? `${libelle} — indisponible dans la phase actuelle` : libelle);

  function apres() {
    setOuvert(null);
    refetchAllApis();
    void liste.refetch();
  }

  async function agir(appel: () => Promise<unknown>) {
    setMessage(null);
    try {
      await appel();
      apres();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  }

  async function supprimer(o: OffreDemandeAchat) {
    const ok = await confirmer({ title: 'Supprimer', message: `Supprimer l'offre de ${o.fournisseur?.libelle ?? 'ce fournisseur'} ?`, confirmLabel: 'Supprimer' });
    if (ok) await agir(() => supprimerOffreDemandeAchat(id, o.id));
  }

  async function deselectionner() {
    const ok = await confirmer({ title: 'Désélectionner', message: 'Le bordereau de la demande sera vidé.', confirmLabel: 'Désélectionner' });
    if (ok) await agir(() => deselectionnerOffreDemandeAchat(id));
  }

  const lignes = liste.data ?? [];
  return (
    <div className="flex flex-col gap-3 pt-3">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={saisieBloquee} onClick={() => setOuvert('ajout')}>
          <Plus /> {nom(saisieBloquee, 'Ajouter une offre')}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!fiche.phases.comparaison} onClick={() => setOuvert('comparaison')}>
          <Columns3 /> {fiche.phases.comparaison ? 'Comparer les offres' : 'Comparer les offres — indisponible dans la phase actuelle'}
        </Button>
      </BarreIcones>
      {message && <p role="alert" className="text-body text-destructive">{message}</p>}
      {liste.error && <ErrorState message={liste.error} />}
      {!liste.error && !liste.data && <LoadingState />}
      {!liste.error && liste.data && lignes.length === 0 && <EmptyState title="Aucune offre" />}
      {!liste.error && lignes.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <DataGrid cleOrdre="achat-da-offres" rows={lignes} colonnes={COLONNES} bandeauRegroupement={false}
            libelleLigne={(o) => o.fournisseur?.libelle ?? ''}
            actions={(o) => (
              <BarreIcones className="flex items-center justify-center gap-1">
                <Button type="button" variant="ghost" size="sm" disabled={saisieBloquee} onClick={() => setOuvert(o)}><Pencil /> {nom(saisieBloquee, 'Modifier les prix')}</Button>
                {o.selectionnee ? (
                  <Button type="button" variant="ghost" size="sm" disabled={selectionBloquee} onClick={() => void deselectionner()}>
                    <XCircle /> {nom(selectionBloquee, 'Désélectionner')}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" disabled={selectionBloquee || o.ecartee} onClick={() => void agir(() => selectionnerOffreDemandeAchat(id, o.id))}>
                    <CheckCheck /> {nom(selectionBloquee, 'Sélectionner')}
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" disabled={saisieBloquee} onClick={() => void supprimer(o)}><Trash2 /> {nom(saisieBloquee, 'Supprimer')}</Button>
              </BarreIcones>
            )} />
        </div>
      )}
      {ouvert === 'ajout' && <DialogueAjoutOffre id={id} onFermer={() => setOuvert(null)} onFait={apres} />}
      {ouvert === 'comparaison' && <ComparaisonOffresDemandeAchat id={id} onFermer={() => setOuvert(null)} />}
      {ouvert !== null && typeof ouvert === 'object' && <DialoguePrix id={id} offre={ouvert} onFermer={() => setOuvert(null)} onFait={apres} />}
    </div>
  );
}
