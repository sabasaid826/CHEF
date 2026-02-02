# Product Requirements Document (PRD)
## CHEF – Constraint-based Hybrid Eating Framework

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Active Development

---

## 1. Problem Statement

### 1.1 Background
Existing recipe recommendation systems predominantly employ collaborative filtering or content-based approaches that optimize for predicted user preference or rating. While these methods achieve reasonable accuracy in preference prediction, they fail to incorporate explicit constraints that are critical for users with dietary restrictions, nutritional goals, or health conditions.

Current systems exhibit the following limitations:
- Inability to guarantee constraint satisfaction (e.g., allergen exclusion, caloric limits)
- Lack of nutritional awareness in the recommendation process
- Poor explainability of recommendation decisions
- Difficulty balancing multiple competing objectives (taste, nutrition, convenience)

### 1.2 Problem Definition
**How can we design a recipe recommendation system that satisfies explicit dietary and nutritional constraints while maintaining recommendation quality and providing transparent, explainable results?**

This problem requires moving beyond pure preference optimization to constraint satisfaction augmented with preference-based ranking.

### 1.3 Impact
The inability to reliably incorporate constraints in food recommendation has significant implications:
- Users with allergies risk exposure to harmful ingredients
- Individuals managing chronic conditions (diabetes, hypertension) cannot rely on recommendations for meal planning
- Health-conscious users lack tools for systematic nutritional optimization
- Recommendation systems cannot be audited for compliance with dietary guidelines

---

## 2. Objectives and Success Criteria

### 2.1 Primary Objectives
1. **Constraint Satisfaction**: Ensure 100% of recommendations satisfy all hard constraints specified by the user
2. **Recommendation Quality**: Achieve competitive performance on standard recommendation metrics (precision@k, NDCG) relative to unconstrained baselines
3. **Explainability**: Provide verifiable explanations for each recommendation showing constraint compliance and scoring rationale
4. **Modularity**: Design architecture that supports independent development, testing, and extension of components

### 2.2 Success Criteria

| Objective | Metric | Target | Measurement Method |
|-----------|--------|--------|-------------------|
| Constraint Compliance | Hard constraint satisfaction rate | 100% | Automated validation on test set |
| Recommendation Quality | Precision@10 | ≥ 0.6 | Offline evaluation with user ratings |
| Recommendation Quality | NDCG@10 | ≥ 0.7 | Offline evaluation with user ratings |
| Explainability | Explanation completeness | 100% | Manual audit of sample recommendations |
| System Performance | Recommendation latency | < 2 seconds | Benchmarking on standard hardware |
| Code Quality | Test coverage | ≥ 80% | pytest coverage analysis |

### 2.3 Secondary Objectives
- Support for multi-objective optimization (balancing multiple nutritional targets)
- Extensible constraint definition mechanism
- Clear documentation suitable for academic dissemination
- Reproducible evaluation pipeline

---

## 3. User Personas

### 3.1 Primary Personas

#### Persona 1: Health-Conscious Graduate Student
- **Background**: 24-year-old pursuing graduate studies, limited cooking experience, manages diet for fitness goals
- **Goals**: Find recipes that meet specific macronutrient targets (e.g., high protein, moderate carbs) within time constraints
- **Constraints**: Caloric range (400-600 kcal), minimum protein (25g), cooking time < 30 minutes
- **Pain Points**: Existing apps suggest recipes that look appealing but don't meet nutritional needs; manual filtering is time-consuming
- **Success Scenario**: Receives 10 recipe recommendations that all satisfy macro targets, with clear nutritional breakdowns

#### Persona 2: Individual with Food Allergies
- **Background**: 32-year-old professional with severe nut and shellfish allergies
- **Goals**: Discover new recipes without risk of allergen exposure
- **Constraints**: Absolute exclusion of specific ingredients (nuts, shellfish), preference for quick meals
- **Pain Points**: Cannot trust recommendations from systems that don't guarantee allergen exclusion; has experienced close calls with mislabeled recipes
- **Success Scenario**: Confidently explores recommended recipes knowing all contain zero allergen risk, with explicit verification

