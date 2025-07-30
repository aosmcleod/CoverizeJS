# CoverizeJS

**CoverizeJS** is a lightweight JavaScript library created by [@aosmcleod](https://github.com/aosmcleod) and designed for programmatically generating beautiful book covers directly in the browser. Perfect for digital libraries, book catalogs, publishing platforms, or any application where you need consistent, professional cover visuals on demand.

<p align="center">
  <img src="demo/example-3.png" width="200" alt="Example book cover 3">
  <img src="demo/example-2.png" width="200" alt="Example book cover 2">
  <img src="demo/example-1.png" width="200" alt="Example book cover 1">
</p>

## Features

- **Smart Typography**: Automatic typesetting for professional-looking multi-line titles and author names
- **Flexible Backgrounds**: Support for images, custom palettes, and 12 carefully crafted color gradients  
- **Visual Effects**: Realistic shadows, paper textures, and depth effects for authentic book aesthetics
- **Zero Dependencies**: Pure JavaScript and CSS implementation — no external libraries required

## Installation

### CDN (Recommended)

Add CoverizeJS to your HTML page via CDN:

```html
<!-- Single file with embedded CSS (easiest) -->
<script src="https://cdn.jsdelivr.net/npm/coverizejs/dist/coverize-1.0.0.min.js"></script>
```

### Download

Download the minified distribution file directly from this repository's releases (singe .js file with embedded CSS).

### Local Installation

```bash
git clone https://github.com/aosmcleod/coverizejs.git
cd coverizejs
npm install
```

## Quick Start

### Standalone Version (Easiest)

The simplest way to use CoverizeJS is with the standalone version that includes everything in a single file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Book Covers</title>
</head>
<body>
    <!-- Your content here -->
    <div id="cover-container"></div>
    
    <!-- Load CoverizeJS - CSS styles are automatically injected -->
    <script src="https://cdn.jsdelivr.net/npm/coverizejs/dist/coverize-1.0.0.min.js"></script>
    <script>
        // Create a book cover
        const cover = Coverize.cover()
          .title('The Great Gatsby')
          .author('F. Scott Fitzgerald')
          .color(6) // Azure Vale preset
          .render();

        // Add to your page
        document.getElementById('cover-container').appendChild(cover);
    </script>
</body>
</html>
```

## API Reference

CoverizeJS uses a fluent API pattern. Chain methods to configure your cover, then call `.render()` to generate the DOM element.

| Method | Description |
|--------|-------------|
| `.title(text)` | Set the book title |
| `.author(text)` | Set the author name |
| `.color(preset)` | Apply color preset or custom colors |
| `.image(url)` | Use a custom background image |
| `.effects(obj)` | Enable/disable visual effects |
| `.options(obj)` | Set typography and layout options |
| `.render()` | Generate DOM element for insertion |

## Usage

Create book covers using the `.cover()` method, then set text content with the `.title()` and `.author()` methods.

```js
const cover = Coverize.cover()
  .title('The Catcher in the Rye')
  .author('J.D. Salinger')
  .color(3)
  .effects({ realism: true, texture: true })
  .options({ font: 'sans', size: 'regular', emphasis: 'both', ratio: 0.67 })
  .render();

// Add to your page
document.getElementById('id')
  .appendChild(cover);
```

## Color

Style covers using custom or preset colors with the `.color()` method.

```js
// Single color
.color('#e8bf68')

// Two colors for gradient
.color('#e8bf68', '#e77352')

// Preset color (0-11)
.color(2)
```

### Color Presets

CoverizeJS includes 12 curated color presets accessible by number:

| Preset | Name | Gradient | Best For |
|--------|------|----------|----------|
| `0` | Pearl Shore | `#e6fdf5 → #2c3861` | Nature, meditation, wellness |
| `1` | Sage Abbey | `#c5f3e3 → #3a4254` | Health, lifestyle, modern fiction |
| `2` | Mossy Hollow | `#e6de88 → #385652` | Adventure, outdoors, travel |
| `3` | Honey Chapel | `#e8bf68 → #e77352` | Cooking, crafts, warm themes |
| `4` | Olive Grove | `#f4a436 → #6fb295` | Mediterranean, history, culture |
| `5` | Sienna Reach | `#eada85 → #850b07` | Drama, historical fiction, passion |
| `6` | Azure Vale | `#f3bebe → #1271be` | Romance, young adult, contemporary |
| `7` | Carmine Bay | `#f87e85 → #857ef8` | Entertainment, biography, glamour |
| `8` | Copper Barrow | `#f5a665 → #3a4857` | Steampunk, industrial, vintage |
| `9` | Pewter Steppe | `#c0c0c0 → #4b545b` | Minimalist, technical, modern |
| `10` | Brandy Copse | `#6d727f → #e54c4c` | Thriller, mystery, dark themes |
| `11` | Jasper Forge | `#547656 → #4e3135` | Fantasy, folklore, earthy themes |

## Image

Use images for custom cover backgrounds with the `.image()` method.

```js
const cover = Coverize.cover()
  .image('sample.png')
  .effects({ realism: true, texture: false })
  .render();
```

## Effects

Layer book aesthetic effects with the `.effects()` method.

| Property | Description |
|----------|-------------|
| `realism` | Book spine, shadows, and highlights (default: true) |
| `texture` | Paper-like texture and linen pattern (default: true) |
| `depth` | Subtle page and back cover imply depth (default: false) |

```js
.effects({ 
  realism: true, 
  texture: true, 
  depth: false 
})
```

## Options

Fine-tune typography and layout with the `.options()` method.

| Property | Values |
|----------|--------|
| `font` | 'serif' \| 'sans' (default: 'sans') |
| `size` | 'small' \| 'regular' \| 'large' (default: 'regular') |
| `emphasis` | 'case' \| 'bold' \| 'both' (default: 'both') |
| `ratio` | 0.5 - 1.0 width/height (default: 0.67) |

```js
.options({ 
  font: 'serif', 
  size: 'large', 
  emphasis: 'case',
  ratio: 0.8 
})
```

## Examples

### Using Color Presets
```js
const cover = Coverize.cover()
  .title('The Martian')
  .author('Andy Weir')
  .color(10) // Brandy Copse
  .effects({ realism: true, texture: true })
  .render();
```

### Custom Colors
```js
const cover = Coverize.cover()
  .title('Twenty Thousand Leagues Under the Sea')
  .author('Jules Verne')
  .color('#003366', '#0066CC')
  .effects({ realism: true, texture: true })
  .render();
```

### Typography Variations
```js
// Serif elegance
const cover = Coverize.cover()
  .title('War and Peace')
  .author('Leo Tolstoy')
  .color(5) // Sienna Reach
  .effects({ realism: true, texture: true })
  .options({ font: 'serif', emphasis: 'title' })
  .render();

// Modern sans
const cover = Coverize.cover()
  .title('Sapiens')
  .author('Yuval Noah Harari')
  .color(1) // Sage Abbey
  .effects({ realism: true })
  .options({ font: 'sans', emphasis: 'author' })
  .render();
```

### Aspect Ratios
```js
// Classic narrow (0.6)
const cover = Coverize.cover()
  .title('Jane Eyre')
  .author('Charlotte Brontë')
  .color(7) // Carmine Bay
  .options({ ratio: 0.6 })
  .render();

// Modern wide (0.8)
const cover = Coverize.cover()
  .title('Neuromancer')
  .author('William Gibson')
  .color(2) // Mossy Hollow
  .options({ ratio: 0.8 })
  .render();
```

### Background-Only Covers
```js
const cover = Coverize.cover()
  .color(4) // Olive Grove
  .effects({ realism: true, texture: true })
  .render();
```

### Image Covers with Effects
```js
const cover = Coverize.cover()
  .title('The Road')
  .author('Cormac McCarthy')
  .color(11) // Jasper Forge
  .image('landscape.jpg')
  .effects({ realism: true, texture: true })
  .render();
```

## Development

### Prerequisites

```bash
node --version  # Requires Node.js 16+ 
npm --version   # Requires npm 8+
```

### Setup

Clone and install dependencies:

```bash
git clone https://github.com/aosmcleod/coverizejs.git
cd coverizejs
npm install
```

### Building

Generate distribution files:

```bash
npm run build          # Create distribution file
npm run build:watch    # Watch for changes and rebuild
```

This creates `coverize-{version}.min.js` in the `/dist/` directory - a single minified file containing both JavaScript and CSS.

### Project Structure

```
coverizejs/
├── coverize.js         # Main JavaScript library
├── coverize.css        # Core CSS styles  
├── texture.css         # Visual texture effects
├── build.js            # Build script
├── demo/               # Interactive demo
├── dist/               # Distribution files
└── README.md
```

### Development Workflow

1. **Make changes** to `coverize.js`, `coverize.css`, or `texture.css`
2. **Test locally** by opening `demo/demo.html` in your browser
3. **Build distribution** with `npm run build`
4. **Test distribution** by refreshing the demo

### Creating Custom Builds

The build script combines and minifies:
- `coverize.js` - Core JavaScript functionality
- `coverize.css` - Base styling and layout
- `texture.css` - Visual effects and textures

To create a custom build, modify `build.js` or create your own build script.

### Releasing

Create a new release:

```bash
npm run release         # Patch version (1.0.0 → 1.0.1)
npm run release:minor   # Minor version (1.0.0 → 1.1.0)  
npm run release:major   # Major version (1.0.0 → 2.0.0)
```

This will:
- Update version in `package.json`
- Build distribution files with new version
- Generate changelog entry
- Prepare release assets

## License

CoverizeJS is open source under the GNU General Public License v3.0.

**GNU GPL v3.0**

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
