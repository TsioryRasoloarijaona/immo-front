import { useState } from 'react';
import { CornerDownRight, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { ChampsDeclares, PiedFormulaire } from '../../components/patrimoine/SaisiePatrimoine';
import { Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { createZoneProjet, deleteZoneProjet, listZonesProjet, updateZoneProjet } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { useSoumission, type DefChamp } from '../../lib/saisiePatrimoine';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { ZoneProjetDto, ZoneProjetEcritureDto } from '../../types';

const CHAMPS_ZONE: DefChamp<ZoneProjetEcritureDto>[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
  { nom: 'ordre', libelle: 'Ordre', genre: 'entier' },
  { nom: 'notes', libelle: 'Notes', genre: 'texteLong' },
];

/** Arbre à plat, parents avant enfants, frères triés par ordre puis libellé (comme `CfgProjectZones` d'OMRAN). */
function enArbre(zones: ZoneProjetDto[]): ZoneProjetDto[] {
  const parParent = new Map<string, ZoneProjetDto[]>();
  for (const z of zones) {
    const cle = z.parentId ?? '';
    parParent.set(cle, [...(parParent.get(cle) ?? []), z]);
  }
  const trier = (liste: ZoneProjetDto[]) =>
    [...liste].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0) || (a.description ?? '').localeCompare(b.description ?? '', 'fr'));
  const resultat: ZoneProjetDto[] = [];
  const visiter = (parent: string) => {
    for (const z of trier(parParent.get(parent) ?? [])) {
      resultat.push(z);
      visiter(z.id);
    }
  };
  visiter('');
  return resultat;
}

type Edition = { zone?: ZoneProjetDto; parentId?: string };

export default function ZonesProjet({ projetId, admin }: Readonly<{ projetId: string; admin: boolean }>) {
  const { data, loading, error, refetch } = useApi(() => listZonesProjet(projetId), [projetId]);
  const [edition, setEdition] = useState<Edition | null>(null);
  const confirmer = useConfirm();
  const toast = useToast();
  const zones = data ? enArbre(data) : [];

  async function supprimer(z: ZoneProjetDto) {
    const ok = await confirmer({ title: 'Supprimer la zone', message: `Supprimer la zone « ${z.description ?? z.code} » ?`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await deleteZoneProjet(projetId, z.id);
      toast({ texte: 'Zone supprimée.', variante: 'succes' });
      void refetch();
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  return (
    <Card
      title={`Zones (${data?.length ?? 0})`}
      action={
        admin ? (
          <Button size="sm" variant="outline" onClick={() => setEdition({})}>
            <Plus data-icon="inline-start" /> Ajouter une zone
          </Button>
        ) : undefined
      }
    >
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && zones.length === 0 && <EmptyState title="Aucune zone" message="Les zones servent au SAV et à la GRH." />}
      {!error && data && zones.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {zones.map((z) => (
            <li key={z.id} className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${(z.niveau ?? 0) * 20}px` }}>
              {(z.niveau ?? 0) > 0 && <CornerDownRight aria-hidden className="size-3.5 text-muted-foreground" />}
              <span className="font-mono text-micro text-muted-foreground">{z.code}</span>
              <span className="text-label text-foreground">{z.description}</span>
              {z.aUneImage && <ImageIcon aria-label="Porte une image" className="size-3.5 text-muted-foreground" />}
              {admin && (
                <span className="ml-auto flex gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label={`Ajouter une sous-zone à ${z.code}`} onClick={() => setEdition({ parentId: z.id })}>
                    <Plus />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`Modifier la zone ${z.code}`} onClick={() => setEdition({ zone: z })}>
                    <Pencil />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`Supprimer la zone ${z.code}`} onClick={() => void supprimer(z)}>
                    <Trash2 />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {edition && (
        <ZoneDialog
          projetId={projetId}
          edition={edition}
          onClose={() => setEdition(null)}
          onSaved={() => {
            setEdition(null);
            void refetch();
          }}
        />
      )}
    </Card>
  );
}

function ZoneDialog({
  projetId,
  edition,
  onClose,
  onSaved,
}: Readonly<{ projetId: string; edition: Edition; onClose: () => void; onSaved: () => void }>) {
  const z = edition.zone;
  const [form, setForm] = useState<ZoneProjetEcritureDto>(
    z ? { code: z.code, description: z.description, notes: z.notes, ordre: z.ordre } : { parentId: edition.parentId },
  );
  const { enCours, erreur, soumettre } = useSoumission();
  const changer = (nom: keyof ZoneProjetEcritureDto, valeur: unknown) => setForm((f) => ({ ...f, [nom]: valeur }));
  const enregistrer = () =>
    void soumettre(() => (z ? updateZoneProjet(projetId, z.id, form) : createZoneProjet(projetId, form)), onSaved);

  return (
    <Modal title={z ? 'Modifier la zone' : 'Nouvelle zone'} onClose={onClose} width={520}>
      <div className="flex flex-col gap-3.5">
        <ChampsDeclares prefixe="zone" defs={CHAMPS_ZONE} form={form} onChange={changer} erreur={erreur} />
        <PiedFormulaire erreur={erreur} enCours={enCours} libelle={z ? 'Enregistrer' : 'Ajouter'} onAnnuler={onClose} onValider={enregistrer} />
      </div>
    </Modal>
  );
}