#### Persona 3: Nutrition Researcher
- **Background**: Academic researcher studying dietary patterns and recommendation systems
- **Goals**: Evaluate recommendation algorithms, understand constraint handling mechanisms, reproduce results
- **Constraints**: Need for algorithmic transparency, access to evaluation metrics, reproducible pipelines
- **Pain Points**: Most recommendation systems are black boxes; difficult to validate constraint logic or compare approaches
- **Success Scenario**: Can inspect constraint enforcement code, run controlled experiments, and publish findings based on the framework

### 3.2 Secondary Personas

#### Persona 4: Budget-Conscious Home Cook
- **Background**: 28-year-old seeking to reduce food costs while maintaining nutritional quality
- **Goals**: Find recipes using affordable, accessible ingredients
- **Constraints**: Ingredient cost limits, nutritional minimums (vitamins, protein)
- **Use Case**: Soft constraint optimization for cost while maintaining hard nutritional boundaries

---

## 4. Functional Requirements

### 4.1 Data Management (FR-DATA)

**FR-DATA-1**: The system shall ingest recipe datasets in JSON or CSV format containing at minimum: recipe ID, name, ingredients list, preparation instructions, and nutritional information.

**FR-DATA-2**: The system shall normalize nutritional data to standard units (grams, milligrams, kcal) and handle missing values through imputation or exclusion based on configurable rules.

**FR-DATA-3**: The system shall maintain a mapping between ingredients and allergen categories (tree nuts, shellfish, dairy, gluten, etc.) based on standard allergen classifications.

**FR-DATA-4**: The system shall support preprocessing pipelines that extract features for content-based similarity (ingredient vectors, cuisine type, cooking method).

### 4.2 Constraint Definition and Validation (FR-CONSTRAINT)

**FR-CONSTRAINT-1**: The system shall support user-defined hard constraints expressed as:
- Ingredient exclusions (allergens, dietary restrictions)
- Nutritional bounds (min/max for calories, macronutrients, micronutrients)
- Categorical requirements (cuisine type, cooking method, meal type)
- Temporal constraints (preparation time, cooking time)

**FR-CONSTRAINT-2**: The system shall distinguish between hard constraints (must be satisfied) and soft constraints (preferences that influence ranking but are not mandatory).

**FR-CONSTRAINT-3**: The system shall validate constraint feasibility before recommendation generation and report if no recipes satisfy the specified constraints.

**FR-CONSTRAINT-4**: The system shall provide constraint conflict detection, identifying which constraints cannot be simultaneously satisfied given the available recipe database.

### 4.3 Recommendation Generation (FR-RECOMMEND)

**FR-RECOMMEND-1**: The system shall implement content-based filtering using ingredient similarity, nutritional profile similarity, or a weighted combination thereof.

**FR-RECOMMEND-2**: The system shall filter candidate recipes to include only those satisfying all hard constraints before applying ranking logic.

**FR-RECOMMEND-3**: The system shall compute recommendation scores using a hybrid function combining:
- Content-based similarity score
- Soft constraint satisfaction score
- Diversity penalty (to avoid redundant recommendations)

**FR-RECOMMEND-4**: The system shall return top-k recommendations ranked by final score, with k configurable by the user (default k=10).

**FR-RECOMMEND-5**: The system shall support query-based recommendation (given a seed recipe, find similar recipes satisfying constraints) and user-profile-based recommendation (using stored preferences).

### 4.4 Explainability (FR-EXPLAIN)

**FR-EXPLAIN-1**: For each recommendation, the system shall provide:
- List of satisfied constraints with verification details
- Nutritional breakdown compared to user targets
- Similarity score decomposition (contribution of ingredients, nutrition, etc.)
- Ranking rationale (why this recipe ranked higher than others)

