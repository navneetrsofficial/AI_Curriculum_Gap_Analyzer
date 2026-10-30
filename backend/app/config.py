import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Curriculum Gap Analyzer"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./curriculum_gap.db")
    
    # NLP & Embedding Model Config
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    SIMILARITY_THRESHOLD_HIGH: float = 0.65
    SIMILARITY_THRESHOLD_MEDIUM: float = 0.40
    
    # Alignment & Indicator Defaults
    DEFAULT_CURRICULUM_WEIGHT: float = 0.4
    DEFAULT_SELF_RATING_WEIGHT: float = 0.6
    
    # Demo and Environment
    IS_DEMO_MODE: bool = True
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
