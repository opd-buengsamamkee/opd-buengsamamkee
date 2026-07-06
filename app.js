const FC={apiKey:"AIzaSyAqMraTjOyJVO-G1B7j_rmCeim0LEuNERk",authDomain:"opd-buengsamamkee.firebaseapp.com",projectId:"opd-buengsamamkee",storageBucket:"opd-buengsamamkee.firebasestorage.app",messagingSenderId:"444798882247",appId:"1:444798882247:web:05f0d90d6eded5f6a4c9e2"};
firebase.initializeApp(FC);
const db=firebase.firestore();
let cW=null,cC=null,cSW=null,cSC=null;

window.addEventListener("load",()=>{listenStats();listenNews();loadDocs("pub-docs-list",["wi_instruction","wi_procurement","wi_annual","wi_other"]);loadDocs("pub-guide-list",["manual_guide","manual_orient","manual_plan"]);listenStatsPage();initClinicToday();});

function initClinicToday(){
  const now=new Date();
  const day=now.getDay(); // 0=อา, 1=จ, 2=อ, 3=พ, 4=พฤ, 5=ศ, 6=ส
  const date=now.getDate();
  const isFirstMon=day===1&&date<=7;
  const isWeekday=day>=1&&day<=5;
  const thDay=["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"][day];

  document.querySelectorAll("[data-clinic-days]").forEach(row=>{
    const spec=row.dataset.clinicDays;
    const open=spec==="first-mon"?isFirstMon:spec.split(",").map(Number).includes(day);
    if(open&&isWeekday) row.classList.add("clinic-today");
  });
}

function toggleDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('nav-doc-menu');
  const btn = document.getElementById('nav-doc-btn');
  const isOpen = menu.style.display === 'block';
  if (isOpen) {
    closeDropdown();
  } else {
    const rect = btn.getBoundingClientRect();
    menu.style.display = 'block';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.animation = 'dropIn .18s ease both';
    menu.querySelectorAll('button').forEach(b=>{
      b.onmouseenter=()=>{b.style.background='rgba(255,255,255,.15)';b.style.color='#fff';b.style.paddingLeft='22px';b.style.transition='all .15s';};
      b.onmouseleave=()=>{b.style.background='transparent';b.style.color='rgba(255,255,255,.75)';b.style.paddingLeft='18px';};
    });
    btn.style.color = '#fff';
    document.getElementById('nav-doc-chevron').style.transform = 'rotate(180deg)';
  }
}
function closeDropdown() {
  const menu = document.getElementById('nav-doc-menu');
  const btn = document.getElementById('nav-doc-btn');
  menu.style.display = 'none';
  btn.style.color = '';
  document.getElementById('nav-doc-chevron').style.transform = '';
}
document.addEventListener('click', e => {
  const btn = document.getElementById('nav-doc-btn');
  const menu = document.getElementById('nav-doc-menu');
  if (!btn.contains(e.target) && !menu.contains(e.target)) closeDropdown();
  const abtn = document.getElementById('nav-about-btn');
  const amenu = document.getElementById('nav-about-menu');
  if (abtn && amenu && !abtn.contains(e.target) && !amenu.contains(e.target)) closeAboutDropdown();
  const qbtn = document.getElementById('nav-qa-btn');
  const qmenu = document.getElementById('nav-qa-menu');
  if (qbtn && qmenu && !qbtn.contains(e.target) && !qmenu.contains(e.target)) closeQaDropdown();
});
function toggleQaDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('nav-qa-menu');
  const btn = document.getElementById('nav-qa-btn');
  const isOpen = menu.style.display === 'block';
  closeDropdown(); closeAboutDropdown();
  if (!isOpen) {
    const rect = btn.getBoundingClientRect();
    menu.style.display = 'block';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.left = rect.left + 'px';
    document.getElementById('nav-qa-chevron').style.transform = 'rotate(180deg)';
  } else {
    closeQaDropdown();
  }
}
function closeQaDropdown() {
  const menu = document.getElementById('nav-qa-menu');
  if (menu) { menu.style.display = 'none'; }
  const ch = document.getElementById('nav-qa-chevron');
  if (ch) ch.style.transform = '';
}

/* ── QA PAGE ── */
const _QA_MODS = {
  1:{title:'การนำองค์กร',                       emoji:'🏛️', bg:'linear-gradient(160deg,#1A0533,#5B21B6)', glow:'0 0 0 3px rgba(192,132,252,.4),0 0 40px rgba(139,92,246,.5)', glowBg:'rgba(139,92,246,.2)'},
  2:{title:'กลยุทธ์',                             emoji:'🎯', bg:'linear-gradient(160deg,#001F4D,#0052A5)', glow:'0 0 0 3px rgba(147,197,253,.4),0 0 40px rgba(59,130,246,.5)',  glowBg:'rgba(59,130,246,.2)'},
  3:{title:'ผู้ใช้บริการ',                        emoji:'🤝', bg:'linear-gradient(160deg,#022C22,#065F46)', glow:'0 0 0 3px rgba(110,231,183,.4),0 0 40px rgba(16,185,129,.5)', glowBg:'rgba(16,185,129,.2)'},
  4:{title:'การวัด วิเคราะห์ และการจัดการความรู้',emoji:'📊', bg:'linear-gradient(160deg,#451A03,#92400E)', glow:'0 0 0 3px rgba(252,211,77,.4),0 0 40px rgba(245,158,11,.5)',  glowBg:'rgba(245,158,11,.2)'},
  5:{title:'บุคลากร',                             emoji:'👩‍⚕️',bg:'linear-gradient(160deg,#0F172A,#1E3A5F)', glow:'0 0 0 3px rgba(125,211,252,.4),0 0 40px rgba(14,165,233,.5)', glowBg:'rgba(14,165,233,.2)'},
  6:{title:'การปฏิบัติการพยาบาล',                emoji:'💊', bg:'linear-gradient(160deg,#3B0014,#9F1239)', glow:'0 0 0 3px rgba(253,164,175,.4),0 0 40px rgba(244,63,94,.5)',   glowBg:'rgba(244,63,94,.2)'},
  7:{title:'ผลลัพธ์ทางการพยาบาล',               emoji:'📈', bg:'linear-gradient(160deg,#1C0A00,#713F12)', glow:'0 0 0 3px rgba(253,211,77,.4),0 0 40px rgba(217,119,6,.5)',   glowBg:'rgba(217,119,6,.2)'},
};
const _QA_BULLET = ['','#8B5CF6','#3B82F6','#10B981','#F59E0B','#0EA5E9','#F43F5E','#D97706'];

async function showQaPage(num) {
  closeQaDropdown();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-qa').classList.add('active');
  const qBtn = document.getElementById('nav-qa-btn');
  if (qBtn) qBtn.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});

  const m = _QA_MODS[num];
  document.getElementById('qa-page-title').textContent = 'หมวด ' + num + ' · ' + m.title;

  const panel = document.getElementById('qa-left-panel');
  panel.style.background = m.bg;
  const glow = document.getElementById('qa-glow');
  glow.textContent = m.emoji;
  glow.style.background = m.glowBg;
  glow.style.boxShadow = m.glow;
  document.getElementById('qa-mod-badge').textContent = 'หมวด ' + num;
  document.getElementById('qa-mod-name').textContent = m.title;

  const listEl = document.getElementById('qa-doc-list');
  listEl.innerHTML = '<div class="news-empty">กำลังโหลด...</div>';
  try {
    const snap = await db.collection('documents').where('qaModule','==',String(num)).get();
    if (snap.empty) {
      listEl.innerHTML = '<div class="news-empty">ยังไม่มีเอกสารในหมวดนี้</div>';
      return;
    }
    const docs = snap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>(b.addedAt?.seconds||0)-(a.addedAt?.seconds||0));
    const ftLabel = {pdf:'PDF',word:'Word',excel:'Excel',link:'Link'};
    const bullet = _QA_BULLET[num];
    listEl.innerHTML = docs.map(doc => {
      const ft = doc.fileType || 'link';
      return `<a href="${escHtmlAttr(doc.url||'#')}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:.55rem 0;border-bottom:1px solid var(--border2);text-decoration:none;color:inherit">
        <div style="width:9px;height:9px;border-radius:2px;background:${bullet};opacity:.75;flex-shrink:0"></div>
        <span style="font-size:14px;font-weight:600;color:#3B5BDB;flex:1;line-height:1.4">${escHtmlAttr(doc.title||'ไม่มีชื่อ')}</span>
        <span style="font-size:10px;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:4px;background:var(--primary-light);color:var(--primary)">${ftLabel[ft]||ft}</span>
      </a>`;
    }).join('');
  } catch(err) {
    listEl.innerHTML = '<div class="news-empty">โหลดไม่สำเร็จ</div>';
    console.error(err);
  }
}

