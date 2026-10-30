import re
import string
from typing import List, Tuple

# Common stop words for academic/syllabi text normalization
STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", 
    "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", 
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", 
    "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", 
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", 
    "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", 
    "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", 
    "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", 
    "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", 
    "yourselves", "student", "students", "able", "course", "outcome", "outcomes", "learn", "study"
}

BLOOM_ACTION_VERBS = {
    "Create": ["design", "construct", "create", "develop", "build", "formulate", "author", "invent", "integrate", "synthesize"],
    "Evaluate": ["evaluate", "judge", "critique", "test", "defend", "assess", "justify", "rate", "appraise", "measure"],
    "Analyze": ["analyze", "distinguish", "examine", "compare", "contrast", "investigate", "differentiate", "inspect", "debug"],
    "Apply": ["apply", "implement", "execute", "solve", "use", "demonstrate", "operate", "practice", "utilize", "deploy"],
    "Understand": ["explain", "describe", "discuss", "identify", "interpret", "outline", "summarize", "classify", "comprehend"],
    "Remember": ["define", "list", "state", "recall", "repeat", "name", "recognize", "reproduce", "retrieve"]
}

def normalize_text(text: str) -> str:
    """Normalize input text: lowercasing, removing punctuation and redundant whitespace."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(f"[{re.escape(string.punctuation)}]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def tokenize(text: str, remove_stopwords: bool = True) -> List[str]:
    """Tokenize normalized text, optionally removing common syllabus stopwords."""
    norm = normalize_text(text)
    tokens = norm.split()
    if remove_stopwords:
        tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return tokens

def provisional_bloom_suggestion(outcome_text: str) -> Tuple[str, str]:
    """
    Suggests a provisional Bloom's taxonomy depth level based on transparent keyword heuristics.
    Returns (suggested_level, rationale).
    Note: As noted in documentation, this is a provisional heuristic, not certified student competence.
    """
    text_lower = outcome_text.lower()
    for level, verbs in BLOOM_ACTION_VERBS.items():
        for verb in verbs:
            # Check verb as standalone word or starting verb
            if re.search(r"\b" + re.escape(verb) + r"\b", text_lower):
                return level, f"Provisional match based on action verb '{verb}'"
    return "Understand", "Default provisional level (no distinct action verb detected)"
