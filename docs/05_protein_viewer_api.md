# ProteinViewer Component API Documentation

## Overview
The `ProteinViewer` component is a React functional component designed to visualize 3D protein structures using the `3Dmol.js` library. It fetches PDB data from the RCSB PDB database and renders it in a WebGL-enabled canvas.

## Usage

```jsx
import { ProteinViewer } from '../components';

const MyComponent = () => {
    return (
        <ProteinViewer 
            pdbId="1UBQ" 
            width="100%" 
            height="500px" 
            style={{ border: '1px solid #ccc' }}
        />
    );
};
```

## Props

| Prop Name | Type | Default | Description |
|-----------|------|---------|-------------|
| `pdbId` | `string` | **Required** | The 4-character PDB ID of the protein to visualize (e.g., '1UBQ', '4HHB'). |
| `width` | `string` | `'100%'` | The width of the viewer container. Can be any valid CSS width value. |
| `height` | `string` | `'400px'` | The height of the viewer container. Can be any valid CSS height value. |
| `style` | `object` | `{}` | Additional CSS styles to apply to the container element. |

## Features

1.  **Automatic Loading**: Automatically fetches and loads the protein structure when `pdbId` changes.
2.  **Cartoon Representation**: Renders the protein in the standard "Cartoon" style with spectrum coloring.
3.  **Interactive**: Supports mouse interaction for rotation (left click), zoom (scroll), and translation (right click).
4.  **Responsive**: Adapts to the container size (ensure `width` and `height` are set appropriately).
5.  **Lifecycle Management**: Handles initialization and cleanup of the WebGL context to prevent memory leaks.

## Dependencies

*   `react`
*   `3dmol`

## Implementation Details

The component uses `useRef` to access the DOM element and `useEffect` to manage the `3Dmol` viewer instance.

```javascript
// Initialization
const v = $3Dmol.createWebGLViewer(element, config);

// Loading Data
viewer.addModel(pdbData, "pdb");
viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
viewer.zoomTo();
viewer.render();
```
