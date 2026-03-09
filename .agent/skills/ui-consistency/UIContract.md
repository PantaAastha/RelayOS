# RelayOS UI Contract (Gold Standard)

This contract defines the strict visual rules and component patterns extracted from the Assistant List and Assistant Detailed views. It serves as the single source of truth for creating a consistent, premium dark theme experience across the app.

## The Trigger
**Set the skill to trigger automatically whenever I am creating or modifying any UI components or views.** 

## The Instruction
**Before starting any UI task, you MUST reference this contract to ensure 100% consistency with the 'Gold Standard' view.**

---

## 🎨 Visual Rules

### 1. Color Palette (Strictly Enforced)
Avoid generic hex codes or external colors. Use the defined CSS variables:
*   **Backgrounds & Surfaces**:
    *   App Background: `var(--bg)` (`#07080C`)
    *   Default Surface: `var(--surface)` (`#0C0E14`) - *Used for page headers, sidebars, inner sections*
    *   Elevated Surface: `var(--elevated)` (`#11141C`) - *Used for cards, inputs, buttons, modals*
    *   Hover State: `var(--hover)` (`#171B26`)
*   **Borders**:
    *   Regular Border: `var(--border)` (`#1C2030`)
    *   Highlight/Hover Border: `var(--borderhi)` (`#252D40`)
*   **Text Hierarchy**:
    *   Primary Text (White): `var(--t1)` (`#DDE3EF`)
    *   Secondary Text (Gray): `var(--t2)` (`#5A6478`)
    *   Muted/Tertiary Text: `var(--t3)` (`#2E3548`)
*   **Accents**:
    *   Primary Accent: `var(--mint)` (`#1DFFA0`), supported by subtle variants `var(--mint1)` (10% opacity) and `var(--mint2)` (20% opacity).
    *   Others: `var(--blue)`, `var(--purple)`, `var(--amber)`, `var(--red)`. Never use raw hex colors for accents.

### 2. Typography & Font Scales
The application exclusively uses the **Inter** font family (`'Inter', system-ui, sans-serif`). Do not use default fonts.
*   **Base/Standard Text**: `12px` (General body, table cells, inputs, buttons)
*   **Small/Meta Text**: `10px` or `11px`, often paired with `font-weight: 500` or `600` (Labels, badges, stats labels, tags)
*   **Subtitles/Section Titles**: `14px` or `15px`, `font-weight: 600` (Card titles, modal titles, top bar names)
*   **Page Titles**: `18px`, `font-weight: 700`, `letter-spacing: -0.01em`

### 3. Spacing & Padding
*   **Page Layout**:
    *   Header (`.page-header`): Padding `18px 28px 16px`
    *   Body (`.page-body`): Padding `24px 28px`
*   **Cards & Panels**: Inner padding should be `16px` (e.g., `16px 16px 12px` or `11px 16px`).
*   **Inputs**: Padding `8px 11px`.
*   **Buttons**: Padding `7px 14px` (gap: `6px`). Small buttons (`.btn-sm`): Padding `5px 10px`.

### 4. Borders & Radii
*   Small Radius: `var(--r)` (`5px`) - *Inputs, Buttons, Searchbars*
*   Medium Radius: `var(--r2)` (`8px`) - *Inner cards, Modals, Toasts, Avatars*
*   Large Radius: `var(--r3)` (`12px`) - *Main content cards, Dialogs*

### 5. Shadows
Use soft, deep dark shadows to convey depth on hover or for floating elements.
*   **Card Hover**: `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3)`
*   **Modals/Popups**: `box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5)`
*   **Primary Button Hover Glow**: `box-shadow: 0 0 14px var(--mint2)`

---

## 🧩 Component Patterns

### 1. Cards (Assistants, Collections, Sources)
*   **Structure**:
    *   `background: var(--elevated)`
    *   `border: 1px solid var(--border)`
    *   `border-radius: var(--r3)`
    *   `overflow: hidden`
*   **Hover Effect**: Background shifts to `var(--hover)`, border to `var(--borderhi)`, transforms upwards (`transform: translateY(-1px)`), and gains a shadow (`0 8px 24px rgba(0, 0, 0, 0.3)`).
*   **Internal Layout Requirements**:
    *   All cards across the entire application must use the standard 3-layer internal approach, and must never invent a custom flex container.
    *   **Layer 1**: `.card-top` (padding 16px). Contains `.card-header` (which holds a `.card-icon` and `.card-meta` chips), `.card-name`, and `.card-desc`.
    *   **Layer 2**: `.card-stats` (padding 11px 16px). Contains exactly *three* `.stat` blocks separated by right borders (`var(--border)`).
    *   **Layer 3**: `.card-footer` (padding 11px 16px). Contains additional metadata on left, and `.studio-cta` or primary action button on the right.

