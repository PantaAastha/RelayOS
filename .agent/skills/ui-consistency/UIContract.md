# RelayOS UI Contract (Gold Standard)

This contract defines the strict visual rules and component patterns for a consistent, premium dark theme experience across the RelayOS admin app.

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
    *   Default Surface: `var(--surface)` (`#0C0E14`) - *Page headers, sidebars, modals*
    *   Elevated Surface: `var(--elevated)` (`#11141C`) - *Cards, inputs, buttons*
    *   Hover State: `var(--hover)` (`#171B26`)
*   **Borders**:
    *   Regular Border: `var(--border)` (`#1C2030`)
    *   Highlight/Hover Border: `var(--borderhi)` (`#252D40`)
*   **Text Hierarchy**:
    *   Primary Text: `var(--t1)` (`#DDE3EF`)
    *   Secondary Text: `var(--t2)` (`#5A6478`)
    *   Muted/Tertiary Text: `var(--t3)` (`#2E3548`)
*   **Accents** (desaturated, premium):
    *   Primary: `var(--mint)` (`#34D399` — soft emerald), with `var(--mint1)` (8% opacity) and `var(--mint2)` (18% opacity)
    *   Semantic: `var(--blue)` (info), `var(--purple)` (onboard), `var(--amber)` (warning), `var(--red)` (error). Never use raw hex colors.

### 2. Typography & Font Scales
Two font families via CSS variables. **Never hardcode font-family inline.**
*   **Display/Headlines**: `var(--font-display)` (`'Outfit'`) — used for page titles, card names, stat values, modal titles
*   **Body/UI**: `var(--font-body)` (`'Geist'`) — used for everything else: body text, labels, buttons, inputs, section headers
*   **Mono**: `var(--font-mono)` (`'JetBrains Mono'`) — code/data

**Scale:**
| Role | Font | Size | Weight | Letter-spacing |
|------|------|------|--------|---------------|
| Page Title | Display | 22px | 700 | -0.03em |
| Card/Modal Title | Display | 14–15px | 600–700 | -0.01em |
| Stat Value | Display | 28px | 800 | -0.03em |
| Section Header | Body | 11px | 500 | 0.04em |
| Body Text | Body | 12–13px | 400–500 | — |
| Label | Body | 11px | 500–600 | — |
| Caption | Body | 10–11px | 500 | — |

**Typography rules:**
*   `font-variant-numeric: tabular-nums` on all stat/number values
*   `text-wrap: balance` on page titles
*   No `text-transform: uppercase` — use letter-spacing instead
*   `-webkit-font-smoothing: antialiased` applied globally

### 3. Spacing & Padding
*   **Page Layout**:
    *   Header (`.page-header`): Padding `22px 36px 20px`
    *   Body (`.page-body`): Padding `32px 36px 48px`
    *   Content Area (`.content-area`): Padding `28px 36px`
*   **Cards & Panels**: Inner padding `16px` (e.g., `16px 16px 12px` or `11px 16px`).
*   **Inputs**: Padding `8px 11px`.
*   **Buttons**: Padding `7px 14px` (gap: `6px`). Small buttons (`.btn-sm`): Padding `5px 10px`.
*   **Modals**: Header `16px 20px 14px`, Body `16px 20px`, Footer `14px 20px`.

### 4. Borders & Radii (Varied for depth)
*   Small Radius: `var(--r)` (`6px`) — *Inputs, Buttons, Close buttons*
*   Medium Radius: `var(--r2)` (`10px`) — *Inner cards, Stat cards, Toasts, Avatars*
*   Large Radius: `var(--r3)` (`14px`) — *Main content cards, Modals, Dialogs*

### 5. Shadows (Tinted, not pure black)
*   **Card Hover**: `box-shadow: 0 12px 32px rgba(7, 8, 18, 0.5)`
*   **Modals/Popups**: `box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset`
*   **Primary Button Hover Glow**: `box-shadow: 0 0 20px var(--mint2)`

### 6. Interactivity
*   **Press feedback**: `.btn:active { transform: scale(0.97) }`
*   **Focus rings**: `.btn:focus-visible { outline: 2px solid var(--mint); outline-offset: 2px }`
*   **Card hover**: Spring easing `transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1)`, `translateY(-2px)`
*   **Noise overlay**: Body has a subtle SVG noise `::after` at `opacity: 0.025`

---

## 🧩 Component Patterns

### 1. Cards (Assistants, Collections, Sources)
*   **Structure**:
    *   `background: var(--elevated)`
    *   `border: 1px solid var(--border)`
    *   `border-radius: var(--r3)`
    *   `overflow: hidden`
*   **Hover Effect**: Background shifts to `var(--hover)`, border to `var(--borderhi)`, transforms upwards (`translateY(-2px)`), gains tinted shadow (`0 12px 32px rgba(7, 8, 18, 0.5)`).
*   **Internal Layout Requirements**:
    *   All cards across the entire application must use the standard 3-layer internal approach, and must never invent a custom flex container.
    *   **Layer 1**: `.card-top` (padding 16px). Contains `.card-header` (which holds a `.card-icon` and `.card-meta` chips), `.card-name` (uses `var(--font-display)`), and `.card-desc`.
    *   **Layer 2**: `.card-stats` (padding 11px 16px). Contains `.stat` blocks separated by right borders (`var(--border)`).
    *   **Layer 3**: `.card-footer` (padding 11px 16px). Contains metadata left, `.studio-cta` or action button right.

