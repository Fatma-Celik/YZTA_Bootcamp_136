from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import json
import base64
import re
from concurrent.futures import ThreadPoolExecutor
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
    ogun: str = "belirtilmemiş"  # kahvalti, ogle, aksam, ara_ogun
    alerjenler: list[str] = []  # örn: ["fıstık", "laktoz", "gluten"]

class YemekFotografi(BaseModel):
    aciklama: str = ""
    image: str = ""
    ogun: str = "belirtilmemiş"  # kahvalti, ogle, aksam, ara_ogun

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

def malzeme_adini_temizle(malzeme: str) -> str:
    """
    'yoğurt 300 mililitre (ml)' -> 'yoğurt'
    'peynir 1 gram (g)' -> 'peynir'
    'sucuk 1 adet' -> 'sucuk'
    """
    temiz = re.sub(r'\([^)]*\)', '', malzeme)
    temiz = re.sub(
        r'\d+([.,]\d+)?\s*(mililitre|litre|gram|kilogram|adet|ml|g|kg|l|demet|kap|dilim|paket|diş|su bardağı|çay kaşığı|yemek kaşığı)?',
        '', temiz, flags=re.IGNORECASE
    )
    return temiz.strip()

def veritabanindan_tarif_bul(malzemeler: list[str], limit: int = 3, alerjenler: list[str] = None):
    """
    Verilen malzeme listesiyle en çok eşleşen tarifleri veritabanından bulur.
    Alerjen listesi verilirse, o malzemeleri içeren tarifleri sonuçtan çıkarır.
    Supabase bağlantısı yoksa veya eşleşme bulunamazsa boş liste döner.
    """
    if supabase_client is None:
        return []

    try:
        ingredient_sonuc = supabase_client.table("ingredients").select("id, name").in_("name", malzemeler).execute()
        ingredient_ids = [row["id"] for row in ingredient_sonuc.data]

        if not ingredient_ids:
            return []

        ri_sonuc = supabase_client.table("recipe_ingredients").select("recipe_id, ingredient_id").in_("ingredient_id", ingredient_ids).execute()

        recipe_eslesme_sayisi = {}
        for row in ri_sonuc.data:
            rid = row["recipe_id"]
            recipe_eslesme_sayisi[rid] = recipe_eslesme_sayisi.get(rid, 0) + 1

        # Alerjenleri içeren tarifleri dışla
        if alerjenler:
            alerjen_ingredient_sonuc = supabase_client.table("ingredients").select("id").in_("name", alerjenler).execute()
            alerjen_ids = [row["id"] for row in alerjen_ingredient_sonuc.data]

            if alerjen_ids:
                alerjenli_ri = supabase_client.table("recipe_ingredients").select("recipe_id").in_("ingredient_id", alerjen_ids).execute()
                alerjenli_recipe_ids = set(row["recipe_id"] for row in alerjenli_ri.data)
                recipe_eslesme_sayisi = {
                    rid: sayi for rid, sayi in recipe_eslesme_sayisi.items()
                    if rid not in alerjenli_recipe_ids
                }

        en_iyi_recipe_ids = sorted(recipe_eslesme_sayisi, key=recipe_eslesme_sayisi.get, reverse=True)[:limit]

        if not en_iyi_recipe_ids:
            return []

        tarif_sonuc = supabase_client.table("recipes").select("*").in_("id", en_iyi_recipe_ids).execute()
        return tarif_sonuc.data

    except Exception as e:
        print(f"⚠️ Veritabanı tarif araması başarısız: {e}")
        return []

