/* ── KPI STAFF ── */
const KPI_IDS = ["dm1", "dm2", "dm3", "dm4", "dm5", "dm6", "dm7", "ht1", "ht2", "ht3", "ht4", "ht5", "wf1", "wf2", "wf3", "wf4", "wf5", "wf6", "ckd1", "ckd2", "ckd3", "ckd4", "as1", "as2", "as3", "as4", "as5", "cp1", "cp2", "cp3", "cp4", "cp5", "cp6", "cp7", "sm1", "sm2", "sm3", "sm4", "sm5", "sm6", "sm7"];
const KPI_MONTHS = ["oct", "nov", "dec", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep"];

async function loadKPIForm() {
  const year = parseInt(document.getElementById('kpi-year').value);
  try {
    const snap = await db.collection('kpi_data').where('year','==',year).get();
    const data = {};
    snap.docs.forEach(d => { data[d.id] = d.data(); });
    KPI_IDS.forEach(kid => {
      const rec = data[kid] || {};
      KPI_MONTHS.forEach(mk => {
        const aEl = document.getElementById('ka-'+kid+'-'+mk);
        const bEl = document.getElementById('kb-'+kid+'-'+mk);
        if(aEl) aEl.value = rec['a_'+mk] || '';
        if(bEl) bEl.value = rec['b_'+mk] || '';
      });
    });
    toast('โหลดข้อมูลสำเร็จ');
  } catch(err) { toast('โหลดไม่สำเร็จ: '+err.message,'err'); }
}

async function saveKPIData() {
  const btn = document.getElementById('btn-save-kpi');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  const year = parseInt(document.getElementById('kpi-year').value);
  try {
    const batch = db.batch();
    KPI_IDS.forEach(kid => {
      const docRef = db.collection('kpi_data').doc(kid);
      const rec = { year, updatedBy: currentUser, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      KPI_MONTHS.forEach(mk => {
        const aEl = document.getElementById('ka-'+kid+'-'+mk);
        const bEl = document.getElementById('kb-'+kid+'-'+mk);
        rec['a_'+mk] = aEl && aEl.value !== '' ? Number(aEl.value) : null;
        rec['b_'+mk] = bEl && bEl.value !== '' ? Number(bEl.value) : null;
      });
      batch.set(docRef, rec, { merge: true });
    });
    await batch.commit();
    toast('บันทึก KPI สำเร็จ (' + KPI_IDS.length + ' ตัวชี้วัด)');
  } catch(err) { toast('บันทึกไม่สำเร็จ: '+err.message,'err'); }
  btn.disabled = false; btn.textContent = '💾 บันทึก KPI ทั้งหมด';
}

// โหลด KPI form เมื่อเปิดหน้า
document.addEventListener('DOMContentLoaded', () => {
  const ky = document.getElementById('kpi-year');
  if(ky) ky.value = (new Date().getFullYear()+543).toString();
});


/* ── EDIT MODE ── */
let _editDocId = null;

async function checkExistingEntry() {
  const dateStr = document.getElementById('e-date').value;
  const banner = document.getElementById('edit-banner');
  const btn = document.getElementById('btn-entry');
  if (!dateStr) {
    _editDocId = null;
    if (banner) banner.style.display = 'none';
    if (btn) btn.textContent = 'บันทึกข้อมูล';
    return;
  }
  try {
    const snap = await db.collection('entries').where('date', '==', dateStr).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      _editDocId = doc.id;
      const d = doc.data();
      const sv = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
      sv('e-clinic', d.clinic);
      sv('e-doctor', d.doctor); sv('e-nurse', d.nurse); sv('e-helper', d.helper); sv('e-clerk', d.clerk);
      sv('e-count', d.count); sv('e-appt', d.appt); sv('e-walkin', d.walkin);
      sv('e-admit', d.admit); sv('e-refer', d.refer); sv('e-tele', d.tele);
      sv('e-screen', d.screen); sv('e-history', d.history);
      sv('e-vision', d.vision); sv('e-eye', d.eye); sv('e-ultrasound', d.ultrasound);
      sv('e-pelvic', d.pelvic); sv('e-special', d.special); sv('e-wound', d.wound);
      sv('e-inject', d.inject); sv('e-ekg', d.ekg); sv('e-dtx', d.dtx); sv('e-other-act', d.otheract);
      sv('e-edu-ind', d.eduInd); sv('e-edu-grp', d.eduGrp); sv('e-rights', d.rights);
      sv('e-appt-out', d.apptOut); sv('e-refer-form', d.referForm);
      sv('e-followup', d.followup); sv('e-counsel', d.counsel);
      sv('e-incident-flag', d.incidentFlag || 'ไม่มี'); sv('e-incident-detail', d.incidentDetail);
      sv('e-note', d.note);
      updateProdPreview();
      if (banner) {
        const [y, m, dd] = dateStr.split('-');
        const bDate = document.getElementById('edit-banner-date');
        if (bDate) bDate.textContent = dd+'/'+m+'/'+y;
        banner.style.display = 'flex';
      }
      if (btn) btn.textContent = 'บันทึกการแก้ไข';
    } else {
      _editDocId = null;
      if (banner) banner.style.display = 'none';
      if (btn) btn.textContent = 'บันทึกข้อมูล';
    }
  } catch(err) { console.error('checkExistingEntry:', err); }
}

/* ── WIZARD ── */
let _wStep = 1;
let _wDir = 1;
const _wTotal = 5;
const _wTitles = ['วันที่และคลินิก','บุคลากรประจำวัน','สถิติผู้รับบริการ','กิจกรรมการพยาบาล','บันทึกเพิ่มเติม'];

function wUpdateUI() {
  const noEl = document.getElementById('wiz-step-no');
  const ttlEl = document.getElementById('wiz-step-ttl');
  if (noEl) noEl.textContent = `ขั้นตอนที่ ${_wStep} จาก ${_wTotal}`;
  if (ttlEl) ttlEl.textContent = _wTitles[_wStep - 1];
  const fill = document.getElementById('wiz-pfill');
  if (fill) fill.style.width = `${(_wStep / _wTotal) * 100}%`;
  document.querySelectorAll('.wdot').forEach((d, i) => {
    d.classList.remove('wactive','wdone');
    if (i + 1 === _wStep) d.classList.add('wactive');
    else if (i + 1 < _wStep) d.classList.add('wdone');
  });
  const aniClass = _wDir >= 0 ? 'wstep-active' : 'wstep-back';
  document.querySelectorAll('.wstep').forEach((el, i) => {
    el.classList.remove('wstep-active','wstep-back');
    if (i + 1 === _wStep) el.classList.add(aniClass);
  });
  const back = document.getElementById('wiz-back');
  const next = document.getElementById('wiz-next');
  const sub = document.getElementById('btn-entry');
  if (back) back.style.visibility = _wStep === 1 ? 'hidden' : 'visible';
  if (next) next.style.display = _wStep === _wTotal ? 'none' : '';
  if (sub) sub.style.display = _wStep === _wTotal ? '' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wNext() {
  if (_wStep === 1) {
    if (!document.getElementById('e-date').value) { alert('กรุณาเลือกวันที่ให้บริการ'); return; }
    if (!document.getElementById('e-clinic').value) { alert('กรุณาเลือกคลินิก'); return; }
  }
  if (_wStep === 3) {
    const v = document.getElementById('e-count').value;
    if (v === '' || Number(v) < 0) { alert('กรุณากรอก OPD Visit รวม'); return; }
  }
  if (_wStep < _wTotal) { _wDir = 1; _wStep++; wUpdateUI(); }
}

function wPrev() {
  if (_wStep > 1) { _wDir = -1; _wStep--; wUpdateUI(); }
}

function wReset() {
  _wStep = 1; _wDir = 1; wUpdateUI();
  ['e-doctor','e-nurse','e-helper','e-clerk'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = 0;
  });
}

function wNumAdj(id, delta) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = Math.max(0, (Number(el.value) || 0) + delta);
  el.dispatchEvent(new Event('input'));
}

/* ── PRODUCTIVITY PREVIEW ── */
function updateProdPreview() {
  const count = Number(document.getElementById('e-count')?.value||0);
  const nurse = Number(document.getElementById('e-nurse')?.value||0);
  const el = document.getElementById('prod-preview');
  if (!el) return;
  if (count>0 && nurse>0) {
    const prod = ((count*0.25)/(nurse*7)*100).toFixed(1);
    const color = Number(prod)>=90&&Number(prod)<=110 ? '#0D9488' : '#C0392B';
    el.textContent = prod + '%';
    el.style.color = color;
  } else { el.textContent = '—'; el.style.color = ''; }
}
document.addEventListener('DOMContentLoaded', () => {
  ['e-count','e-nurse'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateProdPreview);
  });
});




