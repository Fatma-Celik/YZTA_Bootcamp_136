from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import json
import base64
from supabase import create_client

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None

load_dotenv()

app = FastAPI(
    title="Akıllı Mutfak Asistanı API",
    description="Gıda israfını azaltan, kişiselleştirilmiş tarif ve makro hesaplama platformu"
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None

if genai is not None and GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"⚠️ Gemini istemcisi başlatılamadı: {e}")
else:
    print("⚠️ GEMINI_API_KEY bulunamadı. API demo modda çalışacak.")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase_client = None
 
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"⚠️ Supabase istemcisi başlatılamadı: {e}")
else:
    print("⚠️ SUPABASE_URL/SUPABASE_SERVICE_KEY bulunamadı. Veritabanı tarif araması devre dışı.")
 
class MalzemeGirisi(BaseModel):
    malzemeler: list[str]
    kisi_sayisi: int = 2
    sure_dakika: int = 30
    diyet: str = "normal"
    hedef: str = "normal"

class YemekFotografi(BaseModel):
    aciklama: str
    ogun: str = "öğle"

class KullanicıProfili(BaseModel):
    kilo: float
    boy: float
    yas: int
    cinsiyet: str
    aktivite: str
    hedef: str


def ai_yanit(prompt: str) -> str:
    if client is None:
        raise HTTPException(status_code=503, detail="AI servisi şu an kullanılamıyor. GEMINI_API_KEY kontrol edin.")
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI yanıtı oluşturulamadı: {str(e)}")
    
def ai_yanit_gorsel(prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    if client is None:
        raise HTTPException(status_code=503, detail="AI servisi şu an kullanılamıyor. GEMINI_API_KEY kontrol edin.")
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ]
        )
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Görsel analiz edilemedi: {str(e)}")
    
def veritabanindan_tarif_bul(malzemeler: list[str], limit: int = 3):
    """
    Verilen malzeme listesiyle en çok eşleşen tarifleri veritabanından bulur.
    Supabase bağlantısı yoksa veya eşleşme bulunamazsa boş liste döner.
    """
    if supabase_client is None:
        return []
 
    try:
        # Malzeme isimleriyle eşleşen ingredient id'lerini bul
        ingredient_sonuc = supabase_client.table("ingredients").select("id, name").in_("name", malzemeler).execute()
        ingredient_ids = [row["id"] for row in ingredient_sonuc.data]
 
        if not ingredient_ids:
            return []
 
        # Bu malzemeleri kullanan recipe_ingredients kayıtlarını bul
        ri_sonuc = supabase_client.table("recipe_ingredients").select("recipe_id, ingredient_id").in_("ingredient_id", ingredient_ids).execute()
 
        # Her tarifin kaç malzeme eşleştiğini say
        recipe_eslesme_sayisi = {}
        for row in ri_sonuc.data:
            rid = row["recipe_id"]
            recipe_eslesme_sayisi[rid] = recipe_eslesme_sayisi.get(rid, 0) + 1
 
        # En çok eşleşenden en aza sırala, ilk `limit` kadarını al
        en_iyi_recipe_ids = sorted(recipe_eslesme_sayisi, key=recipe_eslesme_sayisi.get, reverse=True)[:limit]
 
        if not en_iyi_recipe_ids:
            return []
 
        # Tariflerin detaylarını çek
        tarif_sonuc = supabase_client.table("recipes").select("*").in_("id", en_iyi_recipe_ids).execute()
        return tarif_sonuc.data
 
    except Exception as e:
        print(f"⚠️ Veritabanı tarif araması başarısız: {e}")
        return []

@app.get("/")
async def root():
    return {"mesaj": "Akıllı Mutfak Asistanı API'ye hoş geldiniz!"}


@app.post("/tarif-oner")
async def tarif_oner(giris: MalzemeGirisi):
    # 1. Önce veritabanından gerçek tarifleri dene
    db_tarifler = veritabanindan_tarif_bul(giris.malzemeler, limit=3)
 
    if len(db_tarifler) >= 2:
        # Yeterli eşleşme var, veritabanı sonucunu döndür
        return {
            "kaynak": "veritabani",
            "tarifler": db_tarifler,
            "kullanilan_malzemeler": giris.malzemeler,
            "kisi_sayisi": giris.kisi_sayisi
        }
 
    # 2. Yeterli eşleşme yoksa, Gemini'ye düş (mevcut davranış)
    malzeme_listesi = ", ".join(giris.malzemeler)
 
    hedef_mesaj = {
        "kilo_verme": "Düşük kalorili, yüksek proteinli ve tok tutan tarifler öner.",
        "kas_kazanma": "Yüksek proteinli, karbonhidrat dengeli tarifler öner.",
        "form_koruma": "Dengeli makro besinlerle sağlıklı tarifler öner.",
        "normal": "Lezzetli ve pratik tarifler öner."
    }.get(giris.hedef, "Lezzetli ve pratik tarifler öner.")
 
    prompt = f"""
Sen Türkiye'nin en iyi aşçısı ve diyetisyenisin. Her zaman Türkçe yanıt verirsin.
 
Aşağıdaki bilgilere göre 3 farklı yemek tarifi öner.
 
Mevcut malzemeler: {malzeme_listesi}
Kişi sayısı: {giris.kisi_sayisi}
Maksimum hazırlık süresi: {giris.sure_dakika} dakika
Diyet tercihi: {giris.diyet}
Kullanıcı hedefi: {hedef_mesaj}
 
Her tarif için şu formatta yanıt ver:
 
🍽️ TARİF ADI
📝 Malzemeler ve Miktarlar:
- [malzeme]: [miktar]
 
👨‍🍳 Yapılış:
1. [adım]
 
📊 Besin Değerleri (tahmini, 1 porsiyon):
- Kalori: X kcal
- Protein: X g
- Karbonhidrat: X g
- Yağ: X g
 
⏱️ Hazırlık Süresi: X dakika
💡 İpucu: [kısa bir öneri]
 
---
"""
 
    yanit = ai_yanit(prompt)
    return {
        "kaynak": "gemini",
        "tarifler": yanit,
        "kullanilan_malzemeler": giris.malzemeler,
        "kisi_sayisi": giris.kisi_sayisi
    }
 


