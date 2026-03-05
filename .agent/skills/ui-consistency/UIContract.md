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

### 1. Cards
*   **Structure**:
    *   `background: var(--elevated)`
    *   `border: 1px solid var(--border)`
    *   `border-radius: var(--r3)`
    *   `overflow: hidden`
*   **Hover Effect**: Background shifts to `var(--hover)`, border to `var(--borderhi)`, transforms upwards (`transform: translateY(-1px)`), and gains a shadow (`0 8px 24px rgba(0, 0, 0, 0.3)`).
*   **Internal Layout**: Divide cards using `.card-top`, `.card-stats`, and `.card-footer`. Separate internal horizontal sections with `border-top: 1px solid var(--border)`.

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
*   **Header (`.page-header`)**: Uses `var(--surface)` background and a bottom border `var(--border)`. Always flexbed to handle left (titles) and right (actions).
*   **Title & Description**: Title is `18px` (`var(--t1)`, `700` weight). Description is `12px` (`var(--t2)`).
*   **Page Body (`.page-body`)**: Wrapper for the main scrollable area, padding `24px 28px`.

### 5. Chips/Badges
*   **Base Styles (`.chip`)**: `padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;`
*   **Variant Styles**: Always pair an opaque background variant with the bold color text (e.g., `background: var(--mint1)` with `color: var(--mint)`). Often includes a tiny colored `5px` dot (`.chip-dot`).
