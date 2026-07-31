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

interface RecipeFlowContextType {
  ingredients: Ingredient[];
  setIngredients: (items: Ingredient[]) => void;
  recipeResponse: BackendRecipe[] | null;
  setRecipeResponse: (response: BackendRecipe[] | null) => void;
  selectedRecipe: BackendRecipe | null;
  setSelectedRecipe: (recipe: BackendRecipe | null) => void;
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
  macroResponse: null,
  setMacroResponse: () => {},
  favoriteId: null,
  setFavoriteId: () => {},
  clearAll: () => {},
});

export function RecipeFlowProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeResponse, setRecipeResponse] = useState<BackendRecipe[] | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<BackendRecipe | null>(null);
  const [macroResponse, setMacroResponse] = useState<MacroResponse | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const clearAll = () => {
    setIngredients([]);
    setRecipeResponse(null);
    setSelectedRecipe(null);
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
