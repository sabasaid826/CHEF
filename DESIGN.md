# System Design Document
## CHEF – Constraint-based Hybrid Eating Framework

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Purpose**: Architectural design and implementation strategy

---

## 1. System Architecture Overview

### 1.1 Architectural Style

CHEF employs a **modular pipeline architecture** with the following key characteristics:

- **Unidirectional Data Flow**: Data progresses sequentially through distinct stages (ingestion → processing → filtering → recommendation → evaluation)
- **Separation of Concerns**: Each module has a single, well-defined responsibility
- **Loose Coupling**: Modules interact through clearly defined interfaces using standard data structures (DataFrames, dictionaries)
- **Stateless Processing**: Modules do not maintain state between invocations, enabling parallel processing and reproducibility

This architecture prioritizes **transparency** and **extensibility** over performance optimization, aligning with the academic research objectives of the project.

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CHEF System                              │
└─────────────────────────────────────────────────────────────────┘

[External Data Sources]
    │
    │ (Recipes, Nutritional DB, User Interactions)
    │
    ▼
┌──────────────────┐
│   Data Module    │  Ingestion, Preprocessing, Feature Extraction
└────────┬─────────┘
         │
         │ (Processed Recipe DataFrame)
         │
         ▼
┌──────────────────┐
│ Constraint Module│  Validation, Filtering, Scoring
└────────┬─────────┘
         │
         │ (Filtered Recipe Candidates)
         │
         ▼
┌──────────────────┐
│ Recommendation   │  Similarity Computation, Hybrid Scoring, Ranking
│     Engine       │
└────────┬─────────┘
         │
         │ (Top-K Recommendations)
         │
         ▼
┌──────────────────┐
│ Evaluation Module│  Metrics Computation, Performance Analysis
└────────┬─────────┘
         │
         │ (Results & Reports)
         │
         ▼
[Outputs: Recommendations, Explanations, Evaluation Reports]
```

### 1.3 Module Responsibilities

| Module | Responsibility | Input | Output |
|--------|---------------|-------|--------|
| **Data Module** | Load, clean, normalize recipe data; extract features | Raw datasets (JSON/CSV) | Processed DataFrame with features |
| **Constraint Module** | Define, validate, enforce constraints | User constraint spec + processed data | Filtered recipe candidates |
| **Recommendation Engine** | Compute similarity, score candidates, rank | Filtered candidates + query/profile | Top-K recommendations with scores |
| **Evaluation Module** | Measure recommendation quality and system performance | Recommendations + ground truth | Metrics and performance reports |

---

## 2. Detailed Module Design

### 2.1 Data Module

#### 2.1.1 Submodules

**Ingestion Layer** (`src/data/ingestion.py`)
- **Purpose**: Load recipe data from various sources
- **Components**:
  - `RecipeLoader`: Abstract base class defining load interface
  - `JSONRecipeLoader`: Concrete implementation for JSON datasets
  - `CSVRecipeLoader`: Concrete implementation for CSV datasets
  - `NutritionalDBClient`: Interface to external nutritional databases (USDA, Nutritionix)

**Preprocessing Layer** (`src/data/preprocessing.py`)
- **Purpose**: Clean and normalize raw recipe data
- **Components**:
  - `IngredientNormalizer`: Standardize ingredient names, remove quantities
  - `NutritionalNormalizer`: Convert units, handle missing values
  - `AllergenMapper`: Map ingredients to allergen categories
  - `DuplicateDetector`: Identify and resolve duplicate recipes

**Feature Extraction Layer** (`src/data/features.py`)
- **Purpose**: Convert recipes to numerical feature vectors
- **Components**:
  - `IngredientVectorizer`: TF-IDF or binary encoding of ingredients
  - `NutritionalFeatureExtractor`: Normalize nutritional values to vectors
  - `CategoricalEncoder`: One-hot encode cuisine, meal type, etc.
  - `FeatureAggregator`: Combine multiple feature types into single representation

#### 2.1.2 Data Structures

**Recipe Object**
```python
@dataclass
class Recipe:
    recipe_id: str
    name: str
    ingredients: List[str]  # Normalized ingredient names
    instructions: str
    nutrition: NutritionalInfo
    metadata: RecipeMetadata
    features: Optional[np.ndarray] = None  # Computed features
    
@dataclass
class NutritionalInfo:
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float] = None
    # ... additional nutrients
    
@dataclass
class RecipeMetadata:
    cuisine: Optional[str] = None
    cooking_time_min: Optional[int] = None
    prep_time_min: Optional[int] = None
    servings: int = 1
    tags: List[str] = field(default_factory=list)