**FR-EXPLAIN-2**: The system shall generate human-readable explanations suitable for non-technical users alongside technical details for validation.

### 4.5 Evaluation (FR-EVAL)

**FR-EVAL-1**: The system shall implement standard recommendation metrics: Precision@k, Recall@k, NDCG@k, Mean Average Precision (MAP).

**FR-EVAL-2**: The system shall implement constraint-specific metrics: hard constraint satisfaction rate, soft constraint optimization score, constraint violation detection rate.

**FR-EVAL-3**: The system shall support k-fold cross-validation for offline evaluation using historical user ratings or implicit feedback when available.

**FR-EVAL-4**: The system shall log recommendation latency, memory usage, and dataset scalability metrics for performance analysis.

---

## 5. Non-Functional Requirements

### 5.1 Performance (NFR-PERF)

**NFR-PERF-1**: Recommendation generation shall complete within 2 seconds for datasets up to 50,000 recipes on standard academic computing resources (4-core CPU, 8GB RAM).

**NFR-PERF-2**: The system shall support batch recommendation generation for multiple users with linear time complexity relative to the number of users.

**NFR-PERF-3**: Memory consumption shall not exceed 4GB for datasets up to 100,000 recipes.

### 5.2 Usability (NFR-USE)

**NFR-USE-1**: All modules shall include comprehensive docstrings following NumPy documentation standards.

**NFR-USE-2**: Configuration files shall use human-readable formats (JSON, YAML) with schema validation.

**NFR-USE-3**: Error messages shall be informative, indicating the nature of the error and suggesting remediation steps.

### 5.3 Maintainability (NFR-MAINT)

**NFR-MAINT-1**: Code shall follow PEP 8 style guidelines with type hints for all function signatures.

**NFR-MAINT-2**: Modules shall have clearly defined interfaces with minimal coupling to support independent modification.

**NFR-MAINT-3**: All core functions shall have corresponding unit tests with minimum 80% code coverage.

### 5.4 Extensibility (NFR-EXT)

**NFR-EXT-1**: The constraint module shall support plugin-based addition of new constraint types without modifying core logic.

**NFR-EXT-2**: The recommendation engine shall support configurable scoring functions allowing researchers to experiment with alternative ranking strategies.

**NFR-EXT-3**: The data module shall support multiple dataset formats through adapter patterns.

### 5.5 Reproducibility (NFR-REPRO)

**NFR-REPRO-1**: All experiments shall use fixed random seeds for reproducible results.

**NFR-REPRO-2**: The system shall log all configuration parameters, dataset versions, and evaluation metrics for each experiment.

**NFR-REPRO-3**: Evaluation pipelines shall be executable via command-line scripts with minimal manual intervention.

---

## 6. Assumptions and Constraints

### 6.1 Assumptions
- Recipe datasets include complete and accurate nutritional information or can be augmented with external nutritional databases
- Users can articulate their constraints in terms of ingredients, nutrients, and recipe metadata
- Constraint specifications are consistent and feasible (the system will validate but assumes users provide reasonable inputs)
- Offline evaluation using historical ratings or implicit feedback is a valid proxy for real-world performance

### 6.2 Constraints
- **Data Availability**: Limited to publicly available recipe datasets; proprietary datasets require separate licensing
- **Computational Resources**: Designed for single-machine execution; distributed processing is out of scope
- **Language**: English-language recipes only; internationalization requires substantial additional effort
- **User Interface**: Command-line and programmatic interfaces only; graphical UI is out of scope
- **Real-Time Adaptation**: No online learning or continuous model updates based on user feedback

---

## 7. Out of Scope

The following features are explicitly excluded from the current project scope:

### 7.1 Collaborative Filtering
- User-user or item-item collaborative filtering requires interaction data (ratings, click-through) not available in most recipe datasets
- May be considered for future work if suitable datasets become available

