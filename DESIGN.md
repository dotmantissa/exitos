# ExitOS design direction

Seed: `14987762712530303984`. The five independent draws were recorded in `design-rolls.json` before frontend implementation.

| Axis              | Draw                              | Product rationale                                                                                                             |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Palette           | Deep olive and parchment          | Recovery should feel steady and tactile. Quiet green signals care without imitating a trading terminal.                       |
| Layout            | Dashboard first split pane        | Positions and actions stay on the left. The prepared route and its current state stay visible on the right.                   |
| Type              | Grotesk and slab serif            | IBM Plex Sans carries controls and numbers. Roboto Slab gives the key sentence a reassuring, recognizable voice.              |
| Motion            | One orchestrated opening sequence | A single opening reveal establishes the workspace. Subsequent motion explains an action, never decorates idle time.           |
| Structural device | Physical exit aperture            | One large doorway represents the prepared route from a position back to the wallet. Its state changes as recovery progresses. |

## Token plan

Light: canvas `#F6F4EB`, navigation `#EEEDE3`, surface `#FCFBF6`, text `#263323`, secondary `#667160`, border `#DADCCF`, action `#35482D`, action text `#FAFAF1`, highlight `#DFE8CA`.

Dark: canvas `#121810`, navigation `#182016`, surface `#1C2519`, text `#F1F1DF`, secondary `#A5AF9C`, border `#35412F`, action `#CADBA4`, action text `#17210F`, highlight `#2E3F23`.

Typography: slab serif only for the primary workspace title and aperture message. Grotesk for navigation, all body copy, transaction values and controls. Tabular numerals for money. Body at least 14 px; form controls at least 16 px on mobile.

Layout: a compact navigation column, a spacious position ledger and one taller recovery aperture; on small screens, navigation becomes a compact horizontal strip and the aperture follows the action content.

Corners have a job: ledger rows stay square, controls use 10 px, dialogs 22 px, the doorway uses a distinct arched top. No repeated soft shadows. One small elevation shadow is reserved for the modal.

Motion: opening reveals share one timeline, under 600 ms. Dialog presence and progress changes use restrained opacity or scale. Nothing loops. Reduced motion removes the opening sequence and transform animations. Focus remains visible in both themes.

## Banned pattern review

The composition is a task workspace rather than a centered pitch hero or feature card grid. There are no uppercase tracked eyebrows, decorative em dashes, automatic arrows appended to labels, ornamental step numbers, ambient effects or a common shadow and radius on every surface. The aperture is the sole expressive device. Copy explains what to do and leaves protocol jargon in expandable details.

Examples of intended voice: “A clear way out.” “Let’s bring this home.” “Your wallet stays in charge.” “No rush. Check the details first.” Light humor belongs in the testnet empty states and empty states, never in warnings about funds.

The SVG mark depicts the same open frame as the aperture. It appears in navigation, the mobile header, the browser tab, the recovery dialog and exported kit metadata. Lucide provides interface icons. No emoji assets or remote font requests.
