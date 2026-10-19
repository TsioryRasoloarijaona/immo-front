import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getObjectifCommercial, modifierObjectifCommercial } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';

/** Réservé à l'Administrateur (le serveur refuse les autres en 403) ; entier de 1 à 1000. */
export default function ReglageObjectif({ onModifie }: Readonly<{ onModifie: () => void }>) {
  const objectif = useApi(getObjectifCommercial, [], 'suivi-commerciaux-objectif');
  const showToast = useToast();
  const [saisie, setSaisie] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const valeur = Number(saisie);
  const valide = saisie !== null && Number.isInteger(valeur) && valeur >= 1 && valeur <= 1000;

  async function enregistrer() {
    setEnvoi(true);
    try {
      await modifierObjectifCommercial({ objectifPersonnesJointesJour: valeur });
      setSaisie(null);
      showToast({ texte: `Objectif fixé à ${formatNumber(valeur)} personnes jointes par jour.`, variante: 'succes' });
      void objectif.refetch();
      onModifie();
    } catch (e: unknown) {
      showToast({ texte: errorMessage(e), variante: 'erreur' });
    } finally {
      setEnvoi(false);
    }
  }

  const actuel = objectif.data?.objectifPersonnesJointesJour;
  if (saisie === null) {
    return (
      <Button type="button" variant="outline" size="sm" disabled={actuel === undefined} onClick={() => setSaisie(String(actuel))}>
        <Pencil data-icon="inline-start" /> Objectif : {formatNumber(actuel)} / jour
      </Button>
    );
  }
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valide) void enregistrer();
      }}
    >
      <Input
        type="number"
        min={1}
        max={1000}
        step={1}
        aria-label="Objectif de personnes jointes par jour"
        className="w-24"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={!valide || envoi}>
        Enregistrer
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setSaisie(null)}>
        Annuler
      </Button>
    </form>
  );
}