/* ── CONFIG ── */
const firebaseConfig = {
  apiKey: "AIzaSyAqMraTjOyJVO-G1B7j_rmCeim0LEuNERk",
  authDomain: "opd-buengsamamkee.firebaseapp.com",
  projectId: "opd-buengsamamkee",
  storageBucket: "opd-buengsamamkee.firebasestorage.app",
  messagingSenderId: "444798882247",
  appId: "1:444798882247:web:05f0d90d6eded5f6a4c9e2"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let chartW = null, chartC = null, chartT = null, chartP = null, currentUser = '', modalCol = '', modalId = '';

/* ── AUTH ── */
window.addEventListener('load', () => {
  const auth = sessionStorage.getItem('opd-auth');
  const name = sessionStorage.getItem('opd-user');
  if (auth === '1' && name) { currentUser = name; startApp(); }
  else { window.location.href = 'login.html'; return; }
  const today = new Date().toISOString().split('T')[0];
  ['e-date','i-date','n-date'].forEach(id => { const el = document.getElementById(id); if (el) el.value = today; });
  const now = new Date();
  const rMonth = document.getElementById('r-month');
  const rYear  = document.getElementById('r-year');
  if (rMonth) rMonth.value = now.getMonth();
  if (rYear)  rYear.value  = now.getFullYear() + 543;
});

function doLogout() {
  if (!confirm('ออกจากระบบหรือไม่?')) return;
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function startApp() {
  document.getElementById('app').style.display = 'block';
  document.getElementById('nav-name').textContent = currentUser;
  listenDashboard();
  listenIncidents();
  listenNewsAdmin();
  const cy = (new Date().getFullYear()+543).toString();
  ['kpi-year','qa-year'].forEach(id => { const el = document.getElementById(id); if(el) el.value = cy; });
  renderQAStaffForm();
  // Initialize dashboard KPI (auto today + current month)
  const now = new Date();
  loadDashDay(now.toISOString().split('T')[0]);
  const msel = document.getElementById('dash-month-sel');
  const ysel = document.getElementById('dash-year-sel');
  if(msel) msel.value = now.getMonth();
  if(ysel) ysel.value = now.getFullYear();
  loadDashMonth();
}

/* ── QA 6 มิติ STAFF ── */
const QA_IDS_STAFF = ["qa_m1_1","qa_m1_2","qa_m1_3","qa_m2_1","qa_m2_2","qa_m2_3","qa_m2_4","qa_m3_1","qa_m3_2","qa_m3_3","qa_m3_4","qa_m3_5","qa_m3_6","qa_m3_7","qa_m3_8","qa_m4_1","qa_m4_2","qa_m4_3","qa_m4_4","qa_m4_5","qa_m4_6","qa_m4_7","qa_m4_8","qa_m4_9","qa_m5_1","qa_m5_2","qa_m5_3","qa_m5_4","qa_m5_5","qa_m5_6","qa_m6_1","qa_m6_2","qa_m6_3","qa_m6_4","qa_m6_5","qa_m6_6","qa_m6_7","qa_m6_8","qa_m6_9","qa_m6_10"];
const QA_MONTHS = ["oct","nov","dec","jan","feb","mar","apr","may","jun","jul","aug","sep"];

async function loadQAForm() {
  const year = parseInt(document.getElementById('qa-year').value);
  try {
    const snap = await db.collection('qa_data').where('year','==',year).get();
    const data = {};
    snap.docs.forEach(d => { data[d.id] = d.data(); });
    QA_IDS_STAFF.forEach(qid => {
      const rec = data[qid] || {};
      QA_MONTHS.forEach(mk => {
        const el = document.getElementById('qv-'+qid+'-'+mk);
        if(el) el.value = (rec['val_'+mk] !== null && rec['val_'+mk] !== undefined) ? rec['val_'+mk] : '';
      });
    });
    toast('โหลดข้อมูล QA สำเร็จ');
  } catch(err) { toast('โหลดไม่สำเร็จ: '+err.message,'err'); }
}

async function saveQAData() {
  const btn = document.getElementById('btn-save-qa');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  const year = parseInt(document.getElementById('qa-year').value);
  try {
    const batch = db.batch();
    QA_IDS_STAFF.forEach(qid => {
      const docRef = db.collection('qa_data').doc(qid);
      const rec = { year, updatedBy: currentUser, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      QA_MONTHS.forEach(mk => {
        const el = document.getElementById('qv-'+qid+'-'+mk);
        rec['val_'+mk] = el && el.value !== '' ? Number(el.value) : null;
      });
      batch.set(docRef, rec, { merge: true });
    });
    await batch.commit();
    toast('บันทึก QA สำเร็จ (' + QA_IDS_STAFF.length + ' ตัวชี้วัด)');
  } catch(err) { toast('บันทึกไม่สำเร็จ: '+err.message,'err'); }
  btn.disabled = false; btn.textContent = '💾 บันทึก QA ทั้งหมด';
}

function renderQAStaffForm() {
  const container = document.getElementById('qa-form-container');
  if (!container) return;
  const QD = [
    {id:'qa_m1_1',dim:1,name:'ร้อยละของตัวชี้วัดวิสัยทัศน์ที่บรรลุเป้าหมาย',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m1_2',dim:1,name:'ร้อยละของโครงการ/กิจกรรมดำเนินการตามกระบวนการควบคุมภายในที่มีคะแนนความเสี่ยงลดลง',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m1_3',dim:1,name:'ร้อยละของบุคลากรพยาบาลที่มีผลการประเมินจริยธรรมจรรยาบรรณวิชาชีพผ่านเกณฑ์ที่กำหนด',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m2_1',dim:2,name:'ผลิตภาพของงานการพยาบาลผู้ป่วยนอก (Nursing Productivity)',target:'90–110%',unit:'ร้อยละ'},
    {id:'qa_m2_2',dim:2,name:'ระยะเวลารอคอยบริการพยาบาลผู้ป่วยนอกเฉลี่ย',target:'ตามบริบท',unit:'นาที'},
    {id:'qa_m2_3',dim:2,name:'ร้อยละของบุคลากรพยาบาลที่มีชั่วโมงปฏิบัติงานเฉลี่ยมากกว่า 60 ชั่วโมง/สัปดาห์',target:'= 0',unit:'ร้อยละ'},
    {id:'qa_m2_4',dim:2,name:'ร้อยละของอุบัติการณ์/ความเสี่ยงทางการพยาบาลได้รับการจัดการทันเวลาตามที่กำหนด',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m3_1',dim:3,name:'ร้อยละความพึงพอใจของผู้ใช้บริการต่อบริการพยาบาล',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m3_2',dim:3,name:'ร้อยละความพึงพอใจของผู้มีส่วนได้ส่วนเสียต่อหน่วยงานบริการพยาบาล',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m3_3',dim:3,name:'ร้อยละความไม่พึงพอใจของผู้ใช้บริการต่อบริการพยาบาล',target:'< 5%',unit:'ร้อยละ'},
    {id:'qa_m3_4',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับสิทธิหรือการละเมิดสิทธิผู้ใช้บริการ',target:'= 0',unit:'ครั้ง'},
    {id:'qa_m3_5',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับสิทธิหรือการละเมิดสิทธิผู้ใช้บริการกลุ่มเฉพาะ',target:'= 0',unit:'ครั้ง'},
    {id:'qa_m3_6',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับพฤติกรรมบริการของบุคลากรพยาบาล',target:'= 0',unit:'ครั้ง'},
    {id:'qa_m3_7',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับการละเมิดข้อมูลส่วนบุคคล (PDPA)',target:'= 0',unit:'ครั้ง'},
    {id:'qa_m3_8',dim:3,name:'ร้อยละของการแก้ไขและ/หรือการตอบกลับข้อร้องเรียนของผู้ใช้บริการ',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m4_1',dim:4,name:'ร้อยละความผูกพันของบุคลากรพยาบาล',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m4_2',dim:4,name:'ร้อยละความพึงพอใจในงานและบรรยากาศองค์กรของบุคลากรพยาบาล',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m4_3',dim:4,name:'ร้อยละการโอนย้ายและลาออกของบุคลากรพยาบาล',target:'≤ 1%',unit:'ร้อยละ'},
    {id:'qa_m4_4',dim:4,name:'ร้อยละของบุคลากรพยาบาลมีสมรรถนะตามบทบาทหน้าที่และสมรรถนะเฉพาะ',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m4_5',dim:4,name:'ร้อยละของบุคลากรพยาบาลได้รับการอบรมฟื้นฟูทักษะ BLS ≥1 ครั้ง/ปี',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m4_6',dim:4,name:'ร้อยละของบุคลากรพยาบาลได้รับการอบรมฟื้นฟูทักษะ ACLS ≥1 ครั้ง/ปี',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m4_7',dim:4,name:'ร้อยละของบุคลากรพยาบาลได้รับการอบรมฟื้นฟูทักษะการป้องกันและควบคุมการติดเชื้อ ≥1 ครั้ง/ปี',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m4_8',dim:4,name:'ร้อยละของบุคลากรพยาบาลที่ได้รับการตรวจสุขภาพประจำปีและตามความเสี่ยงจากการทำงาน',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m4_9',dim:4,name:'ร้อยละของบุคลากรพยาบาลที่เจ็บป่วยหรือเกิดอุบัติเหตุจากการปฏิบัติงานได้รับการดูแลตามแนวทาง',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m5_1',dim:5,name:'ร้อยละของบุคลากรพยาบาลที่ปฏิบัติตามแนวทางปฏิบัติการพยาบาล',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m5_2',dim:5,name:'ร้อยละของการบันทึกทางการพยาบาลตามเกณฑ์มาตรฐานการพยาบาลในโรงพยาบาล',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m5_3',dim:5,name:'ร้อยละของอุบัติการณ์ภัยพิบัติหรือภาวะฉุกเฉินได้รับการจัดการตามกระบวนการที่กำหนด',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m5_4',dim:5,name:'ร้อยละของฐานข้อมูลจำเป็นตามมาตรฐานการพยาบาลในโรงพยาบาลที่นำมาใช้ประโยชน์',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m5_5',dim:5,name:'ร้อยละขององค์ความรู้และ/หรือนวัตกรรมทางการพยาบาลที่พัฒนาด้วยการจัดการความรู้และนำไปใช้',target:'≥ 80%',unit:'ร้อยละ'},
    {id:'qa_m5_6',dim:5,name:'จำนวนอุบัติการณ์ความไม่พร้อมต่อการช่วยชีวิตฉุกเฉิน',target:'= 0',unit:'ครั้ง'},
    {id:'qa_m6_1',dim:6,name:'ร้อยละของการคัดกรองผู้ใช้บริการถูกต้อง',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m6_2',dim:6,name:'ร้อยละของผู้ป่วยที่อยู่ในภาวะคุกคามชีวิตได้รับการแก้ไขทันทีภายใน 4 นาที',target:'100%',unit:'ร้อยละ'},
    {id:'qa_m6_3',dim:6,name:'อัตราการเกิดอาการเปลี่ยนแปลงของผู้ป่วยโดยไม่ได้คาดการณ์',target:'= 0',unit:'อัตรา'},
    {id:'qa_m6_4',dim:6,name:'อัตราการเกิดภาวะแทรกซ้อนที่ป้องกันได้ (แยกรายโรค/คลินิก)',target:'= 0',unit:'อัตรา'},
    {id:'qa_m6_5',dim:6,name:'อัตราการเกิดอุบัติการณ์ไม่พึงประสงค์ระหว่างส่งต่อหรือเคลื่อนย้าย',target:'= 0',unit:'อัตรา'},
    {id:'qa_m6_6',dim:6,name:'อัตราการกลับเข้ารักษาซ้ำภายใน 48 ชั่วโมงโดยไม่ได้วางแผน',target:'= 0',unit:'อัตรา'},
    {id:'qa_m6_7',dim:6,name:'จำนวนอุบัติการณ์การระบุตัวผู้ป่วยผิดคน',target:'= 0',unit:'ครั้ง'},
    {id:'qa_m6_8',dim:6,name:'ร้อยละของการพลัดตกหกล้มมีความรุนแรงระดับ E–I',target:'= 0',unit:'ร้อยละ'},
    {id:'qa_m6_9',dim:6,name:'อัตราการเกิดการบาดเจ็บจากการจัดท่า ผูกยึด หรือการใช้อุปกรณ์และเครื่องมือ',target:'= 0',unit:'อัตรา'},
    {id:'qa_m6_10',dim:6,name:'ร้อยละของผู้ป่วยที่มาตรวจตามนัดมีความรู้และทักษะการจัดการสุขภาพตนเอง',target:'≥ 80%',unit:'ร้อยละ'},
  ];
  const QDims = [
    {num:1,name:'มิติที่ 1 — ผลลัพธ์ด้านการนำองค์กร',color:'#1E56C4'},
    {num:2,name:'มิติที่ 2 — ผลลัพธ์ด้านประสิทธิภาพ',color:'#0A7C63'},
    {num:3,name:'มิติที่ 3 — ผลลัพธ์ด้านผู้ใช้บริการ',color:'#7C3AED'},
    {num:4,name:'มิติที่ 4 — ผลลัพธ์ด้านบุคลากร',color:'#C0392B'},
    {num:5,name:'มิติที่ 5 — ผลลัพธ์ด้านระบบงานและกระบวนการสำคัญ',color:'#B85C00'},
    {num:6,name:'มิติที่ 6 — ผลลัพธ์ด้านการบริการพยาบาล',color:'#1A7A3A'},
  ];
  const MTH = ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
  let html = '';
  QDims.forEach(dim => {
    const defs = QD.filter(q => q.dim === dim.num);
    const mhCols = MTH.map(m=>`<th style="padding:8px 5px;border:1px solid var(--border);font-size:11px;min-width:54px">${m}</th>`).join('');
    html += `<div style="background:var(--white);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:1rem">
      <div style="padding:.75rem 1.25rem;background:${dim.color};color:#fff;font-size:13.5px;font-weight:600">${dim.name}<span style="font-size:11px;opacity:.8;margin-left:8px">(${defs.length} ตัวชี้วัด)</span></div>
      <div style="overflow-x:auto">
        <table style="border-collapse:collapse;font-size:12px;min-width:900px;width:100%">
          <thead><tr style="background:#f8f9fa">
            <th style="padding:8px 10px;border:1px solid var(--border);text-align:left;min-width:280px">ตัวชี้วัด</th>
            <th style="padding:8px 6px;border:1px solid var(--border);text-align:center;min-width:45px">หน่วย</th>
            <th style="padding:8px 8px;border:1px solid var(--border);text-align:center;min-width:70px">เป้าหมาย</th>
            ${mhCols}
          </tr></thead><tbody>`;
    defs.forEach(qa => {
      const mCells = MTH.map((_,i)=>{
        const mk = QA_MONTHS[i];
        return `<td style="padding:4px;border:1px solid var(--border)"><input type="number" id="qv-${qa.id}-${mk}" step="0.1" min="0" placeholder="—" style="width:52px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-family:inherit;font-size:12px;text-align:center;background:#f0fff4"></td>`;
      }).join('');
      html += `<tr><td style="padding:6px 10px;border:1px solid var(--border);font-size:12.5px">${qa.name}</td><td style="padding:6px 6px;border:1px solid var(--border);text-align:center;font-size:11px;color:#64748B">${qa.unit}</td><td style="padding:6px 8px;border:1px solid var(--border);text-align:center;font-size:11.5px;font-weight:600;color:${dim.color}">${qa.target}</td>${mCells}</tr>`;
    });
    html += `</tbody></table></div></div>`;
  });
  container.innerHTML = html;
}

/* ── NAV ── */
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'docs') loadDocs(currentDocCat);
  if (id === 'news') loadNews();
  if (id === 'entry') wReset();
}

/* ── TOAST ── */
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3000);
}

/* ── HELPERS ── */
function dateTH(s) {
  if (!s) return '—';
  const mo = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const [y,m,d] = s.split('-');
  return `${parseInt(d)} ${mo[parseInt(m)-1]} ${parseInt(y)+543}`;
}
function clinicBadge(c) {
  const m = {'เบาหวาน':'amber','ความดันโลหิตสูง':'red','Warfarin':'teal','ไตเรื้อรัง':'blue','หอบหืด':'green','ปอดอุดกั้นเรื้อรัง (COPD)':'green','เลิกบุหรี่ (One Stop)':'teal','ทั่วไป (OPD)':'blue'};
  return `<span class="badge b-${m[c]||'blue'}">${c||'—'}</span>`;
}
function typeColor(t) { return {'ข่าวประชาสัมพันธ์':'blue','กิจกรรม':'green','ประกาศ':'amber','รายงานการประชุม':'teal'}[t]||'blue'; }
const CLINICS = ['ทั่วไป (OPD)','เบาหวาน','ความดันโลหิตสูง','Warfarin','ไตเรื้อรัง','หอบหืด','ปอดอุดกั้นเรื้อรัง (COPD)','เลิกบุหรี่ (One Stop)'];
const NEWS_TYPES = ['ข่าวประชาสัมพันธ์','กิจกรรม','ประกาศ','รายงานการประชุม'];
function getExt(n) { return (n.split('.').pop()||'FILE').toUpperCase().slice(0,5); }
function getExtCls(n) {
  const e = (n.split('.').pop()||'').toLowerCase();
  if (e==='pdf') return 'ext-pdf';
  if (['doc','docx'].includes(e)) return 'ext-doc';
  if (['xls','xlsx'].includes(e)) return 'ext-xls';
  if (['ppt','pptx'].includes(e)) return 'ext-ppt';
  return 'ext-other';
}
function fmtSize(b) { if(b<1024) return b+'B'; if(b<1048576) return (b/1024).toFixed(1)+'KB'; return (b/1048576).toFixed(1)+'MB'; }

/* ── DASHBOARD ── */
function switchDashTab(tab) {
  const isDay = tab === 'day';
  document.getElementById('dash-panel-day').style.display = isDay ? '' : 'none';
  document.getElementById('dash-panel-month').style.display = isDay ? 'none' : '';
  const dayBtn = document.getElementById('dash-tab-day-btn');
  const monthBtn = document.getElementById('dash-tab-month-btn');
  dayBtn.style.background = isDay ? 'var(--primary)' : 'var(--white)';
  dayBtn.style.color = isDay ? '#fff' : 'var(--text-light)';
  dayBtn.style.fontWeight = isDay ? '600' : '500';
  monthBtn.style.background = isDay ? 'var(--white)' : 'var(--primary)';
  monthBtn.style.color = isDay ? 'var(--text-light)' : '#fff';
  monthBtn.style.fontWeight = isDay ? '500' : '600';
}

function listenDashboard() {
  const now = new Date();
  const mo2=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const dl=document.getElementById('dash-date-label');
  if(dl) dl.textContent=`วันที่ ${now.getDate()} ${mo2[now.getMonth()]} ${now.getFullYear()+543}`;

  db.collection('entries').orderBy('createdAt','desc').onSnapshot(snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // ตารางล่าสุด 10 รายการ
    const tbody = document.getElementById('recent-tbl');
    if(tbody) {
      const recent = docs.slice(0,10);
      if(recent.length) {
        tbody.innerHTML = recent.map(d => {
          const c = Number(d.count||0);
          const n = Number(d.nurse||0);
          const p = n>0 ? ((c*0.25)/(n*7)*100).toFixed(1) : '—';
          const pColor = p!=='—' ? (Number(p)>=90&&Number(p)<=110?'color:#16A34A':'color:#DC2626') : '';
          const ts = d.createdAt?.toDate?.();
          const timeStr = ts ? ts.getHours().toString().padStart(2,'0')+':'+ts.getMinutes().toString().padStart(2,'0')+' น.' : '—';
          return `<tr>
            <td>${dateTH(d.date)}</td>
            <td>${clinicBadge(d.clinic)}</td>
            <td style="text-align:center;font-weight:700;color:var(--blue)">${c.toLocaleString()}</td>
            <td style="text-align:center;font-weight:700;${pColor}">${p}${p!=='—'?'%':''}</td>
            <td style="font-size:12px;color:var(--text3)">${d.userName||'—'}</td>
            <td style="font-size:12px;color:var(--text3)">${timeStr}</td>
            <td style="white-space:nowrap">
              <button class="action-btn edit" onclick="openEditEntry('${d.id}')">แก้ไข</button>
              <button class="action-btn del" onclick="openDelete('entries','${d.id}')">ลบ</button>
            </td>
          </tr>`;
        }).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">ยังไม่มีข้อมูล</td></tr>';
      }
    }
    drawCharts(docs);
  });

  // KPI breakdown per clinic
  const year = new Date().getFullYear()+543;
  const KPI_CLINICS = [
    {key:'DM', name:'เบาหวาน', color:'#E8581A', ids:['dm1','dm2','dm3','dm4','dm5','dm6','dm7']},
    {key:'HT', name:'ความดัน', color:'#C0392B', ids:['ht1','ht2','ht3','ht4','ht5']},
    {key:'Warfarin', name:'Warfarin', color:'#7B4FD4', ids:['wf1','wf2','wf3','wf4','wf5','wf6']},
    {key:'CKD', name:'ไตเรื้อรัง', color:'#0A7C63', ids:['ckd1','ckd2','ckd3','ckd4']},
    {key:'Asthma', name:'หอบหืด', color:'#0052A5', ids:['as1','as2','as3','as4','as5']},
    {key:'COPD', name:'COPD', color:'#B85C00', ids:['cp1','cp2','cp3','cp4','cp5','cp6','cp7']},
    {key:'Smoking', name:'เลิกบุหรี่', color:'#1A7A3A', ids:['sm1','sm2','sm3','sm4','sm5','sm6','sm7']},
  ];
  db.collection('kpi_data').where('year','==',year).get().then(snap => {
    const data = {};
    snap.docs.forEach(d => { data[d.id] = d.data(); });
    let totalPass = 0, totalAll = 0;
    const summaryEl = document.getElementById('kpi-clinic-summary');
    const cards = KPI_CLINICS.map(clinic => {
      const ids = clinic.ids;
      totalAll += ids.length;
      let pass = 0, hasData = false;
      ids.forEach(id => {
        const rec = data[id];
        if (rec) {
          const vals = ['oct','nov','dec','jan','feb','mar','apr','may','jun','jul','aug','sep']
            .map(m => rec['a_'+m]).filter(v => v !== null && v !== undefined && v !== 0);
          if (vals.length > 0) { hasData = true; pass++; }
        }
      });
      totalPass += pass;
      const pct = ids.length > 0 ? Math.round(pass/ids.length*100) : 0;
      const statusColor = !hasData ? '#94A3B8' : pct >= 80 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626';
      const statusText = !hasData ? 'ยังไม่มีข้อมูล' : pct >= 80 ? 'ดี' : pct >= 50 ? 'ปานกลาง' : 'ต้องปรับปรุง';
      return `<div style="text-align:center;padding:.75rem;background:#fff;border-radius:10px;border:1.5px solid ${statusColor}22;cursor:pointer;transition:all .2s" onclick="showPage('kpi',document.getElementById('nb-kpi'))" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="width:32px;height:32px;border-radius:8px;background:${clinic.color}22;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;font-size:14px;color:${clinic.color};font-weight:700">${pass}</div>
        <div style="font-size:11.5px;font-weight:700;color:var(--navy);margin-bottom:2px">${clinic.name}</div>
        <div style="font-size:10px;font-weight:600;color:${statusColor}">${statusText}</div>
        <div style="margin-top:6px;height:3px;background:var(--border);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${statusColor};border-radius:2px;transition:width .8s"></div>
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:3px">${pass}/${ids.length} ตัวชี้วัด</div>
      </div>`;
    }).join('');
    if(summaryEl) summaryEl.innerHTML = cards;
    const passEl = document.getElementById('kpi-pass');
    const passBar = document.getElementById('kpi-pass-bar');
    if(passEl) passEl.textContent = totalPass+'/'+totalAll;
    if(passBar) passBar.style.width = Math.round(totalPass/totalAll*100)+'%';
  }).catch(e => console.error('KPI load:',e));
}

function loadDashDay(dateStr) {
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=(v!==null&&v!==undefined)?v:'—'; };
  db.collection('entries').where('date','==',dateStr).get().then(snap => {
    const docs = snap.docs.map(d=>({id:d.id,...d.data()}));
    const total = docs.reduce((s,d)=>s+Number(d.count||0),0);
    const nurse = docs.reduce((s,d)=>s+Number(d.nurse||0),0);
    const prod = nurse>0 ? ((total*0.25)/(nurse*7)*100).toFixed(1) : null;
    set('kpi-today', total.toLocaleString());
    set('kpi-today-sub', docs.length+' รายการ');
    if(prod) {
      set('kpi-prod', prod+'%');
      const bar=document.getElementById('kpi-prod-bar');
      if(bar) bar.style.width=Math.min(Number(prod)/110*100,100)+'%';
    } else {
      set('kpi-prod','—');
      const bar=document.getElementById('kpi-prod-bar');
      if(bar) bar.style.width='0%';
    }
    const sorted=[...docs].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    const tbody = document.getElementById('day-tbl');
    if (tbody) {
      if (sorted.length) {
        tbody.innerHTML = sorted.map(d => {
          const ts = d.createdAt?.toDate?.();
          const timeStr = ts ? ts.getHours().toString().padStart(2,'0')+':'+ts.getMinutes().toString().padStart(2,'0')+' น.' : '—';
          return `<tr style="border-bottom:.5px solid var(--border)">
            <td style="padding:9px 12px;font-weight:600;color:var(--navy)">${d.clinic||'—'}</td>
            <td style="padding:9px 8px;text-align:center;font-weight:700;color:var(--blue)">${Number(d.count||0).toLocaleString()} ราย</td>
            <td style="padding:9px 8px;font-size:12px;color:var(--text-light)">${timeStr}</td>
            <td style="padding:6px 12px;text-align:right;white-space:nowrap">
              <button class="action-btn edit" onclick="openEditEntry('${d.id}')">แก้ไข</button>
              <button class="action-btn del" onclick="openDelete('entries','${d.id}')">ลบ</button>
            </td>
          </tr>`;
        }).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="4" class="empty" style="padding:.8rem 1rem">ยังไม่มีบันทึก</td></tr>';
      }
    }
  });
  db.collection('incidents').where('date','==',dateStr).get().then(snap => {
    const el=document.getElementById('kpi-incident');
    if(el) el.textContent=snap.size;
  }).catch(()=>{});
}

function loadDashMonth() {
  const msel=document.getElementById('dash-month-sel');
  const ysel=document.getElementById('dash-year-sel');
  if(!msel||!ysel) return;
  const mo=parseInt(msel.value);
  const yr=parseInt(ysel.value);
  const mo2=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const mt=document.getElementById('dash-m-title');
  if(mt) mt.textContent=`${mo2[mo]} ${yr+543}`;
  const startStr=`${yr}-${String(mo+1).padStart(2,'0')}-01`;
  const endStr=new Date(yr,mo+1,1).toISOString().split('T')[0];
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=(v!==null&&v!==undefined)?v:'—'; };
  db.collection('entries').where('date','>=',startStr).where('date','<',endStr).get().then(snap=>{
    const docs=snap.docs.map(d=>({id:d.id,...d.data()}));
    const total=docs.reduce((s,d)=>s+Number(d.count||0),0);
    const days=new Set(docs.map(d=>d.date)).size;
    const avg=days>0?(total/days).toFixed(1):0;
    set('kpi-month',total.toLocaleString());
    set('kpi-avg',avg);
    set('kpi-days',days);
  });
}

function drawCharts(docs) {
  const FONT = {family:"'IBM Plex Sans Thai','Sarabun'",size:11};
  const GRID = {color:'#f0f4f8'};

  // ── กราฟแท่ง 7 วัน ──
  const wLabels=[], wCounts=[];
  for (let i=6;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split('T')[0];
    wLabels.push(d.getDate()+'/'+(d.getMonth()+1));
    wCounts.push(docs.filter(e=>e.date===ds).reduce((s,e)=>s+Number(e.count||0),0));
  }
  if (chartW) chartW.destroy();
  chartW = new Chart(document.getElementById('chart-weekly').getContext('2d'),{
    type:'bar',
    data:{labels:wLabels,datasets:[{label:'ผู้ป่วย',data:wCounts,backgroundColor:'rgba(30,86,196,.75)',borderRadius:6,borderSkipped:false}]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y} ราย`}}},scales:{y:{beginAtZero:true,grid:GRID,ticks:{font:FONT}},x:{grid:{display:false},ticks:{font:FONT}}}}
  });

  // ── โดนัทคลินิก ──
  const cmap={};
  docs.forEach(d=>{const c=d.clinic||'อื่นๆ';cmap[c]=(cmap[c]||0)+Number(d.count||0);});
  if (Object.keys(cmap).length) {
    if (chartC) chartC.destroy();
    chartC = new Chart(document.getElementById('chart-clinic').getContext('2d'),{
      type:'doughnut',
      data:{labels:Object.keys(cmap),datasets:[{data:Object.values(cmap),backgroundColor:['#1E56C4','#0D9488','#D97706','#DC2626','#7C3AED','#0369a1','#be185d','#065f46'],borderWidth:2,borderColor:'#fff',hoverOffset:6}]},
      options:{responsive:true,cutout:'62%',plugins:{legend:{position:'bottom',labels:{font:FONT,boxWidth:11,padding:8}},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.parsed} ราย`}}}}
    });
  }

  // ── กราฟเส้นรายเดือน (ปีงบประมาณ ต.ค.–ก.ย.) ──
  const now=new Date();
  const fyStart = now.getMonth()>=9 ? now.getFullYear() : now.getFullYear()-1;
  const moLabels=['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
  const moCounts=moLabels.map((_,i)=>{
    const yr=i<3?fyStart:fyStart+1;
    const mo=i<3?9+i:i-3;
    return docs.filter(d=>{const dd=new Date(d.date);return dd.getFullYear()===yr&&dd.getMonth()===mo;})
               .reduce((s,d)=>s+Number(d.count||0),0);
  });
  if (chartT) chartT.destroy();
  chartT = new Chart(document.getElementById('chart-monthly-trend').getContext('2d'),{
    type:'line',
    data:{labels:moLabels,datasets:[{label:'ผู้ป่วย',data:moCounts,borderColor:'#1E56C4',backgroundColor:'rgba(30,86,196,.08)',fill:true,tension:.4,pointBackgroundColor:'#1E56C4',pointRadius:4,pointHoverRadius:6}]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y} ราย`}}},scales:{y:{beginAtZero:true,grid:GRID,ticks:{font:FONT}},x:{grid:{display:false},ticks:{font:FONT}}}}
  });

  // ── Productivity รายวัน 7 วัน ──
  const pLabels=[], pVals=[], pColors=[];
  for (let i=6;i>=0;i--) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split('T')[0];
    const dayDocs=docs.filter(e=>e.date===ds);
    const c=dayDocs.reduce((s,e)=>s+Number(e.count||0),0);
    const n=dayDocs.reduce((s,e)=>s+Number(e.nurse||0),0);
    const p=n>0?parseFloat(((c*0.25)/(n*7)*100).toFixed(1)):0;
    pLabels.push(d.getDate()+'/'+(d.getMonth()+1));
    pVals.push(p);
    pColors.push(p>=90&&p<=110?'rgba(13,148,136,.8)':p>0?'rgba(220,38,38,.7)':'rgba(203,213,225,.5)');
  }
  if (chartP) chartP.destroy();
  chartP = new Chart(document.getElementById('chart-prod-weekly').getContext('2d'),{
    type:'bar',
    data:{labels:pLabels,datasets:[
      {label:'Productivity',data:pVals,backgroundColor:pColors,borderRadius:5,borderSkipped:false},
      {label:'เป้าหมาย',data:Array(7).fill(100),type:'line',borderColor:'#D97706',borderWidth:1.5,borderDash:[4,3],pointRadius:0,fill:false}
    ]},
    options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y}%`}}},scales:{y:{beginAtZero:true,max:130,grid:GRID,ticks:{font:FONT,callback:v=>v+'%'}},x:{grid:{display:false},ticks:{font:FONT}}}}
  });
}

