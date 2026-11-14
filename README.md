# Huecraft — Accessible Color Studio

Huecraft is a responsive browser-based color palette studio. Create color harmonies, lock colors you want to keep, preview a palette in a small interface, and check WCAG contrast.

## Features

- Generate complementary, analogous, triadic, and monochrome palettes
- Lock individual swatches while generating new colors
- Copy a color hex code or export CSS custom properties
- Download a palette as JSON
- Save and reload palettes using browser local storage
- Check WCAG 2.1 contrast for custom foreground and background colors
- Responsive layout, keyboard generation shortcut, visible focus styles, and reduced-motion support
- No account, API key, build step, or external service required

## Run it

Open index.html in a modern browser. The Google Fonts connection is optional; the page uses local fallback fonts if you are offline.

## Files

- index.html — page structure and content
- styles.css — responsive layout and visual design
- app.js — palette generation, contrast calculation, saving, and exports
- favicon.svg — small brand mark

## Browser storage

Saved palettes live in this browser's local storage on this device. They are not uploaded to a server. Use the JSON export button to keep a portable copy.

## Accessibility note

The contrast checker uses the WCAG relative-luminance formula and thresholds: 4.5:1 for normal AA text, 3:1 for large AA text, and 7:1 for normal AAA text. A passing color ratio is only one part of an accessibility review.

