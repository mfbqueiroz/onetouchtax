import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
         createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";

const APP_VERSION = "v1.1.0";

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
  smllc:       { label:"LLC Membro \u00danico",    form:"Schedule C",  color:BRAND.touchColor },
  mmllc:       { label:"LLC Multi-Membros",   form:"Form 1065",   color:"#8b5cf6" },
  scorp:       { label:"S-Corporation",       form:"Form 1120-S", color:"#10b981" },
  ccorp:       { label:"C-Corporation",       form:"Form 1120",   color:"#f59e0b" },
  partnership: { label:"Partnership",         form:"Form 1065",   color:"#ef4444" },
  sole_prop:   { label:"Sole Proprietorship", form:"Schedule C",  color:"#06b6d4" },
};

const CATEGORIES = {
  smllc: {
    income:["Gross Receipts or Sales","Other income"],
    expenses:["Advertising","Car & Truck \u2014 Gasoline","Car & Truck \u2014 Repairs","Contract Labor (1099-NEC)","Depreciation / Section 179","Insurance (Business)","Interest \u2014 Other","Legal & Professional Services","Office Expenses","Rent \u2014 Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Travel (Business)","Meals (50% deductible)","Utilities","Wages (W-2 Employees)","Other Business Expenses"],
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
    expenses:["Advertising","Car & Truck \u2014 Gasoline","Contract Labor (1099-NEC)","Insurance","Interest Expense","Legal & Professional","Office Expenses","Rent \u2014 Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Meals (50% deductible)","Utilities","Other Business Expenses"],
    nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"],
  },
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

// Charts
const DonutChart = ({ slices, size=140 }) => {
  const total = slices.reduce((s,x)=>s+x.value,0);
  if(!total) return <div style={{width:size,height:size,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"#94a3b8"}}>Sem dados</span></div>;
  let cum=0;
  const stops=slices.map(s=>{const p=(s.value/total)*100;const st=`${s.color} ${cum.toFixed(1)}% ${(cum+p).toFixed(1)}%`;cum+=p;return st;}).join(",");
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:"50%",background:`conic-gradient(${stops})`}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:size*.56,height:size*.56,borderRadius:"50%",background:"#fff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:Math.round(size*.1),fontWeight:800,color:"#0f172a"}}>{slices.length}</div>
        <div style={{fontSize:Math.round(size*.065),color:"#94a3b8",fontWeight:600}}>cats</div>
      </div>
    </div>
  );
};

const TrendBadge = ({ current=0, previous=0, invert=false }) => {
  if(!previous||previous===0) return null;
  const pct = ((current-previous)/Math.abs(previous))*100;
  const up = pct>=0, good = invert ? !up : up;
  return <span style={{fontSize:9,fontWeight:700,color:good?"#10b981":"#ef4444",background:good?"#f0fdf4":"#fef2f2",padding:"1px 5px",borderRadius:8}}>{up?"\u2191":"\u2193"}{Math.abs(pct).toFixed(0)}%</span>;
};

const MiniBar = ({ income=0, expense=0, maxVal=1, label="" }) => {
  const iH = maxVal>0?Math.max((income/maxVal)*88,income>0?2:0):0;
  const eH = maxVal>0?Math.max((expense/maxVal)*88,expense>0?2:0):0;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flex:1,minWidth:24}}>
      <div style={{display:"flex",gap:2,alignItems:"flex-end",height:92}}>
        <div title={`Receita: $${income.toFixed(0)}`} style={{width:10,height:iH,background:"#10b981",borderRadius:"3px 3px 0 0",transition:"height .4s ease"}}/>
        <div title={`Despesa: $${expense.toFixed(0)}`} style={{width:10,height:eH,background:BRAND.touchColor,borderRadius:"3px 3px 0 0",transition:"height .4s ease"}}/>
      </div>
      <div style={{fontSize:8,color:"#94a3b8",textAlign:"center"}}>{label}</div>
    </div>
  );
};