function listenIncidents() {
  db.collection('incidents').orderBy('createdAt','desc').onSnapshot(snap => {
    const tbody = document.getElementById('incident-tbl');
    if (snap.empty) { tbody.innerHTML='<tr><td colspan="6" class="empty">ยังไม่มีข้อมูล</td></tr>'; return; }
    const lc={A:'blue',B:'teal',C:'green',D:'amber',E:'red',F:'red'};
    tbody.innerHTML = snap.docs.map(d=>{const e=d.data();return`<tr>
      <td>${dateTH(e.date)}</td>
      <td><span class="badge b-${lc[e.level]||'blue'}">ระดับ ${e.level||'?'}</span></td>
      <td>${e.type||'—'}</td><td>${e.clinic||'—'}</td>
      <td style="font-size:12px;color:var(--text-light)">${e.userName||'—'}</td>
      <td><button class="action-btn del" onclick="openDelete('incidents','${d.id}')">ลบ</button></td>
    </tr>`;}).join('');
  });
}

function listenNewsAdmin() {
  db.collection('news').orderBy('createdAt','desc').onSnapshot(snap => {
    const tbody = document.getElementById('news-tbl');
    if (!tbody) return;
    if (snap.empty) { tbody.innerHTML='<tr><td colspan="6" class="empty">ยังไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = snap.docs.map(d=>{const e=d.data();const link=e.link?`<a href="${e.link}" target="_blank" style="color:var(--blue);font-size:12px">เปิด</a>`:'—';return`<tr>
      <td>${dateTH(e.date)}</td>
      <td><span class="badge b-${typeColor(e.type)}">${e.type||'—'}</span></td>
      <td style="font-weight:500">${e.title||'—'}</td><td>${link}</td>
      <td style="font-size:12px;color:var(--text-light)">${e.userName||'—'}</td>
      <td style="white-space:nowrap">
        <button class="action-btn edit" onclick="openEditNews('${d.id}')">แก้ไข</button>
        <button class="action-btn del" onclick="openDelete('news','${d.id}')">ลบ</button>
      </td></tr>`;}).join('');
  });
}


/* ── MODAL ── */
function closeModal() { document.getElementById('edit-modal').classList.add('hidden'); }
function closeConfirm() { document.getElementById('confirm-modal').classList.add('hidden'); }

async function openEditEntry(id) {
  try {
    const snap = await db.collection('entries').doc(id).get();
    if (!snap.exists) { toast('ไม่พบข้อมูล','err'); return; }
    const d = snap.data();
    modalCol='entries'; modalId=id;
    document.getElementById('modal-title').textContent = 'แก้ไขข้อมูลสถิติ';
    const fn = (v) => v != null && v !== '' ? v : '';
    document.getElementById('modal-body').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="fg2">
          <div class="field"><label>วันที่</label><input type="date" id="m-date" value="${fn(d.date)}"></div>
          <div class="field"><label>คลินิก</label><select id="m-clinic">${CLINICS.map(c=>`<option${d.clinic===c?' selected':''}>${c}</option>`).join('')}</select></div>
        </div>
        <div style="background:#F8FAFC;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin-bottom:10px">1. บุคลากร</div>
          <div class="fg2">
            <div class="field"><label>แพทย์ (คน)</label><input type="number" id="m-doctor" value="${fn(d.doctor)}" min="0" placeholder="0"></div>
            <div class="field"><label>พยาบาล (คน)</label><input type="number" id="m-nurse" value="${fn(d.nurse)}" min="0" placeholder="0"></div>
            <div class="field"><label>ผู้ช่วยเหลือคนไข้ (คน)</label><input type="number" id="m-helper" value="${fn(d.helper)}" min="0" placeholder="0"></div>
            <div class="field"><label>เจ้าหน้าที่เอกสาร (คน)</label><input type="number" id="m-clerk" value="${fn(d.clerk)}" min="0" placeholder="0"></div>
          </div>
        </div>
        <div style="background:#F8FAFC;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin-bottom:10px">2. สถิติผู้รับบริการ</div>
          <div class="fg3">
            <div class="field"><label>OPD Visit (ราย) *</label><input type="number" id="m-count" value="${fn(d.count)||0}" min="0" style="border-color:var(--blue-mid)"></div>
            <div class="field"><label>ผู้ป่วยนัด</label><input type="number" id="m-appt" value="${fn(d.appt)}" min="0" placeholder="0"></div>
            <div class="field"><label>Walk-in</label><input type="number" id="m-walkin" value="${fn(d.walkin)}" min="0" placeholder="0"></div>
            <div class="field"><label>Admit</label><input type="number" id="m-admit" value="${fn(d.admit)}" min="0" placeholder="0"></div>
            <div class="field"><label>Refer Out</label><input type="number" id="m-refer" value="${fn(d.refer)}" min="0" placeholder="0"></div>
            <div class="field"><label>Telemedicine</label><input type="number" id="m-tele" value="${fn(d.tele)}" min="0" placeholder="0"></div>
          </div>
        </div>
        <div style="background:#F8FAFC;border-radius:8px;padding:10px 14px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin-bottom:10px">4. กิจกรรมการพยาบาล (สำคัญ)</div>
          <div class="fg3">
            <div class="field"><label>คัดกรอง</label><input type="number" id="m-screen" value="${fn(d.screen)}" min="0" placeholder="0"></div>
            <div class="field"><label>ทำแผล</label><input type="number" id="m-wound" value="${fn(d.wound)}" min="0" placeholder="0"></div>
            <div class="field"><label>ฉีดยา</label><input type="number" id="m-inject" value="${fn(d.inject)}" min="0" placeholder="0"></div>
            <div class="field"><label>EKG</label><input type="number" id="m-ekg" value="${fn(d.ekg)}" min="0" placeholder="0"></div>
            <div class="field"><label>DTX</label><input type="number" id="m-dtx" value="${fn(d.dtx)}" min="0" placeholder="0"></div>
            <div class="field"><label>สุขศึกษา (คน)</label><input type="number" id="m-eduind" value="${fn(d.eduInd)}" min="0" placeholder="0"></div>
          </div>
        </div>
        <div class="fg2">
          <div class="field"><label>เหตุการณ์สำคัญ</label>
            <select id="m-incident-flag">
              <option value="ไม่มี"${(d.incidentFlag||'ไม่มี')==='ไม่มี'?' selected':''}>ไม่มี</option>
              <option value="มี"${d.incidentFlag==='มี'?' selected':''}>มี ดังนี้</option>
            </select>
          </div>
          <div class="field"><label>รายละเอียดเหตุการณ์</label><input type="text" id="m-incident-detail" value="${fn(d.incidentDetail)}" placeholder="—"></div>
        </div>
        <div class="field"><label>ปัญหา อุปสรรค</label><textarea id="m-note" style="min-height:60px">${fn(d.note)}</textarea></div>
      </div>`;
    document.getElementById('edit-modal').classList.remove('hidden');
  } catch(err) { toast('โหลดไม่สำเร็จ: '+err.message,'err'); }
}

async function openEditNews(id) {
  try {
    const snap = await db.collection('news').doc(id).get();
    if (!snap.exists) { toast('ไม่พบข้อมูล','err'); return; }
    const e = snap.data();
    modalCol='news'; modalId=id;
    document.getElementById('modal-title').textContent = 'แก้ไขข่าว';
    document.getElementById('modal-body').innerHTML = `
      <div class="field" style="margin-bottom:12px"><label>หัวข้อข่าว</label><input type="text" id="m-title" value="${e.title||''}"></div>
      <div class="fg2" style="margin-bottom:12px">
        <div class="field"><label>ประเภท</label><select id="m-type">${NEWS_TYPES.map(t=>`<option${e.type===t?' selected':''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label>วันที่</label><input type="date" id="m-date" value="${e.date||''}"></div>
      </div>
      <div class="field" style="margin-bottom:12px"><label>ลิงก์เอกสาร</label><input type="url" id="m-link" value="${e.link||''}" placeholder="https://..."></div>
      <div class="field"><label>รายละเอียด</label><textarea id="m-detail" style="min-height:60px">${e.detail||''}</textarea></div>`;
    document.getElementById('edit-modal').classList.remove('hidden');
  } catch(err) { toast('โหลดไม่สำเร็จ: '+err.message,'err'); }
}

async function saveModal() {
  const btn = document.getElementById('modal-save-btn');
  btn.disabled=true; btn.textContent='กำลังบันทึก...';
  try {
    let u = { editedBy:currentUser, editedAt:firebase.firestore.FieldValue.serverTimestamp() };
    if (modalCol==='entries') {
      const gn = id => { const el=document.getElementById(id); return el&&el.value!==''?Number(el.value):null; };
      const gv = id => { const el=document.getElementById(id); return el?el.value||null:null; };
      u.date = gv('m-date');
      u.clinic = gv('m-clinic');
      u.count = gn('m-count') || 0;
      u.doctor = gn('m-doctor');
      u.nurse = gn('m-nurse');
      u.helper = gn('m-helper');
      u.clerk = gn('m-clerk');
      u.appt = gn('m-appt');
      u.walkin = gn('m-walkin');
      u.admit = gn('m-admit');
      u.refer = gn('m-refer');
      u.tele = gn('m-tele');
      u.screen = gn('m-screen');
      u.wound = gn('m-wound');
      u.inject = gn('m-inject');
      u.ekg = gn('m-ekg');
      u.dtx = gn('m-dtx');
      u.eduInd = gn('m-eduind');
      u.incidentFlag = gv('m-incident-flag');
      u.incidentDetail = gv('m-incident-detail');
      u.note = gv('m-note');
    } else if (modalCol==='news') {
      u.title=document.getElementById('m-title').value;
      u.type=document.getElementById('m-type').value;
      u.date=document.getElementById('m-date').value;
      u.link=document.getElementById('m-link').value||null;
      u.detail=document.getElementById('m-detail').value||null;
    }
    await db.collection(modalCol).doc(modalId).update(u);
    toast('แก้ไขสำเร็จ'); closeModal();
  } catch(err) { toast('แก้ไขไม่สำเร็จ: '+err.message,'err'); }
  btn.disabled=false; btn.textContent='บันทึกการแก้ไข';
}

function openDelete(col, id) { modalCol=col; modalId=id; document.getElementById('confirm-modal').classList.remove('hidden'); }
async function doDelete() {
  try {
    await db.collection(modalCol).doc(modalId).delete();
    toast('ลบสำเร็จ'); closeConfirm();
  } catch(err) { toast('ลบไม่สำเร็จ: '+err.message,'err'); }
}

/* ── SUBMIT ENTRY ── */
async function submitEntry(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-entry');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  const gv = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  const gn = id => { const el = document.getElementById(id); return el && el.value !== '' ? Number(el.value) : null; };
  try {
    const payload = {
      date: gv('e-date'),
      clinic: gv('e-clinic'),
      doctor: gn('e-doctor'), nurse: gn('e-nurse'), helper: gn('e-helper'), clerk: gn('e-clerk'),
      count: gn('e-count') || 0, appt: gn('e-appt'), walkin: gn('e-walkin'),
      admit: gn('e-admit'), refer: gn('e-refer'), tele: gn('e-tele'),
      screen: gn('e-screen'), history: gn('e-history'),
      vision: gn('e-vision'), eye: gn('e-eye'), ultrasound: gn('e-ultrasound'),
      pelvic: gn('e-pelvic'), special: gn('e-special'), wound: gn('e-wound'),
      inject: gn('e-inject'), ekg: gn('e-ekg'), dtx: gn('e-dtx'), otheract: gn('e-other-act'),
      eduInd: gn('e-edu-ind'), eduGrp: gn('e-edu-grp'), rights: gn('e-rights'),
      apptOut: gn('e-appt-out'), referForm: gn('e-refer-form'),
      followup: gn('e-followup'), counsel: gn('e-counsel'),
      incidentFlag: gv('e-incident-flag') || 'ไม่มี',
      incidentDetail: gv('e-incident-detail') || null,
      note: gv('e-note') || null,
      userName: currentUser,
    };
    if (_editDocId) {
      payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('entries').doc(_editDocId).set(payload);
      toast('แก้ไขข้อมูลสำเร็จ ✓');
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('entries').add(payload);
      toast('บันทึกข้อมูลสำเร็จ ✓');
    }
    clearEntry();
    showPage('dashboard', document.getElementById('nb-dashboard'));
    listenDashboard();
  } catch(err) {
    toast('เกิดข้อผิดพลาด: ' + err.message, 'err');
  }
  btn.disabled = false; btn.textContent = 'บันทึกข้อมูล';
}

function clearEntry() {
  _editDocId = null;
  const banner = document.getElementById('edit-banner');
  if (banner) banner.style.display = 'none';
  const btn = document.getElementById('btn-entry');
  if (btn) btn.textContent = 'บันทึกข้อมูล';
  const fields = ['e-clinic','e-doctor','e-nurse','e-helper','e-clerk',
    'e-count','e-appt','e-walkin','e-admit','e-refer','e-tele',
    'e-screen','e-history','e-vision','e-eye','e-ultrasound','e-pelvic','e-special',
    'e-wound','e-inject','e-ekg','e-dtx','e-other-act',
    'e-edu-ind','e-edu-grp','e-rights','e-appt-out','e-refer-form','e-followup','e-counsel',
    'e-incident-detail','e-note'];
  fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  const flag = document.getElementById('e-incident-flag');
  if(flag) flag.value = 'ไม่มี';
  const pp = document.getElementById('prod-preview');
  if(pp) { pp.textContent = '—'; pp.style.color = ''; }
  wReset();
}

/* ── SUBMIT INCIDENT ── */
async function submitIncident(e) {
  e.preventDefault();
  const btn=document.getElementById('btn-incident');
  btn.disabled=true; btn.textContent='กำลังบันทึก...';
  try {
    await db.collection('incidents').add({
      date:document.getElementById('i-date').value,
      level:document.getElementById('i-level').value,
      type:document.getElementById('i-type').value,
      clinic:document.getElementById('i-clinic').value||null,
      detail:document.getElementById('i-detail').value,
      action:document.getElementById('i-action').value||null,
      userName:currentUser,
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('บันทึกอุบัติการณ์สำเร็จ'); e.target.reset();
    document.getElementById('i-date').value=new Date().toISOString().split('T')[0];
  } catch(err) { toast('เกิดข้อผิดพลาด: '+err.message,'err'); }
  btn.disabled=false; btn.textContent='บันทึกอุบัติการณ์';
}

/* ── SUBMIT NEWS ── */
async function submitNews(e) {
  e.preventDefault();
  const btn=document.getElementById('btn-news');
  btn.disabled=true; btn.textContent='กำลังบันทึก...';
  try {
    await db.collection('news').add({
      title:document.getElementById('n-title').value,
      type:document.getElementById('n-type').value,
      date:document.getElementById('n-date').value,
      detail:document.getElementById('n-detail').value||null,
      link:document.getElementById('n-link').value||null,
      userName:currentUser,
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('เพิ่มข่าวสำเร็จ'); e.target.reset();
    document.getElementById('n-date').value=new Date().toISOString().split('T')[0];
  } catch(err) { toast('เกิดข้อผิดพลาด: '+err.message,'err'); }
  btn.disabled=false; btn.textContent='เพิ่มข่าว';
}

/* ── REPORT ── */
async function loadReport() {
  const month = parseInt(document.getElementById('r-month').value);
  const yearCE = parseInt(document.getElementById('r-year').value) - 543;
  const s = new Date(yearCE, month, 1).toISOString().split('T')[0];
  const end = new Date(yearCE, month+1, 0).toISOString().split('T')[0];
  try {
    const snap = await db.collection('entries').where('date','>=',s).where('date','<=',end).orderBy('date','asc').get();
    const docs = snap.docs.map(d => d.data());
    if (!docs.length) {
      document.getElementById('report-kpi').innerHTML = '';
      document.getElementById('report-summary-tbl').innerHTML = '<tr><td colspan="3" class="empty">ไม่มีข้อมูลในเดือนนี้</td></tr>';
      document.getElementById('report-tbl').innerHTML = '<tr><td colspan="11" class="empty">ไม่มีข้อมูลในเดือนนี้</td></tr>';
      return;
    }
    const total = docs.reduce((a,d)=>a+Number(d.count||0),0);
    const days = new Set(docs.map(d=>d.date)).size;
    const avg = days>0?(total/days).toFixed(1):0;
    const nurseTotal = docs.reduce((a,d)=>a+Number(d.nurse||0),0);
    const prodAvg = (nurseTotal>0)?((total*0.25)/(nurseTotal*7)*100).toFixed(1):null;

    // KPI cards
    document.getElementById('report-kpi').innerHTML = `
      <div class="kpi-card"><div class="kpi-lbl">ผู้ป่วยรวมทั้งเดือน</div><div class="kpi-val">${total.toLocaleString()}</div><div class="kpi-sub">${days} วัน · เฉลี่ย ${avg} ราย/วัน</div></div>
      <div class="kpi-card teal"><div class="kpi-lbl">จำนวนวันที่บันทึก</div><div class="kpi-val">${days}</div><div class="kpi-sub">จาก ${docs.length} รายการ</div></div>
      <div class="kpi-card amber"><div class="kpi-lbl">Productivity เฉลี่ย</div><div class="kpi-val">${prodAvg?prodAvg+'%':'—'}</div><div class="kpi-sub">เป้าหมาย 90–110%</div></div>
      <div class="kpi-card red"><div class="kpi-lbl">เหตุการณ์สำคัญ</div><div class="kpi-val">${docs.filter(d=>d.incidentFlag==='มี').length}</div><div class="kpi-sub">รายการที่มีเหตุการณ์</div></div>`;

    // Summary table
    const sumFields = [
      ['ผู้รับบริการทั้งหมด (OPD Visit)','count'],['ผู้ป่วยนัด','appt'],['Walk-in','walkin'],
      ['Admit','admit'],['Refer Out','refer'],['Telemedicine','tele'],
      ['— 4.1 งานคัดกรองและซักประวัติ —',null],
      ['คัดกรองผู้ป่วย','screen'],['ซักประวัติ','history'],
      ['— 4.2 งานหัตถการ —',null],
      ['วัดสายตาเบื้องต้น','vision'],['ตรวจตาบอดสี','eye'],['อัลตราซาวด์','ultrasound'],
      ['ตรวจภายใน','pelvic'],['ช่วยตรวจพิเศษ','special'],
      ['ทำแผล','wound'],['ฉีดยา','inject'],['EKG','ekg'],['DTX','dtx'],['อื่นๆ','otheract'],
      ['— 4.3 งานให้คำปรึกษา —',null],
      ['สุขศึกษารายบุคคล','eduInd'],['สุขศึกษารายกลุ่ม','eduGrp'],
      ['ประสานสิทธิ','rights'],['ออกใบนัด','apptOut'],['จัดทำใบส่งตัว','referForm'],
      ['ติดตามผลตรวจ','followup'],['ให้คำปรึกษาผู้ป่วยและญาติ','counsel'],
    ];
    document.getElementById('report-summary-tbl').innerHTML = sumFields.map(([label,key]) => {
      if (!key) return `<tr style="background:linear-gradient(135deg,#EFF6FF,#F8FAFC)"><td colspan="3" style="padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)">${label}</td></tr>`;
      const fieldMap = {apptOut:'appt-out',referForm:'refer-form',otheract:'other-act'};
      const k = fieldMap[key] || key;
      const tot = docs.reduce((a,d)=>a+Number(d[k]||d[key]||0),0);
      const avgV = days>0?(tot/days).toFixed(1):0;
      return `<tr><td style="padding:8px 14px">${label}</td><td style="padding:8px 14px;text-align:center;font-weight:600;color:var(--blue)">${tot||'—'}</td><td style="padding:8px 14px;text-align:center">${tot>0?avgV:'—'}</td></tr>`;
    }).join('');

    // Daily detail table
    document.getElementById('report-tbl').innerHTML = docs.map(d => {
      const c=Number(d.count||0), n=Number(d.nurse||0);
      const prod = n>0?((c*0.25)/(n*7)*100).toFixed(1):'—';
      const prodColor = prod!=='—'&&Number(prod)>=90&&Number(prod)<=110?'color:#1A7A3A':prod!=='—'?'color:#C0392B':'';
      const inc = d.incidentFlag==='มี'?'<span style="color:#C0392B;font-weight:600">มี</span>':'ไม่มี';
      return `<tr>
        <td>${dateTH(d.date)}</td>
        <td>${clinicBadge(d.clinic)}</td>
        <td style="text-align:center;font-weight:600;color:var(--blue)">${c||0}</td>
        <td style="text-align:center">${Number(d.appt||0)||0}</td>
        <td style="text-align:center">${Number(d.walkin||0)||0}</td>
        <td style="text-align:center">${Number(d.admit||0)||0}</td>
        <td style="text-align:center">${Number(d.refer||0)||0}</td>
        <td style="text-align:center">${n||0}</td>
        <td style="text-align:center;font-weight:600;${prodColor}">${prod}</td>
        <td style="text-align:center">${inc}</td>
        <td style="font-size:12px;color:var(--text-light)">${d.userName||'—'}</td>
      </tr>`;
    }).join('');
  } catch(err) { toast('โหลดรายงานไม่สำเร็จ: '+err.message,'err'); }
}

/* ── HAMBURGER ── */
var _hbOpen = false;
function toggleHamburger(e) {
  e.stopPropagation();
  _hbOpen ? closeHamburger() : openHamburger();
}
function openHamburger() {
  var btn = document.getElementById('hamburger-btn');
  var menu = document.getElementById('hamburger-menu');
  if (!btn || !menu) return;
  var rect = btn.getBoundingClientRect();
  menu.style.top = (rect.bottom + 6) + 'px';
  menu.style.right = (window.innerWidth - rect.right) + 'px';
  menu.style.left = 'auto';
  menu.style.display = 'block';
  _hbOpen = true;
}
function closeHamburger() {
  var menu = document.getElementById('hamburger-menu');
  if (menu) menu.style.display = 'none';
  _hbOpen = false;
}
function showPageH(id) {
  closeHamburger();
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  var pg = document.getElementById('page-'+id);
  if (pg) pg.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click', function(e) {
  if (!_hbOpen) return;
  var menu = document.getElementById('hamburger-menu');
  var btn = document.getElementById('hamburger-btn');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) closeHamburger();
});

/* ── DASHBOARD SHORTCUTS ── */
function goEntryToday() {
  showPage('entry', document.getElementById('nb-entry'));
  // ตั้งวันที่เป็นวันนี้
  const d = document.getElementById('e-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
}
function goStatsToday() {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-stats').classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(() => {
    const today = new Date().toISOString().split('T')[0];
    const sd = document.getElementById('staff-stats-date');
    if (sd) { sd.value = today; loadStaffDayStats(today); }
  }, 100);
}
function goMonthReport() {
  showPage('report', document.getElementById('nb-report'));
  setTimeout(() => {
    const now = new Date();
    const rm = document.getElementById('r-month');
    const ry = document.getElementById('r-year');
    if (rm) rm.value = now.getMonth();
    if (ry) ry.value = now.getFullYear() + 543;
    loadReport();
  }, 100);
}


/* ── STAFF STATS VIEW ── */
async function loadStaffDayStats(dateStr) {
  if (!dateStr) return;
  const ids = ['ss-doctor','ss-nurserow','ss-helper','ss-clerk',
    'ss-countrow','ss-appt','ss-walkin','ss-admit','ss-refer','ss-tele',
    'ss-screen','ss-history','ss-wound','ss-inject','ss-ekg','ss-dtx',
    'ss-eduind','ss-edugrp','ss-counsel','ss-incident-flag','ss-incident-detail','ss-note','ss-username','ss-count','ss-nurse','ss-prod'];
  ids.forEach(id => { const el=document.getElementById(id); if(el) el.textContent='—'; });
  try {
    const snap = await db.collection('entries').where('date','==',dateStr).get();
    if (snap.empty) { document.getElementById('ss-countrow').textContent='0'; return; }
    const totals={};
    let flag='',detail='',note='',user='';
    const numKeys=['doctor','nurse','helper','clerk','count','appt','walkin','admit','refer','tele',
      'screen','history','wound','inject','ekg','dtx','eduInd','eduGrp','counsel'];
    snap.docs.forEach(d=>{
      const e=d.data();
      numKeys.forEach(k=>{totals[k]=(totals[k]||0)+Number(e[k]||0);});
      if(e.incidentFlag) flag=e.incidentFlag;
      if(e.incidentDetail) detail=e.incidentDetail;
      if(e.note) note=e.note;
      if(e.userName) user=e.userName;
    });
    const map={
      'ss-doctor':'doctor','ss-nurserow':'nurse','ss-helper':'helper','ss-clerk':'clerk',
      'ss-countrow':'count','ss-appt':'appt','ss-walkin':'walkin','ss-admit':'admit',
      'ss-refer':'refer','ss-tele':'tele','ss-screen':'screen','ss-history':'history',
      'ss-wound':'wound','ss-inject':'inject','ss-ekg':'ekg','ss-dtx':'dtx',
      'ss-eduind':'eduInd','ss-edugrp':'eduGrp','ss-counsel':'counsel'
    };
    Object.entries(map).forEach(([elId,key])=>{
      const el=document.getElementById(elId);
      if(el) el.textContent=totals[key]||'—';
    });
    const flagEl=document.getElementById('ss-incident-flag');
    if(flagEl){flagEl.textContent=flag||'ไม่มี';flagEl.style.color=flag==='มี'?'var(--red)':'var(--green)';}
    const detEl=document.getElementById('ss-incident-detail');
    if(detEl) detEl.textContent=detail||'—';
    const noteEl=document.getElementById('ss-note');
    if(noteEl) noteEl.textContent=note||'—';
    const userEl=document.getElementById('ss-username');
    if(userEl) userEl.textContent=user||'—';
    // Productivity
    const c=totals['count']||0, n=totals['nurse']||0;
    const cEl=document.getElementById('ss-count'); if(cEl) cEl.textContent=c;
    const nEl=document.getElementById('ss-nurse'); if(nEl) nEl.textContent=n;
    const pEl=document.getElementById('ss-prod');
    if(pEl){
      if(n>0){
        const p=((c*0.25)/(n*7)*100).toFixed(1);
        pEl.textContent=p+'%';
        pEl.style.color=Number(p)>=90&&Number(p)<=110?'var(--teal)':'var(--red)';
      } else pEl.textContent='—';
    }
  } catch(err){console.error('loadStaffDayStats:',err);}
}

/* ═══════════════════════════════════════════════
   DOCS PAGE
═══════════════════════════════════════════════ */
const FILE_ICON_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
const LINK_ICON_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
/* ── DOC CATEGORY MAP ── */
const DOC_CATS = {
  manual_orient:  { label: 'คู่มือปฐมนิเทศ',   accentCls: 'manual' },
  wi_instruction: { label: 'แนวทางต่างๆ',       accentCls: 'wi'     },
  form_general:   { label: 'แบบฟอร์ม',           accentCls: 'form'   },
  manual_plan:    { label: 'แผนปฏิบัติการ',      accentCls: 'manual' },
  wi_procurement: { label: 'แผนจัดซื้อจัดจ้าง', accentCls: 'wi'     },
  wi_annual:      { label: 'รายงานประจำปี',       accentCls: 'wi'     },
};

function subToMainCat(sub) {
  const map = {
    manual_orient: 'manual_orient', manual_guide: 'wi_instruction', manual_plan: 'manual_plan',
    wi_instruction: 'wi_instruction', wi_other: 'wi_instruction',
    wi_procurement: 'wi_procurement', wi_annual: 'wi_annual',
    form_general: 'form_general', form_incident: 'form_general', form_eval: 'form_general',
  };
  return map[sub] || sub;
  return sub;
}

function subLabel(sub) {
  for (const g of Object.values(DOC_CATS)) {
    if (g.subs[sub]) return g.subs[sub];
  }
  return sub;
}

let currentDocCat = 'manual_orient';
let allDocs = [];

async function loadDocs(cat) {
  currentDocCat = cat;
  const grid = document.getElementById('doc-grid');
  grid.innerHTML = '<p style="color:var(--text-light);font-size:13px;padding:1rem">กำลังโหลด...</p>';
  try {
    const snap = await db.collection('documents').get();
    allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.category !== 'qa')
      .sort((a,b) => {
        const ta = a.addedAt?.seconds || a.addedAt?.toMillis?.() || 0;
        const tb = b.addedAt?.seconds || b.addedAt?.toMillis?.() || 0;
        return tb - ta;
      });
    updateDocBadges();
    renderDocs();
  } catch(e) {
    console.error('loadDocs:', e);
    grid.innerHTML = '<p style="color:var(--red);font-size:13px;padding:1rem">โหลดข้อมูลไม่สำเร็จ</p>';
  }
}

function updateDocBadges() {
  Object.keys(DOC_CATS).forEach(c => {
    const el = document.getElementById('badge-' + c);
    if (el) el.textContent = allDocs.filter(d => subToMainCat(d.category) === c).length;
  });
}

function renderDocs() {
  const search = (document.getElementById('doc-search')?.value || '').toLowerCase();
  const filtered = allDocs.filter(d =>
    subToMainCat(d.category) === currentDocCat &&
    (!search || d.title?.toLowerCase().includes(search) || d.description?.toLowerCase().includes(search))
  );
  const grid = document.getElementById('doc-grid');
  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="doc-empty" style="display:flex;flex-direction:column;align-items:center;grid-column:1/-1">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:var(--border);margin-bottom:10px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p style="color:var(--text-light);font-size:14px">ยังไม่มีเอกสารในหมวดนี้</p>
    </div>`;
    return;
  }

  const accentCls = DOC_CATS[currentDocCat]?.accentCls || 'wi';
  filtered.forEach(doc => {
    const iconCls = ['pdf','word','excel','link'].includes(doc.fileType) ? doc.fileType : 'link';
    const iconSvg = iconCls === 'link' ? LINK_ICON_SVG : FILE_ICON_SVG;
    const date = doc.addedAt?.toDate ? dateTH(doc.addedAt.toDate().toISOString().slice(0,10)) : '—';
    const card = document.createElement('div');
    card.className = 'doc-card';
    card.innerHTML = `
      <div class="doc-card-accent ${accentCls}"></div>
      <div class="doc-card-body">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div class="doc-card-icon ${iconCls}">${iconSvg}</div>
          <div style="flex:1;min-width:0">
            <div class="doc-card-title">${escHtml(doc.title||'ไม่มีชื่อ')}</div>
            ${doc.description ? `<div class="doc-card-desc">${escHtml(doc.description)}</div>` : ''}
          </div>
        </div>
        <div class="doc-card-meta">
          <span>เพิ่มโดย ${escHtml(doc.addedBy||'—')} · ${date}</span>
          <div class="doc-card-actions">
            <a href="${escHtml(doc.url||'#')}" target="_blank" rel="noopener" class="doc-open-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              เปิด
            </a>
            <button class="doc-del-btn" onclick="confirmDeleteDoc('${doc.id}')" aria-label="ลบเอกสาร ${escHtml(doc.title||'')}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function filterDocs() { renderDocs(); }

function switchDocTab(cat, btn) {
  currentDocCat = cat;
  document.querySelectorAll('.doc-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('doc-search').value = '';
  renderDocs();
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let currentDocSource = 'file';

function setDocSource(src) {
  currentDocSource = src;
  const isFile = src === 'file';
  document.getElementById('doc-file-section').style.display = isFile ? '' : 'none';
  document.getElementById('doc-link-section').style.display = isFile ? 'none' : 'flex';
  document.getElementById('doc-src-file-btn').style.background = isFile ? 'var(--primary)' : 'var(--bg)';
  document.getElementById('doc-src-file-btn').style.color = isFile ? '#fff' : 'var(--text)';
  document.getElementById('doc-src-link-btn').style.background = isFile ? 'var(--bg)' : 'var(--primary)';
  document.getElementById('doc-src-link-btn').style.color = isFile ? 'var(--text)' : '#fff';
}

function handleDocFile(input) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  const fileType = ['xls','xlsx'].includes(ext) ? 'excel' : ['doc','docx'].includes(ext) ? 'word' : 'pdf';
  const iconEl = document.getElementById('doc-file-icon');
  iconEl.innerHTML = FILE_ICON_SVG;
  iconEl.dataset.filetype = fileType;
  document.getElementById('doc-file-name').textContent = file.name;
  document.getElementById('doc-file-size').textContent = (file.size/1024/1024).toFixed(2) + ' MB';
  document.getElementById('doc-file-chosen').style.display = 'flex';
  document.getElementById('doc-dropzone').style.display = 'none';
  if (!document.getElementById('doc-title-input').value) {
    document.getElementById('doc-title-input').value = file.name.replace(/\.[^/.]+$/, '');
  }
}

function clearDocFile() {
  document.getElementById('doc-file-input').value = '';
  document.getElementById('doc-file-chosen').style.display = 'none';
  document.getElementById('doc-dropzone').style.display = 'flex';
  document.getElementById('doc-uploaded-url').value = '';
}

/* ── QA DOC PAGE ── */
function qdModuleChange() {}

function qdHandleFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 20MB', 'err'); input.value = ''; return; }
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('qd-file-icon').innerHTML = FILE_ICON_SVG;
  document.getElementById('qd-file-name').textContent = file.name;
  document.getElementById('qd-file-size').textContent = (file.size / 1024).toFixed(0) + ' KB';
  document.getElementById('qd-file-chosen').style.display = 'flex';
  document.getElementById('qd-dropzone').style.display = 'none';
  document.getElementById('qd-uploaded-url').value = '';
  const ftMap = { pdf: 'pdf', doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel' };
  const ft = document.getElementById('qd-filetype'); if(ft) ft.value = ftMap[ext] || 'pdf';
}

function qdClearFile() {
  document.getElementById('qd-file-input').value = '';
  document.getElementById('qd-uploaded-url').value = '';
  document.getElementById('qd-file-chosen').style.display = 'none';
  document.getElementById('qd-dropzone').style.display = 'flex';
  document.getElementById('qd-upload-bar').style.display = 'none';
}

function qdReset() {
  ['qd-module','qd-title','qd-url','qd-desc'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  const ft = document.getElementById('qd-filetype'); if(ft) ft.value = 'pdf';
  qdClearFile();
}

async function qdSave() {
  const module = document.getElementById('qd-module').value;
  const title  = document.getElementById('qd-title').value.trim();
  if (!module) { toast('กรุณาเลือกหมวด QA', 'err'); return; }
  if (!title)  { toast('กรุณากรอกชื่อเอกสาร', 'err'); return; }

  const btn = document.getElementById('qd-save-btn');
  btn.disabled = true;

  let url = document.getElementById('qd-uploaded-url').value;
  const file = document.getElementById('qd-file-input').files[0];

  if (!url && file) {
    document.getElementById('qd-upload-bar').style.display = '';
    try {
      url = await qdUploadFile(file);
      document.getElementById('qd-uploaded-url').value = url;
    } catch(e) {
      toast('อัปโหลดไฟล์ไม่สำเร็จ: ' + e.message, 'err');
      btn.disabled = false;
      document.getElementById('qd-upload-bar').style.display = 'none';
      return;
    }
    document.getElementById('qd-upload-bar').style.display = 'none';
  }

  if (!url) { toast('กรุณาเลือกไฟล์', 'err'); btn.disabled = false; return; }

  const payload = {
    title,
    category:    'qa',
    description: document.getElementById('qd-desc').value.trim(),
    fileType:    document.getElementById('qd-filetype').value,
    url,
    qaModule:    module,
    addedBy:     currentUser || 'staff',
    addedAt:     firebase.firestore.FieldValue.serverTimestamp(),
  };
  try {
    await db.collection('documents').add(payload);
    toast('บันทึกเอกสารสำเร็จ');
    qdReset();
  } catch(err) {
    toast('บันทึกไม่สำเร็จ', 'err');
    console.error(err);
  }
  btn.disabled = false;
}
function openDocModal(editDoc, showQa = false) {
  document.getElementById('doc-modal-title').textContent = editDoc ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร';
  document.getElementById('doc-edit-id').value = editDoc?.id || '';
  document.getElementById('doc-title-input').value = editDoc?.title || '';
  const defaultSub = Object.keys(DOC_CATS[currentDocCat]?.subs || {})[0] || 'wi_instruction';
  document.getElementById('doc-cat-input').value = editDoc?.category || defaultSub;
  document.getElementById('doc-desc-input').value = editDoc?.description || '';
  const qaEl = document.getElementById('doc-qa-module'); if(qaEl) qaEl.value = editDoc?.qaModule || '';
  const qaField = document.getElementById('doc-qa-module-field');
  if (qaField) qaField.style.display = (showQa || editDoc?.qaModule) ? 'flex' : 'none';
  document.getElementById('doc-uploaded-url').value = '';
  clearDocFile();
  if (editDoc?.url) {
    setDocSource('link');
    document.getElementById('doc-url-input').value = editDoc.url;
    document.getElementById('doc-type-input').value = editDoc.fileType || 'link';
  } else {
    setDocSource('file');
    document.getElementById('doc-url-input').value = '';
  }
  document.getElementById('doc-upload-bar').style.display = 'none';
  document.getElementById('doc-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('doc-title-input').focus(), 100);
}

function closeDocModal() {
  document.getElementById('doc-modal').classList.add('hidden');
}

async function saveDoc() {
  const title  = document.getElementById('doc-title-input').value.trim();
  const subcat = document.getElementById('doc-cat-input').value;
  const desc   = document.getElementById('doc-desc-input').value.trim();
  const editId = document.getElementById('doc-edit-id').value;
  if (!title) { toast('กรุณากรอกชื่อเอกสาร','err'); return; }

  let url = '', fileType = 'link';

  if (currentDocSource === 'file') {
    const fileInput = document.getElementById('doc-file-input');
    const preUploaded = document.getElementById('doc-uploaded-url').value;
    if (preUploaded) {
      url = preUploaded;
      fileType = document.getElementById('doc-file-icon').dataset.filetype || 'pdf';
    } else if (fileInput.files[0]) {
      const file = fileInput.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      fileType = ['xls','xlsx'].includes(ext) ? 'excel' : ['doc','docx'].includes(ext) ? 'word' : 'pdf';
      const saveBtn = document.getElementById('doc-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'กำลังอัปโหลด...';
      document.getElementById('doc-upload-bar').style.display = '';
      try {
        url = await uploadDocFile(file);
        document.getElementById('doc-uploaded-url').value = url;
      } catch(e) {
        document.getElementById('doc-upload-bar').style.display = 'none';
        saveBtn.disabled = false; saveBtn.textContent = 'บันทึก';
        toast('อัปโหลดไฟล์ไม่สำเร็จ: ' + e.message, 'err');
        return;
      }
      saveBtn.disabled = false; saveBtn.textContent = 'บันทึก';
      document.getElementById('doc-upload-bar').style.display = 'none';
    } else {
      toast('กรุณาเลือกไฟล์','err'); return;
    }
  } else {
    url = document.getElementById('doc-url-input').value.trim();
    fileType = document.getElementById('doc-type-input').value;
    if (!url) { toast('กรุณากรอก URL','err'); return; }
  }

  const qaModule = document.getElementById('doc-qa-module')?.value || '';
  const data = { title, category: subcat, fileType, url, description: desc,
                 qaModule: qaModule || null, addedBy: currentUser, addedAt: new Date() };
  try {
    if (editId) {
      await db.collection('documents').doc(editId).update(data);
      toast('อัปเดตเอกสารเรียบร้อย');
    } else {
      await db.collection('documents').add(data);
      toast('เพิ่มเอกสารเรียบร้อย');
    }
    closeDocModal();
    loadDocs(currentDocCat);
  } catch(e) {
    console.error('saveDoc:', e);
    toast('บันทึกไม่สำเร็จ','err');
  }
}

const CLOUDINARY_CLOUD_NAME = 'dggv3g2in';
const CLOUDINARY_UPLOAD_PRESET = 'opd_docs';

function cloudinaryUpload(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error('อัปโหลดไม่สำเร็จ (' + xhr.status + ')'));
      }
    };
    xhr.onerror = () => reject(new Error('เครือข่ายขัดข้อง'));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    xhr.send(formData);
  });
}

function uploadDocFile(file) {
  return cloudinaryUpload(file, pct => {
    document.getElementById('doc-upload-fill').style.width = pct + '%';
    document.getElementById('doc-upload-status').textContent = 'กำลังอัปโหลด ' + pct + '%';
  });
}

function qdUploadFile(file) {
  return cloudinaryUpload(file, pct => {
    document.getElementById('qd-upload-fill').style.width = pct + '%';
    document.getElementById('qd-upload-status').textContent = 'กำลังอัปโหลด ' + pct + '%';
  });
}

async function confirmDeleteDoc(id) {
  if (!confirm('ต้องการลบเอกสารนี้หรือไม่?')) return;
  try {
    await db.collection('documents').doc(id).delete();
    toast('ลบเอกสารเรียบร้อย');
    loadDocs(currentDocCat);
  } catch(e) {
    toast('ลบไม่สำเร็จ','err');
  }
}

/* ═══════════════════════════════════════════════
   NEWS PAGE
═══════════════════════════════════════════════ */
const NEWS_CATS = {
  pr:       { label: 'ข่าวประชาสัมพันธ์', cls: 'pr' },
  activity: { label: 'ข่าวกิจกรรม',       cls: 'activity' },
  announce: { label: 'ประกาศ',             cls: 'announce' },
  other:    { label: 'อื่นๆ',              cls: 'other' }
};

let allNews = [];
let currentNewsFilter = 'all';

async function loadNews() {
  const list = document.getElementById('news-list');
  list.innerHTML = '<p style="color:var(--text-light);font-size:13px;padding:.5rem 0">กำลังโหลด...</p>';
  try {
    const snap = await db.collection('news').orderBy('date','desc').get();
    allNews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateNewsBadges();
    renderNews();
  } catch(e) {
    console.error('loadNews:', e);
    list.innerHTML = '<p style="color:var(--red);font-size:13px">โหลดข้อมูลไม่สำเร็จ</p>';
  }
}

function updateNewsBadges() {
  document.getElementById('news-badge-all').textContent      = allNews.length;
  ['pr','activity','announce'].forEach(c => {
    const el = document.getElementById('news-badge-' + c);
    if (el) el.textContent = allNews.filter(n => n.category === c).length;
  });
}

function renderNews() {
  const filtered = currentNewsFilter === 'all' ? allNews : allNews.filter(n => n.category === currentNewsFilter);
  const list = document.getElementById('news-list');
  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div class="news-empty">ยังไม่มีข่าวในหมวดนี้</div>';
    return;
  }
  filtered.forEach(n => {
    const cat  = NEWS_CATS[n.category] || NEWS_CATS.other;
    const date = n.date ? dateTH(n.date) : '—';
    const safeN = JSON.stringify({ id:n.id, title:n.title, category:n.category, date:n.date,
                                   content:n.content, imageUrl:n.imageUrl, status:n.status,
                                   author:n.author }).replace(/'/g,"\\'");

    // ส่วนรูป — แสดงเฉพาะเมื่อมี URL
    const imgSection = n.imageUrl ? `
      <div class="news-card-thumb">
        <img src="${escHtml(n.imageUrl)}" alt=""
             onerror="this.parentElement.style.display='none'">
      </div>` : '';

    // แถบสีซ้ายสำหรับ card ที่ไม่มีรูป
    const catColors = { pr:'var(--blue)', activity:'var(--teal)', announce:'var(--amber)', other:'var(--text-light)' };
    const sideBar = !n.imageUrl
      ? `<div style="width:4px;background:${catColors[n.category]||'var(--blue)'};flex-shrink:0;border-radius:10px 0 0 10px"></div>`
      : '';

    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      ${sideBar}${imgSection}
      <div class="news-card-body">
        <div class="news-card-top">
          <span class="news-cat-badge ${cat.cls}">${cat.label}</span>
        </div>
        <div class="news-card-title">${escHtml(n.title || '—')}</div>
        <div class="news-card-excerpt">${escHtml(n.content || '')}</div>
        ${n.link ? `<a href="${escHtml(n.link)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--blue);font-weight:600;text-decoration:none;margin-top:2px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>เปิดลิงก์แนบ →</a>` : ''}
        <div class="news-card-footer">
          <span class="news-card-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:middle;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${date} · ${escHtml(n.author || '—')}
          </span>
          <div class="news-actions">
            <button class="news-edit-btn" onclick='openNewsModal(JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify({ id:n.id, title:n.title, category:n.category, date:n.date, content:n.content, link:n.link||'', imageUrl:n.imageUrl||'', author:n.author }))}")))'>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              แก้ไข
            </button>
            <button class="news-del-btn" onclick="confirmDeleteNews('${n.id}')" aria-label="ลบข่าว ${escHtml(n.title||'')}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

function switchNewsFilter(filter, btn) {
  currentNewsFilter = filter;
  document.querySelectorAll('#page-news .doc-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNews();
}

function previewNewsImg(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('รูปใหญ่เกิน 5MB','err'); input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('news-img-preview-img').src = e.target.result;
    document.getElementById('news-img-preview').style.display = 'block';
    document.getElementById('news-img-dropzone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearNewsImg() {
  document.getElementById('news-img-file').value = '';
  document.getElementById('news-img-url').value = '';
  document.getElementById('news-img-preview-img').src = '';
  document.getElementById('news-img-preview').style.display = 'none';
  document.getElementById('news-img-dropzone').style.display = 'flex';
}

function compressImage(file, maxW = 900, maxH = 500, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxW / width, maxH / height, 1);
      width  = Math.round(width  * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านรูปไม่ได้')); };
    img.src = url;
  });
}

async function uploadNewsImg() {
  const fileInput = document.getElementById('news-img-file');
  const file = fileInput.files[0];
  if (!file) return document.getElementById('news-img-url').value || '';
  return await compressImage(file);
}

function openNewsModal(editNews) {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('news-modal-title').textContent = editNews ? 'แก้ไขข่าว' : 'เพิ่มข่าว';
  document.getElementById('news-edit-id').value        = editNews?.id || '';
  document.getElementById('news-title-input').value   = editNews?.title || '';
  document.getElementById('news-cat-input').value      = editNews?.category || 'pr';
  document.getElementById('news-date-input').value    = editNews?.date || today;
  document.getElementById('news-content-input').value = editNews?.content || '';
  // รีเซ็ตรูป
  document.getElementById('news-link-input').value  = editNews?.link || '';
  document.getElementById('news-img-file').value = '';
  document.getElementById('news-img-url').value  = editNews?.imageUrl || '';
  if (editNews?.imageUrl) {
    document.getElementById('news-img-preview-img').src = editNews.imageUrl;
    document.getElementById('news-img-preview').style.display = 'block';
    document.getElementById('news-img-dropzone').style.display = 'none';
  } else {
    document.getElementById('news-img-preview').style.display = 'none';
    document.getElementById('news-img-dropzone').style.display = 'flex';
  }
  document.getElementById('news-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('news-title-input').focus(), 100);
}

function closeNewsModal() {
  document.getElementById('news-modal').classList.add('hidden');
}

async function saveNews() {
  const title   = document.getElementById('news-title-input').value.trim();
  const cat     = document.getElementById('news-cat-input').value;
  const date    = document.getElementById('news-date-input').value;
  const content = document.getElementById('news-content-input').value.trim();
  const link    = document.getElementById('news-link-input').value.trim();
  const editId  = document.getElementById('news-edit-id').value;
  if (!title) { toast('กรุณากรอกหัวข้อข่าว','err'); return; }
  if (!date)  { toast('กรุณาเลือกวันที่','err'); return; }

  const saveBtn = document.getElementById('news-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'กำลังบันทึก...';

  try {
    const imageUrl = await uploadNewsImg();
    const data = { title, category: cat, date, content, link, imageUrl,
                   author: currentUser, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    if (editId) {
      await db.collection('news').doc(editId).update(data);
      toast('อัปเดตข่าวเรียบร้อย');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('news').add(data);
      toast('เพิ่มข่าวเรียบร้อย');
    }
    closeNewsModal();
    loadNews();
  } catch(e) {
    console.error('saveNews:', e);
    toast(e.message || 'บันทึกไม่สำเร็จ','err');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> เผยแพร่ข่าว';
  }
}

async function confirmDeleteNews(id) {
  if (!confirm('ต้องการลบข่าวนี้หรือไม่?')) return;
  try {
    await db.collection('news').doc(id).delete();
    toast('ลบข่าวเรียบร้อย');
    loadNews();
  } catch(e) {
    toast('ลบไม่สำเร็จ','err');
  }
}

