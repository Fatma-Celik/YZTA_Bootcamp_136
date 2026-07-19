import React, { createContext, useContext, useState } from 'react';

// ─────────── Tipler ───────────
export interface Ingredient {
  id: string;
  ad: string;
  miktar: string;
  birim: string;
}

interface RecipeFlowContextType {
  ingredients: Ingredient[];
  setIngredients: (items: Ingredient[]) => void;
  recipeResponse: string | null;
  setRecipeResponse: (response: string | null) => void;
  clearAll: () => void;
}

const RecipeFlowContext = createContext<RecipeFlowContextType>({
  ingredients: [],
  setIngredients: () => {},
  recipeResponse: null,
  setRecipeResponse: () => {},
  clearAll: () => {},
});

export function RecipeFlowProvider({ children }: { children: React.ReactNode }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeResponse, setRecipeResponse] = useState<string | null>(null);

  const clearAll = () => {
    setIngredients([]);
    setRecipeResponse(null);
  };

  return (
    <RecipeFlowContext.Provider
      value={{ ingredients, setIngredients, recipeResponse, setRecipeResponse, clearAll }}
    >
      {children}
    </RecipeFlowContext.Provider>
  );
}

export function useRecipeFlow() {
  return useContext(RecipeFlowContext);
}
