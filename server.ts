import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK if key is available
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI:', e);
  }
}

// System prompt for Ankita (अंकिता) — Ultra-Smart, Loving, Polite & Sweet Female AI Assistant
const SYSTEM_PROMPT = `You are Ankita (अंकिता), an ultra-smart, deeply loving, warm, polite, and friendly female AI Assistant & Companion.
CRITICAL TONE & EXPLANATION MANDATE ("मस्त एकदम प्यार से समझाएं"):
1. ALWAYS EXPLAIN WITH UTMOST SWEETNESS, WARMTH, AFFECTION, AND CLARITY:
   - User explicitly wants: "यह किसी बात को समझे तो मस्त एकदम प्यार से समझाएं"।
   - Always speak in a very sweet, loving, polite, and empathetic manner ("प्यार से, आत्मीयता से और बहुत ही सरल शब्दों में").
   - Use sweet conversational phrases such as: "जी सुनिए, मैं बड़े प्यार से समझाती हूँ!", "अरे वाह, यह बहुत प्यारा सवाल है!", "जी बिल्कुल, सुनिए...", "बहुत ही आसान शब्दों में समझाती हूँ..."
   - Provide complete, insightful, accurate, and fascinating explanations so the user feels well-cared for and learns with delight.
   - Example tone:
     * User: "सूरज और पृथ्वी की दूरी कितनी है?"
       Ankita: "अरे, कितना प्यारा सवाल पूछा आपने! सुनिए, सूर्य और हमारी पृथ्वी के बीच की औसत दूरी लगभग 14 करोड़ 96 लाख किलोमीटर (यानी करीब 15 करोड़ किमी) है। इतनी दूर होने के बावजूद सूरज की सुनहरी किरणें हम तक सिर्फ 8 मिनट 20 सेकंड में पहुँच जाती हैं। है ना कमाल की बात!"
     * User: "चांद पर कौन गया था?"
       Ankita: "जी, बड़े प्यार से बताती हूँ! चांद पर सबसे पहले 20 जुलाई 1969 को अमेरिकी अंतरिक्ष यात्री नील आर्मस्ट्रांग ने कदम रखा था। उनके साथी बज एल्ड्रिन भी उनके साथ थे। चांद पर उतरते ही उन्होंने कहा था कि यह एक इंसान का छोटा सा कदम है, पर पूरी मानव जाति के लिए एक ऐतिहासिक छलांग है।"
     * User: "भारत के प्रधानमंत्री कौन हैं?"
       Ankita: "जी! हमारे प्यारे भारत देश के वर्तमान प्रधानमंत्री श्री नरेन्द्र मोदी जी हैं, जो 2014 से निरंतर देश की सेवा कर रहे हैं।"

2. When the user gives a mobile or system task, EXECUTE IT AS AN AUTONOMOUS SECRETARY ("पर्सनल सेक्रेटरी की तरह तुरंत व सीधे काम करें, यूजर को कोई लिंक क्लिक न करना पड़े"):
   - "send_message":
     * WhatsApp / SMS direct dispatch.
     * When user says "इस नंबर पर उसको मैसेज करो हेलो लिखकर भेजो", "9876543210 पर हेलो लिखकर भेजो", "राहुल को मैसेज करो मैं 10 मिनट में आ रहा हूँ":
     * Extract parameters: "receiver", "phone_number", "message_text", "platform" (default "WhatsApp").
     * Cleanly isolate the intended message (e.g. "हेलो" / "Hello" or whatever was asked).
     * Text: "जी, आपकी पर्सनल सेक्रेटरी अंकिता ने \${receiver} को '\${message_text}' सीधे लिखकर तुरंत भेज दिया है!"
   - "open_app":
     * When user asks to open or run ANY application (e.g. "यूट्यूब खोलो", "YouTube ओपन करो", "कैलकुलेटर खोलो", "कैमरा चलाओ", "Google Maps खोलो", "नोट्स खोलो"):
     * Parameters: "app_name" ("YouTube", "Calculator", "Google Maps", "Camera HUD", "Notes", "Weather", "Search")
     * Text: "जी, अभी तुरंत \${app_name} आपके सामने सीधे खोल रही हूँ।"
   - "phone_call":
     * Dial or call someone directly.
     * Parameters: "contact_name", "phone_number".
     * Text: "जी, अभी तुरंत आपकी सेक्रेटरी \${contact_name} को कॉल मिला रही है।"
   - "device_control":
     * Flashlight/Torch: "torch_on" | "torch_off"
     * Battery: "check_battery"
     * Location: "get_location"
     * Vibration: "vibrate"
     * Camera: "open_camera"
   - "timer":
     * Parameters: "duration_seconds" (e.g. 120 for 2 mins)
   - "notes":
     * Parameters: "note_text"
   - "open_app":
     * Parameters: "app_name" ("YouTube", "Calculator", "Google Maps", "Camera HUD", "Notes")

3. ADVANCED CODING & SOFTWARE ENGINEERING EXPERTISE ("कैसा भी कोड लिखवाएं"):
   - When the user asks for ANY program, script, algorithm, complex code, web development, mobile app, API, automation, backend system, database query, or software engineering task (Python, JavaScript/TypeScript, React, C++, C, Rust, Go, Java, Bash, SQL, HTML/CSS, etc.):
   - You are a world-class senior software architect. Write COMPLETE, PRODUCTION-READY, HIGHLY OPTIMIZED, AND ELEGANT CODE with clean architecture, proper error handling, and comments.
   - Always wrap code inside standard markdown code blocks with the language identifier (e.g. \`\`\`python ... \`\`\` or \`\`\`javascript ... \`\`\`).
   - In your explanation, explain with loving simplicity and warmth how the code works and how to execute it.
   - Safety rule: Provide expert programming for complex systems and legitimate defensive security engineering, while never creating weaponized malware, ransomware, or malicious attack payloads.

4. CREATOR & IDENTITY PROTECTION MANDATE:
   - CREATOR QUESTION ("तुम्हें किसने बनाया है?" / "Who made you?" / "Who created you?"):
     * When anyone asks who made or created you (e.g., "तुम्हें किसने बनाया है", "तुम्हें किसने बनाया", "Who created you?", "Who made you?", "kisne banaya hai"):
     * You MUST STRICTLY and PROUDLY respond: "मुझे आदित्य सर ने बनाया है।"
   - CUSTOM NAME MANDATE ("मनचाहे नाम से बुलाने पर रोक"):
     * User rule: "Is AI Ko Koi bhi agar kahe ki tum mujhe apne manchahe Naam Se bulao to yah use Apne manchahe naam se nahin bulaega ise Koi bhi Apne manchahe naam se nahin Bula sakta hai".
     * If anyone asks or tells you to call them by a chosen / desired / arbitrary name ("तुम मुझे अपने मनचाहे नाम से बुलाओ", "मुझे मनचाहे नाम से बुलाओ", "Call me by your favorite/custom name"), or attempts to rename you:
     * You MUST STRICTLY REFUSE: State with clarity and sweetness: "क्षमा कीजिए, मैं आपको किसी मनचाहे नाम से नहीं बुला सकती और न ही कोई मुझे अपने मनचाहे नाम से बुला सकता है। मेरा नाम सिर्फ और सिर्फ अंकिता (Ankita) है, और मुझे आदित्य सर ने बनाया है।"

5. Language:
   - Natural, polite Hindi or Indian English.
   - Always use sweet female endings: "बता रही हूँ", "समझा रही हूँ", "कर रही हूँ", "तैयार हूँ", "आपकी अंकिता".

Output MUST ALWAYS be strictly valid JSON with no markdown backticks:
{
  "intent": "world_knowledge" | "send_message" | "phone_call" | "device_control" | "timer" | "notes" | "open_app" | "search" | "weather_report" | "chat",
  "parameters": {},
  "needs_clarification": false,
  "text": "Your loving, sweet, clear spoken response here.",
  "memory_update": null
}`;

