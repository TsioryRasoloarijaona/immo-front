import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import ActionAdmin from '../patrimoine/ActionAdmin';
import TableauLecture, { type ColonneLecture } from '../patrimoine/TableauLecture';
import { Card, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { errorMessage, type ApiState } from '../../lib/useApi';

/** Tableau d'une configuration (statuts, transitions) : ajout, édition et suppression réservés à l'Administrateur. */
export default function TableConfigWorkflow<T extends { id?: string | null }>({ titre, etat, colonnes, libelleAjout, nom, onOuvrir, supprimer }: Readonly<{
  titre: string;
  etat: ApiState<T[]>;
  colonnes: ColonneLecture<T>[];
  libelleAjout: string;
  nom: (ligne: T) => string;
  /** `null` : création. */
  onOuvrir: (ligne: T | null) => void;
  supprimer: (id: string) => Promise<void>;
}>) {
  const admin = estAdministrateur(useAuth().user);
  const confirm = useConfirm();
  const [erreur, setErreur] = useState<string | null>(null);

  async function retirer(ligne: T) {
    if (!ligne.id) return;
    const oui = await confirm({
      title: `Supprimer « ${nom(ligne)} »`, message: 'Cette suppression est définitive. Continuer ?', confirmLabel: 'Supprimer', cancelLabel: 'Annuler',
    });
    if (!oui) return;
    setErreur(null);
    try {
      await supprimer(ligne.id);
      await etat.refetch();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  const actions: ColonneLecture<T> = {
    titre: 'Actions',
    droite: true,
    rendu: (l) => (
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => onOuvrir(l)}>
          <Pencil data-icon="inline-start" /> {admin ? 'Modifier' : 'Consulter'}
        </Button>
        <ActionAdmin variant="outline" libelle="Supprimer" icone={<Trash2 data-icon="inline-start" />} onClick={() => void retirer(l)} />
      </div>
    ),
  };

  return (
    <Card title={`${titre} (${etat.data?.length ?? 0})`} action={<ActionAdmin variant="outline" libelle={libelleAjout} onClick={() => onOuvrir(null)} />}>
      {erreur && <p role="alert" className="mb-2 text-label text-destructive">{erreur}</p>}
      {etat.error && <ErrorState message={etat.error} />}
      {!etat.error && !etat.data && <LoadingState />}
      {!etat.error && etat.data?.length === 0 && <EmptyState title="Aucun élément" message="Rien n'est encore configuré." />}
      {!etat.error && etat.data && etat.data.length > 0 && (
        <TableauLecture lignes={etat.data} colonnes={[...colonnes, actions]} cle={(l, i) => l.id ?? `ligne-${i}`} />
      )}
    </Card>
  );
}
