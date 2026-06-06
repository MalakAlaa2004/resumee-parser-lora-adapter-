/* ── Backend URL ──────────────────────────────────────────────── */
const BACKEND = 'http://127.0.0.1:5000';

/* ── Entity colours (mirror CandidateLens palette) ────────────── */
const ENTITY_COLORS = {
  "Name":                 "#ffc857",
  "Email Address":        "#2ec4b6",
  "Location":             "#3a86ff",
  "Companies worked at":  "#ff7b72",
  "Designation":          "#ff9f1c",
  "Degree":               "#8ecae6",
  "College Name":         "#43aa8b",
  "Graduation Year":      "#f94144",
  "Skills":               "#a78bfa",
  "Years of Experience":  "#7cb518",
};

/* ── Schema definitions ───────────────────────────────────────── */
const SCHEMA = [
  { field:"Name",                type:"string",      desc:"Full name of the candidate." },
  { field:"Email Address",       type:"string",      desc:"Primary e-mail address." },
  { field:"Location",            type:"string",      desc:"City, state / country of residence." },
  { field:"Companies worked at", type:"list<string>",desc:"All employers mentioned in experience section." },
  { field:"Designation",         type:"list<string>",desc:"Job titles held across all positions." },
  { field:"Degree",              type:"list<string>",desc:"Academic degrees earned." },
  { field:"College Name",        type:"list<string>",desc:"Universities / colleges attended." },
  { field:"Graduation Year",     type:"list<string>",desc:"Year(s) of graduation." },
  { field:"Skills",              type:"list<string>",desc:"Technical & soft skills listed in the resume." },
  { field:"Years of Experience", type:"string",      desc:"Total years of professional experience." },
];

/* ── Sample resumes ───────────────────────────────────────────── */
const SAMPLES = {
  john: `John Smith
Software Engineer - Google

San Francisco, CA - john.smith@gmail.com

WORK EXPERIENCE

Senior Software Engineer
Google - Mountain View, CA
June 2019 to Present

Software Engineer
Amazon - Seattle, WA
January 2016 to May 2019

EDUCATION

Master of Science in Computer Science
Stanford University
2015

Bachelor of Science in Computer Engineering
UC Berkeley
2013

SKILLS

Python, Java, C++, Go, Kubernetes, Docker, TensorFlow, AWS, GCP, SQL, Git, REST APIs, Microservices, Machine Learning

ADDITIONAL INFORMATION

8 years of experience in software engineering`,

  sarah: `Sarah Johnson
Data Scientist

New York, NY - sarah.johnson@outlook.com

WORK EXPERIENCE

Senior Data Scientist
Netflix - Los Gatos, CA
March 2021 to Present

Data Scientist
IBM Watson - New York, NY
July 2018 to February 2021

Junior Data Analyst
Deloitte - Chicago, IL
June 2016 to June 2018

EDUCATION

Master of Science in Statistics
Columbia University
2016

Bachelor of Arts in Mathematics
University of Michigan
2014

SKILLS

Python, R, SQL, Spark, PyTorch, TensorFlow, Scikit-learn, Pandas, Tableau, A/B Testing, NLP, Computer Vision, Docker, AWS SageMaker

EXPERIENCE

5 years of experience in data science and machine learning`,

  ahmed: `Ahmed Al-Rashid
Riyadh, Saudi Arabia - ahmed.rashid99@gmail.com

OBJECTIVE

Recent graduate seeking an entry-level software development position.

EDUCATION

Bachelor of Science in Computer Science
King Saud University
2024

PROJECTS

E-commerce Web Application - Built a full-stack online store using React and Node.js
Chat Bot - Developed a customer service chatbot using Python and NLTK

SKILLS

HTML, CSS, JavaScript, React, Node.js, Python, MySQL, Git, Linux

CERTIFICATIONS

AWS Certified Cloud Practitioner
Google IT Support Professional Certificate`,

  margaret: `Margaret Chen
Chief Technology Officer

Seattle, WA - m.chen@techcorp.com

WORK EXPERIENCE

Chief Technology Officer
CloudScale Inc. - Seattle, WA
January 2020 to Present

Vice President of Engineering
Microsoft - Redmond, WA
April 2015 to December 2019

Engineering Director
Oracle - San Francisco, CA
March 2010 to March 2015

Senior Software Engineer
Intel - Santa Clara, CA
June 2005 to February 2010

EDUCATION

PhD in Computer Science
MIT
2005

Bachelor of Science in Electrical Engineering
Caltech
2000

SKILLS

Cloud Architecture, System Design, Team Leadership, Strategic Planning, Python, Java, C++, Kubernetes, Azure, AWS, Agile, DevOps

ADDITIONAL INFORMATION

20 years of experience in technology leadership`,
};

