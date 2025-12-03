import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';

/**
 * ProteinViewer Component
 * 
 * Visualizes a protein structure from a PDB ID or custom URL using 3dmol (NPM package).
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.pdbId] - The PDB ID of the protein to visualize (e.g., '1UBQ').
 * @param {string} [props.customUrl] - Custom URL to load structure from (e.g., AlphaFold PDB URL).
 * @param {string} [props.width='100%'] - Width of the viewer container.
 * @param {string} [props.height='400px'] - Height of the viewer container.
 * @param {Object} [props.style] - Additional CSS styles for the container.
 * @param {Function} [props.onViewerReady] - Callback when viewer is initialized.
 */
const ProteinViewer = ({ pdbId, customUrl, width = '100%', height = '400px', style = {}, onViewerReady }) => {
    const viewerRef = useRef(null);
    const [viewer, setViewer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize Viewer
    useEffect(() => {
        if (!viewerRef.current || viewer) return;

        const initViewer = () => {
            try {
                const element = viewerRef.current;

                // Ensure element has dimensions
                if (element.clientWidth === 0 || element.clientHeight === 0) {
                    // Retry after a short delay if dimensions are 0 (e.g. inside a hidden tab or animating dialog)
                    setTimeout(initViewer, 100);
                    return;
                }

                const config = { backgroundColor: 'white' };
                // Use the imported $3Dmol directly
                const v = $3Dmol.createWebGLViewer(element, config);

                setViewer(v);
                if (onViewerReady) {
                    onViewerReady(v);
                }
            } catch (err) {
                console.error("Failed to initialize 3Dmol viewer:", err);
                setError(`Failed to initialize 3D viewer: ${err.message || err}`);
                setLoading(false);
            }
        };

        // Add a small delay to ensure DOM is ready (especially in Dialogs)
        const timer = setTimeout(initViewer, 100);
        return () => clearTimeout(timer);
    }, [viewer, onViewerReady]);

    // Load PDB Data when pdbId or customUrl changes
    useEffect(() => {
        if (!viewer) return;
        if (!pdbId && !customUrl) {
            setLoading(false);
            return;
        }

        const loadStructure = async () => {
            setLoading(true);
            setError(null);
            try {
                viewer.clear();

                if (customUrl) {
                    // Load from URL (e.g., AlphaFold)
                    // 3Dmol.js download method handles fetching and parsing
                    $3Dmol.download(`url:${customUrl}`, viewer, { multiselect: true }, function () {
                        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                        viewer.zoomTo();
                        viewer.render();
                        setLoading(false);
                    });
                } else if (pdbId) {
                    // Fetch PDB data from RCSB PDB
                    // We can use $3Dmol.download for PDB IDs too, it's simpler
                    $3Dmol.download(`pdb:${pdbId}`, viewer, { multiselect: true }, function () {
                        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                        viewer.zoomTo();
                        viewer.render();
                        setLoading(false);
                    });
                }
            } catch (err) {
                console.error("Error loading protein structure:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        loadStructure();
    }, [viewer, pdbId, customUrl]);

    return (
        <div style={{ position: 'relative', width, height, ...style }}>
            {loading && (
                <div style={styles.overlay}>
                    <div style={styles.spinner}></div>
                    <span style={{ marginLeft: '10px' }}>Loading structure...</span>
                </div>
            )}
            {error && (
                <div style={styles.overlay}>
                    <div style={{ textAlign: 'center', color: '#e74c3c' }}>
                        <strong>Error</strong><br />
                        {error}
                    </div>
                </div>
            )}
            <div
                ref={viewerRef}
                style={{ width: '100%', height: '100%', position: 'relative' }}
            />
        </div>
    );
};

const styles = {
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 10,
        color: '#333',
        fontWeight: 'bold',
        borderRadius: '12px',
    },
    spinner: {
        width: '20px',
        height: '20px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    }
};

// Add keyframes for spinner if not present globally
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleSheet);
}

export default ProteinViewer;
