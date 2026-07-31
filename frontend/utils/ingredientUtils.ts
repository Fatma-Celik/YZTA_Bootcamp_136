// ─────────── Ortak Malzeme Tipleri & Yardımcılar ───────────

export interface Ingredient {
  id: string;
  ad: string;
  miktar: string;
  birim: string;
}

// ─────────── Birim Seçenekleri ───────────
export const BIRIM_OPTIONS = [
  'adet',
  'gram (g)',
  'kilogram (kg)',
  'mililitre (ml)',
  'litre (lt)',
  'kap',
  'çay kaşığı',
  'yemek kaşığı',
  'demet',
  'dilim',
  'paket',
  'kavanoz',
  'şişe',
  'tutam',
] as const;

export type BirimOption = (typeof BIRIM_OPTIONS)[number];

export const BIRIM_LABELS: Record<BirimOption, string> = {
  'adet': 'Adet',
  'gram (g)': 'Gram (g)',
  'kilogram (kg)': 'Kilogram (kg)',
  'mililitre (ml)': 'Mililitre (ml)',
  'litre (lt)': 'Litre (lt)',
  'kap': 'Kap',
  'çay kaşığı': 'Çay Kaşığı',
  'yemek kaşığı': 'Yemek Kaşığı',
  'demet': 'Demet',
  'dilim': 'Dilim',
  'paket': 'Paket',
  'kavanoz': 'Kavanoz',
  'şişe': 'Şişe',
  'tutam': 'Tutam',
};

// ─────────── Miktar Parsing ───────────
export function parseMiktar(miktarStr: string): { miktar: string; birim: BirimOption } {
  const str = miktarStr.toLowerCase().trim();

  // Match number at the beginning (e.g., "500", "1", "0.5", "250-300")
  const numMatch = str.match(/^[\d.,\-–]+/);
  const miktarNum = numMatch ? numMatch[0].replace(',', '.') : '1';

  // Remaining string after the number
  const remaining = str.slice(numMatch ? numMatch[0].length : 0).trim();

  // Try to match known units
  if (/litre|lt/i.test(remaining)) return { miktar: miktarNum, birim: 'litre (lt)' };
  if (/kilogram|kg/i.test(remaining)) return { miktar: miktarNum, birim: 'kilogram (kg)' };
  if (/gram|gr?\b/i.test(remaining)) return { miktar: miktarNum, birim: 'gram (g)' };
  if (/mililitre|ml/i.test(remaining)) return { miktar: miktarNum, birim: 'mililitre (ml)' };
  if (/kap/i.test(remaining)) return { miktar: miktarNum, birim: 'kap' };
  if (/kavanoz/i.test(remaining)) return { miktar: miktarNum, birim: 'kavanoz' };
  if (/şişe/i.test(remaining)) return { miktar: miktarNum, birim: 'şişe' };
  if (/paket/i.test(remaining)) return { miktar: miktarNum, birim: 'paket' };
  if (/demet/i.test(remaining)) return { miktar: miktarNum, birim: 'demet' };
  if (/dilim/i.test(remaining)) return { miktar: miktarNum, birim: 'dilim' };
  if (/tutam/i.test(remaining)) return { miktar: miktarNum, birim: 'tutam' };
  if (/çay\s*kaşığı|çkş/i.test(remaining)) return { miktar: miktarNum, birim: 'çay kaşığı' };
  if (/yemek\s*kaşığı|ykş/i.test(remaining)) return { miktar: miktarNum, birim: 'yemek kaşığı' };
  if (/adet/i.test(remaining)) return { miktar: miktarNum, birim: 'adet' };

  return { miktar: miktarNum, birim: 'adet' };
}

// ─────────── Benzersiz ID Üretici ───────────
let _counter = 0;
export function generateIngredientId(prefix = 'ing'): string {
  _counter += 1;
  return `${prefix}_${Date.now()}_${_counter}`;
}
