// Mock Dictionary for Universal Language Intelligence Engine
// Simulating translations and language detection capabilities

const SUPPORTED_LANGUAGES = {
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
};

// Simple heuristic patterns for detection
const LANG_PATTERNS = [
    { lang: 'te', pattern: /[\u0C00-\u0C7F]/ },          // Telugu
    { lang: 'hi', pattern: /[\u0900-\u097F]/ },          // Hindi
    { lang: 'ta', pattern: /[\u0B80-\u0BFF]/ },          // Tamil
    { lang: 'zh', pattern: /[\u4E00-\u9FFF]/ },          // Chinese
    { lang: 'ja', pattern: /[\u3040-\u309F\u30A0-\u30FF]/ }, // Japanese
    { lang: 'ko', pattern: /[\uAC00-\uD7AF]/ },          // Korean
    { lang: 'ar', pattern: /[\u0600-\u06FF]/ },          // Arabic
    { lang: 'ru', pattern: /[\u0400-\u04FF]/ },          // Russian
    { lang: 'es', pattern: /\b(hola|gracias|buenos|como|estas|bien|sí)\b/i }, // Spanish
    { lang: 'fr', pattern: /\b(bonjour|merci|comment|ca va|oui|non|est)\b/i }, // French
    { lang: 'de', pattern: /\b(hallo|danke|bitte|wie|geht|gut|ja|nein)\b/i }, // German
    { lang: 'pt', pattern: /\b(olá|obrigado|bom|dia|tudo|bem)\b/i }        // Portuguese
];

// Mock translation dictionary for common greetings and phrases
const MOCK_DICTIONARY = {
    'en': {
        'greeting': 'Hey there! How is your day going? I am so happy to chat with you!',
        'understanding': 'Got it! I am on it right now.',
        'translation_mode': 'Translation mode is on! Everything will seamlessly switch over.',
        'farewell': 'See you later! It was awesome talking to you!',
        'default': 'I am currently in Offline Mode! To unlock my full, super-smart human conversational brain, please click the Settings Gear ⚙️ and paste a free Gemini API key!'
    },
    'hi': {
        'greeting': 'नमस्ते! आज मैं आपकी कैसे सहायता कर सकता हूँ?',
        'understanding': 'मैं समझ गया। मैं आपके अनुरोध पर कार्रवाई कर रहा हूँ।',
        'translation_mode': 'अनुवाद मोड सक्रिय है। UI तत्व स्थानीय रूप से अनुवादित होते हैं।',
        'farewell': 'अलविदा! आपका दिन शुभ हो!',
        'default': 'बहु-चरणीय तर्क के आधार पर विस्तृत प्रतिक्रिया उत्पन्न की गई। मैं और कैसे मदद कर सकता हूँ?'
    },
    'te': {
        'greeting': 'నమస్కారం! ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
        'understanding': 'నాకు అర్థమైంది. నేను మీ అభ్యర్థనను ప్రాసెస్ చేస్తున్నాను.',
        'translation_mode': 'అనువాద మోడ్ సక్రియంగా ఉంది.',
        'farewell': 'వీడ్కోలు! మీ రోజు శుభప్రదంగా ఉండాలి!',
        'default': 'వివరణాత్మక ప్రతిస్పందన రూపొందించబడింది. నేను ఇంకా ఎలా సహాయపడగలను?'
    },
    'ta': {
        'greeting': 'வணக்கம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
        'understanding': 'எனக்கு புரிகிறது. நான் உங்கள் கோரிக்கையைச் செயல்படுத்துகிறேன்.',
        'translation_mode': 'மொழிபெயர்ப்பு பயன்முறை செயலில் உள்ளது.',
        'farewell': 'பிரியாவிடை! ஒரு நல்ல நாள்!',
        'default': 'விரிவான பதில் உருவாக்கப்பட்டது. நான் வேறு எப்படி உதவ முடியும்?'
    },
    'es': {
        'greeting': '¡Hola! ¿Cómo puedo ayudarte hoy?',
        'understanding': 'Entiendo. Estoy procesando su solicitud.',
        'translation_mode': 'Modo de traducción activo.',
        'farewell': '¡Adiós! ¡Que tengas un gran día!',
        'default': 'Respuesta detallada generada. ¿Cómo más puedo ayudar?'
    },
    'fr': {
        'greeting': 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
        'understanding': 'Je comprends. Je traite votre demande.',
        'translation_mode': 'Mode de traduction actif.',
        'farewell': 'Au revoir! Bonne journée!',
        'default': 'Réponse détaillée générée. Comment puis-je aider d\'autre?'
    },
    'de': {
        'greeting': 'Hallo! Wie kann ich Ihnen heute helfen?',
        'understanding': 'Ich verstehe. Ich bearbeite Ihre Anfrage.',
        'translation_mode': 'Übersetzungsmodus aktiv.',
        'farewell': 'Auf Wiedersehen! Einen schönen Tag noch!',
        'default': 'Detaillierte Antwort generiert. Wie kann ich sonst helfen?'
    }
};

// Helper: Auto-detect language based on patterns
function detectLanguage(text) {
    for (let p of LANG_PATTERNS) {
        if (p.pattern.test(text)) {
            return p.lang;
        }
    }
    return 'en'; // Default to english
}

// Generate mock AI response according to detected language
function getAIResponse(text, explicitLang = null) {
    const lang = explicitLang || detectLanguage(text);
    const dct = MOCK_DICTIONARY[lang] || MOCK_DICTIONARY['en'];
    
    // Simple intent matching
    let lowerText = text.toLowerCase();
    
    // Check for image or background change requests
    if (lowerText.includes('background') || lowerText.includes('image') || lowerText.includes('picture') || lowerText.includes('photo')) {
        let match = text.match(/of a?n? (\w+)/i) || text.match(/to a?n? (\w+)/i) || text.match(/like (\w+)/i);
        let query = match ? match[1] : 'galaxy';
        return { text: `<EXECUTE_CMD>CHANGE_BG:https://source.unsplash.com/1600x900/?${query}</EXECUTE_CMD>${dct['understanding']} Changing the background to ${query}.`, lang: lang };
    }
    if (lowerText.includes('transl') || lowerText.includes('अनुवाद') || lowerText.includes('అనువాదం')) {
        return { text: dct['translation_mode'], lang: lang };
    } else if (lowerText.length < 15 && (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hola') || lowerText.includes('നమస్కారం') || lowerText.includes('வணக்கம்'))) {
        return { text: dct['greeting'], lang: lang };
    }
    
    return { text: dct['default'], lang: lang };
}
