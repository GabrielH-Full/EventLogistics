---
name: Pro-Pulse POS
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#424656'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#555a5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d7276'
  on-tertiary-container: '#f4f8fc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  input-height: 56px
  button-height: 56px
  card-padding: 32px
---

## Brand & Style

The design system is built for high-stakes, fast-paced operational environments. The brand personality is **Reliable, Efficient, and Authoritative**, aimed at retail and service professionals who require zero-friction interactions.

The visual style is **Corporate Modern**, prioritizing clarity over decoration. It utilizes a refined flat design language with a functional application of depth to indicate interactivity. The emotional response is one of confidence and stability—essential for software handling financial transactions. Every element is sized for rapid touch or mouse input, ensuring that the interface feels "rugged" yet sophisticated.

## Colors

The palette is anchored by **Vibrant Blue**, a color associated with trust and technology. It is used exclusively for primary actions and key brand touchpoints. 

- **Primary (#0066FF):** High-visibility blue for buttons, active states, and focus indicators.
- **Secondary (#64748B):** A slate gray for supportive text and secondary icons.
- **Tertiary (#F1F5F9):** A soft background tint used for input fields and surface containment to reduce eye strain compared to pure white.
- **Neutral (#1E293B):** Deep charcoal for maximum legibility in primary headings and body text.

The default mode is **Light**, providing a clean, paper-like clarity suitable for bright retail environments.

## Typography

**Hanken Grotesk** is chosen for its exceptional legibility and modern, sharp terminals. It bridges the gap between a technical font and a friendly sans-serif.

- **Headlines:** Use Bold weights with slight negative letter-spacing to create a strong visual anchor for page titles.
- **Body Text:** Sized slightly larger than standard web defaults (16px-18px) to accommodate fast reading during operation.
- **Labels:** Use "label-caps" (Uppercase + Bold) for field headers to distinguish them clearly from the user's input.
- **Scalability:** For mobile POS devices, headlines scale down to prevent awkward line breaks, while interactive text (body) remains large for touch targets.

## Layout & Spacing

The layout utilizes a **Fixed Grid** approach for the central login and utility containers, ensuring the interface remains predictable regardless of screen size. 

- **Grid Model:** 12-column system for dashboard views, but centered single-column (max-width: 440px) for authentication tasks.
- **Rhythm:** An 8px base unit drives all spacing.
- **Operational Density:** We use "Comfortable" density for input areas. A standard height of 56px for all touchable elements (inputs/buttons) exceeds the minimum accessibility standards to ensure error-free operation in fast-paced environments.
- **Breakpoints:** 
  - Mobile (<600px): 1-column, 20px margins.
  - Tablet (600px - 1024px): Centered containers, 32px margins.
  - Desktop (>1024px): Centered containers, 40px margins.

## Elevation & Depth

This design system uses a **Tonal Layering** approach combined with **Ambient Shadows** to define hierarchy.

- **Base Surface:** The main background uses a very subtle off-white or the Tertiary color to reduce glare.
- **Containers:** Primary cards use a white background with a "Level 2" shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to appear slightly lifted.
- **Interactive Elements:** Buttons use a solid primary fill. On hover/active states, the shadow intensifies rather than the color changing drastically, providing a tactile "press" feel.
- **Input Fields:** These use an inset-look or a subtle 1px stroke (#E2E8F0) to appear as "wells" ready to be filled, creating a clear affordance for data entry.

## Shapes

The design system employs **Rounded (0.5rem)** corners as the standard. This choice softens the "institutional" feel of corporate software while remaining professional.

- **Standard (8px):** Applied to buttons, input fields, and small cards.
- **Large (16px):** Used for main login containers and modal windows to emphasize containment.
- **Icons:** Should follow a consistent 2px stroke width with slightly rounded joins to match the component geometry.

## Components

- **Buttons:** Primary buttons are 56px tall, using the Primary Blue with white text (Bold). Secondary buttons use the Tertiary background with Neutral text.
- **Input Fields:** Must include a prefix icon (e.g., User or Lock) in Secondary Gray. The background should be Tertiary (#F1F5F9) to distinguish the field from the card surface.
- **Checkboxes:** Larger than standard (24x24px) for easy toggling on touch screens.
- **Cards:** White background, 16px corner radius, 32px internal padding.
- **Numpad (Optional):** For POS PIN entry, buttons should be circular or highly rounded squares with "headline-md" typography for maximum speed.
- **Feedback States:** Focus states must be highly visible—a 2px Primary Blue border with a 4px soft outer glow.