function escHtmlAttr(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function toggleAboutDropdown(e){
  e.stopPropagation();
  const menu=document.getElementById('nav-about-menu');
  const btn=document.getElementById('nav-about-btn');
  const isOpen=menu.style.display==='block';
  closeDropdown();
  closeAboutDropdown();
  if(!isOpen){
    const rect=btn.getBoundingClientRect();
    menu.style.display='block';
    menu.style.top=(rect.bottom+4)+'px';
    menu.style.left=rect.left+'px';
    menu.style.animation='dropIn .18s ease both';
    menu.querySelectorAll('button').forEach(b=>{
      b.onmouseenter=()=>{b.style.background='rgba(255,255,255,.15)';b.style.color='#fff';b.style.paddingLeft='22px';};
      b.onmouseleave=()=>{b.style.background='transparent';b.style.color='rgba(255,255,255,.75)';b.style.paddingLeft='18px';};
    });
    btn.style.color='#fff';
    document.getElementById('nav-about-chevron').style.transform='rotate(180deg)';
  }
}
function closeAboutDropdown(){
  const menu=document.getElementById('nav-about-menu');
  const btn=document.getElementById('nav-about-btn');
  if(menu) menu.style.display='none';
  if(btn) btn.style.color='';
  const chev=document.getElementById('nav-about-chevron');
  if(chev) chev.style.transform='';
}
function showAboutPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.getElementById('nav-about-btn').classList.add('active');
  closeAboutDropdown();
  window.scrollTo({top:0,behavior:'smooth'});
}
function showDocPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.getElementById('nav-doc-btn').classList.add('active');
  closeDropdown();
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='forms' && !document.getElementById('pub-forms-list').dataset.loaded) {
    loadDocs('pub-forms-list',['form_general','form_incident','form_eval']);
    document.getElementById('pub-forms-list').dataset.loaded='1';
  }
}
function showPage(id,btn){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));document.getElementById("page-"+id).classList.add("active");if(btn)btn.classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function showTab(id,btn){const w=btn.closest(".wrap");w.querySelectorAll(".tab-pane").forEach(p=>p.classList.remove("active"));w.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));document.getElementById(id).classList.add("active");btn.classList.add("active");}

function dTH(s){if(!s)return"—";const mo=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];const[y,m,d]=s.split("-");return`${parseInt(d)} ${mo[parseInt(m)-1]} ${parseInt(y)+543}`;}
const NEWS_CAT_MAP={
  pr:       {label:"ข่าวประชาสัมพันธ์", color:"#0052A5", bg:"#EBF4FF"},
  activity: {label:"ข่าวกิจกรรม",       color:"#1A7A3A", bg:"#E4F5EA"},
  announce: {label:"ประกาศ",             color:"#B85C00", bg:"#FEF0E0"},
  other:    {label:"อื่นๆ",              color:"#4B5563", bg:"#F3F4F6"},
  // legacy Thai-text keys
  "ข่าวประชาสัมพันธ์":{label:"ข่าวประชาสัมพันธ์",color:"#0052A5",bg:"#EBF4FF"},
  "กิจกรรม":          {label:"ข่าวกิจกรรม",      color:"#1A7A3A",bg:"#E4F5EA"},
  "ประกาศ":           {label:"ประกาศ",            color:"#B85C00",bg:"#FEF0E0"},
  "รายงานการประชุม":  {label:"รายงานการประชุม",   color:"#0A7C63",bg:"#E3F5F0"},
};
function catInfo(k){return NEWS_CAT_MAP[k]||{label:k||"ข่าว",color:"#0052A5",bg:"#EBF4FF"};}
function tColor(t){return catInfo(t).color;}
function tBg(t){return catInfo(t).bg;}
function catLabel(t){return catInfo(t).label;}
function gExt(n){if(!n)return"FILE";return(n.split(".").pop()||"FILE").toUpperCase().slice(0,5);}
function gExtCls(n){if(!n)return"ext-other";const e=(n.split(".").pop()||"").toLowerCase();if(e==="pdf")return"ext-pdf";if(["doc","docx"].includes(e))return"ext-doc";if(["xls","xlsx"].includes(e))return"ext-xls";if(["ppt","pptx"].includes(e))return"ext-ppt";return"ext-other";}
const DOC_LABEL_MAP={wi_instruction:"Work Instruction (WI)",wi_procurement:"แผนจัดซื้อจัดจ้าง",wi_annual:"รายงานประจำปี",wi_other:"อื่นๆ (WI)",form_general:"แบบฟอร์มทั่วไป",form_incident:"แบบฟอร์มรายงานอุบัติการณ์",form_eval:"แบบฟอร์มประเมินผล",manual_orient:"คู่มือปฐมนิเทศ",manual_plan:"แผนปฏิบัติการ",manual_guide:"คู่มือ / แนวทางปฏิบัติ"};
function dName(d){return d.title||d.displayName||d.name||d.fileName||'ไม่ทราบชื่อ';}
function dExt(d){if(d.fileType){const m={pdf:'PDF',word:'Word',excel:'Excel',link:'Link'};return m[d.fileType]||d.fileType.toUpperCase();}return gExt(d.fileName||d.name);}
function dExtCls(d){if(d.fileType){const m={pdf:'ext-pdf',word:'ext-doc',excel:'ext-xls',link:'ext-other'};return m[d.fileType]||'ext-other';}return gExtCls(d.fileName||d.name);}
function dSort(a,b){const ta=a.addedAt?.toMillis?.()??a.addedAt?.seconds*1000??a.createdAt?.toMillis?.()??0;const tb=b.addedAt?.toMillis?.()??b.addedAt?.seconds*1000??b.createdAt?.toMillis?.()??0;return tb-ta;}
function dRow(d){return`<div class="doc-row"><span class="dext ${dExtCls(d)}">${dExt(d)}</span><span class="dname">${dName(d)}</span><a href="${d.url||'#'}" target="_blank" ${d.fileType==='link'?'':'download'} class="ddl">${d.fileType==='link'?'เปิด':'ดาวน์โหลด'}</a></div>`;}

function listenStats(){
  const now=new Date(),ms=new Date(now.getFullYear(),now.getMonth(),1);
  db.collection("entries").orderBy("date","desc").onSnapshot(snap=>{
    const docs=snap.docs.map(d=>d.data());
    const mD=docs.filter(d=>new Date(d.date)>=ms);
    const tot=mD.reduce((s,d)=>s+Number(d.count||0),0);
    const cTot=mD.filter(d=>d.clinic&&d.clinic!=="ทั่วไป (OPD)").reduce((s,d)=>s+Number(d.count||0),0);
    const satV=docs.filter(d=>d.sat).map(d=>Number(d.sat));
    const satA=satV.length?(satV.reduce((a,b)=>a+b,0)/satV.length).toFixed(1):null;
    const hV=docs.filter(d=>d.hba1c).map(d=>Number(d.hba1c));
    const hA=hV.length?(hV.reduce((a,b)=>a+b,0)/hV.length).toFixed(1):null;
    const cV=docs.filter(d=>d.ctrl).map(d=>Number(d.ctrl));
    const cA=cV.length?(cV.reduce((a,b)=>a+b,0)/cV.length).toFixed(1):null;
    const set=(id,v)=>{const el=document.getElementById(id);if(el&&v!==null)el.textContent=v;};
    set("h-patients",tot.toLocaleString());set("h-sat",satA?satA+"%":"—%");
    set("s-patients",tot.toLocaleString());set("s-clinics",cTot.toLocaleString());set("s-clinics2",cTot.toLocaleString());
    set("s-sat",satA||"—");set("s-hba1c",hA||"—");
    set("p-patients",tot.toLocaleString());set("p-sat",satA?satA+"%":"—%");set("p-ctrl",cA?cA+"%":"—%");
    if(satA)document.getElementById("pb-s").style.width=Math.min(Number(satA),100)+"%";
    if(cA)document.getElementById("pb-c").style.width=Math.min(Number(cA),100)+"%";
    drawC(docs,"chart-weekly","chart-clinic",(w,c)=>{cW=w;cC=c;},cW,cC);
  });
  db.collection("incidents").onSnapshot(snap=>{const ms2=new Date();ms2.setDate(1);ms2.setHours(0,0,0,0);const piEl=document.getElementById("p-incident");if(piEl)piEl.textContent=snap.docs.filter(d=>new Date(d.data().date)>=ms2).length;});
}

function drawC(docs,wId,cId,cb,oldW,oldC){
  const labels=[],counts=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split("T")[0];labels.push(d.getDate()+"/"+(d.getMonth()+1));counts.push(docs.filter(e=>e.date===ds).reduce((s,e)=>s+Number(e.count||0),0));}
  const c1=document.getElementById(wId);
  if(c1){if(oldW)oldW.destroy();const nW=new Chart(c1.getContext("2d"),{type:"bar",data:{labels,datasets:[{label:"ผู้ป่วย",data:counts,backgroundColor:"#0052A5",borderRadius:6,hoverBackgroundColor:"#003D7A"}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:"#E8EDF6"},ticks:{font:{family:"IBM Plex Sans Thai",size:11},color:"#6B7A8D"}},x:{grid:{display:false},ticks:{font:{family:"IBM Plex Sans Thai",size:11},color:"#6B7A8D"}}}}});if(cb)cb(nW,oldC);}
  const cmap={};docs.forEach(d=>{const c=d.clinic||"อื่นๆ";cmap[c]=(cmap[c]||0)+Number(d.count||0);});
  const c2=document.getElementById(cId);
  if(c2&&Object.keys(cmap).length){if(oldC)oldC.destroy();const nC=new Chart(c2.getContext("2d"),{type:"doughnut",data:{labels:Object.keys(cmap),datasets:[{data:Object.values(cmap),backgroundColor:["#0052A5","#0A7C63","#B85C00","#C0392B","#7B4FD4","#00B4D8","#C8960C","#1A7A3A"],borderWidth:0,hoverOffset:6}]},options:{responsive:true,cutout:"62%",plugins:{legend:{position:"bottom",labels:{font:{family:"IBM Plex Sans Thai",size:11},boxWidth:10,padding:10}}}}});if(cb)cb(cW,nC);}
}

