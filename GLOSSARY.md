# Social Card

A minimalist card studio that renders shareable social-media images (Threads, X, Facebook) from a live-editable card.

## Language

**Card Content**:
The text and images a user puts onto the card — headline, sublines, author, QR CTA. Data the tool renders, owned by the user.
_Avoid_: copy, strings (when referring to card fields)

**UI Copy**:
The tool's own interface language — labels, buttons, toasts, tooltips. What the tool says, owned by the app.
_Avoid_: labels (ambiguous with card headline), translations

**Interface Language**:
The language UI Copy is displayed in (Vietnamese or English). Switchable at runtime; never affects Card Content.
_Avoid_: locale, i18n language

**Preset**:
A named starting point that fills several Card Content fields and style toggles at once (headline, sublines, theme, CTA, plus style choices such as bold sublines or grayscale avatar).
_Avoid_: template, sample

**Style Preset**:
A named starting point that writes only the style choices (ratio, theme, headline size, uppercase) in one undoable step — never Card Content.
_Avoid_: theme preset, look

**Card State**:
The complete editable model of one card — all Card Content fields plus style choices (ratio, theme, headline size, uppercase, bold sublines, grayscale avatar).
_Avoid_: form data, settings
**Card Type**:
The archetype of a card — Quote or Showcase — deciding which Card Content fields exist and which layout the Card Preview renders.
_Avoid_: layout, variant

**Quote Card**:
The original Card Type: big headline, sublines, optional QR CTA, signature footer with avatar.
_Avoid_: default card, text card

**Showcase Card**:
The product-announcement Card Type: up to three Screenshot Slots in a hero-plus-details collage, handwritten Annotations, and a centered author footer. Always 1:1.
_Avoid_: product card, screenshot card, collage mode

**Screenshot Slot**:
One image holder of a Showcase Card: the single full-width Hero Slot on top, or one of up to two Detail Slots side-by-side below.
_Avoid_: image placeholder, upload box

**Shot**:
One uploaded screenshot in a Showcase Card's content, carrying a stable identity. The first Shot renders in the Hero Slot.
_Avoid_: image, upload

**Fit**:
How a Shot meets its Screenshot Slot — Fill (cover: the slot fills, content crops) or Fit (contain: the whole Shot shows over a blurred backdrop of itself). A per-Shot choice; absent an override, derived from the shot-to-slot ratio (ADR 0006 auto-fit).
_Avoid_: resize mode, object-fit

**Focus**:
Which part of a Shot is visible when the Shot crops inside its Slot — a normalized 0..1 anchor the user drags on the Canvas. Stored per Shot; never alters the Shot's pixels.
_Avoid_: position (ambiguous with the Position control group), crop (crop is the outcome, Focus is the control)

**Scale**:
A Shot's zoom level (1..4) on top of Fill — how far the visible region magnifies. Stored per Shot; 1 renders exactly like no zoom. Pan range grows with Scale; Focus stays the anchor of what shows.
_Avoid_: zoom level (Scale is the stored field), size (size is the card dimension control)

**Annotation**:
A handwritten-style callout on a Showcase Card: script text plus an arrow, anchored to one Shot from a fixed side. An Annotation follows its Shot, not the Slot the Shot currently occupies.
_Avoid_: callout, note, comment

**Card Export**:
Rendering the current Card State to a shareable image — to the clipboard (paste-ready) or as a PNG file. One module owns the whole flow: the exported card node, the re-entry guard, the feedback toasts, and the success flash.
_Avoid_: download (names only one of the two flows), save

**One-Screen Studio**:
The desktop layout contract: Header, Inspector, and Canvas all fit inside the viewport; the page itself never scrolls. Only nested panels (e.g. the Inspector) may scroll internally.
_Avoid_: scroll app, single screen page, app shell (as a user-facing term)

**Fit-to-View**:
The default Canvas scaling mode: the Card Preview is sized to fill the available Canvas area at the current ratio. Manual zoom is an override on top of it, never the starting state.
_Avoid_: auto zoom, responsive scale

**Inspector**:
The panel hosting every control group that edits the Card State — presets, headline, sublines, ratio, theme, avatar, author, QR. Sits as the left sidebar in the Desktop Shell; its groups re-host inside the Bottom Sheet on mobile.
_Avoid_: sidebar (desktop-only word), form

**Shell**:
The fixed viewport frame of the studio. One contract, two arrangements: the Desktop Shell (sidebar layout, ≥1024px) and the Mobile Shell (bottom-sheet layout, below 1024px). Neither ever scrolls as a page.
_Avoid_: layout wrapper, app frame

**Bottom Sheet**:
The standard, non-modal panel in the Mobile Shell that hosts the Inspector's control groups behind a bottom toolbar, with peek and expanded snap points. The Canvas stays visible and live-updating behind it.
_Avoid_: drawer, modal, popup
