import * as React from "react"

const MOBILE_BREAKPOINT = 768
const REQUETE = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function abonner(surChangement: () => void) {
  const mql = window.matchMedia(REQUETE)
  mql.addEventListener("change", surChangement)
  return () => mql.removeEventListener("change", surChangement)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    abonner,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  )
}
