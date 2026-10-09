import { useState } from 'react';
import { Phone, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import CreateProspectForm from '../../components/CreateProspectForm';
import HotlineResultat from '../../components/HotlineResultat';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { rechercherHotline } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';

// `GET /api/hotline/recherche` ne répond jamais 404 : `connu: false` et listes vides si personne.
type CritereMode = 'telephone' | 'nom';

export default function Hotline() {
  // `queryMode` fige le critère de la requête lancée : basculer le sélecteur ne réinterprète pas le résultat.
  const [mode, setMode] = useState<CritereMode>('telephone');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [queryMode, setQueryMode] = useState<CritereMode>('telephone');
  const [refreshToken, setRefreshToken] = useState(0);
  const [createForProspectionId, setCreateForProspectionId] = useState<string | null>(null);
  const showToast = useToast();

  const { data, loading, error } = useApi(
    () =>
      query
        ? rechercherHotline(queryMode === 'nom' ? { nom: query } : { telephone: query })
        : Promise.resolve(null),
    [query, queryMode, refreshToken],
  );

  // Nom de moins de 2 caractères : 400 côté serveur. Le téléphone n'a pas de minimum, le serveur normalise.
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
    </PageShell>
  );
}
