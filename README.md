# AI Curriculum Gap Analyzer
### Career-Aligned Skill Gap Analysis & Personalized Learning Roadmap using Explainable AI

> **Smart India Hackathon (SIH) / Third-Year B.Tech Computer Science & Engineering Innovation Project**  
> Developed for Academic Curriculum Alignment, Explainable NLP Skill Mapping, and Deterministic Career Roadmap Planning.

---

## 1. Project Overview

Academic curricula contain course outcomes, units, topics, and learning objectives. However, these academic components are not always explicitly mapped to practical skills expected in modern industry roles.

The **AI Curriculum Gap Analyzer** is a full-stack educational technology platform that:
1. Accepts syllabus curricula from different institutions and degree programmes.
2. Maps academic course outcomes to a canonical taxonomy of industry skills using a **dual-method engine**:
   - **Method A:** Transparent Lexical Baseline (Normalized Token Overlap + Jaccard + TF-IDF Lexical Cosine)
   - **Method B:** Semantic Dense Vector Embeddings (Sentence Transformers / Dense SVD Projections)
3. Evaluates both methods empirically in an authentic **Evaluation Lab** over benchmark test examples, measuring Precision, Recall, F1-Score, Top-k Accuracy, and Inference Latency.
4. Separates three critical dimensions without conflation:
   - **Curriculum Coverage ($c_{\text{curr}}$):** What the academic syllabus teaches, scaled by Bloom's taxonomy depth.
   - **Self-Assessed Competence ($c_{\text{self}}$):** Student-reported practical ability (`None`, `Basic`, `Can Build Something`).
   - **Industry Demand ($w_i$):** Role-specific benchmark weights on a documented scale (1.0 to 5.0).
5. Generates a **deterministic, prerequisite-aware weekly learning roadmap** respecting study time budgets without LLM hallucination.

---

## 2. System Architecture & Technology Stack

```
+---------------------------------------------------------------------------------+
|                                React 19 Frontend                                |
|  TypeScript | Vite | Tailwind CSS | Recharts | Lucide Icons | Responsive Design |
+---------------------------------------+-----------------------------------------+
                                        | HTTP / JSON REST
+---------------------------------------v-----------------------------------------+
|                               FastAPI Backend                                  |
|   - Modular API Routers (/curricula, /roles, /mappings, /analysis, /roadmaps)   |
|   - Deterministic Roadmap DAG Scheduler (topological sorting + weekly budget)  |
|   - Mathematical Alignment Calculator: 100 * [Σ(w_i * c_i * b_i) / Σ(w_i)]     |
+---------------------------------------+-----------------------------------------+
                    |                                     |
+-------------------v-------------------+ +---------------v-----------------------+
|          NLP Engine Module            | |       Database Storage Layer          |
| - Method A: Lexical TF-IDF Baseline   | | - SQLite (Local development default)  |
| - Method B: Semantic Dense Embedding  | | - Compatible with PostgreSQL          |
| - Provisional Bloom's Depth Heuristic | | - Full entity relationships & DAG     |
| - Live Empirical Evaluation Lab       | | - Seeded B.Tech CSE Demo Dataset      |
+---------------------------------------+ +---------------------------------------+
```

---

## 3. Quick Start & Local Execution

### Prerequisites
- **Python 3.10+** (Python 3.12 verified)
- **Node.js v18+** (Node.js v22 verified) and **npm**

### Step 1: Clone or Navigate to Directory
```bash
cd "c:\Users\navee\OneDrive\Desktop\y"
```

### Step 2: Backend Setup & Launch
1. Install Python dependencies:
   ```bash
   python -m pip install -r backend/requirements.txt
   ```