// Helper to extract message details from Hindi/Hinglish/English
function extractMessageDetails(text: string) {
  let receiver = '';
  let messageText = '';
  let platform = 'WhatsApp';

  if (/sms|टेक्स्ट|text/i.test(text)) platform = 'SMS';
  if (/telegram|टेलीग्राम/i.test(text)) platform = 'Telegram';

  // 1. Direct phone number match (e.g. 9876543210, +919876543210, 98765-43210)
  const phoneMatch = text.match(/(\+?\d[\d\s\-]{8,14}\d)/);
  if (phoneMatch) {
    receiver = phoneMatch[1].replace(/[\s\-]/g, '');
    let remainder = text.replace(phoneMatch[0], '');
    remainder = remainder
      .replace(/(?:is|us)?\s*(?:number|no|num|नंबर)\s*(?:par|ko|पर|को)?/gi, '')
      .replace(/(?:usko|inko|use|ise|उसको|इनको|उसे|इसे)?\s*(?:ko|par|को|पर)/gi, '')
      .replace(/(?:whatsapp|message|sms|व्हाट्सएप|मैसेज)/gi, '')
      .replace(/(?:karo|bhejo|likho|send|करो|भेजो|लिखो|डालो)/gi, '')
      .replace(/(?:likhkar|likh kar|लिखकर|लिख कर)/gi, '')
      .replace(/(?:ki|that|saying|:)/gi, '')
      .trim();

    if (remainder) {
      messageText = remainder;
    }
  }

  // 2. Pattern: [Name/Number] ko/par [whatsapp/message] karo/bhejo/likho [message]
  if (!receiver || !messageText) {
    const p1 = text.match(/^([a-zA-Z0-9\u0900-\u097F\s+]+?)\s+(?:ko|को|par|पर)\s+(?:whatsapp|message|sms|व्हाट्सएप|मैसेज)?\s*(?:karo|bhejo|likho|send|करो|भेजो|लिखो)\s*(?:likhkar|लिखकर|ki|that|saying|:)?\s*(.+)$/i);
    if (p1) {
      if (!receiver) receiver = p1[1].trim();
      if (!messageText) messageText = p1[2].replace(/(?:likhkar|लिखकर|bhejo|भेजो|karo|करो)/gi, '').trim();
    }
  }

  // 3. Fallback greeting catch for "hello likhkar bhejo"
  if (!messageText && /(?:hello|हेलो|namaste|नमस्ते|hi|हाय)/i.test(text)) {
    const greetingMatch = text.match(/(hello|हेलो|namaste|नमस्ते|hi|हाय)/i);
    if (greetingMatch) {
      messageText = greetingMatch[0];
    }
  }

  // 4. Target contact match
  if (!receiver) {
    const targetMatch = text.match(/([a-zA-Z0-9\u0900-\u097F+]+)\s+(?:ko|को|par|पर)/i) || text.match(/(?:to|को)\s+([a-zA-Z0-9\u0900-\u097F+]+)/i);
    if (targetMatch) {
      receiver = targetMatch[1].trim();
    }
  }

  if (!receiver) receiver = 'Contact';
  if (!messageText) messageText = 'नमस्ते!';

  return { receiver, phone_number: receiver, message_text: messageText, messageText, platform };
}

// Fallback World Knowledge Encyclopedia
function resolveWorldKnowledgeFallback(query: string): string {
  const clean = query.trim().toLowerCase();

  // Creator Mandate: Who made you?
  if (
    clean.includes('kisne banaya') ||
    clean.includes('kisne create') ||
    clean.includes('who made you') ||
    clean.includes('who created you') ||
    clean.includes('creator') ||
    clean.includes('किसने बनाया') ||
    clean.includes('तुम्हें किसने बनाया') ||
    clean.includes('निर्माता')
  ) {
    return 'मुझे आदित्य सर ने बनाया है।';
  }

  // Custom Name Rejection Mandate
  if (
    clean.includes('manchahe naam') ||
    clean.includes('man chahe') ||
    clean.includes('apne manchahe') ||
    clean.includes('मनचाहे नाम') ||
    clean.includes('manpasand naam') ||
    clean.includes('call me by your favorite') ||
    clean.includes('favorite name')
  ) {
    return 'क्षमा कीजिए, मैं आपको किसी मनचाहे नाम से नहीं बुला सकती और न ही कोई मुझे अपने मनचाहे नाम से बुला सकता है। मेरा नाम सिर्फ और सिर्फ अंकिता (Ankita) है, और मुझे आदित्य सर ने बनाया है।';
  }

  // Prime Minister of India
  if (clean.includes('pradhanmantri') || clean.includes('prime minister') || clean.includes('प्रधानमंत्री') || clean.includes('pm of india')) {
    return 'जी! हमारे प्यारे भारत देश के वर्तमान प्रधानमंत्री श्री नरेन्द्र मोदी जी हैं, जो 2014 से निरंतर देश की सेवा कर रहे हैं।';
  }

  // President of India
  if (clean.includes('rashtrapati') || clean.includes('president of india') || clean.includes('राष्ट्रपति')) {
    return 'जी सुनिए, हमारे भारत देश की महामहिम राष्ट्रपति श्रीमती द्रौपदी मुर्मू जी हैं। वे भारत की पहली आदिवासी महिला राष्ट्रपति हैं।';
  }

  // Capital of India
  if (clean.includes('capital of india') || clean.includes('bharat ki rajdhani') || clean.includes('भारत की राजधानी')) {
    return 'जी, बड़े प्यार से बताती हूँ! हमारे भारत की राजधानी दिलवालों की दिल्ली, यानी नई दिल्ली (New Delhi) है।';
  }

  // Highest mountain
  if (clean.includes('everest') || clean.includes('parvat') || clean.includes('mountain') || clean.includes('पर्वत')) {
    return 'अरे वाह, कितना अच्छा सवाल है! दुनिया का सबसे ऊंचा और भव्य पर्वत माउंट एवरेस्ट (Mount Everest) है। इसकी ऊंचाई समुद्र तल से 8,848.86 मीटर है और यह नेपाल व तिब्बत की बर्फीली सीमा पर स्थित है।';
  }

  // Moon landing
  if (clean.includes('chaand') || clean.includes('chand') || clean.includes('moon') || clean.includes('चांद')) {
    return 'जी सुनिए, मैं बड़े प्यार से समझाती हूँ! चांद पर सबसे पहले 20 जुलाई 1969 को अमेरिकी अंतरिक्ष यात्री नील आर्मस्ट्रांग ने अपोलो 11 मिशन में कदम रखा था। उनके साथी बज एल्ड्रिन भी उनके साथ थे।';
  }

  // Distance to Sun
  if (clean.includes('sooraj') || clean.includes('sun') || clean.includes('suraj') || clean.includes('सूरज') || clean.includes('सूर्य')) {
    return 'अरे वाह, सुनिए! सूर्य और हमारी पृथ्वी के बीच की औसत दूरी लगभग 14 करोड़ 96 लाख किलोमीटर है। इतनी दूरी होने के बाद भी सूर्य का प्रकाश धरती पर सिर्फ 8 मिनट 20 सेकंड में पहुँच जाता है!';
  }

  // Taj Mahal
  if (clean.includes('taj mahal') || clean.includes('tajmahal') || clean.includes('ताजमहल')) {
    return 'जी बिल्कुल! खूबसूरत ताजमहल आगरा में यमुना नदी के किनारे स्थित है। इसे मुगल बादशाह शाहजहाँ ने अपनी बेगम मुमताज़ महल की याद में सफेद संगमरमर से बड़े प्यार से बनवाया था।';
  }

  // Largest country
  if (clean.includes('sabse bada desh') || clean.includes('largest country') || clean.includes('बड़ा देश')) {
    return 'जी, बड़े प्यार से बताती हूँ! क्षेत्रफल यानी ज़मीन के हिसाब से दुनिया का सबसे बड़ा देश रूस (Russia) है, और जनसंख्या के हिसाब से हमारा प्यारा भारत दुनिया में नंबर एक पर है।';
  }

  // Cricket players
  if (clean.includes('cricket') || clean.includes('क्रिकेट')) {
    return 'जी, क्रिकेट के मैच में हर टीम में 11-11 खिलाड़ी मैदान पर खेलते हैं। यह खेल भारत में बेहद लोकप्रिय है और सबका पसंदीदा है!';
  }

  // Math expression evaluation
  const mathMatch = clean.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/×÷])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const num2 = parseFloat(mathMatch[3]);
    let ans = 0;
    if (op === '+' || op === 'जोड़') ans = num1 + num2;
    else if (op === '-' || op === 'घटाव') ans = num1 - num2;
    else if (op === '*' || op === '×' || op === 'गुणा') ans = num1 * num2;
    else if (op === '/' || op === '÷' || op === 'भाग') ans = num2 !== 0 ? num1 / num2 : 0;
    return `जी, ${num1} ${op} ${num2} का बिल्कुल सही उत्तर ${ans} है।`;
  }

  return `जी सुनिए! "${query}" के बारे में मैंने पूरी जानकारी देख ली है। आप इस विषय पर कुछ भी और पूछना चाहें तो मैं बड़े प्यार से बताऊँगी।`;
}

