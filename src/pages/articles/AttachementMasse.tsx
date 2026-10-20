import { useState, type DragEvent } from 'react';
import { Paperclip, Upload } from 'lucide-react';
import PageShell from '../../components/PageShell';
import SaisiePieceChamps from '../../components/patrimoine/SaisiePieceChamps';
import TableauLecture, { type ColonneLecture } from '../../components/patrimoine/TableauLecture';
import { Badge, Card, EmptyState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { attacherEnMasse } from '../../lib/apiArticleOnglets';
import { RESULTAT_ATTACHEMENT, decouperEnLots } from '../../lib/articleOnglets';
import { useAuth } from '../../lib/auth';
import { formatNumber } from '../../lib/format';
import { useTranchesReferentiel } from '../../lib/referentiels';
import { estAdministrateur } from '../../lib/roles';
import { errorMessage } from '../../lib/useApi';
import type { BilanAttachementDto, SaisiePieceJointe } from '../../types/articleOnglets';

const COLONNES_BILAN: ColonneLecture<BilanAttachementDto>[] = [
  { titre: 'Fichier', rendu: (b) => <span className="font-medium text-foreground">{b.nomFichier}</span> },
  {
    titre: 'Résultat',
    rendu: (b) => {
      const r = b.resultat ? RESULTAT_ATTACHEMENT[b.resultat] : null;
      return r ? <Badge tone={r.ton}>{r.libelle}</Badge> : '—';
    },
  },
  { titre: 'Message', rendu: (b) => b.message || '—' },
];

export default function AttachementMasse() {
  const { user } = useAuth();
  const tranches = useTranchesReferentiel();
  const [trancheId, setTrancheId] = useState<string | null>(null);
  const [saisie, setSaisie] = useState<SaisiePieceJointe>({});
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [bilan, setBilan] = useState<BilanAttachementDto[]>([]);
  const [enCours, setEnCours] = useState(false);

  const pret = !!trancheId && !!saisie.typeId && fichiers.length > 0 && !enCours;
  const pluriel = fichiers.length > 1 ? 's' : '';
  const libelleChoix = fichiers.length === 0 ? 'Aucun fichier choisi' : `${formatNumber(fichiers.length)} fichier${pluriel} choisi${pluriel}`;
  const itemsTranches = tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));

  function deposer(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setFichiers(Array.from(e.dataTransfer.files));
  }

  async function attacher() {
    if (!trancheId) return;
    setEnCours(true);
    setBilan([]);
    for (const lot of decouperEnLots(fichiers)) {
      try {
        // Les lots partent l'un après l'autre : le bilan se remplit au fil de l'eau.
        const lignes = await attacherEnMasse(trancheId, lot, { ...saisie, description: saisie.description?.trim() || undefined });
        setBilan((b) => [...b, ...lignes]);
      } catch (err) {
        const message = errorMessage(err);
        setBilan((b) => [...b, ...lot.map((f) => ({ nomFichier: f.name, resultat: 'REFUSE' as const, message }))]);
      }
    }
    setEnCours(false);
  }

  return (
    <PageShell
      title="Attachement de fichiers en masse"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles', to: '/articles' }, { label: 'Attachement en masse' }]}
      icon={<Paperclip />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      {estAdministrateur(user) ? (
        <div className="flex flex-col gap-3">
          <Card title="Fichiers à attacher">
            <p className="mb-3 text-label text-muted-foreground">
              Le nom de chaque fichier, sans extension, doit être le code d'un article de la tranche. Un fichier du même type
              déjà présent sur l'article est remplacé.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select items={itemsTranches} value={trancheId} onValueChange={(v) => setTrancheId(v)}>
                <SelectTrigger size="sm" className="w-60" aria-label="Tranche">
                  <SelectValue placeholder={tranches.loading ? 'Chargement…' : 'Tranche'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {itemsTranches.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <SaisiePieceChamps valeur={saisie} onChange={setSaisie} typeObligatoire />
            </div>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={deposer}
              className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-input px-4 py-8 text-body text-muted-foreground hover:border-ring"
            >
              <Upload className="size-5" />
              <span>Glisser les fichiers ici ou cliquer pour les choisir</span>
              <span className="text-micro">
                {libelleChoix}
              </span>
              <input type="file" multiple className="hidden" onChange={(e) => setFichiers(Array.from(e.target.files ?? []))} />
            </label>
            <div className="mt-3">
              <Button type="button" size="sm" disabled={!pret} onClick={() => void attacher()}>
                {enCours ? 'Envoi en cours…' : 'Attacher les fichiers'}
              </Button>
              {!trancheId && <span className="ml-2 text-micro text-muted-foreground">Vous devez sélectionner une tranche.</span>}
            </div>
          </Card>
          {bilan.length > 0 && (
            <Card title={`Bilan (${bilan.length})`}>
              <TableauLecture lignes={bilan} colonnes={COLONNES_BILAN} cle={(b, i) => `${b.nomFichier}-${i}`} />
            </Card>
          )}
        </div>
      ) : (
        <EmptyState title="Accès réservé" message="Seul un administrateur peut attacher des fichiers en masse." />
      )}
    </PageShell>
  );
}