2. Start the FastAPI server (running on port 8000):
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
3. Interactive API documentation is available at:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Step 3: Frontend Setup & Launch
1. In a second terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at:
   - Application URL: [http://localhost:5173](http://localhost:5173)

---

## 4. Key Mathematical Formulas & Methodology

### Step 1: Curriculum Coverage ($c_{\text{curr}}$)
Derived from verified and accepted course outcome mappings. Scaled by Bloom's taxonomy depth factor ($b_i$):
- Remember: 0.4
- Understand: 0.5
- Apply: 0.8
- Analyze: 0.9
- Evaluate: 0.95
- Create: 1.0

### Step 2: Self-Assessed Competence ($c_{\text{self}}$)
- **None:** 0.0 ("Little or no practical understanding")
- **Basic:** 0.5 ("Understands fundamentals; simple tasks with guidance")
- **Can Build Something:** 1.0 ("Independently builds small practical tasks")

### Step 3: Current Skill Indicator ($c_i$)
$$\text{Current Skill Indicator } c_i = (w_{\text{curr}} \times c_{\text{curr}}) + (w_{\text{self}} \times c_{\text{self}})$$
*(Default configurable weights: $w_{\text{curr}} = 0.4$, $w_{\text{self}} = 0.6$)*

### Step 4: Role Alignment Score (%)
$$\text{Role Alignment (\%)} = 100 \times \left[ \frac{\sum_{i} (w_i \times c_i \times b_i)}{\sum_{i} w_i} \right]$$
*Where $w_i$ is the normalized industry demand weight (1.0 to 5.0) and $b_i$ is the Bloom's depth factor.*

### Step 5: Skill Gap & Priority Score
$$\text{Skill Gap } g_i = \max(0, \text{Required Level} - c_i)$$
$$\text{Priority Score } P_i = \text{Normalized Demand } (w_i / w_{\max}) \times g_i$$

---

## 5. Five-Minute Faculty Demonstration Script

1. **Problem Statement (Landing Page):**
   - Open [http://localhost:5173/](http://localhost:5173/). Explain how syllabi contain course outcomes that do not explicitly map to practical industry skills.
2. **Curriculum Hierarchy (My Curricula):**
   - Click **My Curricula**. View the pre-seeded JSPM University Pune Autonomous B.Tech CSE syllabus.
   - Expand Course CS401 (*Web Technologies*). Click **AI Mapping Engine** next to an outcome to demonstrate real-time dual-engine matching with similarity scores.
3. **Role Selection (Industry Roles):**
   - Click **Industry Roles**. Review the four canonical profiles: *Frontend Developer*, *Backend Developer*, *Full-Stack Developer*, and *Data/ML Developer*.
4. **Self-Assessment (Skill Assessment):**
   - Click **Skill Assessment**. Update ratings (`Basic`, `Can Build Something`) and click **Save Assessments**.
5. **Skill Gap Analysis (Gap Analysis):**
   - Click **Gap Analysis**. Inspect the overall Role Alignment score, adjust the formula weight sliders, expand the mathematical model card, and examine the prioritized gaps table.
6. **Deterministic Roadmap (Learning Roadmap):**
   - Click **Learning Roadmap**. Set available weeks (e.g., 8) and study hours per week (e.g., 10 hrs = 80h budget).
   - Observe how prerequisite dependencies are strictly enforced, view tasks in **Timeline**, **Kanban**, and **Dependencies** mode, and note any unscheduled skills flagged when budget is exceeded.
7. **Empirical AI Evaluation (Evaluation Lab):**
   - Click **Evaluation Lab**. Run live benchmarking over the test partition.
   - Review side-by-side Accuracy, Precision, Recall, F1-Score, and inference latencies, proving a genuine AI/ML contribution.

---

## 6. Automated Test Suite

Run the backend test suite:
```bash
python -m unittest backend/app/tests/test_core.py -v
```
**Test Results (Executed & Verified):**
- `test_root`: OK
- `test_text_preprocessor`: OK (normalization, tokenization, Bloom heuristic)
- `test_get_roles`: OK (4 canonical roles verified)
- `test_get_skills`: OK (20+ canonical skills verified)
- `test_skills_prerequisite_graph_dag`: OK (Cycle detection confirms valid DAG)
- `test_mapping_suggestion`: OK (dual-engine candidates verified)
- `test_skill_gap_analysis`: OK (mathematical indicator & gap calculations verified)
- `test_roadmap_generation`: OK (prerequisite-aware weekly allocations verified)
- `test_evaluation_lab_run`: OK (accuracy, precision, recall, and latency measured)
- **Status:** **9/9 tests passing (100% success rate)**

---

## 7. Project Scope & Academic Disclosures
- **Guidance, Not Placement Guarantee:** This system provides learning pathway recommendations based on documented curriculum outcomes and curated industry benchmarks. It does not predict or guarantee hiring.
- **Explainability:** All priority rankings and weekly schedules are computed deterministically without relying on generative LLMs for numerical decisions.
- **Genuine Evaluation:** Benchmark metrics shown in the Evaluation Lab are calculated directly from active runtime model executions over annotated ground-truth items.
