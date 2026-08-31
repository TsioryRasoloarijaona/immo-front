"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

const Combobox = ComboboxPrimitive.Root

/** The trigger *is* the search field — clicking or typing into it opens the
 * popup and filters the list live, instead of a separate "click to open,
 * then type" step. Same visual footprint as `SelectTrigger` (height/border/
 * radius match exactly) so it drops into any layout `Select` already sits
 * in without a redesign. */
function ComboboxTrigger({
  className,
  size = "default",
  placeholder,
  label,
  ...props
}: Omit<React.ComponentProps<typeof ComboboxPrimitive.Input>, "size"> & {
  size?: "sm" | "default"
  /** Static "Label :" prefix rendered before the input, matching
   * `MultiSelectDropdown`'s trigger pill — for filter rows where this
   * combobox sits next to `MultiSelectDropdown`s. Not part of the input's
   * own editable text, so it never gets typed over while searching. */
  label?: string
}) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] dark:bg-input/30 dark:hover:bg-input/50",
        label && "max-w-55",
        className
      )}
    >
      {label && <span className="shrink-0 text-muted-foreground">{label} :</span>}
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        placeholder={placeholder}
        className="w-full min-w-0 grow bg-transparent text-sm outline-none placeholder:text-muted-foreground data-placeholder:text-muted-foreground"
        {...props}
      />
      <ComboboxPrimitive.Icon
        data-slot="combobox-icon"
        render={<ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />}
      />
    </ComboboxPrimitive.InputGroup>
  )
}

function ComboboxContent({
  className,
  children,
  emptyMessage = "Aucun résultat.",
  side = "bottom",
  sideOffset = 4,
  align = "start",
  ...props
}: Omit<React.ComponentProps<typeof ComboboxPrimitive.Popup>, "children"> &
  Pick<React.ComponentProps<typeof ComboboxPrimitive.Positioner>, "align" | "side" | "sideOffset"> & {
    emptyMessage?: React.ReactNode
    children?: React.ReactNode | ((item: unknown, index: number) => React.ReactNode)
  }) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} className="isolate z-50">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <ComboboxPrimitive.Empty className="px-2.5 py-2 text-body text-muted-foreground empty:m-0 empty:p-0">
            {emptyMessage}
          </ComboboxPrimitive.Empty>
          <ComboboxPrimitive.List className="scroll-my-1 p-1">{children}</ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxItem({ className, children, ...props }: React.ComponentProps<typeof ComboboxPrimitive.Item>) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

export { Combobox, ComboboxTrigger, ComboboxContent, ComboboxItem }