```

**Internal Representation**
- Primary structure: pandas DataFrame with one row per recipe
- Columns: `recipe_id`, `name`, `ingredients`, `calories`, `protein_g`, ..., `features`, `allergens`
- Feature column contains serialized NumPy arrays or sparse matrices

#### 2.1.3 Data Flow

```
Raw Data → RecipeLoader → Recipe Objects
         ↓
    Normalization (Preprocessing Layer)
         ↓
    Feature Extraction
         ↓
    Recipe DataFrame (in-memory or cached to disk)
```

#### 2.1.4 Design Decisions

**Decision 1: Use DataFrames over custom database**
- **Rationale**: Simplicity and compatibility with scientific Python ecosystem
- **Trade-off**: Limited scalability beyond ~100K recipes; acceptable for academic use case
- **Alternative Considered**: SQLite database rejected due to added complexity

**Decision 2: Eager vs. Lazy Feature Extraction**
- **Choice**: Eager (compute all features during preprocessing)
- **Rationale**: Enables fast similarity computation; datasets fit in memory
- **Trade-off**: Higher upfront computation time, but amortized across multiple queries

---

### 2.2 Constraint Module

#### 2.2.1 Submodules

**Constraint Definition** (`src/constraints/definition.py`)
- **Purpose**: Define constraint types and parse user specifications
- **Components**:
  - `Constraint`: Abstract base class
  - `IngredientExclusionConstraint`: Blacklist ingredients
  - `NutritionalBoundConstraint`: Min/max ranges for nutrients
  - `CategoricalConstraint`: Include/exclude cuisines, meal types
  - `TemporalConstraint`: Maximum cooking/prep time
  - `ConstraintParser`: Parse JSON constraint specifications into Constraint objects

**Constraint Validation** (`src/constraints/validation.py`)
- **Purpose**: Check constraint feasibility and detect conflicts
- **Components**:
  - `FeasibilityChecker`: Determine if constraints can be satisfied
  - `ConflictDetector`: Identify mutually incompatible constraints
  - `ConstraintRelaxer`: Suggest minimal relaxations for infeasible constraints

**Constraint Enforcement** (`src/constraints/enforcement.py`)
- **Purpose**: Filter recipes based on constraints
- **Components**:
  - `HardConstraintFilter`: Binary pass/fail filtering
  - `SoftConstraintScorer`: Continuous scoring for soft constraints
  - `ConstraintLogger`: Record constraint satisfaction for explainability

#### 2.2.2 Constraint Representation

**Constraint Base Class**
```python
class Constraint(ABC):
    @abstractmethod
    def check(self, recipe: pd.Series) -> bool:
        """Return True if recipe satisfies constraint."""
        pass
    
    @abstractmethod
    def score(self, recipe: pd.Series) -> float:
        """Return continuous satisfaction score in [0, 1]."""
        pass
    
    @abstractmethod
    def explain(self, recipe: pd.Series) -> str:
        """Return human-readable explanation of constraint check."""
        pass
```

**Example Concrete Constraint**
```python
class NutritionalBoundConstraint(Constraint):
    def __init__(self, nutrient: str, min_val: float = None, max_val: float = None):
        self.nutrient = nutrient
        self.min_val = min_val if min_val is not None else 0
        self.max_val = max_val if max_val is not None else float('inf')
    
    def check(self, recipe: pd.Series) -> bool:
        value = recipe[self.nutrient]
        return self.min_val <= value <= self.max_val
    
    def score(self, recipe: pd.Series) -> float:
        value = recipe[self.nutrient]
        if self.check(recipe):
            return 1.0
        else:
            # Penalize based on distance from bounds
            if value < self.min_val:
                return max(0, 1 - (self.min_val - value) / self.min_val)
            else:
                return max(0, 1 - (value - self.max_val) / self.max_val)
    
    def explain(self, recipe: pd.Series) -> str:
        value = recipe[self.nutrient]
        status = "PASS" if self.check(recipe) else "FAIL"
        return f"{self.nutrient} = {value:.1f} [{self.min_val}, {self.max_val}]: {status}"
```

#### 2.2.3 Filtering Pipeline

```
Recipe DataFrame → Hard Constraint Filters (sequential) → Filtered DataFrame
                                                         ↓
                                         Soft Constraint Scoring → Score Column Added