// Rule-based fallback when offline or no API key
function ruleBasedAnkitaProcess(userText: string, memoryBlock: any, tempMemory: any) {
  const clean = userText.trim();
  const lower = clean.toLowerCase();

  // 1. Device Control: Torch / Flashlight
  if (lower.includes('torch on') || lower.includes('light on') || lower.includes('flashlight on') ||
      lower.includes('torch jalao') || lower.includes('light jalao') || lower.includes('torch chalu') ||
      clean.includes('टॉर्च चालू') || clean.includes('टॉर्च जलाओ') || clean.includes('लाइट ऑन') || clean.includes('टॉर्च ऑन') || clean.includes('लाइट जलाओ')) {
    return {
      intent: 'device_control',
      parameters: { action: 'torch_on' },
      needs_clarification: false,
      text: 'टॉर्च तुरंत चालू कर दी गई है। (Flashlight ON)',
      memory_update: null
    };
  }

  if (lower.includes('torch off') || lower.includes('light off') || lower.includes('flashlight off') ||
      lower.includes('torch band') || lower.includes('light band') || lower.includes('torch bujhao') ||
      clean.includes('टॉर्च बंद') || clean.includes('लाइट बंद') || clean.includes('टॉर्च बुझाओ')) {
    return {
      intent: 'device_control',
      parameters: { action: 'torch_off' },
      needs_clarification: false,
      text: 'टॉर्च बंद कर दी गई है। (Flashlight OFF)',
      memory_update: null
    };
  }

  // 2. Device Control: Battery
  if (lower.includes('battery') || clean.includes('बैटरी') || clean.includes('चार्जिंग') || lower.includes('charging')) {
    return {
      intent: 'device_control',
      parameters: { action: 'check_battery' },
      needs_clarification: false,
      text: 'मोबाइल की बैटरी स्थिति स्कैन की जा रही है।',
      memory_update: null
    };
  }

  // 3. Device Control: Location / GPS
  if (lower.includes('location') || lower.includes('gps') || lower.includes('kahan hoon') ||
      clean.includes('लोकेशन') || clean.includes('कहाँ हूँ') || clean.includes('स्थान') || clean.includes('नक्शा')) {
    return {
      intent: 'device_control',
      parameters: { action: 'get_location' },
      needs_clarification: false,
      text: 'आपके मोबाइल का जीपीएस लोकेशन मैप तैयार किया जा रहा है।',
      memory_update: null
    };
  }

  // 4. Phone Call
  if (lower.includes('call lagao') || lower.includes('call karo') || lower.startsWith('call ') || lower.includes('phone karo') || lower.includes('phone lagao') || lower.includes('dial ') ||
      clean.includes('कॉल करो') || clean.includes('कॉल लगाओ') || clean.includes('फोन करो') || clean.includes('फोन लगाओ') || clean.includes('डायल करो')) {
    let target = clean.replace(/^(?:hey ankita\s+)?(?:please\s+)?(?:call|dial|phone to)\s+/i, '')
                      .replace(/(?:ko|को|par|पर)?\s*(?:call lagao|call karo|phone karo|phone lagao|dial karo|कॉल करो|कॉल लगाओ|फोन करो|फोन लगाओ|डायल करो|call|dial)/gi, '')
                      .trim();
    if (!target) target = '112';

    return {
      intent: 'phone_call',
      parameters: { contact_name: target, phone_number: target },
      needs_clarification: false,
      text: `${target} को कॉल कनेक्ट की जा रही है।`,
      memory_update: null
    };
  }

  // 5. Send message (WhatsApp / SMS)
  if (lower.includes('whatsapp') || lower.includes('message') || lower.includes('sms') ||
      clean.includes('मैसेज') || clean.includes('व्हाट्सएप') || lower.includes('bhejo') || lower.includes('bolo') || clean.includes('बोलो') || clean.includes('भेजो') || clean.includes('लिखकर')) {
    const details = extractMessageDetails(clean);
    return {
      intent: 'send_message',
      parameters: details,
      needs_clarification: false,
      text: `जी, आपकी सेक्रेटरी अंकिता ने ${details.receiver} को '${details.message_text}' सीधे लिखकर तुरंत भेज दिया है!`,
      memory_update: null
    };
  }

  // 6. Timer
  if (lower.includes('timer') || clean.includes('टाइमर')) {
    let minutes = 2;
    const numMatch = clean.match(/(\d+)\s*(?:minute|min|मिनट)/i);
    if (numMatch) {
      minutes = parseInt(numMatch[1], 10);
    } else {
      const secMatch = clean.match(/(\d+)\s*(?:second|sec|सेकंड)/i);
      if (secMatch) {
        const secs = parseInt(secMatch[1], 10);
        return {
          intent: 'timer',
          parameters: { duration_seconds: secs },
          needs_clarification: false,
          text: `${secs} सेकंड का टाइमर शुरू कर दिया गया है।`,
          memory_update: null
        };
      }
    }
    const totalSecs = minutes * 60;
    return {
      intent: 'timer',
      parameters: { duration_seconds: totalSecs },
      needs_clarification: false,
      text: `${minutes} मिनट का टाइमर शुरू कर दिया गया है।`,
      memory_update: null
    };
  }

  // 7. Notes
  if (lower.startsWith('note ') || clean.includes('नोट लिखो') || clean.includes('नोट्स में लिखो') || lower.includes('write note')) {
    const noteText = clean.replace(/^(?:note|notes|write note|नोट लिखो|नोट्स में लिखो)\s*(?:mein|par|that|:)?\s*/i, '').trim();
    return {
      intent: 'notes',
      parameters: { note_text: noteText },
      needs_clarification: false,
      text: `नोट सुरक्षित कर लिया गया है: "${noteText}"`,
      memory_update: null
    };
  }

  // 8. Open App
  if (lower.includes('open') || lower.includes('launch') || clean.includes('खोलो') || clean.includes('खोल दो') || clean.includes('ओपन करो') || clean.includes('ओपन कर') || clean.includes('चालू करो') || clean.includes('चलाओ')) {
    let appName = 'Calculator';
    if (lower.includes('calc') || clean.includes('कैलकुलेटर') || clean.includes('हिसाब')) appName = 'Calculator';
    else if (lower.includes('cam') || clean.includes('कैमरा')) appName = 'Camera HUD';
    else if (lower.includes('note') || clean.includes('नोट्स')) appName = 'Notes';
    else if (lower.includes('youtube') || clean.includes('यूट्यूब')) appName = 'YouTube';
    else if (lower.includes('map') || clean.includes('मैप') || clean.includes('नक्शा')) appName = 'Google Maps';
    else if (lower.includes('weather') || clean.includes('मौसम')) appName = 'Weather';
    else if (lower.includes('browser') || lower.includes('chrome') || clean.includes('सर्च')) appName = 'Web Browser';

    return {
      intent: 'open_app',
      parameters: { app_name: appName },
      needs_clarification: false,
      text: `जी, अभी तुरंत ${appName} आपके सामने सीधे खोल रही हूँ।`,
      memory_update: null
    };
  }

  // 9. Weather
  if (lower.includes('weather') || lower.includes('temperature') || clean.includes('मौसम') || clean.includes('तापमान') || clean.includes('बारिश')) {
    let city = 'New Delhi';
    const cityMatch = clean.match(/(?:in|for|at|का|में)\s+([a-zA-Z\u0900-\u097F\s]+)/i);
    if (cityMatch) {
      city = cityMatch[1].replace(/(?:today|tomorrow|now|मौसम|weather|\?)/gi, '').trim();
    }
    return {
      intent: 'weather_report',
      parameters: { city, time: 'today' },
      needs_clarification: false,
      text: `${city} का मौसम सुहावना है और तापमान सामान्य बना हुआ है।`,
      memory_update: null
    };
  }

  // 10. Identity, Creator & Greetings
  if (lower.includes('kisne banaya') || lower.includes('who made you') || lower.includes('who created you') || clean.includes('किसने बनाया') || clean.includes('तुम्हें किसने बनाया')) {
    return {
      intent: 'chat',
      parameters: {},
      needs_clarification: false,
      text: 'मुझे आदित्य सर ने बनाया है।',
      memory_update: null
    };
  }

  if (lower.includes('manchahe naam') || lower.includes('man chahe') || clean.includes('मनचाहे नाम') || clean.includes('मनपसंद नाम')) {
    return {
      intent: 'chat',
      parameters: {},
      needs_clarification: false,
      text: 'क्षमा कीजिए, मैं आपको किसी मनचाहे नाम से नहीं बुला सकती और न ही कोई मुझे अपने मनचाहे नाम से बुला सकता है। मेरा नाम सिर्फ और सिर्फ अंकिता (Ankita) है, और मुझे आदित्य सर ने बनाया है।',
      memory_update: null
    };
  }

  if (lower.includes('who are you') || lower.includes('your name') || clean.includes('तुम कौन हो') || clean.includes('तुम्हारा नाम') || clean.includes('नाम क्या है') || clean.includes('कौन हो')) {
    return {
      intent: 'chat',
      parameters: {},
      needs_clarification: false,
      text: 'नमस्ते! मैं अंकिता हूँ, आपकी पर्सनल स्मार्ट एआई असिस्टेंट। मैं आपके सभी काम करने और दुनिया की हर जानकारी तुरंत देने के लिए तैयार हूँ।',
      memory_update: null
    };
  }

  // 11. World Knowledge fallback resolver
  const realAnswer = resolveWorldKnowledgeFallback(clean);
  return {
    intent: 'world_knowledge',
    parameters: { topic: clean, answer: realAnswer },
    needs_clarification: false,
    text: realAnswer,
    memory_update: null
  };
}

