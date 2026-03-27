import { useState, useEffect, useRef } from "react";

const LOGO = "https://mfbq94082f8cf68-tgakw.wordpress.com/wp-content/uploads/2026/03/img_0248.jpeg";

const useInView = (threshold = 0.12) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
};

const useCount = (to, ms = 1600, active) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let v = 0, id = setInterval(() => {
      v += to / (ms / 14);
      if (v >= to) { setN(to); clearInterval(id); } else setN(Math.floor(v));
    }, 14);
    return () => clearInterval(id);
  }, [active, to, ms]);
  return n;
};

const F = ({ children, d = 0, x = 0, y = 28, scale = 1 }) => {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : `translate(${x}px,${y}px) scale(${scale})`,
      transition: `opacity .65s ease ${d}s, transform .65s cubic-bezier(.22,1,.36,1) ${d}s`,
    }}>{children}</div>
  );
};

const TXNS = [
  { date:"Mar 15", desc:"SPECTRUM – Internet/Cable",     amt:"-$84.99",  cat:"Utilities",       line:"Sch-C L.25", c:"#10b981", p:true },
  { date:"Mar 14", desc:"Zelle → Marcelo Queiroz",       amt:"-$6,500",  cat:"Owner's Draw",    line:"Non-Deduc.", c:"#8b5cf6", p:false },
  { date:"Mar 13", desc:"REAL AUTO SALES Transfer",      amt:"+$5,150",  cat:"Gross Receipts",  line:"Sch-C L.1",  c:"#10b981", p:true },
  { date:"Mar 12", desc:"Walmart – Office Supplies",     amt:"-$134.66", cat:"Office Expense",  line:"Sch-C L.18", c:"#4aa3f5", p:true },
  { date:"Mar 11", desc:"WF PAYMENT – Auto Loan",        amt:"-$1,217",  cat:"Interest – Other",line:"Sch-C L.16b",c:"#4aa3f5", p:true },
  { date:"Mar 10", desc:"STRIPE PAYOUT",                 amt:"+$3,840",  cat:"Gross Receipts",  line:"Sch-C L.1",  c:"#10b981", p:true },
  { date:"Mar 09", desc:"Amazon – Business Supplies",    amt:"-$211.40", cat:"Office Expense",  line:"Sch-C L.18", c:"#f59e0b", p:false },
  { date:"Mar 08", desc:"AT&T – Phone",                  amt:"-$92.00",  cat:"Utilities",       line:"Sch-C L.25", c:"#10b981", p:true },
];

const CATS = [
  { name:"Gross Receipts", pct:100, color:"#10b981", amt:"$8,990" },
  { name:"Owner's Draw",   pct:72,  color:"#8b5cf6", amt:"$6,500" },
  { name:"Auto Loan",      pct:14,  color:"#4aa3f5", amt:"$1,217" },
  { name:"Office Expense", pct:4,   color:"#f59e0b", amt:"$346"   },
  { name:"Utilities",      pct:2,   color:"#64748b", amt:"$177"   },
];

