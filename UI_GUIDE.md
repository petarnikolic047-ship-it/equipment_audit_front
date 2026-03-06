# EMS UI Guide

## Visual Contract
- Layout: dark left sidebar, sticky topbar with avatar dropdown, soft light content surface.
- Main page pattern: table/list on left + details panel on right; mobile details use right drawer.
- Interaction pattern: create/edit/assign/return/import/export actions open drawers/dialogs.
- Brand language: INFORCE-style dark/navy shell, geometric camo overlays, mint CTA accents, bold uppercase display typography.

## Colors
- Sidebar base: `#05070d`
- Sidebar hover: `#0a0f1c`
- Sidebar active: `#3a79ba`
- App surface: `#05070d`
- Card surface: `rgba(255,255,255,0.92)`
- Border: `#e2e8f0`
- Text primary: `#0f172a` (cards), `#e8edf8` (shell)
- Text secondary: `#475569`
- Text muted: `#94a3b8`
- CTA mint: `#63f0aa`
- Signal blue: `#3a79ba`
- Danger red: `#ff4b53`

## Typography
- Font body: `Space Grotesk, Segoe UI, sans-serif`
- Font display: `Barlow Condensed, Space Grotesk, sans-serif`
- Body: `12 / 14 / 16`
- Section title: `20`
- Page title: `28`

## Spacing Scale
- `4, 8, 12, 16, 20, 24, 32`

## Radius + Elevation
- Cards: `rounded-xl`
- Dialogs/Drawers: `rounded-2xl`
- Elevation: `shadow-sm` base, `shadow-lg` overlay

## Buttons
- `primary`: brand blue background, white text
- `secondary`: white with subtle border
- `ghost`: transparent with hover tint
- `danger`: red background
- `icon`: square icon button

## Status Badges
- `ASSIGNED`: blue
- `IN_STOCK`: green
- `UNDER_SERVICE`: amber
- `DISABLED`: slate
- `FAILED`: red
- `COMPLETED`: emerald
- `RUNNING`: indigo
- `QUEUED`: gray

## Tables
- Compact row height
- Sticky table header
- Action column right-aligned
- Pagination controls in card footer

## Filters
- Search input + filter dropdowns + reset action
- Keep same height and border style as table controls

## Detail Tabs
- Use this order where applicable:
  - `Details`
  - `Additional Attributes`
  - `Documents`
  - `History`

## Responsive Rules
- Desktop split layout: `minmax(0, 2fr) + minmax(360px, 1fr)`
- Mobile: details open in full-height drawer

## Icons
- Use `lucide-react`
- Keep icon stroke and size consistent (`14-18px` in controls)