/* ── Ground-truth parsed outputs (simulate model results) ─────── */
const PARSED = {
  john: {
    "Name": "John Smith",
    "Email Address": "john.smith@gmail.com",
    "Location": "San Francisco, CA",
    "Companies worked at": ["Google", "Amazon"],
    "Designation": ["Senior Software Engineer", "Software Engineer"],
    "Degree": ["Master of Science in Computer Science", "Bachelor of Science in Computer Engineering"],
    "College Name": ["Stanford University", "UC Berkeley"],
    "Graduation Year": ["2015", "2013"],
    "Skills": ["Python","Java","C++","Go","Kubernetes","Docker","TensorFlow","AWS","GCP","SQL","Git","REST APIs","Microservices","Machine Learning"],
    "Years of Experience": "8 years",
  },
  sarah: {
    "Name": "Sarah Johnson",
    "Email Address": "sarah.johnson@outlook.com",
    "Location": "New York, NY",
    "Companies worked at": ["Netflix", "IBM Watson", "Deloitte"],
    "Designation": ["Senior Data Scientist", "Data Scientist", "Junior Data Analyst"],
    "Degree": ["Master of Science in Statistics", "Bachelor of Arts in Mathematics"],
    "College Name": ["Columbia University", "University of Michigan"],
    "Graduation Year": ["2016", "2014"],
    "Skills": ["Python","R","SQL","Spark","PyTorch","TensorFlow","Scikit-learn","Pandas","Tableau","A/B Testing","NLP","Computer Vision","Docker","AWS SageMaker"],
    "Years of Experience": "5 years",
  },
  ahmed: {
    "Name": "Ahmed Al-Rashid",
    "Email Address": "ahmed.rashid99@gmail.com",
    "Location": "Riyadh, Saudi Arabia",
    "Companies worked at": null,
    "Designation": null,
    "Degree": ["Bachelor of Science in Computer Science"],
    "College Name": ["King Saud University"],
    "Graduation Year": ["2024"],
    "Skills": ["HTML","CSS","JavaScript","React","Node.js","Python","MySQL","Git","Linux"],
    "Years of Experience": null,
  },
  margaret: {
    "Name": "Margaret Chen",
    "Email Address": "m.chen@techcorp.com",
    "Location": "Seattle, WA",
    "Companies worked at": ["CloudScale Inc.", "Microsoft", "Oracle", "Intel"],
    "Designation": ["Chief Technology Officer", "Vice President of Engineering", "Engineering Director", "Senior Software Engineer"],
    "Degree": ["PhD in Computer Science", "Bachelor of Science in Electrical Engineering"],
    "College Name": ["MIT", "Caltech"],
    "Graduation Year": ["2005", "2000"],
    "Skills": ["Cloud Architecture","System Design","Team Leadership","Strategic Planning","Python","Java","C++","Kubernetes","Azure","AWS","Agile","DevOps"],
    "Years of Experience": "20 years",
  },
};

/* ── State ────────────────────────────────────────────────────── */
let currentSample = null;
let parsedResult  = null;
let modelReady    = false;
let modelDevice   = null;

