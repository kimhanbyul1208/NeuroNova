import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';

/**
 * ProteinViewer Component
 * 
 * Visualizes a protein structure from a PDB ID or custom URL using 3dmol (NPM package).
 */
const ProteinViewer = ({ pdbId, customUrl, height = '400px', onViewerReady }) => {
    const viewerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const viewerInstanceRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        let viewer = null;

        const initViewer = async () => {
            // Ensure element exists and has dimensions
            if (!viewerRef.current) return;

            // Wait for layout
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMounted || !viewerRef.current) return;

            try {
                setLoading(true);
                setError(null);

                // Initialize viewer
                // Try createWebGLViewer first, then fallback to createViewer
                if (typeof window.$3Dmol?.createWebGLViewer === 'function') {
                    viewer = window.$3Dmol.createWebGLViewer(viewerRef.current);
                } else if (typeof window.$3Dmol?.createViewer === 'function') {
                    viewer = window.$3Dmol.createViewer(viewerRef.current);
                } else if (typeof $3Dmol?.createWebGLViewer === 'function') {
                    viewer = $3Dmol.createWebGLViewer(viewerRef.current);
                } else if (typeof $3Dmol?.createViewer === 'function') {
                    viewer = $3Dmol.createViewer(viewerRef.current);
                } else {
                    console.error('3Dmol exports:', Object.keys($3Dmol || {}));
                    console.error('Window 3Dmol:', window.$3Dmol);
                    throw new Error('$3Dmol.createWebGLViewer is not a function. Library might not be loaded correctly.');
                }

                if (!viewer) throw new Error('Failed to create 3D viewer instance');

                viewerInstanceRef.current = viewer;
                if (onViewerReady) onViewerReady(viewer);

                viewer.setBackgroundColor('white');

                // Determine PDB Source
                let pdbData = '';

                if (customUrl) {
                    const response = await fetch(customUrl);
                    if (!response.ok) throw new Error(`Failed to fetch PDB from URL: ${response.statusText}`);
                    pdbData = await response.text();
                } else if (pdbId) {
                    // Check if pdbId is actually a URL
                    if (pdbId.startsWith('http')) {
                        const response = await fetch(pdbId);
                        if (!response.ok) throw new Error(`Failed to fetch PDB from URL: ${response.statusText}`);
                        pdbData = await response.text();
                    } else {
                        // Assume it's a PDB ID (4 chars)
                        const response = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
                        if (!response.ok) throw new Error(`Failed to fetch PDB ID ${pdbId}`);
                        pdbData = await response.text();
                    }
                } else {
                    // No data provided
                    setLoading(false);
                    return;
                }

                if (!isMounted) return;

                viewer.addModel(pdbData, "pdb");
                viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                viewer.zoomTo();
                viewer.render();
                viewer.spin(true);

                setLoading(false);

            } catch (err) {
                if (isMounted) {
                    console.error('Viewer Error:', err);
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        initViewer();

        return () => {
            isMounted = false;
            // Cleanup if needed
            if (viewerInstanceRef.current) {
                // viewerInstanceRef.current.clear(); // 3Dmol doesn't have a strict destroy
            }
        };
    }, [pdbId, customUrl]);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: height, bgcolor: '#f5f5f5', borderRadius: 2, overflow: 'hidden' }}>
            {loading && (
                <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)'
                }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Box sx={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10, p: 2
                }}>
                    <Alert severity="error">
                        <Typography variant="body2">{error}</Typography>
                    </Alert>
                </Box>
            )}

            <div
                id="gldiv"
                ref={viewerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}
            />
        </Box>
    );
};

export default ProteinViewer;
