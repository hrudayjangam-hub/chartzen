/**
 * ChatZen API Module - Comprehensive API Integration Layer
 * Provides: Translation, Weather, Dictionary, Currency, News, Image Generation, Wikipedia
 * All APIs used here are FREE with no key required (unless noted).
 */

const CHATZEN_APIS = {

    // ─── 1. TRANSLATION (LibreTranslate - open/free mirror) ─────────────────────
    translate: async function(text, targetLang, sourceLang = 'auto') {
        try {
            const res = await fetch('https://libretranslate.de/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: 'text' })
            });
            const data = await res.json();
            return data.translatedText || null;
        } catch (e) {
            // Fallback to MyMemory (also free)
            try {
                const res2 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
                const d = await res2.json();
                return d.responseData?.translatedText || null;
            } catch { return null; }
        }
    },

    // All supported language codes (ISO 639-1 for translation)
    TRANSLATION_LANGUAGES: {
        'Afrikaans': 'af', 'Albanian': 'sq', 'Arabic': 'ar', 'Armenian': 'hy',
        'Azerbaijani': 'az', 'Basque': 'eu', 'Belarusian': 'be', 'Bengali': 'bn',
        'Bosnian': 'bs', 'Bulgarian': 'bg', 'Catalan': 'ca', 'Chinese (Simplified)': 'zh',
        'Chinese (Traditional)': 'zt', 'Croatian': 'hr', 'Czech': 'cs', 'Danish': 'da',
        'Dutch': 'nl', 'English': 'en', 'Esperanto': 'eo', 'Estonian': 'et',
        'Finnish': 'fi', 'French': 'fr', 'Galician': 'gl', 'Georgian': 'ka',
        'German': 'de', 'Greek': 'el', 'Gujarati': 'gu', 'Haitian Creole': 'ht',
        'Hebrew': 'he', 'Hindi': 'hi', 'Hungarian': 'hu', 'Icelandic': 'is',
        'Indonesian': 'id', 'Irish': 'ga', 'Italian': 'it', 'Japanese': 'ja',
        'Kannada': 'kn', 'Kazakh': 'kk', 'Korean': 'ko', 'Latvian': 'lv',
        'Lithuanian': 'lt', 'Macedonian': 'mk', 'Malay': 'ms', 'Malayalam': 'ml',
        'Maltese': 'mt', 'Maori': 'mi', 'Marathi': 'mr', 'Mongolian': 'mn',
        'Nepali': 'ne', 'Norwegian': 'no', 'Pashto': 'ps', 'Persian': 'fa',
        'Polish': 'pl', 'Portuguese': 'pt', 'Punjabi': 'pa', 'Romanian': 'ro',
        'Russian': 'ru', 'Serbian': 'sr', 'Sinhala': 'si', 'Slovak': 'sk',
        'Slovenian': 'sl', 'Somali': 'so', 'Spanish': 'es', 'Swahili': 'sw',
        'Swedish': 'sv', 'Tagalog': 'tl', 'Tamil': 'ta', 'Telugu': 'te',
        'Thai': 'th', 'Turkish': 'tr', 'Ukrainian': 'uk', 'Urdu': 'ur',
        'Uzbek': 'uz', 'Vietnamese': 'vi', 'Welsh': 'cy', 'Zulu': 'zu'
    },

    // ─── 2. WEATHER (Open-Meteo - completely free, no key) ──────────────────────
    getWeather: async function(city) {
        try {
            // First get coordinates using Nominatim (free geocoder)
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`);
            const geoData = await geoRes.json();
            if (!geoData.length) return null;
            const { lat, lon, display_name } = geoData[0];

            const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`);
            const wx = await wxRes.json();
            const cw = wx.current_weather;

            const codes = { 0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast', 45:'Foggy', 48:'Icy fog', 51:'Light drizzle', 61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain', 71:'Light snow', 73:'Moderate snow', 80:'Slight showers', 95:'Thunderstorm' };
            return {
                city: display_name.split(',')[0],
                temp: cw.temperature,
                windspeed: cw.windspeed,
                condition: codes[cw.weathercode] || 'Unknown',
                isDay: cw.is_day
            };
        } catch (e) { return null; }
    },

    // ─── 3. DICTIONARY (Free Dictionary API) ────────────────────────────────────
    define: async function(word) {
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            const data = await res.json();
            if (!data || data.title) return null;
            const entry = data[0];
            const meanings = entry.meanings.slice(0, 2).map(m => {
                const defs = m.definitions.slice(0, 2).map(d => d.definition).join(' ');
                return `**${m.partOfSpeech}**: ${defs}`;
            });
            return { word: entry.word, phonetic: entry.phonetic || '', meanings };
        } catch (e) { return null; }
    },

    // ─── 4. CURRENCY CONVERTER (ExchangeRate-API free) ──────────────────────────
    convertCurrency: async function(amount, from, to) {
        try {
            const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`);
            const data = await res.json();
            const rate = data.rates[to.toUpperCase()];
            if (!rate) return null;
            return { amount, from, to, rate, result: (amount * rate).toFixed(2) };
        } catch (e) { return null; }
    },

    // ─── 5. WIKIPEDIA SUMMARY ──────────────────────────────────────────────────
    wikipedia: async function(query) {
        try {
            const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.type === 'disambiguation' || !data.extract) return null;
            return { title: data.title, extract: data.extract, url: data.content_urls?.desktop?.page, thumbnail: data.thumbnail?.source };
        } catch (e) { return null; }
    },

    // ─── 6. IMAGE GENERATION (Pollinations - free) ──────────────────────────────
    generateImage: function(prompt) {
        const encoded = encodeURIComponent(prompt);
        return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&nologo=true`;
    },

    // ─── 7. JOKE API (free) ─────────────────────────────────────────────────────
    getJoke: async function() {
        try {
            const res = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode&type=single');
            const data = await res.json();
            return data.joke || null;
        } catch (e) { return null; }
    },

    // ─── 8. TRIVIA / QUIZ (Open Trivia DB - free) ───────────────────────────────
    getTrivia: async function() {
        try {
            const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = await res.json();
            if (!data.results.length) return null;
            const q = data.results[0];
            return { question: q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'"), category: q.category, difficulty: q.difficulty };
        } catch (e) { return null; }
    },

    // ─── 9. IP GEOLOCATION (free) ───────────────────────────────────────────────
    getLocation: async function() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            return { city: data.city, country: data.country_name, timezone: data.timezone, ip: data.ip };
        } catch (e) { return null; }
    },

    // ─── 10. NEWS (GNews - free tier 10/day) ─────────────────────────────────────
    getNews: async function(topic = 'technology', apiKey = '') {
        if (!apiKey) return null;
        try {
            const res = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&token=${apiKey}&lang=en&max=3`);
            const data = await res.json();
            return data.articles?.slice(0, 3) || null;
        } catch (e) { return null; }
    },

    // ─── 11. SMART INTENT DETECTION ─────────────────────────────────────────────
    detectIntent: function(text) {
        const t = text.toLowerCase().trim();
        // Weather
        if (/weather|temperature|rain|sunny|cloudy|forecast|hot|cold|humid/.test(t)) {
            const city = t.replace(/(what'?s?|get|show|tell me|how'?s?) (the )?weather (in |of |at |for )?/i, '').replace(/(weather|forecast|temperature|today|now)/gi, '').trim();
            return { type: 'weather', data: { city: city || 'current location' } };
        }
        // Translation
        const transMatch = t.match(/translate (.+?) (to|in|into) (\w+)/i);
        if (transMatch) {
            return { type: 'translate', data: { text: transMatch[1], targetLang: transMatch[3] } };
        }
        // Currency
        const currMatch = t.match(/(\d+(?:\.\d+)?) ([A-Z]{3}) (?:to|in) ([A-Z]{3})/i);
        if (currMatch) {
            return { type: 'currency', data: { amount: parseFloat(currMatch[1]), from: currMatch[2], to: currMatch[3] } };
        }
        // Dictionary
        const defMatch = t.match(/(?:what (?:does|is)|define|meaning of) (.+?)(?:\s*mean|\s*\?|$)/i);
        if (defMatch) {
            return { type: 'define', data: { word: defMatch[1].trim() } };
        }
        // Image generation
        if (/generate (an? )?image|create (an? )?image|draw|make (an? )?picture|show me (an? )?/.test(t)) {
            const subject = t.replace(/generate (an? )?image of|create (an? )?image of|draw (an? )?|make (an? )?picture of|show me (an? )?/gi, '').trim();
            return { type: 'image', data: { prompt: subject } };
        }
        // Joke
        if (/tell me a joke|joke|make me laugh|funny/.test(t)) {
            return { type: 'joke' };
        }
        // Trivia
        if (/trivia|quiz|question|challenge me|test me/.test(t)) {
            return { type: 'trivia' };
        }
        // News
        if (/news|latest|headlines|what'?s happening/.test(t)) {
            const topic = t.replace(/(news|latest|headlines|what'?s happening|about|on|regarding)/gi, '').trim() || 'technology';
            return { type: 'news', data: { topic } };
        }
        // Wikipedia
        if (/who is|what is|tell me about|explain|history of|biography/.test(t)) {
            const subject = t.replace(/who is|what is|tell me about|explain|history of|biography of/gi, '').replace(/\?/g, '').trim();
            return { type: 'wikipedia', data: { query: subject } };
        }
        return { type: 'chat' };
    },

    // ─── 12. HANDLE INTENT & BUILD RICH RESPONSE ────────────────────────────────
    handleIntent: async function(intent, gnewsKey = '') {
        switch (intent.type) {
            case 'weather': {
                const city = intent.data.city;
                const w = await this.getWeather(city);
                if (!w) return null;
                const icon = w.isDay ? '☀️' : '🌙';
                return `${icon} **Weather in ${w.city}**\n\n🌡️ Temperature: **${w.temp}°C**\n💨 Wind: ${w.windspeed} km/h\n☁️ Condition: ${w.condition}`;
            }
            case 'translate': {
                const langMap = this.TRANSLATION_LANGUAGES;
                const targetCode = Object.values(langMap).find(v => v === intent.data.targetLang.toLowerCase())
                    || Object.entries(langMap).find(([k]) => k.toLowerCase().includes(intent.data.targetLang.toLowerCase()))?.[1]
                    || intent.data.targetLang;
                const translated = await this.translate(intent.data.text, targetCode);
                if (!translated) return null;
                return `🌐 **Translation** *(to ${intent.data.targetLang})*\n\n"${translated}"`;
            }
            case 'currency': {
                const result = await this.convertCurrency(intent.data.amount, intent.data.from, intent.data.to);
                if (!result) return null;
                return `💱 **Currency Conversion**\n\n${result.amount} **${result.from}** = **${result.result} ${result.to}**\n_(Rate: 1 ${result.from} = ${result.rate} ${result.to})_`;
            }
            case 'define': {
                const def = await this.define(intent.data.word);
                if (!def) return null;
                return `📖 **${def.word}** ${def.phonetic}\n\n${def.meanings.join('\n\n')}`;
            }
            case 'image': {
                const url = this.generateImage(intent.data.prompt);
                return `🎨 Here's an AI-generated image of **${intent.data.prompt}**:\n\n![${intent.data.prompt}](${url})`;
            }
            case 'joke': {
                const joke = await this.getJoke();
                if (!joke) return null;
                return `😄 **Here's one for you:**\n\n${joke}`;
            }
            case 'trivia': {
                const q = await this.getTrivia();
                if (!q) return null;
                return `🧠 **Trivia Time!** *(${q.category} - ${q.difficulty})*\n\n${q.question.replace(/&amp;/g, '&')}`;
            }
            case 'wikipedia': {
                const wiki = await this.wikipedia(intent.data.query);
                if (!wiki) return null;
                let response = `📚 **${wiki.title}**\n\n${wiki.extract}`;
                if (wiki.thumbnail) response += `\n\n![${wiki.title}](${wiki.thumbnail})`;
                if (wiki.url) response += `\n\n[Read more on Wikipedia](${wiki.url})`;
                return response;
            }
            case 'news': {
                const articles = await this.getNews(intent.data.topic, gnewsKey);
                if (!articles) return null;
                let result = `📰 **Latest News: ${intent.data.topic}**\n\n`;
                articles.forEach((a, i) => {
                    result += `**${i+1}. ${a.title}**\n${a.description}\n[Read →](${a.url})\n\n`;
                });
                return result;
            }
            default: return null;
        }
    }
};