```

**Optimization**: Apply most selective constraints first to minimize candidates early

#### 2.2.4 Design Decisions

**Decision 1: Separate hard and soft constraints explicitly**
- **Rationale**: Clear semantics; prevents accidental constraint violation
- **Implementation**: Hard constraints return boolean, soft return continuous scores
- **Trade-off**: Requires users to explicitly categorize constraints, but improves explainability

**Decision 2: Sequential filtering vs. vectorized filtering**
- **Choice**: Sequential application of constraint filters
- **Rationale**: Easier to debug, log, and explain; performance acceptable for moderate datasets
- **Alternative**: Vectorized pandas operations rejected due to complexity for multi-constraint logic

---

### 2.3 Recommendation Engine

#### 2.3.1 Submodules

**Similarity Computation** (`src/recommender/similarity.py`)
- **Purpose**: Compute pairwise recipe similarities
- **Components**:
  - `SimilarityMetric`: Abstract base class (cosine, Jaccard, Euclidean)
  - `CosineSimilarity`: For TF-IDF ingredient vectors
  - `EuclideanSimilarity`: For nutritional vectors
  - `HybridSimilarity`: Weighted combination of multiple metrics

**Scoring** (`src/recommender/scoring.py`)
- **Purpose**: Compute final recommendation scores
- **Components**:
  - `ScoreAggregator`: Combine similarity, constraint, diversity scores
  - `DiversityPenalty`: MMR-based redundancy reduction
  - `NormalizationUtils`: Min-max and z-score normalization

**Ranking** (`src/recommender/ranking.py`)
- **Purpose**: Select and order top-K recommendations
- **Components**:
  - `TopKSelector`: Efficient top-K selection using heaps
  - `TieBreaker`: Deterministic tie resolution
  - `BatchRecommender`: Parallel processing for multiple queries

#### 2.3.2 Recommendation Algorithm

**Algorithm 1: Query-Based Recommendation**
```
Input: seed_recipe_id, constraints, k
Output: List of (recipe_id, score, explanation) tuples

1. Load preprocessed recipe DataFrame
2. Apply hard constraint filters → candidate_df
3. Extract features from seed recipe → seed_features
4. Compute similarity(seed_features, candidate_features) → sim_scores
5. Compute soft_constraint_scores(candidates, constraints) → soft_scores
6. Compute diversity_penalty(candidates) → div_penalty
7. Aggregate scores: final_score = α*sim + β*soft - γ*div
8. Select top-K by final_score
9. Generate explanations for each selected recipe
10. Return ranked list
```

**Algorithm 2: User-Profile-Based Recommendation**
```
Input: user_profile (preferences, constraints), k
Output: List of (recipe_id, score, explanation) tuples

1. Load preprocessed recipe DataFrame
2. Apply hard constraint filters → candidate_df
3. Compute preference_scores based on profile → pref_scores
   (e.g., weighted sum of categorical matches)
4. Compute soft_constraint_scores → soft_scores
5. Aggregate scores: final_score = α*pref + β*soft - γ*div
6. Select top-K by final_score
7. Generate explanations
8. Return ranked list
```

#### 2.3.3 Scoring Function Design

**Hybrid Scoring Formula**:
```
final_score = w_sim * similarity_score 
            + w_soft * soft_constraint_score 
            - w_div * diversity_penalty
```

Where:
- `similarity_score ∈ [0, 1]`: Content-based similarity to query/profile
- `soft_constraint_score ∈ [0, 1]`: Degree of soft constraint satisfaction
- `diversity_penalty ∈ [0, 1]`: Redundancy relative to already-selected recipes
- `w_sim + w_soft + w_div = 1.0`: Weight normalization

**Weight Tuning**: Grid search on validation set optimizing for NDCG@10

#### 2.3.4 Design Decisions

**Decision 1: Precompute vs. On-the-Fly Feature Extraction**
- **Choice**: Precompute during data preprocessing
- **Rationale**: Recommendation latency is critical; features don't change per query
- **Trade-off**: Higher memory usage, but enables sub-second recommendations

**Decision 2: Exact vs. Approximate Similarity**
- **Choice**: Exact similarity computation (brute-force)
- **Rationale**: Dataset size (<100K) manageable for exact computation
- **Alternative**: Approximate nearest neighbor (ANN) algorithms (e.g., FAISS) deferred to future work

**Decision 3: Diversity Mechanism**
- **Choice**: Maximal Marginal Relevance (MMR) approach
- **Rationale**: Simple, interpretable, effective for small K (10-20)
- **Implementation**: Iteratively select recipes maximizing `score - λ * max_similarity_to_selected`

---

### 2.4 Evaluation Module

#### 2.4.1 Submodules

**Metrics** (`src/evaluation/metrics.py`)
- **Purpose**: Implement recommendation and constraint metrics
- **Components**:
  - `PrecisionAtK`, `RecallAtK`, `NDCGAtK`, `MeanAveragePrecision`
  - `ConstraintSatisfactionRate`, `SoftConstraintOptimization`
  - `Coverage`, `DiversityMetrics`

**Evaluation Pipeline** (`src/evaluation/pipeline.py`)
- **Purpose**: Orchestrate evaluation workflow
- **Components**:
  - `CrossValidator`: K-fold cross-validation
  - `MetricAggregator`: Compute mean/std across folds
  - `ResultsExporter`: Save metrics to JSON/CSV

**Performance Profiling** (`src/evaluation/profiling.py`)
- **Purpose**: Measure system performance
- **Components**:
  - `LatencyProfiler`: Time recommendation pipeline stages
  - `MemoryProfiler`: Track memory usage
  - `ScalabilityTester`: Vary dataset size and measure performance

#### 2.4.2 Evaluation Workflow

```
Test Data (user-recipe interactions) → K-Fold Split
                                        ↓
