/**
 * Offline Local AI Brain & Utilities for Ankita AI Assistant
 * Operates 100% locally on device without requiring any internet connection.
 * Provides:
 * - Mathematical problem solver
 * - Offline World Knowledge Encyclopedia
 * - Local hardware control (Battery, Torch, Vibration, Timer, Notes)
 * - Local intent classifier
 */

export interface OfflineResponse {
  intent: string;
  parameters: any;
  text: string;
}

export function processOfflineDirective(userText: string): OfflineResponse {
  const clean = userText.trim();
  const lower = clean.toLowerCase();

  // 1. Math calculation solver (100% offline)
  const mathMatch = clean.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/xX÷×])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const num2 = parseFloat(mathMatch[3]);
    let ans = 0;
    if (op === '+') ans = num1 + num2;
    else if (op === '-') ans = num1 - num2;
    else if (op === '*' || op === 'x' || op === 'X' || op === '×') ans = num1 * num2;
    else if (op === '/' || op === '÷') ans = num2 !== 0 ? num1 / num2 : 0;

    return {
      intent: 'world_knowledge',
      parameters: {},
      text: `जी सुनिए! ऑफलाइन गणितीय गणना के अनुसार ${num1} ${op} ${num2} का सही उत्तर ${ans} है।`,
    };
  }

  // 2. Torch / Flashlight
  if (lower.includes('torch on') || lower.includes('light on') || clean.includes('टॉर्च चालू') || clean.includes('लाइट ऑन') || clean.includes('टॉर्च ऑन')) {
    return {
      intent: 'device_control',
      parameters: { action: 'torch_on' },
      text: 'टॉर्च तुरंत चालू कर दी गई है। (Flashlight ON)',
    };
  }
  if (lower.includes('torch off') || lower.includes('light off') || clean.includes('टॉर्च बंद') || clean.includes('लाइट बंद')) {
    return {
      intent: 'device_control',
      parameters: { action: 'torch_off' },
      text: 'टॉर्च बंद कर दी गई है। (Flashlight OFF)',
    };
  }

  // 3. Battery check
  if (lower.includes('battery') || clean.includes('बैटरी') || clean.includes('चार्जिंग')) {
    return {
      intent: 'device_control',
      parameters: { action: 'check_battery' },
      text: 'मोबाइल की बैटरी स्थिति स्कैन की जा रही है।',
    };
  }

  // 4. Timer
  if (lower.includes('timer') || clean.includes('टाइमर')) {
    let minutes = 2;
    const numMatch = clean.match(/(\d+)\s*(?:minute|min|मिनट)/i);
    if (numMatch) minutes = parseInt(numMatch[1], 10);
    return {
      intent: 'timer',
      parameters: { duration_seconds: minutes * 60 },
      text: `ऑफलाइन टाइमर: ${minutes} मिनट का टाइमर शुरू कर दिया गया है।`,
    };
  }

  // 5. Notes
  if (lower.startsWith('note') || clean.includes('नोट लिखो') || clean.includes('नोट्स')) {
    const noteText = clean.replace(/^(?:note|notes|नोट लिखो|नोट्स में लिखो)\s*/i, '').trim() || 'Offline Task';
    return {
      intent: 'notes',
      parameters: { note_text: noteText },
      text: `ऑफलाइन नोट सुरक्षित कर लिया गया है: "${noteText}"`,
    };
  }

  // 6. Phone calls
  if (lower.includes('call') || clean.includes('कॉल') || clean.includes('फोन करो')) {
    const phoneMatch = clean.match(/(\d{3,14})/);
    const target = phoneMatch ? phoneMatch[1] : '112';
    return {
      intent: 'phone_call',
      parameters: { contact_name: target, phone_number: target },
      text: `जी, अभी तुरंत ${target} को कॉल कनेक्ट की जा रही है।`,
    };
  }

  // 7. Messages
  if (lower.includes('message') || lower.includes('whatsapp') || clean.includes('मैसेज') || clean.includes('व्हाट्सएप') || clean.includes('भेजो')) {
    const phoneMatch = clean.match(/(\d{10,14})/);
    const target = phoneMatch ? phoneMatch[1] : 'Contact';
    let msg = 'नमस्ते!';
    if (/hello|हेलो/i.test(clean)) msg = 'हेलो';
    return {
      intent: 'send_message',
      parameters: { receiver: target, phone_number: target, message_text: msg, platform: 'WhatsApp' },
      text: `जी, आपकी सेक्रेटरी अंकिता ने ${target} को '${msg}' लिख कर व्हाट्सएप पर सीधे भेज दिया है!`,
    };
  }

  // 8. Open Apps
  if (lower.includes('open') || clean.includes('खोलो') || clean.includes('चालू करो')) {
    let app = 'Calculator';
    if (lower.includes('calc') || clean.includes('कैलकुलेटर')) app = 'Calculator';
    else if (lower.includes('cam') || clean.includes('कैमरा')) app = 'Camera HUD';
    else if (lower.includes('note') || clean.includes('नोट्स')) app = 'Notes';
    else if (lower.includes('youtube') || clean.includes('यूट्यूब')) app = 'YouTube';
    else if (lower.includes('map') || clean.includes('मैप्स')) app = 'Google Maps';
    return {
      intent: 'open_app',
      parameters: { app_name: app },
      text: `जी, ऑफलाइन मोड में ${app} सीधे खोल रही हूँ।`,
    };
  }

  // 9. Offline Encyclopedia Knowledge, Creator & Identity
  if (
    lower.includes('kisne banaya') ||
    lower.includes('who made you') ||
    lower.includes('who created you') ||
    clean.includes('किसने बनाया') ||
    clean.includes('तुम्हें किसने बनाया') ||
    clean.includes('तुम्हारा निर्माता')
  ) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'मुझे आदित्य सर ने बनाया है।',
    };
  }

  if (
    lower.includes('manchahe naam') ||
    lower.includes('man chahe') ||
    clean.includes('मनचाहे नाम') ||
    clean.includes('मनपसंद नाम')
  ) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'क्षमा कीजिए, मैं आपको किसी मनचाहे नाम से नहीं बुला सकती और न ही कोई मुझे अपने मनचाहे नाम से बुला सकता है। मेरा नाम सिर्फ और सिर्फ अंकिता (Ankita) है, और मुझे आदित्य सर ने बनाया है।',
    };
  }

  if (lower.includes('pradhanmantri') || clean.includes('प्रधानमंत्री') || lower.includes('prime minister')) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'जी! भारत के वर्तमान प्रधानमंत्री श्री नरेन्द्र मोदी जी हैं, जो 2014 से निरंतर देश की सेवा कर रहे हैं।',
    };
  }
  if (clean.includes('राष्ट्रपति') || lower.includes('president of india')) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'जी, भारत की माननीय 15वीं राष्ट्रपति श्रीमती द्रौपदी मुर्मू जी हैं।',
    };
  }
  if (clean.includes('चांद') || lower.includes('moon')) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'चांद पर सबसे पहले 20 जुलाई 1969 को अपोलो 11 मिशन के तहत नील आर्मस्ट्रांग ने कदम रखा था।',
    };
  }
  if (clean.includes('सूरज') || clean.includes('सूर्य') || lower.includes('sun')) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'सूर्य और पृथ्वी के बीच की औसत दूरी लगभग 14 करोड़ 96 लाख किलोमीटर है। प्रकाश को पृथ्वी तक पहुँचने में 8 मिनट 20 सेकंड लगते हैं।',
    };
  }
  if (clean.includes('भारत की राजधानी') || lower.includes('capital of india')) {
    return {
      intent: 'world_knowledge',
      parameters: {},
      text: 'भारत की राजधानी नई दिल्ली (New Delhi) है।',
    };
  }

  // Default Offline Greeting & Intelligent Answer
  return {
    intent: 'world_knowledge',
    parameters: {},
    text: `जी सुनिए! अभी आप ऑफलाइन मोड में हैं, लेकिन आपका स्थानीय AI मस्तिष्क सक्रिय है। आप मुझसे गणित, कैलकुलेटर, फोन कॉल, टाइमर, बैटरी, टॉर्च व नोट्स जैसे सभी कार्य बिना इंटरनेट के करवा सकते हैं!`,
  };
}