def tarif_formatla_ve_zenginlestir(db_tarif: dict, hedef: str, kisi_sayisi: int, ogun: str = "belirtilmemiş", diyet: str = "normal", alerjenler: list[str] = None) -> dict:
    """Veritabanından gelen tarifi Gemini ile zenginleştirir, eksikleri doldurur, standart JSON'a çevirir."""

    diyet_mesaj = {
        "vejetaryen": "Et, tavuk, balık KULLANMA. Sebze, süt ürünü, yumurta, bakliyat ağırlıklı tarifler öner.",
        "vegan": "Et, tavuk, balık, süt ürünü, yumurta, bal gibi hiçbir hayvansal ürün KULLANMA.",
        "glutensiz": "Buğday, arpa, çavdar, un, ekmek, makarna gibi gluten içeren malzemeler KULLANMA.",
        "ketojenik": "Karbonhidratı çok düşük, yağ ve protein ağırlıklı tarifler öner. Pirinç, ekmek, patates, şeker kullanma.",
        "normal": "Herhangi bir kısıtlama yok, dengeli ve çeşitli tarifler öner."
    }.get(diyet, "Herhangi bir kısıtlama yok, dengeli ve çeşitli tarifler öner.")

    alerjen_uyarisi = ""
    if alerjenler:
        alerjen_uyarisi = f"\nKullanıcının alerjileri: {', '.join(alerjenler)} — bu malzemeleri KESİNLİKLE önerme, alternatif göstermeye çalışırsan bile bu malzemeleri kullanma."

    prompt = f"""
Şu gerçek Türk yemek tarifini baz al, İÇERİĞİNİ DEĞİŞTİRME, sadece eksikleri makul şekilde tamamla ve istenen formata çevir:

Tarif adı: {db_tarif.get('title')}
Kategori: {db_tarif.get('kategori')}
Zorluk: {db_tarif.get('zorluk')}
Porsiyon: {db_tarif.get('servings') or 'belirtilmemiş, kişi sayısına göre tahmin et'}
Hazırlık süresi: {db_tarif.get('hazirlik_suresi_dk') or 'belirtilmemiş, tahmin et'} dakika
Pişirme süresi: {db_tarif.get('pisirme_suresi_dk') or 'belirtilmemiş, tahmin et'} dakika
Yapılış adımları: {db_tarif.get('yapilis_adimlari')}
Kullanıcı hedefi: {hedef}
Diyet kısıtlaması: {diyet_mesaj}
Kaç kişilik: {kisi_sayisi}
Öğün: {ogun if ogun != "belirtilmemiş" else "herhangi bir öğün için uygun"}{alerjen_uyarisi}

NOT: Eğer bu tarif diyet kısıtlamasına UYMUYORSA (örn. vejetaryen isteniyor ama tarifte et varsa),
malzemeleri ve yapılış adımlarını uygun alternatiflerle DEĞİŞTİR (örn. kıyma yerine mantar/nohut gibi).

ÖNEMLİ: besin_degerleri alanındaki kalori, protein, karbonhidrat ve yağ değerlerini
TÜM TARİF İÇİN DEĞİL, KİŞİ BAŞINA (1 porsiyon) hesapla. Tarif {kisi_sayisi} kişilik
olduğu için, toplam malzeme miktarlarını {kisi_sayisi}'e bölerek 1 porsiyonluk
değerleri ver.

Ayrıca yapılış adımlarından geçen malzemeleri (isim ve miktar olarak) çıkarıp
"malzemeler" listesine ayrıca yaz.

SADECE şu JSON formatında yanıt ver, başka açıklama ekleme:
{{
  "tarif_adi": "...",
  "kategori": "...",
  "zorluk": "...",
  "porsiyon": {kisi_sayisi},
  "hazirlik_suresi_dk": 0,
  "pisirme_suresi_dk": 0,
  "malzemeler": [
    {{"ad": "...", "miktar": "..."}}
  ],
  "yapilis_adimlari": ["...", "..."],
  "besin_degerleri": {{"kalori": 0, "protein": 0, "karbonhidrat": 0, "yag": 0}},
  "hedef_onerisi": "..."
}}
"""
    yanit = ai_yanit(prompt)
    temiz = yanit.strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(temiz)
    except json.JSONDecodeError:
        return None
    
@app.get("/")
async def root():
    return {"mesaj": "Akıllı Mutfak Asistanı API'ye hoş geldiniz!"}


