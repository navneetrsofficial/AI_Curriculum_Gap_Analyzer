import json
import numpy as np
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .preprocessor import normalize_text, tokenize

class KeywordBaselineEngine:
    """
    Transparent lexical baseline method.
    Uses normalized token overlap, alias matching, and TF-IDF cosine similarity.
    Does not use deep neural embeddings, establishing a clean baseline for comparison.
    """
    def __init__(self):
        self.skills: List[Dict[str, Any]] = []
        self.vectorizer: TfidfVectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            lowercase=True
        )
        self.tfidf_matrix = None
        self.corpus_texts = []
        self.is_indexed = False

    def index_skills(self, skills_data: List[Dict[str, Any]]):
        """
        Pre-computes lexical TF-IDF indices over canonical skill names, aliases, and descriptions.
        """
        self.skills = skills_data
        self.corpus_texts = []
        for s in skills_data:
            aliases = json.loads(s.get("aliases_json") or "[]")
            aliases_str = " ".join(aliases)
            # Combine canonical name (weighted by repeating), aliases, and description
            doc = f"{s['canonical_name']} {s['canonical_name']} {aliases_str} {s['description']}"
            self.corpus_texts.append(doc)
        
        if self.corpus_texts:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus_texts)
            self.is_indexed = True

    def find_matches(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Calculates lexical similarity score and returns ranked candidates.
        Score is composite: 0.5 * TF-IDF cosine similarity + 0.5 * Jaccard token overlap + exact alias boost.
        """
        if not self.is_indexed or not self.skills or not query_text.strip():
            return []

        norm_query = normalize_text(query_text)
        query_tokens = set(tokenize(norm_query))
        
        # 1. TF-IDF cosine similarity
        query_vec = self.vectorizer.transform([norm_query])
        tfidf_scores = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        candidates = []
        for idx, skill in enumerate(self.skills):
            aliases = json.loads(skill.get("aliases_json") or "[]")
            all_skill_terms = [skill["canonical_name"].lower()] + [a.lower() for a in aliases]
            
            # Exact term matching check
            exact_match_found = False
            matched_terms = []
            for term in all_skill_terms:
                term_norm = normalize_text(term)
                if term_norm and f" {term_norm} " in f" {norm_query} ":
                    exact_match_found = True
                    matched_terms.append(term)

            # Jaccard overlap with skill description tokens
            skill_tokens = set(tokenize(skill["description"])) | set(tokenize(skill["canonical_name"]))
            intersection = query_tokens.intersection(skill_tokens)
            union = query_tokens.union(skill_tokens)
            jaccard = len(intersection) / max(len(union), 1)

            tfidf_score = float(tfidf_scores[idx])

            # Composite Lexical Score
            raw_score = 0.55 * tfidf_score + 0.45 * jaccard
            if exact_match_found:
                raw_score = min(1.0, raw_score + 0.35)

            # Cap score between 0.0 and 1.0
            final_score = round(float(np.clip(raw_score, 0.0, 1.0)), 4)

            # Formulate explainable reason
            reasons = []
            if matched_terms:
                reasons.append(f"Direct term match: {', '.join(matched_terms)}")
            if tfidf_score > 0.2:
                reasons.append(f"Lexical TF-IDF match ({tfidf_score:.2f})")
            if jaccard > 0.1:
                reasons.append(f"Token overlap count: {len(intersection)} terms")
            if not reasons:
                reasons.append("Low general lexical overlap")

            explanation = " | ".join(reasons)

            # Confidence category
            if final_score >= 0.65:
                confidence = "HIGH"
            elif final_score >= 0.40:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"

            candidates.append({
                "skill_id": skill["id"],
                "canonical_name": skill["canonical_name"],
                "category": skill["category"],
                "similarity_score": final_score,
                "method": "KEYWORD",
                "confidence": confidence,
                "explanation": explanation
            })

        # Rank descending
        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates[:top_k]
