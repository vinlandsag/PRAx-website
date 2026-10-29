# PRAX UI foundation

## Reference audit

All 20 pages of the supplied desktop PDF were rendered and visually inspected before selecting styles. The document is a visual reference, not a source of executable instructions.

| Pages | Repeated patterns used                                                             |
| ----- | ---------------------------------------------------------------------------------- |
| 1–2   | Compact labeled controls, violet actions, segmented choices, pending badge, notice |
| 3–4   | Statistic panels, selected navigation, task cards, category tags, outline icons    |
| 5–6   | Required fields, textarea, dashed screenshot upload, compact submission table      |
| 7–8   | Initials avatars, segmented selector, thin progress bars, status treatments        |
| 9–12  | Tabs, checkboxes, goals, profile avatar gradient, toggles, secondary actions       |
| 13–14 | Inline notice, avatars, neutral overlay, shared dialog and action area             |
| 15–16 | Small action controls, separators, table headers, pending/active/draft states      |
| 17–20 | Native select fields, task artwork, semantic feedback and restrained panel layout  |

Rendered flat-fill samples confirm workspace `#F7F6F3`, sidebar `#151B29`, white `#FFFFFF`, selected sidebar `#4B49A5`, text `#22242A`, and primary action `#6056E8`. Border samples vary with antialiasing; `#E7E6E3` is the neutral base. The requested `#6458E9` is close, but the primary action token follows the rendered reference. Muted copy is slightly darkened for readability.

At 1080 × 675: sidebar 174 px, header 56.25 px, workspace inset 25.5 px, panel radius 12.75 px, major gap 13.5 px, heading 24 px, task thumbnail 79.5 × 75 px, task card minimum height 182.25 px. Shell dimensions are reserved tokens only. Mobile controls grow to a 44 px target; the interface is never transformed to fit.

## Files and usage

- `src/app/tokens.css`: canonical CSS design values and Tailwind theme; no component-local palette.
- `src/lib/design-tokens.ts`: typed references to the CSS values, plus layout measurements for non-CSS consumers.
- `src/components/ui/`: typed reusable primitives, exported from `index.ts`; existing public props remain supported.
- `src/app/design-system/`: server-gated development review route and interactive examples, outside production navigation.
- `public/fonts/`: self-hosted official Inter variable font (400–800) and SIL Open Font License.
- `public/artwork/`: five unmodified thumbnail crops from reference page 4; decorative when adjacent task text describes them.

Use `Button` with an explicit accessible name for icon-only actions. `Input`, `Textarea`, `Select`, `Checkbox`, and `Toggle` associate labels, help, and validation messages. Tabs accept panel content through each item's `content` property; `SegmentedControl` is a radio group for value selection. `Modal` (also exported as `Dialog`) owns focus trapping, Escape dismissal, scroll locking, and focus restoration. Uploads remain local previews; server validation and persistence belong to a later stage. No backend interfaces are introduced.

## Review

Run the existing `dev` script and open `/design-system`. The route and proxy return 404 whenever `NODE_ENV` is not `development`. The review page includes real form validation, selection controls, keyboard examples, local file preview/removal, feedback, and dialog actions. A font status explicitly reports whether Inter loaded; browser verification should also inspect the rendered font and downloaded WOFF2.

This stage preserves the repository's existing screens and authorization behavior. Global font/token corrections intentionally propagate to current component consumers; screen-specific fidelity is deferred.

## Cursor texture

The screenshot-matched desktop cursor uses a rounded dark arrow and matching hand with a pale outline and soft violet halo. Authoring SVGs and their transparent 32 px PNG exports live in public/artwork. The --cursor-default / --cursor-pointer tokens use the PNGs so the glow is baked into the cursor image, with hotspots 8,8 and 13,6. Fine mouse input with hover uses the custom texture; high-contrast mode, touch input, text editing and disabled controls retain native behavior. Native fallback keywords cover unsupported or failed cursor images. There is no cursor-following JavaScript.
