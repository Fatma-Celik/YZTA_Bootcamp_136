# Sprint 3 — 1. Toplantı Notu

**Tarih:** 27 Temmuz 2026

---

## Gündem
* Supabase üzerinde veri kaydı (alerjenler, favoriler vb.) süreçlerinin netleştirilmesi
* Yemek verileri için MealDB kullanımının değerlendirilmesi
* Frontend (ön yüz) tarafındaki eksik sayfaların ve statik alanların gözden geçirilmesi
* Profil oluşturma aşamasında persona seçimi ve kullanıcı akışının planlanması
* Mock (test) data oluşturma sürecinin planlanması

---

## Görüşülen Konular

### Veritabanı ve API Entegrasyonları
* Kullanıcılara ait alerjenler ve favori tarifler gibi spesifik verilerin Supabase tarafında kaydedilip kaydedilmeyeceği ve veritabanı şemasının nasıl kurgulanması gerektiği üzerine fikir alışverişi yapıldı.
* Dış veri kaynağı olarak MealDB'nin projede kullanılıp kullanılmaması gerektiği, avantajları ve dezavantajlarıyla birlikte değerlendirildi.

### Frontend Durumu ve Kullanıcı Arayüzü
* Uygulamanın ön yüzünde **Ayrıntılar** sayfasının şu an için eksik olduğu ve geliştirilmesi gerektiği tespiti yapıldı.
* **Tarif Kaydetme** ekranının henüz bulunmadığı ve **Son Gezilen Kısımlar** alanının şu an sadece statik verilerden oluştuğu, bu alanların dinamik hale getirilmesi gerektiği konuşuldu.

### Kullanıcı Deneyimi (UX) ve Profil Oluşturma
* Kullanıcı kayıt aşamasında bir persona seçimi yapılıp yapılmayacağı tartışıldı.
* Kayıt kısmında kullanıcının kendini tanıtabileceği bir karşılama *(onboarding)* ekranı olması ve uygulamanın kişinin bu ilk seçimlerine göre şekillenerek ilerlemesi gerektiği vurgulandı.

---

## Alınan Kararlar
* Geliştirme sürecini hızlandırmak ve arayüz testlerini yapabilmek adına projede **mock data (test verisi)** oluşturma işleminin gerçekleştirilmesine karar verildi.

---

## Sonraki Toplantıya Kadar Yapılacaklar
- [ ] Supabase tarafında alerjenler ve favoriler için gerekli veritabanı tablolarının/kayıt altyapısının tasarlanması.
- [ ] MealDB kullanımı konusunda kesin bir karara varılması ve entegrasyon araştırmasının yapılması.
- [ ] Frontend tarafında eksik olan **Ayrıntılar Sayfası** ile **Tarif Kaydetme** ekranlarının tasarlanıp kodlanması.
- [ ] **Son gezilen kısımlar** bölümünün statik verilerden arındırılarak dinamik veri çekecek altyapıya kavuşturulması.
- [ ] Kayıt ekranı için kullanıcının kendini tanıtabileceği persona seçimi arayüzünün *(onboarding)* taslaklarının oluşturulması.
- [ ] Mock dataların oluşturulması ve sisteme entegre edilmesi.