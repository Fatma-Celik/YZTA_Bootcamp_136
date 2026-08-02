import React, { createContext, useContext, useState } from 'react';

// ─────────── Tipler ───────────
export interface Ingredient {
  id: string;
  ad: string;
  miktar: string;
  birim: string;
}

export interface BackendRecipe {
  tarif_adi: string;
  kategori: string;
  zorluk: string;
  porsiyon: number;
  hazirlik_suresi_dk: number;
  pisirme_suresi_dk: number;
  malzemeler: Array<{
    ad: string;
    miktar: string;
  }>;
  yapilis_adimlari: string[];
  besin_degerleri: {
    kalori: number;
    protein: number;
    karbonhidrat: number;
    yag: number;
  };
  hedef_onerisi: string;
  hedef?: string;
  diyet?: string;
}

export interface MealDBRecipeDetail {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  malzemeler: Array<{ ad: string; miktar: string }>;
  yapilis_adimlari: string[];
}

export interface MacroResponse {
  yemek_adi: string;
  ogun: string;
  besin_degerleri: {
    kalori: number;
    protein: number;
    karbonhidrat: number;
    yag: number;
    lif: number;
  };
  degerlendirme: string;
  oneri: string;
}

// ─────────── Yardımcı Ayrıştırma Fonksiyonları ───────────
export function parseMealDBInstructions(instructions?: string): string[] {
  if (!instructions) return [];
  const rawSteps = instructions
    .split(/\r\n\r\n|\n\n|\r\n|\n|\.\s+(?=[A-Z0-9])/)
    .map((s) => s.replace(/^(STEP\s*\d+|Step\s*\d+|\d+\.|\*)\s*/i, '').trim())
    .filter((s) => s.length > 5);

  return rawSteps.length > 0 ? rawSteps : [instructions.trim()];
}

export function parseMealDBIngredients(meal: any): Array<{ ad: string; miktar: string }> {
  const list: Array<{ ad: string; miktar: string }> = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && typeof ing === 'string' && ing.trim() !== '') {
      list.push({
        ad: ing.trim(),
        miktar: measure && typeof measure === 'string' && measure.trim() !== '' ? measure.trim() : 'Gerektiği kadar',
      });
    }
  }
  return list;
}

export function transformMealDBDetail(meal: any): MealDBRecipeDetail {
  return {
    idMeal: meal.idMeal,
    strMeal: meal.strMeal || 'Özel Tarif',
    strCategory: meal.strCategory || 'Genel',
    strArea: meal.strArea || '',
    strInstructions: meal.strInstructions || '',
    strMealThumb: meal.strMealThumb,
    strTags: meal.strTags || '',
    strYoutube: meal.strYoutube || '',
    malzemeler: parseMealDBIngredients(meal),
    yapilis_adimlari: parseMealDBInstructions(meal.strInstructions),
  };
}

interface RecipeFlowContextType {
  ingredients: Ingredient[];
  setIngredients: (items: Ingredient[]) => void;
  recipeResponse: BackendRecipe[] | null;
  setRecipeResponse: (response: BackendRecipe[] | null) => void;
  selectedRecipe: BackendRecipe | null;
  setSelectedRecipe: (recipe: BackendRecipe | null) => void;
  mealDbRecipe: MealDBRecipeDetail | null;
  setMealDbRecipe: (recipe: MealDBRecipeDetail | null) => void;
  macroResponse: MacroResponse | null;
  setMacroResponse: (response: MacroResponse | null) => void;
  favoriteId: string | null;
  setFavoriteId: (id: string | null) => void;
  clearAll: () => void;
}

const RecipeFlowContext = createContext<RecipeFlowContextType>({
  ingredients: [],
  setIngredients: () => {},
  recipeResponse: null,
  setRecipeResponse: () => {},
  selectedRecipe: null,
  setSelectedRecipe: () => {},
  mealDbRecipe: null,
  setMealDbRecipe: () => {},
  macroResponse: null,
  setMacroResponse: () => {},
  favoriteId: null,
  setFavoriteId: () => {},
  clearAll: () => {},
});

export function RecipeFlowProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeResponse, setRecipeResponse] = useState<BackendRecipe[] | null>(null);
  const [selectedRecipe, setSelectedRecipeState] = useState<BackendRecipe | null>(null);
  const [mealDbRecipe, setMealDbRecipeState] = useState<MealDBRecipeDetail | null>(null);
  const [macroResponse, setMacroResponse] = useState<MacroResponse | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const setSelectedRecipe = (recipe: BackendRecipe | null) => {
    setSelectedRecipeState(recipe);
    setFavoriteId(null);
    if (recipe !== null) {
      setMealDbRecipeState(null);
    }
  };

  const setMealDbRecipe = (recipe: MealDBRecipeDetail | null) => {
    setMealDbRecipeState(recipe);
    setFavoriteId(null);
    if (recipe !== null) {
      setSelectedRecipeState(null);
    }
  };

  const clearAll = () => {
    setIngredients([]);
    setRecipeResponse(null);
    setSelectedRecipeState(null);
    setMealDbRecipeState(null);
    setMacroResponse(null);
    setFavoriteId(null);
  };

  return (
    <RecipeFlowContext.Provider
      value={{
        ingredients,
        setIngredients,
        recipeResponse,
        setRecipeResponse,
        selectedRecipe,
        setSelectedRecipe,
        mealDbRecipe,
        setMealDbRecipe,
        macroResponse,
        setMacroResponse,
        favoriteId,
        setFavoriteId,
        clearAll,
      }}
    >
      {children}
    </RecipeFlowContext.Provider>
  );
}

export function useRecipeFlow() {
  return useContext(RecipeFlowContext);
}