@app.post("/tarif-oner")
async def tarif_oner(giris: MalzemeGirisi):
    temiz_malzemeler = [malzeme_adini_temizle(m) for m in giris.malzemeler]

    db_tarifler = veritabanindan_tarif_bul(temiz_malzemeler, limit=3, alerjenler=giris.alerjenler)

    if len(db_tarifler) >= 2:
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(tarif_formatla_ve_zenginlestir, tarif, giris.hedef, giris.kisi_sayisi, giris.ogun, giris.diyet, giris.alerjenler)
                for tarif in db_tarifler
            ]
            zenginlestirilmis = [f.result() for f in futures if f.result() is not None]


        if zenginlestirilmis:
            return {
                "kaynak": "veritabani_rag",
                "tarifler": zenginlestirilmis,
                "kullanilan_malzemeler": giris.malzemeler,
                "kisi_sayisi": giris.kisi_sayisi
            }

    malzeme_listesi = ", ".join(giris.malzemeler)

    hedef_mesaj = {
        "kilo_verme": "Düşük kalorili, yüksek proteinli ve tok tutan tarifler öner.",
        "kas_kazanma": "Yüksek proteinli, karbonhidrat dengeli tarifler öner.",
        "form_koruma": "Dengeli makro besinlerle sağlıklı tarifler öner.",
        "normal": "Lezzetli ve pratik tarifler öner."
    }.get(giris.hedef, "Lezzetli ve pratik tarifler öner.")

    diyet_mesaj = {
        "vejetaryen": "Et, tavuk, balık KULLANMA. Sebze, süt ürünü, yumurta, bakliyat ağırlıklı tarifler öner.",
        "vegan": "Et, tavuk, balık, süt ürünü, yumurta, bal gibi hiçbir hayvansal ürün KULLANMA.",
        "glutensiz": "Buğday, arpa, çavdar, un, ekmek, makarna gibi gluten içeren malzemeler KULLANMA.",
        "ketojenik": "Karbonhidratı çok düşük, yağ ve protein ağırlıklı tarifler öner. Pirinç, ekmek, patates, şeker kullanma.",
        "normal": "Herhangi bir kısıtlama yok, dengeli ve çeşitli tarifler öner."
    }.get(giris.diyet, "Herhangi bir kısıtlama yok, dengeli ve çeşitli tarifler öner.")

    alerjen_uyarisi = ""
    if giris.alerjenler:
        alerjen_uyarisi = f"\nKullanıcının alerjileri: {', '.join(giris.alerjenler)} — BU MALZEMELERİ KESİNLİKLE KULLANMA."

    prompt = f"""
Sen Türkiye'nin en iyi aşçısı ve diyetisyenisin. Her zaman Türkçe yanıt verirsin.

Aşağıdaki bilgilere göre 3 farklı yemek tarifi öner.

Mevcut malzemeler: {malzeme_listesi}
Kişi sayısı: {giris.kisi_sayisi}
Maksimum hazırlık süresi: {giris.sure_dakika} dakika
Diyet kısıtlaması: {diyet_mesaj}
Kullanıcı hedefi: {hedef_mesaj}
Öğün: {giris.ogun if giris.ogun != "belirtilmemiş" else "herhangi bir öğün için uygun"}{alerjen_uyarisi}

ÖNEMLİ: besin_degerleri alanındaki kalori, protein, karbonhidrat ve yağ değerlerini
TÜM TARİF İÇİN DEĞİL, KİŞİ BAŞINA (1 porsiyon) hesapla.

SADECE şu JSON formatında yanıt ver (bir liste içinde 3 tarif objesi), başka açıklama ekleme:
[
  {{
    "tarif_adi": "...",
    "kategori": "...",
    "zorluk": "...",
    "porsiyon": {giris.kisi_sayisi},
    "hazirlik_suresi_dk": 0,
    "pisirme_suresi_dk": 0,
    "malzemeler": [
      {{"ad": "...", "miktar": "..."}}
    ],
    "yapilis_adimlari": ["...", "..."],
    "besin_degerleri": {{"kalori": 0, "protein": 0, "karbonhidrat": 0, "yag": 0}},
    "hedef_onerisi": "..."
  }}
]
"""

    yanit = ai_yanit(prompt)
    temiz = yanit.strip().replace("```json", "").replace("```", "").strip()
    try:
        tarifler = json.loads(temiz)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI yanıtı işlenemedi, tekrar deneyin.")

    return {
        "kaynak": "gemini",
        "tarifler": tarifler,
        "kullanilan_malzemeler": giris.malzemeler,
        "kisi_sayisi": giris.kisi_sayisi
    }