// ── Dashboard Tab ─────────────────────────────────────────────────────────
const DashboardTab = ({ txns, ccTxns=[], entityType, user, dashInsights=[], onRemoveInsight }) => {
  const allTxns = [...txns, ...ccTxns];
  const cfg = ENTITY_CONFIGS[entityType];
  const fmt = v => `$${Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2})}`;
  const fmtK = v => v>=1000?`$${(v/1000).toFixed(1)}k`:`$${v.toFixed(0)}`;
  const monthMap = {};
  allTxns.forEach(t=>{
    if(!t.aiCategory||t.status==="rejected") return;
    const parts=t.date.split("/"); if(parts.length<2) return;
    const mIdx=parseInt(parts[0])-1; if(isNaN(mIdx)||mIdx<0||mIdx>11) return;
    const yr=parts[2]?String(parts[2]).slice(-4):String(new Date().getFullYear());
    const key=`${yr}-${String(mIdx+1).padStart(2,"0")}`;
    if(!monthMap[key]) monthMap[key]={income:0,expense:0,nonDeduc:0,label:MONTH_NAMES[mIdx]};
    const type=getCatType(t.aiCategory,entityType);
    if(type==="income") monthMap[key].income+=t.amount>0?t.amount:0;
    else if(type==="expense") monthMap[key].expense+=Math.abs(t.amount);
    else if(type==="nondeduc") monthMap[key].nonDeduc+=Math.abs(t.amount);
  });
  const sortedMonths=Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b));
  const recent=sortedMonths.slice(-8);
  const maxBar=Math.max(...recent.map(([,d])=>Math.max(d.income,d.expense)),0.01);
  const totInc=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const totExp=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const totND=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="nondeduc").reduce((s,t)=>s+Math.abs(t.amount),0);
  const netInc=totInc-totExp;
  const curM=sortedMonths[sortedMonths.length-1]?.[1]||{income:0,expense:0,nonDeduc:0};
  const prvM=sortedMonths[sortedMonths.length-2]?.[1]||{income:0,expense:0,nonDeduc:0};
  const catAcc={};
  allTxns.filter(t=>t.aiCategory&&t.status!=="rejected"&&getCatType(t.aiCategory,entityType)==="expense")
    .forEach(t=>{catAcc[t.aiCategory]=(catAcc[t.aiCategory]||0)+Math.abs(t.amount);});
  const topCats=Object.entries(catAcc).sort(([,a],[,b])=>b-a).slice(0,6);
  const maxCat=topCats[0]?.[1]||1;
  const CAT_COLORS=["#1055b8","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#f97316"];
  const donutSlices=topCats.map(([cat,val],i)=>({label:cat,value:val,color:CAT_COLORS[i%CAT_COLORS.length]}));
  const bankInc=txns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const bankExp=txns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const ccInc=ccTxns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const ccExp=ccTxns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);

  if(allTxns.length===0) return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"64px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>\uD83D\uDCCA</div>
      <div style={{fontWeight:700,fontSize:17,color:"#0f172a",marginBottom:8}}>Dashboard vazio</div>
      <div style={{fontSize:13,color:"#94a3b8"}}>Importe extratos para visualizar o dashboard.</div>
    </div>
  );

  return(
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:26,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>\uD83D\uDCCA Dashboard</h1>
        <div style={{fontSize:12,color:"#64748b"}}>{user.company} \u00B7 {cfg.label} \u00B7 {cfg.form} \u00B7 Banco ({txns.length}) + Cart\u00E3o ({ccTxns.length}){dashInsights.length>0&&` \u00B7 \uD83E\uDD16 ${dashInsights.length} an\u00E1lise${dashInsights.length!==1?"s":""} da IA`}</div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
        {[
          {l:"Receita Total",v:fmt(totInc),c:"#10b981",i:"\uD83D\uDCC8",cur:curM.income,prev:prvM.income},
          {l:"Dedu\u00E7\u00F5es",v:fmt(totExp),c:BRAND.touchColor,i:"\uD83D\uDCC9",cur:curM.expense,prev:prvM.expense,inv:true},
          {l:"N\u00E3o Dedut\u00EDveis",v:fmt(totND),c:"#7e22ce",i:"\u26D4"},
          {l:"Lucro L\u00EDquido",v:fmt(netInc),c:netInc>=0?"#15803d":"#dc2626",i:"\uD83D\uDCB0"},
          {l:"Total Transa\u00E7\u00F5es",v:allTxns.length,c:"#0f172a",i:"\uD83D\uDD22"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px",borderTop:`3px solid ${s.c}`}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.i}</div>
            <div style={{fontFamily:"'Manrope',system-ui",fontSize:20,fontWeight:800,color:s.c,letterSpacing:"-0.5px",marginBottom:2}}>{s.v}</div>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{s.l}</div>
            {s.cur!==undefined&&<div style={{marginTop:5,display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:9,color:"#94a3b8"}}>vs m\u00EAs ant.</span>
              <TrendBadge current={s.cur} previous={s.prev} invert={s.inv}/>
            </div>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:2}}>Receitas vs Despesas \u2014 \u00FAltimos {recent.length} meses</div>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Banco + Cart\u00E3o combinados</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:120,paddingBottom:4}}>
            {recent.map(([key,d],i)=><MiniBar key={i} income={d.income} expense={d.expense} maxVal={maxBar} label={d.label}/>)}
          </div>
          <div style={{display:"flex",gap:14,marginTop:10}}>
            <span style={{fontSize:10,color:"#10b981",fontWeight:700,display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#10b981",display:"inline-block"}}/>Receita</span>
            <span style={{fontSize:10,color:BRAND.touchColor,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:BRAND.touchColor,display:"inline-block"}}/>Despesa</span>
          </div>
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:14}}>Top Categorias de Despesa</div>
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <DonutChart slices={donutSlices} size={110}/>
            <div style={{flex:1,overflow:"hidden"}}>
              {topCats.slice(0,5).map(([cat,val],i)=>(
                <div key={cat} style={{marginBottom:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:9,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{cat}</span>
                    <span style={{fontSize:9,fontWeight:700,color:CAT_COLORS[i%CAT_COLORS.length],flexShrink:0,marginLeft:4}}>{fmtK(val)}</span>
                  </div>
                  <div style={{height:3,background:"#f1f5f9",borderRadius:2}}>
                    <div style={{height:3,width:`${(val/maxCat)*100}%`,background:CAT_COLORS[i%CAT_COLORS.length],borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo Mensal */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:14}}>\uD83D\uDCC5 Comparativo: M\u00EAs Atual vs M\u00EAs Anterior</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {l:"Receita",cur:curM.income,prev:prvM.income,c:"#10b981",ic:"\uD83D\uDCC8"},
            {l:"Despesas",cur:curM.expense,prev:prvM.expense,c:BRAND.touchColor,ic:"\uD83D\uDCC9",inv:true},
            {l:"N\u00E3o Dedut\u00EDveis",cur:curM.nonDeduc,prev:prvM.nonDeduc,c:"#7e22ce",ic:"\u26D4"},
            {l:"Lucro",cur:curM.income-curM.expense,prev:prvM.income-prvM.expense,c:((curM.income-curM.expense)>=0?"#15803d":"#dc2626"),ic:"\uD83D\uDCB0"},
          ].map((s,i)=>(
            <div key={i} style={{background:"#f8fafc",borderRadius:12,padding:"14px"}}>
              <div style={{fontSize:14,marginBottom:4}}>{s.ic}</div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:6}}>{s.l}</div>
              <div style={{fontFamily:"'Manrope',system-ui",fontSize:19,fontWeight:800,color:s.c,letterSpacing:"-0.5px"}}>{fmtK(Math.abs(s.cur||0))}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                <span style={{fontSize:9,color:"#94a3b8"}}>ant: {fmtK(Math.abs(s.prev||0))}</span>
                <TrendBadge current={s.cur||0} previous={s.prev||0} invert={s.inv}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banco vs Cartão */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:14}}>\uD83C\uDFE6 Banco vs \uD83D\uDCB3 Cart\u00E3o de Cr\u00E9dito</div>
          {[
            {l:"\uD83C\uDFE6 Banco \u2014 Receita",v:bankInc,c:"#10b981"},
            {l:"\uD83C\uDFE6 Banco \u2014 Despesas",v:bankExp,c:BRAND.touchColor},
            {l:"\uD83D\uDCB3 Cart\u00E3o \u2014 Receita",v:ccInc,c:"#10b981"},
            {l:"\uD83D\uDCB3 Cart\u00E3o \u2014 Despesas",v:ccExp,c:"#ec4899"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<3?"1px solid #f8fafc":"none"}}>
              <span style={{fontSize:12,color:"#64748b"}}>{s.l}</span>
              <span style={{fontSize:13,fontWeight:700,color:s.c}}>{fmt(s.v)}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:14}}>\uD83D\uDCBC Ranking Despesas por Categoria</div>
          {topCats.slice(0,6).map(([cat,val],i)=>(
            <div key={cat} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<5?"1px solid #f8fafc":"none"}}>
              <span style={{width:20,height:20,borderRadius:"50%",background:CAT_COLORS[i%CAT_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:800,flexShrink:0}}>{i+1}</span>
              <span style={{fontSize:11,color:"#334155",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat}</span>
              <span style={{fontSize:12,fontWeight:700,color:CAT_COLORS[i%CAT_COLORS.length],flexShrink:0}}>{fmt(val)}</span>
            </div>
          ))}
          {topCats.length===0&&<div style={{color:"#94a3b8",fontSize:12,textAlign:"center",padding:"16px 0"}}>Sem despesas classificadas</div>}
        </div>
      </div>

      {/* ── Análises Personalizadas pela IA ────────────────────────────── */}
      {dashInsights.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>\uD83E\uDD16 An\u00E1lises Personalizadas pela IA</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Criadas via IA Chat \u2014 clique \u2715 para remover</div>
            </div>
            <button
              onClick={()=>dashInsights.slice().reverse().forEach(ins=>onRemoveInsight&&onRemoveInsight(ins.id))}
              style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:10,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
            >
              \uD83D\uDDD1 Limpar tudo
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {dashInsights.map(ins=>(
              <div key={ins.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px",borderLeft:`4px solid ${ins.color||BRAND.touchColor}`,position:"relative",boxShadow:"0 2px 8px #0000000a"}}>
                <button
                  onClick={()=>onRemoveInsight&&onRemoveInsight(ins.id)}
                  style={{position:"absolute",top:10,right:10,background:"#f1f5f9",border:"none",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",padding:0}}
                >\u2715</button>
                <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8,paddingRight:24}}>
                  <span style={{fontSize:20,flexShrink:0}}>{ins.icon||"\uD83D\uDCCA"}</span>
                  <div style={{fontWeight:700,fontSize:12,color:"#0f172a",lineHeight:1.4}}>{ins.title}</div>
                </div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{ins.content}</div>
                <div style={{fontSize:9,color:"#94a3b8",marginTop:10,paddingTop:8,borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Gerado pela IA em {ins.createdAt?new Date(ins.createdAt).toLocaleDateString("pt-BR"):""}</span>
                  <span style={{background:`${ins.color||BRAND.touchColor}18`,color:ins.color||BRAND.touchColor,fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:8}}>IA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA para IA quando não há insights */}
      {dashInsights.length===0&&(
        <div style={{background:"linear-gradient(135deg,#f0f9ff,#fdf4ff)",border:"1px dashed #c4b5fd",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:28}}>\uD83E\uDD16</span>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:"#7e22ce",marginBottom:2}}>Personalize este Dashboard com a IA</div>
            <div style={{fontSize:12,color:"#64748b"}}>Acesse <strong>IA Chat</strong> e peça: <em>"Adiciona uma an\u00E1lise de sazonalidade no dashboard"</em> ou <em>"Cria um card com os alertas de gastos"</em>.</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Monthly Summary
function buildMonthlySummary(txns, entityType) {
  const data = {};
  txns.forEach(t => {
    if (!t.aiCategory || t.status === "rejected") return;
    const parts = t.date.split("/");
    if (parts.length < 2) return;
    const mIdx = parseInt(parts[0]) - 1;
    if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return;
    if (!data[t.aiCategory]) data[t.aiCategory] = {};
    data[t.aiCategory][mIdx] = (data[t.aiCategory][mIdx] || 0) + t.amount;
  });
  return data;
}
function getActiveMths(data) {
  const set = new Set();
  Object.values(data).forEach(mths => Object.keys(mths).forEach(m => set.add(parseInt(m))));
  return [...set].sort((a,b)=>a-b);
}
function exportSummaryExcel(txns, entityType, company, businessDesc) {
  const data = buildMonthlySummary(txns, entityType);
  const activeMths = getActiveMths(data);
  const cats = CATEGORIES[entityType] || CATEGORIES.smllc;
  const cfg = ENTITY_CONFIGS[entityType];
  const wb = XLSX.utils.book_new();
  const hdr = ["","Category","Accounting", ...activeMths.map(m=>MONTH_NAMES[m]),"Total"];
  const rows = [hdr];
  const addCatRows = (catList, groupLabel) => {
    catList.forEach(cat => {
      const row = ["", groupLabel, cat]; let total = 0;
      activeMths.forEach(m => { const v = data[cat]?.[m] || 0; total += v; row.push(v ? +v.toFixed(2) : null); });
      row.push(total ? +total.toFixed(2) : null); rows.push(row);
    });
  };
  rows.push(["","",""]); addCatRows(cats.income, "Income");
  const totalIncomeRow = ["","","Total Income"]; let grandInc = 0;
  activeMths.forEach(m => { let s=0; cats.income.forEach(c=>{s+=data[c]?.[m]||0;}); grandInc+=s; totalIncomeRow.push(s?+s.toFixed(2):null); });
  totalIncomeRow.push(+grandInc.toFixed(2)); rows.push(totalIncomeRow);
  rows.push(["","",""]); addCatRows(cats.expenses, "Expenses");
  const totalExpRow = ["","","Total Expenses"]; let grandExp = 0;
  activeMths.forEach(m => { let s=0; cats.expenses.forEach(c=>{s+=Math.abs(data[c]?.[m]||0);}); grandExp+=s; totalExpRow.push(s?+s.toFixed(2):null); });
  totalExpRow.push(+grandExp.toFixed(2)); rows.push(totalExpRow);
  rows.push(["","",""]); addCatRows(cats.nonDeduc, "Non-Deductible");
  const totalNDRow = ["","","Total Non-Deductible"]; let grandND = 0;
  activeMths.forEach(m => { let s=0; cats.nonDeduc.forEach(c=>{s+=Math.abs(data[c]?.[m]||0);}); grandND+=s; totalNDRow.push(s?+s.toFixed(2):null); });
  totalNDRow.push(+grandND.toFixed(2)); rows.push(totalNDRow);
  rows.push(["","",""]);
  const plRow = ["","","Profit or Loss"];
  activeMths.forEach(m => { let inc=0,exp=0; cats.income.forEach(c=>{inc+=data[c]?.[m]||0;}); cats.expenses.forEach(c=>{exp+=Math.abs(data[c]?.[m]||0);}); plRow.push(+(inc-exp).toFixed(2)); });
  plRow.push(+(grandInc-grandExp).toFixed(2)); rows.push(plRow);
  rows.push(["","",""]);
  rows.push(["","",company||""]);
  rows.push(["","",businessDesc||""]);
  rows.push(["","",`${cfg.label} (${cfg.form})`]);
  rows.push(["","",`Generated by OneTouch Tax ${APP_VERSION}`]);
  const ws = XLSX.utils.aoa_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, "English");
  XLSX.writeFile(wb, `onetouchtax_summary_${new Date().toISOString().slice(0,10)}.xlsx`);
}

const MonthlySummaryTab = ({ txns, entityType, user }) => {
  const data = buildMonthlySummary(txns, entityType);
  const activeMths = getActiveMths(data);
  const cats = CATEGORIES[entityType] || CATEGORIES.smllc;
  const cfg = ENTITY_CONFIGS[entityType];
  if (txns.length === 0) return (
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"48px 24px",textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:8}}>\uD83D\uDCCA</div>
      <div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:6}}>Nenhuma transa\u00E7\u00E3o ainda</div>
      <div style={{fontSize:13,color:"#94a3b8"}}>Importe extratos para gerar o resumo mensal.</div>
    </div>
  );
  const fmt = v => v !== 0 ? `$${Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2})}` : "\u2014";
  const fmtPL = v => v === 0 ? "\u2014" : (v > 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2});
  const catTotal = (cat) => activeMths.reduce((s,m) => s + (data[cat]?.[m]||0), 0);
  const mthInc = m => cats.income.reduce((s,c) => s + (data[c]?.[m]||0), 0);
  const mthExp = m => cats.expenses.reduce((s,c) => s + Math.abs(data[c]?.[m]||0), 0);
  const mthND = m => cats.nonDeduc.reduce((s,c) => s + Math.abs(data[c]?.[m]||0), 0);
  const grandInc = activeMths.reduce((s,m) => s + mthInc(m), 0);
  const grandExp = activeMths.reduce((s,m) => s + mthExp(m), 0);
  const grandND = activeMths.reduce((s,m) => s + mthND(m), 0);
  const thS = {padding:"8px 12px",fontSize:11,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,textAlign:"right",whiteSpace:"nowrap",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"};
  const tdS = {padding:"7px 12px",fontSize:12,textAlign:"right",color:"#334155",borderBottom:"1px solid #f8fafc"};
  const tdZ = {...tdS,color:"#cbd5e1"};
  const secHdr = (l,c) => <tr><td colSpan={activeMths.length+2} style={{padding:"10px 12px 4px",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:c,background:"#f8fafc",borderTop:"2px solid #e2e8f0"}}>{l}</td></tr>;
  const totRow = (l,fn,tot,c,bg) => (
    <tr style={{background:bg}}>
      <td style={{padding:"9px 12px",fontSize:12,fontWeight:800,color:c,paddingLeft:16}}>{l}</td>
      {activeMths.map(m => { const v=fn(m); return <td key={m} style={{...tdS,fontWeight:700,color:c,background:bg}}>{v?fmt(v):"\u2014"}</td>; })}
      <td style={{...tdS,fontWeight:800,color:c,background:bg}}>{fmt(tot)}</td>
    </tr>
  );
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Resumo Mensal</h1>
          <div style={{fontSize:12,color:"#64748b"}}>{user.company} \u00B7 {cfg.label} \u00B7 {cfg.form}</div>
        </div>
        <button onClick={()=>exportSummaryExcel(txns,entityType,user.company,user.businessDescription)} style={{background:"#10b981",color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDCCA Exportar Excel</button>
      </div>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
          <thead><tr><th style={{...thS,textAlign:"left",minWidth:200}}>Categoria</th>{activeMths.map(m=><th key={m} style={thS}>{MONTH_NAMES[m]}</th>)}<th style={{...thS,color:BRAND.arcOuter}}>TOTAL</th></tr></thead>
          <tbody>
            {secHdr("\uD83D\uDCC8 Receitas","#15803d")}
            {cats.income.map(cat => {
              const tot = catTotal(cat);
              if(!tot && !activeMths.some(m=>data[cat]?.[m])) return null;
              return <tr key={cat}><td style={{padding:"7px 12px",fontSize:12,color:"#334155",paddingLeft:24,borderBottom:"1px solid #f8fafc"}}>{cat}</td>{activeMths.map(m => { const v=data[cat]?.[m]||0; return <td key={m} style={v?tdS:tdZ}>{v?fmt(v):"\u2014"}</td>; })}<td style={{...tdS,fontWeight:700,color:"#15803d"}}>{tot?fmt(tot):"\u2014"}</td></tr>;
            })}
            {totRow("Total Receitas",mthInc,grandInc,"#15803d","#f0fdf4")}
            {secHdr("\uD83D\uDCBC Dedu\u00E7\u00F5es",BRAND.touchColor)}
            {cats.expenses.map(cat => {
              const vals=activeMths.map(m=>Math.abs(data[cat]?.[m]||0)); const tot=vals.reduce((s,v)=>s+v,0); if(!tot) return null;
              return <tr key={cat}><td style={{padding:"7px 12px",fontSize:12,color:"#334155",paddingLeft:24,borderBottom:"1px solid #f8fafc"}}>{cat}</td>{activeMths.map((m,i)=><td key={m} style={vals[i]?tdS:tdZ}>{vals[i]?fmt(vals[i]):"\u2014"}</td>)}<td style={{...tdS,fontWeight:700,color:BRAND.touchColor}}>{tot?fmt(tot):"\u2014"}</td></tr>;
            })}
            {totRow("Total Dedu\u00E7\u00F5es",mthExp,grandExp,BRAND.touchColor,"#f0f9ff")}
            {secHdr("\u26D4 N\u00E3o Dedut\u00EDveis","#7e22ce")}
            {cats.nonDeduc.map(cat => {
              const vals=activeMths.map(m=>Math.abs(data[cat]?.[m]||0)); const tot=vals.reduce((s,v)=>s+v,0); if(!tot) return null;
              return <tr key={cat}><td style={{padding:"7px 12px",fontSize:12,color:"#334155",paddingLeft:24,borderBottom:"1px solid #f8fafc"}}>{cat}</td>{activeMths.map((m,i)=><td key={m} style={vals[i]?tdS:tdZ}>{vals[i]?fmt(vals[i]):"\u2014"}</td>)}<td style={{...tdS,fontWeight:700,color:"#7e22ce"}}>{tot?fmt(tot):"\u2014"}</td></tr>;
            })}
            {grandND>0&&totRow("Total N\u00E3o Dedut\u00EDveis",mthND,grandND,"#7e22ce","#fdf4ff")}
            <tr style={{background:(grandInc-grandExp)>=0?"#f0fdf4":"#fef2f2"}}>
              <td style={{padding:"11px 12px",fontSize:13,fontWeight:800,color:(grandInc-grandExp)>=0?"#15803d":"#dc2626",borderTop:"2px solid #e2e8f0"}}>\uD83D\uDCB0 Lucro / Preju\u00EDzo</td>
              {activeMths.map(m => { const pl=mthInc(m)-mthExp(m); return <td key={m} style={{padding:"11px 12px",fontSize:12,fontWeight:700,textAlign:"right",color:pl>=0?"#15803d":"#dc2626",borderTop:"2px solid #e2e8f0",background:(grandInc-grandExp)>=0?"#f0fdf4":"#fef2f2"}}>{fmtPL(pl)}</td>; })}
              <td style={{padding:"11px 12px",fontSize:13,fontWeight:800,textAlign:"right",color:(grandInc-grandExp)>=0?"#15803d":"#dc2626",borderTop:"2px solid #e2e8f0",background:(grandInc-grandExp)>=0?"#f0fdf4":"#fef2f2"}}>{fmtPL(grandInc-grandExp)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{marginTop:12,fontSize:11,color:"#94a3b8"}}>\uD83D\uDCA1 Apenas transa\u00E7\u00F5es confirmadas ou pendentes s\u00E3o inclu\u00EDdas. \u26D4 N\u00E3o dedut\u00EDveis n\u00E3o entram no c\u00E1lculo do lucro.</div>
    </div>
  );
};

// Parsers
function parseBankText(text) {
  const txns=[], lines=text.split(/\n|\r\n/), seen=new Set();
  const patterns=[
    /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.{3,80?}?)\s+([-\u2013]?\$?[\d,]+\.\d{2})(?:\s|$)/,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-\u2013]?\$?[\d,]+\.\d{2})$/,
    /^(\d{2}\/\d{2})\s+(.{4,70}?)\s{2,}([-\u2013]?\$?[\d,]+\.\d{2})/,
    /^(\d{2}\/\d{2}\/\d{4})\s+([A-Z#].*?)\s+([-\u2013]?\$?[\d,]+\.\d{2})\s*([-\u2013]?\$?[\d,]+\.\d{2})?/,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-\u2013]?\$?[\d,]+\.\d{2})\s+([-\u2013]?\$?[\d,]+\.\d{2})/,
  ];
  for (let i=0;i<lines.length;i++) {
    const raw=lines[i].trim().replace(/\s{2,}/g," "); if(raw.length<8) continue;
    let matched=false;
    for (const pat of patterns) {
      const m=pat.exec(raw); if(!m) continue;
      const dateStr=m[1], desc=(m[2]||"").trim().replace(/\s+/g," ");
      const rawAmt=(m[3]||"").replace(/[$,\s]/g,"").replace("\u2013","-");
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
      const ld=/(\d{1,2}\/\d{1,2}\/\d{2,4})/.exec(raw), la=/([-\u2013]?\$?[\d,]{1,10}\.\d{2})(?:\s|$)/.exec(raw);
      if(ld&&la){const amt=parseFloat(la[1].replace(/[$,\s]/g,"").replace("\u2013","-"));
        if(!isNaN(amt)&&Math.abs(amt)>0.01){const after=raw.slice(ld.index+ld[0].length).trim();
          const desc=(after.slice(0,after.lastIndexOf(la[1])).trim()||after.slice(0,60)).replace(/\s+/g," ").trim();
          if(desc.length>2){const key=`${ld[1]}|${desc}|${amt}`;if(!seen.has(key)){seen.add(key);txns.push({id:`p${i}-${Math.random().toString(36).slice(2)}`,date:ld[1],description:desc,amount:amt,aiCategory:null,status:"unclassified"})}}}}
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
      }catch(e){console.error("PDF:",e);resolve([]);}
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
  smllc:"SCHEDULE C: Business payments->Gross Receipts. Insurance->Insurance (Business). Internet/cable/electric/phone->Utilities. Payroll->Wages (W-2 Employees). Gas stations->Car & Truck - Gasoline. Vehicle repairs->Car & Truck - Repairs. Owner draws->Owner's Draw (NOT deductible). Loan interest->Interest - Other. State/county taxes->Taxes & Licenses. Contractors->Contract Labor (1099-NEC). Attorney/accountant->Legal & Professional Services. Personal grocery/clothing->Personal (Non-Deductible). Bank transfers->Transfer. Business meals->Meals (50% deductible).",
  scorp:"FORM 1120-S: Owner salary->Compensation of Officers (REQUIRED). Distributions->Shareholder Distributions (NOT deductible). Employees->Salaries & Wages.",
  ccorp:"FORM 1120: Executive salaries->Compensation of Officers. Dividends->Dividends Paid (NOT deductible). Donations->Charitable Contributions.",
  mmllc:"FORM 1065: Fixed partner payments->Guaranteed Payments. Distributions->Partner Distributions (K-1).",
  partnership:"FORM 1065: Same as MMLLC.",
  sole_prop:"SCHEDULE C: Same as SMLLC. Owner draws->Owner's Draw (NOT deductible).",
};

async function classifyBatch(batch,entityType,company,businessDesc){
  const cfg=ENTITY_CONFIGS[entityType],cats=CATEGORIES[entityType]||CATEGORIES.smllc;
  const allCats=[...cats.income,...cats.expenses,...cats.nonDeduc];
  const bizCtx=businessDesc?`Business: "${company}" - Industry: "${businessDesc}". Use this to improve classification.`:`Business: "${company}".`;
  const prompt=`You are a US tax expert for ${cfg.label} (${cfg.form}).\n${bizCtx}\n${ENTITY_RULES[entityType]||""}\nCategories: ${allCats.map((c,i)=>`${i+1}. ${c}`).join(", ")}\nRespond ONLY valid JSON array, no markdown:\n[{"id":<id>,"category":"<exact label>","confidence":<0.0-1.0>,"note":"<brief IRS reason>"}]\nTransactions: ${JSON.stringify(batch.map(t=>({id:t.id,date:t.date,description:t.description,amount:t.amount})))}`;
  try{
    const res=await fetch("/api/classify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
    const data=await res.json();
    if(data.error){console.error("classify:",data.error);return[];}
    return JSON.parse((data.content?.[0]?.text||"[]").replace(/```json|```/g,"").trim());
  }catch(e){console.error("classifyBatch:",e);return[];}
}

function exportPDF(txns,entityType,userName,company){
  const cfg=ENTITY_CONFIGS[entityType]||ENTITY_CONFIGS.smllc;
  const income=txns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const expense=txns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const nonDeduc=txns.filter(t=>getCatType(t.aiCategory,entityType)==="nondeduc").reduce((s,t)=>s+Math.abs(t.amount),0);
  const date=new Date().toLocaleDateString("en-US");
  const rows=txns.map(t=>{const type=getCatType(t.aiCategory,entityType);const tl=type==="nondeduc"?"Non-Ded.":type==="income"?"Income":"Expense";return `<tr><td>${t.date}</td><td>${t.description}</td><td style="text-align:right">${t.amount>=0?"+":"-"}$${Math.abs(t.amount).toFixed(2)}</td><td>${t.aiCategory||"\u2014"}</td><td>${tl}</td><td>${t.status}</td></tr>`;}).join("");
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OneTouch Tax</title><style>body{font-family:Arial;margin:32px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#0a2a5e;color:#fff;padding:8px;font-size:11px;text-align:left}td{padding:6px 8px;font-size:11px;border-bottom:1px solid #e2e8f0}.summary{display:flex;gap:20px;margin:20px 0}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;flex:1}.box-label{font-size:11px;color:#64748b;margin-bottom:3px}.box-val{font-size:20px;font-weight:700}</style></head><body><h1 style="font-size:20px">OneTouch Tax \u2014 Report</h1><p style="color:#64748b;font-size:12px">${company} \u00B7 ${cfg.label} (${cfg.form}) \u00B7 ${userName} \u00B7 ${date}</p><div class="summary"><div class="box"><div class="box-label">Gross Receipts</div><div class="box-val" style="color:#10b981">$${income.toFixed(2)}</div></div><div class="box"><div class="box-label">Deductible Expenses</div><div class="box-val" style="color:#1055b8">$${expense.toFixed(2)}</div></div><div class="box"><div class="box-label">Net Income</div><div class="box-val" style="color:#0a2a5e">$${(income-expense).toFixed(2)}</div></div><div class="box"><div class="box-label">Non-Deductible</div><div class="box-val" style="color:#7e22ce">$${nonDeduc.toFixed(2)}</div></div></div><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>IRS Category</th><th>Type</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><div style="margin-top:20px;font-size:10px;color:#94a3b8">OneTouch Tax ${APP_VERSION} \u00B7 Consult a CPA before filing.</div><script>window.onload=()=>window.print()<\/script></body></html>`;
  const w=window.open("","_blank");if(w){w.document.write(html);w.document.close();}
}
function exportQBO(txns,entityType,company){
  const lines=["!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO","!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO","!ENDTRNS"];
  txns.forEach((t,i)=>{const acct=t.aiCategory||"Uncategorized",memo=t.description.replace(/\t/g," "),amt=t.amount.toFixed(2);lines.push(`TRNS\t${i+1}\tGENERAL JOURNAL\t${t.date}\t${acct}\t${company}\t${amt}\t${memo}`);lines.push(`SPL\t${i+1}\tGENERAL JOURNAL\t${t.date}\tChecking\t${company}\t${(-t.amount).toFixed(2)}\t${memo}`);lines.push("ENDTRNS");});
  const blob=new Blob([lines.join("\n")],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`onetouchtax_${new Date().toISOString().slice(0,10)}.iif`;a.click();URL.revokeObjectURL(url);
}

const ConfBar=({v=0})=>{const c=v>=.85?"#10b981":v>=.6?"#f59e0b":"#ef4444";return <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:40,height:4,background:"#e2e8f0",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${v*100}%`,background:c,borderRadius:2}}/></div><span style={{fontSize:10,color:c,fontWeight:700}}>{Math.round(v*100)}%</span></div>;};
const CatBadge=({label,entityType})=>{const s=TYPE_META[getCatType(label,entityType)];return <span style={{background:s.bg,color:s.text,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,display:"inline-block",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>;};

const OneTouchZone=({onDone,entityType,user,label:"extrato banc\u00E1rio",color=BRAND.touchColor})=>{
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
      const batch=raw.slice(i,i+15),classified=await classifyBatch(batch,entityType,user?.company,user?.businessDescription);
      const map={};classified.forEach(r=>{map[r.id]=r;});
      batch.forEach((t,bi)=>{result[i+bi]=map[t.id]?{...t,aiCategory:map[t.id].category,aiConfidence:map[t.id].confidence,aiNote:map[t.id].note,status:"pending"}:{...t,aiCategory:"Other Business Expenses",aiConfidence:.4,status:"pending"};});
      setProgress(30+Math.round(((i+15)/raw.length)*65));
    }
    setProgress(100);setPhase("done");setTimeout(()=>onDone(result),600);
  },[entityType,onDone,user]);
  const handleFile=f=>{if(f)process(f);};
  const onDrop=useCallback(e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files?.[0]);},[handleFile]);
  const icons={idle:"\uD83D\uDCC2",reading:"\uD83D\uDD0D",classifying:"\uD83D\uDCF2",done:"\u2705"};
  const titles={idle:<>Arraste o <span style={{color}}>{label}</span> aqui</>,reading:"Lendo arquivo...",classifying:`Classificando ${count} transa\u00E7\u00F5es...`,done:`${count} transa\u00E7\u00F5es classificadas!`};
  return(
    <div onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>phase==="idle"&&fileRef.current?.click()}
      style={{border:`2px dashed ${dragging?color:phase==="done"?"#10b981":"#bae6fd"}`,borderRadius:20,padding:"48px 32px",textAlign:"center",cursor:phase==="idle"?"pointer":"default",background:dragging?"#f0f9ff":phase==="done"?"#f0fdf4":"#f8fbff",transition:"all .2s"}}>
      <div style={{fontSize:44,marginBottom:12,animation:phase==="classifying"?"spin 1.5s linear infinite":phase==="idle"?"float 3s ease-in-out infinite":"none"}}>{icons[phase]}</div>
      <div style={{fontFamily:"'Manrope',system-ui",fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:6}}>{titles[phase]}</div>
      <div style={{fontSize:13,color:"#64748b"}}>{phase==="idle"?"PDF \u00B7 Excel \u00B7 CSV \u2014 classifica\u00E7\u00E3o autom\u00E1tica por IA":phase==="classifying"?`${ENTITY_CONFIGS[entityType]?.form} \u00B7 ${progress}% conclu\u00EDdo`:"Abrindo painel..."}</div>
      {phase!=="idle"&&<div style={{marginTop:16,height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden",maxWidth:280,margin:"16px auto 0"}}><div style={{height:"100%",width:`${progress}%`,borderRadius:3,background:phase==="done"?"#10b981":`linear-gradient(135deg,${color},#0a2a5e)`,transition:"width .4s ease"}}/></div>}
      {phase==="idle"&&<div style={{marginTop:16,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>{["\uD83D\uDCC4 PDF","\uD83D\uDCCA Excel (.xlsx)","\uD83D\uDCC3 CSV"].map(f=><span key={f} style={{background:"#e0f2fe",color:"#0369a1",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20}}>{f}</span>)}</div>}
      <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.xlsm,.csv" style={{display:"none"}} onChange={e=>handleFile(e.target.files?.[0])}/>
    </div>
  );
};

// ── Credit Card Tab ───────────────────────────────────────────────────────
const CreditCardTab = ({ ccTxns, setCcTxns, entityType, user }) => {
  const [editId,setEditId]=useState(null),[editCat,setEditCat]=useState("");
  const cats=CATEGORIES[entityType]||CATEGORIES.smllc;
  const pending=ccTxns.filter(t=>t.status==="pending").length;
  const approved=ccTxns.filter(t=>t.status==="approved").length;
  const totalCharges=ccTxns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const approveT=id=>setCcTxns(p=>p.map(t=>t.id===id?{...t,status:"approved"}:t));
  const rejectT=id=>setCcTxns(p=>p.map(t=>t.id===id?{...t,status:"rejected"}:t));
  const approveAll=()=>setCcTxns(p=>p.map(t=>t.status==="pending"?{...t,status:"approved"}:t));
  const saveEdit=id=>{setCcTxns(p=>p.map(t=>t.id===id?{...t,aiCategory:editCat,status:"pending"}:t));setEditId(null);};
  const fmt=v=>`$${Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2})}`;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>\uD83D\uDCB3 Cart\u00E3o de Cr\u00E9dito</h1>
          <div style={{fontSize:12,color:"#64748b"}}>Importe faturas \u2014 mesma classifica\u00E7\u00E3o IRS autom\u00E1tica</div>
        </div>
        {ccTxns.length>0&&(
          <div style={{display:"flex",gap:8}}>
            {pending>0&&<button onClick={approveAll} style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #86efac",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2713 Confirmar todas ({pending})</button>}
            <button onClick={()=>{if(confirm(`Apagar ${ccTxns.length} transa\u00E7\u00F5es do cart\u00E3o?`))setCcTxns([]);}} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDDD1 Limpar</button>
          </div>
        )}
      </div>
      {ccTxns.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            {l:"Total Cobran\u00E7as",v:fmt(totalCharges),c:"#ec4899",i:"\uD83D\uDCB3"},
            {l:"Transa\u00E7\u00F5es",v:ccTxns.length,c:"#8b5cf6",i:"\uD83D\uDD22"},
            {l:"Confirmadas",v:approved,c:"#10b981",i:"\u2705"},
            {l:"Pendentes",v:pending,c:"#f59e0b",i:"\u23F3"},
          ].map((s,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",borderTop:`3px solid ${s.c}`}}>
              <div style={{fontSize:20,marginBottom:4}}>{s.i}</div>
              <div style={{fontFamily:"'Manrope',system-ui",fontSize:20,fontWeight:800,color:s.c,letterSpacing:"-0.5px"}}>{s.v}</div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <span style={{fontSize:24}}>\uD83D\uDCB3</span>
          <div><div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>Importar Fatura do Cart\u00E3o</div><div style={{fontSize:12,color:"#64748b"}}>Chase, Amex, BoA, Capital One, Discover e outros</div></div>
        </div>
        <OneTouchZone onDone={t=>setCcTxns(p=>[...p,...t.map(x=>({...x,source:"creditcard"}))])} entityType={entityType} user={user} label="fatura do cart\u00E3o" color="#ec4899"/>
        <div style={{marginTop:14,padding:"10px 14px",background:"#fdf4ff",border:"1px solid #e9d5ff",borderRadius:10,fontSize:11,color:"#7e22ce"}}>\uD83D\uDCA1 <strong>Cart\u00E3o de cr\u00E9dito:</strong> cobran\u00E7as s\u00E3o despesas. Pagamentos da fatura s\u00E3o Transfer (n\u00E3o dedut\u00EDvel).</div>
      </div>
      {ccTxns.length>0&&(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"85px 1fr 110px 175px 75px 130px",gap:8,padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}>
            <span>Data</span><span>Descri\u00E7\u00E3o</span><span style={{textAlign:"right"}}>Valor</span><span>Classifica\u00E7\u00E3o \u270E</span><span>Conf.</span><span style={{textAlign:"center"}}>A\u00E7\u00E3o</span>
          </div>
          {ccTxns.map(t=>{
            const isEd=editId===t.id;
            return(
              <div key={t.id} style={{display:"grid",gridTemplateColumns:"85px 1fr 110px 175px 75px 130px",gap:8,alignItems:"center",padding:"11px 14px",borderBottom:"1px solid #f8fafc",background:t.status==="approved"?"#fdf4ff":t.status==="rejected"?"#fef2f2":"#fff"}}>
                <span style={{fontSize:11,color:"#94a3b8"}}>{t.date}</span>
                <span style={{fontSize:12,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</span>
                <span style={{fontSize:12,fontWeight:700,textAlign:"right",color:t.amount>=0?"#ec4899":"#10b981"}}>{t.amount>=0?"-":"+"}${Math.abs(t.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</span>
                <div>{isEd?<select style={{border:"1.5px solid #ec4899",borderRadius:8,padding:"3px 7px",fontFamily:"inherit",fontSize:11,color:"#0f172a",background:"#fff",outline:"none",maxWidth:150}} value={editCat} onChange={e=>setEditCat(e.target.value)}><optgroup label="\uD83D\uDCC8 Receitas">{cats.income.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="\uD83D\uDCBC Dedu\u00E7\u00F5es">{cats.expenses.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="\u26D4 N\u00E3o Dedut\u00EDveis">{cats.nonDeduc.map(c=><option key={c} value={c}>{c}</option>)}</optgroup></select>:<CatBadge label={t.aiCategory||"\u2014"} entityType={entityType}/>}</div>
                <ConfBar v={t.aiConfidence||0}/>
                <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap"}}>
                  {isEd?<><button onClick={()=>saveEdit(t.id)} style={{background:"#f0fdf4",color:"#15803d",border:"none",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2713</button><button onClick={()=>setEditId(null)} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2715</button></>
                  :t.status==="approved"?<><span style={{fontSize:10,fontWeight:700,color:"#7e22ce"}}>\u2713 Ok</span><button onClick={()=>{setEditId(t.id);setEditCat(t.aiCategory||"");}} style={{background:"#fdf4ff",color:"#7e22ce",border:"none",borderRadius:7,padding:"3px 7px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>\u270E</button></>
                  :t.status==="rejected"?<><span style={{fontSize:10,fontWeight:700,color:"#ef4444"}}>\u2715</span><button onClick={()=>{setEditId(t.id);setEditCat(t.aiCategory||"");}} style={{background:"#f0f9ff",color:BRAND.touchColor,border:"none",borderRadius:7,padding:"3px 7px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>\u270E</button></>
                  :<><button onClick={()=>approveT(t.id)} style={{background:"#f0fdf4",color:"#15803d",border:"none",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2713</button><button onClick={()=>rejectT(t.id)} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,padding:"4px 8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2715</button><button onClick={()=>{setEditId(t.id);setEditCat(t.aiCategory||"");}} style={{background:"#f0f9ff",color:BRAND.touchColor,border:"none",borderRadius:7,padding:"4px 8px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>\u270E</button></>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
      {ccTxns.length===0&&(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"48px 24px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>\uD83D\uDCB3</div>
          <div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:8}}>Nenhuma transa\u00E7\u00E3o de cart\u00E3o ainda</div>
          <div style={{fontSize:13,color:"#94a3b8"}}>Importe uma fatura acima para come\u00E7ar.</div>
        </div>
      )}
    </div>
  );
};

// ── AI Customize Tab ──────────────────────────────────────────────────────
// Claude pode adicionar análises ao Dashboard via <DASHBOARD_INSIGHT> JSON block
const CustomizeTab = ({ txns, ccTxns=[], entityType, user, onAddInsight }) => {
  const [msgs,setMsgs]=useState([{role:"assistant",content:`Ol\u00E1 ${user.name?.split(" ")[0]}! \uD83D\uDC4B Sou o seu Assistente Financeiro OneTouch.\n\nPosso te ajudar com:\n\u2022 \uD83D\uDCCA An\u00E1lise das suas transa\u00E7\u00F5es\n\u2022 \uD83D\uDCA1 Estrat\u00E9gias de dedu\u00E7\u00E3o fiscal\n\u2022 \uD83D\uDCC5 Comparativos mensais\n\u2022 \u2753 D\u00FAvidas sobre categorias IRS\n\u2022 \uD83D\uDD0D Identificar padr\u00F5es de gastos\n\u2022 \uD83D\uDCCA Adicionar an\u00E1lises personalizadas ao Dashboard\n\nDica: diga "adiciona uma an\u00E1lise de X no meu dashboard" e eu crio um card l\u00E1!\n\nO que voc\u00EA gostaria de saber?`}]);
  const [input,setInput]=useState(""),[loading,setLoading]=useState(false);
  const bottomRef=useRef();
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const allTxns=[...txns,...ccTxns];
  const cfg=ENTITY_CONFIGS[entityType];
  const totInc=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const totExp=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const totND=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="nondeduc").reduce((s,t)=>s+Math.abs(t.amount),0);
  const catAcc={};
  allTxns.filter(t=>t.aiCategory&&getCatType(t.aiCategory,entityType)==="expense").forEach(t=>{catAcc[t.aiCategory]=(catAcc[t.aiCategory]||0)+Math.abs(t.amount);});
  const topCats=Object.entries(catAcc).sort(([,a],[,b])=>b-a).slice(0,8).map(([c,v])=>`${c}: $${v.toFixed(2)}`).join(", ");
  const QUICK=[
    "Quais s\u00E3o minhas maiores despesas?",
    "Adiciona uma an\u00E1lise de sazonalidade no dashboard",
    "Como posso maximizar minhas dedu\u00E7\u00F5es?",
    "Cria um card de alertas de gastos no dashboard",
    "H\u00E1 gastos pessoais misturados?",
  ];
  const send=async(text)=>{
    const q=text||input.trim(); if(!q||loading) return;
    const newMsgs=[...msgs,{role:"user",content:q}];
    setMsgs(newMsgs);setInput("");setLoading(true);
    const ctx=`Voc\u00EA \u00E9 o Assistente Financeiro OneTouch Tax para ${user.name} da empresa "${user.company}" (${cfg.label} \u2014 ${cfg.form}).\n\nDADOS FINANCEIROS ATUAIS:\n- Receita Total: $${totInc.toFixed(2)}\n- Despesas Dedut\u00EDveis: $${totExp.toFixed(2)}\n- N\u00E3o Dedut\u00EDveis: $${totND.toFixed(2)}\n- Lucro Estimado: $${(totInc-totExp).toFixed(2)}\n- Transa\u00E7\u00F5es Banc\u00E1rias: ${txns.length}\n- Transa\u00E7\u00F5es Cart\u00E3o: ${ccTxns.length}\n- Top Categorias de Despesa: ${topCats||"nenhuma classificada ainda"}\n- Ramo de Atividade: ${user.businessDescription||"n\u00E3o informado"}\n\nINSTRU\u00C7\u00D5ES:\n- Responda SEMPRE em portugu\u00EAs brasileiro.\n- Seja objetivo, amig\u00E1vel e especialista em impostos IRS americanos.\n\nPARA ADICIONAR AN\u00C1LISE AO DASHBOARD:\nSe o usu\u00E1rio pedir para adicionar, salvar ou criar uma an\u00E1lise no dashboard, inclua no FINAL da resposta (depois do texto normal) este bloco exato:\n<DASHBOARD_INSIGHT>\n{"title":"T\u00EDtulo claro da an\u00E1lise","content":"Texto detalhado da an\u00E1lise (use \\\\n para quebras de linha)","icon":"\uD83D\uDCCA","color":"#1055b8"}\n</DASHBOARD_INSIGHT>\nCores dispon\u00EDveis: #10b981=verde, #ef4444=vermelho, #f59e0b=amarelo, #8b5cf6=roxo, #ec4899=rosa, #1055b8=azul.\nUse cor verde para insights positivos, vermelho para alertas, roxo para curiosidades.\n\nCONVERSA:\n${newMsgs.map(m=>`${m.role==="user"?"Usu\u00E1rio":"Assistente"}: ${m.content}`).join("\n")}\nAssistente:`;
    try{
      const res=await fetch("/api/classify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:ctx}]})});
      const data=await res.json();
      let rawReply=(data.content?.[0]?.text||"").replace(/^Assistente:\s*/,"").trim()||"Desculpe, n\u00E3o consegui processar. Tente novamente.";
      // Parse <DASHBOARD_INSIGHT> block
      const insightMatch=rawReply.match(/<DASHBOARD_INSIGHT>([\s\S]*?)<\/DASHBOARD_INSIGHT>/);
      if(insightMatch&&onAddInsight){
        try{
          const insData=JSON.parse(insightMatch[1].trim());
          onAddInsight({...insData,id:Date.now().toString(),createdAt:new Date().toISOString()});
          rawReply=rawReply.replace(/<DASHBOARD_INSIGHT>[\s\S]*?<\/DASHBOARD_INSIGHT>/,"").trim();
          rawReply=(rawReply?rawReply+"\n\n":"")+"\u2705 An\u00E1lise \u201C"+insData.title+"\u201D adicionada ao seu Dashboard! Acesse a aba \uD83D\uDCCA Dashboard para ver.";
        }catch(e){console.error("insight parse error:",e);}
      }
      setMsgs(p=>[...p,{role:"assistant",content:rawReply}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Erro de conex\u00E3o. Verifique sua internet e tente novamente."}]);}
    setLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 80px)"}}>
      <div style={{marginBottom:14,flexShrink:0}}>
        <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>\uD83E\uDD16 Assistente IA</h1>
        <div style={{fontSize:12,color:"#64748b"}}>Claude analisa seus dados e pode <strong>adicionar an\u00E1lises personalizadas ao Dashboard</strong></div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,flexShrink:0}}>
        {QUICK.map(q=>(
          <button key={q} onClick={()=>send(q)} disabled={loading} style={{background:"#f0f9ff",color:BRAND.touchColor,border:`1px solid ${BRAND.touchColor}40`,borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{q}</button>
        ))}
      </div>
      <div style={{flex:1,background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>
              {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:BRAND.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,marginTop:2}}>\uD83E\uDD16</div>}
              <div style={{maxWidth:"75%",padding:"10px 14px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?BRAND.gradient:"#f8fafc",color:m.role==="user"?"#fff":"#0f172a",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.content}</div>
              {m.role==="user"&&<div style={{width:28,height:28,borderRadius:"50%",background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginLeft:8,marginTop:2}}>\uD83D\uDC64</div>}
            </div>
          ))}
          {loading&&<div style={{display:"flex",marginBottom:12}}><div style={{width:28,height:28,borderRadius:"50%",background:BRAND.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8}}>\uD83E\uDD16</div><div style={{padding:"10px 16px",borderRadius:"18px 18px 18px 4px",background:"#f8fafc",fontSize:13}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>\u21BB</span> Analisando seus dados...</div></div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{borderTop:"1px solid #e2e8f0",padding:"12px 16px",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Pergunte ou pe\u00E7a uma an\u00E1lise pro dashboard... (Enter)" disabled={loading} style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#0f172a",padding:"10px 14px",borderRadius:12,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?"#94a3b8":BRAND.gradient,color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:loading||!input.trim()?"not-allowed":"pointer",fontFamily:"inherit",flexShrink:0}}>{loading?"...":"\u2192"}</button>
          {msgs.length>1&&<button onClick={()=>setMsgs([msgs[0]])} style={{background:"#f8fafc",color:"#94a3b8",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>\uD83D\uDDD1</button>}
        </div>
      </div>
    </div>
  );
};

const RULES_TEXT=`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n      allow read, write: if request.auth != null\n        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';\n    }\n  }\n}`;
const FirestoreSetup=({fbUser,onRetry})=>{
  const [step,setStep]=useState(1),[copied,setCopied]=useState(false),[creating,setCreating]=useState(false),[done,setDone]=useState(false),[name,setName]=useState("");
  const copy=(text)=>{navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2500);};
  const createDoc=async()=>{if(!name.trim())return;setCreating(true);try{await setDoc(doc(db,"users",fbUser.uid),{name:name.trim(),email:fbUser.email,role:"admin",company:"OneTouch Tax",active:true,createdAt:new Date().toISOString()});setDone(true);setTimeout(()=>onRetry(),1500);}catch(e){alert("Erro: "+e.message);}setCreating(false);};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f7ff,#e8f4ff)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',system-ui",padding:24}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.inp2{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:11px 14px;border-radius:10px;font-size:14px;width:100%;outline:none;font-family:inherit;transition:border-color .2s;}.inp2:focus{border-color:${BRAND.touchColor};}`}</style>
      <div style={{width:"100%",maxWidth:560,background:"#fff",borderRadius:24,border:"1px solid #e2e8f0",boxShadow:`0 24px 64px ${BRAND.touchColor}14`,overflow:"hidden"}}>
        <div style={{background:BRAND.gradient,padding:"24px 32px",display:"flex",alignItems:"center",gap:14}}><div style={{fontSize:28}}>\uD83D\uDD27</div><div><div style={{color:"#fff",fontWeight:800,fontSize:18}}>Configura\u00E7\u00E3o inicial</div><div style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:2}}>2 passos para liberar o acesso</div></div></div>
        <div style={{padding:"28px 32px"}}>
          <div style={{display:"flex",gap:8,marginBottom:24}}>{[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:2,background:step>=s?BRAND.touchColor:"#e2e8f0",transition:"background .3s"}}/>)}</div>
          {step===1&&(<div>
            <h2 style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:6}}>Passo 1 \u2014 Publicar regras do Firestore</h2>
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:16,marginBottom:14,position:"relative"}}>
              <pre style={{margin:0,fontSize:11,color:"#334155",fontFamily:"'Courier New',monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{RULES_TEXT}</pre>
              <button onClick={()=>copy(RULES_TEXT)} style={{position:"absolute",top:10,right:10,background:copied?"#10b981":BRAND.gradient,color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{copied?"\u2713 Copiado!":"\uD83D\uDCCB Copiar"}</button>
            </div>
            <a href="https://console.firebase.google.com/project/onetouchtax-a3c84/firestore/rules" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:8,background:"#f0f9ff",border:`1.5px solid ${BRAND.touchColor}`,borderRadius:12,padding:"12px 16px",textDecoration:"none",marginBottom:20}}>
              <span style={{fontSize:20}}>\uD83D\uDD17</span><div><div style={{color:BRAND.touchColor,fontWeight:700,fontSize:13}}>Abrir Firestore Rules \u2192</div><div style={{color:"#64748b",fontSize:11,marginTop:1}}>console.firebase.google.com</div></div>
            </a>
            <button onClick={()=>setStep(2)} style={{width:"100%",background:BRAND.gradient,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Regras publicadas \u2192 Pr\u00F3ximo passo</button>
          </div>)}
          {step===2&&(<div>
            <h2 style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:800,color:"#0f172a",marginBottom:6}}>Passo 2 \u2014 Criar perfil Admin</h2>
            <p style={{color:"#64748b",fontSize:13,marginBottom:16,lineHeight:1.6}}>Logado como <strong>{fbUser.email}</strong>.</p>
            <div style={{marginBottom:16}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Nome completo</label><input className="inp2" placeholder="Ex: Marcelo Queiroz" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createDoc()}/></div>
            {done?(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:36,marginBottom:8}}>\u2705</div><div style={{fontWeight:700,color:"#15803d",fontSize:15}}>Perfil criado! Entrando...</div></div>):(
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setStep(1)} style={{background:"none",border:"1px solid #e2e8f0",color:"#64748b",borderRadius:12,padding:"13px 18px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>\u2190 Voltar</button>
                <button onClick={createDoc} disabled={creating||!name.trim()} style={{flex:1,background:creating||!name.trim()?"#94a3b8":BRAND.gradient,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:creating||!name.trim()?"not-allowed":"pointer",fontFamily:"inherit"}}>{creating?"Criando...":"\u2713 Criar perfil Admin"}</button>
              </div>
            )}
          </div>)}
        </div>
      </div>
    </div>
  );
};

// ── Client App ────────────────────────────────────────────────────────────
const ClientApp=({user,onLogout})=>{
  const [tab,setTab]=useState("home");
  const [entityType,setEntityType]=useState(user.entityType||"smllc");
  const [txns,setTxns]=useState(user.transactions||[]);
  const [ccTxns,setCcTxns]=useState(user.ccTransactions||[]);
  const [dashInsights,setDashInsights]=useState(user.dashInsights||[]);
  const [saveStatus,setSaveStatus]=useState("");
  const [initDone,setInitDone]=useState(false);
  const [editTxnId,setEditTxnId]=useState(null);
  const [editTxnCat,setEditTxnCat]=useState("");

  useEffect(()=>{ const t=setTimeout(()=>setInitDone(true),500); return()=>clearTimeout(t); },[]);
  useEffect(()=>{
    if(!initDone) return;
    setSaveStatus("saving");
    const t=setTimeout(async()=>{
      try{
        await updateDoc(doc(db,"users",user.uid),{transactions:txns,ccTransactions:ccTxns,dashInsights,entityType,txnUpdatedAt:new Date().toISOString()});
        setSaveStatus("saved"); setTimeout(()=>setSaveStatus(""),2000);
      }catch(e){console.error("Save error:",e);setSaveStatus("");}
    },1500);
    return()=>clearTimeout(t);
  },[txns,ccTxns,dashInsights,entityType,initDone]);

  const cfg=ENTITY_CONFIGS[entityType];
  const cats2=CATEGORIES[entityType]||CATEGORIES.smllc;
  const allTxns=[...txns,...ccTxns];
  const income=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="income"&&t.amount>0).reduce((s,t)=>s+t.amount,0);
  const expense=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
  const nonDed=allTxns.filter(t=>getCatType(t.aiCategory,entityType)==="nondeduc").reduce((s,t)=>s+Math.abs(t.amount),0);
  const pending=txns.filter(t=>t.status==="pending").length+ccTxns.filter(t=>t.status==="pending").length;
  const approved=txns.filter(t=>t.status==="approved").length;

  const NAV=[
    {id:"home",label:"Home",icon:"\uD83C\uDFE0"},
    {id:"dashboard",label:"Dashboard",icon:"\uD83D\uDCCA"},
    {id:"import",label:"Importar",icon:"\uD83D\uDCC2"},
    {id:"creditcard",label:"Cart\u00E3o",icon:"\uD83D\uDCB3"},
    {id:"transactions",label:"Transa\u00E7\u00F5es",icon:"\uD83D\uDCCB"},
    {id:"summary",label:"Resumo",icon:"\uD83D\uDCC8"},
    {id:"export",label:"Exportar",icon:"\uD83D\uDCE4"},
    {id:"customize",label:"IA Chat",icon:"\uD83E\uDD16"},
    {id:"settings",label:"Config.",icon:"\u2699\uFE0F"},
  ];

  const approveT=id=>setTxns(p=>p.map(t=>t.id===id?{...t,status:"approved"}:t));
  const rejectT=id=>setTxns(p=>p.map(t=>t.id===id?{...t,status:"rejected"}:t));
  const approveAll=()=>setTxns(p=>p.map(t=>t.status==="pending"?{...t,status:"approved"}:t));
  const saveTxnEdit=id=>{setTxns(p=>p.map(t=>t.id===id?{...t,aiCategory:editTxnCat,status:"pending"}:t));setEditTxnId(null);};

  return(
    <div style={{minHeight:"100vh",background:"#f8faff",fontFamily:"'Manrope',system-ui",display:"flex"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.ntb{background:none;border:none;padding:8px 12px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;display:flex;align-items:center;gap:7px;transition:all .15s;color:#64748b;width:100%;}.ntb.a{background:#f0f9ff;color:${BRAND.touchColor};font-weight:700;}.ntb:hover:not(.a){background:#f1f5f9;color:#334155;}.card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:22px;}.ab{border:none;padding:5px 11px;border-radius:7px;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:3px;}.gn{background:#f0fdf4;color:#15803d;}.gn:hover{background:#dcfce7;}.rd{background:#fef2f2;color:#dc2626;}.rd:hover{background:#fee2e2;}.bl{background:#f0f9ff;color:${BRAND.touchColor};}.bl:hover{background:#e0f2fe;}@keyframes spin{to{transform:rotate(360deg);}}@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}.edit-sel{border:1.5px solid ${BRAND.touchColor};border-radius:8px;padding:3px 7px;font-family:inherit;font-size:11px;color:#0f172a;background:#fff;outline:none;max-width:150px;}`}</style>
      <div style={{width:200,background:"#fff",borderRight:"1px solid #e2e8f0",padding:"18px 10px",display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:10,overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><NavLogo/></div>
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:9,padding:"6px 10px",marginBottom:14}}>
          <div style={{fontSize:9,color:BRAND.touchColor,fontWeight:800,textTransform:"uppercase",letterSpacing:.8}}>{cfg.form}</div>
          <div style={{fontSize:11,color:BRAND.arcOuter,fontWeight:600,marginTop:1}}>{cfg.label}</div>
          {user.businessDescription&&<div style={{fontSize:9,color:"#64748b",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>\uD83C\uDFE2 {user.businessDescription}</div>}
        </div>
        <nav style={{display:"flex",flexDirection:"column",gap:1,flex:1}}>
          {NAV.map(n=><button key={n.id} className={`ntb ${tab===n.id?"a":""}`} onClick={()=>setTab(n.id)}>
            {n.icon} {n.label}
            {n.id==="import"&&<span style={{marginLeft:"auto",background:BRAND.touchColor,color:"#fff",fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:10}}>1 toque</span>}
            {n.id==="transactions"&&txns.filter(t=>t.status==="pending").length>0&&<span style={{marginLeft:"auto",background:"#f59e0b",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:10}}>{txns.filter(t=>t.status==="pending").length}</span>}
            {n.id==="creditcard"&&ccTxns.filter(t=>t.status==="pending").length>0&&<span style={{marginLeft:"auto",background:"#ec4899",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:10}}>{ccTxns.filter(t=>t.status==="pending").length}</span>}
            {n.id==="dashboard"&&dashInsights.length>0&&<span style={{marginLeft:"auto",background:"#8b5cf6",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:10}}>{dashInsights.length}</span>}
            {n.id==="customize"&&<span style={{marginLeft:"auto",background:"linear-gradient(135deg,#8b5cf6,#ec4899)",color:"#fff",fontSize:7,fontWeight:800,padding:"1px 5px",borderRadius:10}}>IA</span>}
          </button>)}
        </nav>
        <div style={{borderTop:"1px solid #f1f5f9",paddingTop:10}}>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 7px 8px"}}><AppIcon size={28}/><div><div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{user.name?.split(" ")[0]}</div><div style={{fontSize:9,color:"#94a3b8"}}>Cliente</div></div></div>
          <button className="ntb" onClick={onLogout} style={{color:"#ef4444",fontSize:11}}>\uD83D\uDEAA Sair</button>
          {saveStatus==="saving"&&<div style={{textAlign:"center",fontSize:9,color:"#94a3b8",padding:"3px 0"}}>\uD83D\uDCBE Salvando...</div>}
          {saveStatus==="saved"&&<div style={{textAlign:"center",fontSize:9,color:"#10b981",padding:"3px 0",fontWeight:700}}>\u2713 Salvo</div>}
          <VersionBadge/>
        </div>
      </div>
      <div style={{marginLeft:200,flex:1,padding:"24px 24px 48px"}}>
        {tab==="home"&&<div>
          <div style={{marginBottom:20}}><h1 style={{fontFamily:"'Manrope',system-ui",fontSize:26,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Ol\u00E1, {user.name?.split(" ")[0]} \uD83D\uDC4B</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>{user.company} \u00B7 {cfg.form}{user.businessDescription&&` \u00B7 ${user.businessDescription}`}</p></div>
          <div className="card" style={{marginBottom:16,borderTop:`3px solid ${BRAND.touchColor}`,background:"linear-gradient(135deg,#f0f9ff,#fff)"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}><span style={{fontSize:28}}>\u26A1</span><div><div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>One Touch \u2014 Importar agora</div><div style={{fontSize:12,color:"#64748b"}}>Solte seu extrato banc\u00E1rio. O app classifica tudo automaticamente.</div></div></div>
            <OneTouchZone onDone={t=>{setTxns(p=>[...p,...t]);setTab("transactions");}} entityType={entityType} user={user}/>
          </div>
          {allTxns.length===0?(
            <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"36px 24px",textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>\uD83D\uDCC2</div><div style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:8}}>Nenhuma transa\u00E7\u00E3o ainda</div><div style={{fontSize:13,color:"#64748b",marginBottom:18}}>Importe extrato banc\u00E1rio ou fatura do cart\u00E3o.</div><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={()=>setTab("import")} style={{background:BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83C\uDFE6 Importar Extrato</button><button onClick={()=>setTab("creditcard")} style={{background:"#ec4899",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDCB3 Importar Cart\u00E3o</button></div></div>
          ):(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:14}}>
                {[
                  {l:"Receita Total",v:`$${income.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:"#10b981",i:"\uD83D\uDCC8"},
                  {l:"Dedu\u00E7\u00F5es",v:`$${expense.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:BRAND.touchColor,i:"\uD83D\uDCC9"},
                  {l:"N\u00E3o Dedut\u00EDveis",v:`$${nonDed.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:"#7e22ce",i:"\u26D4"},
                  {l:"Banco / Cart\u00E3o",v:`${txns.length} / ${ccTxns.length}`,c:"#0f172a",i:"\uD83D\uDD22"},
                  {l:"Pendentes",v:pending,c:"#f59e0b",i:"\u23F3"},
                ].map((s,i)=><div key={i} className="card" style={{borderTop:`3px solid ${s.c}`,padding:"14px 16px"}}><div style={{fontSize:20,marginBottom:4}}>{s.i}</div><div style={{fontFamily:"'Manrope',system-ui",fontSize:22,fontWeight:800,color:s.c,letterSpacing:"-1px"}}>{s.v}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2,fontWeight:500}}>{s.l}</div></div>)}
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setTab("dashboard")} style={{background:BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDCCA Ver Dashboard \u2192</button>
                <button onClick={()=>setTab("customize")} style={{background:"linear-gradient(135deg,#8b5cf6,#ec4899)",color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83E\uDD16 Perguntar \u00E0 IA \u2192</button>
              </div>
            </div>
          )}
        </div>}

        {tab==="dashboard"&&<DashboardTab txns={txns} ccTxns={ccTxns} entityType={entityType} user={user} dashInsights={dashInsights} onRemoveInsight={id=>setDashInsights(p=>p.filter(x=>x.id!==id))}/>}

        {tab==="import"&&<div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-1px"}}>Importar Extrato Banc\u00E1rio</h1>
          <p style={{color:"#64748b",margin:"0 0 20px",fontSize:13}}>Um arquivo. Um clique. Classifica\u00E7\u00E3o imediata \u2014 regras <strong>{cfg.form}</strong>.</p>
          <OneTouchZone onDone={t=>{setTxns(p=>[...p,...t]);setTab("transactions");}} entityType={entityType} user={user}/>
        </div>}

        {tab==="creditcard"&&<CreditCardTab ccTxns={ccTxns} setCcTxns={setCcTxns} entityType={entityType} user={user}/>}

        {tab==="transactions"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 2px",letterSpacing:"-1px"}}>Transa\u00E7\u00F5es Banc\u00E1rias</h1>
              <div style={{fontSize:11,color:"#64748b"}}>Para cart\u00E3o de cr\u00E9dito, use a aba \uD83D\uDCB3 Cart\u00E3o</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {txns.filter(t=>t.status==="pending").length>0&&<button onClick={approveAll} style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #86efac",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2713 Confirmar todas ({txns.filter(t=>t.status==="pending").length})</button>}
              {txns.length>0&&<button onClick={()=>{if(confirm(`Apagar as ${txns.length} transa\u00E7\u00F5es banc\u00E1rias?`))setTxns([]);}} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:10,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDDD1 Limpar</button>}
              <button onClick={()=>setTab("import")} style={{background:BRAND.gradient,color:"#fff",padding:"8px 16px",borderRadius:10,border:"none",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Importar</button>
            </div>
          </div>
          {txns.length===0?(<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>\uD83D\uDCCB</div><div style={{fontWeight:700,fontSize:15,color:"#0f172a",marginBottom:6}}>Nenhuma transa\u00E7\u00E3o banc\u00E1ria</div><div style={{fontSize:13,color:"#94a3b8"}}>Importe um extrato para come\u00E7ar.</div></div>)
          :(<div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"82px 1fr 105px 172px 72px 128px",gap:7,padding:"9px 12px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:9,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}>
              <span>Data</span><span>Descri\u00E7\u00E3o</span><span style={{textAlign:"right"}}>Valor</span><span>Classifica\u00E7\u00E3o \u270E</span><span>Conf.</span><span style={{textAlign:"center"}}>A\u00E7\u00E3o</span>
            </div>
            {txns.map(t=>{
              const isEd=editTxnId===t.id;
              return(
                <div key={t.id} style={{display:"grid",gridTemplateColumns:"82px 1fr 105px 172px 72px 128px",gap:7,alignItems:"center",padding:"10px 12px",borderBottom:"1px solid #f8fafc",background:t.status==="approved"?"#f0fdf4":t.status==="rejected"?"#fef2f2":"#fff"}}>
                  <span style={{fontSize:10,color:"#94a3b8"}}>{t.date}</span>
                  <span style={{fontSize:11,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</span>
                  <span style={{fontSize:11,fontWeight:700,textAlign:"right",color:t.amount>=0?"#10b981":"#64748b"}}>{t.amount>=0?"+":"-"}${Math.abs(t.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</span>
                  <div>{isEd?<select className="edit-sel" value={editTxnCat} onChange={e=>setEditTxnCat(e.target.value)}><optgroup label="\uD83D\uDCC8 Receitas">{cats2.income.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="\uD83D\uDCBC Dedu\u00E7\u00F5es">{cats2.expenses.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="\u26D4 N\u00E3o Dedut\u00EDveis">{cats2.nonDeduc.map(c=><option key={c} value={c}>{c}</option>)}</optgroup></select>:<CatBadge label={t.aiCategory||"\u2014"} entityType={entityType}/>}</div>
                  <ConfBar v={t.aiConfidence||0}/>
                  <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap"}}>
                    {isEd?<><button className="ab gn" onClick={()=>saveTxnEdit(t.id)} style={{border:"none",fontSize:10}}>\u2713</button><button className="ab rd" onClick={()=>setEditTxnId(null)} style={{border:"none",fontSize:10}}>\u2715</button></>
                    :t.status==="approved"?<><span style={{fontSize:9,fontWeight:700,color:"#10b981"}}>\u2713 Ok</span><button className="ab bl" onClick={()=>{setEditTxnId(t.id);setEditTxnCat(t.aiCategory||"");}} style={{border:"none",fontSize:9}}>\u270E</button></>
                    :t.status==="rejected"?<><span style={{fontSize:9,fontWeight:700,color:"#ef4444"}}>\u2715</span><button className="ab bl" onClick={()=>{setEditTxnId(t.id);setEditTxnCat(t.aiCategory||"");}} style={{border:"none",fontSize:9}}>\u270E</button></>
                    :<><button className="ab gn" onClick={()=>approveT(t.id)} style={{fontSize:10}}>\u2713</button><button className="ab rd" onClick={()=>rejectT(t.id)} style={{fontSize:10}}>\u2715</button><button className="ab bl" onClick={()=>{setEditTxnId(t.id);setEditTxnCat(t.aiCategory||"");}} style={{border:"none",fontSize:10}}>\u270E</button></>
                    }
                  </div>
                </div>
              );
            })}
          </div>)}
          <div style={{marginTop:8,fontSize:10,color:"#94a3b8",display:"flex",gap:14}}><span>\u2713 Confirmadas: <strong>{approved}</strong></span><span>\u23F3 Pendentes: <strong>{txns.filter(t=>t.status==="pending").length}</strong></span></div>
        </div>}

        {tab==="summary"&&<MonthlySummaryTab txns={txns} entityType={entityType} user={user}/>}

        {tab==="export"&&<div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-1px"}}>Exportar</h1>
          <p style={{color:"#64748b",margin:"0 0 24px",fontSize:13}}>Exporte as transa\u00E7\u00F5es classificadas.</p>
          {allTxns.length===0?<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>\uD83D\uDCE4</div><div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Nenhuma transa\u00E7\u00E3o para exportar</div></div>
          :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18}}>
            <div className="card" style={{borderTop:"3px solid #ef4444"}}><div style={{fontSize:38,marginBottom:12}}>\uD83D\uDCC4</div><h3 style={{fontFamily:"'Manrope',system-ui",fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:8}}>Relat\u00F3rio PDF</h3><p style={{color:"#64748b",fontSize:12,lineHeight:1.6,marginBottom:18}}>Listagem completa para o contador.</p><button onClick={()=>exportPDF(txns,entityType,user.name,user.company)} style={{width:"100%",background:"#ef4444",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDCC4 Exportar Banco (PDF)</button>{ccTxns.length>0&&<button onClick={()=>exportPDF(ccTxns,entityType,user.name,user.company+" CC")} style={{width:"100%",background:"#ec4899",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>\uD83D\uDCB3 Exportar Cart\u00E3o (PDF)</button>}</div>
            <div className="card" style={{borderTop:"3px solid #10b981"}}><div style={{fontSize:38,marginBottom:12}}>\uD83C\uDFE6</div><h3 style={{fontFamily:"'Manrope',system-ui",fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:8}}>QuickBooks (.IIF)</h3><p style={{color:"#64748b",fontSize:12,lineHeight:1.6,marginBottom:18}}>Importa\u00E7\u00E3o direta no QuickBooks.</p><button onClick={()=>exportQBO(txns,entityType,user.company)} style={{width:"100%",background:"#10b981",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83C\uDFE6 Exportar QuickBooks (.IIF)</button></div>
            <div className="card" style={{borderTop:"3px solid #8b5cf6"}}><div style={{fontSize:38,marginBottom:12}}>\uD83D\uDCCA</div><h3 style={{fontFamily:"'Manrope',system-ui",fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:8}}>Resumo Mensal (.xlsx)</h3><p style={{color:"#64748b",fontSize:12,lineHeight:1.6,marginBottom:18}}>Planilha m\u00EAs a m\u00EAs.</p><button onClick={()=>exportSummaryExcel(txns,entityType,user.company,user.businessDescription)} style={{width:"100%",background:"#8b5cf6",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\uD83D\uDCCA Exportar Excel</button></div>
          </div>}
          <div style={{marginTop:14,padding:"11px 15px",background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,fontSize:12,color:"#92400e"}}>\uD83D\uDCA1 Confirme as transa\u00E7\u00F5es antes de exportar. \u26D4 N\u00E3o dedut\u00EDveis n\u00E3o reduzem a renda tribut\u00E1vel.</div>
        </div>}

        {tab==="customize"&&<CustomizeTab txns={txns} ccTxns={ccTxns} entityType={entityType} user={user} onAddInsight={ins=>setDashInsights(p=>[...p,ins])}/>}

        {tab==="settings"&&<div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 20px",letterSpacing:"-1px"}}>Configura\u00E7\u00F5es</h1>
          <div className="card" style={{marginBottom:14}}><h3 style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>\uD83C\uDFE2 Tipo de Empresa</h3><div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>{Object.entries(ENTITY_CONFIGS).map(([key,c])=><div key={key} onClick={()=>setEntityType(key)} style={{padding:"12px 14px",borderRadius:12,cursor:"pointer",transition:"all .15s",border:`1.5px solid ${entityType===key?c.color:"#e2e8f0"}`,background:entityType===key?"#f8faff":"#fff"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{c.label}</div>{entityType===key&&<span style={{fontSize:10,fontWeight:700,color:c.color}}>\u2713</span>}</div><div style={{fontSize:10,color:c.color,fontWeight:600,marginTop:2}}>{c.form}</div></div>)}</div></div>
          <div className="card"><h3 style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:10}}>\uD83D\uDC64 Perfil</h3>{[["Nome",user.name],["E-mail",user.email],["Empresa",user.company],["Ramo de Atividade",user.businessDescription||"\u2014"],["Banco",user.bank||"\u2014"],["Conta",user.account||"\u2014"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:12}}><span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:600,color:"#0f172a"}}>{v}</span></div>)}</div>
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.fc{background:none;border:1px solid #e2e8f0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;color:#64748b;}.fc.a{background:${BRAND.arcOuter};border-color:${BRAND.arcOuter};color:#fff;}.ab{border:none;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;}.gn{background:#f0fdf4;color:#15803d;}.rd{background:#fef2f2;color:#dc2626;}.bl{background:#f0f9ff;color:${BRAND.touchColor};}select.cs{border:1.5px solid ${BRAND.touchColor};border-radius:8px;padding:4px 9px;font-family:inherit;font-size:11px;color:#0f172a;background:#fff;outline:none;}.si{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:8px 13px;border-radius:9px;font-size:13px;outline:none;font-family:inherit;width:240px;}.si:focus{border-color:${BRAND.touchColor};}`}</style>
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}><NavLogo/><span style={{color:"#94a3b8",fontSize:13}}>/ Contador</span><select value={entityType} onChange={e=>setEntityType(e.target.value)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#334155",padding:"5px 10px",borderRadius:8,fontFamily:"inherit",fontSize:12,outline:"none",cursor:"pointer"}}>{Object.entries(ENTITY_CONFIGS).map(([k,c])=><option key={k} value={k}>{c.label} \u00B7 {c.form}</option>)}</select></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:9,fontWeight:700,color:"#cbd5e1",background:"#f1f5f9",padding:"2px 8px",borderRadius:20,letterSpacing:"1px"}}>{APP_VERSION}</span><span style={{fontSize:13,color:"#64748b"}}>{user.name}</span><button onClick={onLogout} style={{background:"none",border:"1px solid #e2e8f0",color:"#64748b",padding:"5px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Sair</button></div>
      </div>
      <div style={{padding:"24px 24px 48px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div><h1 style={{fontFamily:"'Manrope',system-ui",fontSize:22,fontWeight:800,color:"#0f172a",margin:"0 0 3px",letterSpacing:"-0.8px"}}>Valida\u00E7\u00E3o de Transa\u00E7\u00F5es</h1><div style={{fontSize:12,color:"#64748b"}}>{cfg.label} \u00B7 {cfg.form}</div></div>
          {counts.pending>0&&<button className="ab gn" onClick={()=>setTxns(p=>p.map(t=>t.status==="pending"?{...t,status:"approved"}:t))} style={{padding:"9px 18px",fontSize:13,border:"none"}}>\u2713 Aprovar todas ({counts.pending})</button>}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:18}}>{[["all","Total","#334155"],["pending","Pendentes","#f59e0b"],["approved","Aprovadas","#10b981"],["rejected","Revis\u00E3o","#ef4444"]].map(([k,l,c])=><div key={k} onClick={()=>setFilter(k)} style={{background:"#fff",border:`1.5px solid ${filter===k?c:"#e2e8f0"}`,borderRadius:12,padding:"10px 18px",cursor:"pointer"}}><div style={{fontFamily:"'Manrope',system-ui",fontSize:22,fontWeight:800,color:c,letterSpacing:"-1px"}}>{counts[k]}</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{l}</div></div>)}</div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><input className="si" placeholder="\uD83D\uDD0D Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/><div style={{display:"flex",gap:6}}>{[["all","Todas"],["pending","Pendentes"],["approved","Aprovadas"],["rejected","Revis\u00E3o"]].map(([k,l])=><button key={k} className={`fc ${filter===k?"a":""}`} onClick={()=>setFilter(k)}>{l} ({counts[k]})</button>)}</div></div>
          <div style={{display:"grid",gridTemplateColumns:"85px 1fr 108px 195px 80px 110px",gap:10,padding:"10px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}><span>Data</span><span>Descri\u00E7\u00E3o</span><span style={{textAlign:"right"}}>Valor</span><span>Classifica\u00E7\u00E3o</span><span>Conf.</span><span style={{textAlign:"center"}}>A\u00E7\u00F5es</span></div>
          {filtered.length===0&&<div style={{padding:48,textAlign:"center",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:8}}>{txns.length===0?"\uD83D\uDCCB":"\uD83C\uDF89"}</div><div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{txns.length===0?"Nenhuma transa\u00E7\u00E3o":"Tudo validado!"}</div></div>}
          {filtered.map(t=>{
            const isEd=editId===t.id,type=getCatType(t.finalCategory||t.aiCategory,entityType),tm=TYPE_META[type],rowBg=t.status==="approved"?"#f0fdf4":t.status==="rejected"?"#fef2f2":"#fff";
            return(<div key={t.id} style={{display:"grid",gridTemplateColumns:"85px 1fr 108px 195px 80px 110px",gap:10,alignItems:"center",padding:"11px 16px",borderBottom:"1px solid #f8fafc",background:rowBg}}>
              <span style={{fontSize:11,color:"#94a3b8"}}>{t.date}</span>
              <div><div style={{fontSize:12,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={t.description}>{t.description}</div>{t.aiNote&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>\u2139 {t.aiNote}</div>}</div>
              <span style={{fontSize:12,fontWeight:700,textAlign:"right",color:t.amount>=0?"#10b981":"#64748b"}}>{t.amount>=0?"+":"-"}${Math.abs(t.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</span>
              <div>{isEd?<div style={{display:"flex",gap:5,alignItems:"center"}}><select className="cs" value={editCat} onChange={e=>setEditCat(e.target.value)}><optgroup label="\uD83D\uDCC8 Receitas">{cats.income.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="\uD83D\uDCBC Dedu\u00E7\u00F5es">{cats.expenses.map(c=><option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="\u26D4 N\u00E3o Dedut\u00EDveis">{cats.nonDeduc.map(c=><option key={c} value={c}>{c}</option>)}</optgroup></select><button className="ab gn" onClick={()=>saveEdit(t.id)} style={{border:"none"}}>\u2713</button><button className="ab rd" onClick={()=>setEditId(null)} style={{border:"none"}}>\u2715</button></div>:<span style={{background:tm.bg,color:tm.text,fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:18,cursor:"pointer",display:"inline-block",maxWidth:185,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} onClick={()=>{setEditId(t.id);setEditCat(t.finalCategory||t.aiCategory);}}>{t.finalCategory||t.aiCategory}</span>}</div>
              <ConfBar v={t.aiConfidence||0}/>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>{t.status!=="approved"&&<button className="ab gn" onClick={()=>approve(t.id)} style={{border:"none"}}>\u2713</button>}{t.status!=="rejected"&&<button className="ab rd" onClick={()=>reject(t.id)} style={{border:"none"}}>\u2715</button>}{!isEd&&<button className="ab bl" onClick={()=>{setEditId(t.id);setEditCat(t.finalCategory||t.aiCategory);}} style={{border:"none"}}>\u270E</button>}</div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
};

const AdminPanel=({user,onLogout})=>{
  const [users,setUsers]=useState([]),[loading,setLoading]=useState(true),[showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",email:"",pass:"",role:"client",company:"",businessDescription:"",entityType:"smllc",bank:"",account:""}),[creating,setCreating]=useState(false),[msg,setMsg]=useState({text:"",ok:true});
  const loadUsers=async()=>{try{const snap=await getDocs(collection(db,"users"));setUsers(snap.docs.map(d=>({uid:d.id,...d.data()})));}catch{}setLoading(false);};
  useEffect(()=>{loadUsers();},[]);
  const createUser=async()=>{
    if(!form.name||!form.email||!form.pass||!form.company){setMsg({text:"Preencha todos os campos obrigat\u00F3rios.",ok:false});return;}
    setCreating(true);setMsg({text:"",ok:true});
    try{
      const secondaryApp=initializeApp(FIREBASE_CONFIG,`secondary-${Date.now()}`);
      const secondaryAuth=getAuth(secondaryApp);
      const {user:newUser}=await createUserWithEmailAndPassword(secondaryAuth,form.email,form.pass);
      await setDoc(doc(db,"users",newUser.uid),{name:form.name,email:form.email,role:form.role,company:form.company,businessDescription:form.businessDescription,entityType:form.entityType,bank:form.bank,account:form.account,active:true,createdAt:new Date().toISOString()});
      await signOut(secondaryAuth);await deleteApp(secondaryApp);
      setMsg({text:`\u2705 Usu\u00E1rio "${form.name}" criado com sucesso!`,ok:true});
      setForm({name:"",email:"",pass:"",role:"client",company:"",businessDescription:"",entityType:"smllc",bank:"",account:""});setShowForm(false);loadUsers();
    }catch(e){setMsg({text:`\u274C ${e.code==="auth/email-already-in-use"?"E-mail j\u00E1 cadastrado":e.code==="auth/weak-password"?"Senha muito fraca (m\u00EDn. 6 caracteres)":e.message}`,ok:false});}
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
        <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:9,fontWeight:700,color:"#cbd5e1",background:"#f1f5f9",padding:"2px 8px",borderRadius:20}}>{APP_VERSION}</span><span style={{fontSize:13,color:"#64748b"}}>{user.name}</span><button onClick={onLogout} style={{background:"none",border:"1px solid #e2e8f0",color:"#64748b",padding:"5px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Sair</button></div>
      </div>
      <div style={{padding:"28px 28px 60px",maxWidth:1000,margin:"0 auto"}}>
        <div style={{marginBottom:24}}><h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Gerenciar Usu\u00E1rios</h1></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>{[{l:"Total",v:users.length,c:"#334155"},{l:"Clientes",v:users.filter(u=>u.role==="client").length,c:"#10b981"},{l:"Contadores",v:users.filter(u=>u.role==="accountant").length,c:BRAND.touchColor},{l:"Admins",v:users.filter(u=>u.role==="admin").length,c:"#7c3aed"}].map((s,i)=><div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 20px",borderTop:`3px solid ${s.c}`}}><div style={{fontFamily:"'Manrope',system-ui",fontSize:28,fontWeight:800,color:s.c,letterSpacing:"-1px"}}>{s.v}</div><div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.l}</div></div>)}</div>
        {msg.text&&<div style={{background:msg.ok?"#f0fdf4":"#fef2f2",border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`,borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:msg.ok?"#15803d":"#dc2626",fontWeight:600}}>{msg.text}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontFamily:"'Manrope',system-ui",fontSize:16,fontWeight:700,color:"#0f172a",margin:0}}>Usu\u00E1rios cadastrados</h2><button onClick={()=>{setShowForm(!showForm);setMsg({text:"",ok:true});}} style={{background:BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{showForm?"\u2715 Cancelar":"+ Novo Usu\u00E1rio"}</button></div>
        {showForm&&<div style={{background:"#fff",border:`1.5px solid ${BRAND.touchColor}`,borderRadius:16,padding:24,marginBottom:20}}>
          <h3 style={{fontFamily:"'Manrope',system-ui",fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:18}}>Novo Usu\u00E1rio</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Nome completo *</label><input className="inp" placeholder="Jo\u00E3o Silva" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>E-mail *</label><input className="inp" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Senha inicial *</label><input className="inp" type="password" placeholder="M\u00EDn. 6 caracteres" value={form.pass} onChange={e=>setForm(f=>({...f,pass:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Perfil *</label><select className="sel" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option value="client">\uD83D\uDC64 Cliente</option><option value="accountant">\uD83E\uDDF2 Contador</option><option value="admin">\uD83D\uDD11 Admin</option></select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Empresa *</label><input className="inp" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Ramo de Atividade</label><input className="inp" placeholder="Ex: Aluguel de carros, TI..." value={form.businessDescription} onChange={e=>setForm(f=>({...f,businessDescription:e.target.value}))}/></div>
            {form.role==="client"&&<div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>Tipo de entidade</label><select className="sel" value={form.entityType} onChange={e=>setForm(f=>({...f,entityType:e.target.value}))}>{Object.entries(ENTITY_CONFIGS).map(([k,c])=><option key={k} value={k}>{c.label} \u00B7 {c.form}</option>)}</select></div>}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}><button onClick={createUser} disabled={creating} style={{background:creating?"#94a3b8":BRAND.gradient,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:creating?"not-allowed":"pointer",fontFamily:"inherit"}}>{creating?"Criando...":"\u2713 Criar Usu\u00E1rio"}</button></div>
        </div>}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 90px 80px",gap:12,padding:"10px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}><span>Nome / E-mail</span><span>Empresa / Ramo</span><span>Perfil</span><span style={{textAlign:"center"}}>Status</span><span style={{textAlign:"center"}}>A\u00E7\u00E3o</span></div>
          {loading&&<div style={{padding:36,textAlign:"center",color:"#94a3b8",fontSize:13}}>Carregando...</div>}
          {!loading&&users.length===0&&<div style={{padding:36,textAlign:"center",color:"#94a3b8",fontSize:13}}>Nenhum usu\u00E1rio cadastrado.</div>}
          {users.map(u=><div key={u.uid} style={{display:"grid",gridTemplateColumns:"1fr 1fr 100px 90px 80px",gap:12,padding:"13px 16px",borderBottom:"1px solid #f8fafc",alignItems:"center",background:u.active===false?"#fffbeb":"#fff"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{u.name}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{u.email}</div></div>
            <div><div style={{fontSize:12,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.company||"\u2014"}</div>{u.businessDescription&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>\uD83C\uDFE2 {u.businessDescription}</div>}</div>
            <div><span style={{background:`${roleColor[u.role]||"#94a3b8"}18`,color:roleColor[u.role]||"#94a3b8",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20}}>{roleLabel[u.role]||u.role}</span></div>
            <div style={{textAlign:"center"}}><span style={{fontSize:10,fontWeight:700,color:u.active!==false?"#10b981":"#f59e0b"}}>{u.active!==false?"\u25CF Ativo":"\u25CB Inativo"}</span></div>
            <div style={{textAlign:"center"}}><button onClick={()=>toggleActive(u.uid,u.active!==false)} style={{background:u.active!==false?"#fef2f2":"#f0fdf4",color:u.active!==false?"#dc2626":"#15803d",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{u.active!==false?"Desativar":"Ativar"}</button></div>
          </div>)}
        </div>
      </div>
    </div>
  );
};

const Login=()=>{
  const [email,setEmail]=useState(""),[pass,setPass]=useState(""),[err,setErr]=useState(""),[loading,setLoading]=useState(false),[resetSent,setResetSent]=useState(false);
  const go=async()=>{setLoading(true);setErr("");try{await signInWithEmailAndPassword(auth,email,pass);}catch(e){setErr(e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"||e.code==="auth/user-not-found"?"E-mail ou senha inv\u00E1lidos.":"Erro ao entrar. Tente novamente.");setLoading(false);}};
  const forgotPassword=async()=>{if(!email){setErr("Digite seu e-mail para recuperar a senha.");return;}try{await sendPasswordResetEmail(auth,email);setResetSent(true);setErr("");}catch{setErr("N\u00E3o foi poss\u00EDvel enviar o e-mail de recupera\u00E7\u00E3o.");}};
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f0f7ff 0%,#e8f4ff 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',system-ui"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');*{box-sizing:border-box;}.li{background:#fff;border:1.5px solid #e2e8f0;color:#0f172a;padding:12px 15px;border-radius:10px;font-size:14px;width:100%;outline:none;font-family:inherit;transition:border-color .2s;}.li:focus{border-color:${BRAND.touchColor};}`}</style>
      <div style={{width:420,padding:48,background:"#fff",borderRadius:24,border:"1px solid #e2e8f0",boxShadow:`0 24px 64px ${BRAND.touchColor}14`}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><Logo scale={0.36}/></div>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>Classifica\u00E7\u00E3o Fiscal \u00B7 IRS Compliant 2025</div>
          <div style={{marginTop:8}}><span style={{fontSize:9,fontWeight:700,letterSpacing:"1px",color:"#cbd5e1",background:"#f8fafc",border:"1px solid #e2e8f0",padding:"2px 10px",borderRadius:20}}>{APP_VERSION}</span></div>
        </div>
        {resetSent?(<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:40,marginBottom:12}}>\uD83D\uDCE7</div><div style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:8}}>E-mail enviado!</div><button onClick={()=>setResetSent(false)} style={{background:"none",border:"none",color:BRAND.touchColor,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>\u2190 Voltar ao login</button></div>)
        :(<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <input className="li" placeholder="E-mail" type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
          <input className="li" placeholder="Senha" type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()}/>
          {err&&<div style={{color:"#ef4444",fontSize:12,textAlign:"center",fontWeight:600}}>{err}</div>}
          <button onClick={go} disabled={loading} style={{background:loading?"#94a3b8":BRAND.gradient,color:"#fff",padding:14,borderRadius:10,border:"none",fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginTop:2}}>{loading?"Entrando...":"\u2192 Entrar"}</button>
          <div style={{textAlign:"center"}}><button onClick={forgotPassword} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>Esqueci minha senha</button></div>
        </div>)}
      </div>
    </div>
  );
};

const Loading=()=>(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f0f7ff",fontFamily:"'Manrope',system-ui"}}><div style={{textAlign:"center"}}><AppIcon size={52}/><p style={{marginTop:14,color:"#64748b",fontSize:14,fontWeight:500}}>Carregando...</p></div></div>);

export default function App() {
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
