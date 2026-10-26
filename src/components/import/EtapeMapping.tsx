import { Card } from '../ui';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { ChoixMapping } from '../../lib/importPatrimoine';
import type { AnalyseImportDto, ColonneImportDto, TypeColonneImport } from '../../types/importPatrimoine';

const NON_MAPPEE = '-1';

const LIBELLE_TYPE: Record<TypeColonneImport, string> = {
  TEXTE: 'Texte',
  ENTIER: 'Entier',
  DECIMAL: 'Décimal',
  DATE: 'Date',
  BOOLEEN: 'Oui / non',
  REFERENCE: 'Référence',
};

function LigneCible({ cible, entetes, valeur, onChoisir }: Readonly<{
  cible: ColonneImportDto;
  entetes: string[];
  valeur: number;
  onChoisir: (rang: number) => void;
}>) {
  const items = [{ label: '— non mappée —', value: NON_MAPPEE }, ...entetes.map((e, i) => ({ label: e || `Colonne ${i + 1}`, value: String(i) }))];
  return (
    <tr className="border-t border-border">
      <td className="py-1 pr-3">
        {cible.entete}
        {cible.pivot && <span className="ml-1 text-micro text-muted-foreground">(code, obligatoire)</span>}
      </td>
      <td className="py-1 pr-3 text-muted-foreground">{LIBELLE_TYPE[cible.type]}</td>
      <td className="py-1">
        {cible.ignoree ? (
          <span className="text-micro text-muted-foreground">
            La colonne « {cible.entete} » ne peut pas être importée : elle est ignorée.
          </span>
        ) : (
          <Select items={items} value={String(valeur)} onValueChange={(v) => onChoisir(Number(v ?? NON_MAPPEE))}>
            <SelectTrigger size="sm" className="w-64" aria-label={`Colonne du fichier pour ${cible.entete}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {items.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </td>
    </tr>
  );
}

/** Étape 2 : correspondance colonnes cibles / colonnes du fichier, aperçu et avertissements de l'analyse. */
export default function EtapeMapping({ cibles, analyse, choix, onChoix }: Readonly<{
  cibles: ColonneImportDto[];
  analyse: AnalyseImportDto;
  choix: ChoixMapping;
  onChoix: (entete: string, rang: number) => void;
}>) {
  return (
    <Card title="Mapping des colonnes">
      <div className="flex flex-col gap-3">
        {analyse.avertissements.length > 0 && (
          <ul className="list-disc pl-5 text-label text-muted-foreground">
            {analyse.avertissements.map((a) => <li key={a}>{a}</li>)}
          </ul>
        )}
        <table className="w-full text-body">
          <thead>
            <tr className="text-left text-micro text-muted-foreground">
              <th className="pb-1 pr-3 font-medium">Colonne cible</th>
              <th className="pb-1 pr-3 font-medium">Type</th>
              <th className="pb-1 font-medium">Colonne du fichier</th>
            </tr>
          </thead>
          <tbody>
            {cibles.map((c) => (
              <LigneCible key={c.entete} cible={c} entetes={analyse.entetes} valeur={choix[c.entete] ?? -1} onChoisir={(r) => onChoix(c.entete, r)} />
            ))}
          </tbody>
        </table>
        <div>
          <h3 className="mb-1 text-label font-medium">Aperçu des {analyse.apercu.length} premières lignes</h3>
          {analyse.apercu.length === 0 ? (
            <p className="text-label text-muted-foreground">Le fichier ne contient aucune ligne de données.</p>
          ) : (
            <div className="overflow-auto rounded-lg border border-border">
              <table className="w-full text-micro">
                <thead>
                  <tr className="bg-muted text-left">
                    {analyse.entetes.map((e, i) => <th key={`${e}-${i}`} className="px-2 py-1 font-medium">{e}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {analyse.apercu.map((ligne, i) => (
                    <tr key={`${ligne.join('|')}-${i}`} className="border-t border-border">
                      {ligne.map((v, j) => <td key={`${analyse.entetes[j]}-${j}`} className="px-2 py-1">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
