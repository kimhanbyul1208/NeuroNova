import React, { useEffect, useRef, useState } from 'react';

/**
 * ProteinViewer Component
 * 
 * Visualizes a protein structure from a PDB ID using 3Dmol.js (via CDN).
 * 
 * @component
 * @param {Object} props
 * @param {string} props.pdbId - The PDB ID of the protein to visualize (e.g., '1UBQ').
 * @param {string} [props.width='100%'] - Width of the viewer container.
 * @param {string} [props.height='400px'] - Height of the viewer container.
 * @param {Object} [props.style] - Additional CSS styles for the container.
 */
const ProteinViewer = ({ pdbId, width = '100%', height = '400px', style = {} }) => {
    const viewerRef = useRef(null);
    const [viewer, setViewer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [libLoaded, setLibLoaded] = useState(false);

    // Check for 3Dmol library availability with retry
    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 10; // Try for 5 seconds (500ms * 10)

        const checkLib = setInterval(() => {
            if (window.$3Dmol) {
                setLibLoaded(true);
                clearInterval(checkLib);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(checkLib);
                    setError("3Dmol.js library failed to load. Please check your internet connection.");
                    setLoading(false);
                }
            }
        }, 500);

        return () => clearInterval(checkLib);
    }, []);

    // Initialize Viewer once library is loaded
    useEffect(() => {
        if (!libLoaded || !viewerRef.current || viewer) return;

        try {
            const element = viewerRef.current;
            const config = { backgroundColor: 'white' };
            const v = window.$3Dmol.createWebGLViewer(element, config);
            setViewer(v);
        } catch (err) {
            console.error("Failed to initialize 3Dmol viewer:", err);
            setError("Failed to initialize 3D viewer. WebGL might not be supported.");
            setLoading(false);
        }

        return () => {
            if (viewer) {
                // Cleanup if needed, though 3Dmol doesn't have a strict destroy method
                // viewer.clear(); // Optional
            }
        };
    }, [libLoaded, viewer]);

    // Load PDB Data when pdbId or viewer changes
    useEffect(() => {
        if (!viewer || !pdbId) return;

        const loadStructure = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch PDB data from RCSB PDB
                const response = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch PDB data for ID: ${pdbId}`);
                }
                const pdbData = await response.text();

                // Clear previous model
                viewer.clear();

                // Add model
                viewer.addModel(pdbData, "pdb");

                // Set style to Cartoon
                viewer.setStyle({}, { cartoon: { color: 'spectrum' } });

                // Zoom to fit
                viewer.zoomTo();

                // Render
                viewer.render();
            } catch (err) {
                console.error("Error loading protein structure:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadStructure();
    }, [viewer, pdbId]);

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
        borderRadius: '12px', // Match parent border radius
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
