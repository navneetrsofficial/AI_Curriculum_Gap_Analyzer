import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal, Base, engine
from backend.app.seed_data import seed_database
from backend.app.routers.mappings import ensure_engines_indexed
from backend.app.ml.preprocessor import normalize_text, tokenize, provisional_bloom_suggestion

client = TestClient(app)

class TestCurriculumGapAnalyzer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        seed_database(db)
        ensure_engines_indexed(db)
        db.close()

    def test_root(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("AI Curriculum Gap Analyzer", data["project"])

    def test_text_preprocessor(self):
        text = "Analyze and Design Relational Database Schemas!"
        norm = normalize_text(text)
        self.assertEqual(norm, "analyze and design relational database schemas")
        tokens = tokenize(text)
        self.assertIn("analyze", tokens)
        self.assertIn("relational", tokens)
        
        bloom, _ = provisional_bloom_suggestion("Construct and deploy scalable React user interfaces")
        self.assertIn(bloom, ["Create", "Apply"])

    def test_get_roles(self):
        response = client.get("/api/roles")
        self.assertEqual(response.status_code, 200)
        roles = response.json()
        self.assertEqual(len(roles), 4)
        role_ids = [r["id"] for r in roles]
        self.assertIn("frontend-dev", role_ids)
        self.assertIn("backend-dev", role_ids)
        self.assertIn("fullstack-dev", role_ids)
        self.assertIn("data-ml-dev", role_ids)

    def test_get_skills(self):
        response = client.get("/api/skills")
        self.assertEqual(response.status_code, 200)
        skills = response.json()
        self.assertGreaterEqual(len(skills), 20)

    def test_skills_prerequisite_graph_dag(self):
        response = client.get("/api/skills/graph")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_valid_dag"])
        self.assertEqual(len(data["detected_cycles"]), 0)

    def test_mapping_suggestion(self):
        payload = {
            "outcome_text": "Implement asynchronous HTTP REST services with request validation and status codes",
            "top_k": 3
        }
        response = client.post("/api/mappings/suggest", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("keyword_baseline_candidates", data)
        self.assertIn("semantic_embedding_candidates", data)
        self.assertGreater(len(data["keyword_baseline_candidates"]), 0)

    def test_skill_gap_analysis(self):
        curric_res = client.get("/api/curricula")
        currics = curric_res.json()
        self.assertGreater(len(currics), 0)
        curric_id = currics[0]["id"]

        payload = {
            "user_id": "student_user",
            "role_profile_id": "frontend-dev",
            "curriculum_version_id": curric_id,
            "curriculum_weight": 0.4,
            "self_rating_weight": 0.6
        }
        response = client.post("/api/analysis", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["role_id"], "frontend-dev")
        self.assertIn("role_alignment_pct", data)
        self.assertGreater(len(data["skill_gaps"]), 0)

    def test_roadmap_generation(self):
        curric_res = client.get("/api/curricula")
        curric_id = curric_res.json()[0]["id"]

        payload = {
            "user_id": "student_user",
            "role_profile_id": "frontend-dev",
            "curriculum_version_id": curric_id,
            "available_weeks": 8,
            "hours_per_week": 10.0
        }
        response = client.post("/api/roadmaps/generate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_available_hours"], 80.0)
        self.assertGreater(len(data["tasks"]), 0)

    def test_evaluation_lab_run(self):
        ds_res = client.get("/api/evaluation/datasets")
        self.assertEqual(ds_res.status_code, 200)
        datasets = ds_res.json()
        self.assertGreater(len(datasets), 0)
        ds_id = datasets[0]["id"]

        payload = {
            "dataset_id": ds_id,
            "threshold": 0.45,
            "top_k": 3,
            "test_partition_only": True
        }
        response = client.post("/api/evaluation/run", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("keyword_baseline", data)
        self.assertIn("semantic_model", data)
        self.assertGreater(data["evaluated_count"], 0)
        self.assertIn("precision", data["keyword_baseline"])
        self.assertIn("top_1_accuracy", data["semantic_model"])

if __name__ == "__main__":
    unittest.main()
