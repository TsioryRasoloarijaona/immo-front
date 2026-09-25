import { useState } from 'react';
import { Phone, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CreateProspectForm from '../../components/CreateProspectForm';
import HotlineResultat from '../../components/HotlineResultat';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { rechercherHotline } from '../../lib/api';
import { useApi } from '../../lib/useApi';

// Hotline — recherche instantanée "qui m'appelle ?" par numéro de téléphone,
// pour un agent qui décroche. Backed by GET /api/hotline/recherche (V4) :
// jamais 404, `connu: false` + listes vides si personne ne correspond, et
// une liste séparée d'appels passés jamais rattachés à une fiche formelle.
// Toute l'info utile (identité complète, prospections, dossiers, règlements,
// interactions, historique) s'affiche directement sur cette page — l'agent
// est en ligne avec l'appelant, il ne doit pas avoir à naviguer ailleurs
// pour voir qui il a au bout du fil. "Voir la fiche complète" reste
// disponible seulement pour éditer la fiche ou aller plus loin.
//
// Le rendu du résultat vit dans `components/HotlineResultat` depuis le lot
// « suivi des actions » : le détail d'une action l'affiche en boîte, à
// l'identique. Cette page ne garde que le formulaire et l'état de recherche.

/** Les deux critères exclusifs de GET /api/hotline/recherche. */
type CritereMode = 'telephone' | 'nom';

export default function Hotline() {
  // Le critère fait partie de la requête lancée, pas seulement de la saisie :
  // basculer le sélecteur après coup ne doit pas réinterpréter un résultat
  // déjà affiché comme s'il venait de l'autre critère.
  const [mode, setMode] = useState<CritereMode>('telephone');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [queryMode, setQueryMode] = useState<CritereMode>('telephone');
  const [refreshToken, setRefreshToken] = useState(0);
  const [createForProspectionId, setCreateForProspectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data, loading, error } = useApi(
    () =>
      query
        ? rechercherHotline(queryMode === 'nom' ? { nom: query } : { telephone: query })
        : Promise.resolve(null),
    [query, queryMode, refreshToken],
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  // Le serveur refuse un nom de moins de 2 caractères (400) ; on ne l'envoie
  // pas pour ça. Le téléphone, lui, n'a pas de longueur minimale — c'est la
  // présence d'au moins un chiffre exploitable qui compte, et le serveur est
  // seul juge de ce qu'il sait normaliser.
  const saisie = input.trim();
  const saisieValide = mode === 'nom' ? saisie.length >= 2 : saisie.length > 0;

  function submit() {
    if (!saisieValide) return;
    setQueryMode(mode);
    setQuery(saisie);
  }

  function changerMode(suivant: CritereMode) {
    setMode(suivant);
    setInput('');
  }

  return (
    <PageShell title="Hotline" crumbs={[{ label: 'Hotline' }]} icon={<Phone />} accent="var(--sec-accent)" accentBg="var(--sec-accent-bg)" fullHeight>
      {/* Redesign 20/09 : l'écran est piloté par un appel entrant, mais le
          bloc de recherche occupait ~160px en permanence (label + input
          hauteur double + bouton lg + deux lignes d'aide). Une seule ligne
          désormais, l'aide en micro — les fiches trouvées récupèrent la
          hauteur, et seule la zone de résultats défile. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 pt-1">
      <div className="shrink-0">
        <form
          className="flex flex-wrap items-center gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            id="hotline-critere"
            autoFocus
            aria-label={mode === 'nom' ? "Nom de l'appelant" : "Numéro de téléphone de l'appelant"}
            inputMode={mode === 'nom' ? 'text' : 'tel'}
            placeholder={mode === 'nom' ? "Nom de l'appelant — ex. Benani" : "Numéro de l'appelant — 06 12 34 56 78"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-w-65 flex-1"
          />
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {(['telephone', 'nom'] as const).map((m) => (
              <Button
                key={m}
                type="button"
                variant={mode === m ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={mode === m}
                onClick={() => changerMode(m)}
              >
                {m === 'telephone' ? 'Téléphone' : 'Nom'}
              </Button>
            ))}
          </div>
          <Button type="submit" size="sm" disabled={!saisieValide}>
            <Search data-icon="inline-start" /> Rechercher
          </Button>
        </form>
        <p className="mt-1.5 text-micro text-muted-foreground">
          {mode === 'nom' ? (
            <>
              Recherche sur une partie du nom, sans tenir compte de la casse ni des accents — « hejer » trouve
              « Héjér ». Deux caractères minimum, et les 20 premières fiches seulement.
            </>
          ) : (
            <>
              Espaces, tirets, parenthèses et indicatif pays sont ignorés — "+212 6 12 34 56 78", "212612345678" et
              "0612345678" sont reconnus comme le même numéro.
            </>
          )}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      {!query && (
        <div className="mt-1">
          <EmptyState
            title={mode === 'nom' ? "En attente d'un nom" : "En attente d'un numéro"}
            message={
              mode === 'nom'
                ? "Saisissez tout ou partie du nom de l'appelant pour retrouver sa fiche."
                : "Saisissez le numéro de l'appelant pour voir instantanément qui il est."
            }
          />
        </div>
      )}

      {query && loading && <div className="mt-1"><LoadingState /></div>}
      {query && error && <div className="mt-1"><ErrorState message={error} /></div>}

      {query && !loading && !error && data && (
        <HotlineResultat data={data} query={query} onCreerFiche={setCreateForProspectionId} />
      )}
      </div>
      </div>

      {createForProspectionId && (
        <CreateProspectForm
          preProspectionId={createForProspectionId}
          initial={{ phone: data?.telephoneRecherche ?? undefined }}
          onClose={() => setCreateForProspectionId(null)}
          onSubmit={() => {
            setCreateForProspectionId(null);
            setRefreshToken((t) => t + 1);
            showToast('Fiche créée — relancez la recherche pour la voir apparaître.');
          }}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-label font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
