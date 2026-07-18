from huggingface_hub import hf_hub_download
from supabase import create_client
from dotenv import load_dotenv
import json
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

dosya_yolu = hf_hub_download(
    repo_id="104bit/turkish-recipe-dataset",
    filename="recipes_groq_cleaned.json",
    repo_type="dataset"
)

with open(dosya_yolu, "r", encoding="utf-8") as f:
    tarifler = json.load(f)

print(f"{len(tarifler)} tarif aktarilacak...")

ingredient_cache = {}
basarili = 0
hatali = 0

for i, tarif in enumerate(tarifler):
    try:
        recipe = supabase.table("recipes").insert({
            "title": tarif.get("tarif_adi"),
            "kategori": tarif.get("kategori"),
            "zorluk": tarif.get("zorluk"),
            "hazirlik_suresi_dk": tarif.get("hazirlik_suresi_dk"),
            "pisirme_suresi_dk": tarif.get("pisirme_suresi_dk"),
            "yapilis_adimlari": tarif.get("yapilis_adimlari"),
            "servings": tarif.get("porsiyon"),
        }).execute()
        recipe_id = recipe.data[0]["id"]

        for malzeme in tarif.get("malzemeler", []):
            isim = malzeme.get("isim")
            if not isim:
                continue

            if isim in ingredient_cache:
                ingredient_id = ingredient_cache[isim]
            else:
                mevcut = supabase.table("ingredients").select("id").eq("name", isim).execute()
                if mevcut.data:
                    ingredient_id = mevcut.data[0]["id"]
                else:
                    yeni = supabase.table("ingredients").insert({"name": isim}).execute()
                    ingredient_id = yeni.data[0]["id"]
                ingredient_cache[isim] = ingredient_id

            miktar_ham = malzeme.get("miktar")
            miktar_str = str(miktar_ham) if miktar_ham is not None else None

            supabase.table("recipe_ingredients").insert({
                "recipe_id": recipe_id,
                "ingredient_id": ingredient_id,
                "quantity": miktar_str,
                "unit": malzeme.get("birim"),
            }).execute()

        basarili += 1
        if i % 100 == 0:
            print(f"{i}/{len(tarifler)} aktarildi... (basarili: {basarili}, hatali: {hatali})")

    except Exception as e:
        hatali += 1
        print(f"Hata (tarif {i}, '{tarif.get('tarif_adi')}'): {e}")
        continue

print(f"Tamamlandi! Basarili: {basarili}, Hatali: {hatali}")