### 2. Buttons
*   **Base Styles**: `display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--r); font-size: 12px; font-weight: 500; font-family: 'Inter', sans-serif; border: none; transition: all 0.15s;`
*   **Primary (`.btn-primary`)**: Background `var(--mint)`, Text Color `#07080C`. Hover adds `box-shadow: 0 0 14px var(--mint2)` and background `#38ffb0`.
*   **Secondary (`.btn-secondary`)**: Background `var(--elevated)`, Border `1px solid var(--borderhi)`, Text Color `var(--t1)`. Hover background shifts to `var(--hover)`.
*   **Ghost (`.btn-ghost`)**: Background `transparent`, Border `1px solid var(--borderhi)`, Text Color `var(--t2)`. Hover background shifts to `var(--hover)` and text to `var(--t1)`.

### 3. Inputs & Forms
*   **Input Fields (`.finput` / `.fta`)**:
    *   `background: var(--elevated)`
    *   `border: 1px solid var(--border)`
    *   `border-radius: var(--r)`
    *   `padding: 8px 11px`
    *   `font-size: 12px`
    *   `color: var(--t1)`
*   **Focus State**: Background shifts to `var(--hover)`, border strictly turns `var(--blue)`. Ensure `outline: none`.
*   **Labels (`.flabel`)**: `font-size: 11px`, `font-weight: 500`, `color: var(--t2)`, `margin-bottom: 5px`.

### 4. Page Layout
*   **Header (`.page-header`)**: The main top-level structural header of any major view (e.g. Quality, Knowledge, Settings). Uses `var(--surface)` background and a bottom border `var(--border)`. It is flexbox-aligned to handle left content (titles) and right content (actions). Standard padding is `18px 28px 16px`.
*   **Header Title & Desc**: Must use strict semantic HTML inside `.page-header`.
    *   Title: `<h1 className="page-title">`. Styled to `18px`, `var(--t1)`, `700` weight, with no margin.
    *   Description: `<p className="page-description">`. Styled to `13px`, `var(--t2)`, with `margin-top: 8px` and `margin-bottom: 0`.
*   **Header Actions**: Primary actions for a page sequence (e.g. "Create Assistant", "New Collection", "Upload Document") MUST be placed in the main top `.page-header` on the right side. They should never be arbitrarily positioned above content inside the `.page-body`. Use React Portals for layout-injected nested route buttons.
*   **Page Body (`.page-body`)**: Wrapper for the main scrollable area below the header, padding `24px 28px`.

### 5. Chips/Badges
*   **Base Styles (`.chip`)**: `padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;`
*   **Variant Styles**: Always pair an opaque background variant with the bold color text (e.g., `background: var(--mint1)` with `color: var(--mint)`). Often includes a tiny colored `5px` dot (`.chip-dot`).

### 6. Empty States
*   **Core Logic**: Use the reusable `<EmptyState title="Title" description="Subtitle" action={<button>Click</button>} />` component rather than hardcoding `.empty-state` logic directly.
*   **Visual Check**: It should feature a 44px semi-transparent icon, a 15px `600` weight title (`var(--t1)`), a 12px description text (`var(--t2)`), and an optional action button below it.
*   **Spacing**: Ensure padding of `48px 24px` around the empty state content.

### 7. Drawers
*   **Interaction**: Complex forms or secondary flows (like Uploading, Creating) should use slide-out right-aligned Drawers instead of center Modals or explicit route changes.
*   **Core Logic**: Use the reusable `<Drawer isOpen={state} onClose={fn} title="Title" footer={<buttons />}>` component. Do NOT manually construct absolute DOM positioning for drawers.
*   **Backdrop**: Drawers must have a strict `rgba(0, 0, 0, 0.4)` backdrop that dismisses on click or `Escape` key, freezing the body scroll.
*   **Elevation**: Drawers sit at `z-index: 1000` with `var(--elevated)` backgrounds, left borders (`var(--border)`), and deep shadows (`-12px 0 32px rgba(0,0,0,0.5)`).

### 8. Center Modals
*   **Interaction**: Focused explicit confirmations (e.g. "Delete Assistant?") or simple mounting logic (e.g. "Mount Collections") should use centered Modals instead of sliding Drawers.
*   **Core Logic**: Use the reusable `<Modal isOpen={state} onClose={fn} title="Title" description="Description" footer={<buttons />}>` component. Do NOT manually construct `<div className="modal-overlay">` wrappers directly on the page.
*   **Backdrop**: Uses a `z-index: 1000` React portal overlay `rgba(0,0,0,0.4)` that freezes the body scroll and traps escaping.
*   **Style**: Modals max out at `400px` to `480px` depending on content density. Visual theme includes `var(--elevated)` background, `var(--r3)` corner radius, and `-16px 0 48px rgba(0,0,0,0.5)` drop shadows.

### 9. Breadcrumbs
*   **Structure**: Breadcrumbs act as navigation chrome and should be visually lightweight. They must sit directly on the page background (e.g. directly inside `.page-body` or `.page-header`) and should **never** be wrapped inside a `.card` container.
*   **Style**: Ensure breadcrumbs are positioned above their target content (like tables) without adding visual boxing or border.
