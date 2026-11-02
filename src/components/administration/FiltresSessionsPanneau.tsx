import { Eraser, RefreshCw, XCircle } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import SelectFiltre from '../SelectFiltre';
import PeriodeFiltre from '../liste/PeriodeFiltre';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { EtatFiltresSessions, EtatOuverte } from '../../lib/sessions';

const OUVERTE: { label: string; value: EtatOuverte }[] = [
  { label: 'Ouverte : tous', value: 'tous' },
  { label: 'Ouverte : oui', value: 'oui' },
  { label: 'Ouverte : non', value: 'non' },
];

export default function FiltresSessionsPanneau({
  filtres,
  utilisateurs,
  fermable,
  onChange,
  onRafraichir,
  onEffacer,
  onFermer,
}: Readonly<{
  filtres: EtatFiltresSessions;
  utilisateurs: string[];
  fermable: boolean;
  onChange: (f: EtatFiltresSessions) => void;
  onRafraichir: () => void;
  onEffacer: () => void;
  onFermer: () => void;
}>) {
  const itemsUtilisateurs = [{ label: 'Utilisateur : tous', value: 'tous' }, ...utilisateurs.map((u) => ({ label: u, value: u }))];
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5">
      <PeriodeFiltre debut={filtres.debut} fin={filtres.fin} onChange={(debut, fin) => onChange({ ...filtres, debut, fin })} />
      <SelectFiltre ariaLabel="Utilisateur" items={itemsUtilisateurs} value={filtres.utilisateur} onChange={(utilisateur) => onChange({ ...filtres, utilisateur })} />
      <SelectFiltre ariaLabel="Ouverte" items={OUVERTE} value={filtres.ouverte} onChange={(ouverte) => onChange({ ...filtres, ouverte })} />
      <Input
        type="search"
        aria-label="Adresse IP"
        placeholder="Adresse IP…"
        className="w-44"
        value={filtres.ip}
        onChange={(e) => onChange({ ...filtres, ip: e.target.value })}
      />
      <BarreIcones className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onRafraichir}>
          <RefreshCw /> Rafraîchir
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onEffacer}>
          <Eraser /> Effacer les filtres
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={!fermable} onClick={onFermer}>
          <XCircle /> Fermer la session
        </Button>
      </BarreIcones>
    </div>
  );
}
