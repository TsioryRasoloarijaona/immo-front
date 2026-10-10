import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, ErrorState, LoadingState } from '../../../components/ui';
import { creerProprietaireSyndic, lireProprietaireSyndic, modifierProprietaireSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { rafraichir } from '../virements/contexte';
import CadreSyndic from './CadreSyndic';
import { codeNormalise, texteErreur } from './donnees';
import FormulaireProprietaire from './FormulaireProprietaire';
import { VIDE, valeursDe, versSaisie, type Valeurs } from './proprietaire';
import type { Proprietaire } from './types';

const fiche = (code: string) => `/outils/syndic/appartements/${encodeURIComponent(code)}`;

/** `/outils/syndic/proprietaires/nouveau[?appartement=]` et `/outils/syndic/proprietaires/:id[?retour=]`. */
export default function ProprietaireSyndic() {
  const { id = 'nouveau' } = useParams();
  const nouveau = id === 'nouveau';
  return (
    <CadreSyndic ecran={nouveau ? 'Nouveau propriétaire' : 'Modifier un propriétaire'}>
      {() => (nouveau ? <Edition key="nouveau" existant={null} /> : <Chargement key={id} id={id} />)}
    </CadreSyndic>
  );
}

function Chargement({ id }: Readonly<{ id: string }>) {
  const { data, error } = useApi(() => lireProprietaireSyndic(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return <Edition existant={data} />;
}

function Edition({ existant }: Readonly<{ existant: Proprietaire | null }>) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const appartement = params.get('appartement') ? codeNormalise(params.get('appartement') ?? '') : null;
  // Seuls les retours internes au module sont suivis.
  const retourDemande = params.get('retour');
  const retour = retourDemande?.startsWith('/outils/syndic/') ? retourDemande : null;
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const destination = retour ?? (appartement ? fiche(appartement) : '/outils/syndic/appartements');

  async function envoyer(v: Valeurs) {
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      const r = existant
        ? await modifierProprietaireSyndic(existant.id, versSaisie(v))
        : await creerProprietaireSyndic(versSaisie(v), appartement ?? undefined);
      rafraichir();
      void navigate(destination, { state: { phrase: r.phrase } });
    } catch (e) {
      setErreur(texteErreur(e));
      setEnCours(false);
    }
  }

  let titre = existant ? `Modifier ${existant.nom_affiche}` : 'Nouveau propriétaire';
  if (!existant && appartement) titre = `Nouveau propriétaire de ${appartement}`;
  return (
    <div className="max-w-xl">
      <Card title={titre}>
        {existant && existant.appartements.length > 0 && (
          <p className="mb-3 text-body text-muted-foreground">Propriétaire de {existant.appartements.join(', ')}.</p>
        )}
        <FormulaireProprietaire
          initial={existant ? valeursDe(existant) : VIDE}
          enCours={enCours}
          erreur={erreur}
          onEnvoyer={(v) => void envoyer(v)}
          onAnnuler={() => void navigate(destination)}
        />
      </Card>
    </div>
  );
}