function listenNews(){
  db.collection("news").orderBy("createdAt","desc").onSnapshot(snap=>{
    const docs=snap.docs.map(d=>d.data());
    const calSVG=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

    const getCat=d=>d.category||d.type||'other';
    const nHTML=d=>{
      const cat=getCat(d);
      const body=d.content||d.detail||'';
      return`<div class="ncard">
        <div class="ncard-top">
          <span class="nbadge" style="background:${tBg(cat)};color:${tColor(cat)}">${catLabel(cat)}</span>
          <span class="ndate">${dTH(d.date)}</span>
        </div>
        <div class="ntitle">${d.title||"—"}</div>
        ${body?`<div class="nsub">${body}</div>`:''}
        ${d.link?`<a href="${d.link}" target="_blank" style="font-size:12px;color:var(--primary);font-weight:500;text-decoration:none;margin-top:4px;display:inline-block">เปิดเอกสาร →</a>`:''}
      </div>`;
    };

    const hn=document.getElementById("home-news");
    if(hn){
      if(!docs.length){hn.innerHTML='<div class="news-empty">ยังไม่มีข่าวสาร</div>';}
      else{
        const catGradients={pr:'linear-gradient(135deg,#1E3A8A,#3B82F6)',activity:'linear-gradient(135deg,#065F46,#10B981)',announce:'linear-gradient(135deg,#92400E,#F59E0B)',other:'linear-gradient(135deg,#374151,#6B7280)'};
        const nhCard=d=>{
          const cat=getCat(d);const img=d.imageUrl||d.img||'';
          const lnk=d.link?`href="${d.link}" target="_blank"`:`href="#" onclick="showPage('news')"`;
          const body=d.content||d.detail||'';
          return`<a class="nh-card" ${lnk}>
            <div class="nh-card-img" style="background:${catGradients[cat]||catGradients.other}">
              ${img?`<img src="${img}" alt="" onerror="this.style.display='none'">`:''}
              <div class="nh-card-img-fallback">📰</div>
            </div>
            <div class="nh-card-body">
              <div class="nh-card-top">
                <span class="nbadge" style="background:${tBg(cat)};color:${tColor(cat)}">${catLabel(cat)}</span>
              </div>
              <div class="nh-card-title">${d.title||'—'}</div>
              ${body?`<div class="nh-card-excerpt">${body}</div>`:''}
              <div class="nh-card-footer">
                <span class="nh-card-date">${calSVG}${dTH(d.date)}</span>
                ${d.link?`<span class="nh-card-link">เปิดลิงก์ →</span>`:''}
              </div>
            </div>
          </a>`;
        };
        hn.innerHTML=`<div class="nh-grid">${docs.slice(0,6).map(nhCard).join('')}</div>`;
      }
    }

    // หน้าข่าวสาร — กรองตาม category (รองรับทั้ง key ใหม่และ type เก่า)
    const catMap={pr:"news-pr", activity:"news-act", announce:"news-meet",
                  "ข่าวประชาสัมพันธ์":"news-pr","กิจกรรม":"news-act","รายงานการประชุม":"news-meet"};
    const grouped={};
    docs.forEach(d=>{const id=catMap[getCat(d)];if(id){if(!grouped[id])grouped[id]=[];grouped[id].push(d);}});
    Object.entries(catMap).forEach(([,id])=>{
      const el=document.getElementById(id);if(!el)return;
      const items=grouped[id]||[];
      el.innerHTML=items.length?items.map(nHTML).join(''):'<div class="news-empty">ยังไม่มีข้อมูล</div>';
    });
  });
}

async function loadDocs(containerId,cats){
  try{
    const snap=await db.collection("documents").get();
    let docs=snap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>!cats||cats.includes(d.category)).sort(dSort);
    const el=document.getElementById(containerId);if(!el)return;
    if(!docs.length){el.innerHTML='<div class="news-empty">ยังไม่มีเอกสาร</div>';return;}
    const grp={};docs.forEach(d=>{const cat=d.category||"other";if(!grp[cat])grp[cat]=[];grp[cat].push(d);});
    el.innerHTML=Object.entries(grp).map(([cat,items])=>`<div class="doc-cat-lbl">${DOC_LABEL_MAP[cat]||cat}</div><div class="doc-wrap">${items.map(dRow).join("")}</div>`).join("");
  }catch(err){console.error(err);}
}

function listenStatsPage(){
  const now=new Date(),todayStr=now.toISOString().split("T")[0],ms=new Date(now.getFullYear(),now.getMonth(),1);
  db.collection("entries").orderBy("date","desc").onSnapshot(snap=>{
    const docs=snap.docs.map(d=>d.data());
    const tD=docs.filter(d=>d.date===todayStr),mD=docs.filter(d=>new Date(d.date)>=ms);
    const set=(id,v)=>{const el=document.getElementById(id);if(el&&v!==null)el.textContent=v;};
    set("st-today",tD.reduce((s,d)=>s+Number(d.count||0),0).toLocaleString());
    set("st-month",mD.reduce((s,d)=>s+Number(d.count||0),0).toLocaleString());
    const satV=docs.filter(d=>d.sat).map(d=>Number(d.sat));
    const satA=satV.length?(satV.reduce((a,b)=>a+b,0)/satV.length).toFixed(1):null;
    const hV=docs.filter(d=>d.hba1c).map(d=>Number(d.hba1c));
    set("st-sat",satA?satA+"%":"—%");set("st-hba1c",hV.length?(hV.reduce((a,b)=>a+b,0)/hV.length).toFixed(1)+"%":"—%");
    if(satA)document.getElementById("st-sat-bar").style.width=Math.min(Number(satA),100)+"%";
    const tb=document.getElementById("stats-tbl");
    if(tb)tb.innerHTML=docs.slice(0,10).map(d=>`<tr><td>${dTH(d.date)}</td><td>${d.clinic||"—"}</td><td>${Number(d.count||0).toLocaleString()} ราย</td><td>${d.sat?d.sat+"%":"—"}</td></tr>`).join("")||'<tr><td colspan="4" class="et">ยังไม่มีข้อมูล</td></tr>';
  });
}

/* ── FILTER DOCS ── */
async function filterDocs(category) {
  try { closeDropdown(); } catch(e){}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const pg = document.getElementById('page-filtered');
  if(!pg){ alert('ไม่พบหน้า page-filtered'); return; }
  pg.classList.add('active');
  const nb = document.getElementById('nav-doc-btn');
  if(nb) nb.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  document.getElementById('filtered-title').textContent = DOC_LABEL_MAP[category]||category;
  const el = document.getElementById('filtered-list');
  el.innerHTML = '<div class="news-empty">กำลังโหลด...</div>';
  try {
    const snap = await db.collection('documents').where('category','==',category).get();
    const docs = snap.docs.map(d=>({id:d.id,...d.data()})).sort(dSort);
    if(!docs.length){ el.innerHTML='<div class="news-empty">ยังไม่มีเอกสารในหมวดนี้</div>'; return; }
    el.innerHTML = '<div class="doc-wrap">'+docs.map(dRow).join('')+'</div>';
  } catch(err) {
    console.error('filterDocs error:', err);
    el.innerHTML = '<div class="news-empty">เกิดข้อผิดพลาด: '+err.message+'</div>';
  }
}


/* ── STAFF PHOTOS ── */
function updateStaffPhoto(input, id) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('img-'+id);
    const icon = document.getElementById('icon-'+id);
    img.src = e.target.result;
    img.style.display = 'block';
    if(icon) icon.style.display = 'none';
    localStorage.setItem('staff-photo-'+id, e.target.result);
  };
  reader.readAsDataURL(file);
}
// โหลดรูปที่บันทึกไว้
window.addEventListener('load', () => {
  ['s1','s2','s3','s4','s5','s6','s7','s8'].forEach(id => {
    const saved = localStorage.getItem('staff-photo-'+id);
    if (saved) {
      const img = document.getElementById('img-'+id);
      const icon = document.getElementById('icon-'+id);
      if(img){ img.src = saved; img.style.display = 'block'; }
      if(icon) icon.style.display = 'none';
    }
  });
});


