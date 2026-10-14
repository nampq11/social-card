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
A named starting point that fills several Card Content fields at once (headline, sublines, theme, CTA).
_Avoid_: template, sample

**Card State**:
The complete editable model of one card — all Card Content fields plus style choices (ratio, theme, headline size, uppercase).
_Avoid_: form data, settings
**Card State**:
The complete editable model of one card — all Card Content fields plus style choices (ratio, theme, headline size, uppercase).
_Avoid_: form data, settings

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
