import { useMemo, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import BarreIcones from '../../components/BarreIcones';
import BordereauModifiable, { type SourceBordereau } from '../../components/projet/sousfenetres/BordereauModifiable';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import {
  cheminExportBordereauDemandeAchat, enregistrerBordereauDemandeAchat, getBordereauDemandeAchat, importerBordereauDemandeAchat,
} from '../../lib/apiDemandesAchat';
import { versSource } from './bordereauDemandeAchat';
import { useEcriture } from '../../lib/useEcriture';
import { useExportListe } from '../../lib/useExportListe';
import { refetchAllApis, useApi } from '../../lib/useApi';
import type { BordereauSaisieDto } from '../../types/projet';
import type { DemandeAchatFiche } from '../../types/demandesAchat';

/** Bordereau de la demande : arbre groupes / lignes, modifiable en phase bordereau sauf si la fiche est verrouillée. */
export default function OngletBordereauDemandeAchat({ fiche, verrouille }: Readonly<{ fiche: DemandeAchatFiche; verrouille: boolean }>) {
  const { id } = fiche;
  const [version, setVersion] = useState(0);
  const bordereau = useApi(() => getBordereauDemandeAchat(id), [id, version]);
  const source = useMemo(() => (bordereau.data ? versSource(bordereau.data, fiche.tvaDefaut) : null), [bordereau.data, fiche.tvaDefaut]);
  const exportation = useExportListe(cheminExportBordereauDemandeAchat(id), {}, 'bordereau-demande-achat');
  const { executer, occupe } = useEcriture();
  const champFichier = useRef<HTMLInputElement>(null);
  const editable = fiche.phases.bordereau && !verrouille;

  async function enregistrer(corps: BordereauSaisieDto): Promise<SourceBordereau> {
    const reponse = await enregistrerBordereauDemandeAchat(id, corps);
    return versSource(reponse, fiche.tvaDefaut);
  }

  async function importer(fichier: File) {
    if (await executer(() => importerBordereauDemandeAchat(id, fichier), 'Bordereau importé')) {
      refetchAllApis();
      setVersion((v) => v + 1);
    }
  }

  if (bordereau.error) return <ErrorState message={bordereau.error} />;
  if (!source) return <LoadingState />;
  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        {editable && (
          <Button type="button" variant="ghost" size="sm" disabled={occupe} onClick={() => champFichier.current?.click()}>
            <Upload /> Importer un tableur
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" disabled={exportation.enCours || exportation.refuse}
          onClick={() => void exportation.exporter('xlsx')}>
          <Download /> Exporter
        </Button>
      </BarreIcones>
      <input ref={champFichier} type="file" hidden accept=".xlsx,.xls" aria-label="Fichier tableur du bordereau"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void importer(f);
        }} />
      {exportation.erreur && <p role="alert" className="text-label text-destructive">{exportation.erreur}</p>}
      <BordereauModifiable key={version} source={source} editable={editable} cleOrdre="achat-demande-bordereau" enregistrer={enregistrer} />
    </div>
  );
}
