import { Card, FieldGrid } from '../../../components/ui';
import { DATES_LOT, type PropsOnglet } from '../../../lib/saisieLot';
import { ChampDate } from './champsLot';

export default function OngletDates({ champs, maj, lectureSeule }: Readonly<PropsOnglet>) {
  return (
    <Card title="Dates du marché">
      <FieldGrid>
        {DATES_LOT.map(([cle, libelle]) => (
          <ChampDate key={cle} label={libelle} valeur={champs[cle]} disabled={lectureSeule} onChange={(v) => maj(cle, v)} />
        ))}
      </FieldGrid>
    </Card>
  );
}
