=== COMPACTED CONTEXT ===

CRITICAL DECISIONS
- Logo format: kept original PNG (logo-transparent.png) — user insisted on preserving
  the original custom bubbly font. SVG/font-based approach was rejected.
- Logo color: #7B1A38 (matches --maroon CSS variable). Solidified with Pillow —
  anti-aliased edge pixels snapped to full opacity so it renders as richly as body text.
- Flower: drawn directly onto the PNG via Pillow. Color #FF87B0, rotated 25°,
  5-circle petal layout, white centre dot, positioned at top of the "O".
- Logo component: OddlyCraftLogo.tsx exists in app/ but is NOT used — page.tsx
  uses <Image src="/logo-transparent.png"> in all 3 locations.

COMPLETED IN THIS CHAT
- logo-transparent.png: recolored to #7B1A38, flower added, scaled to 634×140 (2×retina)
- Nav logo: h-10, Image width=634 height=140
- Hero logo: h-28 (bumped from h-20 per user request), Image width=634 height=140
- Footer logo: h-14, className includes "brightness-0 invert" (renders white on dark bg)
- oddlycraft-logo.svg + oddlycraft-logo-preview.html saved to workspace (unused on site)

ACTIVE PROBLEMS / OPEN ISSUES
- OddlyCraftLogo.tsx is a dead file — can be deleted if desired
- oddlycraft-logo.svg in public/ is unused — can be deleted

PROJECT CONTEXT
- Stack: Next.js (app router), Tailwind, fonts Nunito + Baloo 2 via next/font/google
- Workspace: C:\Users\MSl\my-business
- CSS vars: --maroon #7B1A38 | --maroon-dark #5C1129 | --maroon-mid #9B3A54
  --blush #FDE8EF | --rose #F4BFCC | --cream #FFF8F2
- Project goal: website with inventory tracking, Italian charm linking,
  scheduling/email automation, data saved to spreadsheets + Google Drive

NEXT STEPS (user hasn't specified yet)
- Continue website build: backend, inventory tracking, charm linking, scheduling/email

=== END COMPACTED CONTEXT ===