/* ── ORG PHOTO UPLOAD ── */
let _currentPhotoId = null;
function triggerPhotoUpload(id) {
  _currentPhotoId = id;
  document.getElementById('photo-upload-input').click();
}
function handlePhotoUpload(input) {
  if (!input.files[0] || !_currentPhotoId) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('img-' + _currentPhotoId);
    const icon = document.getElementById('icon-' + _currentPhotoId);
    if (img) { img.src = e.target.result; img.style.display = 'block'; }
    if (icon) icon.style.display = 'none';
    try { localStorage.setItem('org-photo-' + _currentPhotoId, e.target.result); } catch(e){}
  };
  reader.readAsDataURL(input.files[0]);
  input.value = '';
}
// โหลดรูปที่บันทึกไว้
['s1','s2','s3','s4','s5','s6','s7','s8'].forEach(id => {
  try {
    const saved = localStorage.getItem('org-photo-' + id);
    if (saved) {
      const img = document.getElementById('img-' + id);
      const icon = document.getElementById('icon-' + id);
      if (img) { img.src = saved; img.style.display = 'block'; }
      if (icon) icon.style.display = 'none';
    }
  } catch(e){}
});


/* ── DAY STATS ── */
function drawDayCharts(selectedDate, weekDocs) {
  var parts = selectedDate.split('-');
  var y = parts[0], m = parts[1], d = parts[2];

  // Bar chart: 7 days ending on selectedDate (local date arithmetic, no UTC conversion)
  var barLabels = [], barCounts = [], barBgs = [];
  for (var i = 6; i >= 0; i--) {
    var dt = new Date(parseInt(y), parseInt(m)-1, parseInt(d)-i);
    var ds = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
    barLabels.push(dt.getDate() + '/' + (dt.getMonth() + 1));
    barCounts.push(weekDocs.filter(function(e) { return e.date === ds; }).reduce(function(s, e) { return s + Number(e.count || 0); }, 0));
    barBgs.push(ds === selectedDate ? '#0052A5' : '#B8CCE4');
  }
  var c1 = document.getElementById('chart-stats-weekly');
  if (c1) {
    if (cSW) { cSW.destroy(); cSW = null; }
    cSW = new Chart(c1.getContext('2d'), {
      type: 'bar',
      data: {
        labels: barLabels,
        datasets: [{
          label: 'ผู้ป่วย',
          data: barCounts,
          backgroundColor: barBgs,
          borderRadius: 6,
          hoverBackgroundColor: '#003D7A'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#E8EDF6' },
            ticks: { font: { family: 'IBM Plex Sans Thai', size: 11 }, color: '#6B7A8D' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'IBM Plex Sans Thai', size: 11 }, color: '#6B7A8D' }
          }
        }
      }
    });
  }
  var wTitle = document.getElementById('h-stats-weekly');
  if (wTitle) wTitle.textContent = '7 วันย้อนหลัง (ถึง ' + d + '/' + m + ')';

  // Donut: only the selected date
  var dayDocs = weekDocs.filter(function(e) { return e.date === selectedDate; });
  var cmap = {};
  dayDocs.forEach(function(e) {
    var cl = e.clinic || 'อื่นๆ';
    cmap[cl] = (cmap[cl] || 0) + Number(e.count || 0);
  });
  var c2 = document.getElementById('chart-stats-clinic');
  if (c2) {
    if (cSC) { cSC.destroy(); cSC = null; }
    if (Object.keys(cmap).length) {
      cSC = new Chart(c2.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(cmap),
          datasets: [{
            data: Object.values(cmap),
            backgroundColor: ['#0052A5','#0A7C63','#B85C00','#C0392B','#7B4FD4','#00B4D8','#C8960C','#1A7A3A'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'IBM Plex Sans Thai', size: 11 }, boxWidth: 10, padding: 10 }
            }
          }
        }
      });
    }
  }
  var cTitle = document.getElementById('h-stats-clinic');
  if (cTitle) cTitle.textContent = 'คลินิกวันที่ ' + d + '/' + m + '/' + y;
}

async function loadDayStats(dateStr) {
  const ph = document.getElementById('stats-placeholder');
  const fc = document.getElementById('stats-form-card');
  if (!dateStr) {
    if (ph) ph.style.display = 'block';
    if (fc) fc.style.display = 'none';
    if (cSW) { cSW.destroy(); cSW = null; }
    if (cSC) { cSC.destroy(); cSC = null; }
    return;
  }
  if (ph) ph.style.display = 'none';
  if (fc) fc.style.display = 'block';
  // reset KPI to dashes
  ['d-count','d-nurse','prod-result'].forEach(function(id) {
    var el = document.getElementById(id); if(el) { el.textContent = '—'; el.style.color = ''; }
  });
  var ndMsg = document.getElementById('sv-nodata-msg');
  if (ndMsg) ndMsg.style.display = 'none';
  var hdrUser = document.getElementById('sv-hdr-user');
  if (hdrUser) hdrUser.textContent = '—';
  var hdrDate = document.getElementById('sv-hdr-date');
  if (hdrDate) { var _sp = dateStr.split('-'); hdrDate.textContent = _sp[2]+'/'+_sp[1]+'/'+_sp[0]; }
  try {
    var _dp = dateStr.split('-');
    var startD = new Date(parseInt(_dp[0]), parseInt(_dp[1])-1, parseInt(_dp[2])-6);
    var startStr = startD.getFullYear()+'-'+String(startD.getMonth()+1).padStart(2,'0')+'-'+String(startD.getDate()).padStart(2,'0');
    var results = await Promise.all([
      db.collection('entries').where('date','==',dateStr).get(),
      db.collection('entries').where('date','>=',startStr).where('date','<=',dateStr).get()
    ]);
    var snap = results[0], weekSnap = results[1];
    drawDayCharts(dateStr, weekSnap.docs.map(function(d){ return d.data(); }));
    if (snap.empty) {
      if (ndMsg) {
        var _nd = dateStr.split('-');
        ndMsg.textContent = 'ยังไม่มีการบันทึกข้อมูลวันที่ '+_nd[2]+'/'+_nd[1]+'/'+_nd[0];
        ndMsg.style.display = 'block';
      }
      return;
    }
    var countTotal = 0, nurseTotal = 0, userName = '';
    snap.docs.forEach(function(d) {
      var e = d.data();
      countTotal += Number(e.count||0);
      nurseTotal += Number(e.nurse||0);
      if (e.userName) userName = e.userName;
    });
    var cEl = document.getElementById('d-count'); if(cEl) cEl.textContent = countTotal || '—';
    var nEl = document.getElementById('d-nurse'); if(nEl) nEl.textContent = nurseTotal || '—';
    if (hdrUser) hdrUser.textContent = userName || '—';
    var pResult = document.getElementById('prod-result');
    if (pResult) {
      if (nurseTotal > 0) {
        var prod = ((countTotal * 0.25) / (nurseTotal * 7) * 100).toFixed(1);
        pResult.textContent = prod;
        pResult.style.color = Number(prod) >= 80 ? '#4ADE80' : '#FCA5A5';
      }
    }
  } catch(err) { console.error('loadDayStats:', err); }
}


/* ── ACCORDION ── */
function toggleAcc(head) {
  const body = head.nextElementSibling;
  const open = head.classList.toggle('acc-open');
  body.style.display = open ? '' : 'none';
}
function toggleSvAcc(head) {
  const body = head.nextElementSibling;
  const open = head.classList.toggle('sv-open');
  body.style.display = open ? 'block' : 'none';
}

/* ── STATS TAB ── */
function switchStatsTab(tab) {
  const daily = document.getElementById('stats-daily-panel');
  const monthly = document.getElementById('stats-monthly-panel');
  const btnD = document.getElementById('tab-daily-btn');
  const btnM = document.getElementById('tab-monthly-btn');
  if (tab === 'daily') {
    daily.style.display = 'block'; monthly.style.display = 'none';
    btnD.style.background = 'var(--primary)'; btnD.style.color = '#fff'; btnD.style.fontWeight = '600';
    btnM.style.background = 'var(--white)'; btnM.style.color = 'var(--text3)'; btnM.style.fontWeight = '500';
  } else {
    daily.style.display = 'none'; monthly.style.display = 'block';
    btnM.style.background = 'var(--primary)'; btnM.style.color = '#fff'; btnM.style.fontWeight = '600';
    btnD.style.background = 'var(--white)'; btnD.style.color = 'var(--text3)'; btnD.style.fontWeight = '500';
    loadMonthStats();
  }
}