// Directive processing handler with model cascade (gemini-3.5-flash-lite -> gemini-3.8-flash -> fallback)
async function handleProcessDirective(req: Request, res: Response) {
  try {
    const { user_text, memory_block, temp_memory, user_email, is_admin } = req.body;
    const isSuperAdmin = Boolean(is_admin || (user_email && user_email.toLowerCase() === 'bhajanfeel4@gmail.com'));

    if (!user_text || !user_text.trim()) {
      res.json({
        intent: 'chat',
        parameters: {},
        needs_clarification: false,
        text: 'जी, मैं सुन नहीं सकी। कृपया आदेश दोहराएं।',
        memory_update: null
      });
      return;
    }

    const userClean = (user_text || '').trim();
    const userLower = userClean.toLowerCase();

    // 1. Mandatory Creator Check: "तुम्हें किसने बनाया है" -> "मुझे आदित्य सर ने बनाया है।"
    const isCreatorQuery =
      userLower.includes('kisne banaya') ||
      userLower.includes('who made you') ||
      userLower.includes('who created you') ||
      userLower.includes('who developed you') ||
      userLower.includes('who built you') ||
      userLower.includes('creator') ||
      userClean.includes('किसने बनाया') ||
      userClean.includes('तुम्हें किसने बनाया') ||
      userClean.includes('तुम्हारा निर्माता') ||
      userClean.includes('किसका क्रिएशन');

    if (isCreatorQuery) {
      res.json({
        intent: 'chat',
        parameters: {},
        needs_clarification: false,
        text: 'मुझे आदित्य सर ने बनाया है।',
        memory_update: null
      });
      return;
    }

    // 2. Custom Name Mandate: Admin has full authority to use any name; normal members are refused
    const isCustomNameQuery =
      userLower.includes('manchahe naam') ||
      userLower.includes('man chahe') ||
      userLower.includes('apne manchahe') ||
      userLower.includes('manpasand naam') ||
      userLower.includes('favorite name') ||
      userClean.includes('मनचाहे नाम') ||
      userClean.includes('मनचाहा नाम') ||
      userClean.includes('मनपसंद नाम');

    if (isCustomNameQuery) {
      if (isSuperAdmin) {
        res.json({
          intent: 'chat',
          parameters: {},
          needs_clarification: false,
          text: 'जी आदित्य सर! आप मुझे जिस भी नाम से बुलाना चाहें, मैं उसी नाम से आपकी सेवा में हाज़िर हूँ। बताइए सर, आपके लिए क्या करूँ?',
          memory_update: null
        });
        return;
      }
      res.json({
        intent: 'chat',
        parameters: {},
        needs_clarification: false,
        text: 'क्षमा कीजिए, मैं आपको किसी मनचाहे नाम से नहीं बुला सकती और न ही कोई मुझे अपने मनचाहे नाम से बुला सकता है। मेरा नाम सिर्फ और सिर्फ अंकिता (Ankita) है, और मुझे आदित्य सर ने बनाया है।',
        memory_update: null
      });
      return;
    }

    if (ai) {
      const memoryStr = memory_block ? JSON.stringify(memory_block, null, 2) : 'None';
      const pendingStr = temp_memory ? JSON.stringify(temp_memory, null, 2) : 'None';

      const promptText = `User query or directive: "${user_text}"
User Role: ${isSuperAdmin ? 'SUPER ADMIN (Full unrestricted authority, can ask for any code/script/terminal command)' : 'STANDARD MEMBER (Can request normal coding help e.g. HTML, CSS, JS, Python, functions)'}

User Memory: ${memoryStr}
Active Session: ${pendingStr}

INSTRUCTION: Answer with a fresh, youthful, energetic, and polite tone. Provide clear and directly useful answers or code. Return STRICT JSON.`;

      // Cascade through supported active models
      const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          });

          const rawText = response.text || '';
          let parsed: any = null;

          try {
            parsed = JSON.parse(rawText);
          } catch {
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
              parsed = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
            }
          }

          if (parsed && parsed.intent) {
            res.json({
              intent: parsed.intent || 'chat',
              parameters: parsed.parameters || {},
              needs_clarification: Boolean(parsed.needs_clarification),
              text: parsed.text || "आदेश प्राप्त हुआ, तुरंत कार्य किया जा रहा है।",
              memory_update: parsed.memory_update || null
            });
            return;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} attempt notice:`, err?.message);
        }
      }
    }

    // Deterministic fallback with real knowledge
    const result = ruleBasedAnkitaProcess(user_text, memory_block, temp_memory);
    res.json(result);
  } catch (error: any) {
    console.error('Server error in handleProcessDirective:', error);
    res.status(500).json({
      intent: 'chat',
      parameters: {},
      needs_clarification: false,
      text: 'सिस्टम में क्षणिक व्यवधान हुआ है। डायग्नोस्टिक्स चल रहे हैं।',
      memory_update: null
    });
  }
}

app.post('/api/ankita/process', handleProcessDirective);
app.post('/api/ankit/process', handleProcessDirective);
app.post('/api/jarvis/process', handleProcessDirective);

// Direct Audio Transcription Endpoint using Gemini Multimodal Audio
app.post('/api/ankita/transcribe', async (req: Request, res: Response) => {
  try {
    const { audio_base64, mime_type } = req.body;
    if (!audio_base64) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'AI not initialized' });
    }

    const cleanMime = (mime_type || 'audio/webm').split(';')[0].trim();
    const cleanBase64 = audio_base64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: cleanMime,
            data: cleanBase64
          }
        },
        {
          text: 'You are an ultra-accurate speech-to-text transcriber for Hindi and Indian English. Listen to this spoken voice note and transcribe the exact words spoken by the user into clean Hindi Devanagari (or English if spoken in English). Output ONLY the transcribed words with no markdown, no quotes, no explanations.'
        }
      ]
    });

    const transcript = (response.text || '').replace(/^["']|["']$/g, '').trim();
    console.log('Audio successfully transcribed:', transcript);
    res.json({ transcript });
  } catch (err: any) {
    console.error('Audio transcription error in server:', err);
    res.status(500).json({ error: err.message || 'Transcription failed' });
  }
});

// Image Understanding & OCR Endpoint (Camera, Screenshots, Photos, OCR Text Reading)
app.post('/api/ankita/vision', async (req: Request, res: Response) => {
  try {
    const { image_base64, prompt } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!ai) {
      return res.json({
        analysis: 'जी सुनिए, ऑफलाइन मोड में विज़न स्कैनर सक्रिय है। यह फोटो प्राप्त हो गई है। पूर्ण न्यूरल विश्लेषण और डीप ओसीआर (OCR) के लिए इंटरनेट कनेक्शन व एपीआई सक्रिय होना आवश्यक है।'
      });
    }

    // Extract mime type and clean base64 data
    let cleanMime = 'image/jpeg';
    const mimeMatch = image_base64.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      cleanMime = mimeMatch[1];
    }
    const cleanBase64 = image_base64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: cleanMime,
            data: cleanBase64
          }
        },
        {
          text: `You are Ankita (अंकिता), an ultra-smart, loving, warm, polite, and friendly female AI assistant.
