import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
         createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";

// ── Version ───────────────────────────────────────────────────────────────
const APP_VERSION = "v1.0.4";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDXUQtI8Mz8IghJZXzjzz5muBhqaHAL7ps",
  authDomain: "onetouchtax-a3c84.firebaseapp.com",
  projectId: "onetouchtax-a3c84",
  storageBucket: "onetouchtax-a3c84.firebasestorage.app",
  messagingSenderId: "517585795626",
  appId: "1:517585795626:web:c6e31d0c89519e0fe5a153",
};
const firebaseApp = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const BRAND = {
  arcOuter:"#0a2a5e", arcMid1:"#0e3d8a", arcMid2:"#1055b8",
  arcMid3:"#1a6fd4",  arcInner:"#2b89ee", arcCore:"#4aa3f5",
  nameColor:"#0a2a5e", touchColor:"#1055b8",
  taxColor:"#c8922a",  taxDark:"#a67520",
  bg:"#ffffff",        bgDark:"#030d1c",
  gradient:"linear-gradient(135deg,#1055b8,#0a2a5e)",
};

const FingerprintCircle = ({ size, pal = BRAND, opacity = 1 }) => {
  const r = size / 2, cx = r, cy = r;
  const sw = size * 0.044, gap = size * 0.065;
  const arcPath = (radius) => {
    const startA = (130 * Math.PI) / 180, endA = (400 * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startA), y1 = cy + radius * Math.sin(startA);
    const x2 = cx + radius * Math.cos(endA),   y2 = cy + radius * Math.sin(endA);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 1 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const radii = [r*.96, r*.96-gap, r*.96-gap*2, r*.96-gap*3, r*.96-gap*4, r*.96-gap*5];
  const colors = [pal.arcOuter,pal.arcMid1,pal.arcMid2,pal.arcMid3,pal.arcInner,pal.arcCore];
  const sparkA = (265*Math.PI)/180, sparkR = r*.96-gap*2.5;
  const sx = cx+sparkR*Math.cos(sparkA), sy = cy+sparkR*Math.sin(sparkA);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ opacity }}>
      <defs><filter id={`gf${size}`}><feGaussianBlur stdDeviation={size*.025} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      {radii.map((rad,i) => <path key={i} d={arcPath(rad)} stroke={colors[i]} strokeWidth={sw} strokeLinecap="round" fill="none" opacity={1-i*.03}/>)}
      <circle cx={sx} cy={sy} r={size*.042} fill={pal.arcCore} opacity=".95" filter={`url(#gf${size})`}/>
      <circle cx={sx} cy={sy} r={size*.075} fill={pal.arcCore} opacity=".22"/>
      <circle cx={sx} cy={sy} r={size*.13}  fill={pal.arcCore} opacity=".09"/>
    </svg>
  );
};