For each fold:
    Train Set (context) ← Fit recommender parameters (if applicable)
    Test Set → Generate Recommendations → Compare to Ground Truth
            ↓
    Compute Metrics (Precision, NDCG, etc.)
                                        ↓
Aggregate Metrics across Folds → Mean ± Std
                                        ↓
Statistical Significance Testing (if comparing methods)
                                        ↓
Export Results (JSON, plots)
```

#### 2.4.3 Metric Definitions

**Precision@K**:
```
Precision@K = |{relevant recipes} ∩ {top-K recommendations}| / K
```
- Relevant: Recipes with user rating ≥ 4 or implicit positive signal
- Interpretation: Fraction of recommendations that are relevant

**NDCG@K**:
```
DCG@K = Σ(i=1 to K) (2^rel_i - 1) / log2(i + 1)
NDCG@K = DCG@K / IDCG@K
```
- `rel_i`: Relevance of item at position i (e.g., user rating)
- `IDCG@K`: Ideal DCG (if items were perfectly ranked)
- Interpretation: Ranking quality considering position

**Constraint Satisfaction Rate**:
```
CSR = |{recommendations with 0 violations}| / |{total recommendations}|
```
- Target: 100% for hard constraints
- Interpretation: System reliability in constraint enforcement

#### 2.4.4 Design Decisions

**Decision 1: Offline vs. Online Evaluation**
- **Choice**: Offline evaluation using historical data
- **Rationale**: No real-time user interaction data available; aligns with academic research
- **Limitation**: May not reflect real-world user satisfaction; acknowledged in documentation

**Decision 2: Metric Selection**
- **Choice**: Standard IR metrics (Precision, NDCG) + custom constraint metrics
- **Rationale**: Enables comparison with existing recommendation literature
- **Addition**: Constraint-specific metrics to capture unique value proposition

---

## 3. Data Flow and Interactions

### 3.1 End-to-End Data Flow

```
[Start]
    │
    ▼
┌─────────────────────────┐
│ Load Raw Recipe Data    │ (Data Module)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Preprocess & Extract    │ (Data Module)
│ Features                │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Load User Constraints   │ (Constraint Module)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validate Constraints    │ (Constraint Module)
│ Check Feasibility       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Filter by Hard          │ (Constraint Module)
│ Constraints             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Compute Similarity      │ (Recommendation Engine)
│ (to query/profile)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Score Soft Constraints  │ (Constraint Module)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Aggregate Scores &      │ (Recommendation Engine)
│ Apply Diversity         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Rank & Select Top-K     │ (Recommendation Engine)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Generate Explanations   │ (Constraint Module + Rec Engine)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Return Recommendations  │
└─────────────────────────┘
    │
    ▼
[Evaluation Module] (if in evaluation mode)
    │
    ▼
┌─────────────────────────┐
│ Compare to Ground Truth │
│ Compute Metrics         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Export Results          │
└─────────────────────────┘
    │
    ▼
