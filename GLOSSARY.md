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
