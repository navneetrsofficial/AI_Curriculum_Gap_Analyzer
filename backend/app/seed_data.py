import json
from sqlalchemy.orm import Session
from .models import (
    Institution, Programme, CurriculumVersion, Semester, Course, Unit, Topic,
    CourseOutcome, Skill, SkillPrerequisite, RoleProfile, RoleSkill,
    CurriculumSkillMapping, UserSkillAssessment, LearningResource,
    EvaluationDataset, EvaluationExample
)

def seed_database(db: Session):
    """
    Populates comprehensive, clean demo data for:
    - Canonical Skill Taxonomy (20 skills)
    - Prerequisite Relationships (DAG without cycles)
    - 4 Industry Roles (Frontend, Backend, Full-Stack, Data/ML)
    - Realistic B.Tech CSE Curriculum (JSPM University / Autonomous CSE)
    - Pre-computed Curriculum Mappings with Bloom's Depth
    - Student Self-Assessments
    - Curated Learning Resources
    - Labelled Evaluation Dataset (Test / Dev partitions)
    """
    if db.query(Skill).count() > 0:
        return # Already seeded

    # 1. CANONICAL SKILLS
    skills_data = [
        {
            "id": "html-css",
            "canonical_name": "HTML & Modern CSS",
            "description": "Semantic HTML5 markup, responsive layouts with Flexbox and CSS Grid, and accessible UI structure.",
            "category": "Frontend Development",
            "aliases_json": json.dumps(["HTML5", "CSS3", "Responsive Design", "Flexbox", "Grid"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 10.0
        },
        {
            "id": "javascript",
            "canonical_name": "Modern JavaScript",
            "description": "ES6+ asynchronous programming, Promises, async/await, DOM manipulation, closures, and modular JS.",
            "category": "Frontend Development",
            "aliases_json": json.dumps(["JS", "ECMAScript", "ES6", "Vanilla JS"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 14.0
        },
        {
            "id": "typescript",
            "canonical_name": "TypeScript",
            "description": "Static type systems, generic programming, interface contracts, and type safety for large-scale web applications.",
            "category": "Frontend Development",
            "aliases_json": json.dumps(["TS", "Typed JS", "Type Checking"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 12.0
        },
        {
            "id": "react",
            "canonical_name": "React.js Framework",
            "description": "Declarative component-based UI engineering, functional components, hooks (useState, useEffect), state management, and Virtual DOM.",
            "category": "Frontend Development",
            "aliases_json": json.dumps(["React", "ReactJS", "React Components"]),
            "bloom_depth_min": "Create",
            "estimated_hours": 20.0
        },
        {
            "id": "python-core",
            "canonical_name": "Python Programming",
            "description": "Object-oriented programming, data structures, list comprehensions, generators, error handling, and standard libraries.",
            "category": "Programming Fundamentals",
            "aliases_json": json.dumps(["Python", "Python 3", "OOP Python"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 12.0
        },
        {
            "id": "fastapi-backend",
            "canonical_name": "FastAPI & RESTful APIs",
            "description": "Developing asynchronous HTTP REST microservices, request routing, Pydantic data validation, OpenAPI specs, and status codes.",
            "category": "Backend Development",
            "aliases_json": json.dumps(["FastAPI", "REST APIs", "API Design", "Web APIs"]),
            "bloom_depth_min": "Create",
            "estimated_hours": 16.0
        },
        {
            "id": "nodejs-backend",
            "canonical_name": "Node.js & Express",
            "description": "Server-side JavaScript runtimes, event loops, Express HTTP routing, middleware pipelines, and asynchronous I/O.",
            "category": "Backend Development",
            "aliases_json": json.dumps(["NodeJS", "Express.js", "Server-side JS"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 14.0
        },
        {
            "id": "sql-relational",
            "canonical_name": "SQL & Relational Databases",
            "description": "Relational schema design, normalization (1NF-3NF), indexing, ACID transactions, complex JOIN queries, and integrity constraints.",
            "category": "Databases",
            "aliases_json": json.dumps(["SQL", "RDBMS", "PostgreSQL", "MySQL", "Database Normalization"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 14.0
        },
        {
            "id": "nosql-db",
            "canonical_name": "NoSQL Databases",
            "description": "Document-oriented databases, MongoDB CRUD operations, aggregations, schema design for non-relational unstructured data.",
            "category": "Databases",
            "aliases_json": json.dumps(["MongoDB", "NoSQL", "Document Store"]),
            "bloom_depth_min": "Understand",
            "estimated_hours": 8.0
        },
        {
            "id": "git-vcs",
            "canonical_name": "Git & Version Control",
            "description": "Distributed version control, branching workflows, pull requests, merge conflict resolution, commit hygiene, and repository management.",
            "category": "Software Engineering",
            "aliases_json": json.dumps(["Git", "GitHub", "VCS", "Branching"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 6.0
        },
        {
            "id": "docker-container",
            "canonical_name": "Docker & Containerization",
            "description": "Dockerfile construction, multi-stage image builds, container isolation, volume mounting, and multi-container orchestration.",
            "category": "Cloud and DevOps",
            "aliases_json": json.dumps(["Docker", "Containers", "Docker Compose"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 12.0
        },
        {
            "id": "ci-cd-pipelines",
            "canonical_name": "CI/CD & DevOps Automation",
            "description": "Automated build and testing pipelines, continuous integration, GitHub Actions, deployment automation, and artifact packaging.",
            "category": "Cloud and DevOps",
            "aliases_json": json.dumps(["CI/CD", "Continuous Integration", "GitHub Actions", "Pipelines"]),
            "bloom_depth_min": "Understand",
            "estimated_hours": 10.0
        },
        {
            "id": "dsa",
            "canonical_name": "Data Structures & Algorithms",
            "description": "Linear and hierarchical data structures (trees, graphs, heaps), dynamic programming, asymptotic complexity analysis (Big-O).",
            "category": "Programming Fundamentals",
            "aliases_json": json.dumps(["DSA", "Algorithms", "Binary Trees", "Sorting Algorithms"]),
            "bloom_depth_min": "Analyze",
            "estimated_hours": 24.0
        },
        {
            "id": "math-stats",
            "canonical_name": "Applied Statistics & Probability",
            "description": "Probability distributions, hypothesis testing, Bayes theorem, linear algebra (eigenvectors, matrix transformations), and descriptive stats.",
            "category": "Mathematics and Statistics",
            "aliases_json": json.dumps(["Statistics", "Probability", "Linear Algebra", "Statistical Inference"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 16.0
        },
        {
            "id": "data-analysis",
            "canonical_name": "Data Analysis & Pandas",
            "description": "Data wrangling, cleaning missing values, exploratory data analysis (EDA), NumPy arrays, Pandas DataFrames, and visualization.",
            "category": "Data Analysis",
            "aliases_json": json.dumps(["Pandas", "NumPy", "EDA", "Data Cleaning", "Data Wrangling"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 14.0
        },
        {
            "id": "ml-fundamentals",
            "canonical_name": "Machine Learning Fundamentals",
            "description": "Supervised and unsupervised learning, linear regression, logistic regression, decision trees, random forests, clustering, and Scikit-Learn.",
            "category": "Machine Learning",
            "aliases_json": json.dumps(["ML", "Scikit-Learn", "Supervised Learning", "Classification", "Regression"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 20.0
        },
        {
            "id": "deep-learning",
            "canonical_name": "Deep Learning & Neural Networks",
            "description": "Feedforward neural networks, backpropagation, activation functions, convolutional neural networks (CNNs), and loss optimization.",
            "category": "Deep Learning",
            "aliases_json": json.dumps(["Deep Learning", "Neural Networks", "CNN", "PyTorch", "TensorFlow"]),
            "bloom_depth_min": "Understand",
            "estimated_hours": 20.0
        },
        {
            "id": "model-eval",
            "canonical_name": "Model Evaluation & Metrics",
            "description": "Cross-validation, confusion matrices, Precision, Recall, F1-score, ROC-AUC, bias-variance tradeoff, and hyperparameter tuning.",
            "category": "Machine Learning",
            "aliases_json": json.dumps(["Model Validation", "ROC-AUC", "F1 Score", "Cross Validation"]),
            "bloom_depth_min": "Evaluate",
            "estimated_hours": 8.0
        },
        {
            "id": "software-testing",
            "canonical_name": "Software Testing & QA",
            "description": "Unit testing, integration testing, test fixtures, mocking, automated assertions (PyTest/Jest), and test-driven development.",
            "category": "Software Engineering",
            "aliases_json": json.dumps(["Unit Testing", "PyTest", "Jest", "Test Automation"]),
            "bloom_depth_min": "Apply",
            "estimated_hours": 8.0
        },
        {
            "id": "web-security",
            "canonical_name": "Web Security & Authentication",
            "description": "Authentication mechanisms (JWT, sessions, hashing), HTTPS, CORS policy, SQL injection prevention, and OWASP Top 10 vulnerabilities.",
            "category": "Security",
            "aliases_json": json.dumps(["Web Security", "JWT", "OWASP", "Authentication", "Authorization"]),
            "bloom_depth_min": "Understand",
            "estimated_hours": 10.0
        }
    ]

    for s_dict in skills_data:
        skill = Skill(**s_dict)
        db.add(skill)
    db.commit()

    # 2. PREREQUISITES (Valid Directed Acyclic Graph)
    prereqs = [
        ("javascript", "html-css"),
        ("react", "javascript"),
        ("typescript", "javascript"),
        ("nodejs-backend", "javascript"),
        ("fastapi-backend", "python-core"),
        ("fastapi-backend", "sql-relational"),
        ("dsa", "python-core"),
        ("data-analysis", "python-core"),
        ("data-analysis", "math-stats"),
        ("ml-fundamentals", "data-analysis"),
        ("deep-learning", "ml-fundamentals"),
        ("model-eval", "ml-fundamentals"),
        ("ci-cd-pipelines", "git-vcs"),
        ("ci-cd-pipelines", "docker-container"),
        ("software-testing", "python-core")
    ]
    for skill_id, prereq_id in prereqs:
        db.add(SkillPrerequisite(skill_id=skill_id, prerequisite_skill_id=prereq_id))
    db.commit()

    # 3. FOUR INDUSTRY ROLE PROFILES
    roles_data = [
        {
            "id": "frontend-dev",
            "role_name": "Frontend Developer",
            "description": "Builds responsive, high-performance, and accessible web user interfaces using modern JavaScript frameworks.",
            "source_type": "Curated Benchmark Profile",
            "source_date": "2024-Q4",
            "evidence_status": "Curated Industry Baseline",
            "skills": [
                ("html-css", 5.0, 0.9),
                ("javascript", 5.0, 0.9),
                ("typescript", 4.0, 0.8),
                ("react", 5.0, 0.85),
                ("git-vcs", 4.0, 0.8),
                ("software-testing", 3.0, 0.7),
                ("web-security", 3.0, 0.6)
            ]
        },
        {
            "id": "backend-dev",
            "role_name": "Backend Developer",
            "description": "Architects server-side APIs, database schemas, secure transactions, background workers, and containerized deployments.",
            "source_type": "Curated Benchmark Profile",
            "source_date": "2024-Q4",
            "evidence_status": "Curated Industry Baseline",
            "skills": [
                ("python-core", 5.0, 0.9),
                ("fastapi-backend", 5.0, 0.85),
                ("sql-relational", 5.0, 0.9),
                ("nosql-db", 3.0, 0.7),
                ("git-vcs", 4.0, 0.8),
                ("docker-container", 4.0, 0.75),
                ("software-testing", 4.0, 0.8),
                ("web-security", 4.0, 0.8),
                ("dsa", 4.0, 0.8)
            ]
        },
        {
            "id": "fullstack-dev",
            "role_name": "Full-Stack Developer",
            "description": "Engineers end-to-end web applications covering user interface clients, HTTP REST backends, and databases.",
            "source_type": "Curated Benchmark Profile",
            "source_date": "2024-Q4",
            "evidence_status": "Curated Industry Baseline",
            "skills": [
                ("html-css", 4.0, 0.85),
                ("javascript", 5.0, 0.9),
                ("typescript", 4.0, 0.8),
                ("react", 4.5, 0.85),
                ("fastapi-backend", 4.5, 0.85),
                ("sql-relational", 4.5, 0.85),
                ("git-vcs", 4.0, 0.8),
                ("docker-container", 3.5, 0.7),
                ("software-testing", 3.5, 0.75),
                ("web-security", 3.5, 0.7)
            ]
        },
        {
            "id": "data-ml-dev",
            "role_name": "Data & ML Developer",
            "description": "Designs predictive machine learning pipelines, feature engineering, exploratory data analysis, and model validation.",
            "source_type": "Curated Benchmark Profile",
            "source_date": "2024-Q4",
            "evidence_status": "Curated Industry Baseline",
            "skills": [
                ("python-core", 5.0, 0.95),
                ("math-stats", 5.0, 0.85),
                ("dsa", 4.0, 0.8),
                ("sql-relational", 4.0, 0.8),
                ("data-analysis", 5.0, 0.9),
                ("ml-fundamentals", 5.0, 0.9),
                ("deep-learning", 3.5, 0.7),
                ("model-eval", 4.5, 0.85),
                ("git-vcs", 3.5, 0.7),
                ("docker-container", 3.0, 0.6)
            ]
        }
    ]

    for r in roles_data:
        profile = RoleProfile(
            id=r["id"],
            role_name=r["role_name"],
            description=r["description"],
            source_type=r["source_type"],
            source_date=r["source_date"],
            evidence_status=r["evidence_status"],
            is_demo=True
        )
        db.add(profile)
        db.commit()
        for skill_id, demand_w, req_lvl in r["skills"]:
            db.add(RoleSkill(
                role_profile_id=r["id"],
                skill_id=skill_id,
                demand_weight=demand_w,
                required_level=req_lvl
            ))
        db.commit()

    # 4. INSTITUTION & CURRICULUM HIERARCHY
    inst = Institution(
        name="JSPM University Pune",
        location="Pune, Maharashtra, India",
        metadata_json=json.dumps({"type": "Autonomous University", "accreditation": "NAAC A+"})
    )
    db.add(inst)
    db.commit()

    prog = Programme(
        institution_id=inst.id,
        name="Computer Science & Engineering",
        degree="B.Tech",
        branch="Computer Science & Engineering"
    )
    db.add(prog)
    db.commit()

    curric = CurriculumVersion(
        programme_id=prog.id,
        academic_year="2024-2025",
        version_name="B.Tech CSE Autonomous Syllabus v2024",
        status="ACTIVE",
        is_demo=True
    )
    db.add(curric)
    db.commit()

    # Semesters & Courses
    sem3 = Semester(curriculum_version_id=curric.id, semester_number=3, name="Semester III")
    sem4 = Semester(curriculum_version_id=curric.id, semester_number=4, name="Semester IV")
    sem5 = Semester(curriculum_version_id=curric.id, semester_number=5, name="Semester V")
    db.add_all([sem3, sem4, sem5])
    db.commit()

    # Course 1: Data Structures
    c1 = Course(
        semester_id=sem3.id,
        course_code="CS301",
        name="Data Structures and Algorithms",
        credits=4.0,
        description="Core concepts of linear and non-linear data structures, trees, sorting algorithms, and algorithm analysis."
    )
    # Course 2: Database Management Systems
    c2 = Course(
        semester_id=sem3.id,
        course_code="CS302",
        name="Database Management Systems",
        credits=4.0,
        description="Relational database concepts, SQL queries, entity-relationship models, schema normalization, and transaction processing."
    )
    # Course 3: Python Programming
    c3 = Course(
        semester_id=sem3.id,
        course_code="CS303",
        name="Object-Oriented Programming with Python",
        credits=3.0,
        description="Python syntax, object-oriented concepts, exception handling, data structures, and file I/O operations."
    )
    # Course 4: Web Technologies
    c4 = Course(
        semester_id=sem4.id,
        course_code="CS401",
        name="Web Technologies and Client-Side Scripting",
        credits=3.0,
        description="Fundamentals of HTML5, CSS layout styling, client-side JavaScript DOM interactions, and responsive web pages."
    )
    # Course 5: Machine Learning
    c5 = Course(
        semester_id=sem5.id,
        course_code="CS501",
        name="Machine Learning and Data Science",
        credits=4.0,
        description="Supervised learning algorithms, regression, decision trees, exploratory data analysis using Pandas, and model metrics."
    )
    db.add_all([c1, c2, c3, c4, c5])
    db.commit()

    # Units and Outcomes for CS301 (DSA)
    u1 = Unit(course_id=c1.id, name="Unit I: Trees and Graph Algorithms", sequence_number=1)
    db.add(u1)
    db.commit()
    co1 = CourseOutcome(
        course_id=c1.id,
        unit_id=u1.id,
        outcome_code="CO1",
        outcome_text="Analyze and implement binary search trees, heap structures, and graph traversal algorithms for problem solving.",
        bloom_level="Analyze",
        suggested_bloom="Analyze"
    )
    db.add(co1)

    # Units and Outcomes for CS302 (DBMS)
    u2 = Unit(course_id=c2.id, name="Unit II: Relational Schema Design & SQL", sequence_number=1)
    db.add(u2)
    db.commit()
    co2 = CourseOutcome(
        course_id=c2.id,
        unit_id=u2.id,
        outcome_code="CO1",
        outcome_text="Design relational schemas, apply normalization principles up to 3NF, and construct complex SQL queries with ACID guarantees.",
        bloom_level="Apply",
        suggested_bloom="Apply"
    )
    db.add(co2)

    # Units and Outcomes for CS303 (Python)
    u3 = Unit(course_id=c3.id, name="Unit I: Python Core & OOP", sequence_number=1)
    db.add(u3)
    db.commit()
    co3 = CourseOutcome(
        course_id=c3.id,
        unit_id=u3.id,
        outcome_code="CO1",
        outcome_text="Develop modular programs using Python classes, inheritance, exceptions, and standard library data collections.",
        bloom_level="Apply",
        suggested_bloom="Apply"
    )
    db.add(co3)

    # Units and Outcomes for CS401 (Web Tech)
    u4 = Unit(course_id=c4.id, name="Unit I: HTML5, CSS3 and JavaScript DOM", sequence_number=1)
    db.add(u4)
    db.commit()
    co4 = CourseOutcome(
        course_id=c4.id,
        unit_id=u4.id,
        outcome_code="CO1",
        outcome_text="Build responsive web interfaces using semantic HTML5 markup, CSS Flexbox and Grid, and asynchronous JavaScript DOM handling.",
        bloom_level="Create",
        suggested_bloom="Create"
    )
    co4_b = CourseOutcome(
        course_id=c4.id,
        unit_id=u4.id,
        outcome_code="CO2",
        outcome_text="Understand concepts of web security, sessions, cookies, and HTTP request headers.",
        bloom_level="Understand",
        suggested_bloom="Understand"
    )
    db.add_all([co4, co4_b])

    # Units and Outcomes for CS501 (ML)
    u5 = Unit(course_id=c5.id, name="Unit I: Predictive Modeling & EDA", sequence_number=1)
    db.add(u5)
    db.commit()
    co5 = CourseOutcome(
        course_id=c5.id,
        unit_id=u5.id,
        outcome_code="CO1",
        outcome_text="Clean missing data, execute exploratory data analysis with Pandas, and train supervised machine learning models with cross-validation.",
        bloom_level="Apply",
        suggested_bloom="Apply"
    )
    db.add(co5)
    db.commit()

    # 5. PRE-MAPPED CURRICULUM TO SKILL MAPPINGS (ACCEPTED / CONFIRMED)
    mappings = [
        CurriculumSkillMapping(
            course_outcome_id=co1.id,
            skill_id="dsa",
            method="SEMANTIC",
            similarity_score=0.88,
            review_status="ACCEPTED",
            evidence_text="Outcome explicitly covers binary trees, graph traversals, and complexity analysis.",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co2.id,
            skill_id="sql-relational",
            method="SEMANTIC",
            similarity_score=0.91,
            review_status="ACCEPTED",
            evidence_text="Covers relational database schema design, normalization, ACID properties, and SQL.",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co3.id,
            skill_id="python-core",
            method="KEYWORD",
            similarity_score=0.85,
            review_status="ACCEPTED",
            evidence_text="Direct lexical alignment with Python OOP classes, syntax, and exception handling.",
            model_version="Lexical-Token-TFIDF"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co4.id,
            skill_id="html-css",
            method="SEMANTIC",
            similarity_score=0.89,
            review_status="ACCEPTED",
            evidence_text="Covers semantic HTML5 markup and responsive layout styling (Flexbox/Grid).",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co4.id,
            skill_id="javascript",
            method="SEMANTIC",
            similarity_score=0.84,
            review_status="ACCEPTED",
            evidence_text="Covers asynchronous JavaScript and client-side DOM event programming.",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co4_b.id,
            skill_id="web-security",
            method="SEMANTIC",
            similarity_score=0.74,
            review_status="ACCEPTED",
            evidence_text="Conceptual introduction to web security, sessions, and HTTP headers.",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co5.id,
            skill_id="data-analysis",
            method="SEMANTIC",
            similarity_score=0.82,
            review_status="ACCEPTED",
            evidence_text="Exploratory data analysis, missing data cleaning, and Pandas DataFrame manipulation.",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        ),
        CurriculumSkillMapping(
            course_outcome_id=co5.id,
            skill_id="ml-fundamentals",
            method="SEMANTIC",
            similarity_score=0.86,
            review_status="ACCEPTED",
            evidence_text="Supervised learning algorithms and classification with Scikit-Learn.",
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        )
    ]
    db.add_all(mappings)
    db.commit()

    # 6. SEED STUDENT SELF-ASSESSMENTS
    assessments = [
        UserSkillAssessment(user_id="student_user", skill_id="python-core", rating="Basic", rating_numeric=0.5),
        UserSkillAssessment(user_id="student_user", skill_id="html-css", rating="Can Build Something", rating_numeric=1.0),
        UserSkillAssessment(user_id="student_user", skill_id="javascript", rating="Basic", rating_numeric=0.5),
        UserSkillAssessment(user_id="student_user", skill_id="sql-relational", rating="Can Build Something", rating_numeric=1.0),
        UserSkillAssessment(user_id="student_user", skill_id="react", rating="None", rating_numeric=0.0),
        UserSkillAssessment(user_id="student_user", skill_id="fastapi-backend", rating="None", rating_numeric=0.0),
        UserSkillAssessment(user_id="student_user", skill_id="docker-container", rating="None", rating_numeric=0.0),
        UserSkillAssessment(user_id="student_user", skill_id="git-vcs", rating="Basic", rating_numeric=0.5)
    ]
    db.add_all(assessments)
    db.commit()

    # 7. CURATED VERIFIED LEARNING RESOURCES
    resources = [
        LearningResource(
            skill_id="react",
            title="React Official Documentation & Interactive Quick Start",
            provider="React Official Docs",
            url="https://react.dev/learn",
            resource_type="Documentation",
            estimated_hours=6.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="fastapi-backend",
            title="FastAPI Official Tutorial - User Guide",
            provider="FastAPI Documentation",
            url="https://fastapi.tiangolo.com/tutorial/",
            resource_type="Tutorial",
            estimated_hours=8.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="docker-container",
            title="Docker Documentation: Getting Started Workshop",
            provider="Docker Official Docs",
            url="https://docs.docker.com/get-started/",
            resource_type="Tutorial",
            estimated_hours=6.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="typescript",
            title="TypeScript for JavaScript Programmers",
            provider="TypeScript Official Handbook",
            url="https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html",
            resource_type="Documentation",
            estimated_hours=5.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="software-testing",
            title="PyTest Documentation: Getting Started",
            provider="Pytest.org",
            url="https://docs.pytest.org/en/stable/getting-started.html",
            resource_type="Documentation",
            estimated_hours=4.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="sql-relational",
            title="PostgreSQL Tutorial - Relational SQL from Basics to Advanced",
            provider="PostgreSQL Tutorial Hub",
            url="https://www.postgresqltutorial.com/",
            resource_type="Tutorial",
            estimated_hours=8.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="dsa",
            title="Visualizing Data Structures and Algorithms",
            provider="VisuAlgo",
            url="https://visualgo.net/",
            resource_type="Practice Exercise",
            estimated_hours=12.0,
            verification_status="VERIFIED"
        ),
        LearningResource(
            skill_id="ml-fundamentals",
            title="Scikit-Learn User Guide & Supervised Learning",
            provider="Scikit-Learn.org",
            url="https://scikit-learn.org/stable/user_guide.html",
            resource_type="Documentation",
            estimated_hours=10.0,
            verification_status="VERIFIED"
        )
    ]
    db.add_all(resources)
    db.commit()

    # 8. LABELLED EVALUATION DATASET
    eval_ds = EvaluationDataset(
        name="CSE Curriculum-to-Skill Benchmark Dataset",
        version="v1.0",
        description="Curated benchmark of 24 realistic academic syllabus statements paired with ground-truth canonical industry skills.",
        is_demo=True
    )
    db.add(eval_ds)
    db.commit()

    eval_examples = [
        # Frontend Examples
        ("Construct single-page reactive web user interfaces utilizing functional components and hooks for state synchronization.", "react", "React.js Framework", "Frontend Developer", "TEST"),
        ("Write client-side scripts to manipulate the browser Document Object Model and handle asynchronous HTTP fetch requests.", "javascript", "Modern JavaScript", "Frontend Developer", "TEST"),
        ("Create responsive multi-device page layouts implementing modern CSS3 Flexbox, CSS Grid, and media query specifications.", "html-css", "HTML & Modern CSS", "Frontend Developer", "TEST"),
        ("Apply static type annotations, generic interface contracts, and compiler strict checks to web scripts.", "typescript", "TypeScript", "Frontend Developer", "TEST"),
        
        # Backend Examples
        ("Implement asynchronous HTTP REST services with request validation, automatic schema generation, and dependency injection.", "fastapi-backend", "FastAPI & RESTful APIs", "Backend Developer", "TEST"),
        ("Formulate normalized database relations, implement primary/foreign keys, and execute multi-table SQL JOIN queries.", "sql-relational", "SQL & Relational Databases", "Backend Developer", "TEST"),
        ("Design non-relational document collections, embedding structures, and query execution in MongoDB.", "nosql-db", "NoSQL Databases", "Backend Developer", "TEST"),
        ("Construct container images using multi-stage Dockerfiles and isolate application runtimes with container networking.", "docker-container", "Docker & Containerization", "Backend Developer", "TEST"),
        
        # Core & Security Examples
        ("Write automated unit tests, mock external service dependencies, and compute code branch test coverage.", "software-testing", "Software Testing & QA", "Backend Developer", "TEST"),
        ("Understand token-based authorization protocols like JSON Web Tokens (JWT) and prevent Cross-Site Scripting (XSS).", "web-security", "Web Security & Authentication", "Backend Developer", "TEST"),
        ("Manage distributed code repositories, resolve merge conflicts, and manage feature branching workflows with Git.", "git-vcs", "Git & Version Control", "Full-Stack Developer", "TEST"),
        ("Analyze recursive time complexity and implement optimal balanced binary tree traversals.", "dsa", "Data Structures & Algorithms", "Full-Stack Developer", "TEST"),
        
        # Data & ML Examples
        ("Perform exploratory data analysis, clean missing values, and transform tabular records using Pandas DataFrames.", "data-analysis", "Data Analysis & Pandas", "Data & ML Developer", "TEST"),
        ("Train supervised classification models such as random forests and evaluate decision boundaries with Scikit-Learn.", "ml-fundamentals", "Machine Learning Fundamentals", "Data & ML Developer", "TEST"),
        ("Compute cross-validated performance metrics including Confusion Matrix, Precision, Recall, and ROC-AUC curves.", "model-eval", "Model Evaluation & Metrics", "Data & ML Developer", "TEST"),
        ("Formulate conditional probability calculations, Bayes theorem, and multivariate distributions for data modeling.", "math-stats", "Applied Statistics & Probability", "Data & ML Developer", "TEST"),
        ("Implement multi-layer perceptron neural networks with backpropagation and activation functions.", "deep-learning", "Deep Learning & Neural Networks", "Data & ML Developer", "TEST"),
        ("Configure automated build, test, and release delivery pipelines using GitHub Actions.", "ci-cd-pipelines", "CI/CD & DevOps Automation", "Full-Stack Developer", "TEST"),
        
        # Paraphrased Challenges (Semantic Strength Demonstration)
        ("Normalize enterprise database schemas into Third Normal Form (3NF) ensuring ACID transactional compliance.", "sql-relational", "SQL & Relational Databases", "Backend Developer", "TEST"),
        ("Develop modular object-oriented software employing classes, polymorphism, and encapsulated exceptions in Python.", "python-core", "Python Programming", "Backend Developer", "TEST"),
        ("Engineer asynchronous backend services handling concurrent I/O events with Express framework middleware.", "nodejs-backend", "Node.js & Express", "Backend Developer", "TEST"),
        ("Sanitize user inputs to mitigate Structured Query Language injections and session hijacking attacks.", "web-security", "Web Security & Authentication", "Backend Developer", "TEST"),
        ("Perform matrix decompositions, compute eigenvalues, and calculate statistical variances for dimensionality reduction.", "math-stats", "Applied Statistics & Probability", "Data & ML Developer", "TEST"),
        ("Execute hyperparameter grid search tuning and avoid model overfitting using k-fold cross-validation.", "model-eval", "Model Evaluation & Metrics", "Data & ML Developer", "TEST")
    ]

    for stmt, s_id, s_name, role, part in eval_examples:
        db.add(EvaluationExample(
            dataset_id=eval_ds.id,
            curriculum_statement=stmt,
            correct_skill_id=s_id,
            correct_skill_name=s_name,
            role=role,
            partition=part,
            annotator_id="CSE_Curriculum_Committee",
            notes="Expert-annotated academic syllabus outcome"
        ))
    db.commit()
