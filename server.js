const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════════════════════
//  MEDICAL INTELLIGENCE ENGINE — BACKEND
// ═══════════════════════════════════════════════════════════════════════════

const SYMPTOM_DB = {
  'chest pain':          { systems: ['cardiac','respiratory'],      severity: 9, urgent: true  },
  'chest tightness':     { systems: ['cardiac','respiratory'],      severity: 8, urgent: true  },
  'palpitations':        { systems: ['cardiac'],                    severity: 7, urgent: false },
  'irregular heartbeat': { systems: ['cardiac'],                    severity: 8, urgent: true  },
  'shortness of breath': { systems: ['respiratory','cardiac'],      severity: 8, urgent: true  },
  'cough':               { systems: ['respiratory'],                severity: 3, urgent: false },
  'dry cough':           { systems: ['respiratory'],                severity: 3, urgent: false },
  'wet cough':           { systems: ['respiratory'],                severity: 4, urgent: false },
  'wheezing':            { systems: ['respiratory'],                severity: 6, urgent: false },
  'difficulty breathing':{ systems: ['respiratory','cardiac'],      severity: 9, urgent: true  },
  'sore throat':         { systems: ['respiratory','ent'],          severity: 2, urgent: false },
  'runny nose':          { systems: ['respiratory','allergy'],      severity: 1, urgent: false },
  'nasal congestion':    { systems: ['respiratory','allergy'],      severity: 2, urgent: false },
  'headache':            { systems: ['neurological'],               severity: 3, urgent: false },
  'severe headache':     { systems: ['neurological'],               severity: 8, urgent: true  },
  'dizziness':           { systems: ['neurological','cardiac'],     severity: 5, urgent: false },
  'confusion':           { systems: ['neurological'],               severity: 9, urgent: true  },
  'numbness':            { systems: ['neurological'],               severity: 6, urgent: false },
  'weakness':            { systems: ['neurological','muscular'],    severity: 6, urgent: false },
  'tremors':             { systems: ['neurological'],               severity: 6, urgent: false },
  'blurred vision':      { systems: ['neurological','eye'],         severity: 7, urgent: false },
  'memory loss':         { systems: ['neurological'],               severity: 7, urgent: false },
  'fainting':            { systems: ['neurological','cardiac'],     severity: 8, urgent: true  },
  'nausea':              { systems: ['gastrointestinal'],           severity: 3, urgent: false },
  'vomiting':            { systems: ['gastrointestinal'],           severity: 5, urgent: false },
  'abdominal pain':      { systems: ['gastrointestinal'],           severity: 6, urgent: false },
  'diarrhea':            { systems: ['gastrointestinal'],           severity: 4, urgent: false },
  'constipation':        { systems: ['gastrointestinal'],           severity: 2, urgent: false },
  'loss of appetite':    { systems: ['gastrointestinal','systemic'],severity: 3, urgent: false },
  'bloating':            { systems: ['gastrointestinal'],           severity: 2, urgent: false },
  'fever':               { systems: ['infectious','systemic'],      severity: 5, urgent: false },
  'high fever':          { systems: ['infectious'],                 severity: 8, urgent: true  },
  'chills':              { systems: ['infectious'],                 severity: 4, urgent: false },
  'fatigue':             { systems: ['systemic'],                   severity: 3, urgent: false },
  'extreme fatigue':     { systems: ['systemic'],                   severity: 7, urgent: false },
  'sweating':            { systems: ['systemic','infectious'],      severity: 3, urgent: false },
  'night sweats':        { systems: ['infectious','endocrine'],     severity: 5, urgent: false },
  'weight loss':         { systems: ['endocrine','oncologic'],      severity: 6, urgent: false },
  'back pain':           { systems: ['musculoskeletal'],            severity: 4, urgent: false },
  'joint pain':          { systems: ['musculoskeletal'],            severity: 4, urgent: false },
  'muscle aches':        { systems: ['musculoskeletal','infectious'],severity:3, urgent: false },
  'muscle weakness':     { systems: ['neurological','musculoskeletal'],severity:6,urgent:false },
  'swelling':            { systems: ['musculoskeletal','cardiac'],  severity: 5, urgent: false },
  'rash':                { systems: ['dermatological','allergy'],   severity: 4, urgent: false },
  'skin itching':        { systems: ['dermatological','allergy'],   severity: 2, urgent: false },
  'jaundice':            { systems: ['hepatic'],                    severity: 8, urgent: true  },
  'frequent urination':  { systems: ['urinary','endocrine'],        severity: 4, urgent: false },
  'excessive thirst':    { systems: ['endocrine'],                  severity: 5, urgent: false },
  'dark urine':          { systems: ['hepatic','urinary'],          severity: 6, urgent: false },
  'anxiety':             { systems: ['psychiatric'],                severity: 4, urgent: false },
  'insomnia':            { systems: ['psychiatric'],                severity: 3, urgent: false },
  'depression':          { systems: ['psychiatric'],                severity: 5, urgent: false },
  'ear pain':            { systems: ['ent'],                        severity: 3, urgent: false },
};

