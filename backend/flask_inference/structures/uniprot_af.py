# structures/uniprot_af.py
from typing import Optional, List, Dict

import requests

UNIPROT_SEARCH_URL = "https://rest.uniprot.org/uniprotkb/search"
UNIPROT_ENTRY_URL = "https://rest.uniprot.org/uniprotkb/{accession}.json"

ALPHAFOLD_PREDICTION_URL = "https://alphafold.ebi.ac.uk/api/prediction/{uniprot}"
ALPHAFOLD_ENTRY_URL = "https://alphafold.ebi.ac.uk/entry/{entry_id}"

RCSB_PDB_ENTRY_URL = "https://www.rcsb.org/structure/{pdb_id}"
RCSB_PDB_PDB_URL = "https://files.rcsb.org/download/{pdb_id}.pdb"
RCSB_PDB_MMCIF_URL = "https://files.rcsb.org/download/{pdb_id}.cif"


def search_uniprot_by_name(
    protein_name: str,
    organism: Optional[str] = None,
    max_results: int = 5,
    reviewed: bool = True,
) -> List[Dict]:
    query_parts = [f'protein_name:"{protein_name}"']
    if organism:
        query_parts.append(f'organism_name:"{organism}"')
    if reviewed:
        query_parts.append("reviewed:true")

    query = " AND ".join(query_parts)
    params = {
        "query": query,
        "fields": "accession,id,protein_name,organism_name",
        "format": "json",
        "size": max_results,
    }

    resp = requests.get(UNIPROT_SEARCH_URL, params=params, timeout=15)
    resp.raise_for_status()

    data = resp.json()
    results = data.get("results", [])
    out = []

    for r in results:
        acc = r.get("primaryAccession")
        uni_id = r.get("uniProtkbId") or r.get("id")

        desc = r.get("proteinDescription", {})
        rec = desc.get("recommendedName", {})
        full = rec.get("fullName", {})
        pname = full.get("value") if isinstance(full, dict) else None

        org = r.get("organism", {})
        org_name = org.get("scientificName") if isinstance(org, dict) else None

        out.append(
            {
                "uniprot_accession": acc,
                "uniprot_id": uni_id,
                "protein_name": pname,
                "organism": org_name,
            }
        )

    return out


def get_alphafold_3d_metadata(uniprot_accession: str) -> Optional[Dict]:
    url = ALPHAFOLD_PREDICTION_URL.format(uniprot=uniprot_accession)
    resp = requests.get(url, timeout=15)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()

    data = resp.json()
    if not data:
        return None

    model = data[0]
    entry_id = model.get("entryId")
    pdb_url = model.get("pdbUrl")
    cif_url = model.get("cifUrl") or model.get("mmCifUrl")
    pae_img = model.get("paeImageUrl")
    pae_json = model.get("paeUrl") or model.get("predictedAlignedErrorUrl")
    entry_url = ALPHAFOLD_ENTRY_URL.format(entry_id=entry_id) if entry_id else None

    return {
        "uniprot_accession": uniprot_accession,
        "alphafold_id": entry_id,
        "entry_url": entry_url,
        "pdb_url": pdb_url,
        "cif_url": cif_url,
        "pae_json_url": pae_json,
        "pae_image_url": pae_img,
    }


def get_uniprot_experimental_3d(
    uniprot_accession: str,
    max_structures: int = 5,
) -> List[Dict]:
    url = UNIPROT_ENTRY_URL.format(accession=uniprot_accession)
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    entry = resp.json()

    xrefs = entry.get("uniProtKBCrossReferences", [])
    if not xrefs and "dbReferences" in entry:
        xrefs = entry["dbReferences"]

    out: List[Dict] = []
    for x in xrefs:
        db = x.get("database") or x.get("type")
        if db != "PDB":
            continue

        pdb_id = x.get("id")
        if not pdb_id:
            continue

        props_list = x.get("properties", [])
        props = {}
        for p in props_list:
            key = p.get("key") or p.get("type")
            val = p.get("value")
            if key and val:
                props[key] = val

        out.append(
            {
                "pdb_id": pdb_id,
                "method": props.get("Method"),
                "resolution": props.get("Resolution"),
                "chains": props.get("Chains"),
                "rcsb_entry_url": RCSB_PDB_ENTRY_URL.format(pdb_id=pdb_id),
                "pdb_download_url": RCSB_PDB_PDB_URL.format(pdb_id=pdb_id),
                "mmcif_download_url": RCSB_PDB_MMCIF_URL.format(pdb_id=pdb_id),
            }
        )

    if max_structures is not None and len(out) > max_structures:
        out = out[:max_structures]

    return out


def pick_preferred_3d_source(
    alphafold_meta: Optional[Dict],
    experimental_3d: List[Dict],
) -> Optional[Dict]:
    if experimental_3d:
        first = experimental_3d[0]
        return {
            "source": "PDB",
            "pdb_id": first["pdb_id"],
            "method": first.get("method"),
            "resolution": first.get("resolution"),
            "chains": first.get("chains"),
            "viewer_entry_url": first["rcsb_entry_url"],
            "pdb_download_url": first["pdb_download_url"],
            "mmcif_download_url": first["mmcif_download_url"],
        }

    if alphafold_meta:
        return {
            "source": "AlphaFold",
            "alphafold_id": alphafold_meta.get("alphafold_id"),
            "viewer_entry_url": alphafold_meta.get("entry_url"),
            "pdb_download_url": alphafold_meta.get("pdb_url"),
            "mmcif_download_url": alphafold_meta.get("cif_url"),
            "pae_json_url": alphafold_meta.get("pae_json_url"),
            "pae_image_url": alphafold_meta.get("pae_image_url"),
        }

    return None


def find_protein_with_3d(
    protein_name: str,
    organism: Optional[str] = None,
    max_results: int = 3,
    reviewed: bool = True,
) -> List[Dict]:
    hits = search_uniprot_by_name(
        protein_name=protein_name,
        organism=organism,
        max_results=max_results,
        reviewed=reviewed,
    )
    combined: List[Dict] = []
    for h in hits:
        acc = h["uniprot_accession"]

        af_meta = None
        exp3d: List[Dict] = []

        try:
            af_meta = get_alphafold_3d_metadata(acc)
        except Exception as e:
            print(f"[WARN] AlphaFold 메타데이터 실패({acc}): {e}")

        try:
            exp3d = get_uniprot_experimental_3d(acc)
        except Exception as e:
            print(f"[WARN] UniProt PDB 3D 실패({acc}): {e}")

        preferred = pick_preferred_3d_source(af_meta, exp3d)

        h2 = dict(h)
        h2["alphafold"] = af_meta
        h2["experimental_3d"] = exp3d
        h2["preferred_3d"] = preferred
        combined.append(h2)

    return combined