/* ── Poll backend /status until model is loaded ───────────────── */
async function pollStatus(){
  const statusEl = document.getElementById('kpi-status');
  const parseBtn = document.getElementById('parse-btn');
  try {
    const r = await fetch(BACKEND + '/status', { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    if(d.error && !d.ready){
      statusEl.textContent = '✗ Load error';
      statusEl.style.color = 'var(--red)';
      parseBtn.disabled = true;
      toast('Model failed to load: ' + d.error, 'error');
      return;
    }
    if(d.ready){
      modelReady  = true;
      modelDevice = d.device;
      statusEl.textContent = '✓ Ready (' + d.device + ')';
      statusEl.style.color = 'var(--green)';
      parseBtn.disabled = false;
      // Update the model KPI to show device
      const kpiRow = document.getElementById('kpi-row');
      const devKpi = kpiRow.querySelector('.kpi:nth-child(2) .kpi-value');
      if(devKpi) devKpi.textContent = d.device.toUpperCase();
      toast('✓ Model loaded on ' + d.device.toUpperCase(), 'success');
    } else {
      statusEl.textContent = '⏳ Loading model…';
      statusEl.style.color = 'var(--yellow)';
      parseBtn.disabled = true;
      setTimeout(pollStatus, 3000); // retry
    }
  } catch(_){
    statusEl.textContent = '⚠ Server offline';
    statusEl.style.color = 'var(--red)';
    parseBtn.disabled = true;
    setTimeout(pollStatus, 4000); // retry
  }
}

// Start polling when page loads
window.addEventListener('load', ()=>{
  document.getElementById('parse-btn').disabled = true;
  pollStatus();
});

/* ── Helpers ──────────────────────────────────────────────────── */
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toast(msg, type='success'){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(el._t);
  el._t = setTimeout(()=>{ el.className=''; }, 2800);
}

function switchTab(name){
  document.querySelectorAll('.tab').forEach((t,i)=>{
    const names = ['inference','schema','about'];
    t.classList.toggle('active', names[i]===name);
  });
  document.querySelectorAll('.tab-panel').forEach(p=>{
    p.classList.toggle('active', p.id==='tab-'+name);
  });
}

function loadSample(key){
  currentSample = key;
  document.getElementById('resume-input').value = SAMPLES[key];
  toast('Sample resume loaded ✓');
}

/* ── Schema tab build ─────────────────────────────────────────── */
(function buildSchema(){
  const tbody = document.getElementById('schema-tbody');
  SCHEMA.forEach((row, i)=>{
    tbody.innerHTML += `
      <tr>
        <td style="color:var(--muted)">${i+1}</td>
        <td style="color:#f8fafc;font-weight:600">${esc(row.field)}</td>
        <td><span class="type-badge">${esc(row.type)}</span></td>
        <td style="color:var(--muted)">${esc(row.desc)}</td>
      </tr>`;
  });
})();

/* ── Legend build ─────────────────────────────────────────────── */
(function buildLegend(){
  const el = document.getElementById('legend-grid');
  Object.entries(ENTITY_COLORS).forEach(([name, color])=>{
    el.innerHTML += `
      <div class="legend-item">
        <div class="legend-dot" style="background:${color}"></div>
        <span style="font-size:.8rem;color:var(--ink)">${esc(name)}</span>
      </div>`;
  });
})();

/* ── Highlight resume text ────────────────────────────────────── */
function highlightResume(text, parsed){
  // Collect all (start, end, entity) spans
  const spans = [];
  const occupied = [];

  function tryAdd(start, end, entity){
    for(const [s,e] of occupied) if(!(end<=s || start>=e)) return;
    occupied.push([start,end]);
    spans.push({start,end,entity});
  }

  for(const [entity, value] of Object.entries(parsed)){
    if(!value) continue;
    const values = Array.isArray(value) ? value : [value];
    for(const v of values){
      if(!v) continue;
      const pattern = v.toString().trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const re = new RegExp(pattern,'gi');
      let m;
      while((m = re.exec(text)) !== null) tryAdd(m.index, m.index+m[0].length, entity);
    }
  }
  spans.sort((a,b)=>a.start-b.start);

  let html = '';
  let cursor = 0;
  for(const {start,end,entity} of spans){
    html += esc(text.slice(cursor,start));
    const color = ENTITY_COLORS[entity] || '#ccc';
    html += `<mark style="background:${color}"><span>${esc(text.slice(start,end))}</span><sup>${esc(entity)}</sup></mark>`;
    cursor = end;
  }
  html += esc(text.slice(cursor));
  return html;
}

/* ── Bar chart ────────────────────────────────────────────────── */
function buildBarChart(parsed){
  const el = document.getElementById('bar-chart');
  el.innerHTML = '';
  SCHEMA.forEach(({field}, idx)=>{
    const val = parsed[field];
    const count = !val ? 0 : Array.isArray(val) ? val.filter(x=>String(x).trim()).length : (String(val).trim() ? 1 : 0);
    const maxCount = 15;
    const pct = Math.min(100, (count / maxCount) * 100);
    const colors = ['#38bdf8','#818cf8','#34d399','#fbbf24','#f87171','#a78bfa','#2ec4b6','#ff9f1c','#8ecae6','#7cb518'];
    const color = colors[idx % colors.length];
    el.innerHTML += `
      <div class="bar-row">
        <div class="bar-label" title="${esc(field)}">${esc(field)}</div>
        <div class="bar-track">
          <div class="bar-fill" id="bar-${idx}" style="width:0%;background:${color}"></div>
        </div>
        <div class="bar-count">${count}</div>
      </div>`;
    setTimeout(()=>{
      const b = document.getElementById('bar-'+idx);
      if(b) b.style.width = pct+'%';
    }, 80 + idx*60);
  });
}

/* ── Result KPIs ──────────────────────────────────────────────── */
function buildResultKPIs(parsed, latencyMs){
  const filled = Object.values(parsed).filter(v=>
    v !== null && v !== undefined && String(v).trim() !== '' &&
    !(Array.isArray(v) && v.length===0)
  ).length;
  const confidence = Math.round((filled/10)*100);
  const confColor  = confidence >= 80 ? 'green' : confidence >= 50 ? 'yellow' : 'red';

  return `
    <div class="kpi"><div class="kpi-label">Fields Extracted</div><div class="kpi-value green">${filled} / 10</div></div>
    <div class="kpi"><div class="kpi-label">Confidence</div><div class="kpi-value ${confColor}">${confidence}%</div></div>
    <div class="kpi"><div class="kpi-label">Latency</div><div class="kpi-value">${latencyMs}ms</div></div>
    <div class="kpi"><div class="kpi-label">Schema</div><div class="kpi-value green">✓ Valid</div></div>`;
}

/* ── Parse from free-form text (heuristic for unknown resumes) ── */
function parseFreely(text){
  const result = {};
  SCHEMA.forEach(s => result[s.field] = null);

  // Name — first non-empty line
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  if(lines.length) result['Name'] = lines[0];

  // Email
  const emailM = text.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i);
  if(emailM) result['Email Address'] = emailM[0];

  // Location patterns
  const locM = text.match(/([A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z\s]+)\s*[-–]\s*[\w.@]+/);
  if(locM) result['Location'] = locM[1].trim() + ', ' + locM[2].trim();

  // Skills section
  const skillsM = text.match(/SKILLS?\s*\n+([\s\S]*?)(?:\n\n|\n[A-Z]{3,}|$)/i);
  if(skillsM) result['Skills'] = skillsM[1].replace(/\n/g,', ').split(/,\s*/).map(s=>s.trim()).filter(Boolean);

  // Years of experience
  const yoeM = text.match(/(\d+)\s+years?\s+of\s+experience/i);
  if(yoeM) result['Years of Experience'] = yoeM[0];

  // Graduation years (4-digit years)
  const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map(m=>m[0]);
  if(years.length) result['Graduation Year'] = [...new Set(years)];

  // Companies — lines ending right before a city or date
  const companies = [];
  lines.forEach(line=>{
    if(/^(google|amazon|microsoft|netflix|ibm|oracle|intel|deloitte|cloudscale|apple|meta|uber|airbnb)/i.test(line)){
      companies.push(line.split(/\s*[-–]\s*/)[0].trim());
    }
  });
  if(companies.length) result['Companies worked at'] = companies;

  // Designations
  const desig = [];
  lines.forEach(line=>{
    if(/(engineer|scientist|analyst|developer|manager|director|officer|architect|lead|intern)/i.test(line) && line.length < 60){
      desig.push(line);
    }
  });
  if(desig.length) result['Designation'] = [...new Set(desig)].slice(0,4);

  // Degrees
  const degreeM = [...text.matchAll(/(bachelor|master|phd|doctorate|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?b\.?a\.?)[^\n]*/gi)];
  if(degreeM.length) result['Degree'] = [...new Set(degreeM.map(m=>m[0].trim()))].slice(0,3);

  // Colleges
  const colleges = [];
  lines.forEach(line=>{
    if(/(university|college|institute|school|caltech|mit|stanford|berkeley)/i.test(line) && line.length < 80){
      colleges.push(line);
    }
  });
  if(colleges.length) result['College Name'] = [...new Set(colleges)].slice(0,3);

  return result;
}

/* ── Render JSON with syntax colouring ────────────────────────── */
function colorJson(obj){
  const jsonStr = JSON.stringify(obj, null, 2);
  return jsonStr
    .replace(/"([^"]+)":/g,  '<span style="color:#93c5fd">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color:#6ee7b7">"$1"</span>')
    .replace(/: \[/g,        ': <span style="color:#fde68a">[</span>')
    .replace(/\]/g,           '<span style="color:#fde68a">]</span>')
    .replace(/: (null)/g,    ': <span style="color:#f87171">null</span>');
}

