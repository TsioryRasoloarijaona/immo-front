import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DialogueDefinitionChamp from './DialogueDefinitionChamp';
import { EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field as ChampForm, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { enregistrerChampsSpecifiques, getChampsSpecifiques, getTypesChamps, supprimerDefinitionChamp } from '../../lib/apiChampsSpecifiques';
import { useAuth } from '../../lib/auth';
import {
  grouperParCategorie, saisieEnValeur, typeSaisie, TYPE_BIT, TYPE_LISTE, valeurAffichee, valeurEnSaisie,
} from '../../lib/champsSpecifiques';
import { useConfirm } from '../../lib/confirmContext';
import { estAdministrateur } from '../../lib/roles';
import { useApi } from '../../lib/useApi';
import { useEcriture } from '../../lib/useEcriture';
import type { ChampSpecifiqueDto, PorteurChamps } from '../../types/champsSpecifiques';

function Controle({ champ, valeur, onChange }: Readonly<{
  champ: ChampSpecifiqueDto;
  valeur: string;
  onChange: (v: string) => void;
}>) {
  const id = `champ-${champ.champId}`;
  if (champ.typeDonnee === TYPE_BIT) {
    return <input id={id} type="checkbox" checked={valeur === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} />;
  }
  if (champ.typeDonnee === TYPE_LISTE) {
    return (
      <select id={id} value={valeur} onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-body">
        <option value="">—</option>
        {champ.choix.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    );
  }
  const type = typeSaisie(champ.typeDonnee);
  const pas = champ.typeDonnee === 'Int' ? 1 : 'any';
  return <Input id={id} type={type} step={type === 'number' ? pas : undefined} value={valeur} onChange={(e) => onChange(e.target.value)} />;
}

function LigneChamp({ champ, valeur, admin, onChange, onModifier, onSupprimer }: Readonly<{
  champ: ChampSpecifiqueDto;
  valeur: string;
  admin: boolean;
  onChange: (v: string) => void;
  onModifier: () => void;
  onSupprimer: () => void;
}>) {
  const libelle = `${champ.libelle ?? ''}${champ.obligatoire ? ' *' : ''}`;
  if (!admin) return <Field label={libelle} value={valeurAffichee(champ)} />;
  return (
    <ChampForm>
      <div className="flex items-center justify-between gap-1">
        <FieldLabel htmlFor={`champ-${champ.champId}`}>{libelle}</FieldLabel>
        <span className="flex shrink-0">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Modifier la définition de ${champ.libelle ?? 'ce champ'}`} onClick={onModifier}>
            <Pencil />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Supprimer ${champ.libelle ?? 'ce champ'}`} onClick={onSupprimer}>
            <Trash2 />
          </Button>
        </span>
      </div>
      <Controle champ={champ} valeur={valeur} onChange={onChange} />
    </ChampForm>
  );
}

/**
 * Champs spécifiques (GEN0007) d'un objet : lecture pour qui voit l'objet ; saisie des valeurs et gestion des définitions
 * pour l'Administrateur. Le serveur refuse tout ou rien (400 nommant le champ).
 */
export default function ChampsSpecifiques({ porteur, id }: Readonly<{ porteur: PorteurChamps; id: string }>) {
  const admin = estAdministrateur(useAuth().user);
  const confirm = useConfirm();
  const { occupe, executer } = useEcriture();
  const { data, error, refetch } = useApi(() => getChampsSpecifiques(porteur, id), [porteur, id]);
  const types = useApi(() => (admin ? getTypesChamps() : Promise.resolve<string[]>([])), [admin]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [definition, setDefinition] = useState<{ champ?: ChampSpecifiqueDto } | null>(null);

  const modifies = Object.keys(edits);
  const valeurDe = (champ: ChampSpecifiqueDto) => edits[champ.champId] ?? valeurEnSaisie(champ.typeDonnee, champ.valeur);

  async function enregistrer() {
    const valeurs = (data ?? []).filter((c) => c.champId in edits)
      .map((c) => ({ champId: c.champId, valeur: saisieEnValeur(c.typeDonnee, edits[c.champId]) }));
    const ok = await executer(() => enregistrerChampsSpecifiques(porteur, id, { valeurs }), 'Champs enregistrés.');
    if (ok) {
      setEdits({});
      await refetch();
    }
  }

  async function supprimer(champ: ChampSpecifiqueDto) {
    const oui = await confirm({
      title: 'Supprimer le champ',
      message: `Le champ « ${champ.libelle ?? ''} » et ses valeurs sur tous les objets seront supprimés. Continuer ?`,
      confirmLabel: 'Supprimer',
    });
    if (oui && await executer(() => supprimerDefinitionChamp(porteur, champ.champId), 'Champ supprimé.')) await refetch();
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  return (
    <div className="flex flex-col gap-4">
      {data.length === 0 && <EmptyState title="Aucun champ spécifique défini" />}
      {grouperParCategorie(data).map((groupe) => (
        <section key={groupe.categorie} className="flex flex-col gap-2">
          <h3 className="text-label font-semibold text-foreground">{groupe.categorie}</h3>
          <FieldGrid>
            {groupe.champs.map((champ) => (
              <LigneChamp key={champ.champId} champ={champ} valeur={valeurDe(champ)} admin={admin}
                onChange={(v) => setEdits({ ...edits, [champ.champId]: v })}
                onModifier={() => setDefinition({ champ })} onSupprimer={() => void supprimer(champ)} />
            ))}
          </FieldGrid>
        </section>
      ))}
      {admin && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={occupe || modifies.length === 0} onClick={() => void enregistrer()}>Enregistrer les valeurs</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setDefinition({})}>
            <Plus data-icon="inline-start" /> Nouveau champ
          </Button>
        </div>
      )}
      {definition && (
        <DialogueDefinitionChamp porteur={porteur} champ={definition.champ} types={types.data ?? []}
          onClose={() => setDefinition(null)} onFait={() => void refetch()} />
      )}
    </div>
  );
}
