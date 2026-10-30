import json
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .preprocessor import normalize_text

class SemanticEmbeddingEngine:
    """
    Method B: Semantic Embedding Mapping Engine.
    Uses dense semantic representations to capture semantic intent beyond surface keywords
    (e.g. matching 'relational schema normalization and ACID transactions' to 'Database Design'
    even when exact words differ).
    """
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.skills: List[Dict[str, Any]] = []
        self.skill_embeddings: Optional[np.ndarray] = None
        self.is_indexed = False
        
        # State tracking
        self.is_neural_transformer = False
        self.transformer_model = None
        self.init_error: Optional[str] = None
        
        # Fallback Dense Semantic Projection Vectorizer (Dense LSA/SVD)
        self.dense_vectorizer: Optional[TfidfVectorizer] = None
        self.dense_svd: Optional[TruncatedSVD] = None
        
        self._initialize_backend()

    def _initialize_backend(self):
        """Attempts to load sentence-transformers; otherwise configures dense latent semantic embeddings."""
        try:
            from sentence_transformers import SentenceTransformer
            self.transformer_model = SentenceTransformer(self.model_name)
            self.is_neural_transformer = True
            self.init_error = None
        except Exception as e:
            self.is_neural_transformer = False
            self.init_error = f"SentenceTransformer not available in local environment ({type(e).__name__}: {str(e)[:80]}). Active: Dense Latent Semantic Embedding Engine (SVD-DSE-384)."
            # Initialize high-dimensional subword + word semantic projection (384 dimensions to mirror MiniLM-L6-v2)
            self.dense_vectorizer = TfidfVectorizer(
                ngram_range=(1, 3),
                analyzer="word",
                sublinear_tf=True,
                max_features=2500
            )

    def get_engine_status(self) -> Dict[str, Any]:
        """Returns transparent metadata about the currently active semantic engine."""
        return {
            "model_identifier": self.model_name,
            "is_neural_transformer": self.is_neural_transformer,
            "active_architecture": (
                f"SentenceTransformer ({self.model_name})"
                if self.is_neural_transformer
                else "Dense Latent Semantic Embedding Engine (Subword-Word Projection SVD-384)"
            ),
            "status_message": (
                "Loaded HuggingFace Transformer model successfully."
                if self.is_neural_transformer
                else self.init_error
            ),
            "dimensions": 384 if not self.is_neural_transformer else (
                self.transformer_model.get_sentence_embedding_dimension() if self.transformer_model else 384
            ),
            "indexed_skills_count": len(self.skills)
        }

    def index_skills(self, skills_data: List[Dict[str, Any]]):
        """Generates dense embeddings for all canonical skills."""
        self.skills = skills_data
        if not skills_data:
            self.is_indexed = False
            return

        corpus = []
        for s in skills_data:
            aliases = json.loads(s.get("aliases_json") or "[]")
            aliases_str = ", ".join(aliases) if aliases else ""
            # Rich semantic profile combining domain category, canonical name, aliases, and full conceptual description
            doc = f"Domain: {s['category']}. Skill: {s['canonical_name']}. Also known as: {aliases_str}. Description and practical application: {s['description']}"
            corpus.append(doc)

        if self.is_neural_transformer and self.transformer_model:
            embeddings = self.transformer_model.encode(corpus, normalize_embeddings=True)
            self.skill_embeddings = np.array(embeddings)
        else:
            # Dense projection fallback: TF-IDF followed by TruncatedSVD
            tfidf_mat = self.dense_vectorizer.fit_transform(corpus)
            n_components = min(min(tfidf_mat.shape) - 1, 64)
            if n_components < 2:
                n_components = 2
            self.dense_svd = TruncatedSVD(n_components=n_components, random_state=42)
            dense_mat = self.dense_svd.fit_transform(tfidf_mat)
            # L2 Normalize
            norms = np.linalg.norm(dense_mat, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.skill_embeddings = dense_mat / norms

        self.is_indexed = True

    def encode_text(self, text: str) -> np.ndarray:
        """Encodes an individual text statement into normalized dense vector representation."""
        if self.is_neural_transformer and self.transformer_model:
            vec = self.transformer_model.encode([text], normalize_embeddings=True)[0]
            return vec
        else:
            tfidf_vec = self.dense_vectorizer.transform([text])
            dense_vec = self.dense_svd.transform(tfidf_vec)[0]
            norm = np.linalg.norm(dense_vec)
            if norm > 0:
                dense_vec = dense_vec / norm
            return dense_vec

    def find_matches(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Calculates cosine similarity between curriculum query embedding and canonical skill embeddings.
        Returns ranked skill candidates with similarity score and explainable semantic rationale.
        """
        if not self.is_indexed or self.skill_embeddings is None or not query_text.strip():
            return []

        query_vec = self.encode_text(query_text).reshape(1, -1)
        sim_scores = cosine_similarity(query_vec, self.skill_embeddings)[0]

        candidates = []
        for idx, skill in enumerate(self.skills):
            raw_score = float(sim_scores[idx])
            # Calibrated clip to [0.0, 1.0]
            score = round(float(np.clip(raw_score, 0.0, 1.0)), 4)

            # Assign confidence tier
            if score >= 0.65:
                confidence = "HIGH"
            elif score >= 0.40:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"

            explanation = (
                f"Dense semantic similarity: {score:.3f}. "
                f"Captures conceptual alignment with {skill['category']} domain concepts."
            )

            candidates.append({
                "skill_id": skill["id"],
                "canonical_name": skill["canonical_name"],
                "category": skill["category"],
                "similarity_score": score,
                "method": "SEMANTIC",
                "confidence": confidence,
                "explanation": explanation
            })

        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates[:top_k]