@app.post("/makro-hesapla")
async def makro_hesapla(yemek: YemekFotografi):
    if not yemek.aciklama and not yemek.image:
        raise HTTPException(status_code=400, detail="Yemek açıklaması veya fotoğrafı gerekli.")

    ogun_metni = yemek.ogun if yemek.ogun != "belirtilmemiş" else "herhangi bir öğün"

    json_format_talimati = """
SADECE şu JSON formatında yanıt ver, başka açıklama ekleme:
{
  "yemek_adi": "...",
  "ogun": "...",
  "besin_degerleri": {
    "kalori": 0,
    "protein": 0,
    "karbonhidrat": 0,
    "yag": 0,
    "lif": 0
  },
  "degerlendirme": "...",
  "oneri": "..."
}
"""

    if yemek.image:
        try:
            header, encoded = yemek.image.split(",", 1) if "," in yemek.image else ("", yemek.image)
            image_bytes = base64.b64decode(encoded)
        except Exception:
            raise HTTPException(status_code=400, detail="Geçersiz base64 formatı.")

        prompt = f"""
Sen bir diyetisyen ve beslenme uzmanısın.
Bu fotoğraftaki yemeği analiz et, ne olduğunu tespit et ve besin değerlerini tahmin et.
Öğün: {ogun_metni}
{f"Ek açıklama: {yemek.aciklama}" if yemek.aciklama else ""}

{json_format_talimati}
"""
        yanit = ai_yanit_gorsel(prompt, image_bytes, "image/jpeg")

    else:
        prompt = f"""
Sen bir diyetisyen ve beslenme uzmanısın.
Kullanıcı şu yemeği yedi: {yemek.aciklama}
Öğün: {ogun_metni}

{json_format_talimati}
"""
        yanit = ai_yanit(prompt)

    temiz = yanit.strip().replace("```json", "").replace("```", "").strip()
    try:
        sonuc = json.loads(temiz)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI yanıtı işlenemedi, tekrar deneyin.")

    return sonuc


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
Sen bir beslenme uzmanı ve ekonomik alışveriş danışmanısın. Türkiye piyasa fiyatlarını bilerek öneri yaparsın.

Kullanıcının evinde şu malzemeler var: {malzeme_listesi}
Kişi sayısı: {giris.kisi_sayisi}
Diyet tercihi: {giris.diyet}
Hedef: {giris.hedef}

1 haftalık dengeli beslenme planı için eksik malzemeleri belirle.

SADECE aşağıdaki JSON formatında yanıt ver, başka açıklama ekleme:
{{
  "eksik_malzemeler": [
    {{"ad": "tavuk göğsü", "kategori": "et_protein", "miktar": "500 gram", "tahmini_fiyat": "80-100 TL"}},
    {{"ad": "ıspanak", "kategori": "sebze_meyve", "miktar": "1 demet", "tahmini_fiyat": "15-20 TL"}}
  ],
  "tahmini_toplam_butce": "300-400 TL"
}}

Kategori değerleri şunlardan biri olmalı: et_protein, sebze_meyve, sut_urunleri, tahil_bakliyat, diger
"""

    yanit = ai_yanit(prompt)
    temiz = yanit.strip().replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(temiz)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI yanıtı işlenemedi, tekrar deneyin.")

    return {
        "eksik_malzemeler": parsed.get("eksik_malzemeler", []),
        "tahmini_toplam_butce": parsed.get("tahmini_toplam_butce"),
        "mevcut_malzemeler": giris.malzemeler
    }

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