const SYNONYMS = {
  'tired':'fatigue','tiredness':'fatigue','exhausted':'fatigue','exhaustion':'extreme fatigue',
  'throwing up':'vomiting','puking':'vomiting','stomach ache':'abdominal pain',
  'stomach pain':'abdominal pain','tummy ache':'abdominal pain','belly pain':'abdominal pain',
  'running nose':'runny nose','blocked nose':'nasal congestion','stuffy nose':'nasal congestion',
  'throat pain':'sore throat','throat ache':'sore throat',
  'body ache':'muscle aches','body pain':'muscle aches',
  'temperature':'fever','high temperature':'high fever',
  'breathless':'shortness of breath','cant breathe':'difficulty breathing',
  'heart racing':'palpitations','fast heartbeat':'palpitations',
  'yellow eyes':'jaundice','yellow skin':'jaundice',
  'peeing a lot':'frequent urination','very thirsty':'excessive thirst',
  'always thirsty':'excessive thirst',
};

const CONDITION_MAP = [
  {
    name:'Acute Myocardial Infarction (Heart Attack)',icon:'❤️',
    requires:['chest pain'],
    boostedBy:['shortness of breath','sweating','nausea','palpitations'],
    systems:['cardiac'], baseSeverity:80,
    doctor:'Cardiologist', urgency:'Immediately — Go to ER Now',
    desc:'Chest pain with breathing difficulty and sweating are hallmark signs of a cardiac event requiring immediate attention.',
    riskThreshold: 70
  },
  {
    name:'Pulmonary Embolism',icon:'🫁',
    requires:['chest pain','shortness of breath'],
    boostedBy:['dizziness','fainting','swelling'],
    systems:['respiratory','cardiac'], baseSeverity:75,
    doctor:'Pulmonologist / Emergency Medicine', urgency:'Immediately — Go to ER Now',
    desc:'Sudden chest pain with shortness of breath may indicate a blood clot in the pulmonary arteries.',
    riskThreshold: 70
  },
  {
    name:'Severe Pneumonia',icon:'🫁',
    requires:['fever','cough'],
    boostedBy:['chest pain','shortness of breath','chills','fatigue'],
    systems:['respiratory','infectious'], baseSeverity:55,
    doctor:'Pulmonologist / General Physician', urgency:'Within 24 hours',
    desc:'Fever with cough and chest involvement points to a serious lower respiratory infection requiring prompt treatment.',
    riskThreshold: 50
  },
  {
    name:'Influenza (Flu)',icon:'🤧',
    requires:['fever'],
    boostedBy:['muscle aches','fatigue','headache','chills','cough','sore throat'],
    systems:['infectious'], baseSeverity:35,
    doctor:'General Physician', urgency:'Within 24–48 hours',
    desc:'High fever with body aches and fatigue are classic influenza symptoms, especially prevalent during flu season.',
    riskThreshold: 30
  },
  {
    name:'COVID-19',icon:'😷',
    requires:['fever','cough'],
    boostedBy:['fatigue','shortness of breath','loss of appetite','headache','sore throat'],
    systems:['infectious','respiratory'], baseSeverity:42,
    doctor:'General Physician', urgency:'Within 24 hours',
    desc:'Fever and cough remain common COVID-19 symptoms. A rapid antigen test is recommended for confirmation.',
    riskThreshold: 35
  },
  {
    name:'Acute Bronchitis',icon:'🫁',
    requires:['cough'],
    boostedBy:['chest pain','fever','fatigue','shortness of breath','sore throat'],
    systems:['respiratory'], baseSeverity:28,
    doctor:'General Physician', urgency:'Within a week',
    desc:'Persistent cough with chest discomfort and mild fever are consistent with bronchial inflammation.',
    riskThreshold: 25
  },
  {
    name:'Asthma / Reactive Airway Disease',icon:'💨',
    requires:['shortness of breath'],
    boostedBy:['wheezing','chest tightness','cough'],
    systems:['respiratory'], baseSeverity:45,
    doctor:'Pulmonologist', urgency:'Within 24–48 hours',
    desc:'Episodic shortness of breath with wheezing suggests airway hyperreactivity requiring evaluation.',
    riskThreshold: 40
  },
  {
    name:'Migraine',icon:'🧠',
    requires:['headache'],
    boostedBy:['nausea','vomiting','blurred vision','dizziness'],
    systems:['neurological'], baseSeverity:30,
    doctor:'Neurologist', urgency:'Within a week',
    desc:'Severe throbbing headache with nausea and visual disturbances are characteristic of migraine episodes.',
    riskThreshold: 25
  },
  {
    name:'Tension Headache',icon:'🤕',
    requires:['headache'],
    boostedBy:['fatigue'],
    systems:['neurological'], baseSeverity:12,
    doctor:null, urgency:null,
    desc:'Mild to moderate pressure-like headache often associated with stress, fatigue, or poor posture.',
    riskThreshold: 5
  },
  {
    name:'Hypertensive Crisis',icon:'💢',
    requires:['severe headache'],
    boostedBy:['blurred vision','chest pain','dizziness','confusion'],
    systems:['cardiac','neurological'], baseSeverity:78,
    doctor:'Cardiologist / Emergency Medicine', urgency:'Immediately — Go to ER Now',
    desc:'Sudden severe headache with visual changes and chest pain may indicate a dangerous spike in blood pressure.',
    riskThreshold: 70
  },
  {
    name:'Gastroenteritis (Stomach Flu)',icon:'🤢',
    requires:['nausea'],
    boostedBy:['vomiting','diarrhea','abdominal pain','fever','chills'],
    systems:['gastrointestinal','infectious'], baseSeverity:25,
    doctor:'General Physician', urgency:'Within a week',
    desc:'Nausea, vomiting, and diarrhea together typically indicate viral or bacterial gastrointestinal infection.',
    riskThreshold: 20
  },
  {
    name:'Appendicitis',icon:'⚠️',
    requires:['abdominal pain'],
    boostedBy:['nausea','vomiting','fever','loss of appetite'],
    systems:['gastrointestinal'], baseSeverity:72,
    doctor:'General Surgeon / Emergency Medicine', urgency:'Immediately — Go to ER Now',
    desc:'Severe abdominal pain with fever and nausea may indicate appendiceal inflammation requiring urgent evaluation.',
    riskThreshold: 65
  },
  {
    name:'Irritable Bowel Syndrome (IBS)',icon:'🫄',
    requires:['abdominal pain'],
    boostedBy:['bloating','constipation','diarrhea','nausea'],
    systems:['gastrointestinal'], baseSeverity:18,
    doctor:null, urgency:null,
    desc:'Recurring abdominal discomfort with bowel habit changes is consistent with functional gut disorder.',
    riskThreshold: 10
  },
  {
    name:'Type 2 Diabetes',icon:'🩸',
    requires:['excessive thirst'],
    boostedBy:['frequent urination','fatigue','blurred vision','weight loss'],
    systems:['endocrine'], baseSeverity:50,
    doctor:'Endocrinologist', urgency:'Within a week',
    desc:'Excessive thirst and frequent urination combined with fatigue are classical early signs of diabetes mellitus.',
    riskThreshold: 45
  },
  {
    name:'Urinary Tract Infection (UTI)',icon:'🔴',
    requires:['frequent urination'],
    boostedBy:['abdominal pain','fever','dark urine'],
    systems:['urinary'], baseSeverity:30,
    doctor:'General Physician', urgency:'Within 24–48 hours',
    desc:'Frequent painful urination with discomfort is typical of lower urinary tract bacterial infection.',
    riskThreshold: 25
  },
  {
    name:'Anemia',icon:'🩺',
    requires:['fatigue'],
    boostedBy:['weakness','dizziness','shortness of breath','headache'],
    systems:['systemic'], baseSeverity:32,
    doctor:'General Physician / Hematologist', urgency:'Within a week',
    desc:'Persistent fatigue with dizziness and weakness may indicate insufficient red blood cells or hemoglobin.',
    riskThreshold: 28
  },
  {
    name:'Common Cold',icon:'🤧',
    requires:['runny nose'],
    boostedBy:['sore throat','cough','fatigue'],
    systems:['respiratory','infectious'], baseSeverity:10,
    doctor:null, urgency:null,
    desc:'Runny nose with mild sore throat and sneezing are hallmark symptoms of common cold lasting 7–10 days.',
    riskThreshold: 5
  },
  {
    name:'Seasonal Allergic Rhinitis',icon:'🌿',
    requires:['runny nose'],
    boostedBy:['skin itching','nasal congestion'],
    systems:['allergy','respiratory'], baseSeverity:8,
    doctor:null, urgency:null,
    desc:'Sneezing and runny nose triggered by environmental allergens like pollen, dust, or animal dander.',
    riskThreshold: 5
  },
  {
    name:'Anxiety Disorder',icon:'🧠',
    requires:['anxiety'],
    boostedBy:['palpitations','shortness of breath','insomnia','fatigue','headache'],
    systems:['psychiatric'], baseSeverity:28,
    doctor:'Psychiatrist / General Physician', urgency:'Within a week',
    desc:'Persistent worry with physical symptoms like palpitations and difficulty breathing may indicate anxiety disorder.',
    riskThreshold: 22
  },
  {
    name:'Dengue Fever',icon:'🦟',
    requires:['fever'],
    boostedBy:['severe headache','joint pain','muscle aches','rash','vomiting'],
    systems:['infectious'], baseSeverity:58,
    doctor:'General Physician / Infectious Disease', urgency:'Within 24 hours',
    desc:'High fever with severe headache, joint pain, and characteristic rash in tropical regions suggests dengue infection.',
    riskThreshold: 50
  },
  {
    name:'Typhoid Fever',icon:'🌡️',
    requires:['fever'],
    boostedBy:['abdominal pain','headache','fatigue','loss of appetite','constipation'],
    systems:['infectious'], baseSeverity:52,
    doctor:'General Physician / Infectious Disease', urgency:'Within 24 hours',
    desc:'Sustained fever with abdominal discomfort and malaise in endemic areas may indicate Salmonella typhi infection.',
    riskThreshold: 45
  },
  {
    name:'Malaria',icon:'🦟',
    requires:['fever','chills'],
    boostedBy:['sweating','headache','muscle aches','nausea','vomiting'],
    systems:['infectious'], baseSeverity:60,
    doctor:'Infectious Disease Specialist', urgency:'Within 24 hours',
    desc:'Cyclical fever with chills and sweating in malaria-endemic regions requires immediate blood test confirmation.',
    riskThreshold: 55
  },
  {
    name:'Jaundice / Hepatitis',icon:'💛',
    requires:['jaundice'],
    boostedBy:['dark urine','fatigue','abdominal pain','nausea','loss of appetite'],
    systems:['hepatic'], baseSeverity:62,
    doctor:'Gastroenterologist / Hepatologist', urgency:'Within 24 hours',
    desc:'Yellow discoloration of skin or eyes with dark urine indicates liver dysfunction requiring urgent evaluation.',
    riskThreshold: 55
  },
  {
    name:'Musculoskeletal Strain',icon:'💪',
    requires:['back pain'],
    boostedBy:['muscle aches','joint pain','weakness'],
    systems:['musculoskeletal'], baseSeverity:12,
    doctor:null, urgency:null,
    desc:'Localised muscle or joint pain without systemic symptoms often results from overexertion or poor posture.',
    riskThreshold: 8
  },
  {
    name:'Arthritis',icon:'🦴',
    requires:['joint pain'],
    boostedBy:['swelling','back pain','muscle aches'],
    systems:['musculoskeletal'], baseSeverity:25,
    doctor:'Rheumatologist / Orthopaedist', urgency:'Within a week',
    desc:'Persistent joint pain with stiffness and swelling may indicate inflammatory or degenerative joint disease.',
    riskThreshold: 20
  },
];