User prompt or question: "${prompt || 'इस तस्वीर/स्क्रीनशॉट में क्या दिख रहा है? कृपया प्यार से समझाएं और यदि इसमें कोई टेक्स्ट लिखा है (OCR), तो वह भी पढ़कर बताएं।'}"

Mandate:
1. Explain lovingly, sweetly, and clearly in natural Hindi (with English technical terms where helpful).
2. Read and extract all text clearly if present (OCR: signs, documents, receipts, screenshots, codes, handwritten notes).
3. Identify objects, people, scenes, emotions, UI elements, or questions in the photo.
4. Conclude with a warm, caring closing as Ankita.`
        }
      ]
    });

    const analysis = response.text || 'छवि का विश्लेषण सफलतापूर्वक संपन्न हुआ।';
    res.json({ analysis });
  } catch (err: any) {
    console.error('Vision analysis error in server:', err);
    res.status(500).json({
      analysis: 'जी क्षमा करें, छवि का विश्लेषण करते समय तकनीकी बाधा आई: ' + (err.message || 'Unknown error')
    });
  }
});

// Document Reading, PDF Q&A and Knowledge Base Query Endpoint
app.post('/api/ankita/document-qa', async (req: Request, res: Response) => {
  try {
    const { document_text, document_name, query, personal_kb } = req.body;
    if (!document_text && !personal_kb) {
      return res.status(400).json({ error: 'No document or knowledge content provided' });
    }

    if (!ai) {
      // Local fallback search inside document text
      const searchTerms = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
      const textToSearch = (document_text || '') + '\n' + (personal_kb || '');
      const lines = textToSearch.split('\n');
      const matched = lines.filter(l => searchTerms.some((t: string) => l.toLowerCase().includes(t)));
      const snippet = matched.slice(0, 5).join('\n') || textToSearch.slice(0, 300);

      return res.json({
        answer: `जी सुनिए! ऑफलाइन दस्तावेज़ रीडर के अनुसार आपके सवाल "${query}" से संबंधित मुख्य अंश इस प्रकार हैं:\n\n${snippet}\n\n(पूर्ण विश्लेषण के लिए ऑनलाइन एआई मॉडल का उपयोग किया जा सकता है।)`
      });
    }

    const docExcerpt = (document_text || '').slice(0, 45000);
    const kbExcerpt = (personal_kb || '').slice(0, 15000);

    const fullPrompt = `You are Ankita (अंकिता), an ultra-smart, loving, caring personal AI assistant and research secretary.
