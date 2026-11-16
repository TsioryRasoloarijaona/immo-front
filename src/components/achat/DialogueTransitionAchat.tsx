import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DocumentsTransitionAchat from './DocumentsTransitionAchat';
import { documentsValides, GESTION_DECOMPTES } from '../../lib/documentsTransitionAchat';
import { oublierLecturesRecentes } from '../../lib/api';
import { creerTransitionAchat, getChampsObligatoiresStatutAchat, listStatutsAchat, modifierTransitionAchat } from '../../lib/apiAchatConfig';
import { listerRoles } from '../../lib/apiRoles';
import { errorMessage, useApi } from '../../lib/useApi';
import type { TransitionAchatDto, TransitionAchatEcritureDto } from '../../types/achatConfig';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

/** Liste de cases à cocher : rien de coché = aucun choix. */
function CasesChoix({ titre, choix, valeur, onChange }: Readonly<{
  titre: string;
  choix: { valeur: string; libelle: string }[];
  valeur: string[];
  onChange: (v: string[]) => void;
}>) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-label font-medium text-foreground">{titre}</legend>
      {choix.length === 0 && <p className="text-micro text-muted-foreground">Aucun choix disponible.</p>}
      <div className="grid max-h-40 grid-cols-2 gap-x-4 gap-y-1 overflow-auto">
        {choix.map((c) => (
          <label key={c.valeur} className="flex items-center gap-2 text-label text-foreground">
            <input type="checkbox" className="accent-(--brand)" checked={valeur.includes(c.valeur)}
              onChange={(e) => onChange(e.target.checked ? [...valeur, c.valeur] : valeur.filter((i) => i !== c.valeur))} />
            {c.libelle}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Création ou modification d'une transition, avec ou sans gestion. `gestions` : celles des lignes chargées. */
export default function DialogueTransitionAchat({ transition, gestions, onClose, onEnregistre }: Readonly<{
  transition: TransitionAchatDto | null;
  gestions: { id: string; libelle: string; code: string | null }[];
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const statuts = useApi(listStatutsAchat, [], 'achat-config-statuts');
  const catalogue = useApi(listerRoles, [], 'achat-config-roles-transition');
  const champs = useApi(getChampsObligatoiresStatutAchat, [], 'achat-config-champs-statut');
  const [gestionId, setGestionId] = useState(transition?.gestionId ?? '');
  const [champsPiece, setChampsPiece] = useState(transition?.champsObligatoires ?? []);
  const [champsFournisseur, setChampsFournisseur] = useState(transition?.champsObligatoiresFournisseur ?? []);
  const [notification, setNotification] = useState(transition?.avecNotification ?? false);
  const [emails, setEmails] = useState(transition?.envoiEmails ?? false);
  const [notifierDecl, setNotifierDecl] = useState(transition?.notifierDeclencheur ?? false);
  const [emailDecl, setEmailDecl] = useState(transition?.emailDeclencheur ?? false);
  const [ordre, setOrdre] = useState(String(transition?.ordre ?? 0));
  const [description, setDescription] = useState(transition?.description ?? '');
  const [depart, setDepart] = useState(transition?.statutDepartId ?? '');
  const [arrivee, setArrivee] = useState(transition?.statutArriveeId ?? '');
  const [note, setNote] = useState(transition?.noteObligatoire ?? false);
  const [declencheur, setDeclencheur] = useState(transition?.valideeParDeclencheur ?? false);
  const [roleIds, setRoleIds] = useState((transition?.roles ?? []).map((r) => r.id));
  const [documents, setDocuments] = useState(transition?.documentsAJoindre ?? []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const avecDecompte = gestions.find((g) => g.id === gestionId)?.code === GESTION_DECOMPTES;

  const roles = [...new Map([...(transition?.roles ?? []), ...(catalogue.data ?? [])].map((r) => [r.id, r])).values()];

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: TransitionAchatEcritureDto = {
      ordre: Number(ordre), description: description.trim(), statutDepartId: depart, statutArriveeId: arrivee,
      noteObligatoire: note, valideeParDeclencheur: declencheur, roleIds,
      gestionId: gestionId || null,
      champsObligatoires: champsPiece, champsObligatoiresFournisseur: champsFournisseur,
      avecNotification: notification, envoiEmails: emails, notifierDeclencheur: notifierDecl, emailDeclencheur: emailDecl,
      documentsAJoindre: documents.map((d) => ({ ...d, decompte: avecDecompte ? d.decompte : null })),
    };
    setEnvoi(true);
    setErreur(null);
    try {
      await (transition ? modifierTransitionAchat(transition.id, corps) : creerTransitionAchat(corps));
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      oublierLecturesRecentes();
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  const choixStatut = (id: string, valeur: string, onChange: (v: string) => void, libelle: string) => (
    <Field>
      <FieldLabel htmlFor={id}>{libelle} *</FieldLabel>
      <select id={id} className={CLASSE_SELECT} value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choisir…</option>
        {statuts.data?.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
      </select>
    </Field>
  );

  return (
    <Modal title={transition ? 'Modifier la transition' : 'Nouvelle transition'} onClose={onClose} width={720}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="tr-ordre">Ordre</FieldLabel>
            <Input id="tr-ordre" type="number" min={0} value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tr-desc">Description</FieldLabel>
            <Input id="tr-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {choixStatut('tr-depart', depart, setDepart, 'De')}
          {choixStatut('tr-arrivee', arrivee, setArrivee, 'À')}
          <Field>
            <FieldLabel htmlFor="tr-gestion">Gestion</FieldLabel>
            <select id="tr-gestion" className={CLASSE_SELECT} value={gestionId} onChange={(e) => setGestionId(e.target.value)}>
              <option value="">Sans gestion</option>
              {gestions.map((g) => <option key={g.id} value={g.id}>{g.libelle}</option>)}
            </select>
          </Field>
        </div>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="documents">Documents à joindre</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="flex flex-col gap-3 pt-2">
        <label className="flex w-fit items-center gap-2 text-label text-foreground">
          <input type="checkbox" className="accent-(--brand)" checked={note} onChange={(e) => setNote(e.target.checked)} />
          Commentaire obligatoire
        </label>
        <label className="flex w-fit items-center gap-2 text-label text-foreground">
          <input type="checkbox" className="accent-(--brand)" checked={declencheur} onChange={(e) => setDeclencheur(e.target.checked)} />
          Validée par le déclencheur
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-label font-medium text-foreground">Rôles autorisés</legend>
          {roles.length === 0 && <p className="text-micro text-muted-foreground">Aucun rôle disponible.</p>}
          <div className="grid max-h-40 grid-cols-2 gap-x-4 gap-y-1 overflow-auto">
            {roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-label text-foreground">
                <input type="checkbox" className="accent-(--brand)" checked={roleIds.includes(r.id)}
                  onChange={(e) => setRoleIds(e.target.checked ? [...roleIds, r.id] : roleIds.filter((i) => i !== r.id))} />
                {r.code}
              </label>
            ))}
          </div>
        </fieldset>
        {champs.error && <p role="alert" className="text-body text-destructive">{champs.error}</p>}
        <CasesChoix titre="Champs obligatoires de la pièce" valeur={champsPiece} onChange={setChampsPiece}
          choix={(champs.data?.piece ?? []).map((c) => ({ valeur: c.nom, libelle: c.libelle }))} />
        <CasesChoix titre="Champs obligatoires du fournisseur" valeur={champsFournisseur} onChange={setChampsFournisseur}
          choix={(champs.data?.fournisseur ?? []).map((c) => ({ valeur: c.nom, libelle: c.libelle }))} />
        <fieldset className="grid grid-cols-2 gap-x-4 gap-y-1">
          <legend className="mb-1 text-label font-medium text-foreground">Notifications</legend>
          {([
            ['Notification', notification, setNotification],
            ['Envoi d\'e-mails', emails, setEmails],
            ['Notifier le déclencheur', notifierDecl, setNotifierDecl],
            ['E-mail au déclencheur', emailDecl, setEmailDecl],
          ] as const).map(([libelle, coche, change]) => (
            <label key={libelle} className="flex items-center gap-2 text-label text-foreground">
              <input type="checkbox" className="accent-(--brand)" checked={coche} onChange={(e) => change(e.target.checked)} />
              {libelle}
            </label>
          ))}
        </fieldset>
          </TabsContent>
          <TabsContent value="documents" className="pt-2">
            <DocumentsTransitionAchat lignes={documents} avecDecompte={avecDecompte} onChange={setDocuments} />
          </TabsContent>
        </Tabs>
        {erreur &&<p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="submit" disabled={envoi || !depart || !arrivee || !documentsValides(documents, avecDecompte)}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