let chartMD = null, chartMC = null;
async function loadMonthStats() {
  const month = parseInt(document.getElementById('stats-month').value);
  const yearBE = parseInt(document.getElementById('stats-year').value);
  const yearCE = yearBE - 543;
  const mm = String(month + 1).padStart(2, '0');
  const lastDay = new Date(yearCE, month + 1, 0).getDate();
  const s = `${yearCE}-${mm}-01`;
  const e = `${yearCE}-${mm}-${String(lastDay).padStart(2, '0')}`;
  const moFull = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const mTitle = document.getElementById('m-title');
  if (mTitle) mTitle.textContent = `${moFull[month]} ${yearBE}`;
  ['m-total','m-days','m-avg','m-prod'].forEach(id => { const el=document.getElementById(id); if(el){el.textContent='—';el.style.color='';} });
  const mPB = document.getElementById('m-prod-bar'); if(mPB) mPB.style.width='0%';
  if(chartMD){chartMD.destroy();chartMD=null;}
  if(chartMC){chartMC.destroy();chartMC=null;}
  const topActEl0 = document.getElementById('m-top-acts'); if(topActEl0) topActEl0.innerHTML='';
  const typeEl0 = document.getElementById('m-type-list'); if(typeEl0) typeEl0.innerHTML='';
  const stbl = document.getElementById('monthly-summary-tbl'); if(stbl) stbl.innerHTML='';
  const dtbl = document.getElementById('monthly-daily-tbl'); if(dtbl) dtbl.innerHTML='';
  try {
    const snap = await db.collection('entries').where('date','>=',s).where('date','<=',e).orderBy('date','asc').get();
    const docs = snap.docs.map(d => d.data());
    if (!docs.length) return;

    // รวมค่าตามวัน (group by date)
    const byDate = {};
    docs.forEach(d => {
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });

    const days = Object.keys(byDate).length;
    const totalCount = docs.reduce((s,d) => s+Number(d.count||0), 0);
    const avg = days > 0 ? (totalCount/days).toFixed(1) : 0;

    // คำนวณ productivity เฉลี่ย
    let prodSum = 0, prodCount = 0;
    Object.values(byDate).forEach(entries => {
      const c = entries.reduce((s,d)=>s+Number(d.count||0),0);
      const n = entries.reduce((s,d)=>s+Number(d.nurse||0),0);
      if (n > 0) { prodSum += (c*0.25)/(n*7)*100; prodCount++; }
    });
    const prodAvg = prodCount > 0 ? (prodSum/prodCount).toFixed(1) : '—';

    document.getElementById('m-total').textContent = totalCount.toLocaleString();
    document.getElementById('m-days').textContent = days;
    document.getElementById('m-avg').textContent = avg;
    const mProd = document.getElementById('m-prod');
    const prodNum = Number(prodAvg);
    if(mProd) { mProd.textContent = prodAvg; mProd.style.color = prodNum>=80 ? 'var(--teal)' : prodNum>0 ? 'var(--red)' : 'var(--text3)'; }
    const mProdBar = document.getElementById('m-prod-bar');
    if(mProdBar) { mProdBar.style.width = Math.min(prodNum,100)+'%'; mProdBar.style.background = prodNum>=80 ? 'var(--teal)' : 'var(--red)'; }

    // ตารางสรุป
    const numFields = [
      ['ผู้รับบริการ (OPD Visit)','count'],['ผู้ป่วยนัด','appt'],['Walk-in','walkin'],
      ['Admit','admit'],['Refer Out','refer'],['Telemedicine','tele'],
      ['คัดกรอง','screen'],['ทำแผล','wound'],['ฉีดยา','inject'],['EKG','ekg'],['DTX','dtx'],
      ['สุขศึกษารายบุคคล','eduInd'],['สุขศึกษารายกลุ่ม','eduGrp'],
      ['ให้คำปรึกษา','counsel']
    ];
    const moShort = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const tblSum = document.getElementById('monthly-summary-tbl');
    tblSum.innerHTML = numFields.map(([label, key]) => {
      const total = docs.reduce((s,d)=>s+Number(d[key]||0),0);
      const avgVal = days>0 ? (total/days).toFixed(1) : '0';
      return `<tr><td style="padding:8px 12px;border:1px solid var(--border2)">${label}</td>
        <td style="padding:8px 12px;border:1px solid var(--border2);text-align:center;font-weight:600;color:var(--primary)">${total||'—'}</td>
        <td style="padding:8px 12px;border:1px solid var(--border2);text-align:center">${total>0?avgVal:'—'}</td></tr>`;
    }).join('');

    // ตารางรายวัน
    const tblDaily = document.getElementById('monthly-daily-tbl');
    const dTHLocal = s => { const[y,m,d]=s.split('-'); return `${parseInt(d)} ${moShort[parseInt(m)-1]} ${parseInt(y)+543}`; };
    tblDaily.innerHTML = Object.entries(byDate).map(([date, entries]) => {
      const c = entries.reduce((s,d)=>s+Number(d.count||0),0);
      const appt = entries.reduce((s,d)=>s+Number(d.appt||0),0);
      const wk = entries.reduce((s,d)=>s+Number(d.walkin||0),0);
      const ad = entries.reduce((s,d)=>s+Number(d.admit||0),0);
      const rf = entries.reduce((s,d)=>s+Number(d.refer||0),0);
      const n = entries.reduce((s,d)=>s+Number(d.nurse||0),0);
      const prod = n>0 ? ((c*0.25)/(n*7)*100).toFixed(1) : '—';
      const prodColor = prod!=='—'&&Number(prod)>=80 ? 'color:var(--teal)' : 'color:var(--red)';
      return `<tr>
        <td style="padding:7px 12px;border:1px solid var(--border2)">${dTHLocal(date)}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center;font-weight:600;color:var(--primary)">${c||0}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center">${appt||0}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center">${wk||0}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center">${ad||0}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center">${rf||0}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center">${n||0}</td>
        <td style="padding:7px 12px;border:1px solid var(--border2);text-align:center;font-weight:600;${prodColor}">${prod}</td>
      </tr>`;
    }).join('');

    // Chart รายวัน
    const labels = Object.keys(byDate).map(d => parseInt(d.split('-')[2])+'');
    const counts = Object.values(byDate).map(entries => entries.reduce((s,d)=>s+Number(d.count||0),0));
    const ctx1 = document.getElementById('chart-monthly-daily');
    if(ctx1){ if(chartMD)chartMD.destroy(); chartMD = new Chart(ctx1.getContext('2d'),{type:'bar',data:{labels,datasets:[{label:'ผู้ป่วย',data:counts,backgroundColor:'#0052A5',borderRadius:4,maxBarThickness:52}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#E8EDF6'},ticks:{font:{family:'IBM Plex Sans Thai',size:11},color:'#6B7A8D'}},x:{grid:{display:false},ticks:{font:{family:'IBM Plex Sans Thai',size:11},color:'#6B7A8D'}}}}}); }

    // Top activities
    const actFields = [
      ['คัดกรอง','screen'],['ซักประวัติ','history'],['ทำแผล','wound'],['ฉีดยา','inject'],
      ['EKG','ekg'],['DTX','dtx'],['สุขศึกษาบุคคล','eduInd'],['สุขศึกษากลุ่ม','eduGrp'],
      ['ออกใบนัด','apptOut'],['ให้คำปรึกษา','counsel']
    ];
    const actTotals = actFields.map(([label,key])=>[label, docs.reduce((s,d)=>s+Number(d[key]||0),0)]).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxAct = actTotals[0]?.[1]||1;
    const topActEl = document.getElementById('m-top-acts');
    if(topActEl) topActEl.innerHTML = actTotals.map(([label,val])=>`
      <div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px"><span style="color:var(--text2)">${label}</span><strong style="color:var(--primary)">${val||'—'}</strong></div>
        <div style="height:5px;background:#E8EDF6;border-radius:99px;overflow:hidden"><div style="height:100%;background:var(--primary);border-radius:99px;width:${val?Math.round(val/maxAct*100):0}%"></div></div>
      </div>`).join('');

    // Type list
    const typeFields = [['นัด','appt','#0052A5'],['Walk-in','walkin','#0A7C63'],['Admit','admit','#B85C00'],['Refer Out','refer','#C0392B'],['Telemedicine','tele','#7B4FD4']];
    const typeEl = document.getElementById('m-type-list');
    if(typeEl) typeEl.innerHTML = typeFields.map(([label,key,color])=>{
      const val = docs.reduce((s,d)=>s+Number(d[key]||0),0);
      const pct = totalCount>0 ? Math.round(val/totalCount*100) : 0;
      return `<div style="display:flex;align-items:center;gap:10px">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <div style="flex:1;font-size:12.5px;color:var(--text2)">${label}</div>
        <div style="font-size:12.5px;font-weight:700;color:var(--text)">${val||0}</div>
        <div style="font-size:11px;color:var(--text3);width:32px;text-align:right">${pct}%</div>
      </div>`;
    }).join('');

    // Donut chart ประเภทผู้รับบริการ
    const typeVals = typeFields.map(([,key])=>docs.reduce((s,d)=>s+Number(d[key]||0),0));
    const typeLabels = typeFields.map(([label])=>label);
    const typeColors = typeFields.map(([,,c])=>c);
    const ctx2 = document.getElementById('chart-monthly-clinic');
    if(ctx2){ if(chartMC)chartMC.destroy(); chartMC = new Chart(ctx2.getContext('2d'),{type:'doughnut',data:{labels:typeLabels,datasets:[{data:typeVals,backgroundColor:typeColors,borderWidth:2,borderColor:'#fff',hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{display:false}}}}); }

  } catch(err) { console.error('loadMonthStats:', err); }
}
// ตั้งค่าเดือนปัจจุบัน
window.addEventListener('load', () => {
  const now = new Date();
  const sm = document.getElementById('stats-month');
  const sy = document.getElementById('stats-year');
  if(sm) sm.value = now.getMonth();
  if(sy) sy.value = now.getFullYear() + 543;
  // ถ้าเริ่มต้นที่ tab monthly ให้โหลดเลย (ปกติ tab daily อยู่ก่อน จะโหลดเมื่อสลับ)
});


/* ── KPI 7 CLINICS ── */
const KPI_DEFS = [{"id": "dm1", "clinic": "DM", "name": "ผู้ป่วย HbA1c < 7% (ทั่วไป)", "targetVal": 40, "dir": "gte"}, {"id": "dm2", "clinic": "DM", "name": "ผู้ป่วย HbA1c < 8% (ผู้สูงอายุ/โรคร่วม)", "targetVal": 60, "dir": "gte"}, {"id": "dm3", "clinic": "DM", "name": "ตรวจ eGFR ≥ 1 ครั้ง/ปี", "targetVal": 100, "dir": "gte"}, {"id": "dm4", "clinic": "DM", "name": "ตรวจตา (Fundoscopy) ≥ 1 ครั้ง/ปี", "targetVal": 80, "dir": "gte"}, {"id": "dm5", "clinic": "DM", "name": "ตรวจเท้า (Foot exam) ≥ 1 ครั้ง/ปี", "targetVal": 100, "dir": "gte"}, {"id": "dm6", "clinic": "DM", "name": "ภาวะแทรกซ้อนเฉียบพลัน Hypo/Hyperglycemia", "targetVal": 0, "dir": "eq0"}, {"id": "dm7", "clinic": "DM", "name": "ผู้ป่วยมาตามนัด", "targetVal": 84, "dir": "gte"}, {"id": "ht1", "clinic": "HT", "name": "BP < 130/80 mmHg (ทั่วไป/DM/CKD)", "targetVal": 50, "dir": "gte"}, {"id": "ht2", "clinic": "HT", "name": "BP < 140/90 mmHg (ผู้สูงอายุ ≥65 ปี)", "targetVal": 65, "dir": "gte"}, {"id": "ht3", "clinic": "HT", "name": "ประเมิน CV risk ≥ 1 ครั้ง/ปี", "targetVal": 80, "dir": "gte"}, {"id": "ht4", "clinic": "HT", "name": "Hypertensive crisis (SBP ≥ 180 mmHg)", "targetVal": 0, "dir": "eq0"}, {"id": "ht5", "clinic": "HT", "name": "ผู้ป่วยมาตามนัด", "targetVal": 84, "dir": "gte"}, {"id": "wf1", "clinic": "Warfarin", "name": "Time in Therapeutic Range (TTR)", "targetVal": 60, "dir": "gte"}, {"id": "wf2", "clinic": "Warfarin", "name": "INR > 3.0 (Over-anticoagulated)", "targetVal": 10, "dir": "lt"}, {"id": "wf3", "clinic": "Warfarin", "name": "INR < 1.5 (Under-anticoagulated)", "targetVal": 10, "dir": "lt"}, {"id": "wf4", "clinic": "Warfarin", "name": "Major bleeding events", "targetVal": 0, "dir": "eq0"}, {"id": "wf5", "clinic": "Warfarin", "name": "Thromboembolic events (Stroke/DVT/PE)", "targetVal": 0, "dir": "eq0"}, {"id": "wf6", "clinic": "Warfarin", "name": "ผู้ป่วยได้รับความรู้เรื่องยาและ food interaction", "targetVal": 100, "dir": "gte"}, {"id": "ckd1", "clinic": "CKD", "name": "eGFR decline ≤ 5 mL/min/1.73m²/ปี", "targetVal": 70, "dir": "gte"}, {"id": "ckd2", "clinic": "CKD", "name": "CKD stage 3–5 ควบคุม BP < 130/80 mmHg", "targetVal": 50, "dir": "gte"}, {"id": "ckd3", "clinic": "CKD", "name": "ตรวจ UPCR/UACR ≥ 1 ครั้ง/6 เดือน", "targetVal": 80, "dir": "gte"}, {"id": "ckd4", "clinic": "CKD", "name": "CKD stage 4–5 เตรียมพร้อม RRT", "targetVal": 80, "dir": "gte"}, {"id": "as1", "clinic": "Asthma", "name": "หอบหืดควบคุมได้ (ACT score ≥ 20)", "targetVal": 70, "dir": "gte"}, {"id": "as2", "clinic": "Asthma", "name": "Unplanned/ER visit จากหืดกำเริบ", "targetVal": 5, "dir": "lt"}, {"id": "as3", "clinic": "Asthma", "name": "Asthma exacerbation ต้องรับไว้รักษา", "targetVal": 0, "dir": "eq0"}, {"id": "as4", "clinic": "Asthma", "name": "ใช้ Inhaler technique ถูกต้อง", "targetVal": 80, "dir": "gte"}, {"id": "as5", "clinic": "Asthma", "name": "ได้รับวัคซีนไข้หวัดใหญ่", "targetVal": 80, "dir": "gte"}, {"id": "cp1", "clinic": "COPD", "name": "CAT score < 10", "targetVal": 50, "dir": "gte"}, {"id": "cp2", "clinic": "COPD", "name": "mMRC ≤ 1", "targetVal": 50, "dir": "gte"}, {"id": "cp3", "clinic": "COPD", "name": "COPD exacerbation ต้องรับไว้รักษา", "targetVal": 1, "dir": "lt"}, {"id": "cp4", "clinic": "COPD", "name": "ใช้ Inhaler technique ถูกต้อง", "targetVal": 80, "dir": "gte"}, {"id": "cp5", "clinic": "COPD", "name": "หยุดสูบบุหรี่", "targetVal": 50, "dir": "gte"}, {"id": "cp6", "clinic": "COPD", "name": "ทำ Spirometry ประจำปี", "targetVal": 80, "dir": "gte"}, {"id": "cp7", "clinic": "COPD", "name": "ได้รับวัคซีน Influenza + Pneumococcal", "targetVal": 80, "dir": "gte"}, {"id": "sm1", "clinic": "Smoking", "name": "Abstinence rate ≥ 6 เดือน", "targetVal": 30, "dir": "gte"}, {"id": "sm2", "clinic": "Smoking", "name": "Abstinence rate ≥ 1 ปี", "targetVal": 20, "dir": "gte"}, {"id": "sm3", "clinic": "Smoking", "name": "ได้รับยาช่วยเลิกบุหรี่ (NRT/Varenicline)", "targetVal": 60, "dir": "gte"}, {"id": "sm4", "clinic": "Smoking", "name": "ประเมิน FTND ทุกราย", "targetVal": 100, "dir": "gte"}, {"id": "sm5", "clinic": "Smoking", "name": "Follow-up ครบ 4 ครั้ง", "targetVal": 80, "dir": "gte"}, {"id": "sm6", "clinic": "Smoking", "name": "ผู้ป่วย Relapse ได้รับการดูแลต่อเนื่อง", "targetVal": 100, "dir": "gte"}, {"id": "sm7", "clinic": "Smoking", "name": "ผู้ป่วยโรคเรื้อรังส่งต่อมาคลินิกเลิกบุหรี่", "targetVal": 100, "dir": "gte"}];
const MONTHS_KEY = ['oct','nov','dec','jan','feb','mar','apr','may','jun','jul','aug','sep'];
const MONTHS_TH = ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];

/* ── QA 6 มิติ DEFS ── */
const QA_DEFS = [
  // มิติ 1 — การนำองค์กร
  {id:'qa_m1_1',dim:1,name:'ร้อยละของตัวชี้วัดวิสัยทัศน์ที่บรรลุเป้าหมาย',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m1_2',dim:1,name:'ร้อยละของโครงการ/กิจกรรมดำเนินการตามกระบวนการควบคุมภายในที่มีคะแนนความเสี่ยงลดลง',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m1_3',dim:1,name:'ร้อยละของบุคลากรพยาบาลที่มีผลการประเมินจริยธรรมจรรยาบรรณวิชาชีพผ่านเกณฑ์ที่กำหนด',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  // มิติ 2 — ประสิทธิภาพ
  {id:'qa_m2_1',dim:2,name:'ผลิตภาพของงานการพยาบาลผู้ป่วยนอก (Nursing Productivity)',target:'90–110%',targetVal:90,targetMax:110,dir:'range',unit:'ร้อยละ'},
  {id:'qa_m2_2',dim:2,name:'ระยะเวลารอคอยบริการพยาบาลผู้ป่วยนอกเฉลี่ย',target:'ตามบริบท',targetVal:null,dir:'info',unit:'นาที'},
  {id:'qa_m2_3',dim:2,name:'ร้อยละของบุคลากรพยาบาลที่มีชั่วโมงปฏิบัติงานเฉลี่ยมากกว่า 60 ชั่วโมง/สัปดาห์',target:'= 0',targetVal:0,dir:'eq0',unit:'ร้อยละ'},
  {id:'qa_m2_4',dim:2,name:'ร้อยละของอุบัติการณ์/ความเสี่ยงทางการพยาบาลได้รับการจัดการทันเวลาตามที่กำหนด',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  // มิติ 3 — ผู้ใช้บริการ
  {id:'qa_m3_1',dim:3,name:'ร้อยละความพึงพอใจของผู้ใช้บริการต่อบริการพยาบาล',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m3_2',dim:3,name:'ร้อยละความพึงพอใจของผู้มีส่วนได้ส่วนเสียต่อหน่วยงานบริการพยาบาล',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m3_3',dim:3,name:'ร้อยละความไม่พึงพอใจของผู้ใช้บริการต่อบริการพยาบาล',target:'< 5%',targetVal:5,dir:'lt',unit:'ร้อยละ'},
  {id:'qa_m3_4',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับสิทธิหรือการละเมิดสิทธิผู้ใช้บริการ',target:'= 0',targetVal:0,dir:'eq0',unit:'ครั้ง'},
  {id:'qa_m3_5',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับสิทธิหรือการละเมิดสิทธิผู้ใช้บริการกลุ่มเฉพาะ',target:'= 0',targetVal:0,dir:'eq0',unit:'ครั้ง'},
  {id:'qa_m3_6',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับพฤติกรรมบริการของบุคลากรพยาบาล',target:'= 0',targetVal:0,dir:'eq0',unit:'ครั้ง'},
  {id:'qa_m3_7',dim:3,name:'จำนวนข้อร้องเรียนเกี่ยวกับการละเมิดข้อมูลส่วนบุคคล (PDPA)',target:'= 0',targetVal:0,dir:'eq0',unit:'ครั้ง'},
  {id:'qa_m3_8',dim:3,name:'ร้อยละของการแก้ไขและ/หรือการตอบกลับข้อร้องเรียนของผู้ใช้บริการ',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  // มิติ 4 — บุคลากร
  {id:'qa_m4_1',dim:4,name:'ร้อยละความผูกพันของบุคลากรพยาบาล',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_2',dim:4,name:'ร้อยละความพึงพอใจในงานและบรรยากาศองค์กรของบุคลากรพยาบาล',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_3',dim:4,name:'ร้อยละการโอนย้ายและลาออกของบุคลากรพยาบาล',target:'≤ 1%',targetVal:1,dir:'lte',unit:'ร้อยละ'},
  {id:'qa_m4_4',dim:4,name:'ร้อยละของบุคลากรพยาบาลมีสมรรถนะตามบทบาทหน้าที่และสมรรถนะเฉพาะ',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_5',dim:4,name:'ร้อยละของบุคลากรพยาบาลได้รับการอบรมฟื้นฟูทักษะ BLS ≥1 ครั้ง/ปี',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_6',dim:4,name:'ร้อยละของบุคลากรพยาบาลได้รับการอบรมฟื้นฟูทักษะ ACLS ≥1 ครั้ง/ปี',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_7',dim:4,name:'ร้อยละของบุคลากรพยาบาลได้รับการอบรมฟื้นฟูทักษะการป้องกันและควบคุมการติดเชื้อ ≥1 ครั้ง/ปี',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_8',dim:4,name:'ร้อยละของบุคลากรพยาบาลที่ได้รับการตรวจสุขภาพประจำปีและตามความเสี่ยงจากการทำงาน',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m4_9',dim:4,name:'ร้อยละของบุคลากรพยาบาลที่เจ็บป่วยหรือเกิดอุบัติเหตุจากการปฏิบัติงานได้รับการดูแลตามแนวทาง',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  // มิติ 5 — ระบบงานและกระบวนการสำคัญ
  {id:'qa_m5_1',dim:5,name:'ร้อยละของบุคลากรพยาบาลที่ปฏิบัติตามแนวทางปฏิบัติการพยาบาล',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m5_2',dim:5,name:'ร้อยละของการบันทึกทางการพยาบาลตามเกณฑ์มาตรฐานการพยาบาลในโรงพยาบาล',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m5_3',dim:5,name:'ร้อยละของอุบัติการณ์ภัยพิบัติหรือภาวะฉุกเฉินได้รับการจัดการตามกระบวนการที่กำหนด',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m5_4',dim:5,name:'ร้อยละของฐานข้อมูลจำเป็นตามมาตรฐานการพยาบาลในโรงพยาบาลที่นำมาใช้ประโยชน์',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m5_5',dim:5,name:'ร้อยละขององค์ความรู้และ/หรือนวัตกรรมทางการพยาบาลที่พัฒนาด้วยการจัดการความรู้และนำไปใช้',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m5_6',dim:5,name:'จำนวนอุบัติการณ์ความไม่พร้อมต่อการช่วยชีวิตฉุกเฉิน',target:'= 0',targetVal:0,dir:'eq0',unit:'ครั้ง'},
  // มิติ 6 — การบริการพยาบาล
  {id:'qa_m6_1',dim:6,name:'ร้อยละของการคัดกรองผู้ใช้บริการถูกต้อง',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m6_2',dim:6,name:'ร้อยละของผู้ป่วยที่อยู่ในภาวะคุกคามชีวิตได้รับการแก้ไขทันทีภายใน 4 นาที',target:'100%',targetVal:100,dir:'gte',unit:'ร้อยละ'},
  {id:'qa_m6_3',dim:6,name:'อัตราการเกิดอาการเปลี่ยนแปลงของผู้ป่วยโดยไม่ได้คาดการณ์',target:'= 0',targetVal:0,dir:'eq0',unit:'อัตรา'},
  {id:'qa_m6_4',dim:6,name:'อัตราการเกิดภาวะแทรกซ้อนที่ป้องกันได้ (แยกรายโรค/คลินิก)',target:'= 0',targetVal:0,dir:'eq0',unit:'อัตรา'},
  {id:'qa_m6_5',dim:6,name:'อัตราการเกิดอุบัติการณ์ไม่พึงประสงค์ระหว่างส่งต่อหรือเคลื่อนย้าย',target:'= 0',targetVal:0,dir:'eq0',unit:'อัตรา'},
  {id:'qa_m6_6',dim:6,name:'อัตราการกลับเข้ารักษาซ้ำภายใน 48 ชั่วโมงโดยไม่ได้วางแผน',target:'= 0',targetVal:0,dir:'eq0',unit:'อัตรา'},
  {id:'qa_m6_7',dim:6,name:'จำนวนอุบัติการณ์การระบุตัวผู้ป่วยผิดคน',target:'= 0',targetVal:0,dir:'eq0',unit:'ครั้ง'},
  {id:'qa_m6_8',dim:6,name:'ร้อยละของการพลัดตกหกล้มมีความรุนแรงระดับ E–I',target:'= 0',targetVal:0,dir:'eq0',unit:'ร้อยละ'},
  {id:'qa_m6_9',dim:6,name:'อัตราการเกิดการบาดเจ็บจากการจัดท่า ผูกยึด หรือการใช้อุปกรณ์และเครื่องมือ',target:'= 0',targetVal:0,dir:'eq0',unit:'อัตรา'},
  {id:'qa_m6_10',dim:6,name:'ร้อยละของผู้ป่วยที่มาตรวจตามนัดมีความรู้และทักษะการจัดการสุขภาพตนเอง',target:'≥ 80%',targetVal:80,dir:'gte',unit:'ร้อยละ'},
];

const QA_DIMS = [
  {num:1,name:'มิติที่ 1 — ผลลัพธ์ด้านการนำองค์กร',color:'#1E56C4'},
  {num:2,name:'มิติที่ 2 — ผลลัพธ์ด้านประสิทธิภาพ',color:'#0A7C63'},
  {num:3,name:'มิติที่ 3 — ผลลัพธ์ด้านผู้ใช้บริการ',color:'#7C3AED'},
  {num:4,name:'มิติที่ 4 — ผลลัพธ์ด้านบุคลากร',color:'#C0392B'},
  {num:5,name:'มิติที่ 5 — ผลลัพธ์ด้านระบบงานและกระบวนการสำคัญ',color:'#B85C00'},
  {num:6,name:'มิติที่ 6 — ผลลัพธ์ด้านการบริการพยาบาล',color:'#1A7A3A'},
];

function renderQATables() {
  const container = document.getElementById('qa-tables-container');
  if (!container) return;
  let html = '';
  QA_DIMS.forEach(dim => {
    const defs = QA_DEFS.filter(q => q.dim === dim.num);
    const mhCols = MONTHS_TH.map(m=>`<th style="padding:8px 5px;border:1px solid var(--border2);text-align:center;font-size:11px;min-width:44px">${m}</th>`).join('');
    html += `<div style="background:var(--white);border:1px solid var(--border2);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:1.25rem;box-shadow:var(--shadow)">
      <div style="padding:.75rem 1.25rem;background:${dim.color};color:#fff;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:10px">
        <span>${dim.name}</span>
        <span style="margin-left:auto;font-size:11px;opacity:.8">${defs.length} ตัวชี้วัด</span>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:1000px">
          <thead><tr style="background:#f8f9fa">
            <th style="padding:8px 10px;text-align:left;border:1px solid var(--border2);min-width:300px">ตัวชี้วัด</th>
            <th style="padding:8px 8px;border:1px solid var(--border2);text-align:center;min-width:50px">หน่วย</th>
            <th style="padding:8px 8px;border:1px solid var(--border2);text-align:center;min-width:70px">เป้าหมาย</th>
            ${mhCols}
            <th style="padding:8px 6px;border:1px solid var(--border2);text-align:center;min-width:58px;color:${dim.color}">เฉลี่ย/รวม</th>
            <th style="padding:8px 6px;border:1px solid var(--border2);text-align:center;min-width:70px">สถานะ</th>
          </tr></thead><tbody>`;
    defs.forEach(qa => {
      const mCells = MONTHS_TH.map((_,i)=>`<td id="qa-${qa.id}-${i}" style="padding:6px 8px;border:1px solid var(--border2);text-align:center;font-size:12px;min-width:44px">—</td>`).join('');
      html += `<tr>
          <td style="padding:7px 10px;border:1px solid var(--border2);font-size:12.5px">${qa.name}</td>
          <td style="padding:7px 8px;border:1px solid var(--border2);text-align:center;font-size:11px;color:var(--text3)">${qa.unit}</td>
          <td style="padding:7px 8px;border:1px solid var(--border2);text-align:center;font-size:12px;font-weight:600;color:${dim.color}">${qa.target}</td>
          ${mCells}
          <td id="qa-${qa.id}-avg" style="padding:7px 8px;border:1px solid var(--border2);text-align:center;font-size:12.5px;font-weight:700">—</td>
          <td id="qa-${qa.id}-status" style="padding:7px 8px;border:1px solid var(--border2);text-align:center;font-size:11px;white-space:nowrap">—</td>
        </tr>`;
    });
    html += `</tbody></table></div></div>`;
  });
  container.innerHTML = html;
}

async function loadKPIData() {
  const year = parseInt(document.getElementById('perf-year').value);
  try {
    const snap = await db.collection('kpi_data').where('year','==',year).get();
    const data = {};
    snap.docs.forEach(d => { data[d.id] = d.data(); });
    
    let passCount = 0;
    KPI_DEFS.forEach(kpi => {
      const rec = data[kpi.id] || {};
      const vals = [];
      MONTHS_KEY.forEach((mk, i) => {
        const a = Number(rec['a_'+mk]||0);
        const b = rec['b_'+mk];
        let pct = null;
        if (b === undefined || b === null || b === '' || b === '—') {
          pct = a > 0 ? a : null;
        } else {
          const bv = Number(b);
          pct = bv > 0 ? (a/bv*100) : null;
        }
        const el = document.getElementById('kpi-'+kpi.id+'-'+i);
        if (el) {
          if (pct !== null) {
            el.textContent = pct.toFixed(1);
            el.style.color = getStatusColor(pct, kpi.targetVal, kpi.dir);
            el.style.fontWeight = '600';
            vals.push(pct);
          } else {
            el.textContent = '—';
            el.style.color = 'var(--text3)';
            el.style.fontWeight = '400';
          }
        }
      });
      
      // คำนวณเฉลี่ย
      const avgEl = document.getElementById('kpi-'+kpi.id+'-avg');
      const statusEl = document.getElementById('kpi-'+kpi.id+'-status');
      if (vals.length > 0) {
        const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
        if (avgEl) {
          avgEl.textContent = avg.toFixed(1);
          avgEl.style.color = getStatusColor(avg, kpi.targetVal, kpi.dir);
        }
        const status = getStatus(avg, kpi.targetVal, kpi.dir);
        if (statusEl) {
          statusEl.innerHTML = status.html;
        }
        if (status.pass) passCount++;
      } else {
        if (avgEl) avgEl.textContent = '—';
        if (statusEl) statusEl.textContent = '—';
      }
    });
    
    const ppEl = document.getElementById('p-kpi-pass');
    const pbEl = document.getElementById('p-kpi-bar');
    if (ppEl) ppEl.textContent = passCount + '/41';
    if (pbEl) pbEl.style.width = Math.round(passCount/41*100)+'%';
    
  } catch(err) { console.error('loadKPIData:', err); }
}

function getStatusColor(val, target, dir, targetMax) {
  if (dir === 'gte') return val >= target ? '#1A7A3A' : val >= target*0.9 ? '#B85C00' : '#C0392B';
  if (dir === 'lt') return val < target ? '#1A7A3A' : val < target*1.1 ? '#B85C00' : '#C0392B';
  if (dir === 'lte') return val <= target ? '#1A7A3A' : val <= target*1.1 ? '#B85C00' : '#C0392B';
  if (dir === 'eq0') return val === 0 ? '#1A7A3A' : '#C0392B';
  if (dir === 'range') return (val >= target && val <= targetMax) ? '#1A7A3A' : '#C0392B';
  return 'var(--text)';
}
function getStatus(val, target, dir, targetMax) {
  let pass = false; let html = '';
  if (dir === 'gte') {
    pass = val >= target;
    html = pass ? '<span style="color:#1A7A3A;font-weight:700">✓ ผ่าน</span>' : val >= target*0.9 ? '<span style="color:#B85C00;font-weight:700">~ ใกล้เคียง</span>' : '<span style="color:#C0392B;font-weight:700">✗ ไม่ผ่าน</span>';
  } else if (dir === 'lt') {
    pass = val < target;
    html = pass ? '<span style="color:#1A7A3A;font-weight:700">✓ ผ่าน</span>' : val < target*1.1 ? '<span style="color:#B85C00;font-weight:700">~ ใกล้เคียง</span>' : '<span style="color:#C0392B;font-weight:700">✗ ไม่ผ่าน</span>';
  } else if (dir === 'lte') {
    pass = val <= target;
    html = pass ? '<span style="color:#1A7A3A;font-weight:700">✓ ผ่าน</span>' : val <= target*1.1 ? '<span style="color:#B85C00;font-weight:700">~ ใกล้เคียง</span>' : '<span style="color:#C0392B;font-weight:700">✗ ไม่ผ่าน</span>';
  } else if (dir === 'eq0') {
    pass = val === 0;
    html = pass ? '<span style="color:#1A7A3A;font-weight:700">✓ ผ่าน</span>' : '<span style="color:#C0392B;font-weight:700">✗ ไม่ผ่าน</span>';
  } else if (dir === 'range') {
    pass = val >= target && val <= targetMax;
    html = pass ? '<span style="color:#1A7A3A;font-weight:700">✓ ผ่าน</span>' : '<span style="color:#C0392B;font-weight:700">✗ ไม่ผ่าน</span>';
  }
  return { pass, html };
}

async function loadQAData() {
  const year = parseInt(document.getElementById('perf-year').value);
  try {
    const snap = await db.collection('qa_data').where('year','==',year).get();
    const data = {};
    snap.docs.forEach(d => { data[d.id] = d.data(); });
    let passCount = 0;
    const scoreableTotal = QA_DEFS.filter(q => q.dir !== 'info').length;
    QA_DEFS.forEach(qa => {
      const rec = data[qa.id] || {};
      const vals = [];
      MONTHS_KEY.forEach((mk, i) => {
        const raw = rec['val_'+mk];
        const val = (raw !== undefined && raw !== null && raw !== '') ? Number(raw) : null;
        const el = document.getElementById('qa-'+qa.id+'-'+i);
        if (el) {
          if (val !== null) {
            el.textContent = (val % 1 === 0) ? val : val.toFixed(1);
            if (qa.dir !== 'info') { el.style.color = getStatusColor(val, qa.targetVal, qa.dir, qa.targetMax); el.style.fontWeight = '600'; }
            vals.push(val);
          } else { el.textContent = '—'; el.style.color = 'var(--text3)'; el.style.fontWeight = '400'; }
        }
      });
      const avgEl = document.getElementById('qa-'+qa.id+'-avg');
      const statusEl = document.getElementById('qa-'+qa.id+'-status');
      if (vals.length > 0) {
        const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
        if (avgEl) { avgEl.textContent = (avg % 1 === 0) ? avg : avg.toFixed(1); if (qa.dir !== 'info') avgEl.style.color = getStatusColor(avg, qa.targetVal, qa.dir, qa.targetMax); }
        if (qa.dir !== 'info') {
          const s = getStatus(avg, qa.targetVal, qa.dir, qa.targetMax);
          if (statusEl) statusEl.innerHTML = s.html;
          if (s.pass) passCount++;
        } else {
          if (statusEl) statusEl.innerHTML = '<span style="color:var(--text3);font-size:11px">ข้อมูล</span>';
        }
      } else {
        if (avgEl) avgEl.textContent = '—';
        if (statusEl) statusEl.textContent = '—';
      }
    });
    const qpEl = document.getElementById('qa-pass');
    const qbEl = document.getElementById('qa-bar');
    if (qpEl) qpEl.textContent = passCount + '/' + scoreableTotal;
    if (qbEl) qbEl.style.width = Math.round(passCount/scoreableTotal*100)+'%';
  } catch(err) { console.error('loadQAData:', err); }
}

function loadAllPerfData() { loadKPIData(); loadQAData(); }

window.addEventListener('load', () => {
  const py = document.getElementById('perf-year');
  if (py) {
    py.value = (new Date().getFullYear()+543).toString();
    renderQATables();
    loadKPIData();
    loadQAData();
  }
});

