import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  delierProspectionEtude, lierProspectionEtude, listProspectionsEtude, recopierProspectionEtude,
} from '../../lib/apiFaisabilite';
import { useConfirm } from '../../lib/confirmContext';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { EtudeFaisabiliteDto } from '../../types/faisabilite';

/** Bloc « Prospection terrain » de l'onglet Terrain : lier, recopier les valeurs, délier. Rechargé après chaque action. */
export default function LienProspectionEtude({ fiche, lecture, recharger }: Readonly<{
  fiche: EtudeFaisabiliteDto;
  lecture: boolean;
  /** Relit l'étude et repart d'un brouillon propre (les valeurs copiées remplacent la saisie). */
  recharger: () => void;
}>) {
  const confirm = useConfirm();
  const showToast = useToast();
  const prospections = useApi(() => (lecture ? Promise.resolve([]) : listProspectionsEtude()), [lecture]);
  const [choix, setChoix] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const items = (prospections.data ?? []).map((p) => ({ value: p.id, label: [p.code, p.description].filter(Boolean).join(' - ') }));
  const lie = fiche.prospectionTerrainId;

  async function agir(appel: () => Promise<unknown>, message: string) {
    setEnvoi(true);
    setErreur(null);
    try {
      await appel();
      showToast(message);
      setChoix(null);
      recharger();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  async function recopier() {
    const oui = await confirm({
      title: 'Recopier les valeurs',
      message: 'Remplace les surfaces et détache le terrain. Continuer ?',
      confirmLabel: 'Recopier',
      cancelLabel: 'Annuler',
    });
    if (oui) await agir(() => recopierProspectionEtude(fiche.id), 'Valeurs recopiées.');
  }

  return (
    <section aria-labelledby="lien-prospection" className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <h3 id="lien-prospection" className="text-body font-medium">Prospection terrain</h3>
      {lie && (
        <p className="text-body">
          Liée : <Link className="underline" to={`/terrains-prospection/${lie}`}>{fiche.prospectionTerrainDescription ?? 'Voir la fiche'}</Link>
        </p>
      )}
      {!lie && <p className="text-micro text-muted-foreground">Aucune prospection liée.</p>}
      {!lecture && (
        <div className="flex flex-wrap items-center gap-2">
          <Select items={items} value={choix} onValueChange={(v) => setChoix(v || null)} disabled={envoi}>
            <SelectTrigger aria-label="Prospection terrain" className="w-72"><SelectValue placeholder="Choisir une prospection…" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>{items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" disabled={envoi || !choix}
            onClick={() => choix && void agir(() => lierProspectionEtude(fiche.id, choix), 'Prospection liée.')}>Lier</Button>
          <Button type="button" size="sm" variant="outline" disabled={envoi || !lie} onClick={() => void recopier()}>Recopier les valeurs</Button>
          <Button type="button" size="sm" variant="outline" disabled={envoi || !lie}
            onClick={() => void agir(() => delierProspectionEtude(fiche.id), 'Prospection déliée.')}>Délier</Button>
        </div>
      )}
      {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
    </section>
  );
}
