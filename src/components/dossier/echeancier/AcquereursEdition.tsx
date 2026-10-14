import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '../../ui';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { enregistrerAcquereurs } from '../../../lib/apiDossierSousListes';
import { lireMontant } from '../../../lib/dossierSousListes';
import { formatPercentValue } from '../../../lib/format';
import { useEcriture } from '../../../lib/useEcriture';
import type { AcquereursDto } from '../../../types/dossierSousListes';
import RechercheTiers from './RechercheTiers';

interface LigneSaisie {
  tiersId: string;
  nom: string;
  part: string;
}

function PartInput({ libelle, valeur, onChange }: Readonly<{ libelle: string; valeur: string; onChange: (v: string) => void }>) {
  return (
    <div className="flex items-center gap-1">
      <Input aria-label={libelle} inputMode="decimal" className="w-24 text-right" value={valeur} onChange={(e) => onChange(e.target.value)} />
      <span className="text-label text-muted-foreground">%</span>
    </div>
  );
}

/** Édition de la répartition : la part du principal > 0 et Σ = 100 % (contrôlés aussi par le serveur, 400). */
export default function AcquereursEdition({
  dossierId,
  donnees,
  onEnregistre,
  onAnnuler,
}: Readonly<{
  dossierId: string;
  donnees: AcquereursDto;
  onEnregistre: (resultat: AcquereursDto) => Promise<void>;
  onAnnuler: () => void;
}>) {
  const principal = donnees.acquereurs.find((a) => a.principal);
  const [partPrincipal, setPartPrincipal] = useState(String(principal?.quotePart ?? 100));
  const [lignes, setLignes] = useState<LigneSaisie[]>(() =>
    donnees.acquereurs
      .filter((a) => !a.principal && a.tiersId)
      .map((a) => ({ tiersId: a.tiersId ?? '', nom: a.nom ?? '', part: String(a.quotePart ?? 0) })),
  );
  const { occupe, executer } = useEcriture();

  const parts = [lireMontant(partPrincipal) ?? 0, ...lignes.map((l) => lireMontant(l.part) ?? 0)];
  const total = Math.round(parts.reduce((s, p) => s + p, 0) * 10000) / 10000;
  const valide = (lireMontant(partPrincipal) ?? 0) > 0 && total === 100;
  const exclus = new Set([principal?.tiersId ?? '', ...lignes.map((l) => l.tiersId)]);

  function changerPart(tiersId: string, part: string) {
    setLignes((prec) => prec.map((l) => (l.tiersId === tiersId ? { ...l, part } : l)));
  }

  async function enregistrer() {
    const corps = {
      quotePartPrincipal: lireMontant(partPrincipal) ?? 0,
      coAcquereurs: lignes.map((l) => ({ tiersId: l.tiersId, quotePart: lireMontant(l.part) ?? 0 })),
    };
    await executer(async () => onEnregistre(await enregistrerAcquereurs(dossierId, corps)), 'Répartition enregistrée.');
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 p-2.5">
        <Badge tone="info">Principal</Badge>
        <span className="min-w-0 flex-1 truncate text-label font-medium">{principal?.nom || 'Client principal'}</span>
        <PartInput libelle="Part du client principal" valeur={partPrincipal} onChange={setPartPrincipal} />
      </div>
      {lignes.map((l) => (
        <div key={l.tiersId} className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 p-2.5">
          <Badge tone="neutral">Co-acquéreur</Badge>
          <span className="min-w-0 flex-1 truncate text-label font-medium">{l.nom}</span>
          <PartInput libelle={`Part de ${l.nom}`} valeur={l.part} onChange={(v) => changerPart(l.tiersId, v)} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Retirer ${l.nom}`}
            onClick={() => setLignes((prec) => prec.filter((x) => x.tiersId !== l.tiersId))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <RechercheTiers exclus={exclus} onChoisir={(t) => setLignes((prec) => [...prec, { tiersId: t.id, nom: t.nom, part: '0' }])} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className={valide ? 'text-label text-muted-foreground' : 'text-label font-medium text-(--warning)'}>
          Total {formatPercentValue(total)}
          {!valide && ' — la somme doit faire 100 % et la part du principal être positive'}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={onAnnuler}>Annuler</Button>
        <Button type="button" size="sm" disabled={occupe || !valide} onClick={() => void enregistrer()}>Enregistrer</Button>
      </div>
    </div>
  );
}