[End]
```

### 3.2 Module Interfaces

**Data Module → Constraint Module**
- **Interface**: `get_processed_recipes() → pd.DataFrame`
- **Data**: DataFrame with columns: `recipe_id`, `name`, `ingredients`, nutritional fields, `features`, `allergens`

**Constraint Module → Recommendation Engine**
- **Interface**: `filter_recipes(recipes: pd.DataFrame, constraints: List[Constraint]) → pd.DataFrame`
- **Data**: Filtered DataFrame + `soft_constraint_score` column

**Recommendation Engine → Evaluation Module**
- **Interface**: `get_recommendations(query, k) → List[Tuple[recipe_id, score, explanation]]`
- **Data**: Ordered list of recommendations with scores and explanations

**Evaluation Module → User/Logs**
- **Interface**: `export_results(metrics: dict, filepath: str)`
- **Data**: JSON file with metrics, configuration, and metadata

### 3.3 Configuration Flow

```
config.json → ConfigLoader → Config Object
                             ↓
    ┌───────────────────────────────────────────┐
    │                                           │
    ▼                     ▼                     ▼
Data Module      Constraint Module    Recommendation Engine
(dataset paths)  (constraint specs)   (weights, similarity metric)
```

**Configuration Schema**:
```json
{
  "data": {
    "recipe_dataset": "data/processed/recipes.csv",
    "nutritional_db": "data/nutritional/usda.json"
  },
  "constraints": {
    "hard": [...],
    "soft": [...]
  },
  "recommendation": {
    "similarity_metric": "cosine",
    "weights": {
      "similarity": 0.5,
      "soft_constraint": 0.3,
      "diversity": 0.2
    },
    "k": 10
  },
  "evaluation": {
    "metrics": ["precision@10", "ndcg@10", "constraint_satisfaction"],
    "cross_validation_folds": 5
  }
}
```

---

## 4. Design Rationale

### 4.1 Architectural Choices

**Why Modular Pipeline over Monolithic System?**
- **Transparency**: Each module's logic is independently inspectable
- **Testability**: Modules can be unit tested in isolation
- **Extensibility**: New constraint types or similarity metrics can be added without modifying core logic
- **Academic Use**: Researchers can replace individual modules to experiment with alternatives

**Why DataFrame-Centric over Database?**
- **Simplicity**: Reduces dependencies and setup complexity
- **Ecosystem Integration**: Seamless integration with pandas, scikit-learn, NumPy
- **Performance**: For datasets <100K, in-memory operations are faster than database queries
- **Trade-off**: Sacrifices scalability for simplicity; acceptable for academic scope

**Why Eager Preprocessing over Lazy Evaluation?**
- **Recommendation Latency**: Precomputed features enable sub-second recommendations
- **Multiple Queries**: One-time preprocessing cost amortized across many recommendation requests
- **Trade-off**: Higher initial setup time, but better user experience

### 4.2 Algorithm Choices

**Why Content-Based Filtering?**
- **Data Availability**: Recipe datasets typically lack user interaction data needed for collaborative filtering
- **Cold Start**: Content-based works for new recipes without interaction history
- **Explainability**: Similarity can be explained using ingredient/nutritional overlap
- **Trade-off**: May miss preference patterns that collaborative filtering captures

**Why Hybrid Scoring over Pure Similarity?**
- **Problem Requirements**: Constraints are first-class requirements, not post-processing filters
- **Multi-Objective**: Users care about both relevance (similarity) and compliance (constraints)
- **Flexibility**: Weights allow users to prioritize different aspects
- **Trade-off**: Complexity in weight tuning, but essential for problem definition

**Why MMR for Diversity over Other Methods?**
- **Simplicity**: Easy to implement and understand
- **Effectiveness**: Good empirical performance for small K
- **Interpretability**: Clear mechanism (balance relevance and novelty)
- **Trade-off**: Greedy approach may not find global optimum, but acceptable for K≤20

### 4.3 Technology Choices

**Why Python?**
- **Ecosystem**: Rich libraries for data science (pandas, NumPy, scikit-learn)
- **Community**: Large community, extensive documentation, easy to find contributors
- **Prototyping**: Fast iteration for research projects
- **Trade-off**: Slower than compiled languages, but sufficient for academic use

**Why Not Deep Learning?**
- **Data Requirements**: Deep learning typically requires large interaction datasets (millions of ratings)
- **Interpretability**: Neural networks are harder to explain; conflicts with explainability goal
- **Complexity**: Adds infrastructure (GPUs, frameworks) without clear benefit for current scope
- **Future Work**: Can be explored if large-scale user data becomes available

---

## 5. Extensibility and Future Enhancements

### 5.1 Extension Points

**Adding New Constraint Types**:
1. Subclass `Constraint` base class
2. Implement `check()`, `score()`, `explain()` methods
3. Register in `ConstraintParser`
4. No changes needed to other modules

**Adding New Similarity Metrics**:
1. Subclass `SimilarityMetric` base class
2. Implement `compute(features1, features2)` method
3. Register in configuration options
4. No changes needed to other modules

**Adding New Evaluation Metrics**:
1. Implement metric function following standard signature
2. Add to `MetricRegistry`
3. Include in evaluation configuration
4. No changes needed to other modules

### 5.2 Planned Enhancements

**Phase 2 (Future Work)**:
- **Multi-Meal Planning**: Constraints across multiple meals (daily nutritional targets)
- **Temporal Preferences**: Seasonal ingredient availability, meal timing
- **Collaborative Filtering**: If user interaction data becomes available
- **Approximate Nearest Neighbor**: For scalability to millions of recipes
- **Web Interface**: User-friendly UI for non-technical users

**Phase 3 (Research Directions)**:
- **Constraint Learning**: Infer user constraints from past behavior
- **Active Learning**: Ask users targeted questions to refine constraints
- **Multi-User Recommendations**: Household meal planning with diverse preferences
- **Nutritional Optimization**: Linear programming for optimal meal plans

### 5.3 Backward Compatibility

**Versioning Strategy**:
- Configuration files versioned (schema version field)
- Data format changes handled with migration scripts
- API versioning if public interfaces change
- Deprecation warnings for old features (12-month sunset period)

---

## 6. Performance Considerations

### 6.1 Time Complexity Analysis

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Data Loading | O(n) | n = # recipes |
| Feature Extraction | O(n * d) | d = feature dimensionality |
| Hard Constraint Filtering | O(n * m) | m = # constraints |
| Similarity Computation | O(n * d) | Compute similarity to all candidates |
| Top-K Selection | O(n log k) | Using heap |
| **Total Per Query** | **O(n * (m + d + log k))** | Dominated by similarity computation |

**Scalability**: 
- For n=50K, d=500, m=5, k=10: ~10-50ms on modern CPU
- Bottleneck: Similarity computation (vectorized NumPy operations)

### 6.2 Space Complexity Analysis

| Data Structure | Space | Notes |
|----------------|-------|-------|
| Recipe DataFrame | O(n * d) | d includes all features |
| Precomputed Features | O(n * d) | Dense or sparse matrices |
| Constraint Objects | O(m) | Negligible |
| Recommendation Queue | O(k) | Heap for top-K |
| **Total Memory** | **O(n * d)** | Dominated by feature storage |

**Memory Footprint**:
- For n=100K, d=500, dtype=float32: ~200MB for features
- Total system memory: ~500MB-1GB including overhead

### 6.3 Optimization Strategies

**Implemented**:
- Vectorized operations using NumPy/pandas (10-100x faster than loops)
- Sparse matrix representation for ingredient features (memory reduction)
- Partial sorting for top-K (avoids full sort)
- Early termination in constraint filtering (skip remaining constraints if one fails)

**Future Optimizations**:
- Caching similarity matrices for repeated queries
- Multi-threading for batch recommendations
- GPU acceleration for large-scale similarity computation
- Approximate nearest neighbor (ANN) indexing (e.g., FAISS, Annoy)

---

## 7. Error Handling and Robustness

### 7.1 Error Categories

**Data Errors**:
- Missing required fields → Skip recipe with warning log
- Invalid nutritional values (negative, unrealistic) → Flag and optionally exclude
- Malformed JSON/CSV → Raise descriptive exception with line number

**Constraint Errors**:
- Infeasible constraint set → Return error with relaxation suggestions
- Conflicting constraints → Identify conflicts and suggest resolution
- Unknown constraint type → Raise configuration error with supported types

**Recommendation Errors**:
- No recipes satisfy constraints → Return empty list with explanation
- Zero-variance features → Fall back to alternative similarity metric
- Numerical overflow/underflow → Clip values and log warning

### 7.2 Error Handling Strategy

**Fail-Fast for Configuration Errors**:
- Validate configuration at startup
- Reject malformed configs with clear error messages
- Prevents wasted computation on invalid setups

**Graceful Degradation for Data Errors**:
- Skip problematic recipes but continue processing
- Log warnings for missing/invalid data
- Generate data quality report post-ingestion

**User-Friendly Messaging**:
- Avoid technical stack traces in user-facing interfaces
- Provide actionable suggestions (e.g., "Relax calorie constraint to 700 kcal")
- Include documentation references in error messages

### 7.3 Logging and Monitoring

**Logging Levels**:
- `DEBUG`: Detailed constraint checking, similarity scores
- `INFO`: Pipeline stage completions, data statistics
- `WARNING`: Missing data, skipped recipes, low-confidence results
- `ERROR`: Failures that prevent completion
- `CRITICAL`: System-level failures (out of memory, corrupted data)

**Logged Information**:
- Timestamp, log level, module name
- User query/constraint specification
- Number of recipes passing each filter
- Recommendation scores and ranking
- Performance metrics (latency, memory)

**Log Destinations**:
- Console (for interactive use)
- File (for batch processing and auditing)
- Structured JSON (for automated analysis)

---

## 8. Security and Privacy Considerations

### 8.1 Data Privacy

**User Data**:
- System processes user constraints/preferences but does not store them persistently
- No personally identifiable information (PII) collected or logged
- Evaluation uses anonymized or synthetic user interaction data

**Recipe Data**:
- Assumes recipes are from public datasets or permissively licensed sources
- Respects data licenses (e.g., CC-BY, open access)
- Does not scrape or redistribute proprietary content

### 8.2 Security Considerations

**Input Validation**:
- Sanitize user-provided constraint specifications (prevent injection attacks)
- Validate JSON schemas to reject malformed inputs
- Limit constraint complexity (max number of constraints, max string lengths)

**Resource Limits**:
- Cap maximum dataset size to prevent memory exhaustion
- Timeout long-running computations (e.g., >60 seconds for recommendation)
- Rate limiting if exposed via API (not in current scope)

**Dependency Management**:
- Use pinned versions in `requirements.txt`
- Regularly update dependencies for security patches
- Scan for known vulnerabilities (e.g., using `safety` tool)

---

## 9. Testing Strategy

### 9.1 Unit Testing

**Coverage**: Each module tested independently
**Tools**: pytest, pytest-cov
**Test Data**: Synthetic minimal datasets with known properties

**Example Test Cases**:
- `test_ingredient_normalization()`: Verify "tomatoes" → "tomato"
- `test_nutritional_bound_constraint()`: Check filtering logic
- `test_cosine_similarity()`: Verify similarity computation accuracy
- `test_top_k_selection()`: Ensure correct ranking

### 9.2 Integration Testing

**Coverage**: End-to-end pipeline with realistic data
**Test Data**: Subset of real recipe dataset (100-1000 recipes)

**Example Test Cases**:
- `test_full_pipeline()`: Load data → apply constraints → generate recommendations → verify
- `test_constraint_satisfaction()`: Assert all recommendations satisfy hard constraints
- `test_recommendation_determinism()`: Same input produces same output (fixed seed)

### 9.3 Performance Testing

**Coverage**: Latency and memory benchmarks
**Test Cases**:
- `test_scalability()`: Measure performance on 1K, 10K, 50K, 100K recipes
- `test_latency_target()`: Verify recommendations complete within 2 seconds
- `test_memory_limit()`: Ensure memory usage stays below 4GB

### 9.4 Validation Testing

**Coverage**: Verify correctness of algorithmic components
**Test Cases**:
- `test_precision_recall()`: Compare metric implementation to known ground truth
- `test_constraint_logic()`: Verify constraint enforcement with edge cases
- `test_similarity_properties()`: Check symmetry, triangle inequality, etc.

---

## 10. Deployment and Distribution

### 10.1 Packaging

**Distribution Format**: Python package installable via pip
**Package Structure**:
```
chef/
├── setup.py
├── README.md
├── LICENSE
├── requirements.txt
├── src/
│   └── chef/
│       ├── __init__.py
│       ├── data/
│       ├── constraints/
│       ├── recommender/
│       └── evaluation/
├── tests/
├── docs/
└── examples/
```

**Installation**:
```bash
pip install chef-recommendation
```

### 10.2 Command-Line Interface

**Primary Interface**: CLI for all major operations
**Implementation**: `argparse` or `click` library

**Example Commands**:
```bash
# Preprocess data
chef preprocess --input data/raw --output data/processed