const Logo = ({ scale=1, dark=false }) => {
  const markSize=260*scale, nameSize=72*scale, taxSize=27*scale;
  const c1=dark?"#fff":BRAND.nameColor, c2=dark?BRAND.arcCore:BRAND.touchColor;
  const tc=dark?"#ffe08a":BRAND.taxColor, tcd=dark?BRAND.arcCore:BRAND.taxDark;
  const lc=dark?"#ffffff20":`${BRAND.nameColor}22`;
  const gp=dark?{arcOuter:BRAND.arcCore+"40",arcMid1:BRAND.arcCore+"55",arcMid2:BRAND.arcCore+"66",arcMid3:BRAND.arcCore+"77",arcInner:BRAND.arcCore+"88",arcCore:BRAND.arcCore+"99"}
              :{arcOuter:BRAND.arcOuter+"22",arcMid1:BRAND.arcMid1+"2e",arcMid2:BRAND.arcMid2+"3a",arcMid3:BRAND.arcMid3+"44",arcInner:BRAND.arcInner+"50",arcCore:BRAND.arcCore+"60"};
  return (
    <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:1,pointerEvents:"none"}}><FingerprintCircle size={markSize} pal={gp} opacity={1}/></div>
      <div style={{position:"relative",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:6*scale,padding:`${markSize*.14}px ${markSize*.22}px`}}>
        <div style={{fontFamily:"'Manrope',system-ui",fontSize:nameSize,fontWeight:800,letterSpacing:`${-2.5*scale}px`,lineHeight:1,whiteSpace:"nowrap"}}>
          <span style={{background:`linear-gradient(90deg,${c1},${c2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>One</span>
          <span style={{background:`linear-gradient(90deg,${c2},${dark?"#a0c8ff":BRAND.arcInner})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Touch</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12*scale}}>
          <div style={{height:1.5*scale,width:36*scale,background:lc,borderRadius:2}}/>
          <div style={{fontFamily:"'Manrope',system-ui",fontSize:taxSize,fontWeight:700,letterSpacing:`${5*scale}px`,background:`linear-gradient(90deg,${tcd},${tc})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TAX</div>
          <div style={{height:1.5*scale,width:36*scale,background:lc,borderRadius:2}}/>
        </div>
      </div>
    </div>
  );
};

const NavLogo = ({ dark=false }) => (
  <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:1,pointerEvents:"none"}}>
      <FingerprintCircle size={68} pal={dark?{arcOuter:BRAND.arcCore+"40",arcMid1:BRAND.arcCore+"55",arcMid2:BRAND.arcCore+"66",arcMid3:BRAND.arcCore+"77",arcInner:BRAND.arcCore+"88",arcCore:BRAND.arcCore+"99"}:{arcOuter:BRAND.arcOuter+"22",arcMid1:BRAND.arcMid1+"2e",arcMid2:BRAND.arcMid2+"3a",arcMid3:BRAND.arcMid3+"44",arcInner:BRAND.arcInner+"50",arcCore:BRAND.arcCore+"60"}} opacity={1}/>
    </div>
    <div style={{position:"relative",zIndex:2,padding:"3px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
      <div style={{fontFamily:"'Manrope',system-ui",fontSize:19,fontWeight:800,letterSpacing:"-0.8px",lineHeight:1,whiteSpace:"nowrap"}}>
        <span style={{background:`linear-gradient(90deg,${dark?"#fff":BRAND.nameColor},${dark?BRAND.arcCore:BRAND.touchColor})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>One</span>
        <span style={{background:`linear-gradient(90deg,${dark?BRAND.arcCore:BRAND.touchColor},${dark?"#a0c8ff":BRAND.arcInner})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Touch</span>
      </div>
      <div style={{fontFamily:"'Manrope',system-ui",fontSize:7.5,fontWeight:700,letterSpacing:"3px",background:`linear-gradient(90deg,${dark?BRAND.arcCore:BRAND.taxDark},${dark?"#ffe08a":BRAND.taxColor})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TAX</div>
    </div>
  </div>
);

const AppIcon = ({ size=32 }) => (
  <div style={{width:size,height:size,borderRadius:size*.22,background:`linear-gradient(145deg,${BRAND.arcOuter},${BRAND.bgDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px #00000050",flexShrink:0}}>
    <FingerprintCircle size={size*.76} pal={BRAND}/>
  </div>
);

const VersionBadge = ({ style={} }) => (
  <div style={{textAlign:"center",padding:"6px 0",...style}}>
    <span style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"#cbd5e1",background:"#f1f5f9",padding:"2px 8px",borderRadius:20,fontFamily:"'Manrope',system-ui"}}>{APP_VERSION}</span>
  </div>
);

const ENTITY_CONFIGS = {
  smllc:       { label:"LLC Membro Único",    form:"Schedule C",  color:BRAND.touchColor },
  mmllc:       { label:"LLC Multi-Membros",   form:"Form 1065",   color:"#8b5cf6" },
  scorp:       { label:"S-Corporation",       form:"Form 1120-S", color:"#10b981" },
  ccorp:       { label:"C-Corporation",       form:"Form 1120",   color:"#f59e0b" },
  partnership: { label:"Partnership",         form:"Form 1065",   color:"#ef4444" },
  sole_prop:   { label:"Sole Proprietorship", form:"Schedule C",  color:"#06b6d4" },
};

const CATEGORIES = {
  smllc: {
    income:["Gross Receipts or Sales","Other income"],
    expenses:["Advertising","Car & Truck — Gasoline","Car & Truck — Repairs","Contract Labor (1099-NEC)","Depreciation / Section 179","Insurance (Business)","Interest — Other","Legal & Professional Services","Office Expenses","Rent — Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Travel (Business)","Meals (50% deductible)","Utilities","Wages (W-2 Employees)","Other Business Expenses"],
    nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"],
  },
  scorp: {
    income:["Gross Receipts or Sales","Other Income"],
    expenses:["Compensation of Officers","Salaries & Wages (Other Emp.)","Repairs & Maintenance","Rents","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],
    nonDeduc:["Shareholder Distributions","Personal (Non-Deductible)","Transfer"],
  },
  ccorp: {
    income:["Gross Receipts or Sales","Dividends Received","Interest Income","Other Income"],
    expenses:["Compensation of Officers","Salaries & Wages","Repairs & Maintenance","Rents","Taxes & Licenses","Interest Expense","Charitable Contributions","Depreciation","Advertising","Employee Benefits","Other Deductions"],
    nonDeduc:["Dividends Paid to Shareholders","Personal Expenses of Officers","Transfer"],
  },
  mmllc: {
    income:["Gross Receipts or Sales","Other Income"],
    expenses:["Salaries & Wages","Guaranteed Payments to Partners","Repairs & Maintenance","Rent","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],
    nonDeduc:["Partner Distributions (K-1)","Personal (Non-Deductible)","Transfer"],
  },
  partnership: {
    income:["Gross Receipts or Sales","Other Income"],
    expenses:["Salaries & Wages","Guaranteed Payments to Partners","Repairs & Maintenance","Rent","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],
    nonDeduc:["Partner Distributions","Personal (Non-Deductible)","Transfer"],
  },
  sole_prop: {
    income:["Gross Receipts or Sales","Other Business Income"],
    expenses:["Advertising","Car & Truck — Gasoline","Contract Labor (1099-NEC)","Insurance","Interest Expense","Legal & Professional","Office Expenses","Rent — Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Meals (50% deductible)","Utilities","Other Business Expenses"],
    nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"],
  },
};

const getCatType = (cat,et) => {
  const c=CATEGORIES[et]||CATEGORIES.smllc;
  if(c.income.includes(cat)) return "income";
  if(c.expenses.includes(cat)) return "expense";
  if(c.nonDeduc.includes(cat)) return "nondeduc";
  return "other";
};
const TYPE_META = {
  income:  {bg:"#f0fdf4",text:"#15803d",dot:"#10b981"},
  expense: {bg:"#f0f9ff",text:"#0369a1",dot:BRAND.touchColor},
  nondeduc:{bg:"#fdf4ff",text:"#7e22ce",dot:"#a855f7"},
  other:   {bg:"#f8fafc",text:"#475569",dot:"#94a3b8"},
};

function parseBankText(text) {
  const txns=[], lines=text.split(/\n|\r\n/), seen=new Set();
  const patterns=[
    /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.{3,80?}?)\s+([-–]?\$?[\d,]+\.\d{2})(?:\s|$)/,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-–]?\$?[\d,]+\.\d{2})$/,
    /^(\d{2}\/\d{2})\s+(.{4,70}?)\s{2,}([-–]?\$?[\d,]+\.\d{2})/,
    /^(\d{2}\/\d{2}\/\d{4})\s+([A-Z#].*?)\s+([-–]?\$?[\d,]+\.\d{2})\s*([-–]?\$?[\d,]+\.\d{2})?/,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-–]?\$?[\d,]+\.\d{2})\s+([-–]?\$?[\d,]+\.\d{2})/,
  ];
  for(let i=0;i<lines.length;i++){
    const raw=lines[i].trim().replace(/\s{2,}/g," ");
    if(raw.length<8) continue;
    let matched=false;
    for(const pat of patterns){
      const m=pat.exec(raw); if(!m) continue;
      const dateStr=m[1],desc=(m[2]||"").trim().replace(/\s+/g," ");
      const rawAmt=(m[3]||"").replace(/[$,\s]/g,"").replace("–","-");
      const amt=parseFloat(rawAmt);
      if(!desc||isNaN(amt)||Math.abs(amt)<0.01) continue;
      if(/^(date|description|balance|amount|total|beginning|ending|transaction)/i.test(desc)) continue;
      const key=`${dateStr}|${desc}|${amt}`; if(seen.has(key)) continue; seen.add(key);
      let date=dateStr; const parts=dateStr.split("/");
      if(parts.length===3&&parts[2].length===2){const yr=parseInt(parts[2]);date=`${parts[0]}/${parts[1]}/${yr<50?2000+yr:1900+yr}`;}
      else if(parts.length===2){date=`${parts[0]}/${parts[1]}/${new Date().getFullYear()}`;}
      txns.push({id:`p${i}-${Math.random().toString(36).slice(2)}`,date,description:desc,amount:amt,aiCategory:null,status:"unclassified"});
      matched=true; break;
    }
    if(!matched){
      const ld=/(\d{1,2}\/\d{1,2}\/\d{2,4})/.exec(raw),la=/([-–]?\$?[\d,]{1,10}\.\d{2})(?:\s|$)/.exec(raw);
      if(ld&&la){const amt=parseFloat(la[1].replace(/[$,\s]/g,"").replace("–","-"));
        if(!isNaN(amt)&&Math.abs(amt)>0.01){const after=raw.slice(ld.index+ld[0].length).trim();
          const desc=(after.slice(0,after.lastIndexOf(la[1])).trim()||after.slice(0,60)).replace(/\s+/g," ").trim();
          if(desc.length>2){const key=`${ld[1]}|${desc}|${amt}`;if(!seen.has(key)){seen.add(key);txns.push({id:`p${i}-${Math.random().toString(36).slice(2)}`,date:ld[1],description:desc,amount:amt,aiCategory:null,status:"unclassified"});}}}}
    }
  }
  return txns;
}

async function parsePDF(file){
  return new Promise(resolve=>{
    if(!window.pdfjsLib){resolve([]);return;}
    const reader=new FileReader();
    reader.onload=async(e)=>{
      try{
        const pdf=await window.pdfjsLib.getDocument({data:e.target.result}).promise;
        let fullText="";
        for(let p=1;p<=pdf.numPages;p++){
          const page=await pdf.getPage(p),content=await page.getTextContent(),byY={};
          for(const item of content.items){const y=Math.round(item.transform[5]);if(!byY[y])byY[y]=[];byY[y].push({x:item.transform[4],str:item.str});}
          for(const y of Object.keys(byY).map(Number).sort((a,b)=>b-a)){fullText+=byY[y].sort((a,b)=>a.x-b.x).map(r=>r.str).join(" ")+"\n";}
        }
        resolve(parseBankText(fullText));
      }catch(e){console.error("PDF parse error:",e);resolve([]);}
    };
    reader.readAsArrayBuffer(file);
  });
}

async function parseSpreadsheet(file){
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:"binary"}),ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""}),txns=[];
        rows.forEach((row,i)=>{if(i===0)return;const date=String(row[0]||"").trim(),desc=String(row[1]||"").trim();
          const raw=String(row[2]||row[3]||"").replace(/[$,\s]/g,""),amt=parseFloat(raw);
          if(date&&desc&&!isNaN(amt))txns.push({id:`x${i}-${Math.random()}`,date,description:desc,amount:amt,aiCategory:null,status:"unclassified"});});
        resolve(txns);
      }catch{resolve([]);}
    };
    reader.readAsBinaryString(file);
  });
}

const ENTITY_RULES={
  smllc:`SCHEDULE C: Business payments received→Gross Receipts. Insurance premiums→Insurance (Business). Internet/cable/electricity/phone→Utilities. Employee payroll→Wages (W-2 Employees). Fuel/gas stations→Car & Truck — Gasoline. Vehicle repairs→Car & Truck — Repairs. Owner withdrawals→Owner's Draw (NOT deductible). Loan interest→Interest — Other. State/county taxes→Taxes & Licenses. Contractor payments→Contract Labor (1099-NEC). Attorney/accountant fees→Legal & Professional Services. Personal grocery/clothing→Personal (Non-Deductible). Bank-to-bank transfers→Transfer. Business meals→Meals (50% deductible).`,
  scorp:`FORM 1120-S: Owner-employee salary→Compensation of Officers (REQUIRED). Shareholder distributions→Shareholder Distributions (NOT deductible). Employees W-2→Salaries & Wages.`,
  ccorp:`FORM 1120: Executive salaries→Compensation of Officers. Dividends→Dividends Paid (NOT deductible). Donations→Charitable Contributions (max 10%).`,
  mmllc:`FORM 1065: Fixed partner payments→Guaranteed Payments to Partners. Distributions→Partner Distributions (K-1).`,
  partnership:`FORM 1065: Same rules as MMLLC.`,
  sole_prop:`SCHEDULE C: Same as SMLLC. Owner draws→Owner's Draw (NOT deductible).`,
};

async function classifyBatch(batch,entityType){
  const cfg=ENTITY_CONFIGS[entityType],cats=CATEGORIES[entityType]||CATEGORIES.smllc;
  const allCats=[...cats.income,...cats.expenses,...cats.nonDeduc];
  const prompt=`You are a US tax expert for ${cfg.label} (${cfg.form}).\n${ENTITY_RULES[entityType]||""}\nCategories: ${allCats.map((c,i)=>`${i+1}. ${c}`).join(", ")}\nRespond ONLY valid JSON array, no markdown:\n[{"id":<id>,"category":"<exact label>","confidence":<0.0-1.0>,"note":"<brief IRS reason>"}]\nTransactions: ${JSON.stringify(batch.map(t=>({id:t.id,date:t.date,description:t.description,amount:t.amount})))}`;
  try{
    const res=await fetch("/api/classify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
    const data=await res.json();
    return JSON.parse((data.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim());
  }catch(e){console.error("classifyBatch error:",e);return[];}
}

function exportPDF(txns,entityType,userName,company){
  const cfg=ENTITY_CONFIGS[entityType]||ENTITY_CONFIGS.smllc;
  const income=txns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const expense=txns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const date=new Date().toLocaleDateString("en-US");
  const rows=txns.map(t=>`<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:6px 8px;font-size:11px;color:#64748b">${t.date}</td><td style="padding:6px 8px;font-size:11px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td><td style="padding:6px 8px;font-size:11px;text-align:right;color:${t.amount>=0?"#10b981":"#334155"}">${t.amount>=0?"+":"–"}$${Math.abs(t.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</td><td style="padding:6px 8px;font-size:11px">${t.aiCategory||"—"}</td><td style="padding:6px 8px;font-size:11px;text-align:center;color:${t.status==="approved"?"#10b981":t.status==="rejected"?"#ef4444":"#f59e0b"}">${t.status==="approved"?"✓ Approved":t.status==="rejected"?"✗ Rejected":"Pending"}</td></tr>`).join("");
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OneTouch Tax Report</title><style>body{font-family:'Arial',sans-serif;margin:0;padding:32px;color:#0f172a;background:#fff}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0a2a5e;color:#fff;padding:8px;font-size:11px;text-align:left}.summary{display:flex;gap:24px;margin:20px 0}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;flex:1}.box-label{font-size:11px;color:#64748b;margin-bottom:4px}.box-val{font-size:22px;font-weight:700}@media print{body{padding:16px}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0a2a5e;padding-bottom:16px;margin-bottom:20px"><div><h1 style="font-size:22px;margin:0">OneTouch Tax — Transaction Report</h1><p style="color:#64748b;font-size:12px;margin:4px 0 0">${company} · ${cfg.label} (${cfg.form})</p></div><div style="text-align:right;font-size:12px;color:#64748b"><div>${userName}</div><div>Generated: ${date}</div><div style="margin-top:2px;font-size:10px;color:#cbd5e1">OneTouch Tax ${APP_VERSION}</div></div></div><div class="summary"><div class="box"><div class="box-label">Gross Receipts</div><div class="box-val" style="color:#10b981">$${income.toLocaleString("en-US",{minimumFractionDigits:2})}</div></div><div class="box"><div class="box-label">Deductible Expenses</div><div class="box-val" style="color:#1055b8">$${expense.toLocaleString("en-US",{minimumFractionDigits:2})}</div></div><div class="box"><div class="box-label">Net Income (est.)</div><div class="box-val" style="color:#0a2a5e">$${(income-expense).toLocaleString("en-US",{minimumFractionDigits:2})}</div></div><div class="box"><div class="box-label">Total Transactions</div><div class="box-val" style="color:#8b5cf6">${txns.length}</div></div></div><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>IRS Category</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:24px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px">OneTouch Tax ${APP_VERSION} · IRS Compliant · This report is for informational purposes only. Consult a qualified CPA before filing.</div><script>window.onload=()=>window.print()</script></body></html>`;
  const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
}

function exportQBO(txns,entityType,company){
  const lines=["!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO","!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO","!ENDTRNS"];
  txns.forEach((t,i)=>{const acct=t.aiCategory||"Uncategorized",memo=t.description.replace(/\t/g," "),amt=t.amount.toFixed(2);lines.push(`TRNS\t${i+1}\tGENERAL JOURNAL\t${t.date}\t${acct}\t${company}\t${amt}\t${memo}`);lines.push(`SPL\t${i+1}\tGENERAL JOURNAL\t${t.date}\tChecking\t${company}\t${(-t.amount).toFixed(2)}\t${memo}`);lines.push("ENDTRNS");});
  const blob=new Blob([lines.join("\n")],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`onetouchtax_${new Date().toISOString().slice(0,10)}.iif`;a.click();URL.revokeObjectURL(url);
}

const ConfBar=({v=0})=>{const c=v>=.85?"#10b981":v>=.6?"#f59e0b":"#ef4444";return(<div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:40,height:4,background:"#e2e8f0",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${v*100}%`,background:c,borderRadius:2}}/></div><span style={{fontSize:10,color:c,fontWeight:700}}>{Math.round(v*100)}%</span></div>);};
const CatBadge=({label,entityType})=>{const s=TYPE_META[getCatType(label,entityType)];return <span style={{background:s.bg,color:s.text,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,display:"inline-block",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>;};

const OneTouchZone=({onDone,entityType})=>{
  const [phase,setPhase]=useState("idle"),[progress,setProgress]=useState(0),[count,setCount]=useState(0),[dragging,setDragging]=useState(false),fileRef=useRef();
  useEffect(()=>{if(!window.pdfjsLib){const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";};document.head.appendChild(s);}},[]);
  const process=useCallback(async(file)=>{
    const ext=file.name.split(".").pop().toLowerCase();
    setPhase("reading");setProgress(10);
    let raw=ext==="pdf"?await parsePDF(file):await parseSpreadsheet(file);
    if(raw.length===0){setPhase("idle");return;}
    setCount(raw.length);setPhase("classifying");setProgress(30);
    const result=[...raw];
    for(let i=0;i<raw.length;i+=15){
      const batch=raw.slice(i,i+15),classified=await classifyBatch(batch,entityType);
      const map={};classified.forEach(r=>{map[r.id]=r;});
      batch.forEach((t,bi)=>{result[i+bi]=map[t.id]?{...t,aiCategory:map[t.id].category,aiConfidence:map[t.id].confidence,aiNote:map[t.id].note,status:"pending"}:{...t,aiCategory:"Other Business Expenses",aiConfidence:.4,status:"pending"};});
      setProgress(30+Math.round(((i+15)/raw.length)*65));
    }
    setProgress(100);setPhase("done");setTimeout(()=>onDone(result),600);
  },[entityType,onDone]);
  const handleFile=f=>{if(f)process(f);};
  const onDrop=useCallback(e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files?.[0]);},[handleFile]);
  const icons={idle:"📂",reading:"🔍",classifying:"📲",done:"✅"};
  const titles={idle:<>Arraste o extrato <span style={{color:BRAND.touchColor}}>aqui</span></>,reading:"Lendo arquivo...",classifying:`Classificando ${count} transações...`,done:`${count} transações classificadas!`};
  return(
    <div onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>phase==="idle"&&fileRef.current?.click()}
      style={{border:`2px dashed ${dragging?BRAND.touchColor:phase==="done"?"#10b981":"#bae6fd"}`,borderRadius:20,padding:"52px 32px",textAlign:"center",cursor:phase==="idle"?"pointer":"default",background:dragging?"#f0f9ff":phase==="done"?"#f0fdf4":"#f8fbff",transition:"all .2s"}}>
      <div style={{fontSize:48,marginBottom:14,animation:phase==="classifying"?"spin 1.5s linear infinite":phase==="idle"?"float 3s ease-in-out infinite":"none"}}>{icons[phase]}</div>
      <div style={{fontFamily:"'Manrope',system-ui",fontSize:19,fontWeight:700,color:"#0f172a",marginBottom:6}}>{titles[phase]}</div>
      <div style={{fontSize:13,color:"#64748b"}}>{phase==="idle"?"PDF · Excel · CSV — classificação automática":phase==="classifying"?`${ENTITY_CONFIGS[entityType]?.form} · ${progress}% concluído`:"Abrindo painel..."}</div>
      {phase!=="idle"&&<div style={{marginTop:18,height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden",maxWidth:280,margin:"18px auto 0"}}><div style={{height:"100%",width:`${progress}%`,borderRadius:3,background:phase==="done"?"#10b981":BRAND.gradient,transition:"width .4s ease"}}/></div>}
      {phase==="idle"&&<div style={{marginTop:18,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>{["📄 PDF","📊 Excel (.xlsx)","📃 CSV"].map(f=><span key={f} style={{background:"#e0f2fe",color:"#0369a1",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20}}>{f}</span>)}</div>}
      <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.xlsm,.csv" style={{display:"none"}} onChange={e=>handleFile(e.target.files?.[0])}/>
    </div>
  );
};

const RULES_TEXT=`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}`;

const FirestoreSetup=({fbUser,onRetry})=>{
  const [step,setStep]=useState(1),[copied,setCopied]=useState(false),[creating,setCreating]=useState(false),[done,setDone]=useState(false),[name,setName]=useState("");
  const copy=(text)=>{navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2500);};
  const createDoc=async()=>{if(!name.trim())return;setCreating(true);try{await setDoc(doc(db,"users",fbUser.uid),{name:name.trim(),email:fbUser.email,role:"admin",company:"OneTouch Tax",active:true,createdAt:new Date().toISOString()});setDone(true);setTimeout(()=>onRetry(),1500);}catch(e){alert("Erro: "+e.message);}setCreating(false);};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f7ff,#e8f4ff)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',system-ui",padding:24}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.inp2{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:11px 14px;border-radius:10px;font-size:14px;width:100%;outline:none;font-family:inherit;transition:border-color .2s;}.inp2:focus{border-color:${BRAND.touchColor};}`}</style>
      <div style={{width:"100%",maxWidth:560,background:"#fff",borderRadius:24,border:"1px solid #e2e8f0",boxShadow:`0 24px 64px ${BRAND.touchColor}14`,overflow:"hidden"}}>
        <div style={{background:BRAND.gradient,padding:"24px 32px",display:"flex",alignItems:"center",gap:14}}><div style={{fontSize:28}}>🔧</div><div><div style={{color:"#fff",fontWeight:800,fontSize:18}}>Configuração inicial</div><div style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:2}}>2 passos para liberar o acesso</div></div></div>
        <div style={{padding:"28px 32px"}}>
          <div style={{display:"flex",gap:8,marginBottom:24}}>{[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:2,background:step>=s?BRAND.touchColor:"#e2e8f0",transition:"background .3s"}}/>)}</div>
          {step===1&&(<div>
            <h2 style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:6}}>Passo 1 — Publicar regras do Firestore</h2>
            <p style={{color:"#64748b",fontSize:13,marginBottom:16,lineHeight:1.6}}>Cole as regras abaixo e clique em <strong>Publicar</strong>.</p>
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:16,marginBottom:14,position:"relative"}}>
              <pre style={{margin:0,fontSize:11,color:"#334155",fontFamily:"'Courier New',monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{RULES_TEXT}</pre>
              <button onClick={()=>copy(RULES_TEXT)} style={{position:"absolute",top:10,right:10,background:copied?"#10b981":BRAND.gradient,color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{copied?"✓ Copiado!":"📋 Copiar"}</button>
            </div>
            <a href="https://console.firebase.google.com/project/onetouchtax-a3c84/firestore/rules" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:8,background:"#f0f9ff",border:`1.5px solid ${BRAND.touchColor}`,borderRadius:12,padding:"12px 16px",textDecoration:"none",marginBottom:20}}>
              <span style={{fontSize:20}}>🔗</span><div><div style={{color:BRAND.touchColor,fontWeight:700,fontSize:13}}>Abrir Firestore Rules →</div><div style={{color:"#64748b",fontSize:11,marginTop:1}}>console.firebase.google.com · Aba "Regras"</div></div>
            </a>
            <button onClick={()=>setStep(2)} style={{width:"100%",background:BRAND.gradient,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Regras publicadas → Próximo passo</button>
          </div>)}
          {step===2&&(<div>
            <h2 style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:6}}>Passo 2 — Criar perfil Admin</h2>
            <p style={{color:"#64748b",fontSize:13,marginBottom:16,lineHeight:1.6}}>Logado como <strong>{fbUser.email}</strong>. Informe seu nome.</p>
            <div style={{marginBottom:16}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Nome completo</label><input className="inp2" placeholder="Ex: Marcelo Queiroz" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createDoc()}/></div>
            {done?(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:36,marginBottom:8}}>✅</div><div style={{fontWeight:700,color:"#15803d",fontSize:15}}>Perfil criado! Entrando...</div></div>):(
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setStep(1)} style={{background:"none",border:"1px solid #e2e8f0",color:"#64748b",borderRadius:12,padding:"13px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Voltar</button>
                <button onClick={createDoc} disabled={creating||!name.trim()} style={{flex:1,background:creating||!name.trim()?"#94a3b8":BRAND.gradient,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:creating||!name.trim()?"not-allowed":"pointer",fontFamily:"inherit"}}>{creating?"Criando...":"✓ Criar perfil Admin"}</button>
              </div>
            )}
          </div>)}
        </div>
      </div>
    </div>
  );
};