export default function App() {
  const [statsRef, statsVis] = useInView(.3);
  const [expRef, expVis] = useInView(.1);
  const [chartRef, chartVis] = useInView(.2);
  const [planHover, setPlanHover] = useState(null);
  const [rowHover, setRowHover] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [validating, setValidating] = useState(null);
  const [validated, setValidated] = useState([]);

  const c98 = useCount(98, 1400, statsVis);
  const c6  = useCount(6,  1000, statsVis);
  const c14 = useCount(14, 1200, statsVis);

  const handleValidate = (i) => {
    setValidating(i);
    setTimeout(() => { setValidating(null); setValidated(v => [...v, i]); }, 900);
  };

  const plans = [
    { icon:"🌱", badge:null, accent:"#10b981", bg:"#0a1530", border:"1px solid #1e293b",
      name:"Starter", sub:"Pequeno Porte", price:"$39", cents:",90", vol:"200 transações/mês",
      desc:"Autônomos e microempresas", cta:"Começar grátis", ctaBg:"#0f2040", ctaC:"#94a3b8",
      features:["Classificação automática","Import PDF · Excel · CSV","1 tipo de entidade","Auto-validação","Dashboard financeiro","Suporte e-mail 48h","Histórico 1 ano"] },
    { icon:"🚀", badge:"✦ MAIS ESCOLHIDO", accent:"#4aa3f5", bg:"#071840", border:"2px solid #1055b8",
      name:"Growth", sub:"Médio Porte", price:"$59", cents:",90", vol:"750 transações/mês",
      desc:"PMEs com múltiplas contas", cta:"Assinar Growth", ctaBg:"#1055b8", ctaC:"#fff",
      features:["Classificação com nota IRS","Import multi-banco","6 tipos de entidade","Auto-validação","Relatórios mensais","Export QuickBooks · CSV","Alertas de baixa confiança","Suporte prioritário 24h","Histórico 3 anos"] },
    { icon:"🏢", badge:null, accent:"#8b5cf6", bg:"#0a1530", border:"1px solid #1e293b",
      name:"Enterprise", sub:"Grande Porte", price:"$129", cents:",90", vol:"Ilimitado ♾️",
      desc:"Grupos e escritórios contábeis", cta:"Falar com vendas", ctaBg:"#0f172a", ctaC:"#fff",
      features:["Transações ilimitadas","Classificação auditável + IRS","Até 10 entidades","Auto-validação","Relatórios avançados + P&L","Multi-contador","API REST (QuickBooks/Xero)","White-label","Suporte SLA 2h"] },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#030d1c", color:"#f8fafc", overflowX:"hidden", lineHeight:1.5 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0a1a35}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
        .tab{background:none;border:none;color:#475569;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer;transition:all .2s;font-family:inherit}
        .tab.active{background:#0a1a35;color:#4aa3f5}
        .tab:hover:not(.active){color:#94a3b8}
        .btn-primary{background:#1055b8;color:#fff;border:none;border-radius:12px;padding:16px 36px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-primary:hover{background:#1a6fd4;transform:translateY(-1px);box-shadow:0 8px 24px rgba(16,85,184,.4)}
        .btn-ghost{background:transparent;color:#64748b;border:1px solid #1e293b;border-radius:12px;padding:16px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
        .btn-ghost:hover{border-color:#334155;color:#94a3b8}
        .nav-link{color:#475569;font-size:14px;font-weight:500;text-decoration:none;transition:color .2s;cursor:pointer}
        .nav-link:hover{color:#f8fafc}
      `}</style>

      {/* NAV */}
      <nav style={{ position:"sticky",top:0,zIndex:100,background:"rgba(3,13,28,.88)",backdropFilter:"blur(24px) saturate(180%)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"10px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:20 }}>
        <img src={LOGO} alt="OneTouch Tax" style={{ height:44,width:"auto",borderRadius:8 }}/>
        <div style={{ display:"flex",gap:24,alignItems:"center" }}>
          <a className="nav-link" href="#como">Como funciona</a>
          <a className="nav-link" href="#despesas">Despesas</a>
          <a className="nav-link" href="#planos">Planos</a>
          <button className="btn-primary" style={{ padding:"9px 20px",fontSize:13,borderRadius:10 }}>Começar grátis →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"94vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px 60px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        {[["50%","20%",600,600,"rgba(16,85,184,.18)"],["15%","50%",320,320,"rgba(74,163,245,.1)"],["80%","35%",280,280,"rgba(200,146,42,.08)"]].map(([l,t,w,h,c],i)=>(
          <div key={i} style={{ position:"absolute",top:t,left:l,transform:"translateX(-50%)",width:w,height:h,background:`radial-gradient(circle,${c} 0%,transparent 70%)`,pointerEvents:"none" }}/>
        ))}
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(74,163,245,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,163,245,.04) 1px,transparent 1px)",backgroundSize:"60px 60px",pointerEvents:"none" }}/>

        <F d={0}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(74,163,245,.1)",border:"1px solid rgba(74,163,245,.22)",borderRadius:100,padding:"6px 18px",fontSize:11,color:"#4aa3f5",fontWeight:700,letterSpacing:"2.5px",textTransform:"uppercase",marginBottom:36 }}>
            🇧🇷🇺🇸 &nbsp;Lançamento 2026 · Para brasileiros nos EUA
          </div>
        </F>
        <F d={0.06} scale={0.96}>
          <img src={LOGO} alt="OneTouch Tax" style={{ width:200,height:"auto",borderRadius:24,marginBottom:40,boxShadow:"0 0 80px rgba(74,163,245,.22),0 0 200px rgba(16,85,184,.12)" }}/>
        </F>
        <F d={0.12}>
          <h1 style={{ fontSize:"clamp(38px,6.5vw,78px)",fontWeight:900,letterSpacing:"-3px",lineHeight:1,marginBottom:22,maxWidth:820 }}>
            Declare seu negócio{" "}
            <span style={{ background:"linear-gradient(135deg,#bfdbfe 0%,#4aa3f5 40%,#1055b8 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
              com confiança.
            </span>
          </h1>
        </F>
        <F d={0.17}>
          <p style={{ color:"#64748b",fontSize:18,lineHeight:1.75,maxWidth:500,marginBottom:50 }}>
            Importe o extrato bancário. O aplicativo classifica cada despesa com as regras do IRS — você valida em segundos.
          </p>
        </F>
        <F d={0.22}>
          <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:76 }}>
            <button className="btn-primary">Começar 14 dias grátis →</button>
            <button className="btn-ghost">Ver demonstração</button>
          </div>
        </F>
        <F d={0.27}>
          <div ref={statsRef} style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
            {[{val:c98,suf:"%",lbl:"Precisão"},{val:c6,suf:"",lbl:"Tipos de entidade"},{val:c14,suf:"",lbl:"Dias grátis"}].map(({val,suf,lbl},i)=>(
              <div key={i} style={{ background:"#0a1a35",border:"1px solid #1e3a5f",borderRadius:16,padding:"20px 32px",textAlign:"center",minWidth:120 }}>
                <div style={{ color:"#4aa3f5",fontWeight:900,fontSize:42,letterSpacing:"-1.5px",lineHeight:1,fontFamily:"'DM Mono',monospace" }}>{val}{suf}</div>
                <div style={{ color:"#475569",fontSize:12,fontWeight:600,marginTop:5 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </F>
      </section>

      {/* MARQUEE */}
      <div style={{ background:"#050d1a",borderTop:"1px solid #0f2040",borderBottom:"1px solid #0f2040",padding:"16px 0" }}>
        <p style={{ textAlign:"center",color:"#1e3a5f",fontWeight:700,fontSize:11,letterSpacing:"2px",textTransform:"uppercase",padding:"0 24px" }}>
          Schedule C ◆ Form 1065 ◆ Form 1120-S ◆ Form 1120 ◆ Bank of America ◆ Chase ◆ Wells Fargo ◆ PDF · Excel · CSV ◆ QuickBooks ◆ IRS 2026 ◆ LLC · S-Corp · C-Corp
        </p>
      </div>

      {/* HOW IT WORKS */}
      <section id="como" style={{ background:"#f0f4f8",padding:"100px 24px" }}>
        <div style={{ maxWidth:1000,margin:"0 auto" }}>
          <F><p style={{ textAlign:"center",color:"#1055b8",fontWeight:800,fontSize:11,letterSpacing:"3px",textTransform:"uppercase",marginBottom:16 }}>Como funciona</p></F>
          <F d={.06}><h2 style={{ textAlign:"center",color:"#0a2a5e",fontWeight:900,fontSize:"clamp(28px,4vw,50px)",letterSpacing:"-2px",lineHeight:1.05,marginBottom:16 }}>Um arquivo. Um toque.<br/>Tudo classificado.</h2></F>
          <F d={.1}><p style={{ textAlign:"center",color:"#64748b",fontSize:16,margin:"0 auto 64px",maxWidth:520 }}>Três passos. O quarto é opcional — transforma o app em serviço contábil completo.</p></F>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20 }}>
            {[
              { n:"01",icon:"📂",col:"#dbeafe",tag:null,   title:"Importe",               desc:"Arraste o extrato (PDF, Excel ou CSV). Processado em segundos." },
              { n:"02",icon:"📲",col:"#d1fae5",tag:null,   title:"Aplicativo Classifica", desc:"Regras IRS aplicadas por tipo de entidade, com referência de linha." },
              { n:"03",icon:"✅",col:"#fef3c7",tag:null,   title:"Você Valida",           desc:"Revise e confirme. Guiado e simples — sem estudar o código fiscal." },
              { n:"04*",icon:"🧮",col:"#ede9fe",tag:"Add-on",title:"CPA Assina",          desc:"Contador parceiro revisa e assina digitalmente o relatório IRS." },
            ].map((s,i)=>(
              <F key={i} d={i*.1}>
                <div style={{ background:s.tag?"#faf5ff":"#fff",border:s.tag?"1.5px solid #e9d5ff":"1px solid #e2e8f0",borderRadius:20,padding:"36px 28px",transition:"transform .3s,box-shadow .3s",cursor:"default" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 20px 50px rgba(0,0,0,.1)"}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                  <div style={{ color:s.col,fontWeight:900,fontSize:52,lineHeight:1,marginBottom:16 }}>{s.n}</div>
                  <div style={{ fontSize:36,marginBottom:16 }}>{s.icon}</div>
                  {s.tag&&<div style={{ color:"#7c3aed",fontWeight:800,fontSize:10,letterSpacing:"2px",textTransform:"uppercase",marginBottom:6 }}>{s.tag}</div>}
                  <h3 style={{ color:"#0f172a",fontWeight:800,fontSize:19,marginBottom:10 }}>{s.title}</h3>
                  <p style={{ color:"#64748b",fontSize:14,lineHeight:1.65 }}>{s.desc}</p>
                </div>
              </F>
            ))}
          </div>
        </div>
      </section>

      {/* EXPENSE MANAGEMENT */}
      <section id="despesas" style={{ background:"#030d1c",padding:"100px 24px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"30%",right:"-10%",width:500,height:500,background:"radial-gradient(circle,rgba(74,163,245,.07) 0%,transparent 70%)",pointerEvents:"none" }}/>
        <div style={{ maxWidth:1160,margin:"0 auto" }}>
          <F><p style={{ textAlign:"center",color:"#4aa3f5",fontWeight:800,fontSize:11,letterSpacing:"3px",textTransform:"uppercase",marginBottom:16 }}>Gerenciamento de Despesas</p></F>
          <F d={.06}><h2 style={{ textAlign:"center",color:"#f8fafc",fontWeight:900,fontSize:"clamp(28px,4vw,50px)",letterSpacing:"-2px",lineHeight:1.05,marginBottom:16 }}>Controle total de cada <span style={{ color:"#4aa3f5" }}>centavo.</span></h2></F>
          <F d={.1}><p style={{ textAlign:"center",color:"#475569",fontSize:16,margin:"0 auto 72px",maxWidth:520 }}>Cada despesa classificada, cada linha do IRS mapeada. Sem planilhas, sem dor de cabeça.</p></F>

          <F d={.08}>
            <div style={{ background:"#071428",border:"1px solid #1e293b",borderRadius:24,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,.5)" }}>
              <div style={{ padding:"16px 24px",borderBottom:"1px solid #1e293b",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <img src={LOGO} alt="" style={{ height:28,borderRadius:6 }}/>
                  <span style={{ color:"#f8fafc",fontWeight:700,fontSize:15 }}>Dashboard — Março 2026</span>
                  <span style={{ background:"#0a2040",border:"1px solid #1e3a5f",borderRadius:20,padding:"3px 10px",fontSize:11,color:"#4aa3f5",fontWeight:700 }}>Schedule C</span>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button className="tab active">Março</button>
                  <button className="tab">T1 2026</button>
                  <button className="tab">Anual</button>
                </div>
              </div>

              <div style={{ padding:24,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16 }}>
                {[{lbl:"Receita Bruta",val:"$8,990",delta:"+12%",c:"#10b981"},{lbl:"Despesas Dedut.",val:"$1,740",delta:"-8%",c:"#4aa3f5"},{lbl:"Não Dedutível",val:"$6,634",delta:"",c:"#8b5cf6"}].map((m,i)=>(
                  <div key={i} style={{ background:"#0a1530",border:"1px solid #1e293b",borderRadius:14,padding:"18px 20px" }}>
                    <div style={{ color:"#475569",fontSize:12,fontWeight:600,marginBottom:8 }}>{m.lbl}</div>
                    <div style={{ color:"#f8fafc",fontWeight:900,fontSize:28,letterSpacing:"-1px",fontFamily:"'DM Mono',monospace" }}>{m.val}</div>
                    {m.delta&&<div style={{ color:m.c,fontSize:12,fontWeight:700,marginTop:4 }}>{m.delta} vs fev</div>}
                  </div>
                ))}
              </div>

              <div style={{ padding:"0 24px 24px",display:"grid",gridTemplateColumns:"1fr 340px",gap:20 }}>
                <div ref={expRef}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}>
                    <span style={{ color:"#94a3b8",fontSize:13,fontWeight:700 }}>Transações · {TXNS.length} registros</span>
                    <div style={{ display:"flex",gap:6 }}>
                      {["all","deducible","income"].map(t=>(
                        <button key={t} className={`tab${activeTab===t?" active":""}`} onClick={()=>setActiveTab(t)} style={{ fontSize:11,padding:"5px 12px" }}>
                          {t==="all"?"Todas":t==="deducible"?"Dedutíveis":"Receitas"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderRadius:14,overflow:"hidden",border:"1px solid #1e293b" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"70px 1fr 90px 120px 80px 90px",background:"#0a1a35",padding:"10px 16px",gap:12 }}>
                      {["Data","Descrição","Valor","Categoria","Linha IRS","Ação"].map(h=>(
                        <div key={h} style={{ color:"#475569",fontSize:11,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {TXNS.map((t,i)=>{
                      const show=activeTab==="all"||(activeTab==="deducible"&&t.p&&!t.amt.startsWith("+"))||(activeTab==="income"&&t.amt.startsWith("+"));
                      if(!show) return null;
                      const isVal=validated.includes(i), isValg=validating===i;
                      return (
                        <div key={i} style={{ display:"grid",gridTemplateColumns:"70px 1fr 90px 120px 80px 90px",padding:"12px 16px",gap:12,alignItems:"center",borderTop:"1px solid #0f2040",background:rowHover===i?"#0a1a35":"transparent",animation:expVis?`rowIn .4s ease ${i*.06}s both`:"none",transition:"background .15s",cursor:"default" }}
                          onMouseEnter={()=>setRowHover(i)} onMouseLeave={()=>setRowHover(null)}>
                          <div style={{ color:"#475569",fontSize:11,fontFamily:"'DM Mono',monospace" }}>{t.date}</div>
                          <div style={{ color:"#e2e8f0",fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.desc}</div>
                          <div style={{ color:t.amt.startsWith("+")?t.c:"#94a3b8",fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace" }}>{t.amt}</div>
                          <span style={{ background:`${t.c}18`,border:`1px solid ${t.c}44`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,color:t.c,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.cat}</span>
                          <div style={{ color:"#f59e0b",fontSize:10,fontWeight:700,fontFamily:"'DM Mono',monospace" }}>{t.line}</div>
                          <div>
                            {isVal?(<span style={{ color:"#10b981",fontSize:11,fontWeight:700 }}>✓ Validado</span>)
                            :isValg?(<span style={{ color:"#4aa3f5",fontSize:11,animation:"pulse 1s infinite" }}>…</span>)
                            :(<button onClick={()=>handleValidate(i)} style={{ background:"#0f2040",border:"1px solid #1e3a5f",color:"#4aa3f5",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}
                                onMouseEnter={e=>{e.target.style.background="#1055b8";e.target.style.color="#fff"}}
                                onMouseLeave={e=>{e.target.style.background="#0f2040";e.target.style.color="#4aa3f5"}}>Validar</button>)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div ref={chartRef} style={{ background:"#0a1530",border:"1px solid #1e293b",borderRadius:14,padding:"20px",flex:1 }}>
                    <div style={{ color:"#94a3b8",fontSize:12,fontWeight:700,marginBottom:18 }}>Distribuição por Categoria</div>
                    {CATS.map((c,i)=>(
                      <div key={i} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                          <span style={{ color:"#94a3b8",fontSize:12,fontWeight:600 }}>{c.name}</span>
                          <span style={{ color:c.color,fontSize:12,fontWeight:800,fontFamily:"'DM Mono',monospace" }}>{c.amt}</span>
                        </div>
                        <div style={{ background:"#0f2040",borderRadius:4,height:6,overflow:"hidden" }}>
                          <div style={{ height:"100%",borderRadius:4,background:c.color,width:chartVis?`${c.pct}%`:"0%",transition:`width 1s cubic-bezier(.22,1,.36,1) ${.1+i*.12}s`,boxShadow:`0 0 8px ${c.color}66` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#0a1530",border:"1px solid #1e293b",borderRadius:14,padding:"20px" }}>
                    <div style={{ color:"#94a3b8",fontSize:12,fontWeight:700,marginBottom:14 }}>Score de Confiança</div>
                    <div style={{ position:"relative",width:100,height:100,margin:"0 auto 14px" }}>
                      <svg viewBox="0 0 100 100" style={{ transform:"rotate(-90deg)" }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#0f2040" strokeWidth="10"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10"
                          strokeDasharray="251.2" strokeDashoffset={chartVis?"25":"251.2"}
                          style={{ transition:"stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1) .3s" }} strokeLinecap="round"/>
                      </svg>
                      <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center" }}>
                        <div style={{ color:"#10b981",fontWeight:900,fontSize:22,fontFamily:"'DM Mono',monospace" }}>96%</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"center",color:"#475569",fontSize:12 }}>Média das classificações</div>
                    <div style={{ marginTop:12,padding:"10px 14px",background:"#071428",borderRadius:10,display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:"#f59e0b",animation:"pulse 2s infinite" }}/>
                      <span style={{ color:"#f59e0b",fontSize:12,fontWeight:600 }}>2 itens precisam revisão</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding:"14px 24px",borderTop:"1px solid #1e293b",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
                <div style={{ display:"flex",gap:20 }}>
                  {[["✅","5 validadas"],["⏳","3 pendentes"],["📤","Exportar para QuickBooks"]].map(([ico,txt],i)=>(
                    <span key={i} style={{ color:i===2?"#4aa3f5":"#475569",fontSize:13,fontWeight:600,cursor:i===2?"pointer":"default",display:"flex",alignItems:"center",gap:5 }}>{ico} {txt}</span>
                  ))}
                </div>
                <button style={{ background:"#1055b8",color:"#fff",border:"none",borderRadius:10,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Gerar Relatório IRS →</button>
              </div>
            </div>
          </F>

          <div style={{ marginTop:48,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16 }}>
            {[{icon:"🏦",title:"Multi-banco",desc:"Bank of America, Chase, Wells Fargo. Importe de qualquer extrato, sem ajustes."},{icon:"📊",title:"Relatórios IRS",desc:"Cada transação mapeada para a linha exata do Schedule C, Form 1065 ou 1120-S."},{icon:"🔄",title:"Reconciliação",desc:"Compare extratos de múltiplos períodos e identifique duplicatas automaticamente."},{icon:"📤",title:"Export QuickBooks",desc:"Exporte em formato compatível com QuickBooks, Xero ou CSV para seu contador."}].map((f,i)=>(
              <F key={i} d={i*.08}>
                <div style={{ background:"#071428",border:"1px solid #1e293b",borderRadius:16,padding:"24px 22px",transition:"transform .3s,border-color .3s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="#1e3a5f"}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="#1e293b"}}>
                  <div style={{ fontSize:28,marginBottom:12 }}>{f.icon}</div>
                  <h4 style={{ color:"#f8fafc",fontWeight:800,fontSize:16,marginBottom:8 }}>{f.title}</h4>
                  <p style={{ color:"#475569",fontSize:14,lineHeight:1.6 }}>{f.desc}</p>
                </div>
              </F>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" style={{ background:"#f0f4f8",padding:"100px 24px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <F><p style={{ textAlign:"center",color:"#1055b8",fontWeight:800,fontSize:11,letterSpacing:"3px",textTransform:"uppercase",marginBottom:16 }}>Planos & Preços</p></F>
          <F d={.06}><h2 style={{ textAlign:"center",color:"#0a2a5e",fontWeight:900,fontSize:"clamp(28px,4vw,50px)",letterSpacing:"-2px",lineHeight:1.05,marginBottom:16 }}>Simples. <span style={{ color:"#1055b8" }}>Sem surpresas.</span></h2></F>
          <F d={.1}><p style={{ textAlign:"center",color:"#64748b",fontSize:15,marginBottom:52 }}>Todos incluem gerenciamento de despesas e auto-validação. Contador disponível como add-on.</p></F>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:16 }}>
            {plans.map((p,i)=>(
              <F key={i} d={i*.1}>
                <div onMouseEnter={()=>setPlanHover(i)} onMouseLeave={()=>setPlanHover(null)}
                  style={{ background:p.bg,border:p.border,borderRadius:22,padding:"36px 28px",display:"flex",flexDirection:"column",transform:planHover===i?"translateY(-8px)":"none",boxShadow:planHover===i?"0 24px 60px rgba(0,0,0,.25)":"none",transition:"transform .3s,box-shadow .3s" }}>
                  {p.badge&&<div style={{ background:"#1055b8",color:"#fff",fontWeight:800,fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",display:"inline-block",padding:"4px 12px",borderRadius:20,marginBottom:14 }}>{p.badge}</div>}
                  <div style={{ fontSize:28,marginBottom:12 }}>{p.icon}</div>
                  <div style={{ color:p.accent,fontWeight:800,fontSize:10,letterSpacing:"2px",textTransform:"uppercase",marginBottom:4 }}>{p.name} · {p.sub}</div>
                  <div style={{ color:"#f8fafc",fontWeight:900,fontSize:44,letterSpacing:"-2px",lineHeight:1,marginTop:12,marginBottom:4,fontFamily:"'DM Mono',monospace" }}>
                    {p.price}<span style={{ fontSize:22,color:"#64748b",fontWeight:400 }}>{p.cents}</span>
                  </div>
                  <div style={{ color:"#475569",fontSize:12,marginBottom:6 }}>por mês</div>
                  <div style={{ color:p.accent,fontWeight:800,fontSize:16,marginBottom:4 }}>{p.vol}</div>
                  <div style={{ color:"#334155",fontSize:12,marginBottom:20 }}>{p.desc}</div>
                  <hr style={{ border:"none",borderTop:"1px solid #1e293b",marginBottom:20 }}/>
                  <ul style={{ listStyle:"none",flex:1,display:"flex",flexDirection:"column",gap:9,marginBottom:28 }}>
                    {p.features.map((f,j)=>(<li key={j} style={{ color:"#94a3b8",fontSize:13,display:"flex",gap:8,alignItems:"flex-start" }}><span style={{ color:p.accent,flexShrink:0,marginTop:1 }}>✓</span>{f}</li>))}
                  </ul>
                  <button style={{ width:"100%",background:p.ctaBg,color:p.ctaC,border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"opacity .2s" }}
                    onMouseEnter={e=>e.target.style.opacity=".85"} onMouseLeave={e=>e.target.style.opacity="1"}>{p.cta}</button>
                  <div style={{ textAlign:"center",color:"#334155",fontSize:11,marginTop:8 }}>14 dias grátis · sem cartão</div>
                </div>
              </F>
            ))}
          </div>

          <F d={.15}>
            <div style={{ background:"#030d1c",border:"2px solid #c8922a",borderRadius:22,padding:"36px 40px",display:"flex",flexWrap:"wrap",gap:36,justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ flex:1,minWidth:260 }}>
                <div style={{ fontSize:32,marginBottom:10 }}>🧮</div>
                <div style={{ color:"#c8922a",fontWeight:800,fontSize:10,letterSpacing:"2px",textTransform:"uppercase",marginBottom:8 }}>Add-on · Disponível para qualquer plano</div>
                <h3 style={{ color:"#f8fafc",fontWeight:800,fontSize:22,marginBottom:10 }}>+ Acesso CPA / Contador</h3>
                <p style={{ color:"#64748b",fontSize:14,lineHeight:1.65,marginBottom:14 }}>Você valida primeiro. O CPA parceiro revisa e assina digitalmente o relatório para o IRS filing.</p>
                <ul style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:8 }}>
                  {["CPA revisa sua auto-validação","Assinatura digital de conformidade","Relatório assinado para IRS filing","1 revisão mensal completa incluída"].map((f,i)=>(
                    <li key={i} style={{ color:"#94a3b8",fontSize:13,display:"flex",gap:8 }}><span style={{ color:"#c8922a" }}>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:10 }}>
                <div style={{ color:"#c8922a",fontWeight:900,fontSize:48,letterSpacing:"-2px",fontFamily:"'DM Mono',monospace" }}>+$49<span style={{ fontSize:20,color:"#475569",fontWeight:400 }}>,90</span></div>
                <div style={{ color:"#475569",fontSize:11 }}>por empresa / mês</div>
                <button style={{ background:"#c8922a",color:"#0f172a",border:"none",borderRadius:12,padding:"13px 28px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>Adicionar CPA →</button>
              </div>
            </div>
          </F>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background:"linear-gradient(150deg,#030d1c 0%,#071840 50%,#0a2a5e 100%)",padding:"100px 24px",textAlign:"center",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(74,163,245,.12) 0%,transparent 70%)",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(74,163,245,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,163,245,.03) 1px,transparent 1px)",backgroundSize:"60px 60px",pointerEvents:"none" }}/>
        <F>
          <img src={LOGO} alt="OneTouch Tax" style={{ width:140,height:"auto",borderRadius:20,marginBottom:32,boxShadow:"0 0 60px rgba(0,0,0,.5)" }}/>
          <h2 style={{ color:"#fff",fontWeight:900,fontSize:"clamp(28px,5vw,54px)",letterSpacing:"-2.5px",lineHeight:1.0,marginBottom:20 }}>
            Pronto para declarar <span style={{ color:"#c8922a" }}>sem drama?</span>
          </h2>
          <p style={{ color:"#64748b",fontSize:16,marginBottom:44 }}>14 dias grátis. Sem cartão. Cancele quando quiser.</p>
          <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
            <button className="btn-primary" style={{ fontSize:16,padding:"18px 44px" }}>Começar 14 dias grátis →</button>
            <button className="btn-ghost" style={{ color:"#64748b",borderColor:"#1e293b" }}>Ver demonstração</button>
          </div>
          <p style={{ color:"rgba(74,163,245,.35)",fontSize:12,marginTop:44 }}>© 2026 OneTouch Tax · onetouchtax.com · IRS Compliant 2024–2026</p>
        </F>
      </section>
    </div>
  );
}
