import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { ChampSelect, PiedFormulaire } from '../../components/patrimoine/SaisiePatrimoine';
import { libelleReference } from '../../lib/colonnesOnglet';
import { Button } from '../../components/ui/button';
import { chargerTrancheDepuis, deleteTranche, listTranches } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { useSoumission } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { TrancheDetailDto } from '../../types';

/** Boutons administrateur de la fiche : « Charger à partir d'une autre tranche » et « Supprimer ». */
export default function ActionsTranche({ t, onCharge }: Readonly<{ t: TrancheDetailDto; onCharge: () => void }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const toast = useToast();
  const [suppression, setSuppression] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function supprimer() {
    const ok = await confirmer({
      title: 'Supprimer la tranche',
      message: `Supprimer la tranche « ${t.description ?? t.code} » ? Ses terrains, onglets, habilitations, pièces jointes et notes seront supprimés avec elle.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    setSuppression(true);
    try {
      await deleteTranche(t.id);
      toast({ texte: 'Tranche supprimée.', variante: 'succes' });
      void navigate('/tranches');
    } catch (err) {
      // 409 : le message du serveur liste les tables qui référencent la tranche.
      toast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setSuppression(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setChargement(true)}>
        <Copy data-icon="inline-start" /> Charger à partir d'une autre tranche
      </Button>
      <Button variant="outline" size="sm" disabled={suppression} onClick={() => void supprimer()}>
        <Trash2 data-icon="inline-start" /> {suppression ? 'Suppression…' : 'Supprimer'}
      </Button>
      {chargement && (
        <ChargerDialog
          t={t}
          onClose={() => setChargement(false)}
          onCharge={() => {
            setChargement(false);
            onCharge();
          }}
        />
      )}
    </>
  );
}

const toutesLesTranches = () => listTranches(undefined, { page: 0, size: 500 }, { colonnes: ['code', 'description'] });

function ChargerDialog({ t, onClose, onCharge }: Readonly<{ t: TrancheDetailDto; onClose: () => void; onCharge: () => void }>) {
  const { data, error } = useApi(toutesLesTranches, []);
  const [sourceId, setSourceId] = useState<string | undefined>();
  const { enCours, erreur, soumettre } = useSoumission();
  const confirmer = useConfirm();
  const toast = useToast();
  const options = (data?.content ?? [])
    .filter((x) => x.id !== t.id)
    .map((x) => ({ value: x.id, label: libelleReference(x.code, x.description) }));

  async function charger() {
    const source = data?.content.find((x) => x.id === sourceId);
    if (!sourceId || !source) return;
    const ok = await confirmer({
      title: 'Charger à partir d’une autre tranche',
      message: `Les paramètres de la tranche ${source.description ?? source.code} vont remplacer ceux de la tranche en cours. Continuer ?`,
      confirmLabel: 'Charger',
    });
    if (!ok) return;
    await soumettre(() => chargerTrancheDepuis(t.id, sourceId), () => {
      toast({ texte: 'Paramètres chargés.', variante: 'succes' });
      onCharge();
    });
  }

  return (
    <Modal title="Charger à partir d'une autre tranche" onClose={onClose} width={520}>
      <div className="flex flex-col gap-3.5">
        <p className="text-body text-muted-foreground">
          Reprend les paramètres (coordonnées, règles de gestion, remises, cadeaux, délais) et fusionne les étages, le plancher couvert
          et les frais. Ni terrains, ni dates, ni seuils de versement.
        </p>
        {error ? (
          <p role="alert" className="text-body text-destructive">{error}</p>
        ) : (
          <ChampSelect id="charger-source" libelle="Tranche source" requis options={options} valeur={sourceId} onChange={setSourceId}
            message={erreur?.champ === 'sourceId' ? erreur.message : null} />
        )}
        <PiedFormulaire erreur={erreur} enCours={enCours} libelle="Charger" onAnnuler={onClose} onValider={() => void charger()} desactive={!sourceId} />
      </div>
    </Modal>
  );
}
