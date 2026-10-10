import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Field as FormField, FieldDescription, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { creerAppartementSyndic } from '../../../lib/syndic';
import { rafraichir } from '../virements/contexte';
import CadreSyndic from './CadreSyndic';
import { codeNormalise, texteErreur } from './donnees';

const FORME_DU_CODE = /^([A-Z]{2,5})-(\d{1,2})-(\d{1,3})$/;

/** « étage 3, appartement 21 » — ce que le code dit, avant de l'envoyer (le service refait le contrôle). */
function situationEnClair(code: string): string | null {
  const m = FORME_DU_CODE.exec(codeNormalise(code));
  if (!m) return null;
  const etage = m[2] === '0' ? 'rez-de-chaussée' : `étage ${Number(m[2])}`;
  return `${etage}, appartement ${Number(m[3])}`;
}

export default function NouvelAppartementSyndic() {
  return <CadreSyndic ecran="Nouvel appartement">{() => <Formulaire />}</CadreSyndic>;
}

/** Syndic-admod : le code seul (et le n° de dossier) ; étage et numéro s'en déduisent. Ensuite, son propriétaire. */
function Formulaire() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [dossier, setDossier] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const situation = situationEnClair(code);

  async function envoyer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      const r = await creerAppartementSyndic(codeNormalise(code), dossier.trim());
      rafraichir();
      void navigate(`/outils/syndic/appartements/${encodeURIComponent(r.appartement.code)}`, { state: { phrase: r.phrase } });
    } catch (err) {
      setErreur(texteErreur(err));
      setEnCours(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Link to="/outils/syndic/appartements" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'self-start' })}>
        <ArrowLeft data-icon="inline-start" /> Appartements
      </Link>
      <Card title="Nouvel appartement">
        <form onSubmit={envoyer} autoComplete="off" noValidate>
          <FieldGroup>
            <FormField>
              <FieldLabel htmlFor="sy-code">Code de l’appartement</FieldLabel>
              <Input id="sy-code" value={code} placeholder="APF-3-21" maxLength={20} onChange={(e) => setCode(e.target.value)} />
              <FieldDescription>{situation ? `Ce sera : ${situation}.` : 'Les lettres, l’étage, le numéro : APF-3-21.'}</FieldDescription>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="sy-dossier">N° de dossier (facultatif)</FieldLabel>
              <Input id="sy-dossier" value={dossier} maxLength={50} onChange={(e) => setDossier(e.target.value)} />
            </FormField>
          </FieldGroup>
          {erreur && (
            <p role="alert" className="mt-3 text-body text-destructive">
              {erreur}
            </p>
          )}
          <Button type="submit" className="mt-4" disabled={enCours || !code.trim()}>
            {enCours ? 'Création…' : 'Créer l’appartement'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
