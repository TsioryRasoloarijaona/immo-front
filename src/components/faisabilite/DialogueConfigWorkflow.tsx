import { useState } from 'react';
import Modal from '../Modal';
import SectionsSaisie, { type ListesChoix } from '../patrimoine/SectionsSaisie';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { brouillonDepuis, champsDe, corpsDepuis, useSaisie, type Choix, type SectionSaisie } from '../../lib/saisiePatrimoine';
import type { DocumentAJoindreDto } from '../../types/faisabilite';
import DocumentsAJoindreSaisie from './DocumentsAJoindreSaisie';

/** Dialogue commun d'un statut ou d'une transition : champs, listes à cases (rôles, champs obligatoires) et documents. */
export default function DialogueConfigWorkflow({ titre, sections, source, listes, typesDocument, lecture, aide, onValider, onClose }: Readonly<{
  titre: string;
  sections: SectionSaisie[];
  /** DTO édité (ou valeurs par défaut d'une création). */
  source: object & { documents?: DocumentAJoindreDto[] | null };
  listes: ListesChoix;
  typesDocument: Choix;
  lecture: boolean;
  aide?: string;
  onValider: (corps: Record<string, unknown>, documents: DocumentAJoindreDto[]) => Promise<unknown>;
  onClose: () => void;
}>) {
  const champs = champsDe(sections);
  const saisie = useSaisie(champs, brouillonDepuis(champs, source));
  const [documents, setDocuments] = useState<DocumentAJoindreDto[]>(source.documents ?? []);

  return (
    <Modal title={titre} onClose={onClose} width={820}>
      <div className="flex flex-col gap-3">
        {aide && <p className="text-micro text-muted-foreground">{aide}</p>}
        <SectionsSaisie sections={sections} brouillon={saisie.brouillon} onChange={saisie.modifier} listes={listes}
          verrouilles={lecture ? champs.map((c) => c.nom) : []} champErreur={saisie.champErreur} messageErreur={saisie.erreur} />
        <DocumentsAJoindreSaisie valeur={documents} onChange={setDocuments} types={typesDocument} desactive={lecture} />
        {saisie.erreur && !saisie.champErreur && <p role="alert" className="whitespace-pre-line text-body text-destructive">{saisie.erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={saisie.envoi}>{lecture ? 'Fermer' : 'Annuler'}</Button>
        {!lecture && (
          <Button type="button" disabled={saisie.envoi}
            onClick={() => void saisie.envoyer(() => onValider(corpsDepuis(champs, saisie.brouillon), documents), onClose)}>
            Enregistrer
          </Button>
        )}
      </DialogFooter>
    </Modal>
  );
}
