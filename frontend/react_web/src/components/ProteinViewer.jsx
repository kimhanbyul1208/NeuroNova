import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';

/**
 * ProteinViewer Component
 * 
 * Visualizes a protein structure from a PDB ID using 3Dmol.js.
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize Viewer
    useEffect(() => {
        if (!viewerRef.current) return;

        // Create the viewer
        const element = viewerRef.current;
        const config = { backgroundColor: 'white' };
        const v = $3Dmol.createWebGLViewer(element, config);
        setViewer(v);

        // Cleanup on unmount
        return () => {
            // 3Dmol doesn't have a specific destroy method documented for simple cleanup,
            // but we can clear the element content if needed. 
            // However, React handles DOM removal.
            // We can clear the viewer content.
            if (v) {
                v.clear();
            }
        };
    }, []);

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
                    Loading structure...
                </div>
            )}
            {error && (
                <div style={styles.overlay}>
                    Error: {error}
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10,
        color: '#333',
        fontWeight: 'bold'
    }
};

export default ProteinViewer;