@app.post("/makro-hesapla")
async def makro_hesapla(yemek: YemekFotografi):
    prompt = f"""
Sen bir diyetisyen ve beslenme uzmanısın. Türkçe yanıt verirsin.

Kullanıcı şu yemeği yedi: {yemek.aciklama}
Öğün: {yemek.ogun}

Tahmini besin değerlerini hesapla ve şu formatta yanıt ver:

🍱 YEMEK ANALİZİ
Tespit edilen yemek: [yemek adı]

📊 Besin Değerleri (tahmini, 1 porsiyon):
- Kalori: X kcal
- Protein: X g
- Karbonhidrat: X g
- Yağ: X g
- Lif: X g

✅ Değerlendirme: [bu yemeğin sağlıklı beslenmedeki yeri hakkında kısa yorum]
💡 Öneri: [daha sağlıklı hale getirmek için 1-2 öneri]
"""

    yanit = ai_yanit(prompt)
    return {"analiz": yanit}


@app.post("/gunluk-kalori")
async def gunluk_kalori(profil: KullanicıProfili):
    prompt = f"""
Sen bir diyetisyen uzmanısın. Harris-Benedict formülünü kullanarak hesaplama yaparsın. Türkçe yanıt verirsin.

Kilo: {profil.kilo} kg
Boy: {profil.boy} cm
Yaş: {profil.yas}
Cinsiyet: {profil.cinsiyet}
Aktivite seviyesi: {profil.aktivite}
Hedef: {profil.hedef}

Şu formatta yanıt ver:

👤 KİŞİSEL BESLENME PLANI

🔥 Günlük Kalori İhtiyacı: X kcal

📊 Makro Dağılımı:
- Protein: X g (günlük)
- Karbonhidrat: X g (günlük)
- Yağ: X g (günlük)

🍽️ Öğün Dağılımı Önerisi:
- Kahvaltı: X kcal
- Öğle: X kcal
- Akşam: X kcal
- Ara öğünler: X kcal

💡 Hedefine Ulaşmak İçin Öneriler:
1. [öneri]
2. [öneri]
3. [öneri]
"""

    yanit = ai_yanit(prompt)
    return {"beslenme_plani": yanit}


@app.post("/market-listesi")
async def market_listesi(giris: MalzemeGirisi):
    malzeme_listesi = ", ".join(giris.malzemeler)

    prompt = f"""
Sen bir beslenme uzmanı ve ekonomik alışveriş danışmanısın. Türkiye piyasa fiyatlarını bilerek öneri yaparsın. Türkçe yanıt verirsin.

Kullanıcının evinde şu malzemeler var: {malzeme_listesi}
Kişi sayısı: {giris.kisi_sayisi}
Diyet tercihi: {giris.diyet}
Hedef: {giris.hedef}

1 haftalık dengeli beslenme planı için eksik malzemeleri belirle ve market listesi oluştur.

🛒 HAFTALIK MARKET LİSTESİ

✅ Mevcut Malzemeler: [listele]

❌ Eksik / Önerilen Malzemeler:

🥩 Et & Protein:
- [malzeme] - [tahmini miktar] - [tahmini fiyat aralığı]

🥦 Sebze & Meyve:
- [malzeme] - [tahmini miktar]

🥛 Süt Ürünleri:
- [malzeme] - [tahmini miktar]

🌾 Tahıl & Kuru Bakliyat:
- [malzeme] - [tahmini miktar]

🫙 Diğer:
- [malzeme] - [tahmini miktar]

💰 Tahmini Toplam Bütçe: X - Y TL
"""

    yanit = ai_yanit(prompt)
    return {"market_listesi": yanit}

class MalzemeTaniRequest(BaseModel):
    image: str  # Base64 string

@app.post("/malzeme-tani")
async def malzeme_tani(request: MalzemeTaniRequest):
    try:
        header, encoded = request.image.split(",", 1) if "," in request.image else ("", request.image)
        image_bytes = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=400, detail="Geçersiz base64 formatı.")

    prompt = """
Sen bir mutfak asistanısın.
Bu buzdolabı/mutfak fotoğrafındaki SADECE yemek yapımında kullanılabilecek
yiyecek ve içecek malzemelerini tespit et.

KURALLAR:
- Mutfak eşyaları, aletler, dekoratif objeler, temizlik ürünleri DAHİL ETME
- Her malzemeyi tek ve sade bir isimle yaz (örnek: "domates", "yumurta", "süt")
- Miktarı yaklaşık olarak tahmin et (adet, gram, litre gibi uygun birimle)
- Emin olmadığın öğeleri listeye ekleme
- Aynı malzemeden birden fazla varsa TEK SATIRDA topla

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir açıklama ekleme:

{
  "malzemeler": [
    {"ad": "domates", "miktar": "8-10 adet"}
  ]
}
"""

    yanit = ai_yanit_gorsel(prompt, image_bytes, "image/jpeg")

    temiz_yanit = yanit.strip().replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(temiz_yanit)
        malzeme_listesi = parsed.get("malzemeler", [])
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI yanıtı işlenemedi, tekrar deneyin.")

    return {"malzemeler": malzeme_listesi}

