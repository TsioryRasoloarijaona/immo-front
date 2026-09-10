import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & {
  /** Classes du conteneur de défilement qui enveloppe la `<table>`.
   *
   * Existe pour pouvoir **neutraliser** son `overflow-x-auto` : imbriqué dans
   * une page qui défile déjà verticalement, ce conteneur produit sa propre
   * barre horizontale au pied de la table entière — donc hors écran dès que la
   * liste dépasse la hauteur du volet. Il fait aussi de lui un contexte de
   * défilement, ce à quoi se raccroche le `sticky top-0` de la ligne d'en-tête,
   * qui cesse alors de coller. Passer `overflow-visible` ici rend les deux axes
   * au conteneur parent. */
  containerClassName?: string
}) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-body", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/** `h-(--row-h)` rather than cell padding is what sets the row height.
 *
 * In table layout `height` is a **minimum**, so the row still grows for a
 * cell that genuinely needs it instead of clipping — and paired with
 * `align-middle` on the cells it needs no vertical-padding arithmetic to stay
 * centred. It also means one token governs the density of every table in the
 * app: nothing here hardcodes 24px. */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-(--row-h) border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

/* Vertical column rules, at 60% against the horizontals' full strength.
   At a 24px pitch with ten-plus columns the eye loses its column between two
   adjacent date fields — which is exactly why the legacy grid draws them. The
   asymmetry is deliberate: a row is still the primary unit (you read one lead
   across), so horizontals lead and verticals only track. Equal weight turns
   a dense grid into graph paper. `last:border-r-0` keeps the outer edge clean. */
const RULE = "border-r border-border/60 last:border-r-0"

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Pas de fond ici : neuf écrans posent déjà le leur sur l'en-tête
        // collant (`bg-card`/`bg-background`), et ProspectionTable le pose sur
        // la cellule même — il gagnerait sur celui-ci. L'en-tête se distingue
        // par son `border-b`, sa graisse et son `text-micro` contre le
        // `text-body` du corps, sans toucher à la couleur.
        "h-(--row-h-head) px-(--cell-px) text-left align-middle text-micro font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        RULE,
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-(--cell-px) py-0 align-middle whitespace-nowrap text-body [&:has([role=checkbox])]:pr-0",
        RULE,
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