# Generate recommendations
chef recommend --config config.json --user user_profile.json --output recommendations.json

# Evaluate system
chef evaluate --test-set data/test.csv --config config.json --output results/metrics.json
```

### 10.3 Programmatic API

**Usage**: Import as library for custom workflows
**Example**:
```python
from chef import RecipeRecommender
from chef.constraints import NutritionalBoundConstraint, IngredientExclusionConstraint

# Initialize recommender
recommender = RecipeRecommender(dataset_path='data/processed/recipes.csv')

# Define constraints
constraints = [
    IngredientExclusionConstraint(['nuts', 'shellfish']),
    NutritionalBoundConstraint('calories', min_val=400, max_val=600)
]

# Generate recommendations
recs = recommender.recommend(
    query_recipe_id='recipe_123',
    constraints=constraints,
    k=10
)

# Print results
for recipe_id, score, explanation in recs:
    print(f"{recipe_id}: {score:.3f}")
    print(explanation)
```

---

## 11. Documentation and Maintenance

### 11.1 Documentation Structure

**README.md**: Project overview, quick start, installation
**PRD.md**: Product requirements, objectives, personas
**REQUIREMENTS.md**: Technical specifications, detailed requirements
**DESIGN.md**: Architecture, design decisions, rationale (this document)
**API_REFERENCE.md**: Auto-generated function/class documentation (via Sphinx)
**USER_GUIDE.md**: Usage examples, tutorials, troubleshooting

### 11.2 Code Documentation Standards

**Docstring Format**: NumPy style
**Example**:
```python
def recommend(self, query_recipe_id: str, constraints: List[Constraint], k: int = 10) -> List[Tuple[str, float, str]]:
    """
    Generate recipe recommendations satisfying constraints.
    
    Parameters
    ----------
    query_recipe_id : str
        ID of the seed recipe for similarity computation.
    constraints : List[Constraint]
        List of constraint objects to enforce.
    k : int, optional
        Number of recommendations to return, by default 10.
    
    Returns
    -------
    List[Tuple[str, float, str]]
        List of (recipe_id, score, explanation) tuples, ordered by score descending.
    
    Raises
    ------
    ValueError
        If query_recipe_id not found in dataset.
    ConstraintInfeasibilityError
        If no recipes satisfy all constraints.
    
    Examples
    --------
    >>> recommender = RecipeRecommender('recipes.csv')
    >>> constraints = [NutritionalBoundConstraint('calories', max_val=500)]
    >>> recs = recommender.recommend('recipe_001', constraints, k=5)
    >>> print(len(recs))
    5
    """
