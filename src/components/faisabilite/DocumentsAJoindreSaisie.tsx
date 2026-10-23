import { X } from 'lucide-react';
import { Card } from '../ui';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Choix } from '../../lib/saisiePatrimoine';
import type { DocumentAJoindreDto } from '../../types/faisabilite';

/** Documents à joindre d'un statut ou d'une transition : un type par ligne (pas de doublon), cases « obligatoire » et « avec titre ». */
export default function DocumentsAJoindreSaisie({ valeur, onChange, types, desactive }: Readonly<{
  valeur: DocumentAJoindreDto[];
  onChange: (v: DocumentAJoindreDto[]) => void;
  types: Choix;
  desactive: boolean;
}>) {
  const libelle = (id: string) => types.find((t) => t.value === id)?.label ?? id;
  const restants = types.filter((t) => !valeur.some((d) => d.typeDocumentId === t.value));
  const modifier = (id: string, patch: Partial<DocumentAJoindreDto>) =>
    onChange(valeur.map((d) => (d.typeDocumentId === id ? { ...d, ...patch } : d)));

  return (
    <Card title="Documents à joindre">
      <div className="flex flex-col gap-2">
        {valeur.length === 0 && <p className="text-body text-muted-foreground">Aucun document.</p>}
        {valeur.map((d) => (
          <div key={d.typeDocumentId} className="flex flex-wrap items-center gap-3 text-body">
            <span className="min-w-40 flex-1 font-medium text-foreground">{libelle(d.typeDocumentId)}</span>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={d.estObligatoire === true} disabled={desactive} onChange={(e) => modifier(d.typeDocumentId, { estObligatoire: e.target.checked })} />
              Obligatoire
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={d.avecTitre === true} disabled={desactive} onChange={(e) => modifier(d.typeDocumentId, { avecTitre: e.target.checked })} />
              Avec titre
            </label>
            {!desactive && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer ${libelle(d.typeDocumentId)}`}
                onClick={() => onChange(valeur.filter((x) => x.typeDocumentId !== d.typeDocumentId))}>
                <X />
              </Button>
            )}
          </div>
        ))}
        {!desactive && restants.length > 0 && (
          <Select<string | null> items={restants} value={null} onValueChange={(v) => v && onChange([...valeur, { typeDocumentId: v, estObligatoire: true, avecTitre: false }])}>
            <SelectTrigger size="sm" className="w-64" aria-label="Ajouter un document"><SelectValue placeholder="Ajouter un document…" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {restants.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
        <p className="text-micro text-muted-foreground">Toute ligne est exigée à la transition, qu'elle soit cochée « obligatoire » ou non.</p>
      </div>
    </Card>
  );
}
