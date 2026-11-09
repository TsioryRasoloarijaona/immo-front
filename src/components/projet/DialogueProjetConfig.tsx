import { useState, type ReactNode } from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { createProjetConfig, getReferentielsProjetConfig, updateProjetConfig } from '../../lib/apiProjetConfig';
import { brouillonDepuis, useSaisie, type ChampDef } from '../../lib/saisiePatrimoine';
import { useApi } from '../../lib/useApi';
import type { ReferentielItemDto } from '../../types';
import type { ProjetConfigDto, ProjetConfigRequest } from '../../types/projetConfig';

const CHAMPS: ChampDef[] = [
  { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
  { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
  { nom: 'descriptionLongue', libelle: 'Description longue', type: 'texteLong' },
  { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
  { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
  { nom: 'societeId', libelle: 'Société', type: 'liste', obligatoire: true },
  { nom: 'gestionnaireId', libelle: 'Gestionnaire', type: 'liste' },
  { nom: 'ventile', libelle: 'Ventilé', type: 'booleen' },
  { nom: 'tauxVentilationDefaut', libelle: 'Taux de ventilation par défaut', type: 'ratio' },
  { nom: 'partiesCommunes', libelle: 'Parties communes', type: 'booleen' },
];

const items = (liste: ReferentielItemDto[] | undefined, libelle: (i: ReferentielItemDto) => string) =>
  (liste ?? []).map((i) => ({ value: i.id, label: libelle(i) }));

/** Création (`projet` absent) ou modification ; l'erreur 400/409 du serveur s'affiche telle quelle. Ni statut ni entité : posés par le serveur. */
export default function DialogueProjetConfig({ projet, onClose, onSaved }: Readonly<{
  projet?: ProjetConfigDto;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const referentiels = useApi(getReferentielsProjetConfig, [], 'projet-config-referentiels');
  const [depart] = useState(() => brouillonDepuis(CHAMPS, projet));
  const { brouillon, modifier, envoi, erreur, champErreur, envoyer } = useSaisie(CHAMPS, depart);
  const texte = (nom: string) => String(brouillon[nom] ?? '');

  function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const taux = texte('tauxVentilationDefaut').trim();
    const corps: ProjetConfigRequest = {
      code: texte('code').trim(),
      description: texte('description').trim(),
      descriptionLongue: texte('descriptionLongue') || null,
      adresse: texte('adresse') || null,
      notes: texte('notes') || null,
      societeId: texte('societeId'),
      gestionnaireId: texte('gestionnaireId') || null,
      ventile: brouillon.ventile === true,
      tauxVentilationDefaut: taux === '' ? null : Number(taux),
      partiesCommunes: brouillon.partiesCommunes === true,
    };
    void envoyer(() => (projet ? updateProjetConfig(projet.id, corps) : createProjetConfig(corps)), onSaved);
  }

  const ligne = (nom: string, enfant: ReactNode) => {
    const def = CHAMPS.find((c) => c.nom === nom);
    return (
      <Field>
        <FieldLabel htmlFor={`pc-${nom}`}>{def?.libelle}{def?.obligatoire ? ' *' : ''}</FieldLabel>
        {enfant}
        {champErreur === nom && erreur && <p className="text-micro text-destructive">{erreur}</p>}
      </Field>
    );
  };
  const saisie = (nom: string, type: 'text' | 'number' = 'text') => (
    <Input id={`pc-${nom}`} type={type} step={type === 'number' ? 'any' : undefined} min={type === 'number' ? 0 : undefined}
      value={texte(nom)} aria-invalid={champErreur === nom ? true : undefined} onChange={(e) => modifier(nom, e.target.value)} />
  );
  const zone = (nom: string) => (
    <Textarea id={`pc-${nom}`} rows={2} value={texte(nom)} onChange={(e) => modifier(nom, e.target.value)} />
  );
  const liste = (nom: string, choix: { value: string; label: string }[]) => (
    <div className="flex gap-1.5">
      <SearchableSelect id={`pc-${nom}`} items={choix} value={texte(nom) || null} placeholder="Choisir…" emptyMessage="Aucun choix"
        className="w-full min-w-0" onValueChange={(v) => modifier(nom, v ?? '')} />
      {nom === 'gestionnaireId' && texte(nom) !== '' && (
        <Button type="button" variant="outline" size="sm" onClick={() => modifier(nom, '')}>Effacer</Button>
      )}
    </div>
  );
  const caseACocher = (nom: string) => (
    <label htmlFor={`pc-${nom}`} className="flex items-center gap-2 py-1.5 text-label text-foreground">
      <input id={`pc-${nom}`} type="checkbox" checked={brouillon[nom] === true} onChange={(e) => modifier(nom, e.target.checked)} />
      {CHAMPS.find((c) => c.nom === nom)?.libelle}
    </label>
  );

  const ref = referentiels.data;
  return (
    <Modal title={projet ? `Modifier le projet ${projet.code ?? ''}` : 'Nouveau projet'} onClose={onClose} width={720}>
      {referentiels.loading && !ref && <LoadingState />}
      {referentiels.error && <ErrorState message={referentiels.error} />}
      {!referentiels.error && ref && (
        <form onSubmit={enregistrer}>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {ligne('code', saisie('code'))}
            {ligne('description', saisie('description'))}
            {ligne('societeId', liste('societeId', items(ref.societes, (s) => s.description ?? s.code ?? '—')))}
            {ligne('gestionnaireId', liste('gestionnaireId', items(ref.gestionnaires, (g) => g.description ?? g.code ?? '—')))}
            {ligne('adresse', saisie('adresse'))}
            {ligne('tauxVentilationDefaut', saisie('tauxVentilationDefaut', 'number'))}
            {ligne('descriptionLongue', zone('descriptionLongue'))}
            {ligne('notes', zone('notes'))}
            {caseACocher('ventile')}
            {caseACocher('partiesCommunes')}
          </div>
          {erreur && champErreur === null && <p className="mt-3 text-body text-destructive">{erreur}</p>}
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
            <Button type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      )}
    </Modal>
  );
}
