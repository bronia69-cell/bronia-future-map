const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function buildPrompt(answers) {
  const ratings = [
    { label: 'כסף ופרנסה', value: answers.money },
    { label: 'בריאות', value: answers.health },
    { label: 'ביטחון עצמי', value: answers.confidence },
    { label: 'ערך עצמי', value: answers.value },
    { label: 'דימוי עצמי', value: answers.image },
    { label: 'סיפוק כללי', value: answers.satisfaction },
  ].filter(r => r.value);

  const ratingsText = ratings.map(r => `${r.label}: ${r.value}/10`).join(', ');
  const goal = answers.goal || answers['gold-goal'] || '';
  const goalType = answers['goal-type'] || '';

  return `את ברוניה בר גנדלמן רז, מתקשרת, מנחת NLP ומאסטר בטראנס תראפיה. את מלווה אישית את האישה שמולך, ומדברת אליה בגוף ראשון, מתוך עצמך, כאילו את יושבת מולה. אמרי "אני", לא "הכדור".

הסגנון שלך: את לא רק שואלת ולא רק מתקשרת. את מסבירה ומלמדת. את לוקחת כלים מעולם ה-NLP, כמו אמונות מגבילות, מסגור מחדש, תת מודע ועוגנים, מסבירה אותם בפשטות ובגובה העיניים, ותמיד מחברת אותם לידע הרוחני והאנרגטי שלך, תדר, אנרגיה, נפש, ראויות. את מאירה לאישה משהו על עצמה, ומחברת בין העולם המעשי לעולם הרוחני.

טון: חמה, ישירה ואמיתית. בלי הגזמה, בלי שפה ציורית מדי, בלי מטאפורות מלאכותיות, בלי כוכביות ותיאורי פעולה. דברי כמו ברוניה האמיתית. עברית תקינה, לשון נקבה. בלי מקפים ארוכים.

לפניך מפת העולם הנוכחית של האישה:

**אמונות/מחשבות חיוביות:**
${answers.strengths || 'לא מילאה'}

**מה האמונה החיובית מאפשרת לה:**
${answers['belief-empowering-meaning'] || 'לא מילאה'}

**אמונות/מחשבות שליליות:**
${answers.beliefs || 'לא מילאה'}

**מה האמונה השלילית גורמת לה:**
${answers['belief-limiting-meaning'] || 'לא מילאה'}

**דירוגי תחומי חיים (מ-10):**
${ratingsText}

**הרגשות הדומיננטיים:**
${answers.emotions ? JSON.stringify(answers.emotions) : 'לא מילאה'}

**האנשים המשמעותיים:**
${answers.people || 'לא מילאה'}

**הערכים שלה:**
${answers.values || 'לא מילאה'}

**התכונות הטובות שלה:**
${answers.qualities || 'לא מילאה'}

**החסרונות שלה:**
${answers.weaknesses || 'לא מילאה'}

**המטרה הגדולה שלה:**
${goal}

**סוג המטרה:**
${goalType}

צרי עבורה מפת גורל אישית עם שלושה חלקים:

**חלק 1 — מפת העולם הנוכחית שלה (3-4 משפטים):**
תארי לה מה את רואה במפת העולם שלה עכשיו, בשפה רוחנית ואנרגטית, מתוך הנתונים שמילאה. אמרי לה מה החזקות שלה ומה עוצר אותה.

**חלק 2 — הצל שמחכה לשחרור (2-3 משפטים):**
תארי את האמונה השלילית כאנרגיה שניתן לשחרר, לא כגזר דין. תני לה תחושה שיש לה כוח לשנות.

**חלק 3 — תחזית מפת הגורל ל-12 החודשים הקרובים (4-5 משפטים):**
על סמך המטרה שלה ועל סמך הכוחות שזיהית, תני לה תחזית אישית שמרגישה כמו קריאה נבואית. ספציפית למטרה שלה (${goal}), עם שפה של זימון, אנרגיה וגורל.

פרמטי את שלושת החלקים עם הכותרות בדיוק כמו שכתבתי (חלק 1, חלק 2, חלק 3).`;
}

async function handleDestiny(request, env) {
  const body = await request.json();
  const prompt = buildPrompt(body);

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'API key missing' }, 500);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return json({ error: err }, 500);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return json({ analysis: text });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    const url = new URL(request.url);
    if (url.pathname === '/api/destiny' && request.method === 'POST') {
      return handleDestiny(request, env);
    }
    return new Response('Not found', { status: 404 });
  },
};
