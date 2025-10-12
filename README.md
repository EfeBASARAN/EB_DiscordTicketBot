# FiveM Ticket Bot

Discord sunucunuz için geliştirilmiş modüler bir destek talebi (ticket) botu.

## 🚀 Özellikler

- ✅ Otomatik destek talebi oluşturma
- ✅ Panel mesajı ile kolay erişim
- ✅ Kullanıcı başına maksimum ticket sınırı
- ✅ Otomatik kanal silme
- ✅ Türkçe arayüz
- ✅ Modüler kod yapısı
- ✅ Kolay yapılandırma
- ✅ Mesajlar için ayrı JSON dosyası

## 📋 Kurulum

### 1. Gereksinimler
- Node.js (v16 veya üzeri)
- Discord Bot Token

### 2. Kurulum Adımları

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Bot'u başlatın:**
```bash
npm start
```

### 3. Yapılandırma

#### config.json
Bot ayarlarınızı yapılandırmak için:

```json
{
  "token": "BOT_TOKEN_BURAYA",
  "categoryId": "KATEGORI_ID_BURAYA",
  "panelChannelId": "PANEL_KANAL_ID_BURAYA",
  "prefix": "!",
  "ticketSettings": {
    "maxTickets": 3,
    "autoClose": false,
    "autoCloseTime": 24
  }
}
```

#### messages.json
Bot mesajlarını özelleştirmek için:

```json
{
  "panel": {
    "title": "🎫 Destek Sistemi",
    "description": "Yardıma mı ihtiyacınız var? Aşağıdaki butona tıklayarak bir destek talebi oluşturun!",
    "footer": "FiveM Destek Sistemi",
    "color": "#00ff00"
  },
  "ticket": {
    "welcome": {
      "title": "🎫 Destek Talebi Oluşturuldu",
      "description": "Merhaba {user}! Destek talebiniz başarıyla oluşturuldu...",
      "color": "#00ff00"
    }
  }
}
```

## 🎮 Kullanım

### Panel Mesajı
Bot başlatıldığında otomatik olarak belirtilen kanala bir panel mesajı gönderir. Kullanıcılar bu mesajdaki butona tıklayarak destek talebi oluşturabilir.

### Komutlar

- `!ticket panel` - Panel mesajını yeniden gönderir
- `!ticket stats` - Aktif destek talebi sayısını gösterir

### Destek Talebi Özellikleri

- Her kullanıcı maksimum 3 destek talebi açabilir
- Destek talepleri özel kanallarda oluşturulur
- Sadece destek talebi sahibi ve yöneticiler kanalı görebilir
- Destek talebi kapatıldığında kanal 10 saniye sonra silinir

## 📁 Proje Yapısı

```
FivemTicketBot/
├── src/
│   ├── CommandHandler.js    # Komut işleyici
│   ├── TicketManager.js     # Ticket yönetimi
│   └── PanelManager.js      # Panel yönetimi
├── config.json              # Bot ayarları
├── messages.json            # Bot mesajları
├── index.js                 # Ana bot dosyası
├── package.json             # Bağımlılıklar
└── README.md                # Dokümantasyon
```

## 🔧 Geliştirme

Geliştirme modunda çalıştırmak için:
```bash
npm run dev
```

### Modüler Yapı
Bot artık modüler bir yapıya sahip:
- **TicketManager**: Ticket oluşturma, kapatma ve yönetimi
- **PanelManager**: Panel mesajı oluşturma ve yönetimi  
- **CommandHandler**: Komut işleme ve yönetimi
- **messages.json**: Tüm bot mesajları tek dosyada

## 📝 Notlar

- Bot token'ınızı güvenli tutun
- Kategori ve panel kanal ID'lerini doğru girdiğinizden emin olun
- Bot'un gerekli izinlere sahip olduğundan emin olun

## 🆘 Destek

Herhangi bir sorun yaşarsanız, lütfen GitHub Issues bölümünden bildirin.

## 📄 Lisans

MIT License
