# CHEF Frontend — React + Vite

The frontend for the CHEF (Constraint-based Hybrid Eating Framework) application.

## Tech Stack
- **React 19** with JSX
- **Vite 8** for development and building
- **React Router 7** for client-side routing
- **Axios** for API communication (with JWT interceptor)
- **Lucide React** for icons

## Development

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies all `/api` requests to `http://127.0.0.1:8000` (the FastAPI backend).

## Production Build

```bash
npm run build
```

The built files are output to `dist/`. The FastAPI backend serves these automatically.

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Kitchen dashboard + Recipe of the Day |
| `/ingredients` | Ingredients | Ingredient parser + substitution lookup |
| `/recipes` | Recipes | Recipe search with constraint filtering |
| `/nutrition` | Nutrition | Nutritional value lookup (350+ foods) |
| `/detection` | Detection | Food detection via YOLOv8 image upload |
| `/tdee` | TDEEProfile | TDEE calculator + macro targets |
| `/saved` | SavedRecipes | Bookmarked recipes with star ratings |
| `/planner` | MealPlanner | Weekly meal calendar + shopping list |
