import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarreIcones from '../../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import SearchableSelect from '../../../components/SearchableSelect';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { creerDemandeAchatDepuisLot } from '../../../lib/apiDemandesAchat';
import { getDemandesAchatLot } from '../../../lib/apiProjet';
import { listLignesReferentiel } from '../../../lib/apiReferentielsAdmin';
import { useApi } from '../../../lib/useApi';
import type { DemandeAchatLotDto } from '../../../types/projet';

const COLONNES: ColonneGrille<DemandeAchatLotDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 6 },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 6 },
  { nom: 'procedureAchat', libelle: 'Procédure', largeur: 8 },
  { nom: 'statutDescription', libelle: 'Statut', largeur: 8 },
  { nom: 'description', libelle: 'Description', largeur: 20 },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 14 },
  { nom: 'notes', libelle: 'Notes', largeur: 14 },
];

function DialogueAjoutDia({ lotId, onAnnuler }: Readonly<{ lotId: string; onAnnuler: () => void }>) {
  const navigate = useNavigate();
  const procedures = useApi(() => listLignesReferentiel('procedures-achat'), [], 'procedures-achat');
  const [procedureId, setProcedureId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const options = (procedures.data ?? []).flatMap((l) => {
    const libelle = [l.description, l.libelle, l.code].find((v): v is string => typeof v === 'string' && v !== '');
    return l.id ? [{ label: libelle ?? l.id, value: l.id }] : [];
  });

  function creer() {
    setEnCours(true);
    setErreur(null);
    creerDemandeAchatDepuisLot(lotId, { procedureId, description: description.trim() || null })
      .then((fiche) => navigate(`/achat/demandes-achat/${fiche.id}`))
      .catch((err: unknown) => {
        setEnCours(false);
        setErreur(err instanceof Error ? err.message : 'La création de la demande a échoué.');
      });
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une demande interne d'achat</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <SearchableSelect label="Procédure d'achat" placeholder="Procédure d'achat" items={options} value={procedureId} onValueChange={setProcedureId} />
          <Textarea aria-label="Description" rows={3} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button type="button" disabled={enCours} onClick={creer}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OngletDemandesAchat({ lotId }: Readonly<{ lotId: string }>) {
  const { data, loading, error } = useApi(() => getDemandesAchatLot(lotId), [lotId]);
  const [ajout, setAjout] = useState(false);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setAjout(true)}>
          <Plus /> Ajouter une DIA
        </Button>
      </BarreIcones>
      {data.length === 0 ? (
        <EmptyState title="Aucune demande interne d'achat pour ce lot" />
      ) : (
        <DataGrid rows={data} colonnes={COLONNES} cleOrdre="projet-lot-demandes-achat" bandeauRegroupement={false} />
      )}
      {ajout && <DialogueAjoutDia lotId={lotId} onAnnuler={() => setAjout(false)} />}
    </div>
  );
}
