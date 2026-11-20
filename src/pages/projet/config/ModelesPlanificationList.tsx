import { useState } from 'react';
import { ChartGantt, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarreIcones from '../../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import Modal from '../../../components/Modal';
import PageShell from '../../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Field, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { oublierLecturesRecentes } from '../../../lib/api';
import { creerModelePlanification, listModelesPlanification, modifierModelePlanification, supprimerModelePlanification } from '../../../lib/apiPlanification';
import { useConfirm } from '../../../lib/confirmContext';
import { formatDate } from '../../../lib/format';
import { valeurDate } from '../../../lib/planification';
import { useToast } from '../../../lib/toastContext';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { PlanificationListItemDto } from '../../../types/planification';

const COLONNES: ColonneGrille<PlanificationListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 20 },
  { nom: 'description', libelle: 'Description', largeur: 35, valeur: (m) => m.description ?? '' },
  { nom: 'notes', libelle: 'Notes', largeur: 30, valeur: (m) => m.notes ?? '' },
  { nom: 'dateDebut', libelle: 'Date début', largeur: 15, valeur: (m) => formatDate(m.dateDebut) },
];

function FicheModele({ modele, onClose, onEnregistre }: Readonly<{
  modele: PlanificationListItemDto | null;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const [code, setCode] = useState(modele?.code ?? '');
  const [description, setDescription] = useState(modele?.description ?? '');
  const [notes, setNotes] = useState(modele?.notes ?? '');
  const [dateDebut, setDateDebut] = useState(valeurDate(modele?.dateDebut));
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps = { code: code.trim(), description: description.trim(), notes: notes.trim(), dateDebut: dateDebut || undefined };
    setErreur(null);
    try {
      await (modele ? modifierModelePlanification(modele.id, corps) : creerModelePlanification(corps));
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return (
    <Modal title={modele ? `Modèle ${modele.code}` : 'Nouveau modèle de planification'} onClose={onClose} width={520}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <BarreIcones className="flex items-center gap-1">
          <Button type="submit" variant="ghost" size="sm" disabled={!code.trim() || !description.trim()}><Save /> Enregistrer</Button>
        </BarreIcones>
        <Field>
          <FieldLabel htmlFor="mp-code">Code *</FieldLabel>
          <Input id="mp-code" value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="mp-desc">Description *</FieldLabel>
          <Input id="mp-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="mp-notes">Notes</FieldLabel>
          <Input id="mp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="mp-debut">Date de début</FieldLabel>
          <Input id="mp-debut" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        </Field>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </form>
    </Modal>
  );
}

/** Configuration › Modèles de planification : plannings types copiés dans les projets. */
export default function ModelesPlanificationList() {
  const modeles = useApi(() => listModelesPlanification(), [], 'projet-config-modeles-planification');
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const [fiche, setFiche] = useState<{ modele: PlanificationListItemDto | null } | null>(null);

  const rafraichir = () => { void modeles.refetch(); };

  async function supprimer(m: PlanificationListItemDto) {
    const ok = await confirm({ title: 'Supprimer le modèle ?', message: `« ${m.code} » et ses tâches seront supprimés.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await supprimerModelePlanification(m.id);
      toast('Modèle supprimé.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    rafraichir();
  }

  return (
    <PageShell title="Modèles de planification" icon={<ChartGantt />}
      crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: 'Modèles de planification' }]}
      actions={(
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setFiche({ modele: null })}><Plus /> Nouveau modèle</Button>
          <Button type="button" variant="ghost" size="sm" onClick={rafraichir}><RefreshCw /> Rafraîchir</Button>
        </BarreIcones>
      )}>
      <div className="flex flex-col gap-3 p-4 md:px-7">
        {modeles.loading && !modeles.data && <LoadingState />}
        {modeles.error && (
          <>
            <ErrorState message={modeles.error} />
            <Button type="button" variant="outline" className="self-center" onClick={rafraichir}>Réessayer</Button>
          </>
        )}
        {!modeles.error && modeles.data?.length === 0 && <EmptyState title="Aucun modèle" message="Aucun modèle de planification n'est configuré." />}
        {!modeles.error && modeles.data && modeles.data.length > 0 && (
          <div className="overflow-auto rounded-xl border border-border bg-card">
            <DataGrid cleOrdre="projet-config-modeles-planification" rows={modeles.data} colonnes={COLONNES} libelleLigne={(m) => m.code}
              actions={(m) => (
                <BarreIcones className="flex items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFiche({ modele: m })}><Pencil /> Modifier</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(m)}><Trash2 /> Supprimer</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void navigate(`/projet/planification/${m.id}`)}><ChartGantt /> Ouvrir le Gantt</Button>
                </BarreIcones>
              )} />
          </div>
        )}
      </div>
      {fiche && (
        <FicheModele key={fiche.modele?.id ?? 'nouveau'} modele={fiche.modele} onClose={() => setFiche(null)}
          onEnregistre={() => { setFiche(null); rafraichir(); }} />
      )}
    </PageShell>
  );
}
