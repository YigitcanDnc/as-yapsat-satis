# AS İNŞAAT — Yapsat Konut Projesi İnteraktif Satış ve Esnek Ödeme Planlayıcı (SPA)

İki bloklu (40 bağımsız bölüm) konut projesi için hem müşteriye görsel sunum yapılabilecek şıklıkta hem de sözleşme ve Excel çıktısı üretebilecek finansal hassasiyette tek sayfalık modern web uygulaması.

---

## 🌟 Öne Çıkan Özellikler

- **Sabit Şerefiye Matrisi:** 40 dairenin (A-1..A-16, B-1..B-24) kesinleşmiş şerefiye katsayıları ve baz fiyatları.
- **Finansal Hesaplama Motoru:**
  - Peşin satışta %15 anında nakit indirimi.
  - Vadeli modda esnek peşinat (minimum %40).
  - Taksitli veya teslimata (Mart 2028) endeksli balon ödeme.
  - Aylık %2,5 basit faizli vade farkı motoru.
- **İzometrik Kat ve Bağımsız Bölüm Yerleşim Şeması:**
  - Orijinal mimari izometrik çizim üzerinde dinamik SVG vurgulama.
  - Seçilen dairenin kat ve cephesini radar pulse ve rozet ile işaretleme.
- **Resmi Çıktı Motoru:**
  - **A4 PDF / Baskı Çıktısı (2 Sayfa):**
    - Sayfa 1: Teklif Özeti, Finansal Rakamlar, Ödeme Çizelgesi ve Resmi Şirket Kaşesi.
    - Sayfa 2: Sözleşme Eki Kat Şeması (Seçili daire mimari çizimde işaretli).
  - **Estetik Excel (.xlsx) Aktarımı:** İki ayrı sekme halinde, varsayılan 1 A4 portrait sayfaya tam sığacak şekilde biçimlendirilmiş profesyonel Excel raporu.

---

## 🛠️ Yerel Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Test paketini çalıştırın (10 senaryoluk stres testi)
npm test

# Geliştirme sunucusunu başlatın
npm run dev

# Canlı dağıtım paketini oluşturun
npm run build
```

---

## 🏢 Firma Bilgileri
**As İnşaat Enerji Makine Madencilik Taşımacılık Tic.Ltd.Şti.**  
Proje Satış Ofisi · Tel: +90 507 935 72 09 · E-posta: info@as-insaat.com.tr
