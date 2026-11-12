import { Card, Field, FieldGrid } from '../../../components/ui';
import type { PropsOnglet } from '../../../lib/saisieLot';
import type { LotDetailDto } from '../../../types/projet';
import { ChampCase, ChampNombre } from './champsLot';

export default function OngletOptions({ lot, champs, maj, lectureSeule }: Readonly<PropsOnglet & { lot: LotDetailDto }>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card title="Options">
        <FieldGrid>
          <ChampCase label="Remise sur travaux supplémentaires" valeur={champs.remiseSurTravauxSupp} disabled={lectureSeule} onChange={(v) => maj('remiseSurTravauxSupp', v)} />
          <ChampCase label="Retenue sur travaux supplémentaires" valeur={champs.retenueSurTravauxSupp} disabled={lectureSeule} onChange={(v) => maj('retenueSurTravauxSupp', v)} />
          <ChampCase label="Saisie sur quantités" valeur={champs.saisieSurQuantites} disabled={lectureSeule} onChange={(v) => maj('saisieSurQuantites', v)} />
          <ChampCase label="Avancement par ligne" valeur={champs.avancementParLigne} disabled={lectureSeule} onChange={(v) => maj('avancementParLigne', v)} />
          <ChampCase label="Restitution de garantie bloquée" valeur={champs.restitutionGarantieBloquee} disabled={lectureSeule} onChange={(v) => maj('restitutionGarantieBloquee', v)} />
          <Field label="Avec décomposition" value={lot.avecDecomposition ? 'Oui' : 'Non'} />
        </FieldGrid>
      </Card>
      <Card title="Paramètres">
        <FieldGrid>
          <ChampNombre label="Variation de masse (%)" valeur={champs.variationMassePct} disabled={lectureSeule} onChange={(v) => maj('variationMassePct', v)} />
          <ChampNombre label="Remboursement des approvisionnements (%)" valeur={champs.tauxRemboursementApproPct} disabled={lectureSeule} onChange={(v) => maj('tauxRemboursementApproPct', v)} />
          <ChampNombre label="Total des points" valeur={champs.totalPoints} disabled={lectureSeule} onChange={(v) => maj('totalPoints', v)} />
          <Field label="Type de paiement" value={lot.typePaiementLibelle} />
        </FieldGrid>
      </Card>
    </div>
  );
}
