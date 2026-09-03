import type { Strings } from './types'

export const tr: Strings = {
  // Ana ekran
  onThisDevice: 'Bu cihazda',
  proofDesk: 'Yazı masası',
  writePrivately: 'Gizli yaz. Belgeler bu tarayıcıda kalır — hesap yok, yükleme yok.',
  startWriting: 'Yazmaya başla',
  importDocx: '.docx içe aktar',
  importing: 'İçe aktarılıyor…',
  recentGalleys: 'Son belgeler',
  noGalleysYet: 'Henüz belge yok. Yazmaya başla — her şey bu cihazda kalır.',
  storedLocally: 'Yerel depolama',
  agpl: 'AGPL-3.0',

  // Belge listesi
  untitledDocument: 'Adsız belge',
  wordSingular: 'kelime',
  wordPlural: 'kelime',
  duplicate: 'Çoğalt',
  delete: 'Sil',

  // Silme diyaloğu
  deleteTitle: 'Bu belge silinsin mi?',
  deleteDescription: (title) =>
    `"${title}" bu cihazdan kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
  cancel: 'Vazgeç',

  // Editör TopBar
  backToDocuments: 'Belgelere dön',
  documentTitle: 'Belge başlığı',
  documentMenu: 'Belge menüsü',

  // Kaydetme durumu
  proofSaved: 'Kaydedildi',
  saving: 'Kaydediliyor…',
  unsavedMarks: 'Kaydedilmemiş değişiklikler',
  saveFailed: 'Kayıt başarısız',

  // StatusBar
  charSingular: 'karakter',
  charPlural: 'karakter',
  pageSingular: 'sayfa',
  pagePlural: 'sayfa',
  local: 'Yerel',

  // Araç çubuğu
  formatting: 'Biçimlendirme',
  undo: 'Geri al',
  redo: 'Yinele',
  paragraphStyle: 'Paragraf stili',
  font: 'Yazı tipi',
  fontSize: 'Yazı boyutu',
  bold: 'Kalın',
  italic: 'İtalik',
  underline: 'Altı çizili',
  strikethrough: 'Üstü çizili',
  textColor: 'Yazı rengi',
  highlight: 'Vurgulama',
  alignLeft: 'Sola hizala',
  alignCenter: 'Ortala',
  alignRight: 'Sağa hizala',
  alignJustify: 'İki yana yasla',
  bulletList: 'Madde listesi',
  numberedList: 'Numaralı liste',
  checklist: 'Yapılacaklar',
  insertLink: 'Bağlantı ekle',
  insertImage: 'Görsel ekle',
  insertTable: 'Tablo ekle',
  horizontalRule: 'Yatay çizgi',
  pageBreak: 'Sayfa sonu',
  clearFormatting: 'Biçimlendirmeyi temizle',
  linkUrl: 'Bağlantı adresi',
  removeLink: 'Bağlantıyı kaldır',
  apply: 'Uygula',

  // Editör menü öğeleri
  newDocument: 'Yeni belge',
  importDocxMenu: '.docx içe aktar…',
  duplicateMenu: 'Çoğalt',
  exportDocx: '.docx olarak dışa aktar',
  printPdf: 'Yazdır / PDF kaydet',
  deleteDocument: 'Belgeyi sil',

  // Uyarılar / hatalar
  saveFailed_toast: 'Kayıt başarısız. Birazdan tekrar deneyin.',
  storageFull: 'Cihaz depolaması dolu. Görselleri kaldırın veya tarayıcı depolamasını boşaltın.',
  conflictTab: 'Bu belge başka bir sekmede değişti. Devam etmeden önce yeniden yükleyin.',
  importWarnings: (n) => `${n} desteklenmeyen biçimlendirme notuyla içe aktarıldı.`,
  importFailed:
    'Bu belge açılamadı. Dosya bozuk olabilir veya desteklenmeyen biçimlendirme içeriyor olabilir.',
  exportFailed: 'Bu belge dışa aktarılamadı. Çalışmanız yerel olarak kaydedildi.',
  duplicateFailed: 'Bu belge çoğaltılamadı.',
  deleteFailed: 'Bu belge silinemedi.',
  createFailed: 'Yeni belge oluşturulamadı.',
  couldNotRead: 'Yerel depolama okunamadı. Belgeler kalıcı olmayabilir.',
  unsupportedImageType: 'Desteklenmeyen görsel türü. PNG, JPEG, GIF veya WebP kullanın.',
  imageTooLarge: 'Görsel çok büyük. Maksimum boyut 5 MB.',
  imageReadError: 'Bu görsel dosyası okunamadı.',
  restoredSession: 'Son oturumunuzdan kaydedilmemiş değişiklikler geri yüklendi.',

  // Yükleniyor
  loading: 'Yükleniyor…',

  // Göreceli zaman
  justNow: 'Az önce',
  minutesAgo: (n) => `${n} dakika önce`,
  hoursAgo: (n) => `${n} saat önce`,

  // Alt bilgi
  padros: 'Padros',

  // Tema
  themeLight: 'Açık',
  themeDark: 'Koyu',
  themeSystem: 'Sistem',

  // Yer tutucu
  startWritingPlaceholder: 'Yazmaya başla…',
}
