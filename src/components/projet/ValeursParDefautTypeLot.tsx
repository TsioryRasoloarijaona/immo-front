import { useState } from 'react';
import { Save } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import SearchableSelect from '../SearchableSelect';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { getTypeLotParDefaut, setTypeLotParDefaut } from '../../lib/apiProjetConfig';
import { useAuth } from '../../lib/auth';
import { texteBrut } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { useSaisie } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { useApi } from '../../lib/useApi';

/** Onglet « Valeurs par défaut » des types de lot : lecture pour tous, enregistrement Administrateur. */
export default function ValeursParDefautTypeLot() {
  const toast = useToast();
  const admin = estAdministrateur(useAuth().user);
  const defaut = useApi(getTypeLotParDefaut, []);
  const types = useApi(() => listLignesReferentiel('types-lot'), []);
  const [choisi, setChoisi] = useState<string | null | undefined>(undefined);
  const { envoi, erreur, envoyer } = useSaisie([], {});
  const erreurLecture = defaut.error ?? types.error;
  const valeur = choisi === undefined ? defaut.data?.typeLotId ?? null : choisi;
  const items = (types.data ?? []).filter((t) => t.id).map((t) => ({
    value: String(t.id),
    label: `${texteBrut(t.code)} ${texteBrut(t.description)}`.trim(),
  }));

  return (
    <div className="flex max-w-md flex-col gap-3 p-1">
      {(defaut.loading && !defaut.data) || (types.loading && !types.data) ? <LoadingState /> : null}
      {erreurLecture && <ErrorState message={erreurLecture} />}
      {!erreurLecture && defaut.data && types.data && (
        <>
          <Field>
            <FieldLabel htmlFor="type-lot-defaut">Type par défaut</FieldLabel>
            <SearchableSelect id="type-lot-defaut" items={items} value={valeur} disabled={!admin}
              placeholder="Aucun type par défaut" emptyMessage="Aucun type de lot" className="w-full min-w-0"
              onValueChange={(v) => setChoisi(v)} />
          </Field>
          {erreur && <p className="text-body text-destructive">{erreur}</p>}
          {admin && (
            <BarreIcones className="flex items-center gap-1">
              {valeur && <Button type="button" variant="outline" size="sm" onClick={() => setChoisi(null)}>Effacer</Button>}
              <Button type="button" size="sm" disabled={envoi}
                onClick={() => void envoyer(() => setTypeLotParDefaut({ typeLotId: valeur }), () => toast('Enregistré.'))}>
                <Save /> Enregistrer
              </Button>
            </BarreIcones>
          )}
        </>
      )}
    </div>
  );
}