const ClientApp=({user,onLogout})=>{
  const [tab,setTab]=useState("home"),[entityType,setEntityType]=useState(user.entityType||"smllc"),[txns,setTxns]=useState([]);
  const cfg=ENTITY_CONFIGS[entityType];
  const income=txns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const expense=txns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const pending=txns.filter(t=>t.status==="pending").length,approved=txns.filter(t=>t.status==="approved").length;
  const NAV=[{id:"home",label:"Home",icon:"🏠"},{id:"import",label:"Importar",icon:"📂"},{id:"transactions",label:"Transações",icon:"📋"},{id:"export",label:"Exportar",icon:"📤"},{id:"settings",label:"Config.",icon:"⚙️"}];
  const approveT=id=>setTxns(p=>p.map(t=>t.id===id?{...t,status:"approved"}:t));
  const rejectT=id=>setTxns(p=>p.map(t=>t.id===id?{...t,status:"rejected"}:t));
  const approveAll=()=>setTxns(p=>p.map(t=>t.status==="pending"?{...t,status:"approved"}:t));
  return(
    <div style={{minHeight:"100vh",background:"#f8faff",fontFamily:"'Manrope',system-ui",display:"flex"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.ntb{background:none;border:none;padding:9px 14px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px;transition:all .15s;color:#64748b;width:100%;}.ntb.a{background:#f0f9ff;color:${BRAND.touchColor};font-weight:700;}.ntb:hover:not(.a){background:#f1f5f9;color:#334155;}.card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:22px;}.ab{border:none;padding:5px 11px;border-radius:7px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:3px;}.gn{background:#f0fdf4;color:#15803d;}.gn:hover{background:#dcfce7;}.rd{background:#fef2f2;color:#dc2626;}.rd:hover{background:#fee2e2;}@keyframes spin{to{transform:rotate(360deg);}}@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}`}</style>
      <div style={{width:212,background:"#fff",borderRight:"1px solid #e2e8f0",padding:"20px 12px",display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><NavLogo/></div>
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:9,padding:"7px 10px",marginBottom:16}}>
          <div style={{fontSize:10,color:BRAND.touchColor,fontWeight:800,textTransform:"uppercase",letterSpacing:.8}}>{cfg.form}</div>
          <div style={{fontSize:12,color:BRAND.arcOuter,fontWeight:600,marginTop:1}}>{cfg.label}</div>
        </div>
        <nav style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
          {NAV.map(n=><button key={n.id} className={`ntb ${tab===n.id?"a":""}`} onClick={()=>setTab(n.id)}>{n.icon} {n.label}{n.id==="import"&&<span style={{marginLeft:"auto",background:BRAND.touchColor,color:"#fff",fontSize:9,fontWeight:800,padding:"1px 7px",borderRadius:10}}>1 toque</span>}{n.id==="transactions"&&pending>0&&<span style={{marginLeft:"auto",background:"#f59e0b",color:"#fff",fontSize:9,fontWeight:800,padding:"1px 7px",borderRadius:10}}>{pending}</span>}</button>)}
        </nav>
        <div style={{borderTop:"1px solid #f1f5f9",paddingTop:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px 10px"}}><AppIcon size={30}/><div><div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{user.name?.split(" ")[0]}</div><div style={{fontSize:10,color:"#94a3b8"}}>Cliente</div></div></div>
          <button className="ntb" onClick={onLogout} style={{color:"#ef4444"}}>🚪 Sair</button>
          <VersionBadge/>
        </div>
      </div>
      <div style={{marginLeft:212,flex:1,padding:"28px 28px 48px"}}>
        {tab==="home"&&<div>
          <div style={{marginBottom:22}}><h1 style={{fontFamily:"'Manrope',system-ui",fontSize:28,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Olá, {user.name?.split(" ")[0]} 👋</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>{user.company} · {cfg.form}</p></div>
          <div className="card" style={{marginBottom:18,borderTop:`3px solid ${BRAND.touchColor}`,background:"linear-gradient(135deg,#f0f9ff,#fff)"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}><span style={{fontSize:30}}>⚡</span><div><div style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>One Touch — Importar agora</div><div style={{fontSize:13,color:"#64748b"}}>Solte seu extrato. O app classifica tudo.</div></div></div>
            <OneTouchZone onDone={t=>{setTxns(p=>[...p,...t]);setTab("transactions");}} entityType={entityType}/>
          </div>
          {txns.length===0?(<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>📂</div><div style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:8}}>Nenhuma transação ainda</div><div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Importe seu primeiro extrato para começar.</div><button onClick={()=>setTab("import")} style={{background:BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Importar extrato →</button></div>)
          :(<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>{[{l:"Receita Total",v:`$${income.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:"#10b981",i:"📈"},{l:"Deduções",v:`$${expense.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:BRAND.touchColor,i:"📉"},{l:"Transações",v:txns.length,c:"#8b5cf6",i:"📋"},{l:"Pendentes",v:pending,c:"#f59e0b",i:"⏳"}].map((s,i)=><div key={i} className="card" style={{borderTop:`3px solid ${s.c}`}}><div style={{fontSize:24,marginBottom:6}}>{s.i}</div><div style={{fontFamily:"'Manrope',system-ui",fontSize:26,fontWeight:800,color:s.c,letterSpacing:"-1px"}}>{s.v}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2,fontWeight:500}}>{s.l}</div></div>)}</div>)}
        </div>}
        {tab==="import"&&<div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-1px"}}>Importar Extrato</h1>
          <p style={{color:"#64748b",margin:"0 0 22px",fontSize:13}}>Um arquivo. Um clique. Classificação imediata — regras <strong>{cfg.form}</strong>.</p>
          <OneTouchZone onDone={t=>{setTxns(p=>[...p,...t]);setTab("transactions");}} entityType={entityType}/>
          <div className="card" style={{marginTop:16}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>Formatos suportados</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>{[{icon:"📄",label:"PDF",desc:"Bank of America, Chase, Wells Fargo e outros."},{icon:"📊",label:"Excel (.xlsx)",desc:"Colunas: Date, Description, Amount."},{icon:"📃",label:"CSV",desc:"Exportação QuickBooks ou banco."}].map(f=><div key={f.label} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:16}}><div style={{fontSize:26,marginBottom:8}}>{f.icon}</div><div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:4}}>{f.label}</div><div style={{fontSize:11,color:"#64748b",lineHeight:1.5}}>{f.desc}</div></div>)}</div></div>
        </div>}
        {tab==="transactions"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:0,letterSpacing:"-1px"}}>Transações</h1>
            <div style={{display:"flex",gap:8}}>
              {pending>0&&<button onClick={approveAll} style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #86efac",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Confirmar todas ({pending})</button>}
              <button onClick={()=>setTab("import")} style={{background:BRAND.gradient,color:"#fff",padding:"9px 18px",borderRadius:10,border:"none",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Importar</button>
            </div>
          </div>
          {txns.length===0?(<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>📋</div><div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:6}}>Nenhuma transação</div><div style={{fontSize:13,color:"#94a3b8"}}>Importe um extrato para começar.</div></div>)
          :(<div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"88px 1fr 108px 170px 80px 110px",gap:10,padding:"10px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}>
              <span>Data</span><span>Descrição</span><span style={{textAlign:"right"}}>Valor</span><span>Classificação</span><span>Conf.</span><span style={{textAlign:"center"}}>Ação</span>
            </div>
            {txns.map(t=>(<div key={t.id} style={{display:"grid",gridTemplateColumns:"88px 1fr 108px 170px 80px 110px",gap:10,alignItems:"center",padding:"11px 16px",borderBottom:"1px solid #f8fafc",background:t.status==="approved"?"#f0fdf4":t.status==="rejected"?"#fef2f2":"#fff"}}>
              <span style={{fontSize:11,color:"#94a3b8"}}>{t.date}</span>
              <span style={{fontSize:12,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</span>
              <span style={{fontSize:12,fontWeight:700,textAlign:"right",color:t.amount>=0?"#10b981":"#64748b"}}>{t.amount>=0?"+":"–"}${Math.abs(t.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</span>
              <CatBadge label={t.aiCategory||"—"} entityType={entityType}/>
              <ConfBar v={t.aiConfidence||0}/>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                {t.status==="approved"?<span style={{fontSize:10,fontWeight:700,color:"#10b981"}}>✓ Ok</span>:t.status==="rejected"?<span style={{fontSize:10,fontWeight:700,color:"#ef4444"}}>✗ Rev.</span>:(<><button className="ab gn" onClick={()=>approveT(t.id)}>✓</button><button className="ab rd" onClick={()=>rejectT(t.id)}>✕</button></>)}
              </div>
            </div>))}
          </div>)}
          <div style={{marginTop:10,fontSize:11,color:"#94a3b8",display:"flex",gap:16}}><span>✓ Confirmadas: <strong>{approved}</strong></span><span>⏳ Pendentes: <strong>{pending}</strong></span></div>
        </div>}
        {tab==="export"&&<div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-1px"}}>Exportar</h1>
          <p style={{color:"#64748b",margin:"0 0 28px",fontSize:13}}>Exporte as transações classificadas em dois formatos.</p>
          {txns.length===0?(<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>📤</div><div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:6}}>Nenhuma transação para exportar</div><button onClick={()=>setTab("import")} style={{background:BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Importar extrato →</button></div>)
          :(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div className="card" style={{borderTop:"3px solid #ef4444"}}><div style={{fontSize:40,marginBottom:14}}>📄</div><h3 style={{fontFamily:"'Manrope',system-ui",fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:8}}>Relatório PDF</h3><p style={{color:"#64748b",fontSize:13,lineHeight:1.6,marginBottom:16}}>Relatório completo com todas as transações. Ideal para envio ao contador.</p><ul style={{listStyle:"none",marginBottom:20,display:"flex",flexDirection:"column",gap:6}}>{["✓ Todas as transações listadas","✓ Resumo de receitas e despesas","✓ Categorias IRS incluídas","✓ Pronto para imprimir"].map(f=><li key={f} style={{fontSize:12,color:"#475569"}}>{f}</li>)}</ul><div style={{marginBottom:12,padding:"10px 14px",background:"#f8fafc",borderRadius:10,fontSize:12,color:"#64748b"}}><strong>{txns.length}</strong> transações · <strong>{approved}</strong> confirmadas · <strong>{pending}</strong> pendentes</div><button onClick={()=>exportPDF(txns,entityType,user.name,user.company)} style={{width:"100%",background:"#ef4444",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>📄 Exportar PDF →</button></div>
            <div className="card" style={{borderTop:"3px solid #10b981"}}><div style={{fontSize:40,marginBottom:14}}>🏦</div><h3 style={{fontFamily:"'Manrope',system-ui",fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:8}}>QuickBooks (.IIF)</h3><p style={{color:"#64748b",fontSize:13,lineHeight:1.6,marginBottom:16}}>Arquivo IIF compatível com QuickBooks Desktop e Online.</p><ul style={{listStyle:"none",marginBottom:20,display:"flex",flexDirection:"column",gap:6}}>{["✓ Formato IIF (QuickBooks nativo)","✓ Lançamentos por categoria IRS","✓ Compatível com QB Desktop & Online","✓ Importação direta sem ajustes"].map(f=><li key={f} style={{fontSize:12,color:"#475569"}}>{f}</li>)}</ul><div style={{marginBottom:12,padding:"10px 14px",background:"#f8fafc",borderRadius:10,fontSize:12,color:"#64748b"}}><strong>{txns.length}</strong> transações · Empresa: <strong>{user.company||"—"}</strong></div><button onClick={()=>exportQBO(txns,entityType,user.company)} style={{width:"100%",background:"#10b981",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🏦 Exportar QuickBooks (.IIF) →</button></div>
          </div>)}
          <div style={{marginTop:16,padding:"12px 16px",background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,fontSize:12,color:"#92400e"}}>💡 <strong>Dica:</strong> Confirme as transações antes de exportar.</div>
        </div>}
        {tab==="settings"&&<div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 22px",letterSpacing:"-1px"}}>Configurações</h1>
          <div className="card" style={{marginBottom:16}}><h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:14}}>🏢 Tipo de Empresa</h3><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>{Object.entries(ENTITY_CONFIGS).map(([key,c])=><div key={key} onClick={()=>setEntityType(key)} style={{padding:"14px 16px",borderRadius:12,cursor:"pointer",transition:"all .15s",border:`1.5px solid ${entityType===key?c.color:"#e2e8f0"}`,background:entityType===key?"#f8faff":"#fff"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{c.label}</div>{entityType===key&&<span style={{fontSize:11,fontWeight:700,color:c.color}}>✓</span>}</div><div style={{fontSize:11,color:c.color,fontWeight:600,marginTop:2}}>{c.form}</div></div>)}</div></div>
          <div className="card"><h3 style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:12}}>👤 Perfil</h3>{[["Nome",user.name],["E-mail",user.email],["Empresa",user.company],["Banco",user.bank||"—"],["Conta",user.account||"—"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}><span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:600,color:"#0f172a"}}>{v}</span></div>)}</div>
        </div>}
      </div>
    </div>
  );
};

const AccountantApp=({user,onLogout})=>{
  const [entityType,setEntityType]=useState("smllc"),[txns,setTxns]=useState([]),[filter,setFilter]=useState("pending"),[search,setSearch]=useState(""),[editId,setEditId]=useState(null),[editCat,setEditCat]=useState("");
  const cfg=ENTITY_CONFIGS[entityType],cats=CATEGORIES[entityType]||CATEGORIES.smllc;
  const filtered=txns.filter(t=>filter==="all"?true:t.status===filter).filter(t=>search?t.description.toLowerCase().includes(search.toLowerCase()):true);
  const counts={all:txns.length,pending:txns.filter(t=>t.status==="pending").length,approved:txns.filter(t=>t.status==="approved").length,rejected:txns.filter(t=>t.status==="rejected").length};
  const approve=id=>setTxns(p=>p.map(t=>t.id===id?{...t,status:"approved"}:t));
  const reject=id=>setTxns(p=>p.map(t=>t.id===id?{...t,status:"rejected"}:t));
  const saveEdit=id=>{setTxns(p=>p.map(t=>t.id===id?{...t,finalCategory:editCat,aiCategory:editCat,status:"pending"}:t));setEditId(null);};
  return(
    <div style={{minHeight:"100vh",background:"#f8faff",fontFamily:"'Manrope',system-ui"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.fc{background:none;border:1px solid #e2e8f0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;color:#64748b;}.fc.a{background:${BRAND.arcOuter};border-color:${BRAND.arcOuter};color:#fff;}.fc:hover:not(.a){border-color:${BRAND.touchColor};color:${BRAND.touchColor};}.ab{border:none;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:4px;}.gn{background:#f0fdf4;color:#15803d;}.gn:hover{background:#dcfce7;}.rd{background:#fef2f2;color:#dc2626;}.rd:hover{background:#fee2e2;}.bl{background:#f0f9ff;color:${BRAND.touchColor};}.bl:hover{background:#e0f2fe;}select.cs{border:1.5px solid ${BRAND.touchColor};border-radius:8px;padding:4px 9px;font-family:inherit;font-size:11px;color:#0f172a;background:#fff;outline:none;}.si{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:8px 13px;border-radius:9px;font-size:13px;outline:none;font-family:inherit;transition:border-color .2s;width:240px;}.si:focus{border-color:${BRAND.touchColor};}`}</style>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}><NavLogo/><span style={{color:"#94a3b8",fontSize:13}}>/ Contador</span><select value={entityType} onChange={e=>setEntityType(e.target.value)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#334155",padding:"5px 10px",borderRadius:8,fontFamily:"inherit",fontSize:12,outline:"none",cursor:"pointer"}}>{Object.entries(ENTITY_CONFIGS).map(([k,c])=><option key={k} value={k}>{c.label} · {c.form}</option>)}</select></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#cbd5e1",background:"#f1f5f9",padding:"2px 8px",borderRadius:20,letterSpacing:"1px"}}>{APP_VERSION}</span>
          <span style={{fontSize:13,color:"#64748b"}}>{user.name}</span>
          <button onClick={onLogout} style={{background:"none",border:"1px solid #e2e8f0",color:"#64748b",padding:"5px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Sair</button>
        </div>
      </div>
      <div style={{padding:"24px 24px 48px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div><h1 style={{fontFamily:"'Manrope',system-ui",fontSize:22,fontWeight:800,color:"#0f172a",margin:"0 0 3px",letterSpacing:"-0.8px"}}>Validação de Transações</h1><div style={{fontSize:12,color:"#64748b"}}>{cfg.label} · {cfg.form}</div></div>
          {counts.pending>0&&<button className="ab gn" onClick={()=>setTxns(p=>p.map(t=>t.status==="pending"?{...t,status:"approved"}:t))} style={{padding:"9px 18px",fontSize:13,border:"none"}}>✓ Aprovar todas ({counts.pending})</button>}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:18}}>{[["all","Total","#334155"],["pending","Pendentes","#f59e0b"],["approved","Aprovadas","#10b981"],["rejected","Revisão","#ef4444"]].map(([k,l,c])=><div key={k} onClick={()=>setFilter(k)} style={{background:"#fff",border:`1.5px solid ${filter===k?c:"#e2e8f0"}`,borderRadius:12,padding:"10px 18px",cursor:"pointer",transition:"all .15s",boxShadow:filter===k?`0 2px 12px ${c}20`:"none"}}><div style={{fontFamily:"'Manrope',system-ui",fontSize:22,fontWeight:800,color:c,letterSpacing:"-1px"}}>{counts[k]}</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{l}</div></div>)}</div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><input className="si" placeholder="🔍  Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/><div style={{display:"flex",gap:6}}>{[["all","Todas"],["pending","Pendentes"],["approved","Aprovadas"],["rejected","Revisão"]].map(([k,l])=><button key={k} className={`fc ${filter===k?"a":""}`} onClick={()=>setFilter(k)}>{l} ({counts[k]})</button>)}</div></div>
          <div style={{display:"grid",gridTemplateColumns:"85px 1fr 108px 195px 80px 110px",gap:10,padding:"10px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}><span>Data</span><span>Descrição</span><span style={{textAlign:"right"}}>Valor</span><span>Classificação</span><span>Conf.</span><span style={{textAlign:"center"}}>Ações</span></div>
          {filtered.length===0&&<div style={{padding:48,textAlign:"center",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:8}}>{txns.length===0?"📋":"🎉"}</div><div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{txns.length===0?"Nenhuma transação":"Tudo validado!"}</div></div>}
          {filtered.map(t=>{
            const isEd=editId===t.id,type=getCatType(t.finalCategory||t.aiCategory,entityType),tm=TYPE_META[type],rowBg=t.status==="approved"?"#f0fdf4":t.status==="rejected"?"#fef2f2":"#fff";
            return(<div key={t.id} style={{display:"grid",gridTemplateColumns:"85px 1fr 108px 195px 80px 110px",gap:10,alignItems:"center",padding:"11px 16px",borderBottom:"1px solid #f8fafc",background:rowBg}}>
              <span style={{fontSize:11,color:"#94a3b8"}}>{t.date}</span>
              <div><div style={{fontSize:12,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</div>{t.aiNote&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>ℹ {t.aiNote}</div>}</div>
              <span style={{fontSize:12,fontWeight:700,textAlign:"right",color:t.amount>=0?"#10b981":"#64748b"}}>{t.amount>=0?"+":"–"}${Math.abs(t.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</span>
              <div>{isEd?<div style={{display:"flex",gap:5,alignItems:"center"}}><select className="cs" value={editCat} onChange={e=>setEditCat(e.target.value)}><optgroup label="📈 Receitas">{cats.income.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="💼 Deduções">{cats.expenses.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="⛔ Não Dedutíveis">{cats.nonDeduc.map(c=><option key={c} value={c}>{c}</option>)}</optgroup></select><button className="ab gn" onClick={()=>saveEdit(t.id)} style={{border:"none"}}>✓</button><button className="ab rd" onClick={()=>setEditId(null)} style={{border:"none"}}>✕</button></div>:<span style={{background:tm.bg,color:tm.text,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:18,cursor:"pointer",display:"inline-block",maxWidth:185,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} onClick={()=>{setEditId(t.id);setEditCat(t.finalCategory||t.aiCategory);}}>{t.finalCategory||t.aiCategory}</span>}</div>
              <ConfBar v={t.aiConfidence||0}/>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>{t.status!=="approved"&&<button className="ab gn" onClick={()=>approve(t.id)} style={{border:"none"}}>✓</button>}{t.status!=="rejected"&&<button className="ab rd" onClick={()=>reject(t.id)} style={{border:"none"}}>✕</button>}{!isEd&&<button className="ab bl" onClick={()=>{setEditId(t.id);setEditCat(t.finalCategory||t.aiCategory);}} style={{border:"none"}}>✎</button>}</div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
};

const AdminPanel=({user,onLogout})=>{
  const [users,setUsers]=useState([]),[loading,setLoading]=useState(true),[showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",email:"",pass:"",role:"client",company:"",entityType:"smllc",bank:"",account:""}),[creating,setCreating]=useState(false),[msg,setMsg]=useState({text:"",ok:true});
  const loadUsers=async()=>{try{const snap=await getDocs(collection(db,"users"));setUsers(snap.docs.map(d=>({uid:d.id,...d.data()})));}catch{}setLoading(false);};
  useEffect(()=>{loadUsers();},[]);
  const createUser=async()=>{
    if(!form.name||!form.email||!form.pass||!form.company){setMsg({text:"Preencha todos os campos obrigatórios.",ok:false});return;}
    setCreating(true);setMsg({text:"",ok:true});
    try{
      const secondaryApp=initializeApp(FIREBASE_CONFIG,`secondary-${Date.now()}`);
      const secondaryAuth=getAuth(secondaryApp);
      const {user:newUser}=await createUserWithEmailAndPassword(secondaryAuth,form.email,form.pass);
      await setDoc(doc(db,"users",newUser.uid),{name:form.name,email:form.email,role:form.role,company:form.company,entityType:form.entityType,bank:form.bank,account:form.account,active:true,createdAt:new Date().toISOString()});
      await signOut(secondaryAuth);await deleteApp(secondaryApp);
      setMsg({text:`✅ Usuário "${form.name}" criado com sucesso!`,ok:true});
      setForm({name:"",email:"",pass:"",role:"client",company:"",entityType:"smllc",bank:"",account:""});setShowForm(false);loadUsers();
    }catch(e){setMsg({text:`❌ ${e.code==="auth/email-already-in-use"?"E-mail já cadastrado":e.code==="auth/weak-password"?"Senha muito fraca (mín. 6 caracteres)":e.message}`,ok:false});}
    setCreating(false);
  };
  const toggleActive=async(uid,current)=>{try{await updateDoc(doc(db,"users",uid),{active:!current});loadUsers();}catch{}};
  const roleColor={admin:"#7c3aed",accountant:BRAND.touchColor,client:"#10b981"};
  const roleLabel={admin:"Admin",accountant:"Contador",client:"Cliente"};
  return(
    <div style={{minHeight:"100vh",background:"#f8faff",fontFamily:"'Manrope',system-ui"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.inp{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:10px 13px;border-radius:10px;font-size:13px;width:100%;outline:none;font-family:inherit;transition:border-color .2s;}.inp:focus{border-color:${BRAND.touchColor};}.sel{background:#f8fafc;border:1px solid #e2e8f0;color:#334155;border-radius:9px;font-family:inherit;font-size:13px;outline:none;cursor:pointer;width:100%;padding:10px 13px;}`}</style>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><NavLogo/><span style={{background:"#7c3aed",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20,letterSpacing:1}}>ADMIN</span></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:9,fontWeight:700,color:"#cbd5e1",background:"#f1f5f9",padding:"2px 8px",borderRadius:20,letterSpacing:"1px"}}>{APP_VERSION}</span>
          <span style={{fontSize:13,color:"#64748b"}}>{user.name}</span>
          <button onClick={onLogout} style={{background:"none",border:"1px solid #e2e8f0",color:"#64748b",padding:"5px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Sair</button>
        </div>
      </div>
      <div style={{padding:"28px 28px 60px",maxWidth:1000,margin:"0 auto"}}>
        <div style={{marginBottom:24}}><h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Gerenciar Usuários</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>Crie e gerencie clientes e contadores do OneTouch Tax.</p></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>{[{l:"Total",v:users.length,c:"#334155"},{l:"Clientes",v:users.filter(u=>u.role==="client").length,c:"#10b981"},{l:"Contadores",v:users.filter(u=>u.role==="accountant").length,c:BRAND.touchColor},{l:"Admins",v:users.filter(u=>u.role==="admin").length,c:"#7c3aed"}].map((s,i)=><div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 20px",borderTop:`3px solid ${s.c}`}}><div style={{fontFamily:"'Manrope',system-ui",fontSize:28,fontWeight:800,color:s.c,letterSpacing:"-1px"}}>{s.v}</div><div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.l}</div></div>)}</div>
        {msg.text&&<div style={{background:msg.ok?"#f0fdf4":"#fef2f2",border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`,borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:msg.ok?"#15803d":"#dc2626",fontWeight:600}}>{msg.text}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:700,color:"#0f172a",margin:0}}>Usuários cadastrados</h2><button onClick={()=>{setShowForm(!showForm);setMsg({text:"",ok:true});}} style={{background:BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{showForm?"✕ Cancelar":"+ Novo Usuário"}</button></div>
        {showForm&&<div style={{background:"#fff",border:`1.5px solid ${BRAND.touchColor}`,borderRadius:16,padding:24,marginBottom:20}}>
          <h3 style={{fontFamily:"'Manrope',system-ui",fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:18}}>Novo Usuário</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Nome completo *</label><input className="inp" placeholder="João Silva" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>E-mail *</label><input className="inp" type="email" placeholder="joao@empresa.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Senha inicial *</label><input className="inp" type="password" placeholder="Mín. 6 caracteres" value={form.pass} onChange={e=>setForm(f=>({...f,pass:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Perfil *</label><select className="sel" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option value="client">👤 Cliente</option><option value="accountant">🧮 Contador</option><option value="admin">🔑 Admin</option></select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Empresa *</label><input className="inp" placeholder="Sunrise Services LLC" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}/></div>
            {form.role==="client"&&<div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Tipo de entidade</label><select className="sel" value={form.entityType} onChange={e=>setForm(f=>({...f,entityType:e.target.value}))}>{Object.entries(ENTITY_CONFIGS).map(([k,c])=><option key={k} value={k}>{c.label} · {c.form}</option>)}</select></div>}
            {form.role==="client"&&<div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Banco</label><input className="inp" placeholder="Bank of America" value={form.bank} onChange={e=>setForm(f=>({...f,bank:e.target.value}))}/></div>}
            {form.role==="client"&&<div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Conta (mascarada)</label><input className="inp" placeholder="**** **** 1234" value={form.account} onChange={e=>setForm(f=>({...f,account:e.target.value}))}/></div>}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={createUser} disabled={creating} style={{background:creating?"#94a3b8":BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:creating?"not-allowed":"pointer",fontFamily:"inherit"}}>{creating?"Criando...":"✓ Criar Usuário"}</button>
            <span style={{fontSize:12,color:"#94a3b8"}}>Usuário poderá redefinir a senha pelo app.</span>
          </div>
        </div>}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 90px 80px",gap:12,padding:"10px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}><span>Nome / E-mail</span><span>Empresa</span><span>Perfil</span><span style={{textAlign:"center"}}>Status</span><span style={{textAlign:"center"}}>Ação</span></div>
          {loading&&<div style={{padding:36,textAlign:"center",color:"#94a3b8",fontSize:13}}>Carregando...</div>}
          {!loading&&users.length===0&&<div style={{padding:36,textAlign:"center",color:"#94a3b8",fontSize:13}}>Nenhum usuário cadastrado.</div>}
          {users.map(u=><div key={u.uid} style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 90px 80px",gap:12,padding:"13px 16px",borderBottom:"1px solid #f8fafc",alignItems:"center",background:u.active===false?"#fffbeb":"#fff"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{u.name}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{u.email}</div></div>
            <div style={{fontSize:12,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.company||"—"}</div>
            <div><span style={{background:`${roleColor[u.role]||"#94a3b8"}18`,color:roleColor[u.role]||"#94a3b8",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20}}>{roleLabel[u.role]||u.role}</span></div>
            <div style={{textAlign:"center"}}><span style={{fontSize:10,fontWeight:700,color:u.active!==false?"#10b981":"#f59e0b"}}>{u.active!==false?"● Ativo":"○ Inativo"}</span></div>
            <div style={{textAlign:"center"}}><button onClick={()=>toggleActive(u.uid,u.active!==false)} style={{background:u.active!==false?"#fef2f2":"#f0fdf4",color:u.active!==false?"#dc2626":"#15803d",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{u.active!==false?"Desativar":"Ativar"}</button></div>
          </div>)}
        </div>
        <p style={{fontSize:11,color:"#94a3b8",marginTop:12}}>💡 Para redefinir senha: Firebase Console → Authentication → busque o e-mail → Redefinir senha.</p>
      </div>
    </div>
  );
};

const Login=()=>{
  const [email,setEmail]=useState(""),[pass,setPass]=useState(""),[err,setErr]=useState(""),[loading,setLoading]=useState(false),[resetSent,setResetSent]=useState(false);
  const go=async()=>{setLoading(true);setErr("");try{await signInWithEmailAndPassword(auth,email,pass);}catch(e){setErr(e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"||e.code==="auth/user-not-found"?"E-mail ou senha inválidos.":"Erro ao entrar. Tente novamente.");setLoading(false);}};
  const forgotPassword=async()=>{if(!email){setErr("Digite seu e-mail para recuperar a senha.");return;}try{await sendPasswordResetEmail(auth,email);setResetSent(true);setErr("");}catch{setErr("Não foi possível enviar o e-mail de recuperação.");}};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f7ff 0%,#e8f4ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',system-ui"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.li{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:12px 15px;border-radius:10px;font-size:14px;width:100%;outline:none;font-family:inherit;transition:border-color .2s;}.li:focus{border-color:${BRAND.touchColor};}`}</style>
      <div style={{width:420,padding:48,background:"#fff",borderRadius:24,border:"1px solid #e2e8f0",boxShadow:`0 24px 64px ${BRAND.touchColor}14`}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><Logo scale={0.36}/></div>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>Classificação Fiscal · IRS Compliant 2025</div>
          <div style={{marginTop:8}}><span style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"#cbd5e1",background:"#f8fafc",border:"1px solid #e2e8f0",padding:"2px 10px",borderRadius:20}}>{APP_VERSION}</span></div>
        </div>
        {resetSent?(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:40,marginBottom:12}}>📧</div><div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:8}}>E-mail enviado!</div><div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Verifique sua caixa de entrada.</div><button onClick={()=>setResetSent(false)} style={{background:"none",border:"none",color:BRAND.touchColor,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Voltar ao login</button></div>)
        :(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <input className="li" placeholder="E-mail" type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
          <input className="li" placeholder="Senha" type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()}/>
          {err&&<div style={{color:"#ef4444",fontSize:12,textAlign:"center",fontWeight:600}}>{err}</div>}
          <button onClick={go} disabled={loading} style={{background:loading?"#94a3b8":BRAND.gradient,color:"#fff",padding:14,borderRadius:10,border:"none",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginTop:2}}>{loading?"Entrando...":"→ Entrar"}</button>
          <div style={{textAlign:"center"}}><button onClick={forgotPassword} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Esqueci minha senha</button></div>
        </div>)}
      </div>
    </div>
  );
};

const Loading=()=>(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f7ff",fontFamily:"'Manrope',system-ui"}}><div style={{textAlign:"center"}}><AppIcon size={52}/><p style={{marginTop:14,color:"#64748b",fontSize:14,fontWeight:500}}>Carregando...</p></div></div>);

export default function App(){
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[setupData,setSetupData]=useState(null);
  useEffect(()=>{
    return onAuthStateChanged(auth,async(fbUser)=>{
      if(fbUser){
        try{
          const snap=await getDoc(doc(db,"users",fbUser.uid));
          if(snap.exists()&&snap.data().active!==false){setUser({uid:fbUser.uid,email:fbUser.email,...snap.data()});setSetupData(null);}
          else{setSetupData({fbUser,mode:"doc"});setUser(null);}
        }catch(e){
          const isPerm=e.code==="permission-denied"||e.message?.toLowerCase().includes("permission")||e.message?.toLowerCase().includes("missing or insufficient");
          if(isPerm){setSetupData({fbUser,mode:"rules"});}else{setSetupData(null);}setUser(null);
        }
      }else{setUser(null);setSetupData(null);}
      setLoading(false);
    });
  },[]);
  const retryLogin=()=>{setSetupData(null);setLoading(true);const fbUser=auth.currentUser;if(fbUser){getDoc(doc(db,"users",fbUser.uid)).then(snap=>{if(snap.exists()&&snap.data().active!==false)setUser({uid:fbUser.uid,email:fbUser.email,...snap.data()});}).catch(()=>{}).finally(()=>setLoading(false));}else{setLoading(false);}};
  if(loading)return<Loading/>;
  if(setupData)return<FirestoreSetup fbUser={setupData.fbUser} onRetry={retryLogin}/>;
  if(!user)return<Login/>;
  const logout=()=>{signOut(auth);setUser(null);setSetupData(null);};
  if(user.role==="admin")return<AdminPanel user={user} onLogout={logout}/>;
  if(user.role==="accountant")return<AccountantApp user={user} onLogout={logout}/>;
  return<ClientApp user={user} onLogout={logout}/>;
}
