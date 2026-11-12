import { CadreBoiteFiltre, CLASSE_LIGNE } from '../liste/BoiteFiltre';
import { GENRES_LOT } from '../../lib/genresLot';
import { libelleReferentiel } from '../../pages/projet/hooks';
import type { StatutLotProjetDto } from '../../types/projet';

/** Statuts de lot à cocher, groupés par genre de marché. Rien de coché = tous les statuts. */
export default function BoiteStatutsLots({
  statuts,
  valeur,
  onChange,
}: Readonly<{ statuts: StatutLotProjetDto[]; valeur: string[]; onChange: (valeur: string[]) => void }>) {
  function basculer(id: string) {
    onChange(valeur.includes(id) ? valeur.filter((v) => v !== id) : [...valeur, id]);
  }

  return (
    <CadreBoiteFiltre
      titre="Statut"
      action={
        valeur.length > 0 ? (
          <button type="button" className="text-micro font-medium text-(--brand) hover:underline" onClick={() => onChange([])}>
            Effacer
          </button>
        ) : (
          <span className="text-micro text-muted-foreground">Tous</span>
        )
      }
    >
      {GENRES_LOT.map(({ genre, libelle }) => {
        const duGenre = statuts.filter((s) => s.genre === genre);
        if (duGenre.length === 0) return null;
        return (
          <div key={genre}>
            <p className="px-1.5 pt-1 text-micro font-semibold text-muted-foreground">{libelle}</p>
            {duGenre.map((s) => (
              <label key={s.id} title={libelleReferentiel(s)} className={CLASSE_LIGNE}>
                <input type="checkbox" className="m-0 accent-(--brand)" checked={valeur.includes(s.id)} onChange={() => basculer(s.id)} />
                <span className="truncate">{libelleReferentiel(s)}</span>
              </label>
            ))}
          </div>
        );
      })}
    </CadreBoiteFiltre>
  );
}
