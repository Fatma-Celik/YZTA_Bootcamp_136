from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os

try:
    from google import genai
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


@app.get("/")
async def root():
    return {"mesaj": "Akıllı Mutfak Asistanı API'ye hoş geldiniz!"}


@app.post("/tarif-oner")
async def tarif_oner(giris: MalzemeGirisi):
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