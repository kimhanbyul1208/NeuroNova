# ml/model.py
import json
import os
from typing import Optional, Dict, Any

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel

from config import MODEL_DIR, DEVICE

_DETECTOR = None
_MODEL_VERSION: Optional[str] = None


class PathogenDetectionModel(nn.Module):
    """ESM-2 기반 3-Task 병원체 탐지 모델"""

    def __init__(
        self,
        model_name: str,
        num_task1_classes: int,
        num_task2_classes: int,
        num_task3_classes: int,
        freeze_layers: int = 20,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(model_name)
        hidden_size = self.backbone.config.hidden_size

        for i, layer in enumerate(self.backbone.encoder.layer):
            if i < freeze_layers:
                for p in layer.parameters():
                    p.requires_grad = False

        self.task1_head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_task1_classes),
        )
        self.task2_head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, num_task2_classes),
        )
        self.task3_head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size, 512),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(512, num_task3_classes),
        )

    def forward(self, input_ids, attention_mask):
        out = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        cls = out.last_hidden_state[:, 0, :]
        t1 = self.task1_head(cls)
        t2 = self.task2_head(cls)
        t3 = self.task3_head(cls)
        return t1, t2, t3


class PathogenDetector:
    """학습된 모델 + 토크나이저 + 레이블 로더"""

    def __init__(self, model_dir: str, device: Optional[str] = None):
        self.model_dir = model_dir
        self.device = device or DEVICE
        self.device_t = torch.device(self.device)

        meta_path = os.path.join(model_dir, "metadata.json")
        if not os.path.exists(meta_path):
            raise FileNotFoundError(f"metadata.json not found in {model_dir}")

        with open(meta_path, "r") as f:
            self.metadata: Dict[str, Any] = json.load(f)

        self.model_name = self.metadata.get("model_name", "facebook/esm2_t33_650M_UR50D")
        self.max_length = self.metadata.get("max_seq_length", 1024)

        self.task1_label2id = self.metadata["task1_labels"]
        self.task2_label2id = self.metadata["task2_labels"]
        self.task3_label2id = self.metadata["task3_labels"]

        self.task1_id2label = {v: k for k, v in self.task1_label2id.items()}
        self.task2_id2label = {v: k for k, v in self.task2_label2id.items()}
        self.task3_id2label = {v: k for k, v in self.task3_label2id.items()}

        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)

        freeze_layers = self.metadata.get("freeze_layers", 20)
        dropout = self.metadata.get("dropout", 0.2)

        self.model = PathogenDetectionModel(
            model_name=self.model_name,
            num_task1_classes=self.metadata["num_task1_classes"],
            num_task2_classes=self.metadata["num_task2_classes"],
            num_task3_classes=self.metadata["num_task3_classes"],
            freeze_layers=freeze_layers,
            dropout=dropout,
        )

        state_path = os.path.join(model_dir, "model.pt")
        if not os.path.exists(state_path):
            raise FileNotFoundError(f"model.pt not found in {model_dir}")

        state_dict = torch.load(state_path, map_location=self.device_t)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device_t)
        self.model.eval()

    def predict(self, sequence: str, task3_threshold: float = 0.5) -> Dict[str, Any]:
        seq = sequence.upper().replace(" ", "").replace("\n", "")
        enc = self.tokenizer(
            seq,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        ids = enc["input_ids"].to(self.device_t)
        mask = enc["attention_mask"].to(self.device_t)

        with torch.no_grad():
            t1_logits, t2_logits, t3_logits = self.model(ids, mask)

        t1_probs = torch.softmax(t1_logits, dim=1)[0]
        t1_pred = int(torch.argmax(t1_probs))
        t1_label = self.task1_id2label[t1_pred]

        t2_probs = torch.softmax(t2_logits, dim=1)[0]
        t2_pred = int(torch.argmax(t2_probs))
        t2_label = self.task2_id2label[t2_pred]

        t3_probs = torch.sigmoid(t3_logits)[0]
        t3_bin = (t3_probs > task3_threshold).cpu().numpy().astype(int)

        top_idx = torch.argsort(t3_probs, descending=True)[:3].cpu().numpy().tolist()
        top_labels = [
            (self.task3_id2label[i], float(t3_probs[i].item())) for i in top_idx
        ]

        return {
            "sequence_length": len(seq),
            "task1": {
                "prediction": t1_label,
                "confidence": float(t1_probs[t1_pred].item()),
                "probabilities": {
                    self.task1_id2label[i]: float(t1_probs[i].item())
                    for i in range(t1_probs.shape[0])
                },
            },
            "task2": {
                "prediction": t2_label,
                "confidence": float(t2_probs[t2_pred].item()),
                "probabilities": {
                    self.task2_id2label[i]: float(t2_probs[i].item())
                    for i in range(t2_probs.shape[0])
                },
            },
            "task3": {
                "threshold": task3_threshold,
                "binary_preds": t3_bin.tolist(),
                "top_predictions": top_labels,
            },
        }


def load_model() -> None:
    """전역 PathogenDetector 로드/리셋"""
    global _DETECTOR, _MODEL_VERSION
    print(f"[Model] Loading model from: {MODEL_DIR}")
    detector = PathogenDetector(MODEL_DIR)
    _DETECTOR = detector
    _MODEL_VERSION = detector.metadata.get("model_name", "unknown")
    print("[Model] Loaded successfully.")


def get_detector() -> PathogenDetector:
    global _DETECTOR
    if _DETECTOR is None:
        load_model()
    return _DETECTOR


def get_model_version() -> Optional[str]:
    return _MODEL_VERSION
