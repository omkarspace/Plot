# Design System

<!-- impeccable:design-schema 1 -->

## Direction Contract

**THESIS:** Plot is a departure board for your evening. Every show is a departure, every time budget is a platform, and the cascade of flipping flaps is the sound of decisions being made. The category default is glowing cards on dark backgrounds with gradient accents; this world refuses that entirely.

**OWN-WORLD:** Matte black flap faces with condensed white sans-serif characters. Brushed steel frame as the ground. Amber for "fits your time" status, red for "over time." The board's ruled rows and columns ARE the composition — no cards, no gradients, no glass, no glow.

**STORY:** The visitor stands at a concourse. The board above shows what's leaving soon. They find their departure, they move. No decoration between them and the decision.

**FIRST VIEWPORT:** A full-width departure board header with "PLOT" rendered as split-flap characters. Below, the search bar styled as a station information desk input. The smart filter becomes the board's column headers (TIME · SERVICE · MOOD · STATUS). Results are departure rows with time, title, type, and status columns.

**FORM:** Split-flap concourse board. Chosen over pixel-art arcade because it maps directly to the product's core mechanism: time-based filtering as departure scheduling.

## Visual World

**Split-Flap Concourse Board** — The mechanical departure board at a European rail concourse at rush hour. Cascading letter flaps, platform columns, and departure rhythm hold a thousand travelers in one gaze. A ripple of clacks runs the board, and every head in the concourse lifts at the same half-second.

## Color Strategy

**Restrained** — Matte blacks and brushed steel as ground, with amber as the single signal color. White text on black flaps. Red only for "over time" or error states. The board's darkness is functional (it's a screen in a dim concourse), not decorative.

### Tokens

- **Flap Black:** `#0D0D0F` (flap faces, primary background)
- **Flap Shadow:** `#1B1B1E` (flap edges, recessed areas)
- **Flap White:** `#F2F2F2` (text on flaps, primary foreground)
- **Delay Amber:** `#FFB400` (status: fits your time, active states, primary accent)
- **Cancelled Red:** `#D32F2F` (status: over time, errors, destructive)
- **Steel Frame:** `#B6BBC2` (borders, ruled lines, secondary text)
- **Steel Dark:** `#7D838C` (muted text, disabled states)
- **Board Surface:** `#141416` (elevated board areas)
- **Row Alternate:** `#18181B` (zebra stripe on departure rows)

## Typography

**Barlow Condensed** for the board — a condensed sans-serif that reads like split-flap characters at speed. Uppercase for destinations and headers. Weight 500 for flap text, 700 for emphasis.

**IBM Plex Mono** for time displays and data — monospaced, mechanical, precise. The clock on the wall.

### Scale

- Board Display: `3rem` / `48px` — the PLOT header flaps
- Board Header: `0.75rem` / `12px` — column headers (TIME · DESTINATION · STATUS)
- Flap Text: `1rem` / `16px` — row content, condensed uppercase
- Flap Large: `1.25rem` / `20px` — emphasis rows
- Body: `0.875rem` / `14px` — supporting text outside the board
- Caption: `0.75rem` / `12px` — metadata, labels

## Component Language

### The Board
- Full-width container with brushed steel frame border
- Ruled horizontal lines between every row (1px `#2A2A2E`)
- Ruled vertical lines between columns (1px `#2A2A2E`)
- Row height: `48px` on desktop, `40px` on mobile
- Zebra striping: alternate rows use `#18181B`

### Flap Characters
- Each character sits on a matte black face (`#0D0D0F`)
- Subtle horizontal split line through the middle of each flap (the mechanical hinge)
- Top half slightly lighter than bottom half (simulating the flap's angle)
- Character rendered in `#F2F2F2` condensed uppercase

### Status Indicators
- **ON TIME / FITS:** Amber text (`#FFB400`) — the row is a viable departure
- **DELAYED / OVER TIME:** Red text (`#D32F2F`) — the row exceeds the budget
- **CANCELLED:** Red text with strikethrough — unavailable
- **BOARDING / IN WATCHLIST:** Amber background pill with black text

### Buttons
- Primary: Amber background (`#FFB400`), black text, condensed uppercase
- Secondary: Transparent with steel border, white text
- Ghost: Transparent, steel text, hover fills with flap shadow
- Arrow icon after text (the departure board's "→" for platform)

### Inputs
- Background: `#0D0D0F` (flap black)
- Border: 1px solid `#2A2A2E` (ruled line)
- Focus: Amber border, no glow
- Placeholder: `#7D838C` (steel dark)
- Icon: Magnifying glass in steel

### Cards (departure detail)
- Background: `#141416`
- Border: 1px solid `#2A2A2E`
- No border-radius (the board has hard edges)
- Internal ruled lines separating sections

## Motion

- **Flap cascade:** When results update, characters flip sequentially from left to right, each flap rotating on its horizontal axis (CSS `rotateX` with perspective). 50ms delay between characters.
- **Row slide:** New rows slide in from the right; removed rows slide out left. 200ms, ease-out.
- **Status change:** Amber pulse on status column when a row's time status changes.
- **Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` — mechanical, not organic.
- **Duration:** 150ms for flap flips, 200ms for row transitions, 300ms for page sections.

## Layout

- Max width: `1100px` (the board's physical width)
- Full-width steel frame border at edges
- Columns: TIME (100px) · DESTINATION (flex) · TYPE (80px) · STATUS (100px) · ACTION (60px)
- Row gap: 0 (ruled lines are the separator)
- Section spacing: `48px`
- Nav height: `56px` (compact, like a station sign)

## Signature Elements

1. **Split-flap header** — "PLOT" rendered as individual flap characters with the horizontal hinge line
2. **Ruled departure rows** — Every row is a departure, separated by steel lines
3. **Amber status glow** — The only color that breathes; pulses gently on active status
4. **Flap flip animation** — Characters cascade when results change
5. **Steel frame** — The board's border is brushed metal, not CSS rounded corners

## Atmosphere

The app should feel like standing in Gare du Nord at 6 PM — the board above is clicking through departures, the concourse is dim, the amber status lights are the brightest things in the room. Every interaction should feel mechanical, precise, and decisive. No decoration. No gradients. No glow. Just the board, the rows, and the departure that fits your evening.