```

### 11.3 Maintenance Plan

**Version Control**: Git with semantic versioning (MAJOR.MINOR.PATCH)
**Issue Tracking**: GitHub Issues for bugs, feature requests
**Code Review**: All changes require review before merge (if collaborative)
**Continuous Integration**: Automated testing on push (GitHub Actions)
**Release Cycle**: Quarterly releases with bug fixes, biannual feature releases

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-02 | Project Team | Initial design document |

---

## Appendix A: Design Alternatives Considered

### Alternative 1: Database-Backed Storage
- **Description**: Use SQLite or PostgreSQL for recipe storage
- **Pros**: Better scalability, support for complex queries
- **Cons**: Added complexity, setup overhead, slower for in-memory operations
- **Decision**: Rejected in favor of DataFrame-centric approach for simplicity

### Alternative 2: Collaborative Filtering
- **Description**: Use matrix factorization or neural collaborative filtering
- **Pros**: Can capture latent preference patterns
- **Cons**: Requires extensive user interaction data (unavailable), less explainable
- **Decision**: Deferred to future work pending data availability

### Alternative 3: Linear Programming for Constraints
- **Description**: Formulate recommendation as optimization problem
- **Pros**: Guarantees optimal solution under constraints
- **Cons**: Computationally expensive, requires defining objective function, less flexible
- **Decision**: Rejected due to complexity; current approach more extensible

### Alternative 4: Microservices Architecture
- **Description**: Separate data, constraint, recommendation modules as independent services
- **Pros**: Better scalability, fault isolation
- **Cons**: Over-engineered for academic project, deployment complexity
- **Decision**: Rejected; monolithic package sufficient for current scope

---

## Appendix B: Glossary

- **Content-Based Filtering**: Recommendation approach using item features to find similar items
- **Constraint Satisfaction Problem (CSP)**: Problem requiring finding solutions that satisfy a set of constraints
- **Hard Constraint**: Constraint that must be satisfied (binary pass/fail)
- **Soft Constraint**: Preference that influences ranking but is not mandatory
- **Hybrid Recommendation**: Combining multiple recommendation techniques (e.g., content-based + constraints)
- **NDCG**: Normalized Discounted Cumulative Gain, a ranking quality metric
- **TF-IDF**: Term Frequency-Inverse Document Frequency, a text vectorization method
- **MMR**: Maximal Marginal Relevance, a diversity-promoting algorithm

---

**Document End**
