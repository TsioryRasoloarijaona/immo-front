import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ajouterModaliteDemandeAchat, getModalitesDemandeAchat, supprimerModaliteDemandeAchat } from '../../lib/apiDemandesAchat';
import { useConfirm } from '../../lib/confirmContext';
import { formatPercent } from '../../lib/format';
import { refetchAllApis, useApi } from '../../lib/useApi';
import { useEcriture } from '../../lib/useEcriture';
import type { DemandeAchatFiche, ModaliteDemandeAchat } from '../../types/demandesAchat';

const COLONNES: ColonneGrille<ModaliteDemandeAchat & { id: string }>[] = [
  { nom: 'ordre', libelle: 'O.D.T.', type: 'NOMBRE', largeur: 4 },
  { nom: 'code', libelle: 'Code', largeur: 10 },
  { nom: 'ratio', libelle: 'Ratio', type: 'NOMBRE', largeur: 6, rendu: (m) => formatPercent(m.ratio, 2), formatValeur: (v) => formatPercent(Number(v), 2) },
];

function nombreSaisi(texte: string): number | null {
  const n = Number(texte.replace(',', '.'));
  return texte.trim() === '' || Number.isNaN(n) ? null : n;
}

/** Modalités de paiement de la demande : ajout et suppression ; le total des ratios n'est qu'une information. */
export default function OngletModalitesDemandeAchat({ fiche, verrouille }: Readonly<{ fiche: DemandeAchatFiche; verrouille: boolean }>) {
  const { id } = fiche;
  const modalites = useApi(() => getModalitesDemandeAchat(id), [id]);
  const confirmer = useConfirm();
  const { executer, occupe } = useEcriture();
  const [selection, setSelection] = useState<string | null>(null);
  const [ordre, setOrdre] = useState('');
  const [code, setCode] = useState('');
  const [pourcent, setPourcent] = useState('');

  async function ajouter() {
    const p = nombreSaisi(pourcent);
    if (!code.trim() || p === null) return;
    const corps = { ordre: nombreSaisi(ordre), code: code.trim(), ratio: p / 100 };
    if (await executer(() => ajouterModaliteDemandeAchat(id, corps))) {
      setOrdre('');
      setCode('');
      setPourcent('');
      refetchAllApis();
    }
  }

  async function supprimer() {
    if (!selection || !(await confirmer({ title: 'Supprimer', message: 'Voulez-vous vraiment supprimer cet enregistrement ?', confirmLabel: 'Supprimer' }))) return;
    if (await executer(() => supprimerModaliteDemandeAchat(id, selection))) {
      setSelection(null);
      refetchAllApis();
    }
  }

  if (modalites.error) return <ErrorState message={modalites.error} />;
  if (!modalites.data) return <LoadingState />;
  const lignes = modalites.data.flatMap((m) => (m.id ? [{ ...m, id: m.id }] : []));
  const total = lignes.reduce((s, m) => s + (m.ratio ?? 0), 0);
  return (
    <div className="flex flex-col gap-2">
      {!verrouille && (
        <div className="flex flex-wrap items-end gap-2">
          <Input aria-label="O.D.T." placeholder="O.D.T." inputMode="numeric" className="w-20" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          <Input aria-label="Code" placeholder="Code" className="w-40" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input aria-label="Ratio en %" placeholder="Ratio %" inputMode="decimal" className="w-24" value={pourcent} onChange={(e) => setPourcent(e.target.value)} />
          <BarreIcones className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" disabled={occupe || !code.trim() || nombreSaisi(pourcent) === null} onClick={() => void ajouter()}>
              <Plus /> Ajouter
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={occupe || !selection} onClick={() => void supprimer()}>
              <Trash2 /> Supprimer
            </Button>
          </BarreIcones>
        </div>
      )}
      {lignes.length === 0 ? (
        <EmptyState title="Aucune modalité de paiement" />
      ) : (
        <>
          <DataGrid rows={lignes} colonnes={COLONNES} cleOrdre="achat-demande-modalites" bandeauRegroupement={false}
            selection={{
              ids: new Set(selection ? [selection] : []),
              onToggle: (rid) => setSelection((s) => (s === rid ? null : rid)),
              onToggleAll: () => setSelection(null),
            }} />
          <p className="text-label text-muted-foreground">Total des ratios : {formatPercent(total, 2)}</p>
        </>
      )}
    </div>
  );
}
