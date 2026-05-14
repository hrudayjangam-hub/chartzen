const LANGUAGES = {
  'en': { name: 'English', code: 'en-US' },
  'hi': { name: 'Hindi', code: 'hi-IN' },
  'te': { name: 'Telugu', code: 'te-IN' },
  'ta': { name: 'Tamil', code: 'ta-IN' },
  'es': { name: 'Spanish', code: 'es-ES' },
  'fr': { name: 'French', code: 'fr-FR' },
  'de': { name: 'German', code: 'de-DE' },
  'zh': { name: 'Chinese', code: 'zh-CN' },
  'ja': { name: 'Japanese', code: 'ja-JP' },
  'ko': { name: 'Korean', code: 'ko-KR' },
  'ar': { name: 'Arabic', code: 'ar-SA' },
  'ru': { name: 'Russian', code: 'ru-RU' },
  'pt': { name: 'Portuguese', code: 'pt-BR' }
}

const LANG_PATTERNS = [
  { lang: 'te', pattern: /[\u0C00-\u0C7F]/ },
  { lang: 'hi', pattern: /[\u0900-\u097F]/ },
  { lang: 'ta', pattern: /[\u0B80-\u0BFF]/ },
  { lang: 'zh', pattern: /[\u4E00-\u9FFF]/ },
  { lang: 'ja', pattern: /[\u3040-\u309F\u30A0-\u30FF]/ },
  { lang: 'ko', pattern: /[\uAC00-\uD7AF]/ },
  { lang: 'ar', pattern: /[\u0600-\u06FF]/ },
  { lang: 'ru', pattern: /[\u0400-\u04FF]/ },
  { lang: 'es', pattern: /\b(hola|gracias|buenos|como|estas|bien|sí)\b/i },
  { lang: 'fr', pattern: /\b(bonjour|merci|comment|ca va|oui|non|est)\b/i },
  { lang: 'de', pattern: /\b(hallo|danke|bitte|wie|geht|gut|ja|nein)\b/i },
  { lang: 'pt', pattern: /\b(olá|obrigado|bom|dia|tudo|bem)\b/i }
]

function detectLanguage(text) {
  for (let p of LANG_PATTERNS) {
    if (p.pattern.test(text)) return p.lang
  }
  return 'en'
}

function speakText(text, langCode = 'en-US') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = langCode
  u.rate = 1.0
  u.pitch = 1.0
  const voices = window.speechSynthesis.getVoices()
  const match = voices.find(v => v.lang.startsWith(langCode.split('-')[0]))
  if (match) u.voice = match
  window.speechSynthesis.speak(u)
}