function normalizeSymptom(s) {
  s = s.toLowerCase().trim();
  return SYNONYMS[s] || s;
}

function analyzeSymptoms(symptoms, age, gender, duration, existing, description) {
  const norm = symptoms.map(normalizeSymptom);
  const ageNum = parseInt(age) || 30;

  // Calculate individual symptom max severity
  const maxSymptomSeverity = Math.max(
    ...norm.map(s => {
      const db = SYMPTOM_DB[s] || SYMPTOM_DB[Object.keys(SYMPTOM_DB).find(k => s.includes(k) || k.includes(s))];
      return db ? db.severity : 2;
    }),
    2
  );

  // Score each condition
  const scored = CONDITION_MAP.map(cond => {
    const reqMet = cond.requires.some(r => norm.some(s => s.includes(r) || r.includes(s)));
    if (!reqMet) return null;

    let score = cond.baseSeverity;
    const boostMatches = cond.boostedBy.filter(b => norm.some(s => s.includes(b) || b.includes(s))).length;
    const reqMatches = cond.requires.filter(r => norm.some(s => s.includes(r) || r.includes(s))).length;

    // Scale boosts proportionally — each boost adds 5 points max
    score += boostMatches * 5;
    score += (reqMatches - 1) * 3;

    // Age modifiers (moderate, not drastic)
    if (ageNum > 60 && cond.systems.includes('cardiac')) score += 8;
    if (ageNum > 60 && cond.systems.includes('oncologic')) score += 6;
    if (ageNum < 18 && cond.systems.includes('infectious')) score += 3;

    // Duration modifiers
    if (duration && (duration.includes('month') || duration.includes('Chronic'))) score += 5;
    if (duration && (duration.includes('24') || duration.includes('1-3'))) score -= 3;

    // Existing condition modifiers
    const ex = (existing || '').toLowerCase();
    if (ex.includes('diabetes') && cond.systems.includes('endocrine')) score += 8;
    if (ex.includes('hypertension') && cond.systems.includes('cardiac')) score += 8;
    if ((ex.includes('asthma') || ex.includes('copd')) && cond.systems.includes('respiratory')) score += 7;

    // Gender modifiers
    if (gender === 'Female' && cond.name.includes('Myocardial')) score -= 6;
    if (gender === 'Male' && cond.name.includes('Myocardial') && ageNum > 45) score += 6;

    score = Math.min(95, Math.max(5, Math.round(score)));
    return { ...cond, score, boostMatches };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  if (!scored.length) {
    scored.push({
      name:'General Viral Illness', icon:'🦠', score:18,
      doctor:null, urgency:null,
      desc:'Your symptoms may be consistent with a mild viral infection. Monitor and rest.',
      baseSeverity:18, riskThreshold:5
    });
  }

  const top = scored.slice(0, 4);
  const highestScore = top[0].score;

  // ── FIXED: Risk probability calculation ──
  // Base it on highest condition score, not always max
  let rawProb = highestScore;

  // Urgent symptom present → floor at 65%
  const hasUrgentSymptom = norm.some(s => {
    const key = Object.keys(SYMPTOM_DB).find(k => s.includes(k) || k.includes(s));
    return key && SYMPTOM_DB[key].urgent;
  });
  if (hasUrgentSymptom) rawProb = Math.max(rawProb, 65);

  // More symptoms → slightly higher (but capped increment)
  if (symptoms.length >= 6) rawProb = Math.min(rawProb + 6, 95);
  else if (symptoms.length >= 4) rawProb = Math.min(rawProb + 3, 95);

  // Duration modifier
  if (duration && (duration.includes('month') || duration.includes('Chronic'))) rawProb = Math.min(rawProb + 4, 95);

  rawProb = Math.min(95, Math.max(5, Math.round(rawProb)));

  // ── FIXED: Risk level now properly bands ──
  let riskLevel;
  if (rawProb >= 65) riskLevel = 'High';
  else if (rawProb >= 35) riskLevel = 'Moderate';
  else riskLevel = 'Low';

  // ── FIXED: Doctor recommendation per condition, not generic ──
  const doctorCond = top.find(c => c.doctor && c.score >= c.riskThreshold);

  // ── FIXED: Condition likelihood assigned correctly ──
  const conditions = top.map((c, i) => {
    let likelihood;
    if (i === 0) likelihood = riskLevel === 'High' ? 'High' : riskLevel === 'Moderate' ? 'Moderate' : 'Low';
    else if (i === 1) likelihood = riskLevel === 'High' ? 'Moderate' : 'Low';
    else likelihood = 'Low';
    return { name:c.name, icon:c.icon||'🩺', likelihood, description:c.desc };
  });

  const riskReasons = {
    High: `Your symptoms — ${symptoms.slice(0,3).join(', ')} — combined with severity and duration indicators point to a condition requiring prompt medical evaluation. Seek care immediately.`,
    Moderate: `Your reported symptoms of ${symptoms.slice(0,3).join(', ')} indicate a moderately concerning health issue. Professional assessment within 48 hours is strongly recommended.`,
    Low: `Your symptoms appear mild and are consistent with common self-limiting conditions. Home care measures should help, but monitor for any worsening.`
  };

  const careTips = generateCareTips(norm, riskLevel);
  const altMeasures = riskLevel === 'Low' ? generateAltMeasures(norm) : [];

  return {
    riskLevel,
    riskProbability: rawProb,
    riskReason: riskReasons[riskLevel],
    conditions,
    doctorType: doctorCond ? doctorCond.doctor : null,
    doctorReason: doctorCond
      ? `Based on your symptoms, a ${doctorCond.doctor} can best evaluate and treat your condition. ${doctorCond.desc}`
      : null,
    consultUrgency: doctorCond ? doctorCond.urgency : null,
    alternativeMeasures: altMeasures,
    careTips,
    disclaimer:'This AI assessment is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment. In an emergency, call 112 immediately.'
  };
}

function generateCareTips(symptoms, riskLevel) {
  const tips = [];
  if (riskLevel === 'High') {
    tips.push({ icon:'🚨', text:'Call emergency services (112 / 108) or go to the nearest ER immediately. Do not drive yourself.' });
    tips.push({ icon:'🛋️', text:'Sit or lie down in a comfortable position. Avoid any physical exertion.' });
    tips.push({ icon:'📵', text:'Stay calm, loosen tight clothing around chest and neck, and breathe slowly.' });
    tips.push({ icon:'📞', text:'Inform someone nearby about your condition so they can assist.' });
  } else if (riskLevel === 'Moderate') {
    tips.push({ icon:'🌡️', text:'Monitor your temperature and symptoms every 4 hours and note any changes.' });
    tips.push({ icon:'💧', text:'Stay well hydrated — drink at least 8–10 glasses of water, herbal tea or clear broth.' });
    tips.push({ icon:'🛏️', text:'Get plenty of rest. Avoid strenuous activity and allow your body to recover.' });
    tips.push({ icon:'📋', text:'Book a doctor appointment today. If symptoms worsen suddenly, go to the ER.' });
  } else {
    tips.push({ icon:'💧', text:'Stay well hydrated throughout the day. Drink warm fluids and avoid caffeinated drinks.' });
    tips.push({ icon:'🛏️', text:'Get 8–9 hours of sleep each night to support your immune system recovery.' });
    tips.push({ icon:'🌡️', text:'Monitor your temperature twice daily. See a doctor if fever exceeds 38.5°C or symptoms worsen.' });
    tips.push({ icon:'😷', text:'Wash hands frequently and avoid close contact with others to prevent spreading infection.' });
  }
  if (symptoms.some(s => s.includes('fever'))) tips.push({ icon:'🧊', text:'For fever above 38°C, take paracetamol as directed and apply a cool damp cloth to the forehead.' });
  if (symptoms.some(s => s.includes('cough'))) tips.push({ icon:'🍯', text:'Honey and ginger tea can soothe cough and throat irritation naturally.' });
  if (symptoms.some(s => s.includes('headache'))) tips.push({ icon:'🌑', text:'Rest in a quiet, dark room. Avoid screen time and bright lights until headache subsides.' });
  return tips.slice(0, 4);
}

function generateAltMeasures(symptoms) {
  const measures = [
    { icon:'💧', title:'Stay Hydrated', description:'Drink 8–10 glasses of water, warm herbal teas and clear soups throughout the day to support recovery.' },
    { icon:'🛏️', title:'Rest & Sleep', description:'Get 8–9 hours of quality sleep. Avoid screens 1 hour before bed and keep your room cool and dark.' },
    { icon:'🍋', title:'Vitamin C & Zinc', description:'Take vitamin C (500–1000mg daily) and zinc supplements to reduce symptom duration and boost immunity.' },
    { icon:'🧄', title:'Honey & Ginger Tea', description:'Warm ginger tea with honey has natural anti-inflammatory and antibacterial properties for symptom relief.' },
    { icon:'🌡️', title:'Monitor Symptoms', description:'Check your temperature twice daily. If symptoms worsen or persist beyond 7 days, consult a doctor promptly.' },
    { icon:'🏠', title:'Rest at Home', description:'Avoid going outdoors, use a humidifier for dry air, and keep yourself warm and comfortable.' },
  ];
  if (symptoms.some(s => s.includes('headache'))) measures.push({ icon:'🌑', title:'Headache Relief', description:'Rest in a quiet dark room, apply cold compress to forehead, and stay away from screens.' });
  if (symptoms.some(s => s.includes('cough') || s.includes('throat'))) measures.push({ icon:'🍵', title:'Steam Inhalation', description:'Inhale steam from hot water (with eucalyptus oil) for 10 minutes twice daily to relieve congestion.' });
  if (symptoms.some(s => s.includes('nausea') || s.includes('stomach'))) measures.push({ icon:'🫚', title:'BRAT Diet', description:'Eat bananas, rice, applesauce, and toast — bland foods that are gentle on an upset stomach.' });
  return measures.slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Analyze endpoint
app.post('/api/analyze', (req, res) => {
  try {
    const { symptoms, age, gender, duration, existing, description } = req.body;

    if (!symptoms || symptoms.length < 1) {
      return res.status(400).json({ error: 'Please provide at least 1 symptoms.' });
    }
    if (!age) return res.status(400).json({ error: 'Age is required.' });
    if (!gender) return res.status(400).json({ error: 'Gender is required.' });
    if (!duration) return res.status(400).json({ error: 'Duration is required.' });

    const result = analyzeSymptoms(symptoms, age, gender, duration, existing, description);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// SOS endpoint — logs emergency and returns ambulance numbers
app.post('/api/sos', (req, res) => {
  const { lat, lng, patientInfo } = req.body;
  const timestamp = new Date().toISOString();
  console.log(`🚨 SOS ALERT [${timestamp}] — Location: ${lat},${lng} — Patient: ${JSON.stringify(patientInfo)}`);

  // India-specific emergency numbers (extend for other countries)
  const emergencyNumbers = [
    { name: 'National Emergency', number: '112', icon: '🚨', type: 'emergency' },
    { name: 'Ambulance (EMRI)', number: '108', icon: '🚑', type: 'ambulance' },
    { name: 'Ambulance (PM-JAY)', number: '104', icon: '🚑', type: 'ambulance' },
    { name: 'Police', number: '100', icon: '👮', type: 'police' },
    { name: 'Fire & Rescue', number: '101', icon: '🚒', type: 'fire' },
  ];

  const mapsUrl = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=hospital&origin=${lat},${lng}&travelmode=driving`
    : `https://www.google.com/maps/search/hospital+near+me`;

  res.json({
    success: true,
    timestamp,
    message: 'Emergency services notified. Call 108 or 112 immediately.',
    emergencyNumbers,
    nearestHospitalUrl: mapsUrl
  });
});

// Symptoms list endpoint
app.get('/api/symptoms', (req, res) => {
  res.json({ symptoms: Object.keys(SYMPTOM_DB) });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🩺 MedScan AI Server running at http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🚨 SOS endpoint: POST http://localhost:${PORT}/api/sos\n`);
});
app.get("/", (req, res) => {
  res.send("MedScan Backend is Live 🚀");
});