# bioseq/translate.py
from typing import Literal, Tuple, Dict, Set

SeqType = Literal["dna", "rna", "protein", "auto"]

# 표준 유전 부호표 (RNA 기준)
GENETIC_CODE = {
    "UUU": "F", "UUC": "F",
    "UUA": "L", "UUG": "L",
    "CUU": "L", "CUC": "L", "CUA": "L", "CUG": "L",
    "AUU": "I", "AUC": "I", "AUA": "I",
    "AUG": "M",
    "GUU": "V", "GUC": "V", "GUA": "V", "GUG": "V",
    "UCU": "S", "UCC": "S", "UCA": "S", "UCG": "S",
    "AGU": "S", "AGC": "S",
    "CCU": "P", "CCC": "P", "CCA": "P", "CCG": "P",
    "ACU": "T", "ACC": "T", "ACA": "T", "ACG": "T",
    "GCU": "A", "GCC": "A", "GCA": "A", "GCG": "A",
    "UAU": "Y", "UAC": "Y",
    "CAU": "H", "CAC": "H",
    "CAA": "Q", "CAG": "Q",
    "AAU": "N", "AAC": "N",
    "AAA": "K", "AAG": "K",
    "GAU": "D", "GAC": "D",
    "GAA": "E", "GAG": "E",
    "UGU": "C", "UGC": "C",
    "UGG": "W",
    "CGU": "R", "CGC": "R", "CGA": "R", "CGG": "R",
    "AGA": "R", "AGG": "R",
    "GGU": "G", "GGC": "G", "GGA": "G", "GGG": "G",
    "UAA": "*", "UAG": "*", "UGA": "*",
}

IUPAC_DNA: Set[str] = set("ACGTNRYKMSWBDHV")
IUPAC_RNA: Set[str] = set("ACGUNRYKMSWBDHV")


def clean_sequence(raw_seq: str) -> str:
    """FASTA 헤더, 공백/개행 제거 후 대문자로 통일."""
    lines = []
    for line in raw_seq.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith(">"):
            continue
        lines.append(line)
    return "".join(lines).replace(" ", "").upper()


def detect_sequence_type(seq: str) -> Literal["dna", "rna", "protein"]:
    """간단 heuristic로 DNA/RNA/Protein 타입 판별."""
    letters = set(seq)
    if not letters:
        raise ValueError("입력 서열이 비어 있습니다.")

    has_t = "T" in letters
    has_u = "U" in letters

    if has_t and has_u:
        raise ValueError("서열에 T와 U가 동시에 존재합니다.")

    if letters.issubset(IUPAC_DNA):
        return "dna"

    if letters.issubset(IUPAC_RNA):
        return "rna"

    aa_set = set("ACDEFGHIKLMNPQRSTVWYBXZ*")
    if letters.issubset(aa_set):
        return "protein"

    raise ValueError(f"서열 타입을 자동으로 판별할 수 없습니다. 사용된 문자: {letters}")


def translate_rna_to_protein(
    rna_seq: str,
    frame: int = 0,
    stop_at_stop: bool = False,
) -> Tuple[str, Dict]:
    """RNA → Protein 번역."""
    if frame not in (0, 1, 2):
        raise ValueError("frame은 0, 1, 2 중 하나여야 합니다.")

    rna_seq = rna_seq.upper()
    info = {
        "frame": frame,
        "skipped_tail_nt": 0,
        "unknown_codons": [],
        "warnings": [],
    }

    if frame > 0:
        if len(rna_seq) <= frame:
            info["warnings"].append("서열 길이가 frame보다 짧아 번역할 수 없습니다.")
            return "", info
        rna_seq = rna_seq[frame:]

    tail = len(rna_seq) % 3
    if tail != 0:
        info["skipped_tail_nt"] = tail
        rna_seq = rna_seq[: len(rna_seq) - tail]
        info["warnings"].append(
            f"서열 길이가 3의 배수가 아니라 뒤에서 {tail}개 뉴클레오타이드를 버렸습니다."
        )

    protein = []
    for i in range(0, len(rna_seq), 3):
        codon = rna_seq[i: i + 3]
        aa = GENETIC_CODE.get(codon)
        if aa is None:
            protein.append("X")
            info["unknown_codons"].append((i, codon))
            continue

        if aa == "*":
            protein.append("*")
            if stop_at_stop:
                info["warnings"].append(
                    f"{i} 위치에서 stop codon을 만나 번역을 종료했습니다."
                )
                break
        else:
            protein.append(aa)

    return "".join(protein), info


def translate_to_protein(
    raw_sequence: str,
    seq_type: SeqType = "auto",
    frame: int = 0,
    stop_at_stop: bool = False,
) -> Tuple[str, Dict]:
    """
    DNA/RNA/Protein/auto → Protein 서열 변환.
    """
    seq = clean_sequence(raw_sequence)

    info: Dict = {
        "detected_type": None,
        "used_type": None,
        "frame": frame,
        "skipped_tail_nt": 0,
        "unknown_codons": [],
        "warnings": [],
    }

    if seq_type == "auto":
        detected = detect_sequence_type(seq)
        info["detected_type"] = detected
        seq_type = detected
    else:
        info["detected_type"] = None

    info["used_type"] = seq_type

    if seq_type == "protein":
        aa_set = set("ACDEFGHIKLMNPQRSTVWYBXZ*")
        illegal = set(seq) - aa_set
        if illegal:
            info["warnings"].append(
                f"단백질 서열에 허용되지 않는 문자 {illegal} 가 포함되어 있습니다. 그대로 반환합니다."
            )
        return seq, info

    if seq_type == "dna":
        if "U" in seq:
            info["warnings"].append("DNA로 지정됐지만 U가 포함되어 있습니다.")
        rna = seq.replace("T", "U")
        prot, sub = translate_rna_to_protein(rna, frame, stop_at_stop)
        info["skipped_tail_nt"] = sub["skipped_tail_nt"]
        info["unknown_codons"] = sub["unknown_codons"]
        info["warnings"].extend(sub["warnings"])
        return prot, info

    if seq_type == "rna":
        if "T" in seq:
            info["warnings"].append("RNA로 지정됐지만 T가 포함되어 있습니다.")
        prot, sub = translate_rna_to_protein(seq, frame, stop_at_stop)
        info["skipped_tail_nt"] = sub["skipped_tail_nt"]
        info["unknown_codons"] = sub["unknown_codons"]
        info["warnings"].extend(sub["warnings"])
        return prot, info

    raise ValueError(f"지원하지 않는 seq_type 입니다: {seq_type}")
