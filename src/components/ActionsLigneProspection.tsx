import { useState, type ReactNode } from 'react';
import { EllipsisVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import InteractionForm from './InteractionForm';
import CreateProspectForm from './CreateProspectForm';
import TransformerProspectionDialog from './TransformerProspectionDialog';
import ArchiverProspectionDialog from './ArchiverProspectionDialog';
import { addInteraction, archiverProspection, desarchiverProspection, transformerProspection } from '../lib/api';
import { useAppData, commercialLabel } from '../lib/appData';
import { useAuth } from '../lib/auth';
import { prospectionDisplayName } from '../lib/domain';
import type { ProspectionListItemDto } from '../types';

/** Le menu « Actions » d'une ligne de liste (prospections et
 * pré-prospections) : les gestes de la barre d'actions de la fiche, sans
 * avoir à l'ouvrir. Chaque item mène au **même dialogue que la fiche** —
 * `InteractionForm`, `CreateProspectForm`, `TransformerProspectionDialog` —
 * pour que le geste se remplisse pareil des deux endroits ; seul
 * l'archivage gagne une boîte (`ArchiverProspectionDialog`), la fiche
 * utilisant un panneau sur place qui n'existe pas dans une liste.
 *
 * Les items se déduisent de la ligne, pas de l'écran : une ligne sans
 * prospect lié propose « Transformer en prospect », une avec prospect mais
 * sans commercial « Transformer en prospection » — les mêmes conditions que
 * la barre d'actions de la fiche.
 *
 * « Désarchiver » remplace « Archiver » sur les lignes archivées (`fermee`,
 * jamais `dateFermeture`, qui survit au désarchivage). Sans boîte : le geste
 * ne demande rien et se défait par un nouvel archivage. */
type Boite = {
  type: 'interaction' | 'archiver' | 'creerProspect' | 'transformer';
  ligne: ProspectionListItemDto;
};

export function useActionsLigneProspection({
  entite,
  onMutation,
}: {
  /** Pour le libellé du toast — les deux listes servent le même DTO mais
   * l'utilisateur doit lire le nom de l'écran où il est. */
  entite: 'prospection' | 'pré-prospection';
  /** Appelé après chaque mutation réussie — la page recharge ce qu'elle
   * affiche. En mode groupé, les lignes déjà dépliées gardent leur état
   * d'avant la mutation jusqu'au prochain dépliage : `useLignesGroupes`
   * porte son propre état, hors de portée d'un refetch de page. */
  onMutation: () => void;
}): { rendu: (p: ProspectionListItemDto) => ReactNode; boites: ReactNode } {
  const { commerciaux } = useAppData();
  const { user } = useAuth();
  // Même résolution que la fiche : le commercial du compte connecté comme
  // pré-choix de la transformation.
  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  const [boite, setBoite] = useState<Boite | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  const nomEntite = entite === 'pré-prospection' ? 'Pré-prospection' : 'Prospection';

  function desarchiver(p: ProspectionListItemDto) {
    desarchiverProspection(p.id)
      .then(() => {
        onMutation();
        showToast(`${nomEntite} désarchivée.`);
      })
      .catch((err: unknown) =>
        showToast(err instanceof Error ? err.message : 'Échec du désarchivage.'),
      );
  }

  const rendu = (p: ProspectionListItemDto) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions — ${prospectionDisplayName(p)}`}
        className="inline-flex size-4.5 items-center justify-center rounded align-middle text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={(e) => e.stopPropagation()}
      >
        <EllipsisVertical className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setBoite({ type: 'interaction', ligne: p })}>
          Ajouter une action
        </DropdownMenuItem>
        {!p.fermee && !p.prospectId && (
          <DropdownMenuItem onClick={() => setBoite({ type: 'creerProspect', ligne: p })}>
            Transformer en prospect
          </DropdownMenuItem>
        )}
        {!p.fermee && !!p.prospectId && !p.commercialId && (
          <DropdownMenuItem onClick={() => setBoite({ type: 'transformer', ligne: p })}>
            Transformer en prospection
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {!p.fermee ? (
          <DropdownMenuItem variant="destructive" onClick={() => setBoite({ type: 'archiver', ligne: p })}>
            Archiver
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => desarchiver(p)}>
            Désarchiver
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const boites = (
    <>
      {boite?.type === 'interaction' && (
        <InteractionForm
          onClose={() => setBoite(null)}
          onSubmit={(input) => {
            // Le formulaire se ferme sans attendre (même mécanique que la
            // fiche) : le résultat arrive donc par toast, succès ou échec.
            addInteraction(boite.ligne.id, input)
              .then(() => {
                onMutation();
                showToast('Action enregistrée.');
              })
              .catch((err: unknown) =>
                showToast(err instanceof Error ? err.message : "Échec de l'enregistrement de l'action."),
              );
          }}
        />
      )}
      {boite?.type === 'creerProspect' && (
        <CreateProspectForm
          preProspectionId={boite.ligne.id}
          initial={{
            firstName: prospectionDisplayName(boite.ligne)?.trim().split(' ')[0] ?? '',
            lastName: prospectionDisplayName(boite.ligne)?.trim().split(' ').slice(1).join(' ') ?? '',
            phone: boite.ligne.telephone ?? '',
            email: boite.ligne.email ?? '',
          }}
          onClose={() => setBoite(null)}
          onSubmit={() => {
            onMutation();
            showToast('Pré-prospection convertie — fiche prospect créée et liée.');
          }}
        />
      )}
      {boite?.type === 'transformer' && (
        <TransformerProspectionDialog
          initialCommercialId={ownCommercial?.id ?? null}
          initialTrancheId={boite.ligne.trancheId ?? null}
          initialArticleId={null}
          commercialItems={commercialItems}
          onClose={() => setBoite(null)}
          onSubmit={async (body) => {
            await transformerProspection(boite.ligne.id, body);
            onMutation();
            showToast('Prospection transformée — commercial et tranche posés.');
          }}
        />
      )}
      {boite?.type === 'archiver' && (
        <ArchiverProspectionDialog
          titre={prospectionDisplayName(boite.ligne)}
          onClose={() => setBoite(null)}
          onSubmit={async (body) => {
            await archiverProspection(boite.ligne.id, body);
            onMutation();
            showToast(`${nomEntite} archivée.`);
          }}
        />
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-foreground px-4.5 py-3 text-center text-label font-medium text-background shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:text-left"
        >
          {toast}
        </div>
      )}
    </>
  );

  return { rendu, boites };
}
