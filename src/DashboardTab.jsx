import { useState, useMemo } from "react";

const TC="#1055b8",TC2="#0a2a5e";
const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CATS={
  smllc:{income:["Gross Receipts or Sales","Other income"],expenses:["Advertising","Car & Truck — Gasoline","Car & Truck — Repairs","Contract Labor (1099-NEC)","Depreciation / Section 179","Insurance (Business)","Interest — Other","Legal & Professional Services","Office Expenses","Rent — Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Travel (Business)","Meals (50% deductible)","Utilities","Wages (W-2 Employees)","Other Business Expenses"],nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"]},
  scorp:{income:["Gross Receipts or Sales","Other Income"],expenses:["Compensation of Officers","Salaries & Wages (Other Emp.)","Repairs & Maintenance","Rents","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Shareholder Distributions","Personal (Non-Deductible)","Transfer"]},
  ccorp:{income:["Gross Receipts or Sales","Dividends Received","Interest Income","Other Income"],expenses:["Compensation of Officers","Salaries & Wages","Repairs & Maintenance","Rents","Taxes & Licenses","Interest Expense","Charitable Contributions","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Dividends Paid to Shareholders","Personal Expenses of Officers","Transfer"]},
  mmllc:{income:["Gross Receipts or Sales","Other Income"],expenses:["Salaries & Wages","Guaranteed Payments to Partners","Repairs & Maintenance","Rent","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Partner Distributions (K-1)","Personal (Non-Deductible)","Transfer"]},
  partnership:{income:["Gross Receipts or Sales","Other Income"],expenses:["Salaries & Wages","Guaranteed Payments to Partners","Repairs & Maintenance","Rent","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Partner Distributions","Personal (Non-Deductible)","Transfer"]},
  sole_prop:{income:["Gross Receipts or Sales","Other Business Income"],expenses:["Advertising","Car & Truck — Gasoline","Contract Labor (1099-NEC)","Insurance","Interest Expense","Legal & Professional","Office Expenses","Rent — Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Meals (50% deductible)","Utilities","Other Business Expenses"],nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"]},
};

const f$=(v,short=false)=>{const a=Math.abs(v);if(short&&a>=1000)return`$${(a/1000).toFixed(1)}k`;return`$${a.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;};
const pct=(c,p)=>(p===0||!isFinite(c/p))?null:((c-p)/Math.abs(p))*100;

// ── SVG Bar Pair Chart ─────────────────────────────────────────────────────
const BarPairChart=({months,incData,expData})=>{
  const W=580,H=180,pL=44,pR=8,pT=20,pB=28;
  const cW=W-pL-pR,cH=H-pT-pB;
  const allV=[...incData,...expData].filter(v=>v>0);
  const maxV=Math.max(...allV,1);
  const slotW=cW/Math.max(months.length,1);
  const bW=Math.max(Math.min(slotW*.28,20),4);
  const yLines=[0,.25,.5,.75,1];
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
      <defs>
        <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".9"/><stop offset="100%" stopColor="#10b981" stopOpacity=".55"/></linearGradient>
        <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={TC} stopOpacity=".9"/><stop offset="100%" stopColor={TC} stopOpacity=".55"/></linearGradient>
      </defs>
      {yLines.map(p=>{
        const y=pT+cH*(1-p);
        return <g key={p}><line x1={pL} x2={pL+cW} y1={y} y2={y} stroke={p===0?"#e2e8f0":"#f1f5f9"} strokeWidth={p===0?1.5:1}/>{p>0&&<text x={pL-4} y={y+4} textAnchor="end" fontSize={9} fill="#94a3b8">{f$(maxV*p,true)}</text>}</g>;
      })}
      {months.map((m,i)=>{
        const cx=pL+slotW*i+slotW/2;
        const iH=Math.max(((incData[i]||0)/maxV)*cH,1),eH=Math.max(((expData[i]||0)/maxV)*cH,1);
        return(
          <g key={m}>
            <rect x={cx-bW-1} y={pT+cH-iH} width={bW} height={iH} rx={2} fill="url(#gInc)"/>
            <rect x={cx+1} y={pT+cH-eH} width={bW} height={eH} rx={2} fill="url(#gExp)"/>
            <text x={cx} y={H-5} textAnchor="middle" fontSize={9} fill="#94a3b8">{MN[m]}</text>
          </g>
        );
      })}
      <g transform={`translate(${pL},5)`}>
        <rect x={0} y={0} width={8} height={8} rx={1.5} fill="#10b981"/><text x={11} y={8} fontSize={9} fill="#64748b">Receita</text>
        <rect x={58} y={0} width={8} height={8} rx={1.5} fill={TC}/><text x={69} y={8} fontSize={9} fill="#64748b">Deduções</text>
      </g>
    </svg>
  );
};

// ── SVG Line Area Chart ────────────────────────────────────────────────────
const LineAreaChart=({months,values,color=TC})=>{
  if(!months.length) return null;
  const W=580,H=150,pL=46,pR=8,pT=16,pB=26;
  const cW=W-pL-pR,cH=H-pT-pB,n=months.length;
  const minV=Math.min(...values),maxV=Math.max(...values,minV+1);
  const range=maxV-minV||1;
  const xs=months.map((_,i)=>pL+(n<2?cW/2:i/(n-1)*cW));
  const ys=values.map(v=>pT+cH-((v-minV)/range)*cH);
  const lp=xs.map((x,i)=>`${i===0?"M":"L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const bot=pT+cH;
  const ap=`M${xs[0].toFixed(1)},${bot} ${xs.map((x,i)=>`L${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")} L${xs[n-1].toFixed(1)},${bot} Z`;
  const gid=`lg${color.replace("#","")}D`;
  const zeroY=pT+cH-((0-minV)/range)*cH;
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".22"/><stop offset="100%" stopColor={color} stopOpacity=".02"/></linearGradient></defs>
      <line x1={pL} x2={pL+cW} y1={bot} y2={bot} stroke="#e2e8f0" strokeWidth={1.5}/>
      {minV<0&&<line x1={pL} x2={pL+cW} y1={zeroY} y2={zeroY} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" opacity={.5}/>}
      <path d={ap} fill={`url(#${gid})`}/>
      <path d={lp} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      {xs.map((x,i)=>(
        <g key={months[i]}>
          <circle cx={x} cy={ys[i]} r={3.5} fill={values[i]>=0?color:"#ef4444"} opacity={.9}/>
          <text x={x} y={H-4} textAnchor="middle" fontSize={9} fill="#94a3b8">{MN[months[i]]}</text>
        </g>
      ))}
      {[0,.25,.5,.75,1].map(p=>{
        const v=minV+range*p,y=pT+cH-(p*cH);
        return <text key={p} x={pL-4} y={y+4} textAnchor="end" fontSize={9} fill="#94a3b8">{f$(v,true)}</text>;
      })}
    </svg>
  );
};

// ── Horizontal Bars ────────────────────────────────────────────────────────
const HorizBars=({items,color=TC})=>{
  if(!items.length) return <div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"20px 0"}}>Sem dados no período</div>;
  const maxV=Math.max(...items.map(i=>i.value));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {items.map(({label,value})=>(
        <div key={label}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:11,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"62%"}}>{label}</span>
            <span style={{fontSize:11,fontWeight:700,color}}>{f$(value)}</span>
          </div>
          <div style={{height:6,background:"#f1f5f9",borderRadius:3}}>
            <div style={{height:"100%",width:`${(value/maxV)*100}%`,background:color,borderRadius:3,transition:"width .6s ease"}}/>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────
const Delta=({v,invert=false})=>{
  if(v===null||!isFinite(v)) return null;
  const pos=invert?v<=0:v>=0;
  return <span style={{fontSize:10,fontWeight:700,color:pos?"#10b981":"#ef4444"}}>{v>=0?"▲":"▼"}{Math.abs(v).toFixed(1)}%</span>;
};

const KPICard=({icon,label,value,delta,prevLabel,color,invert=false})=>(
  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"17px 18px",borderTop:`3px solid ${color}`,flex:"1 1 155px",minWidth:0}}>
    <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
    <div style={{fontFamily:"'Manrope',system-ui",fontSize:22,fontWeight:800,color,letterSpacing:"-0.8px",lineHeight:1.1}}>{value}</div>
    <div style={{fontSize:11,color:"#94a3b8",fontWeight:500,marginTop:4,marginBottom:delta!==null?5:0}}>{label}</div>
    {delta!==null&&<div style={{display:"flex",alignItems:"center",gap:5}}><Delta v={delta} invert={invert}/><span style={{fontSize:10,color:"#94a3b8"}}>vs {prevLabel}</span></div>}
  </div>
);

// ── Comparison Table ───────────────────────────────────────────────────────
const CompTable=({curData,prevData,cats,curLabel,prevLabel})=>{
  const rows=[];
  [...cats.income,...cats.expenses].forEach(cat=>{
    const c=curData[cat]||0,p=prevData[cat]||0;
    if(!c&&!p) return;
    const d=pct(c,p),type=cats.income.includes(cat)?"income":"expense";
    rows.push({cat,c,p,d,type});
  });
  rows.sort((a,b)=>Math.abs(b.c)-Math.abs(a.c));
  if(!rows.length) return <div style={{fontSize:12,color:"#94a3b8",padding:24,textAlign:"center"}}>Sem dados para comparação.</div>;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 115px 115px 85px",gap:8,padding:"9px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:10,fontWeight:800,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8}}>
        <span>Categoria</span><span style={{textAlign:"right"}}>{curLabel}</span><span style={{textAlign:"right"}}>{prevLabel}</span><span style={{textAlign:"right"}}>Δ %</span>
      </div>
      {rows.slice(0,14).map(r=>{
        const pos=r.type==="income"?(r.d>=0):(r.d<=0);
        const dc=r.d===null?"#94a3b8":pos?"#10b981":"#ef4444";
        return(
          <div key={r.cat} style={{display:"grid",gridTemplateColumns:"1fr 115px 115px 85px",gap:8,padding:"9px 14px",borderBottom:"1px solid #f8fafc",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:r.type==="income"?"#10b981":TC,flexShrink:0}}/>
              <span style={{fontSize:11,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.cat}</span>
            </div>
            <span style={{fontSize:12,fontWeight:600,textAlign:"right",color:r.type==="income"?"#10b981":"#334155"}}>{f$(r.c)}</span>
            <span style={{fontSize:11,textAlign:"right",color:"#94a3b8"}}>{f$(r.p)}</span>
            <span style={{fontSize:11,fontWeight:700,textAlign:"right",color:dc}}>{r.d!==null?`${r.d>=0?"▲":"▼"}${Math.abs(r.d).toFixed(1)}%`:"—"}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── M/M Quick Stats ─────────────────────────────────────────────────────────
const MoMCard=({label,cur,prev,color,invert=false})=>{
  const d=pct(cur,prev);
  const pos=d===null?null:(invert?d<=0:d>=0);
  return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",flex:1,minWidth:0}}>
      <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"'Manrope',system-ui",fontSize:18,fontWeight:800,color,letterSpacing:"-0.5px"}}>{f$(cur)}</div>
      {d!==null&&<div style={{marginTop:4,fontSize:10,fontWeight:700,color:pos?"#10b981":"#ef4444"}}>{d>=0?"▲":"▼"}{Math.abs(d).toFixed(1)}% <span style={{fontWeight:400,color:"#94a3b8"}}>vs mês ant.</span></div>}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────
export const DashboardTab=({txns,entityType,user})=>{
  const [period,setPeriod]=useState("ytd");
  const cats=CATS[entityType]||CATS.smllc;
  const now=new Date(),cy=now.getFullYear(),cm=now.getMonth();

  const {cur,prev,curLabel,prevLabel,mths,incArr,expArr,netArr,catExp,catInc,curCatD,prevCatD,curMonth,prevMonthD}=useMemo(()=>{
    const nowAbs=cy*12+cm;
    const parseD=t=>{
      const p=t.date.split("/");if(p.length<2)return null;
      const mo=parseInt(p[0])-1,yr=p.length>=3?parseInt(p[2]):cy;
      if(isNaN(mo)||isNaN(yr))return null;
      return{month:mo,year:yr,abs:yr*12+mo};
    };
    const valid=txns.filter(t=>t.status!=="rejected"&&t.aiCategory).map(t=>({...t,_d:parseD(t)})).filter(t=>t._d);
    let cS,cE,pS,pE,cLbl,pLbl;
    if(period==="ytd"){cS=cy*12;cE=nowAbs;pS=(cy-1)*12;pE=(cy-1)*12+cm;cLbl=`${cy}`;pLbl=`${cy-1}`;}
    else if(period==="3m"){cS=nowAbs-2;cE=nowAbs;pS=nowAbs-5;pE=nowAbs-3;cLbl="Últimos 3m";pLbl="3m ant.";}
    else if(period==="6m"){cS=nowAbs-5;cE=nowAbs;pS=nowAbs-11;pE=nowAbs-6;cLbl="Últimos 6m";pLbl="6m ant.";}
    else{const abs=valid.map(t=>t._d.abs);const mn=Math.min(...abs,nowAbs);cS=mn;cE=nowAbs;pS=mn;pE=nowAbs;cLbl="Todo período";pLbl="—";}
    const cf=valid.filter(t=>t._d.abs>=cS&&t._d.abs<=cE);
    const pf=valid.filter(t=>t._d.abs>=pS&&t._d.abs<=pE);
    const tots=arr=>({
      income:arr.filter(t=>cats.income.includes(t.aiCategory)&&t.amount>0).reduce((s,t)=>s+t.amount,0),
      expense:arr.filter(t=>cats.expenses.includes(t.aiCategory)).reduce((s,t)=>s+Math.abs(t.amount),0),
      nonDed:arr.filter(t=>cats.nonDeduc.includes(t.aiCategory)).reduce((s,t)=>s+Math.abs(t.amount),0),
      count:arr.length,
    });
    const curT=tots(cf);curT.net=curT.income-curT.expense;
    const prevT=tots(pf);prevT.net=prevT.income-prevT.expense;
    // Monthly data
    const md={};
    cf.forEach(t=>{
      const m=t._d.month;if(!md[m])md[m]={income:0,expense:0,net:0};
      if(cats.income.includes(t.aiCategory)&&t.amount>0)md[m].income+=t.amount;
      if(cats.expenses.includes(t.aiCategory))md[m].expense+=Math.abs(t.amount);
      md[m].net=md[m].income-md[m].expense;
    });
    const mths=[...new Set(cf.map(t=>t._d.month))].sort((a,b)=>a-b);
    // Category breakdown
    const expTot={},incTot={};
    cf.forEach(t=>{
      if(cats.expenses.includes(t.aiCategory))expTot[t.aiCategory]=(expTot[t.aiCategory]||0)+Math.abs(t.amount);
      if(cats.income.includes(t.aiCategory)&&t.amount>0)incTot[t.aiCategory]=(incTot[t.aiCategory]||0)+t.amount;
    });
    // Comparison data
    const mkCD=arr=>{const d={};arr.forEach(t=>{if(t.aiCategory)d[t.aiCategory]=(d[t.aiCategory]||0)+(cats.income.includes(t.aiCategory)?t.amount:Math.abs(t.amount));});return d;};
    // Current vs previous MONTH (always)
    const curMData=valid.filter(t=>t._d.abs===nowAbs);
    const prevMData=valid.filter(t=>t._d.abs===nowAbs-1);
    return{
      cur:curT,prev:prevT,curLabel:cLbl,prevLabel:pLbl,
      mths,incArr:mths.map(m=>md[m]?.income||0),expArr:mths.map(m=>md[m]?.expense||0),netArr:mths.map(m=>md[m]?.net||0),
      catExp:Object.entries(expTot).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value),
      catInc:Object.entries(incTot).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value),
      curCatD:mkCD(cf),prevCatD:mkCD(pf),
      curMonth:tots(curMData),prevMonthD:tots(prevMData),
    };
  },[txns,entityType,period]);

  if(!txns.length) return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"60px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:12}}>📊</div>
      <div style={{fontFamily:"'Manrope',system-ui",fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:8}}>Sem dados para o Dashboard</div>
      <div style={{fontSize:13,color:"#94a3b8"}}>Importe extratos para visualizar os gráficos e comparativos.</div>
    </div>
  );

  const nc=cur.net>=0?TC2:"#ef4444";
  const pBtns=[{id:"ytd",l:"Este ano"},{id:"6m",l:"6 meses"},{id:"3m",l:"3 meses"},{id:"all",l:"Tudo"}];

  return(
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&display=swap');`}</style>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Dashboard</h1>
          <div style={{fontSize:12,color:"#64748b"}}>{user.company} · {curLabel}</div>
        </div>
        <div style={{display:"flex",gap:6,background:"#f8fafc",borderRadius:10,padding:4,border:"1px solid #e2e8f0"}}>
          {pBtns.map(({id,l})=>(
            <button key={id} onClick={()=>setPeriod(id)} style={{background:period===id?"#1055b8":"transparent",color:period===id?"#fff":"#64748b",border:"none",borderRadius:7,padding:"5px 13px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <KPICard icon="📈" label="Receita Total" value={f$(cur.income)} delta={pct(cur.income,prev.income)} prevLabel={prevLabel} color="#10b981"/>
        <KPICard icon="📉" label="Deduções" value={f$(cur.expense)} delta={pct(cur.expense,prev.expense)} prevLabel={prevLabel} color={TC} invert/>
        <KPICard icon="💰" label="Lucro Líquido" value={(cur.net<0?"-":"")+f$(cur.net)} delta={pct(cur.net,prev.net)} prevLabel={prevLabel} color={nc}/>
        <KPICard icon="⛔" label="Não Dedutíveis" value={f$(cur.nonDed)} delta={pct(cur.nonDed,prev.nonDed)} prevLabel={prevLabel} color="#7e22ce" invert/>
        <KPICard icon="🔢" label="Transações" value={cur.count} delta={pct(cur.count,prev.count)} prevLabel={prevLabel} color="#f59e0b"/>
      </div>

      {/* M/M quick comparison */}
      <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:.8,marginBottom:10}}>📅 Mês Atual vs Mês Anterior</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <MoMCard label="Receita (mês atual)" cur={curMonth.income} prev={prevMonthD.income} color="#10b981"/>
          <MoMCard label="Deduções (mês atual)" cur={curMonth.expense} prev={prevMonthD.expense} color={TC} invert/>
          <MoMCard label="Lucro (mês atual)" cur={curMonth.income-curMonth.expense} prev={prevMonthD.income-prevMonthD.expense} color={curMonth.income-curMonth.expense>=0?TC2:"#ef4444"}/>
        </div>
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 18px 14px"}}>
          <div style={{fontFamily:"'Manrope',system-ui",fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:12}}>📊 Receita × Deduções por Mês</div>
          {mths.length?<BarPairChart months={mths} incData={incArr} expData={expArr}/>:<div style={{textAlign:"center",color:"#94a3b8",padding:30,fontSize:12}}>Sem dados no período selecionado</div>}
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 18px 14px"}}>
          <div style={{fontFamily:"'Manrope',system-ui",fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:12}}>📈 Lucro Líquido por Mês</div>
          {mths.length?<LineAreaChart months={mths} values={netArr} color={nc}/>:<div style={{textAlign:"center",color:"#94a3b8",padding:30,fontSize:12}}>Sem dados no período selecionado</div>}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 18px"}}>
          <div style={{fontFamily:"'Manrope',system-ui",fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:14}}>💼 Top Deduções — {curLabel}</div>
          <HorizBars items={catExp.slice(0,7)} color={TC}/>
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 18px"}}>
          <div style={{fontFamily:"'Manrope',system-ui",fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:14}}>📈 Fontes de Receita — {curLabel}</div>
          <HorizBars items={catInc.slice(0,7)} color="#10b981"/>
        </div>
      </div>

      {/* Comparison table */}
      {period!=="all"&&(
        <div>
          <div style={{fontFamily:"'Manrope',system-ui",fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:10}}>🔄 Comparativo por Categoria: {curLabel} × {prevLabel}</div>
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,overflow:"hidden"}}>
            <CompTable curData={curCatD} prevData={prevCatD} cats={cats} curLabel={curLabel} prevLabel={prevLabel}/>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
