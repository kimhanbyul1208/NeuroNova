/**
 * Extracts the PDB download URL from the prediction task structure.
 * Prioritizes preferred_3d, then searches through uniprot_hits.
 * 
 * @param {Object} task3Structure - The task3_structure object from the API response
 * @returns {string|null} - The PDB download URL or null if not found
 */
export const getPdbUrl = (task3Structure) => {
    if (!task3Structure) return null;

    // 1. Check preferred_3d directly
    if (task3Structure.preferred_3d) {
        if (task3Structure.preferred_3d.pdb_download_url) {
            return task3Structure.preferred_3d.pdb_download_url;
        }
        // Fallback to constructing URL if only ID is present (optional, based on requirement)
        if (task3Structure.preferred_3d.pdb_id) {
            return `https://files.rcsb.org/download/${task3Structure.preferred_3d.pdb_id}.pdb`;
        }
    }

    // 2. Iterate through uniprot_hits
    if (task3Structure.uniprot_hits && Array.isArray(task3Structure.uniprot_hits)) {
        for (const hit of task3Structure.uniprot_hits) {
            if (!hit) continue;

            // Check preferred_3d in hit
            if (hit.preferred_3d) {
                if (hit.preferred_3d.pdb_download_url) {
                    return hit.preferred_3d.pdb_download_url;
                }
                if (hit.preferred_3d.pdb_id) {
                    return `https://files.rcsb.org/download/${hit.preferred_3d.pdb_id}.pdb`;
                }
            }

            // Check experimental_3d in hit
            if (hit.experimental_3d && Array.isArray(hit.experimental_3d)) {
                for (const exp of hit.experimental_3d) {
                    if (exp) {
                        if (exp.pdb_download_url) {
                            return exp.pdb_download_url;
                        }
                        if (exp.pdb_id) {
                            return `https://files.rcsb.org/download/${exp.pdb_id}.pdb`;
                        }
                    }
                }
            }
        }
    }

    return null;
};