/* ── Main parse flow ──────────────────────────────────────────── */
async function runParse(){
  const text = document.getElementById('resume-input').value.trim();
  if(!text){ toast('Please paste a resume first.','error'); return; }
  if(!modelReady){ toast('Model is still loading, please wait…','error'); return; }

  const btn       = document.getElementById('parse-btn');
  const prog      = document.getElementById('progress-wrap');
  const fill      = document.getElementById('progress-fill');
  const label     = document.getElementById('progress-label');
  const statusKpi = document.getElementById('kpi-status');

  btn.disabled = true;
  prog.style.display = 'block';
  fill.style.width   = '0%';
  statusKpi.textContent = 'Parsing…';
  statusKpi.style.color = 'var(--yellow)';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('result-area').style.display  = 'none';

  // Show indeterminate progress while waiting for the real model
  label.textContent = 'Sending to local model…';
  fill.style.width  = '20%';
  const t0 = performance.now();

  let parsed;
  try {
    // Animate progress bar while fetch is in-flight
    const anim = setInterval(()=>{
      const cur = parseFloat(fill.style.width) || 20;
      if(cur < 88) fill.style.width = (cur + 1.5) + '%';
    }, 400);

    label.textContent = 'Running inference on ' + (modelDevice||'local') + '…';

    const resp = await fetch(BACKEND + '/parse', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ resume: text }),
    });
    clearInterval(anim);

    const data = await resp.json();
    if(!resp.ok || data.error){
      throw new Error(data.error || 'Server error ' + resp.status);
    }
    parsed = data.result;

  } catch(err){
    prog.style.display = 'none';
    btn.disabled = false;
    statusKpi.textContent = '✗ Error';
    statusKpi.style.color = 'var(--red)';
    toast('Inference failed: ' + err.message, 'error');
    return;
  }

  parsedResult = parsed;
  const latencyMs = Math.round(performance.now() - t0);
  fill.style.width = '100%';
  label.textContent = 'Done!';

  // Render KPIs
  document.getElementById('result-kpis').innerHTML = buildResultKPIs(parsed, latencyMs);

  // Render highlighted resume
  document.getElementById('highlight-box').innerHTML = highlightResume(text, parsed);

  // Render JSON
  document.getElementById('json-box').innerHTML = colorJson(parsed);

  // Bar chart
  buildBarChart(parsed);

  // Show result
  document.getElementById('result-area').style.display = 'block';

  // Cleanup
  prog.style.display    = 'none';
  btn.disabled          = false;
  fill.style.width      = '0%';
  statusKpi.textContent = '✓ Done (' + modelDevice + ')';
  statusKpi.style.color = 'var(--green)';
  toast('Resume parsed successfully ✓');
  currentSample = null;
}
