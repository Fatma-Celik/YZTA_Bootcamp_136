import React, { createContext, useContext, useState } from 'react';

// ─────────── Tipler ───────────
export interface Ingredient {
  id: string;
  ad: string;
  miktar: string;
  birim: string;
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
  recipeResponse: string | null;
  setRecipeResponse: (response: string | null) => void;
  macroResponse: MacroResponse | null;
  setMacroResponse: (response: MacroResponse | null) => void;
  clearAll: () => void;
}

const RecipeFlowContext = createContext<RecipeFlowContextType>({
  ingredients: [],
  setIngredients: () => {},
  recipeResponse: null,
  setRecipeResponse: () => {},
  macroResponse: null,
  setMacroResponse: () => {},
  clearAll: () => {},
});

export function RecipeFlowProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeResponse, setRecipeResponse] = useState<string | null>(null);
  const [macroResponse, setMacroResponse] = useState<MacroResponse | null>(null);

  const clearAll = () => {
    setIngredients([]);
    setRecipeResponse(null);
    setMacroResponse(null);
  };

  return (
    <RecipeFlowContext.Provider
      value={{
        ingredients,
        setIngredients,
        recipeResponse,
        setRecipeResponse,
        macroResponse,
        setMacroResponse,
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