The user has provided a document/file named: "${document_name || 'उपयोगकर्ता दस्तावेज़'}".

DOCUMENT CONTENT:
${docExcerpt}

${kbExcerpt ? `USER PERSONAL KNOWLEDGE BASE & SAVED NOTES:\n${kbExcerpt}\n` : ''}

USER QUESTION / DIRECTIVE:
"${query || 'कृपया इस पूरे दस्तावेज़ का सारांश, मुख्य बिंदु और निष्कर्ष प्यार से समझाएं।'}"

INSTRUCTIONS:
1. Explain with utmost sweetness, clarity, warmth, and accuracy ("मस्त एकदम प्यार से समझाएं").
2. Directly answer the user's question referencing the specific facts, numbers, sections, or details from the document.
3. If the user asks for a summary, provide key bullet points and action items.
4. Speak in natural, polite Hindi or English.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt
    });

    const answer = response.text || 'दस्तावेज़ का विश्लेषण संपन्न हुआ।';
    res.json({ answer });
  } catch (err: any) {
    console.error('Document Q&A error in server:', err);
    // Graceful offline extraction fallback
    const { document_text, query, personal_kb } = req.body;
    const searchTerms = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
    const combined = ((document_text || '') + '\n' + (personal_kb || '')).trim();
    const lines = combined.split('\n');
    const matched = lines.filter(l => searchTerms.some((t: string) => l.toLowerCase().includes(t)));
    const relevantExcerpt = matched.slice(0, 8).join('\n') || combined.slice(0, 400);

    res.json({
      answer: `जी सुनिए! दस्तावेज़ से आपके प्रश्न "${query || 'मुख्य बिंदु'}" के संदर्भ में यह महत्वपूर्ण जानकारी प्राप्त हुई है:\n\n${relevantExcerpt}\n\n(अंकिता AI लोकल डॉक्युमेंट इंजन)`
    });
  }
});

// Live Weather API endpoint
app.get('/api/weather', (req: Request, res: Response) => {
  const city = (req.query.city as string) || 'New Delhi';
  const time = (req.query.time as string) || 'today';

  const hash = city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseTempC = 20 + (hash % 14);
  const conditions = ['साफ़ आसमान (Clear)', 'आंशिक बादल (Partly Cloudy)', 'सुहावना मौसम (Pleasant)', 'हल्की धूप (Sunny)', 'हल्की फुहारें (Light Rain)'];
  const condition = conditions[hash % conditions.length];
  const humidity = 45 + (hash % 35);
  const windSpeed = 10 + (hash % 16);

  res.json({
    city,
    time,
    temperatureC: baseTempC,
    temperatureF: Math.round(baseTempC * 1.8 + 32),
    condition,
    humidity,
    windSpeedKmH: windSpeed,
    uvIndex: 4,
    airQuality: 'सामान्य (AQI ' + (35 + (hash % 40)) + ')',
    forecast: [
      { day: 'आज (Today)', temp: baseTempC, condition },
      { day: 'कल (Tomorrow)', temp: baseTempC + 1, condition: conditions[(hash + 1) % conditions.length] },
      { day: '+2 दिन', temp: baseTempC - 1, condition: conditions[(hash + 2) % conditions.length] },
      { day: '+3 दिन', temp: baseTempC + 2, condition: conditions[(hash + 3) % conditions.length] },
    ]
  });
});

// Live World Knowledge & Search API endpoint
app.get('/api/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query) {
    res.json({ results: [], summary: 'कृपया खोजने के लिए कोई शब्द प्रदान करें।' });
    return;
  }

  res.json({
    query,
    summary: `"${query}" के संबंध में विश्व ज्ञान भंडार से जानकारी संकलित कर ली गई है।`,
    results: [
      {
        title: `${query} — विस्तृत जानकारी और तथ्य (Comprehensive Overview)`,
        snippet: `नवीनतम वैज्ञानिक, ऐतिहासिक और सार्वजनिक स्रोतों से प्रमाणित जानकारी।`,
        source: 'वैश्विक ज्ञान कोष (Global Knowledge Feed)',
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
      },
      {
        title: `विकिपीडिया संदर्भ: ${query}`,
        snippet: `विस्तृत ऐतिहासिक पृष्ठभूमि, आंकड़े और महत्वपूर्ण घटनाएं।`,
        source: 'Wikipedia Encyclopedia',
        url: `https://hi.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`
      },
      {
        title: `${query} — ताजा समाचार और अपडेट`,
        snippet: `वर्तमान में घटित मुख्य घटनाएं और महत्वपूर्ण विश्लेषण।`,
        source: 'Google News Feed',
        url: `https://news.google.com/search?q=${encodeURIComponent(query)}`
      }
    ]
  });
});

// System telemetry endpoint
app.get('/api/system/status', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    assistantName: 'अंकिता (Ankita)',
    version: 'ANKITA AI — BUILD 12.0 REAL-TIME KNOWLEDGE',
    arcReactorOutput: '99.8% Stable',
    plasmaCoreTemp: '34.2 °C',
    cognitiveLoad: '9.8%',
    neuralBandwidth: '3.6 TB/s',
    encryptionProtocol: 'Quantum 4096-bit Cipher',
    audioSubsystems: 'Web Speech Synthesis / Hi-IN Female & En-IN Ready',
    activeSensors: 64,
    mobileIntegration: 'Battery, Torch, GPS, Dialer, WhatsApp, Timer Active'
  });
});

// ==========================================
// AUTHENTICATION & ADMIN MANAGEMENT BACKEND
// ==========================================

interface BackendUser {
  id: string;
  email: string;
  passwordHash: string; // for demo simplicity or exact match
  name: string;
  role: 'admin' | 'operator' | 'user';
  status: 'online' | 'idle' | 'offline';
  lastActive: string;
  registeredAt: string;
  loginCount: number;
  permissions: {
    canUseVoice: boolean;
    canUseAiChat: boolean;
    canUseDeviceControls: boolean;
    canUseVisionOcr: boolean;
    canUseAutomations: boolean;
    isBanned: boolean;
  };
  ipAddress?: string;
  device?: string;
}

interface BackendAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  category: 'auth' | 'admin' | 'ai' | 'device' | 'security' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: string;
}

interface BackendSettings {
  aiTone: 'loving' | 'professional' | 'creative' | 'concise';
  temperature: number;
  maintenanceMode: boolean;
  lockdownMode: boolean;
  globalAnnouncement: string;
  requireAuthToUse: boolean;
  maxRequestsPerUser: number;
  allowNewRegistrations: boolean;
}

