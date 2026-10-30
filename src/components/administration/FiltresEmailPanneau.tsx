import { Eraser, RefreshCw } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import SelectFiltre from '../SelectFiltre';
import PeriodeFiltre from '../liste/PeriodeFiltre';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { EtatEnvoi, EtatFiltresEmail } from '../../lib/emailHistorique';

const ENVOI: { label: string; value: EtatEnvoi }[] = [
  { label: 'Envoyé : tous', value: 'tous' },
  { label: 'Envoyé : oui', value: 'oui' },
  { label: 'Envoyé : non', value: 'non' },
];

export default function FiltresEmailPanneau({
  filtres,
  utilisateurs,
  onChange,
  onRafraichir,
  onEffacer,
}: Readonly<{
  filtres: EtatFiltresEmail;
  utilisateurs: string[];
  onChange: (f: EtatFiltresEmail) => void;
  onRafraichir: () => void;
  onEffacer: () => void;
}>) {
  const itemsUtilisateurs = [{ label: 'Utilisateur : tous', value: 'tous' }, ...utilisateurs.map((u) => ({ label: u, value: u }))];
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5">
      <PeriodeFiltre debut={filtres.debut} fin={filtres.fin} onChange={(debut, fin) => onChange({ ...filtres, debut, fin })} />
      <SelectFiltre ariaLabel="Utilisateur" items={itemsUtilisateurs} value={filtres.utilisateur} onChange={(utilisateur) => onChange({ ...filtres, utilisateur })} />
      <SelectFiltre ariaLabel="Envoyé" items={ENVOI} value={filtres.envoye} onChange={(envoye) => onChange({ ...filtres, envoye })} />
      <Input
        type="search"
        aria-label="Recherche"
        placeholder="Rechercher…"
        className="w-56"
        value={filtres.texte}
        onChange={(e) => onChange({ ...filtres, texte: e.target.value })}
      />
      <BarreIcones className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onRafraichir}>
          <RefreshCw /> Rafraîchir
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onEffacer}>
          <Eraser /> Effacer les filtres
        </Button>
      </BarreIcones>
    </div>
  );
}
