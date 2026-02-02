# CHEF – Constraint-based Hybrid Eating Framework

## Overview

CHEF (Constraint-based Hybrid Eating Framework) is a modular recommendation system designed to generate personalized recipe suggestions that satisfy explicit nutritional and dietary constraints. Unlike traditional content-based or collaborative filtering approaches that optimize solely for preference prediction, CHEF integrates constraint satisfaction techniques to ensure recommendations are not only relevant but also nutritionally appropriate and aligned with user-defined dietary requirements.

The framework addresses a fundamental limitation in existing food recommendation systems: the difficulty of incorporating hard constraints (e.g., caloric limits, allergen exclusions, macro-nutrient targets) while maintaining recommendation quality. CHEF treats recipe recommendation as a constraint satisfaction problem augmented with preference scoring, enabling explainable and verifiable recommendations.

## Motivation

Current recipe recommendation systems often prioritize taste preference modeling over nutritional optimization, making them unsuitable for users with specific dietary goals or restrictions. CHEF was developed to bridge this gap by providing:

- **Verifiable Compliance**: All recommendations satisfy user-defined constraints, with explicit reasoning
- **Nutritional Awareness**: Integration of macro and micronutrient data into the recommendation pipeline
- **Algorithmic Transparency**: Clear scoring and ranking logic that can be audited and explained
- **Modularity**: Separation of concerns allowing independent development and testing of components

## Key Features

### Constraint-Based Filtering
- Hard constraint enforcement (allergens, dietary restrictions, nutritional bounds)
- Soft constraint optimization (preference-based adjustments)
- Constraint violation detection and reporting

### Hybrid Recommendation Logic
- Content-based similarity using ingredient and nutritional profiles
- Constraint-aware scoring that balances preference with compliance
- Multi-objective optimization framework

### Explainability
- Per-recommendation explanations showing constraint satisfaction
- Nutritional breakdowns and comparisons
- Transparency in scoring methodology

### Modular Architecture
- Decoupled data ingestion, constraint processing, and recommendation modules
- Extensible design supporting new constraint types and recommendation strategies
- Clear interfaces between components

## System Architecture

CHEF employs a pipeline architecture consisting of four primary modules:

1. **Data Module**: Handles recipe dataset ingestion, normalization, and preprocessing. Manages nutritional database integration and ensures data quality.

2. **Constraint Module**: Implements constraint definition, validation, and enforcement logic. Processes user-defined dietary requirements and translates them into formal constraints.

3. **Recommendation Engine**: Generates candidate recipes using content-based filtering, applies constraint filters, and computes final rankings using a hybrid scoring function.

4. **Evaluation Module**: Implements metrics for recommendation quality, constraint satisfaction rates, and system performance. Supports offline evaluation using held-out test sets.

Data flows unidirectionally from ingestion through constraint validation to recommendation generation, with explicit handoffs between modules to maintain separation of concerns.

## Technology Stack

- **Language**: Python 3.9+
- **Core Libraries**: 
  - NumPy, Pandas (data manipulation)
  - Scikit-learn (similarity computation, preprocessing)
  - PuLP or OR-Tools (constraint optimization, optional)
- **Data Format**: JSON, CSV for recipes and nutritional data
- **Evaluation**: Custom metrics implementation using NumPy
- **Documentation**: Markdown, inline docstrings

## Repository Structure

```
chef/
├── data/
│   ├── raw/              # Original recipe datasets
│   ├── processed/        # Cleaned and normalized data
│   └── nutritional/      # Nutritional databases
├── src/
│   ├── data/             # Data ingestion and preprocessing
│   ├── constraints/      # Constraint definition and validation
│   ├── recommender/      # Recommendation engine
│   ├── evaluation/       # Metrics and evaluation
│   └── utils/            # Shared utilities
├── tests/                # Unit and integration tests
├── docs/                 # Additional documentation
│   ├── PRD.md
│   ├── REQUIREMENTS.md
│   └── DESIGN.md
├── notebooks/            # Exploratory analysis and demonstrations
├── config/               # Configuration files
├── README.md
├── requirements.txt
└── LICENSE
```

## Setup and Execution

### Prerequisites
- Python 3.9 or higher
- pip package manager
- 4GB RAM minimum (8GB recommended for large datasets)
- Unix-like environment (Linux, macOS) or Windows with WSL

### Installation
```bash
# Clone repository
git clone https://github.com/username/chef.git
cd chef

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage
```bash
# Run preprocessing pipeline
python -m src.data.preprocess --input data/raw --output data/processed

# Generate recommendations with constraints
python -m src.recommender.recommend \
  --constraints config/constraints.json \
  --user-profile config/user.json \
  --output results/recommendations.json

# Evaluate system performance
python -m src.evaluation.evaluate \
  --test-set data/processed/test.csv \
  --metrics precision,recall,constraint_satisfaction
```

### Configuration
User constraints and preferences are specified in JSON format:
```json
{
  "dietary_restrictions": ["vegetarian"],
  "allergens": ["nuts", "shellfish"],
  "nutritional_targets": {
    "calories": {"min": 400, "max": 600},
    "protein_g": {"min": 20}
  },
  "preferences": {
    "cuisine": ["italian", "mediterranean"],
    "cooking_time_max": 45
  }
}
```

## Project Scope

### In Scope
- Single-user recipe recommendation with explicit constraints
- Content-based similarity using ingredient and nutritional features
- Constraint satisfaction verification and reporting
- Offline evaluation using standard recommendation metrics
- Modular architecture supporting extensibility

### Limitations
- No collaborative filtering (requires user interaction data not available in most recipe datasets)
- No real-time learning or online adaptation
- Limited to recipes with complete nutritional information
- English-language recipes only
- No user interface beyond command-line tools

### Future Enhancements
- Multi-meal planning with inter-meal constraints
- Integration with external nutritional APIs
- Support for temporal preferences (seasonal ingredients, meal timing)
- Hybrid collaborative-content approaches when user data becomes available

## Evaluation Approach

CHEF evaluation focuses on three dimensions:

1. **Recommendation Quality**: Precision, recall, and normalized discounted cumulative gain (NDCG) using user ratings or implicit feedback when available
2. **Constraint Satisfaction**: Percentage of recommendations satisfying all hard constraints, degree of soft constraint optimization
3. **System Performance**: Recommendation latency, memory footprint, scalability with dataset size

Evaluation is conducted using k-fold cross-validation on held-out test sets, with statistical significance testing for metric comparisons.

## Contributing

This project follows academic software development practices:
- All code must include docstrings and type hints
- New features require corresponding unit tests
- Modifications to core algorithms require documentation updates
- Commit messages should reference relevant issues or design decisions

## License

MIT License - See LICENSE file for details.

This project is developed for academic and educational purposes. If you use this work in research, please cite appropriately.

## Citation

```
@software{chef2024,
  title={CHEF: Constraint-based Hybrid Eating Framework},
  author={[Author Names]},
  year={2024},
  url={https://github.com/username/chef}
}
```

## Contact

For questions, issues, or collaboration inquiries, please open an issue on the GitHub repository or contact [maintainer email].

---

**Note**: This is an academic research project. While functional, it is intended primarily for educational purposes and algorithm exploration rather than production deployment.
