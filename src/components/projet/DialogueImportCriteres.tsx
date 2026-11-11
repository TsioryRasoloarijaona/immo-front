import { useState } from 'react';
import { Download, X } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { importCriteresProjet, listProjetsConfig } from '../../lib/apiProjetConfig';
import { useSaisie } from '../../lib/saisiePatrimoine';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';

/** Remplace tous les critères du projet par ceux d'un autre projet ; 409 du serveur si un PV cite un critère actuel. */
export default function DialogueImportCriteres({ projetId, onClose, onImporte }: Readonly<{
  projetId: UUID;
  onClose: () => void;
  onImporte: () => void;
}>) {
  const projets = useApi(listProjetsConfig, []);
  const [sourceId, setSourceId] = useState('');
  const { envoi, erreur, envoyer } = useSaisie([], {});
  const choix = (projets.data ?? []).filter((p) => p.id !== projetId)
    .map((p) => ({ value: p.id, label: `${p.code ?? ''} ${p.description ?? ''}`.trim() }));

  return (
    <Modal title="Importer les critères d'un autre projet" onClose={onClose} width={480}>
      {projets.loading && !projets.data && <LoadingState />}
      {projets.error && <ErrorState message={projets.error} />}
      {!projets.error && projets.data && (
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="import-criteres-source">Projet source</FieldLabel>
            <SearchableSelect id="import-criteres-source" items={choix} value={sourceId || null} placeholder="Choisir…"
              emptyMessage="Aucun projet" className="w-full min-w-0" onValueChange={(v) => setSourceId(v ?? '')} />
          </Field>
          <p className="text-body text-muted-foreground">
            L'import remplace toutes les lignes des critères d'avancement de ce projet.
          </p>
          {erreur && <p className="text-body text-destructive">{erreur}</p>}
          <BarreIcones className="flex items-center justify-end gap-1">
            <Button type="button" size="sm" disabled={envoi || sourceId === ''}
              onClick={() => void envoyer(() => importCriteresProjet(projetId, { projetSourceId: sourceId }), onImporte)}>
              <Download /> Importer et remplacer
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={envoi} onClick={onClose}><X /> Annuler</Button>
          </BarreIcones>
        </div>
      )}
    </Modal>
  );
}