### 2. Stat Cards (Dashboard)
*   `background: var(--elevated)`, `border: 1px solid var(--border)`, `border-radius: var(--r2)`, `padding: 20px`
*   **Left accent strip**: `::before` pseudo-element, 3px wide, `var(--mint)` at `opacity: 0.6`
*   **Label**: 11px/500, `var(--t2)`, `letter-spacing: 0.04em`
*   **Value**: `var(--font-display)`, 28px/800, `var(--t1)`, `letter-spacing: -0.03em`, `tabular-nums`
*   **Hover**: `border-color: var(--borderhi)`, `translateY(-1px)`

### 3. Buttons
*   **Base Styles**: `font-family: var(--font-body); font-size: 12px; font-weight: 500; border-radius: var(--r); padding: 7px 14px; border: none; transition: all 0.15s;`
*   **Primary (`.btn-primary`)**: Background `var(--mint)`, Text `#07080C`, `font-weight: 600`. Hover: `#5ee6b0` + glow `0 0 20px var(--mint2)`.
*   **Secondary (`.btn-secondary`)**: Background `var(--elevated)`, Border `1px solid var(--borderhi)`, Text `var(--t1)`. Hover: `var(--hover)`.
*   **Ghost (`.btn-ghost`)**: Background `transparent`, Border `1px solid var(--borderhi)`, Text `var(--t2)`. Hover: `var(--hover)` + `var(--t1)`.
*   **Active**: `transform: scale(0.97)` on `:active:not(:disabled)`
*   **Focus**: `outline: 2px solid var(--mint); outline-offset: 2px` on `:focus-visible`

### 4. Inputs & Forms
*   **Input Fields (`.finput` / `.fta`)**:
    *   `background: var(--elevated)`, `border: 1px solid var(--border)`, `border-radius: var(--r)`
    *   `padding: 8px 11px`, `font-size: 12px`, `font-family: var(--font-body)`
*   **Focus State**: Background shifts to `var(--hover)`, border turns `var(--blue)`. `outline: none`.
*   **Labels (`.flabel`)**: `font-size: 11px`, `font-weight: 500`, `color: var(--t2)`, `margin-bottom: 5px`.

### 5. Page Layout
*   **Header (`.page-header`)**: `var(--surface)` background, bottom border `var(--border)`. Padding `22px 36px 20px`.
*   **Title**: `<h1 className="page-title">` — `var(--font-display)`, 22px/700, `letter-spacing: -0.03em`, `text-wrap: balance`.
*   **Description**: `<p className="page-description">` — 12px, `var(--t2)`, `margin-top: 4px`.
*   **Header Actions**: Primary actions MUST be in `.page-header` on the right. Use React Portals for nested route buttons.
*   **Body (`.page-body`)**: Scrollable area, padding `32px 36px 48px`.
*   **App Shell**: `min-height: 100dvh` (NOT `100vh`), sidebar `height: 100dvh`.

### 6. Chips/Badges
*   **Base Styles (`.chip`)**: `padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 500;`
*   **Variant Styles**: Opaque background + bold text (e.g., `background: var(--mint1)` + `color: var(--mint)`). Often includes a 5px colored dot.

### 7. Empty States
*   Use `<EmptyState title="Title" description="Subtitle" action={<button>Click</button>} />`.
*   Visual: 44px icon, `var(--font-display)` 16px/700 title with `letter-spacing: -0.02em`, 12px description `var(--t2)`, optional action button. Padding `48px 24px`.

### 8. Drawers
*   Complex forms or secondary flows use slide-out right-aligned Drawers.
*   Use `<Drawer isOpen={state} onClose={fn} title="Title" footer={<buttons />}>`.
*   Backdrop: `rgba(0, 0, 0, 0.4)`, dismisses on click/Escape, freezes body scroll.
*   Elevation: `z-index: 1000`, `var(--elevated)` background, left border, deep shadow.

### 9. Center Modals
*   **Use for**: Confirmations, simple mounting logic, short forms.
*   **Use `<Modal>`**: Never manually construct `<div className="modal-overlay">`.
*   **Structure** (CSS-driven, no inline styles):
    *   `.modal-overlay`: Fixed, `rgba(0,0,0,0.6)`, `backdrop-filter: blur(6px)`, fade-in animation.
    *   `.modal`: `var(--surface)` bg, `var(--borderhi)` border, `var(--r3)` radius, `max-width: 420px`, slide-up animation. **No padding on `.modal` itself** — padding is per-section.
    *   `.modal-header`: `16px 20px 14px`, border-bottom, flex with title left + close right.
    *   `.modal-body`: `16px 20px`, scrollable.
    *   `.modal-footer`: `14px 20px`, border-top, flex-end gap-8.
    *   `.modal-close`: 28px square, `var(--r)` radius, SVG X icon, hover `var(--hover)`.
    *   `.modal-title`: `var(--font-display)`, 15px/700, `letter-spacing: -0.02em`.

### 10. Section Headers
*   `.studio-section-title`: `var(--font-body)`, 11px/500, `letter-spacing: 0.04em`, `var(--t2)`. **No `text-transform: uppercase`.**

### 11. Loading States
*   **App shell**: Branded skeleton with logo + animated progress bar (not "Loading..." text).
*   **Dashboard**: Skeleton stat cards matching layout while data loads.
*   **General**: Use CSS `.skeleton-line` with shimmer animation for placeholder content.

### 12. Breadcrumbs
*   Visually lightweight, sit on page background. **Never** wrap in `.card`.
*   Position above target content without visual boxing.