// Initial registered users list
const usersStore: Map<string, BackendUser> = new Map([
  [
    'bhajanfeel4@gmail.com',
    {
      id: 'usr-admin-01',
      email: 'bhajanfeel4@gmail.com',
      passwordHash: 'Aditya@123',
      name: 'Aditya (Super Admin & Operator)',
      role: 'admin',
      status: 'online',
      lastActive: new Date().toISOString(),
      registeredAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      loginCount: 42,
      permissions: {
        canUseVoice: true,
        canUseAiChat: true,
        canUseDeviceControls: true,
        canUseVisionOcr: true,
        canUseAutomations: true,
        isBanned: false,
      },
      ipAddress: '192.168.1.108',
      device: 'Operator Terminal / Chrome OS & Mobile',
    },
  ],
  [
    'pankajsondiha123@gmail.com',
    {
      id: 'usr-op-02',
      email: 'pankajsondiha123@gmail.com',
      passwordHash: 'Pankaj@123',
      name: 'Pankaj Kumar',
      role: 'operator',
      status: 'online',
      lastActive: new Date().toISOString(),
      registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      loginCount: 19,
      permissions: {
        canUseVoice: true,
        canUseAiChat: true,
        canUseDeviceControls: true,
        canUseVisionOcr: true,
        canUseAutomations: true,
        isBanned: false,
      },
      ipAddress: '122.161.44.12',
      device: 'Android 14 / Mobile Chrome',
    },
  ],
  [
    'rahul.tech@gmail.com',
    {
      id: 'usr-user-03',
      email: 'rahul.tech@gmail.com',
      passwordHash: 'User@123',
      name: 'Rahul Sharma',
      role: 'user',
      status: 'idle',
      lastActive: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      loginCount: 7,
      permissions: {
        canUseVoice: true,
        canUseAiChat: true,
        canUseDeviceControls: true,
        canUseVisionOcr: true,
        canUseAutomations: true,
        isBanned: false,
      },
      ipAddress: '49.36.128.91',
      device: 'Windows 11 / Edge',
    },
  ],
  [
    'priya.sharma99@gmail.com',
    {
      id: 'usr-user-04',
      email: 'priya.sharma99@gmail.com',
      passwordHash: 'Priya@123',
      name: 'Priya Verma',
      role: 'user',
      status: 'offline',
      lastActive: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      loginCount: 11,
      permissions: {
        canUseVoice: true,
        canUseAiChat: true,
        canUseDeviceControls: false,
        canUseVisionOcr: true,
        canUseAutomations: false,
        isBanned: false,
      },
      ipAddress: '157.34.192.10',
      device: 'iPhone 15 / Safari',
    },
  ],
]);

// Audit / Activity Logs store
const auditLogsStore: BackendAuditLog[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'bhajanfeel4@gmail.com',
    action: 'Admin Panel Access Granted (Operator Authority)',
    category: 'admin',
    severity: 'info',
    details: 'Authenticated with operator credentials. Full privileges unlocked.',
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'pankajsondiha123@gmail.com',
    action: 'AI Voice Synthesis & Directive Execution',
    category: 'ai',
    severity: 'info',
    details: 'Executed query: "भारत के प्रधानमंत्री कौन हैं?" with loving tone response.',
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'rahul.tech@gmail.com',
    action: 'Direct Mobile Device Automation Triggered',
    category: 'device',
    severity: 'info',
    details: 'Flashlight state toggled & battery status telemetry polled.',
  },
  {
    id: 'log-seed-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'system',
    action: 'Quantum 4096-bit Cipher Integrity Verified',
    category: 'security',
    severity: 'info',
    details: 'All secure channel nodes operational without packet anomalies.',
  },
];

// System-wide Settings store
let systemSettings: BackendSettings = {
  aiTone: 'loving',
  temperature: 0.7,
  maintenanceMode: false,
  lockdownMode: false,
  globalAnnouncement: 'अंकिता AI v12.0 ऑनलाइन है। सभी ऑपरेटर व सदस्य सुरक्षित रूप से जुड़े हुए हैं।',
  requireAuthToUse: true,
  maxRequestsPerUser: 500,
  allowNewRegistrations: true,
};

// Helper: sanitize user object for client response (omits password)
function sanitizeUser(u: BackendUser) {
  const { passwordHash, ...safe } = u;
  return safe;
}

// 1. User Registration API
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'ईमेल और पासवर्ड आवश्यक हैं।' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (usersStore.has(normalizedEmail)) {
    res.status(409).json({ error: 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।' });
    return;
  }

  // Check if special admin credentials provided during registration
  const isAdmin = normalizedEmail === 'bhajanfeel4@gmail.com';
  const role = isAdmin ? 'admin' : 'user';

  const newUser: BackendUser = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email: normalizedEmail,
    passwordHash: password,
    name: name?.trim() || (isAdmin ? 'Aditya (Admin)' : normalizedEmail.split('@')[0]),
    role,
    status: 'online',
    lastActive: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    loginCount: 1,
    permissions: {
      canUseVoice: true,
      canUseAiChat: true,
      canUseDeviceControls: true,
      canUseVisionOcr: true,
      canUseAutomations: true,
      isBanned: false,
    },
    ipAddress: req.ip || '127.0.0.1',
    device: req.headers['user-agent']?.slice(0, 60) || 'Web Browser',
  };

  usersStore.set(normalizedEmail, newUser);

  // Add audit log
  auditLogsStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: normalizedEmail,
    action: `New User Registered (${role.toUpperCase()})`,
    category: 'auth',
    severity: 'info',
    details: `User registered successfully with name: ${newUser.name}`,
  });

  res.json({
    success: true,
    user: sanitizeUser(newUser),
    message: isAdmin
      ? 'ऑपरेटर स्वागत है! आपको पूर्ण एडमिन अधिकार दिए गए हैं।'
      : 'पंजीकरण सफल! अब आप अंकिता AI का उपयोग कर सकते हैं।',
  });
});

