"""
TDEE Calculator router — calculates Total Daily Energy Expenditure and saving to profile.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import TDEERequest, TDEEResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/tdee", tags=["tdee"])

def calculate_tdee_macros(req: TDEERequest) -> TDEEResponse:
    """Core logic to calculate TDEE and macros using Mifflin-St Jeor formula."""
    # 1. Base Metabolic Rate (BMR) - Mifflin-St Jeor
    if req.gender == "male":
        # Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
        bmr = (10 * req.weight_kg) + (6.25 * req.height_cm) - (5 * req.age) + 5
    else:
        # Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
        bmr = (10 * req.weight_kg) + (6.25 * req.height_cm) - (5 * req.age) - 161

    # 2. Activity Multiplier
    activity_multipliers = {
        "sedentary": 1.2,           # Little to no exercise
        "lightly_active": 1.375,    # Light exercise 1-3 days/week
        "moderately_active": 1.55,  # Moderate exercise 3-5 days/week
        "very_active": 1.725,       # Heavy exercise 6-7 days/week
        "extra_active": 1.9         # Very heavy exercise, physical job
    }
    tdee = bmr * activity_multipliers.get(req.activity_level, 1.2)

    # 3. Goal Adjustment
    if req.goal == "lose":
        target_calories = tdee - 500  # -500 kcal for standard weight loss
    elif req.goal == "gain":
        target_calories = tdee + 500  # +500 kcal for standard weight gain
    else:
        target_calories = tdee        # Maintenance

    # Safety floor
    if req.gender == "male" and target_calories < 1500:
        target_calories = 1500
    elif req.gender == "female" and target_calories < 1200:
        target_calories = 1200

    target_calories = int(round(target_calories))

    # 4. Macros (30% Protein, 25% Fat, 45% Carbs)
    protein_calories = target_calories * 0.30
    fat_calories = target_calories * 0.25
    carbs_calories = target_calories * 0.45

    return TDEEResponse(
        target_calories=target_calories,
        target_protein=int(round(protein_calories / 4)),  # 4 kcal per gram of protein
        target_carbs=int(round(carbs_calories / 4)),      # 4 kcal per gram of carbs
        target_fat=int(round(fat_calories / 9))           # 9 kcal per gram of fat
    )


@router.post("/calculate", response_model=TDEEResponse)
def calculate_public(req: TDEERequest):
    """
    Public endpoint to calculate TDEE without saving it.
    """
    return calculate_tdee_macros(req)


@router.post("/save", response_model=TDEEResponse)
def calculate_and_save(
    req: TDEERequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Calculates TDEE, saves the physical profile and targets to the user's account, 
    and returns the calculated macros.
    """
    result = calculate_tdee_macros(req)
    
    # Save inputs
    current_user.age = req.age
    current_user.gender = req.gender
    current_user.weight_kg = req.weight_kg
    current_user.height_cm = req.height_cm
    current_user.activity_level = req.activity_level
    current_user.goal = req.goal
    
    # Save outputs
    current_user.target_calories = result.target_calories
    current_user.target_protein = result.target_protein
    current_user.target_carbs = result.target_carbs
    current_user.target_fat = result.target_fat
    
    db.commit()
    db.refresh(current_user)
    
    return result
