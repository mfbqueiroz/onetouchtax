import { useState, useRef, useEffect } from "react";

const TC="#1055b8";
const G="linear-gradient(135deg,#1055b8,#0a2a5e)";
const MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CATS={
  smllc:{income:["Gross Receipts or Sales","Other income"],expenses:["Advertising","Car & Truck — Gasoline","Car & Truck — Repairs","Contract Labor (1099-NEC)","Depreciation / Section 179","Insurance (Business)","Interest — Other","Legal & Professional Services","Office Expenses","Rent — Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Travel (Business)","Meals (50% deductible)","Utilities","Wages (W-2 Employees)","Other Business Expenses"],nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"]},
  scorp:{income:["Gross Receipts or Sales","Other Income"],expenses:["Compensation of Officers","Salaries & Wages (Other Emp.)","Repairs & Maintenance","Rents","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Shareholder Distributions","Personal (Non-Deductible)","Transfer"]},
  ccorp:{income:["Gross Receipts or Sales","Dividends Received","Interest Income","Other Income"],expenses:["Compensation of Officers","Salaries & Wages","Repairs & Maintenance","Rents","Taxes & Licenses","Interest Expense","Charitable Contributions","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Dividends Paid to Shareholders","Personal Expenses of Officers","Transfer"]},
  mmllc:{income:["Gross Receipts or Sales","Other Income"],expenses:["Salaries & Wages","Guaranteed Payments to Partners","Repairs & Maintenance","Rent","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Partner Distributions (K-1)","Personal (Non-Deductible)","Transfer"]},
  partnership:{income:["Gross Receipts or Sales","Other Income"],expenses:["Salaries & Wages","Guaranteed Payments to Partners","Repairs & Maintenance","Rent","Taxes & Licenses","Interest Expense","Depreciation","Advertising","Employee Benefits","Other Deductions"],nonDeduc:["Partner Distributions","Personal (Non-Deductible)","Transfer"]},
  sole_prop:{income:["Gross Receipts or Sales","Other Business Income"],expenses:["Advertising","Car & Truck — Gasoline","Contract Labor (1099-NEC)","Insurance","Interest Expense","Legal & Professional","Office Expenses","Rent — Business Property","Repairs & Maintenance","Supplies","Taxes & Licenses","Meals (50% deductible)","Utilities","Other Business Expenses"],nonDeduc:["Owner's Draw","Personal (Non-Deductible)","Transfer"]},
};

const f$=v=>`$${Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2})}`;

// ── Widget Renderers ────────────────────────────────────────────────────────
const WKpi=({data})=>(
  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
    {(data.items||[]).map((item,i)=>(
      <div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",flex:"1 1 110px",minWidth:0}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</div>
        <div style={{fontSize:18,fontWeight:800,color:item.color||TC,letterSpacing:"-0.4px"}}>{item.value}</div>
        {item.note&&<div style={{fontSize:10,color:"#64748b",marginTop:2}}>{item.note}</div>}
      </div>
    ))}
  </div>
);

const WTable=({data})=>(
  <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse"}}>
      <thead><tr>{(data.headers||[]).map((h,i)=><th key={i} style={{padding:"6px 10px",background:"#f8fafc",textAlign:i>0?"right":"left",fontWeight:700,color:"#64748b",fontSize:10,textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{(data.rows||[]).map((row,i)=><tr key={i} style={{borderBottom:"1px solid #f8fafc"}}>{row.map((cell,j)=><td key={j} style={{padding:"7px 10px",fontSize:12,textAlign:j>0?"right":"left",color:j===0?"#334155":"#64748b"}}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const WBar=({data})=>{
  const maxV=Math.max(...(data.items||[]).map(i=>Math.abs(i.value||0)),1);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {(data.items||[]).map((item,i)=>(
        <div key={i}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:11,color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"62%"}}>{item.label}</span>
            <span style={{fontSize:11,fontWeight:700,color:item.color||TC}}>{typeof item.value==="number"?f$(item.value):item.value}</span>
          </div>
          <div style={{height:6,background:"#f1f5f9",borderRadius:3}}><div style={{height:"100%",width:`${(Math.abs(item.value||0)/maxV)*100}%`,background:item.color||TC,borderRadius:3}}/></div>
        </div>
      ))}
    </div>
  );
};

const WText=({data})=>(
  <div style={{fontSize:13,color:"#334155",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{data.text}</div>
);

const renderWidget=w=>{
  if(!w) return null;
  const map={kpi:WKpi,table:WTable,bar:WBar,text:WText};
  const C=map[w.type]||WText;
  return <C data={w}/>;
};

// ── Quick Actions ─────────────────────────────────────────────────────────
const QUICK=[
  {icon:"💰",text:"Quais são meus top 5 gastos?"},
  {icon:"📊",text:"Compare este mês com o anterior"},
  {icon:"📈",text:"Mostre a tendência de receita mensal"},
  {icon:"🎯",text:"Qual é meu lucro líquido atual?"},
  {icon:"💡",text:"Onde posso economizar?"},
  {icon:"📋",text:"Resumo financeiro completo"},
  {icon:"⛔",text:"Quais gastos não são dedutíveis?"},
  {icon:"📅",text:"Como foi meu desempenho este ano?"},
];

// ── Main Component ─────────────────────────────────────────────────────────
export const CustomDashboardTab=({txns,entityType,user})=>{
  const [msgs,setMsgs]=useState([{
    role:"assistant",
    text:`Olá, ${user.name?.split(" ")[0]}! 👋 Sou seu assistente financeiro do OneTouch Tax.\n\nPosso analisar suas transações e criar gráficos, comparativos e insights personalizados. Clique em uma sugestão abaixo ou faça sua pergunta!`,
    widget:null,
  }]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [pinned,setPinned]=useState([]);
  const endRef=useRef(null);
  const cats=CATS[entityType]||CATS.smllc;

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const buildCtx=()=>{
    const valid=txns.filter(t=>t.status!=="rejected"&&t.aiCategory);
    const income=valid.filter(t=>cats.income.includes(t.aiCategory)&&t.amount>0).reduce((s,t)=>s+t.amount,0);
    const expense=valid.filter(t=>cats.expenses.includes(t.aiCategory)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const nonDed=valid.filter(t=>cats.nonDeduc.includes(t.aiCategory)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const catTotals={};
    valid.forEach(t=>{
      const tp=cats.income.includes(t.aiCategory)?"income":cats.expenses.includes(t.aiCategory)?"expense":"nondeduc";
      if(!catTotals[t.aiCategory])catTotals[t.aiCategory]={total:0,type:tp};
      catTotals[t.aiCategory].total+=(tp==="income"?t.amount:Math.abs(t.amount));
    });
    const monthly={};
    valid.forEach(t=>{
      const p=t.date.split("/");if(p.length<2)return;
      const mo=parseInt(p[0])-1,yr=p.length>=3?parseInt(p[2]):new Date().getFullYear();
      if(isNaN(mo))return;
      const k=`${MN[mo]}/${yr}`;
      if(!monthly[k])monthly[k]={income:0,expense:0,net:0};
      if(cats.income.includes(t.aiCategory))monthly[k].income+=t.amount;
      if(cats.expenses.includes(t.aiCategory))monthly[k].expense+=Math.abs(t.amount);
      monthly[k].net=monthly[k].income-monthly[k].expense;
    });
    return JSON.stringify({
      company:user.company,entityType,
      summary:{totalIncome:+income.toFixed(2),totalExpenses:+expense.toFixed(2),nonDeductible:+nonDed.toFixed(2),netIncome:+(income-expense).toFixed(2),txCount:txns.length},
      topCategories:Object.entries(catTotals).sort((a,b)=>b[1].total-a[1].total).slice(0,15).map(([k,v])=>({name:k,type:v.type,total:+v.total.toFixed(2)})),
      monthly:Object.entries(monthly).slice(-12).map(([k,v])=>({period:k,income:+v.income.toFixed(2),expense:+v.expense.toFixed(2),net:+v.net.toFixed(2)})),
    });
  };

  const send=async(text)=>{
    if(!text.trim()||loading)return;
    setMsgs(p=>[...p,{role:"user",text:text.trim(),widget:null}]);
    setInput("");setLoading(true);
    try{
      const ctx=buildCtx();
      const sysCtx=`Você é um assistente financeiro especializado para o OneTouch Tax. Analise os dados e responda SEMPRE em português brasileiro.\n\nDADOS FINANCEIROS (${user.company} - ${entityType}):\n${ctx}\n\nREGRAS:\n1. Responda SOMENTE com JSON válido (sem markdown, sem texto antes/depois)\n2. Formato obrigatório: {"text":"resposta aqui","widget":null_ou_widget}\n3. Inclua widget quando a resposta envolver dados numéricos, rankings ou comparações\n4. Valores monetários no formato "$X,XXX.XX"\n\nTIPOS DE WIDGET:\n- kpi: {"type":"kpi","title":"...","items":[{"label":"...","value":"$X","color":"#hex","note":"..."}]}\n- table: {"type":"table","title":"...","headers":["A","B"],"rows":[["v1","v2"],...]}\n- bar: {"type":"bar","title":"...","items":[{"label":"...","value":1234.56,"color":"#hex"}]}\n- text: {"type":"text","title":"...","text":"texto formatado"}`;
      const history=msgs.slice(-6).map(m=>({
        role:m.role,
        content:m.role==="assistant"?JSON.stringify({text:m.text,widget:m.widget||null}):(m.text||""),
      }));
      const apiMsgs=[
        {role:"user",content:sysCtx},
        {role:"assistant",content:'{"text":"Entendido! Pronto para analisar suas finanças.","widget":null}'},
        ...history,
        {role:"user",content:text.trim()},
      ];
      const res=await fetch("/api/classify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:apiMsgs})});
      const data=await res.json();
      const raw=(data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      let parsed;
      try{parsed=JSON.parse(raw);}catch{parsed={text:raw||"Não consegui processar a resposta. Tente novamente.",widget:null};}
      setMsgs(p=>[...p,{role:"assistant",text:parsed.text||"Pronto!",widget:parsed.widget||null}]);
    }catch(e){
      setMsgs(p=>[...p,{role:"assistant",text:"Ocorreu um erro. Verifique sua conexão e tente novamente.",widget:null}]);
    }
    setLoading(false);
  };

  const pin=w=>setPinned(p=>p.find(x=>x.title===w.title)?p:[...p,{...w,pinnedAt:Date.now()}]);
  const unpin=title=>setPinned(p=>p.filter(w=>w.title!==title));

  return(
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&display=swap');.qbtn:hover{background:#eff6ff!important;color:#1055b8!important;border-color:#bfdbfe!important;}`}</style>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Manrope',system-ui",fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 4px",letterSpacing:"-1px"}}>Meu Dashboard IA 🤖</h1>
        <div style={{fontSize:12,color:"#64748b"}}>Converse com o assistente · Crie análises personalizadas · Fixe widgets no seu painel</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:pinned.length?"1fr 300px":"1fr",gap:18,alignItems:"start"}}>
        {/* Chat panel */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Messages */}
          <div style={{padding:"20px 18px 14px",overflowY:"auto",maxHeight:500,minHeight:300}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{marginBottom:18}}>
                <div style={{display:"flex",gap:10}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:m.role==="user"?"#f1f5f9":G,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,boxShadow:m.role==="assistant"?"0 2px 8px #1055b820":"none"}}>
                    {m.role==="user"?"👤":"🤖"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:m.role==="user"?"#475569":"#0a2a5e",marginBottom:4}}>
                      {m.role==="user"?"Você":"Assistente OneTouch"}
                    </div>
                    {m.text&&<div style={{fontSize:13,color:"#334155",lineHeight:1.65,background:m.role==="user"?"#f8fafc":"#f0f9ff",padding:"10px 13px",borderRadius:10,whiteSpace:"pre-wrap"}}>{m.text}</div>}
                  </div>
                </div>
                {m.widget&&(
                  <div style={{marginLeft:40,marginTop:10,background:"#fff",border:`1.5px solid ${TC}20`,borderRadius:12,padding:"14px 15px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{m.widget.title}</span>
                      <button onClick={()=>pin(m.widget)} style={{background:"#f0f9ff",color:TC,border:`1px solid ${TC}30`,borderRadius:7,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .1s"}} onMouseEnter={e=>{e.target.style.background="#dbeafe";}} onMouseLeave={e=>{e.target.style.background="#f0f9ff";}}>📌 Fixar</button>
                    </div>
                    {renderWidget(m.widget)}
                  </div>
                )}
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:G,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🤖</div>
                <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:TC,animation:"pulse 1s infinite"}}/>
                  Analisando seus dados...
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Quick actions */}
          <div style={{padding:"10px 14px 6px",borderTop:"1px solid #f1f5f9"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,marginBottom:7}}>Sugestões rápidas</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {QUICK.map(q=>(
                <button key={q.text} className="qbtn" onClick={()=>send(q.text)} style={{background:"#f8fafc",color:"#475569",border:"1px solid #e2e8f0",borderRadius:18,padding:"4px 11px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,transition:"all .1s",marginBottom:4}}>
                  <span>{q.icon}</span><span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{padding:"10px 14px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8}}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send(input)}
              placeholder="Pergunte sobre suas finanças… (Enter para enviar)"
              disabled={loading}
              style={{flex:1,background:loading?"#f8fafc":"#fff",border:`1.5px solid ${loading?"#e2e8f0":"#e2e8f0"}`,color:"#0f172a",padding:"10px 13px",borderRadius:10,fontSize:13,outline:"none",fontFamily:"inherit",transition:"border-color .15s"}}
              onFocus={e=>{e.target.style.borderColor=TC;}}
              onBlur={e=>{e.target.style.borderColor="#e2e8f0";}}
            />
            <button onClick={()=>send(input)} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?"#94a3b8":G,color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:700,cursor:loading||!input.trim()?"not-allowed":"pointer",fontFamily:"inherit",flexShrink:0,transition:"all .15s"}}>
              {loading?"⏳":"→"}
            </button>
          </div>
        </div>

        {/* Pinned widgets panel */}
        {pinned.length>0&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:"'Manrope',system-ui",fontSize:14,fontWeight:800,color:"#0f172a"}}>📌 Meu Painel</div>
              <span style={{fontSize:11,color:"#94a3b8"}}>{pinned.length} widget{pinned.length>1?"s":""}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {pinned.map(w=>(
                <div key={w.title} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 15px",boxShadow:"0 1px 4px #0000000a"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{w.title}</span>
                    <button onClick={()=>unpin(w.title)} title="Remover" style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:18,padding:0,lineHeight:1,transition:"color .1s"}} onMouseEnter={e=>{e.target.style.color="#ef4444";}} onMouseLeave={e=>{e.target.style.color="#cbd5e1";}}>×</button>
                  </div>
                  {renderWidget(w)}
                </div>
              ))}
              <div style={{fontSize:11,color:"#94a3b8",textAlign:"center",padding:"4px 0"}}>Clique × para remover um widget</div>
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <div style={{marginTop:14,padding:"11px 15px",background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,fontSize:12,color:"#92400e"}}>
        💡 <strong>Como funciona:</strong> Converse com o assistente · Clique <strong>📌 Fixar</strong> nos widgets que quiser salvar no seu painel personalizado.
        {txns.length===0&&<span style={{color:"#dc2626",marginLeft:8}}>⚠️ Importe extratos para ativar as análises de IA.</span>}
      </div>
    </div>
  );
};

export default CustomDashboardTab;