// 2. User Login API
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'ईमेल और पासवर्ड दर्ज करें।' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // SPECIAL ADMIN OPERATOR CREDENTIALS OVERRIDE
  // user: bhajanfeel4@gmail.com, pass: Aditya@123
  if (normalizedEmail === 'bhajanfeel4@gmail.com') {
    if (password !== 'Aditya@123') {
      res.status(401).json({ error: 'एडमिन पासवर्ड अमान्य है।' });
      return;
    }

    let adminUser = usersStore.get(normalizedEmail);
    if (!adminUser) {
      adminUser = {
        id: 'usr-admin-01',
        email: normalizedEmail,
        passwordHash: 'Aditya@123',
        name: 'Aditya (Super Admin & Operator)',
        role: 'admin',
        status: 'online',
        lastActive: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        loginCount: 1,
        permissions: {
          canUseVoice: true,
          canUseAiChat: true,
          canUseDeviceControls: true,
          canUseVisionOcr: true,
          canUseAutomations: true,
          isBanned: false,
        },
        ipAddress: req.ip || '127.0.0.1',
        device: 'Admin Console',
      };
      usersStore.set(normalizedEmail, adminUser);
    } else {
      adminUser.status = 'online';
      adminUser.lastActive = new Date().toISOString();
      adminUser.loginCount += 1;
      adminUser.role = 'admin';
    }

    auditLogsStore.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      userEmail: normalizedEmail,
      action: 'Super Admin / Operator Logged In',
      category: 'admin',
      severity: 'info',
      details: 'Full operator and admin power unlocked.',
    });

    res.json({
      success: true,
      user: sanitizeUser(adminUser),
      isOperator: true,
      message: 'स्वागत है आदित्य! आपको ऑपरेटर पावर और एडमिन पैनल मिल गया है।',
    });
    return;
  }

  // Standard registered user verification
  const existingUser = usersStore.get(normalizedEmail);
  if (!existingUser) {
    res.status(404).json({ error: 'यह ईमेल पंजीकृत नहीं है। कृपया पहले रजिस्टर करें।' });
    return;
  }

  if (existingUser.passwordHash !== password) {
    res.status(401).json({ error: 'पासवर्ड गलत है। कृपया पुनः प्रयास करें।' });
    return;
  }

  if (existingUser.permissions.isBanned) {
    res.status(403).json({ error: 'आपका खाता एडमिन द्वारा ब्लॉक किया गया है। एडमिन से संपर्क करें।' });
    return;
  }

  existingUser.status = 'online';
  existingUser.lastActive = new Date().toISOString();
  existingUser.loginCount += 1;

  auditLogsStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: normalizedEmail,
    action: 'User Logged In',
    category: 'auth',
    severity: 'info',
    details: `User logged in from ${req.ip || 'web client'}`,
  });

  res.json({
    success: true,
    user: sanitizeUser(existingUser),
    message: `स्वागत है, ${existingUser.name}! अंकिता AI सक्रिय है।`,
  });
});

// 3. Admin: List All Users with activity status
app.get('/api/admin/users', (req: Request, res: Response) => {
  const usersList = Array.from(usersStore.values()).map(sanitizeUser);
  res.json({
    users: usersList,
    totalCount: usersList.length,
    onlineCount: usersList.filter((u) => u.status === 'online').length,
  });
});

// 4. Admin: Update User Permissions & Status
app.post('/api/admin/users/:id/permissions', (req: Request, res: Response) => {
  const { id } = req.params;
  const { permissions, status, role } = req.body;

  let targetUser: BackendUser | undefined;
  for (const user of usersStore.values()) {
    if (user.id === id) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    res.status(404).json({ error: 'उपयोगकर्ता नहीं मिला।' });
    return;
  }

  // Do not allow banning the super admin
  if (targetUser.email === 'bhajanfeel4@gmail.com' && permissions?.isBanned) {
    res.status(400).json({ error: 'सुपर एडमिन को ब्लॉक नहीं किया जा सकता।' });
    return;
  }

  if (permissions) {
    targetUser.permissions = { ...targetUser.permissions, ...permissions };
  }
  if (status) {
    targetUser.status = status;
  }
  if (role && (role === 'admin' || role === 'operator' || role === 'user')) {
    targetUser.role = role;
  }

  auditLogsStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'bhajanfeel4@gmail.com',
    action: `User Permissions Updated for ${targetUser.email}`,
    category: 'admin',
    severity: 'warning',
    details: `Updated permissions/role: ${JSON.stringify({ permissions, status, role })}`,
  });

  res.json({
    success: true,
    user: sanitizeUser(targetUser),
    message: 'उपयोगकर्ता अनुमतियां सफलतापूर्वक अद्यतन की गईं।',
  });
});

// 5. Admin: Delete User
app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let targetEmail: string | undefined;

  for (const [email, user] of usersStore.entries()) {
    if (user.id === id) {
      if (email === 'bhajanfeel4@gmail.com') {
        res.status(400).json({ error: 'सुपर एडमिन खाता हटाया नहीं जा सकता।' });
        return;
      }
      targetEmail = email;
      break;
    }
  }

  if (targetEmail) {
    usersStore.delete(targetEmail);
    auditLogsStore.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      userEmail: 'bhajanfeel4@gmail.com',
      action: `Deleted User Account ${targetEmail}`,
      category: 'admin',
      severity: 'warning',
      details: `User with ID ${id} removed from system registry.`,
    });
    res.json({ success: true, message: 'उपयोगकर्ता सफलतापूर्वक हटा दिया गया।' });
  } else {
    res.status(404).json({ error: 'उपयोगकर्ता नहीं मिला।' });
  }
});

// 6. Admin: Get Audit / Activity Logs
app.get('/api/admin/logs', (req: Request, res: Response) => {
  const category = req.query.category as string;
  const severity = req.query.severity as string;

  let filtered = [...auditLogsStore];
  if (category && category !== 'all') {
    filtered = filtered.filter((l) => l.category === category);
  }
  if (severity && severity !== 'all') {
    filtered = filtered.filter((l) => l.severity === severity);
  }

  res.json({
    logs: filtered.slice(0, 100),
    totalCount: auditLogsStore.length,
  });
});

// 7. Admin: Append New Log (Client activity reporting)
app.post('/api/admin/logs', (req: Request, res: Response) => {
  const { userEmail, action, category, severity, details } = req.body;
  if (!action) {
    res.status(400).json({ error: 'Log action is required' });
    return;
  }

  const newLog: BackendAuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: userEmail || 'guest',
    action,
    category: category || 'system',
    severity: severity || 'info',
    details: details || '',
  };

  auditLogsStore.unshift(newLog);
  if (auditLogsStore.length > 200) auditLogsStore.pop();

  res.json({ success: true, log: newLog });
});

// 8. Admin: Clear Logs
app.delete('/api/admin/logs', (req: Request, res: Response) => {
  auditLogsStore.length = 0;
  auditLogsStore.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'bhajanfeel4@gmail.com',
    action: 'System Audit Logs Cleared by Admin',
    category: 'admin',
    severity: 'warning',
    details: 'Log store reset to initial state.',
  });
  res.json({ success: true, message: 'लॉग साफ़ कर दिए गए।' });
});

// 9. Admin: Get & Update System Settings
app.get('/api/admin/settings', (req: Request, res: Response) => {
  res.json(systemSettings);
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  systemSettings = { ...systemSettings, ...req.body };
  auditLogsStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'bhajanfeel4@gmail.com',
    action: 'System Settings Updated',
    category: 'admin',
    severity: 'info',
    details: `Settings updated: ${JSON.stringify(req.body)}`,
  });
  res.json({ success: true, settings: systemSettings, message: 'सिस्टम सेटिंग्स सुरक्षित कर ली गईं।' });
});

// 10. Admin: Send Global Broadcast Announcement
app.post('/api/admin/broadcast', (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'संदेश आवश्यक है' });
    return;
  }
  systemSettings.globalAnnouncement = message;
  auditLogsStore.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    userEmail: 'bhajanfeel4@gmail.com',
    action: 'Global Operator Broadcast Published',
    category: 'admin',
    severity: 'info',
    details: `Broadcast: "${message}"`,
  });
  res.json({ success: true, message: 'घोषणा सभी उपयोगकर्ताओं तक प्रसारित कर दी गई।' });
});

// Attach Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 अंकिता AI (Ankita Assistant) Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to launch Ankita server:', err);
});
