import { useMemo, useState } from 'react';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Square, Undo2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import FicheRendezVousFenetre from '../../components/rendezVous/FicheRendezVousFenetre';
import GrilleCalendrier from '../../components/rendezVous/GrilleCalendrier';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { listCalendrierRendezVous, modifierRendezVous } from '../../lib/apiRendezVous';
import { corpsDeplacement, decalerAncre, joursDeVue, parseJour, titreVue, type VueCalendrier } from '../../lib/calendrierRendezVous';
import { jourISO, pluriel } from '../../lib/format';
import { HEURE_PAR_DEFAUT, NOUVEAU_RENDEZ_VOUS } from '../../lib/saisieRendezVous';
import { useChoixPersonnes } from '../../lib/useChoixRendezVous';
import { errorMessage, refetchAllApis, useApi } from '../../lib/useApi';
import useFenetreListe from '../../lib/useFenetreListe';

const BASE = '/administration/calendrier';
const VUES: { vue: VueCalendrier; libelle: string; Icone: typeof Square }[] = [
  { vue: 'mois', libelle: 'Mois', Icone: CalendarDays },
  { vue: 'semaine', libelle: 'Semaine', Icone: CalendarRange },
  { vue: 'jour', libelle: 'Jour', Icone: Square },
];

/** `/administration/calendrier` : rendez-vous par mois, semaine (lundi à vendredi) ou jour, Administrateur seul. */
export default function CalendrierRendezVous() {
  const [vue, setVue] = useState<VueCalendrier>('mois');
  const [ancre, setAncre] = useState(() => new Date());
  const [personnelId, setPersonnelId] = useState<string | null>(null);
  const [erreurDeplacement, setErreurDeplacement] = useState<string | null>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const personnes = useChoixPersonnes();
  const jours = useMemo(() => joursDeVue(vue, ancre), [vue, ancre]);
  const debut = jourISO(jours[0]);
  const fin = jourISO(jours[jours.length - 1]);

  const { data, loading, error } = useApi(
    () => listCalendrierRendezVous({ debut, fin, gestionnaireId: personnelId ?? undefined }),
    [debut, fin, personnelId],
  );
  const rdvs = data ?? [];
  const fenetre = useFenetreListe(BASE, rdvs.map((r) => r.id));

  async function deposer(id: string, jour: string) {
    const rdv = rdvs.find((r) => r.id === id);
    if (!rdv || !rdv.datePrevue || rdv.datePrevue.slice(0, 10) === jour) return;
    setErreurDeplacement(null);
    try {
      await modifierRendezVous(id, corpsDeplacement(rdv, jour));
      refetchAllApis();
    } catch (err) {
      setErreurDeplacement(errorMessage(err));
    }
  }

  function voirJour(jour: string) {
    setAncre(parseJour(jour));
    setVue('jour');
  }

  const decaler = (sens: 1 | -1) => setAncre((a) => decalerAncre(vue, a, sens));
  const titre = titreVue(vue, jours, ancre);

  return (
    <PageListe titre="Calendrier">
      <EnteteListe titre="Calendrier" lignes={titre}>
        <Button type="button" variant="ghost" size="sm" onClick={() => decaler(-1)}>
          <ChevronLeft data-icon="inline-start" /> Précédent
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => decaler(1)}>
          <ChevronRight data-icon="inline-start" /> Suivant
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAncre(new Date())}>
          <Undo2 data-icon="inline-start" /> Aujourd'hui
        </Button>
        {VUES.map(({ vue: v, libelle, Icone }) => (
          <Button key={v} type="button" variant={v === vue ? 'secondary' : 'ghost'} size="sm" aria-pressed={v === vue} onClick={() => setVue(v)}>
            <Icone data-icon="inline-start" /> {libelle}
          </Button>
        ))}
      </EnteteListe>
      <div className="flex shrink-0 items-center gap-3 px-3 pb-2">
        <BoiteFiltre titre="Personnel" mode="unique" items={personnes} valeur={personnelId} onChange={setPersonnelId} />
        {erreurDeplacement && <p role="alert" className="text-label text-destructive">{erreurDeplacement}</p>}
      </div>
      {loading && !data && !error && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <GrilleCalendrier
          vue={vue}
          jours={jours}
          moisAffiche={ancre.getMonth()}
          rdvs={rdvs}
          onOuvrir={fenetre.ouvrir}
          onCreer={(jour) => void navigate(`${BASE}/${NOUVEAU_RENDEZ_VOUS}?date=${jour}T${HEURE_PAR_DEFAUT}`)}
          onVoirJour={voirJour}
          onDeposer={(id, jour) => void deposer(id, jour)}
        />
      )}
      <BarreEtatListe lignes={data ? pluriel(rdvs.length, 'rendez-vous', 'rendez-vous') : '—'} selection="aucune" />
      {fenetre.idOuvert && (
        <FicheRendezVousFenetre
          key={fenetre.idOuvert}
          id={fenetre.idOuvert}
          dateInitiale={params.get('date') ?? ''}
          voisins={fenetre.voisins}
          onFermer={fenetre.fermer}
          onCree={fenetre.ouvrir}
        />
      )}
    </PageListe>
  );
}
