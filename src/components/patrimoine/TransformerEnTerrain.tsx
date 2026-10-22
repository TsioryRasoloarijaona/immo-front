import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees } from 'lucide-react';
import Modal from '../Modal';
import SectionsSaisie from './SectionsSaisie';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { transformerProspectionEnTerrain } from '../../lib/apiProspectionsTerrain';
import { ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { referentielItems, useCategoriesTerrain, useEntitesReferentiel, useVocations } from '../../lib/referentiels';
import { estAdministrateur } from '../../lib/roles';
import { brouillonDepuis, champsDe, type SectionSaisie } from '../../lib/saisiePatrimoine';
import { errorMessage } from '../../lib/useApi';
import type { ProspectionTerrainDetailDto } from '../../types/prospectionsTerrain';

const SECTION: SectionSaisie = {
  titre: 'Terrain à créer',
  champs: [
    { nom: 'entiteId', libelle: 'Société', type: 'liste', liste: 'entites', obligatoire: true },
    { nom: 'vocationId', libelle: 'Vocation', type: 'liste', liste: 'vocations', obligatoire: true },
    { nom: 'categorieId', libelle: 'Catégorie', type: 'liste', liste: 'categories', obligatoire: true },
    { nom: 'code', libelle: 'Code (défaut : celui de la prospection)', type: 'texte' },
  ],
};
const CHAMPS = champsDe([SECTION]);

function DialogueTransformation({ prospection: p, onClose }: Readonly<{ prospection: ProspectionTerrainDetailDto; onClose: () => void }>) {
  const navigate = useNavigate();
  const entites = useEntitesReferentiel();
  const vocations = useVocations();
  const categories = useCategoriesTerrain();
  const [brouillon, setBrouillon] = useState(() => brouillonDepuis(CHAMPS));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [terrainExistant, setTerrainExistant] = useState<string | null>(null);
  const incomplet = !brouillon.entiteId || !brouillon.vocationId || !brouillon.categorieId;

  async function transformer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const cree = await transformerProspectionEnTerrain(p.id, {
        entiteId: String(brouillon.entiteId),
        vocationId: String(brouillon.vocationId),
        categorieId: String(brouillon.categorieId),
        code: String(brouillon.code).trim() || undefined,
      });
      void navigate(`/terrains/${cree.terrainId}`);
    } catch (err) {
      setErreur(errorMessage(err));
      const existant = err instanceof ApiError ? err.problem?.terrainId : undefined;
      setTerrainExistant(typeof existant === 'string' ? existant : null);
      setEnvoi(false);
    }
  }

  return (
    <Modal title="Transformer en terrain" onClose={onClose} width={560}>
      <SectionsSaisie
        sections={[SECTION]}
        brouillon={brouillon}
        onChange={(nom, valeur) => setBrouillon((b) => ({ ...b, [nom]: valeur }))}
        listes={{
          entites: referentielItems(entites.data),
          vocations: referentielItems(vocations.data),
          categories: referentielItems(categories.data),
        }}
      />
      {erreur && <p role="alert" className="mt-2 text-micro text-destructive">{erreur}</p>}
      {terrainExistant && (
        <Button type="button" variant="link" size="sm" onClick={() => void navigate(`/terrains/${terrainExistant}`)}>Voir le terrain</Button>
      )}
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={envoi || incomplet} onClick={() => void transformer()}>
          <Trees data-icon="inline-start" /> Transformer
        </Button>
      </DialogFooter>
    </Modal>
  );
}

/** « Transformer en terrain » (Administrateur) : désactivé avec son motif en infobulle, confirmation, puis société, vocation et catégorie. */
export default function TransformerEnTerrain({ prospection: p }: Readonly<{ prospection: ProspectionTerrainDetailDto }>) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [ouvert, setOuvert] = useState(false);
  if (!estAdministrateur(user)) return null;

  async function demander() {
    const oui = await confirm({
      title: 'Transformer en terrain',
      message: 'Voulez-vous vraiment transformer cette prospection en terrain ?',
      confirmLabel: 'Oui',
      cancelLabel: 'Non',
    });
    if (oui) setOuvert(true);
  }

  return (
    <>
      <span title={p.peutTransformer ? undefined : (p.motifNonTransformable ?? 'Transformation impossible.')}>
        <Button type="button" size="sm" variant="outline" disabled={!p.peutTransformer} onClick={() => void demander()}>
          <Trees data-icon="inline-start" /> Transformer en terrain
        </Button>
      </span>
      {ouvert && <DialogueTransformation prospection={p} onClose={() => setOuvert(false)} />}
    </>
  );
}
