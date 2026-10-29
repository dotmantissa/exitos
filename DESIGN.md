# ExitOS design direction

Seed: `14987762712530303984`. The five independent draws were recorded in `design-rolls.json` before frontend implementation.

| Axis              | Draw                                       | Product rationale                                                                                                              |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Palette           | Original draw replaced by the user palette | The current palette uses warm cream, sage, forest green and charcoal. The original draw remains recorded in design-rolls.json. |
| Layout            | Dashboard first split pane                 | Positions and actions stay on the left. The prepared route and its current state stay visible on the right.                    |
| Type              | Grotesk and slab serif                     | IBM Plex Sans carries controls and numbers. Roboto Slab gives the key sentence a reassuring, recognizable voice.               |
| Motion            | One orchestrated opening sequence          | A single opening reveal establishes the workspace. Subsequent motion explains an action, never decorates idle time.            |
| Structural device | Physical exit aperture                     | One large doorway represents the prepared route from a position back to the wallet. Its state changes as recovery progresses.  |

## Token plan

The user supplied this replacement palette: cream `#FEF8F5`, sage `#729877`, forest green `#53745F` and charcoal `#231F20`. Every interface colour is one of these four values or an explicit mixture of them. Previous palette values have been removed from the app, logo, browser chrome and recovery module.

Light: cream canvas and surfaces, charcoal text, forest actions with cream labels, and sage tinted navigation and highlights. Secondary copy blends forest with charcoal. Dividers blend forest with cream. Dark: charcoal canvas, charcoal surfaces lifted with 3% cream, cream text and sage actions with charcoal labels. Secondary copy blends cream with sage. Dividers and highlights blend sage with charcoal.

Forest on cream has a contrast ratio of 4.95:1. Sage on charcoal has 5.02:1. Cream on charcoal has 15.49:1. Sage serves as emphasis rather than small text on cream. Action hover changes to charcoal in light mode and cream in dark mode, keeping text readable. Errors retain their explicit icon and wording with contrasting neutral text. The modal backdrop and shadow derive from charcoal.

Typography: slab serif only for the primary workspace title and aperture message. Grotesk for navigation, all body copy, transaction values and controls. Tabular numerals for money. Body at least 14 px; form controls at least 16 px on mobile.

Layout: a compact navigation column, a spacious position ledger and one taller recovery aperture; on small screens, navigation becomes a compact horizontal strip and the aperture follows the action content.

Corners have a job: ledger rows stay square, controls use 10 px, dialogs 22 px, the doorway uses a distinct arched top. No repeated soft shadows. One small elevation shadow is reserved for the modal.

Motion: opening reveals share one timeline, under 600 ms. Dialog presence and progress changes use restrained opacity or scale. Nothing loops. Reduced motion removes the opening sequence and transform animations. Focus remains visible in both themes.

## Banned pattern review

The composition is a task workspace rather than a centered pitch hero or feature card grid. There are no uppercase tracked eyebrows, decorative em dashes, automatic arrows appended to labels, ornamental step numbers, ambient effects or a common shadow and radius on every surface. The aperture is the sole expressive device. Copy explains what to do and leaves protocol jargon in expandable details.

Examples of intended voice: “A clear way out.” “Let’s bring this home.” “Your wallet stays in charge.” “No rush. Check the details first.” Light humor belongs in the testnet empty states and empty states, never in warnings about funds.

The SVG mark depicts the same open frame as the aperture. It appears in navigation, the mobile header, the browser tab, the recovery dialog and exported kit metadata. Lucide provides interface icons. No emoji assets or remote font requests.

## First visit revision

The first visit now explains the product before presenting a wallet workspace. Independent draws are retained in `design-entry-rolls.json`, seed `14384889335606839622`, recorded before this revision's frontend code.

| Axis    | Actual draw                                           | Application                                                                                                                                                                                                                                        |
| ------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Palette | Original draw replaced by the user palette            | The first visit and workspace now share cream, sage, forest green and charcoal. Current roles and contrast are defined above.                                                                                                                      |
| Layout  | Asymmetric grid                                       | A direct product explanation occupies the wide reading column; a narrower vault diagram explains why a saved page still works. Below it, a genuine preparation sequence leads into the real test vault.                                            |
| Type    | Slab headline with grotesk body                       | Roboto Slab states the product category. IBM Plex Sans explains the mechanics and labels every task.                                                                                                                                               |
| Motion  | Restrained state hovers only                          | Links and controls change color or border to communicate interaction. No ambient motion or repeated section reveals. Route changes respect reduced motion, browser history and keyboard focus.                                                     |
| Device  | Arched vault with separate website and recovery paths | The established doorway becomes an explanatory schematic: usual website and saved recovery kit reach the same vault, which sends a withdrawal to the user's wallet. It represents mechanics, never invented live balances or an outage simulation. |

The composition keeps one memorable diagram. It avoids a centered hero, three feature cards, uppercase tracked labels, decorative hyphens, repeated arrows, uniform shadows and decorative numbered markers. An ordered list is used only for the genuine preparation sequence.

Copy must answer five questions: what ExitOS is, who uses it, why a website outage matters, what to save beforehand and how to withdraw afterward. The testnet scope appears before the primary action. The product introduction requires no wallet connection or live node response. Existing workspace deep links remain supported.

## Palette replacement

This revision changes colour across the existing composition. It preserves the recorded layout, type, motion and vault diagram. Both theme preferences remain available. Browser theme metadata follows the selected mode, and the standalone bootstrap uses the correct palette before verified code loads. The changed recovery module requires its own immutable release and approval before publishing new pins.