### 7.2 Real-Time Learning
- Online learning and model updates based on streaming user feedback require infrastructure beyond the current scope
- System operates in batch/offline mode only

### 7.3 Multi-User Meal Planning
- Generating meal plans for groups with conflicting constraints (e.g., family with diverse dietary needs) is complex and deferred to future work
- Current scope focuses on single-user recommendations

### 7.4 Ingredient Substitution
- Automated suggestion of ingredient substitutions to satisfy constraints (e.g., replacing eggs with flax eggs for vegan recipes) requires domain knowledge and is out of scope
- Users are expected to search among existing recipes rather than modify recipes

### 7.5 Mobile or Web Application
- Development of user-facing applications is not part of the academic research project
- System provides APIs and command-line tools that could be integrated into applications by others

### 7.6 Integration with External Services
- Direct integration with grocery delivery services, meal kit providers, or fitness tracking apps is out of scope
- System provides data export capabilities for manual integration if desired

---

## 8. Dependencies and Risks

### 8.1 Dependencies
- **Data Quality**: System performance depends critically on the accuracy and completeness of nutritional data in source datasets
- **Constraint Expressiveness**: User ability to benefit from the system depends on their capacity to articulate constraints in supported formats
- **Evaluation Data**: Offline evaluation quality depends on availability of user rating or interaction data

### 8.2 Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Insufficient recipes satisfy user constraints | Medium | High | Implement constraint relaxation suggestions; provide feedback on constraint feasibility |
| Nutritional data inaccuracies | High | Medium | Cross-reference multiple nutritional databases; flag low-confidence data |
| Poor recommendation quality due to limited features | Medium | Medium | Iteratively enhance feature engineering based on evaluation results |
| Performance degradation on large datasets | Low | Medium | Implement indexing and caching strategies; profile and optimize bottlenecks |
| User difficulty expressing constraints | Medium | Medium | Provide constraint templates and examples; user study to refine interface |

---

## 9. Success Metrics and Validation

### 9.1 Validation Approach
- **Unit Testing**: All modules tested independently with synthetic data
- **Integration Testing**: End-to-end pipeline tested with realistic datasets
- **Offline Evaluation**: Performance assessed using k-fold cross-validation on held-out test sets
- **Constraint Validation**: Automated checks verify 100% hard constraint satisfaction on test recommendations
- **User Study** (Optional): Small-scale study with target personas to assess usability and perceived recommendation quality

### 9.2 Release Criteria
Before considering the project complete, the following must be achieved:
- All functional requirements (FR-*) implemented and tested
- Non-functional performance targets (NFR-PERF-*) met on reference datasets
- Documentation complete (README, PRD, REQUIREMENTS, DESIGN, API docs)
- Evaluation pipeline produces results meeting success criteria thresholds
- Code coverage ≥ 80%

---

## 10. Timeline and Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| M1: Data Pipeline | Week 2 | Data ingestion, preprocessing, feature extraction modules |
| M2: Constraint Framework | Week 4 | Constraint definition, validation, and enforcement modules |
| M3: Baseline Recommender | Week 6 | Content-based recommendation engine with constraint filtering |
| M4: Hybrid Scoring | Week 8 | Multi-objective scoring function integrating similarity and constraints |
| M5: Evaluation Infrastructure | Week 10 | Metrics implementation, evaluation pipeline, reproducibility tools |
| M6: Documentation & Testing | Week 12 | Complete documentation, achieve test coverage targets, final validation |

---

## 11. Approval and Sign-Off

This PRD has been reviewed and approved by:

- **Project Lead**: [Name] - [Date]
- **Technical Advisor**: [Name] - [Date]
- **Academic Supervisor**: [Name] - [Date]

**Next Steps**: Proceed to detailed technical requirements (REQUIREMENTS.md) and system design (DESIGN.md).
