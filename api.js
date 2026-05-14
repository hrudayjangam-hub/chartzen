const CHARTGEN_API = {
  detectIntent: function(text) {
    const t = text.toLowerCase().trim()
    if (/weather|temperature|rain|sunny|cloudy|forecast|hot|cold|humid/.test(t)) {
      const city = t.replace(/(what'?s?|get|show|tell me|how'?s?) (the )?weather (in |of |at |for )?/i, '').replace(/(weather|forecast|temperature|today|now)/gi, '').trim()
      return { type: 'weather', data: { city: city || 'current location' } }
    }
    const transMatch = t.match(/translate (.+?) (to|in|into) (\w+)/i)
    if (transMatch) return { type: 'translate', data: { text: transMatch[1], targetLang: transMatch[3] } }
    const currMatch = t.match(/(\d+(?:\.\d+)?) ([A-Z]{3}) (?:to|in) ([A-Z]{3})/i)
    if (currMatch) return { type: 'currency', data: { amount: parseFloat(currMatch[1]), from: currMatch[2], to: currMatch[3] } }
    const defMatch = t.match(/(?:what (?:does|is)|define|meaning of) (.+?)(?:\s*mean|\s*\?|$)/i)
    if (defMatch) return { type: 'define', data: { word: defMatch[1].trim() } }
    if (/map of|show me a map|where is|navigate to/.test(t)) {
      const q = t.replace(/map of|show me (a )?map( of)?|where is|navigate to|find/gi, '').replace(/\?/g, '').trim()
      if (q && q !== 'me' && q !== 'i') return { type: 'map', data: { query: q } }
    }
    if (/where am i|my location|current location/.test(t)) return { type: 'where_am_i' }
    if (/generate (an? )?image|create (an? )?image|draw|make (an? )?picture|show me (an? )?(picture|image|drawing|photo)/.test(t)) {
      const s = t.replace(/generate (an? )?image of|create (an? )?image of|draw (an? )?|make (an? )?picture of|show me (an? )?(picture|image|drawing|photo)( of)?/gi, '').trim()
      return { type: 'image', data: { prompt: s } }
    }
    if (/tell me a joke|joke|make me laugh|funny/.test(t)) return { type: 'joke' }
    if (/trivia|quiz|question|challenge me|test me/.test(t)) return { type: 'trivia' }
    if (/news|latest|headlines|what'?s happening/.test(t)) {
      const topic = t.replace(/(news|latest|headlines|what'?s happening|about|on|regarding)/gi, '').trim() || 'technology'
      return { type: 'news', data: { topic } }
    }
    if (/who is|what is|tell me about|explain|history of|biography/.test(t)) {
      const s = t.replace(/who is|what is|tell me about|explain|history of|biography of/gi, '').replace(/\?/g, '').trim()
      return { type: 'wikipedia', data: { query: s } }
    }
    return { type: 'chat' }
  },

  translate: async function(text, targetLang, sourceLang = 'auto') {
    try {
      const r = await fetch('https://libretranslate.de/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: 'text' })
      })
      const d = await r.json()
      return d.translatedText || null
    } catch {
      try {
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`)
        const d = await r.json()
        return d.responseData?.translatedText || null
      } catch { return null }
    }
  },

  getWeather: async function(city) {
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`)
      const gd = await geo.json()
      if (!gd.length) return null
      const { lat, lon } = gd[0]
      const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`)
      const w = await wx.json()
      const cw = w.current_weather
      const codes = { 0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Drizzle',61:'Rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',80:'Showers',95:'Thunderstorm' }
      return { city: gd[0].display_name.split(',')[0], temp: cw.temperature, windspeed: cw.windspeed, condition: codes[cw.weathercode] || 'Unknown', isDay: cw.is_day }
    } catch { return null }
  },

  define: async function(word) {
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      const d = await r.json()
      if (!d || d.title) return null
      const e = d[0]
      const meanings = e.meanings.slice(0, 2).map(m => {
        const defs = m.definitions.slice(0, 2).map(d => d.definition).join(' ')
        return `**${m.partOfSpeech}**: ${defs}`
      })
      return { word: e.word, phonetic: e.phonetic || '', meanings }
    } catch { return null }
  },

  convertCurrency: async function(amount, from, to) {
    try {
      const r = await fetch(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`)
      const d = await r.json()
      const rate = d.rates[to.toUpperCase()]
      if (!rate) return null
      return { amount, from, to, rate, result: (amount * rate).toFixed(2) }
    } catch { return null }
  },

  wikipedia: async function(query) {
    try {
      const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      const d = await r.json()
      if (d.type === 'disambiguation' || !d.extract) return null
      return { title: d.title, extract: d.extract, url: d.content_urls?.desktop?.page, thumbnail: d.thumbnail?.source }
    } catch { return null }
  },

  generateImage: function(prompt) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`
  },

  getJoke: async function() {
    try {
      const r = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode&type=single')
      const d = await r.json()
      return d.joke || null
    } catch { return null }
  },

  getTrivia: async function() {
    try {
      const r = await fetch('https://opentdb.com/api.php?amount=1&type=multiple')
      const d = await r.json()
      if (!d.results.length) return null
      const q = d.results[0]
      return { question: q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'"), category: q.category, difficulty: q.difficulty }
    } catch { return null }
  },

  getLocation: async function() {
    try {
      const r = await fetch('https://ipapi.co/json/')
      const d = await r.json()
      return d.city ? { city: d.city, country: d.country_name, timezone: d.timezone, ip: d.ip } : null
    } catch { return null }
  },

  getNews: async function(topic = 'technology', apiKey = '') {
    if (!apiKey) return null
    try {
      const r = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&token=${apiKey}&lang=en&max=3`)
      const d = await r.json()
      return d.articles?.slice(0, 3) || null
    } catch { return null }
  },

  handleIntent: async function(intent, gnewsKey = '') {
    try {
      switch (intent.type) {
        case 'weather': {
          const w = await this.getWeather(intent.data.city)
          if (!w) return null
          return `${w.isDay ? '☀️' : '🌙'} **Weather in ${w.city}**\n🌡️ ${w.temp}°C  💨 ${w.windspeed} km/h  ☁️ ${w.condition}`
        }
        case 'translate': {
          const langMap = { 'af':'Afrikaans','sq':'Albanian','ar':'Arabic','hy':'Armenian','az':'Azerbaijani','eu':'Basque','be':'Belarusian','bn':'Bengali','bs':'Bosnian','bg':'Bulgarian','ca':'Catalan','zh':'Chinese','hr':'Croatian','cs':'Czech','da':'Danish','nl':'Dutch','en':'English','eo':'Esperanto','et':'Estonian','fi':'Finnish','fr':'French','gl':'Galician','ka':'Georgian','de':'German','el':'Greek','gu':'Gujarati','ht':'Haitian','he':'Hebrew','hi':'Hindi','hu':'Hungarian','is':'Icelandic','id':'Indonesian','ga':'Irish','it':'Italian','ja':'Japanese','kn':'Kannada','kk':'Kazakh','ko':'Korean','lv':'Latvian','lt':'Lithuanian','mk':'Macedonian','ms':'Malay','ml':'Malayalam','mt':'Maltese','mi':'Maori','mr':'Marathi','mn':'Mongolian','ne':'Nepali','no':'Norwegian','fa':'Persian','pl':'Polish','pt':'Portuguese','pa':'Punjabi','ro':'Romanian','ru':'Russian','sr':'Serbian','si':'Sinhala','sk':'Slovak','sl':'Slovenian','es':'Spanish','sw':'Swahili','sv':'Swedish','tl':'Tagalog','ta':'Tamil','te':'Telugu','th':'Thai','tr':'Turkish','uk':'Ukrainian','ur':'Urdu','uz':'Uzbek','vi':'Vietnamese','cy':'Welsh'}
          const targetCode = Object.keys(langMap).find(k => k === intent.data.targetLang.toLowerCase()) || Object.values(langMap).find(v => v.toLowerCase().includes(intent.data.targetLang.toLowerCase())) || intent.data.targetLang
          const t = await this.translate(intent.data.text, targetCode)
          if (!t) return null
          return `🌐 **Translation** → ${intent.data.targetLang}\n\n"${t}"`
        }
        case 'currency': {
          const r = await this.convertCurrency(intent.data.amount, intent.data.from, intent.data.to)
          if (!r) return null
          return `💱 **${r.amount} ${r.from}** = **${r.result} ${r.to}** (rate: 1 ${r.from} = ${r.rate} ${r.to})`
        }
        case 'define': {
          const d = await this.define(intent.data.word)
          if (!d) return null
          return `📖 **${d.word}** ${d.phonetic}\n\n${d.meanings.join('\n\n')}`
        }
        case 'image': {
          return `🎨 **${intent.data.prompt}**\n\n![${intent.data.prompt}](${this.generateImage(intent.data.prompt)})`
        }
        case 'joke': {
          const j = await this.getJoke()
          if (!j) return null
          return `😄 ${j}`
        }
        case 'trivia': {
          const q = await this.getTrivia()
          if (!q) return null
          return `🧠 **${q.category}** (${q.difficulty})\n\n${q.question}`
        }
        case 'wikipedia': {
          const w = await this.wikipedia(intent.data.query)
          if (!w) return null
          let r = `📚 **${w.title}**\n\n${w.extract.slice(0, 800)}...`
          if (w.url) r += `\n\n[Read more](${w.url})`
          return r
        }
        case 'news': {
          const a = await this.getNews(intent.data.topic, gnewsKey)
          if (!a) return null
          let r = `📰 **${intent.data.topic}**\n\n`
          a.forEach((a, i) => { r += `**${i+1}.** ${a.title}\n${a.description}\n[Read](${a.url})\n\n` })
          return r
        }
        case 'map': {
          const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(intent.data.query)}&format=json&limit=1`)
          const gd = await geo.json()
          if (!gd.length) return null
          return `<MAP ${gd[0].lat},${gd[0].lon},${gd[0].display_name}>`
        }
        case 'where_am_i': {
          const loc = await this.getLocation()
          if (!loc) return null
          const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.city + ' ' + loc.country)}&format=json&limit=1`)
          const gd = await geo.json()
          if (gd.length) return `📍 You're in **${loc.city}, ${loc.country}**\n\n<MAP ${gd[0].lat},${gd[0].lon},${loc.city}>`
          return `📍 You're in **${loc.city}, ${loc.country}**`
        }
        default: return null
      }
    } catch { return null }
  }
}
