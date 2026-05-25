import { useState, useEffect, useMemo, useCallback, useRef } from "react";

const C = {
  bg:"#FAF7F2", surface:"#FFFFFF", card:"#FFFDF9", cardAlt:"#FDF6E8",
  border:"#EDE4CE", borderGold:"#C9A84C",
  gold:"#B8892A", goldDeep:"#7A5610", goldLight:"#E8B94A",
  goldPale:"#FDF0CB", goldAccent:"#D4A843",
  text:"#2C2416", textMed:"#6B5535", textMuted:"#A08860", textDim:"#C4AD8A",
  green:"#2D7A4F", greenLight:"#E8F7EE", greenBorder:"#9ED4B4",
  red:"#C0392B", redLight:"#FDF0EE", redBorder:"#F0A89E",
  blue:"#2E5FA3", blueLight:"#EEF3FC",
  purple:"#6B3FA0",
  shadow:"0 2px 12px rgba(139,99,24,0.09)",
  shadowMd:"0 4px 24px rgba(139,99,24,0.13)",
  shadowLg:"0 8px 40px rgba(139,99,24,0.17)",
};

const MOEDAS = [
  { code:"BRL", symbol:"R$",  flag:"🇧🇷", nome:"Real" },
  { code:"USD", symbol:"US$", flag:"🇺🇸", nome:"Dólar" },
  { code:"ARS", symbol:"$",   flag:"🇦🇷", nome:"Peso" },
];
const CAT_SAIDA   = ["Alimentação","Moradia","Transporte","Saúde","Lazer","Educação","Serviço","Compras","Outros"];
const CAT_ENTRADA = ["Salário","Honorários","Economia","Freelance","Rendimento","Presente","Outros"];
const CAT_JUR     = ["Honorários","Consultoria","Acordo","Êxito","Adiantamento","Outros"];
const TIPOS_CONTA = ["Corrente","Poupança","Cartão","Espécie","Investimento","Viagem"];
const EMOJIS_D    = ["✈️","🏨","🎡","🛍️","🏖️","🎭","🍽️","📷","🚢","🏔️","🌴","💎"];
const METAS_PADRAO = [
  { id:"meta_viagem", nome:"Viagem", emoji:"✈️", meta:0, economizado:0, cor:C.blue   },
  { id:"meta_carro",  nome:"Carro",  emoji:"🚗", meta:0, economizado:0, cor:C.green  },
  { id:"meta_casa",   nome:"Casa",   emoji:"🏠", meta:0, economizado:0, cor:C.purple },
];

const uid  = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const hoje = () => new Date().toISOString().split("T")[0];

function fmtData(d) {
  if (!d) return "";
  const p = d.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

function fmtMes(mes) {
  return new Date(mes + "-15").toLocaleDateString("pt-BR", { month:"long", year:"numeric" });
}

function fmtR(v, moeda) {
  const code = moeda || "BRL";
  const m = MOEDAS.find(x => x.code === code) || MOEDAS[0];
  const val = v || 0;
  const abs = Math.abs(val);
  const n = new Intl.NumberFormat("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 }).format(abs);
  return (val < 0 ? "-" : "") + m.symbol + " " + n;
}

function horaAtual() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function load(k, p) {
  try { return JSON.parse(localStorage.getItem(k)) ?? p; } catch { return p; }
}
function save(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

// ── Google Sheets ──────────────────────────────────
function sheetsEnviar(url, payload) {
  return new Promise(function(resolve) {
    try {
      var iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.name = "sf_" + Date.now();
      document.body.appendChild(iframe);

      var form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      form.target = iframe.name;
      form.style.display = "none";

      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "payload";
      input.value = JSON.stringify(payload);
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      setTimeout(function() {
        try { document.body.removeChild(form); } catch(e) {}
        try { document.body.removeChild(iframe); } catch(e) {}
        resolve(true);
      }, 3000);
    } catch(e) {
      resolve(false);
    }
  });
}

// ── Estilos ────────────────────────────────────────
var inp = {
  width:"100%", padding:"12px 14px", borderRadius:12,
  border:"1.5px solid " + C.border, fontSize:15,
  background:C.surface, color:C.text, outline:"none",
  boxSizing:"border-box", fontFamily:"inherit",
  WebkitAppearance:"none",
};

var btnP = {
  background:"linear-gradient(135deg," + C.goldAccent + "," + C.goldLight + ")",
  color:"#fff", border:"none", padding:"13px 20px", borderRadius:12,
  fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
  WebkitTapHighlightColor:"transparent",
};

var btnO = {
  background:"transparent", color:C.textMuted,
  border:"1.5px solid " + C.border, padding:"13px 20px",
  borderRadius:12, fontSize:15, fontWeight:600,
  cursor:"pointer", fontFamily:"inherit",
  WebkitTapHighlightColor:"transparent",
};

var btnG = {
  background:"linear-gradient(135deg," + C.green + ",#3DAA6A)",
  color:"#fff", border:"none", padding:"13px 20px", borderRadius:12,
  fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
};

var btnR = {
  background:"linear-gradient(135deg," + C.red + ",#E74C3C)",
  color:"#fff", border:"none", padding:"13px 20px", borderRadius:12,
  fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
};

// ── Componentes ────────────────────────────────────
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={Object.assign({
      background:C.card, borderRadius:16, border:"1px solid " + C.border,
      boxShadow:C.shadow, padding:"18px 16px",
    }, style || {})}>
      {children}
    </div>
  );
}

function SecTitle({ children, action, onAction }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
      <span style={{ fontSize:12, fontWeight:800, color:C.goldDeep, letterSpacing:1, textTransform:"uppercase" }}>{children}</span>
      {action && <button onClick={onAction} style={{ background:"none", border:"none", fontSize:12, color:C.gold, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{action}</button>}
    </div>
  );
}

function Lbl({ children }) {
  return (
    <label style={{ display:"block", fontSize:11, fontWeight:800, color:C.goldDeep, marginBottom:7, letterSpacing:1, textTransform:"uppercase" }}>
      {children}
    </label>
  );
}

function Campo({ label, children, hint }) {
  return (
    <div style={{ marginBottom:16 }}>
      <Lbl>{label}</Lbl>
      {children}
      {hint && <p style={{ margin:"5px 0 0", fontSize:11, color:C.textDim }}>{hint}</p>}
    </div>
  );
}

function Bar({ value, max, color, h }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const col = color || C.goldAccent;
  const height = h || 6;
  return (
    <div style={{ height:height, background:C.border, borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:pct + "%", borderRadius:99, background:col, transition:"width 0.5s" }} />
    </div>
  );
}

function Pill({ children, color }) {
  const col = color || C.goldAccent;
  return (
    <span style={{
      background:col + "18", color:col, border:"1px solid " + col + "33",
      padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:700,
    }}>{children}</span>
  );
}

function IcTipo({ tipo }) {
  const isE = tipo === "entrada";
  return (
    <div style={{
      width:34, height:34, borderRadius:10, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:isE ? C.greenLight : C.redLight,
      border:"1.5px solid " + (isE ? C.greenBorder : C.redBorder),
      color:isE ? C.green : C.red, fontWeight:800, fontSize:14,
    }}>{isE ? "▲" : "▼"}</div>
  );
}

function Toast({ msg, tipo }) {
  return (
    <div style={{
      position:"fixed", bottom:84, left:"50%", transform:"translateX(-50%)",
      zIndex:9999,
      background:tipo === "ok" ? C.greenLight : C.redLight,
      border:"1.5px solid " + (tipo === "ok" ? C.greenBorder : C.redBorder),
      color:tipo === "ok" ? C.green : C.red,
      padding:"11px 20px", borderRadius:14, fontSize:13, fontWeight:700,
      boxShadow:C.shadowMd, whiteSpace:"nowrap",
    }}>
      {tipo === "ok" ? "✓" : "✕"} {msg}
    </div>
  );
}

function Drawer({ open, onClose, titulo, children }) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(44,36,22,0.45)", backdropFilter:"blur(3px)",
    }} onClick={onClose}>
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        background:C.surface, borderRadius:"20px 20px 0 0",
        padding:"0 16px 32px", maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 -8px 40px rgba(44,36,22,0.18)",
      }} onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ width:40, height:4, background:C.border, borderRadius:99, margin:"12px auto 0" }} />
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"16px 0 14px", borderBottom:"1px solid " + C.border, marginBottom:20,
        }}>
          <span style={{ fontWeight:800, fontSize:17, color:C.text }}>{titulo}</span>
          <button onClick={onClose} style={{
            background:C.bg, border:"1.5px solid " + C.border,
            width:32, height:32, borderRadius:8, cursor:"pointer",
            color:C.textMuted, fontSize:18, display:"flex",
            alignItems:"center", justifyContent:"center",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Rosca({ dados, total, size }) {
  const s = size || 160;
  const cx = s/2, cy = s/2, r = s*0.38, stroke = s*0.13;
  const circ = 2 * Math.PI * r;
  const CORES = [C.blue, C.green, C.goldAccent, C.red, C.purple, "#E67E22", "#16A085"];
  let offset = 0;
  const fatias = dados.map(function(d) {
    const pct = total > 0 ? d.valor / total : 0;
    const arc = pct * circ;
    const seg = { label:d.label, valor:d.valor, arc:arc, offset:offset };
    offset += arc;
    return seg;
  });
  return (
    <svg width={s} height={s}>
      {fatias.length === 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      )}
      {fatias.map(function(f, i) {
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={CORES[i % CORES.length]}
            strokeWidth={stroke}
            strokeDasharray={f.arc + " " + (circ - f.arc)}
            strokeDashoffset={-(f.offset - circ/4)}
          />
        );
      })}
      <text x={cx} y={cy-7} textAnchor="middle" fill={C.textMuted} fontSize={10} fontFamily="Lato">Total</text>
      <text x={cx} y={cy+9} textAnchor="middle" fill={C.goldDeep} fontSize={12} fontWeight="700" fontFamily="Lato">
        {fmtR(total)}
      </text>
    </svg>
  );
}

// ── Formulários ────────────────────────────────────
function FormTrans({ contas, onSalvar, onClose, inicial }) {
  const ini = inicial || { tipo:"saida", contaId:(contas[0] ? contas[0].id : ""), valor:"", categoria:"", descricao:"", data:hoje() };
  const [f, setF] = useState(ini);
  function s(k, v) { setF(function(x) { return Object.assign({}, x, { [k]:v }); }); }
  const cats = f.tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA;
  const ok = f.contaId && parseFloat(f.valor) > 0 && f.categoria && f.data;
  const cSel = contas.find(function(c) { return c.id === f.contaId; });
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {["entrada","saida"].map(function(t) {
          return (
            <button key={t} onClick={function() { s("tipo", t); }} style={{
              flex:1, padding:"13px", borderRadius:12, fontFamily:"inherit",
              border:"2px solid " + (f.tipo===t ? (t==="entrada" ? C.green : C.red) : C.border),
              background:f.tipo===t ? (t==="entrada" ? C.greenLight : C.redLight) : C.bg,
              color:f.tipo===t ? (t==="entrada" ? C.green : C.red) : C.textMuted,
              fontWeight:800, cursor:"pointer", fontSize:15,
            }}>{t === "entrada" ? "▲ Entrada" : "▼ Saída"}</button>
          );
        })}
      </div>
      <Campo label="Conta">
        <select style={inp} value={f.contaId} onChange={function(e) { s("contaId", e.target.value); }}>
          {contas.map(function(c) {
            const m = MOEDAS.find(function(x) { return x.code === c.moeda; });
            return <option key={c.id} value={c.id}>{(m ? m.flag : "") + " " + c.nome + " (" + c.moeda + ")"}</option>;
          })}
        </select>
      </Campo>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label={"Valor" + (cSel ? " (" + cSel.moeda + ")" : "")}>
          <input style={inp} type="number" step="0.01" min="0.01" value={f.valor}
            onChange={function(e) { s("valor", e.target.value); }} placeholder="0,00" />
        </Campo>
        <Campo label="Data">
          <input style={inp} type="date" value={f.data} onChange={function(e) { s("data", e.target.value); }} />
        </Campo>
      </div>
      <Campo label="Categoria">
        <select style={inp} value={f.categoria} onChange={function(e) { s("categoria", e.target.value); }}>
          <option value="">Selecionar…</option>
          {cats.map(function(c) { return <option key={c}>{c}</option>; })}
        </select>
      </Campo>
      <Campo label="Descrição (opcional)">
        <input style={inp} value={f.descricao} onChange={function(e) { s("descricao", e.target.value); }} placeholder="Ex: mercado, combustível…" />
      </Campo>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
        <button onClick={function() { if (ok) onSalvar(f); }} style={Object.assign({}, f.tipo==="entrada" ? btnG : btnR, { flex:1, opacity:ok?1:0.45 })}>
          Registrar
        </button>
      </div>
    </div>
  );
}

function FormJur({ contas, onSalvar, onClose }) {
  const ini = { cliente:"", processo:"", valor:"", categoria:"Honorários", contaId:(contas[0] ? contas[0].id : ""), data:hoje(), descricao:"" };
  const [f, setF] = useState(ini);
  function s(k, v) { setF(function(x) { return Object.assign({}, x, { [k]:v }); }); }
  const ok = f.cliente.trim() && parseFloat(f.valor) > 0 && f.data && f.contaId;
  return (
    <div>
      <div style={{ background:C.blueLight, border:"1px solid " + C.blue + "30", borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:13, color:C.blue, fontWeight:600 }}>
        ⚖️ Os honorários entram como receita na conta selecionada.
      </div>
      <Campo label="Cliente / Parte">
        <input style={inp} value={f.cliente} onChange={function(e) { s("cliente", e.target.value); }} placeholder="Nome do cliente…" />
      </Campo>
      <Campo label="Nº do Processo (opcional)">
        <input style={inp} value={f.processo} onChange={function(e) { s("processo", e.target.value); }} placeholder="0000000-00.0000.0.00.0000" />
      </Campo>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label="Valor (R$)">
          <input style={inp} type="number" step="0.01" min="0.01" value={f.valor}
            onChange={function(e) { s("valor", e.target.value); }} placeholder="0,00" />
        </Campo>
        <Campo label="Data">
          <input style={inp} type="date" value={f.data} onChange={function(e) { s("data", e.target.value); }} />
        </Campo>
      </div>
      <Campo label="Natureza">
        <select style={inp} value={f.categoria} onChange={function(e) { s("categoria", e.target.value); }}>
          {CAT_JUR.map(function(c) { return <option key={c}>{c}</option>; })}
        </select>
      </Campo>
      <Campo label="Conta de destino">
        <select style={inp} value={f.contaId} onChange={function(e) { s("contaId", e.target.value); }}>
          {contas.map(function(c) { return <option key={c.id} value={c.id}>{c.nome}</option>; })}
        </select>
      </Campo>
      <Campo label="Observação (opcional)">
        <input style={inp} value={f.descricao} onChange={function(e) { s("descricao", e.target.value); }} placeholder="Fase, acordo, êxito…" />
      </Campo>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
        <button onClick={function() { if (ok) onSalvar(f); }} style={Object.assign({}, btnP, { flex:1, opacity:ok?1:0.45 })}>
          Registrar honorário
        </button>
      </div>
    </div>
  );
}

function FormConta({ onSalvar, onClose, inicial }) {
  const ini = inicial || { nome:"", tipo:"Corrente", moeda:"BRL", saldoInicial:0 };
  const [f, setF] = useState(ini);
  function s(k, v) { setF(function(x) { return Object.assign({}, x, { [k]:v }); }); }
  return (
    <div>
      <Campo label="Nome da conta">
        <input style={inp} value={f.nome} onChange={function(e) { s("nome", e.target.value); }} placeholder="Ex: Nubank, Dólar Viagem…" />
      </Campo>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label="Tipo">
          <select style={inp} value={f.tipo} onChange={function(e) { s("tipo", e.target.value); }}>
            {TIPOS_CONTA.map(function(t) { return <option key={t}>{t}</option>; })}
          </select>
        </Campo>
        <Campo label="Moeda">
          <select style={inp} value={f.moeda} onChange={function(e) { s("moeda", e.target.value); }}>
            {MOEDAS.map(function(m) { return <option key={m.code} value={m.code}>{m.flag + " " + m.code}</option>; })}
          </select>
        </Campo>
      </div>
      <Campo label="Saldo inicial">
        <input style={inp} type="number" step="0.01" value={f.saldoInicial}
          onChange={function(e) { s("saldoInicial", parseFloat(e.target.value) || 0); }} />
      </Campo>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
        <button onClick={function() { if (f.nome.trim()) onSalvar(f); }}
          style={Object.assign({}, btnP, { flex:1, opacity:f.nome.trim()?1:0.45 })}>Salvar</button>
      </div>
    </div>
  );
}

function FormDesejo({ contas, onSalvar, onClose, inicial }) {
  const ini = inicial || { nome:"", emoji:"✈️", meta:0, moeda:"BRL", contaId:"", descricao:"" };
  const [f, setF] = useState(ini);
  function s(k, v) { setF(function(x) { return Object.assign({}, x, { [k]:v }); }); }
  const ok = f.nome.trim() && parseFloat(f.meta) > 0;
  return (
    <div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        {EMOJIS_D.map(function(e) {
          return (
            <div key={e} onClick={function() { s("emoji", e); }} style={{
              width:42, height:42, borderRadius:10, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:22, cursor:"pointer",
              background:f.emoji===e ? C.goldPale : C.bg,
              border:"2px solid " + (f.emoji===e ? C.goldAccent : C.border),
            }}>{e}</div>
          );
        })}
      </div>
      <Campo label="Nome do desejo">
        <input style={inp} value={f.nome} onChange={function(e) { s("nome", e.target.value); }} placeholder="Ex: Ingresso Disney…" />
      </Campo>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label="Meta">
          <input style={inp} type="number" step="0.01" value={f.meta}
            onChange={function(e) { s("meta", parseFloat(e.target.value) || 0); }} />
        </Campo>
        <Campo label="Moeda">
          <select style={inp} value={f.moeda} onChange={function(e) { s("moeda", e.target.value); }}>
            {MOEDAS.map(function(m) { return <option key={m.code} value={m.code}>{m.flag + " " + m.code}</option>; })}
          </select>
        </Campo>
      </div>
      <Campo label="Conta vinculada (opcional)">
        <select style={inp} value={f.contaId} onChange={function(e) { s("contaId", e.target.value); }}>
          <option value="">Nenhuma</option>
          {contas.map(function(c) { return <option key={c.id} value={c.id}>{c.nome}</option>; })}
        </select>
      </Campo>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
        <button onClick={function() { if (ok) onSalvar(f); }}
          style={Object.assign({}, btnP, { flex:1, opacity:ok?1:0.45 })}>Salvar desejo</button>
      </div>
    </div>
  );
}

// ── Telas ──────────────────────────────────────────
function TelaInicio({ contas, trans, honorarios, desejos, metas, saldos, setAba, abrirTrans, abrirJur }) {
  const mes = hoje().slice(0, 7);
  const transMes = trans.filter(function(t) { return t.data.startsWith(mes); });
  const entradas = transMes.filter(function(t) { return t.tipo==="entrada"; }).reduce(function(s,t) { return s+t.valor; }, 0);
  const saidas   = transMes.filter(function(t) { return t.tipo==="saida"; }).reduce(function(s,t) { return s+t.valor; }, 0);
  const honMes   = honorarios.filter(function(h) { return h.data.startsWith(mes); }).reduce(function(s,h) { return s+h.valor; }, 0);
  const saldoTotal = Object.values(saldos).reduce(function(a,b) { return a+b; }, 0);

  const catMap = {};
  transMes.filter(function(t) { return t.tipo==="saida"; }).forEach(function(t) {
    catMap[t.categoria] = (catMap[t.categoria] || 0) + t.valor;
  });
  const gastosCat = Object.entries(catMap).sort(function(a,b) { return b[1]-a[1]; }).slice(0, 6);

  const recentes = trans.concat(honorarios.map(function(h) { return Object.assign({}, h, { tipo:"entrada", _jur:true }); }))
    .sort(function(a,b) { return b.data.localeCompare(a.data); }).slice(0, 5);

  const CORES = [C.blue, C.green, C.goldAccent, C.red, C.purple, "#E67E22"];

  return (
    <div style={{ paddingBottom:8 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg," + C.goldPale + "," + C.cardAlt + ")", borderBottom:"1px solid " + C.borderGold, padding:"20px 16px 16px" }}>
        <div style={{ fontSize:13, color:C.textMuted, marginBottom:2 }}>{horaAtual()} 👋</div>
        <div style={{ fontSize:22, fontWeight:900, color:C.goldDeep, fontFamily:"'Playfair Display',serif" }}>Rodrigo & Jéssica</div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:2, textTransform:"capitalize" }}>{fmtMes(mes)}</div>

        <div style={{ background:C.surface, borderRadius:14, padding:"14px 16px", marginTop:14, border:"1px solid " + C.borderGold, boxShadow:C.shadow }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase" }}>Saldo total — todas as contas</div>
          <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:28, fontWeight:700, color:saldoTotal>=0?C.green:C.red, marginTop:4 }}>{fmtR(saldoTotal)}</div>
          <div style={{ display:"flex", gap:16, marginTop:8 }}>
            <div>
              <div style={{ fontSize:10, color:C.textMuted }}>Entradas</div>
              <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, fontWeight:700, color:C.green }}>+{fmtR(entradas)}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:C.textMuted }}>Saídas</div>
              <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, fontWeight:700, color:C.red }}>-{fmtR(saidas)}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:C.textMuted }}>Saldo do mês</div>
              <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, fontWeight:700, color:(entradas-saidas)>=0?C.green:C.red }}>{fmtR(entradas-saidas)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 16px 0" }}>
        {/* Acesso rápido */}
        <div style={{ marginBottom:20 }}>
          <SecTitle>Acesso rápido</SecTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              { icon:"📝", label:"Lançamento", fn:abrirTrans },
              { icon:"⚖️", label:"Jurídico",   fn:abrirJur  },
              { icon:"🏦", label:"Contas",      fn:function() { setAba("contas"); }  },
              { icon:"💛", label:"Desejos",     fn:function() { setAba("desejos"); } },
              { icon:"🎯", label:"Metas",       fn:function() { setAba("metas"); }   },
              { icon:"📊", label:"Histórico",   fn:function() { setAba("historico"); }},
            ].map(function(a) {
              return (
                <button key={a.label} onClick={a.fn} style={{
                  background:C.surface, border:"1.5px solid " + C.border,
                  borderRadius:12, padding:"14px 8px", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center",
                  gap:6, fontFamily:"inherit", boxShadow:C.shadow,
                  WebkitTapHighlightColor:"transparent",
                }}>
                  <span style={{ fontSize:24 }}>{a.icon}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:C.textMed }}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico categorias */}
        {gastosCat.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <SecTitle action="Ver tudo" onAction={function() { setAba("historico"); }}>Resumo por categoria</SecTitle>
            <Card>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <Rosca dados={gastosCat.map(function(x) { return { label:x[0], valor:x[1] }; })} total={saidas} size={150} />
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
                  {gastosCat.map(function(x, i) {
                    const pct = saidas > 0 ? Math.round((x[1]/saidas)*100) : 0;
                    return (
                      <div key={x[0]} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:CORES[i%CORES.length], flexShrink:0 }} />
                          <span style={{ fontSize:12, color:C.textMed }}>{x[0]}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:C.textMuted }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Jurídico */}
        {honMes > 0 && (
          <div style={{ marginBottom:20 }}>
            <SecTitle action="Ver tudo" onAction={function() { setAba("juridico"); }}>Jurídico do mês</SecTitle>
            <Card style={{ background:"linear-gradient(135deg," + C.blueLight + "," + C.surface + ")", borderColor:C.blue + "30" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                <div>
                  <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Honorários</div>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:15, fontWeight:700, color:C.green }}>{fmtR(honMes)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Processos</div>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:15, fontWeight:700, color:C.blue }}>
                    {honorarios.filter(function(h) { return h.data.startsWith(mes); }).length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Média</div>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:15, fontWeight:700, color:C.goldDeep }}>
                    {honorarios.filter(function(h) { return h.data.startsWith(mes); }).length > 0
                      ? fmtR(honMes / honorarios.filter(function(h) { return h.data.startsWith(mes); }).length)
                      : "—"}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Metas */}
        {metas.some(function(m) { return m.meta > 0; }) && (
          <div style={{ marginBottom:20 }}>
            <SecTitle action="Ver tudo" onAction={function() { setAba("metas"); }}>Metas</SecTitle>
            {metas.filter(function(m) { return m.meta > 0; }).map(function(m) {
              const pct = Math.min(((m.economizado||0)/m.meta)*100, 100);
              return (
                <Card key={m.id} style={{ padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{m.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{m.nome}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{fmtR(m.economizado||0)} de {fmtR(m.meta)}</div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color:m.cor||C.goldAccent }}>{pct.toFixed(0)}%</span>
                  </div>
                  <Bar value={m.economizado||0} max={m.meta} color={m.cor} />
                </Card>
              );
            })}
          </div>
        )}

        {/* Desejos */}
        {desejos.filter(function(d) { return !d.conquistado; }).length > 0 && (
          <div style={{ marginBottom:20 }}>
            <SecTitle action="Ver tudo" onAction={function() { setAba("desejos"); }}>Desejos em andamento</SecTitle>
            {desejos.filter(function(d) { return !d.conquistado; }).slice(0, 3).map(function(d) {
              const eco = parseFloat(d.economiaManual) || 0;
              const pct = d.meta > 0 ? Math.min((eco/d.meta)*100, 100) : 0;
              return (
                <Card key={d.id} style={{ padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{d.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{d.nome}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{fmtR(eco, d.moeda)} / {fmtR(d.meta, d.moeda)}</div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color:C.goldAccent }}>{pct.toFixed(0)}%</span>
                  </div>
                  <Bar value={eco} max={d.meta} />
                </Card>
              );
            })}
          </div>
        )}

        {/* Recentes */}
        <div style={{ marginBottom:8 }}>
          <SecTitle action="Ver tudo" onAction={function() { setAba("historico"); }}>Lançamentos recentes</SecTitle>
          <Card style={{ padding:0, overflow:"hidden" }}>
            {recentes.length === 0
              ? <div style={{ padding:24, textAlign:"center", color:C.textDim, fontSize:13 }}>Nenhum lançamento ainda.</div>
              : recentes.map(function(t, i) {
                return (
                  <div key={t.id} style={{
                    display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
                    borderBottom:i < recentes.length-1 ? "1px solid " + C.border : "none",
                  }}>
                    <IcTipo tipo={t.tipo} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {t._jur ? "⚖️ " + t.cliente : (t.descricao || t.categoria)}
                      </div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{t.categoria} · {fmtData(t.data)}</div>
                    </div>
                    <div style={{ fontFamily:"'Inconsolata',monospace", fontWeight:700, fontSize:14, color:t.tipo==="entrada"?C.green:C.red }}>
                      {t.tipo==="entrada" ? "+" : "-"}{fmtR(t.valor)}
                    </div>
                  </div>
                );
              })
            }
          </Card>
        </div>
      </div>
    </div>
  );
}

function TelaHistorico({ trans, contas, honorarios, onEditTrans, onDelTrans }) {
  const [mes,  setMes]  = useState(hoje().slice(0,7));
  const [cta,  setCta]  = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [busca,setBusca]= useState("");

  const tudo = trans.concat(honorarios.map(function(h) { return Object.assign({}, h, { tipo:"entrada", _jur:true }); }));
  const filtradas = tudo.filter(function(t) {
    const mesOk  = t.data.startsWith(mes);
    const ctaOk  = cta === "todas" || t.contaId === cta;
    const tipoOk = tipo === "todos" || t.tipo === tipo;
    const bOk    = !busca || (t.descricao||"").toLowerCase().includes(busca.toLowerCase())
                          || (t.categoria||"").toLowerCase().includes(busca.toLowerCase())
                          || (t.cliente||"").toLowerCase().includes(busca.toLowerCase());
    return mesOk && ctaOk && tipoOk && bOk;
  }).sort(function(a,b) { return b.data.localeCompare(a.data); });

  const totE = filtradas.filter(function(t) { return t.tipo==="entrada"; }).reduce(function(s,t) { return s+t.valor; }, 0);
  const totS = filtradas.filter(function(t) { return t.tipo==="saida"; }).reduce(function(s,t) { return s+t.valor; }, 0);

  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Playfair Display',serif", marginBottom:16 }}>Lançamentos</div>
      <input style={Object.assign({}, inp, { marginBottom:10 })} placeholder="🔍 Buscar…" value={busca} onChange={function(e) { setBusca(e.target.value); }} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        <div>
          <Lbl>Mês</Lbl>
          <input type="month" style={Object.assign({}, inp, { padding:"9px 10px", fontSize:13 })} value={mes} onChange={function(e) { setMes(e.target.value); }} />
        </div>
        <div>
          <Lbl>Conta</Lbl>
          <select style={Object.assign({}, inp, { padding:"9px 10px", fontSize:13 })} value={cta} onChange={function(e) { setCta(e.target.value); }}>
            <option value="todas">Todas</option>
            {contas.map(function(c) { return <option key={c.id} value={c.id}>{c.nome}</option>; })}
          </select>
        </div>
        <div>
          <Lbl>Tipo</Lbl>
          <select style={Object.assign({}, inp, { padding:"9px 10px", fontSize:13 })} value={tipo} onChange={function(e) { setTipo(e.target.value); }}>
            <option value="todos">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {[
          { v:totE, c:C.green, bg:C.greenLight, bd:C.greenBorder, p:"▲" },
          { v:totS, c:C.red,   bg:C.redLight,   bd:C.redBorder,   p:"▼" },
          { v:totE-totS, c:(totE-totS)>=0?C.green:C.red, bg:(totE-totS)>=0?C.greenLight:C.redLight, bd:(totE-totS)>=0?C.greenBorder:C.redBorder, p:"=" },
        ].map(function(x, i) {
          return (
            <div key={i} style={{ flex:1, background:x.bg, border:"1.5px solid " + x.bd, borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:x.c, fontWeight:700 }}>{x.p}</div>
              <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:11, fontWeight:700, color:x.c }}>{fmtR(x.v)}</div>
            </div>
          );
        })}
      </div>
      <Card style={{ padding:0, overflow:"hidden" }}>
        {filtradas.length === 0
          ? <div style={{ padding:40, textAlign:"center", color:C.textDim }}>
              <div style={{ fontSize:32, marginBottom:8, opacity:0.4 }}>◈</div>
              <div style={{ fontWeight:700 }}>Nenhum lançamento</div>
            </div>
          : filtradas.map(function(t, i) {
            const conta = contas.find(function(c) { return c.id === t.contaId; });
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderBottom:i<filtradas.length-1?"1px solid "+C.border:"none" }}>
                <IcTipo tipo={t.tipo} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {t._jur ? "⚖️ " + t.cliente : (t.descricao || t.categoria)}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:2 }}>
                    <Pill color={t._jur ? C.blue : C.goldAccent}>{t.categoria}</Pill>
                    {conta && <span style={{ fontSize:11, color:C.textMuted }}>{conta.nome}</span>}
                    <span style={{ fontSize:11, color:C.textDim }}>{fmtData(t.data)}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontWeight:700, fontSize:14, color:t.tipo==="entrada"?C.green:C.red }}>
                    {t.tipo==="entrada" ? "+" : "-"}{fmtR(t.valor, conta ? conta.moeda : "BRL")}
                  </div>
                  {!t._jur && (
                    <div style={{ display:"flex", gap:4, marginTop:4, justifyContent:"flex-end" }}>
                      <button onClick={function() { onEditTrans(t); }} style={{ background:C.bg, border:"1px solid "+C.border, borderRadius:6, padding:"3px 7px", cursor:"pointer", fontSize:11, color:C.textMuted }}>✏</button>
                      <button onClick={function() { onDelTrans(t.id); }} style={{ background:C.redLight, border:"1px solid "+C.redBorder, borderRadius:6, padding:"3px 7px", cursor:"pointer", fontSize:11, color:C.red }}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        }
      </Card>
    </div>
  );
}

function TelaJuridico({ honorarios, contas, onDel, abrirJur }) {
  const [mes, setMes] = useState(hoje().slice(0,7));
  const filtrados = honorarios.filter(function(h) { return h.data.startsWith(mes); }).sort(function(a,b) { return b.data.localeCompare(a.data); });
  const total = filtrados.reduce(function(s,h) { return s+h.valor; }, 0);
  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Playfair Display',serif" }}>⚖️ Jurídico</div>
        <button onClick={abrirJur} style={Object.assign({}, btnP, { padding:"9px 16px", fontSize:13 })}>+ Honorário</button>
      </div>
      <input type="month" style={Object.assign({}, inp, { marginBottom:14 })} value={mes} onChange={function(e) { setMes(e.target.value); }} />
      <Card style={{ background:"linear-gradient(135deg,"+C.blueLight+","+C.surface+")", borderColor:C.blue+"30", marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Total</div>
            <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:16, fontWeight:700, color:C.green }}>{fmtR(total)}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Processos</div>
            <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:16, fontWeight:700, color:C.blue }}>{filtrados.length}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Média</div>
            <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:16, fontWeight:700, color:C.goldDeep }}>
              {filtrados.length > 0 ? fmtR(total/filtrados.length) : "—"}
            </div>
          </div>
        </div>
      </Card>
      <Card style={{ padding:0, overflow:"hidden" }}>
        {filtrados.length === 0
          ? <div style={{ padding:40, textAlign:"center", color:C.textDim }}>
              <div style={{ fontSize:32, marginBottom:8 }}>⚖️</div>
              <div style={{ fontWeight:700 }}>Nenhum honorário no período</div>
              <button onClick={abrirJur} style={Object.assign({}, btnP, { marginTop:16, width:"auto", padding:"10px 20px", fontSize:13 })}>Registrar</button>
            </div>
          : filtrados.map(function(h, i) {
            const conta = contas.find(function(c) { return c.id === h.contaId; });
            return (
              <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:i<filtrados.length-1?"1px solid "+C.border:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:C.blueLight, border:"1.5px solid "+C.blue+"30", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>⚖️</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{h.cliente}</div>
                  <div style={{ display:"flex", gap:6, marginTop:2, flexWrap:"wrap" }}>
                    <Pill color={C.blue}>{h.categoria}</Pill>
                    {h.processo && <span style={{ fontSize:11, color:C.textMuted }}>{h.processo}</span>}
                    <span style={{ fontSize:11, color:C.textDim }}>{fmtData(h.data)}</span>
                  </div>
                  {conta && <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>→ {conta.nome}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Inconsolata',monospace", fontWeight:700, fontSize:15, color:C.green }}>+{fmtR(h.valor)}</div>
                  <button onClick={function() { onDel(h.id); }} style={{ marginTop:4, background:C.redLight, border:"1px solid "+C.redBorder, borderRadius:6, padding:"3px 7px", cursor:"pointer", fontSize:11, color:C.red }}>✕</button>
                </div>
              </div>
            );
          })
        }
      </Card>
    </div>
  );
}

function TelaMetas({ metas, setMetas, showToast }) {
  const [editMeta,  setEditMeta]  = useState(null);
  const [aportar,   setAportar]   = useState(null);
  const [novaVal,   setNovaVal]   = useState("");
  const [aportVal,  setAportVal]  = useState("");

  const totalMeta = metas.reduce(function(s,m) { return s+(m.meta||0); }, 0);
  const totalEco  = metas.reduce(function(s,m) { return s+(m.economizado||0); }, 0);

  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Playfair Display',serif", marginBottom:4 }}>🎯 Metas</div>
      <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>Viagem, carro e casa.</div>
      <Card style={{ background:"linear-gradient(135deg,"+C.goldPale+","+C.cardAlt+")", borderColor:C.borderGold, marginBottom:20 }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.goldDeep, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Visão geral</div>
        <Bar value={totalEco} max={totalMeta} h={8} />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <div>
            <div style={{ fontSize:10, color:C.textMuted }}>Guardado</div>
            <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:15, fontWeight:700, color:C.green }}>{fmtR(totalEco)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:C.textMuted }}>Total das metas</div>
            <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:15, fontWeight:700, color:C.goldDeep }}>{fmtR(totalMeta)}</div>
          </div>
        </div>
      </Card>
      {metas.map(function(m) {
        const eco  = m.economizado || 0;
        const meta = m.meta || 0;
        const pct  = meta > 0 ? Math.min((eco/meta)*100, 100) : 0;
        const falta= Math.max(meta - eco, 0);
        return (
          <Card key={m.id} style={{ position:"relative", overflow:"hidden", marginBottom:14 }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,"+m.cor+","+m.cor+"88)" }} />
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginTop:4, marginBottom:14 }}>
              <div style={{ width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, background:m.cor+"15", border:"1.5px solid "+m.cor+"30" }}>{m.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:16, color:C.text }}>{m.nome}</div>
                {meta > 0
                  ? <div style={{ fontSize:12, color:C.textMuted }}>Meta: {fmtR(meta)}</div>
                  : <div style={{ fontSize:12, color:C.textDim }}>Meta não definida</div>
                }
              </div>
              <button onClick={function() { setEditMeta(m); setNovaVal(meta > 0 ? String(meta) : ""); }} style={{ background:C.bg, border:"1.5px solid "+C.border, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:12, color:C.textMuted, fontFamily:"inherit" }}>✏ Meta</button>
            </div>
            {meta > 0 && (
              <>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
                    <span style={{ color:C.textMuted }}>Progresso</span>
                    <span style={{ fontWeight:800, color:m.cor }}>{pct.toFixed(0)}%</span>
                  </div>
                  <Bar value={eco} max={meta} color={m.cor} h={8} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, background:C.bg, borderRadius:10, padding:"10px", border:"1px solid "+C.border, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Guardado</div>
                    <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, fontWeight:700, color:C.green }}>{fmtR(eco)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Meta</div>
                    <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, fontWeight:700, color:m.cor }}>{fmtR(meta)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Falta</div>
                    <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:13, fontWeight:700, color:falta>0?C.red:C.green }}>{fmtR(falta)}</div>
                  </div>
                </div>
              </>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function() { setAportar(m); setAportVal(""); }} style={Object.assign({}, btnP, { flex:1, padding:"10px", fontSize:13, background:"linear-gradient(135deg,"+m.cor+","+m.cor+"CC)" })}>+ Guardar</button>
              {eco > 0 && <button onClick={function() { if(window.confirm("Zerar esta meta?")) { setMetas(function(ms) { return ms.map(function(x) { return x.id===m.id ? Object.assign({},x,{economizado:0}) : x; }); }); showToast("Meta zerada"); } }} style={Object.assign({}, btnO, { padding:"10px 14px", fontSize:12, borderColor:C.redBorder, color:C.red })}>Zerar</button>}
            </div>
          </Card>
        );
      })}

      <Drawer open={!!editMeta} onClose={function() { setEditMeta(null); }} titulo={"Meta — " + (editMeta ? editMeta.nome : "")}>
        {editMeta && (
          <div>
            <div style={{ textAlign:"center", fontSize:40, marginBottom:16 }}>{editMeta.emoji}</div>
            <Campo label="Valor da meta (R$)">
              <input style={inp} type="number" step="0.01" min="0.01" autoFocus value={novaVal} onChange={function(e) { setNovaVal(e.target.value); }} placeholder="0,00" />
            </Campo>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function() { setEditMeta(null); }} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
              <button onClick={function() { const v=parseFloat(novaVal); if(v>0){ setMetas(function(ms){ return ms.map(function(x){ return x.id===editMeta.id?Object.assign({},x,{meta:v}):x; }); }); setEditMeta(null); showToast("Meta atualizada ✓"); } }} style={Object.assign({}, btnP, { flex:1 })}>Salvar</button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={!!aportar} onClose={function() { setAportar(null); }} titulo={"Guardar para " + (aportar ? aportar.nome : "")}>
        {aportar && (
          <div>
            <div style={{ textAlign:"center", fontSize:40, marginBottom:8 }}>{aportar.emoji}</div>
            <div style={{ textAlign:"center", fontSize:13, color:C.textMuted, marginBottom:16 }}>Já guardado: <strong style={{ color:C.green }}>{fmtR(aportar.economizado||0)}</strong></div>
            <Campo label="Valor a guardar (R$)">
              <input style={inp} type="number" step="0.01" min="0.01" autoFocus value={aportVal} onChange={function(e) { setAportVal(e.target.value); }} placeholder="0,00" />
            </Campo>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function() { setAportar(null); }} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
              <button onClick={function() { const v=parseFloat(aportVal); if(v>0){ setMetas(function(ms){ return ms.map(function(x){ return x.id===aportar.id?Object.assign({},x,{economizado:(x.economizado||0)+v}):x; }); }); showToast(fmtR(v)+" guardado para \""+aportar.nome+"\" ✓"); setAportar(null); } }} style={Object.assign({}, btnP, { flex:1 })}>Guardar</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function TelaContas({ contas, saldos, trans, onAdd, onEdit, onDel }) {
  const totalBRL = contas.filter(function(c) { return c.moeda==="BRL"; }).reduce(function(s,c) { return s+(saldos[c.id]||0); }, 0);
  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Playfair Display',serif" }}>Contas</div>
        <button onClick={onAdd} style={Object.assign({}, btnP, { padding:"9px 16px", fontSize:13 })}>+ Nova</button>
      </div>
      <Card style={{ background:"linear-gradient(135deg,"+C.goldPale+","+C.cardAlt+")", borderColor:C.borderGold, marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:C.goldDeep, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Patrimônio total (R$)</div>
        <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:26, fontWeight:700, color:totalBRL>=0?C.green:C.red }}>{fmtR(totalBRL)}</div>
      </Card>
      {MOEDAS.map(function(moeda) {
        const lista = contas.filter(function(c) { return c.moeda === moeda.code; });
        if (lista.length === 0) return null;
        return (
          <div key={moeda.code} style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{moeda.flag} {moeda.nome}</div>
            {lista.map(function(c) {
              const sal = saldos[c.id] || 0;
              return (
                <Card key={c.id} style={{ padding:"14px 16px", position:"relative", overflow:"hidden", marginBottom:10 }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,"+C.goldAccent+","+C.goldLight+")" }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{c.nome}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{c.tipo} · {trans.filter(function(t) { return t.contaId===c.id; }).length} transações</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:18, fontWeight:700, color:sal>=0?C.green:C.red }}>{fmtR(sal, moeda.code)}</div>
                      <div style={{ fontSize:10, color:C.textDim }}>Inicial: {fmtR(c.saldoInicial, moeda.code)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <button onClick={function() { onEdit(c); }} style={{ flex:1, background:C.bg, border:"1.5px solid "+C.border, borderRadius:8, padding:"7px", cursor:"pointer", fontSize:12, color:C.textMuted, fontFamily:"inherit" }}>✏ Editar</button>
                    <button onClick={function() { onDel(c.id); }} style={{ background:C.redLight, border:"1.5px solid "+C.redBorder, borderRadius:8, padding:"7px 12px", cursor:"pointer", fontSize:12, color:C.red }}>✕</button>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })}
      {contas.length === 0 && (
        <Card style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:8, opacity:0.3 }}>🏦</div>
          <div style={{ color:C.textMuted, fontWeight:700 }}>Nenhuma conta cadastrada</div>
          <button onClick={onAdd} style={Object.assign({}, btnP, { marginTop:16, width:"auto", padding:"11px 24px", fontSize:14 })}>Criar primeira conta</button>
        </Card>
      )}
    </div>
  );
}

function TelaDesejos({ desejos, contas, saldos, setDesejos, onAdd, onEdit, onDel, onToggle, showToast }) {
  const [aportar,  setAportar]  = useState(null);
  const [aportVal, setAportVal] = useState("");
  const ativos = desejos.filter(function(d) { return !d.conquistado; });
  const ganhos = desejos.filter(function(d) { return d.conquistado; });
  return (
    <div style={{ padding:"16px 16px 0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:"'Playfair Display',serif" }}>💛 Desejos</div>
        <button onClick={onAdd} style={Object.assign({}, btnP, { padding:"9px 16px", fontSize:13 })}>+ Novo</button>
      </div>
      {ganhos.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.green, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>✓ Conquistados</div>
          {ganhos.map(function(d) {
            return (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, background:C.greenLight, border:"1.5px solid "+C.greenBorder, borderRadius:12, padding:"12px 14px", marginBottom:8, opacity:0.8 }}>
                <span style={{ fontSize:20 }}>{d.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.green, textDecoration:"line-through" }}>{d.nome}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{fmtR(d.meta, d.moeda)}</div>
                </div>
                <button onClick={function() { onToggle(d.id); }} style={{ background:"none", border:"1px solid "+C.greenBorder, borderRadius:7, padding:"4px 9px", cursor:"pointer", color:C.green, fontSize:11, fontFamily:"inherit" }}>Reabrir</button>
                <button onClick={function() { onDel(d.id); }} style={{ background:C.redLight, border:"1px solid "+C.redBorder, borderRadius:7, padding:"4px 8px", cursor:"pointer", color:C.red, fontSize:11 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      {ativos.length === 0 && (
        <Card style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:8, opacity:0.3 }}>✦</div>
          <div style={{ color:C.textMuted, fontWeight:700 }}>Nenhum desejo cadastrado</div>
          <button onClick={onAdd} style={Object.assign({}, btnP, { marginTop:16, width:"auto", padding:"11px 24px", fontSize:14 })}>Adicionar desejo</button>
        </Card>
      )}
      {ativos.map(function(d) {
        const eco  = parseFloat(d.economiaManual) || 0;
        const pct  = d.meta > 0 ? Math.min((eco/d.meta)*100, 100) : 0;
        const falta= Math.max(d.meta - eco, 0);
        const cta  = contas.find(function(c) { return c.id === d.contaId; });
        return (
          <Card key={d.id} style={{ position:"relative", overflow:"hidden", marginBottom:14 }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,"+C.goldAccent+","+C.goldLight+")" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginTop:4, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:C.goldPale, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, border:"1.5px solid "+C.borderGold }}>{d.emoji}</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{d.nome}</div>
                  <div style={{ fontSize:12, color:C.textMuted }}>{(MOEDAS.find(function(x){return x.code===d.moeda;})||MOEDAS[0]).flag} {d.moeda}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={function() { onEdit(d); }} style={{ background:C.bg, border:"1.5px solid "+C.border, borderRadius:7, padding:"5px 8px", cursor:"pointer", color:C.textMuted, fontSize:12 }}>✏</button>
                <button onClick={function() { onDel(d.id); }} style={{ background:C.redLight, border:"1.5px solid "+C.redBorder, borderRadius:7, padding:"5px 8px", cursor:"pointer", color:C.red, fontSize:12 }}>✕</button>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12 }}>
                <span style={{ color:C.textMuted }}>Economizado</span>
                <span style={{ fontWeight:800, color:C.goldDeep }}>{pct.toFixed(0)}%</span>
              </div>
              <Bar value={eco} max={d.meta} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, background:C.bg, borderRadius:10, padding:"10px", border:"1px solid "+C.border, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Guardado</div>
                <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:14, fontWeight:700, color:C.green }}>{fmtR(eco, d.moeda)}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:C.textMuted, textTransform:"uppercase" }}>Falta</div>
                <div style={{ fontFamily:"'Inconsolata',monospace", fontSize:14, fontWeight:700, color:falta>0?C.red:C.green }}>{fmtR(falta, d.moeda)}</div>
              </div>
            </div>
            {cta && <div style={{ fontSize:11, color:C.textDim, marginBottom:8 }}>Conta: {cta.nome}</div>}
            {d.descricao && <div style={{ fontSize:12, color:C.textMuted, fontStyle:"italic", marginBottom:10 }}>{d.descricao}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function() { setAportar(d); setAportVal(""); }} style={Object.assign({}, btnP, { flex:1, padding:"10px", fontSize:13 })}>+ Guardar</button>
              {pct >= 100 && <button onClick={function() { onToggle(d.id); }} style={Object.assign({}, btnG, { padding:"10px 14px", fontSize:12 })}>✓ Conquistei!</button>}
            </div>
          </Card>
        );
      })}
      <Drawer open={!!aportar} onClose={function() { setAportar(null); }} titulo={"Guardar para \"" + (aportar ? aportar.nome : "") + "\""}>
        {aportar && (
          <div>
            <div style={{ textAlign:"center", fontSize:40, marginBottom:8 }}>{aportar.emoji}</div>
            <div style={{ textAlign:"center", fontSize:13, color:C.textMuted, marginBottom:20 }}>Já guardado: <strong style={{ color:C.green }}>{fmtR(parseFloat(aportar.economiaManual)||0, aportar.moeda)}</strong></div>
            <Campo label={"Valor (" + aportar.moeda + ")"}>
              <input style={inp} type="number" step="0.01" min="0.01" autoFocus value={aportVal} onChange={function(e) { setAportVal(e.target.value); }} placeholder="0,00" />
            </Campo>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={function() { setAportar(null); }} style={Object.assign({}, btnO, { flex:1 })}>Cancelar</button>
              <button onClick={function() { const v=parseFloat(aportVal); if(v>0){ setDesejos(function(ds){ return ds.map(function(x){ return x.id===aportar.id?Object.assign({},x,{economiaManual:(parseFloat(x.economiaManual)||0)+v}):x; }); }); showToast(fmtR(v,aportar.moeda)+" guardado ✓"); setAportar(null); } }} style={Object.assign({}, btnP, { flex:1 })}>Guardar</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── APP ────────────────────────────────────────────
export default function App() {
  const [contas,     setContas]    = useState(function() { return load("rfj_contas",   []); });
  const [trans,      setTrans]     = useState(function() { return load("rfj_trans",    []); });
  const [honorarios, setHon]       = useState(function() { return load("rfj_hon",      []); });
  const [desejos,    setDesejos]   = useState(function() { return load("rfj_desejos",  []); });
  const [metas,      setMetas]     = useState(function() { return load("rfj_metas",    METAS_PADRAO); });
  const [cfg,        setCfg]       = useState(function() { return load("rfj_sheets",   null); });
  const [sheetsUrl,  setSheetsUrl] = useState(function() { const c=load("rfj_sheets",null); return c?c.scriptUrl:""; });
  const [syncSt,     setSyncSt]    = useState("idle");
  const [aba,        setAba]       = useState("inicio");
  const [drawer,     setDrawer]    = useState(null);
  const [editTarget, setEdit]      = useState(null);
  const [toast,      setToast]     = useState(null);
  const syncTimer = useRef(null);

  useEffect(function() { save("rfj_contas",   contas);    }, [contas]);
  useEffect(function() { save("rfj_trans",    trans);     }, [trans]);
  useEffect(function() { save("rfj_hon",      honorarios);}, [honorarios]);
  useEffect(function() { save("rfj_desejos",  desejos);   }, [desejos]);
  useEffect(function() { save("rfj_metas",    metas);     }, [metas]);
  useEffect(function() { if (cfg) save("rfj_sheets", cfg); }, [cfg]);

  const showToast = useCallback(function(msg, tipo) {
    setToast({ msg:msg, tipo:tipo||"ok" });
    setTimeout(function() { setToast(null); }, 3000);
  }, []);

  const triggerSync = useCallback(function(c, t, h, d, m, config) {
    if (!config || !config.scriptUrl) return;
    clearTimeout(syncTimer.current);
    setSyncSt("syncing");
    syncTimer.current = setTimeout(function() {
      sheetsEnviar(config.scriptUrl, { action:"SYNC_ALL", contas:c, transacoes:t, honorarios:h, desejos:d, metas:m, timestamp:new Date().toISOString() })
        .then(function() { setSyncSt("ok"); showToast("Planilha sincronizada ✓"); })
        .catch(function() { setSyncSt("error"); });
    }, 2000);
  }, [showToast]);

  useEffect(function() {
    if (cfg && cfg.scriptUrl) triggerSync(contas, trans, honorarios, desejos, metas, cfg);
  }, [contas, trans, honorarios, desejos, metas]); // eslint-disable-line

  const saldos = useMemo(function() {
    const m = {};
    contas.forEach(function(c) { m[c.id] = parseFloat(c.saldoInicial) || 0; });
    trans.forEach(function(t) { if (m.hasOwnProperty(t.contaId)) m[t.contaId] += t.tipo==="entrada" ? t.valor : -t.valor; });
    honorarios.forEach(function(h) { if (m.hasOwnProperty(h.contaId)) m[h.contaId] += h.valor; });
    return m;
  }, [contas, trans, honorarios]);

  function openDrawer(tipo, target) { setEdit(target || null); setDrawer(tipo); }
  function closeDrawer() { setDrawer(null); setEdit(null); }

  function addTrans(f) {
    const n = Object.assign({}, f, { id:uid(), valor:parseFloat(f.valor), criadoEm:new Date().toISOString() });
    setTrans(function(t) { return t.concat([n]); });
    closeDrawer();
    if (cfg && cfg.scriptUrl) {
      const contaNome = (contas.find(function(c) { return c.id===n.contaId; }) || {}).nome || "";
      sheetsEnviar(cfg.scriptUrl, { action:"APPEND_TRANS", row:Object.assign({}, n, { contaNome:contaNome }) });
    }
    showToast("Lançamento registrado ✓");
  }
  function editTrans(f) { setTrans(function(t) { return t.map(function(x) { return x.id===editTarget.id ? Object.assign({},x,f,{valor:parseFloat(f.valor)}) : x; }); }); closeDrawer(); showToast("Atualizado ✓"); }
  function delTrans(id) { if (!window.confirm("Remover lançamento?")) return; setTrans(function(t) { return t.filter(function(x) { return x.id!==id; }); }); showToast("Removido", "error"); }

  function addHon(f) {
    const n = Object.assign({}, f, { id:uid(), valor:parseFloat(f.valor), criadoEm:new Date().toISOString() });
    setHon(function(h) { return h.concat([n]); });
    closeDrawer();
    if (cfg && cfg.scriptUrl) sheetsEnviar(cfg.scriptUrl, { action:"APPEND_HON", row:n });
    showToast("Honorário registrado ✓");
  }
  function delHon(id) { if (!window.confirm("Remover honorário?")) return; setHon(function(h) { return h.filter(function(x) { return x.id!==id; }); }); showToast("Removido", "error"); }

  function addConta(f) { setContas(function(c) { return c.concat([Object.assign({},f,{id:uid(),saldoInicial:parseFloat(f.saldoInicial)||0})]); }); closeDrawer(); showToast("Conta criada ✓"); }
  function editConta(f) { setContas(function(c) { return c.map(function(x) { return x.id===editTarget.id ? Object.assign({},x,f,{saldoInicial:parseFloat(f.saldoInicial)||0}) : x; }); }); closeDrawer(); showToast("Atualizado ✓"); }
  function delConta(id) { if (!window.confirm("Remover conta e transações?")) return; setContas(function(c) { return c.filter(function(x) { return x.id!==id; }); }); setTrans(function(t) { return t.filter(function(x) { return x.contaId!==id; }); }); showToast("Removida", "error"); }

  function addDesejo(f) { setDesejos(function(d) { return d.concat([Object.assign({},f,{id:uid(),meta:parseFloat(f.meta)||0,economiaManual:0})]); }); closeDrawer(); showToast("Desejo adicionado ✓"); }
  function editDesejo(f) { setDesejos(function(d) { return d.map(function(x) { return x.id===editTarget.id ? Object.assign({},x,f,{meta:parseFloat(f.meta)||0}) : x; }); }); closeDrawer(); showToast("Atualizado ✓"); }
  function delDesejo(id) { if (!window.confirm("Remover desejo?")) return; setDesejos(function(d) { return d.filter(function(x) { return x.id!==id; }); }); showToast("Removido", "error"); }
  function toggleDesejo(id) { setDesejos(function(d) { return d.map(function(x) { return x.id===id ? Object.assign({},x,{conquistado:!x.conquistado}) : x; }); }); }

  const NAV = [
    { id:"inicio",    icon:"🏠", label:"Início"     },
    { id:"historico", icon:"📋", label:"Lançamentos" },
    { id:"metas",     icon:"🎯", label:"Metas"      },
    { id:"juridico",  icon:"⚖️", label:"Jurídico"   },
    { id:"contas",    icon:"🏦", label:"Contas"     },
    { id:"desejos",   icon:"💛", label:"Desejos"    },
  ];

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:C.bg, fontFamily:"'Lato',sans-serif", position:"relative", boxShadow:"0 0 40px rgba(0,0,0,0.08)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@400;700;900&family=Inconsolata:wght@400;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input,select,button { font-family:'Lato',sans-serif; }
        select option { background:#fff; color:#2C2416; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity:0.5; }
        input:focus, select:focus { border-color:${C.goldAccent} !important; outline:none; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:10px; }
        button:active { opacity:0.75; }
      `}</style>

      {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}

      <div style={{ paddingBottom:80, overflowY:"auto", minHeight:"calc(100vh - 66px)" }}>
        {aba==="inicio"    && <TelaInicio contas={contas} trans={trans} honorarios={honorarios} desejos={desejos} metas={metas} saldos={saldos} setAba={setAba} abrirTrans={function(){openDrawer("trans");}} abrirJur={function(){openDrawer("jur");}} />}
        {aba==="historico" && <TelaHistorico trans={trans} contas={contas} honorarios={honorarios} onEditTrans={function(t){openDrawer("trans",t);}} onDelTrans={delTrans} />}
        {aba==="juridico"  && <TelaJuridico honorarios={honorarios} contas={contas} onDel={delHon} abrirJur={function(){openDrawer("jur");}} />}
        {aba==="metas"     && <TelaMetas metas={metas} setMetas={setMetas} showToast={showToast} />}
        {aba==="contas"    && <TelaContas contas={contas} saldos={saldos} trans={trans} onAdd={function(){openDrawer("conta");}} onEdit={function(c){openDrawer("conta",c);}} onDel={delConta} />}
        {aba==="desejos"   && <TelaDesejos desejos={desejos} contas={contas} saldos={saldos} setDesejos={setDesejos} onAdd={function(){openDrawer("desejo");}} onEdit={function(d){openDrawer("desejo",d);}} onDel={delDesejo} onToggle={toggleDesejo} showToast={showToast} />}
      </div>

      {/* Nav inferior */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:C.surface, borderTop:"1.5px solid "+C.border, display:"flex", zIndex:500, boxShadow:"0 -4px 20px rgba(139,99,24,0.10)", paddingBottom:"env(safe-area-inset-bottom)" }}>
        {NAV.map(function(n) {
          return (
            <button key={n.id} onClick={function() { setAba(n.id); }} style={{ flex:1, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, fontFamily:"inherit", WebkitTapHighlightColor:"transparent", borderTop:"2.5px solid "+(aba===n.id?C.goldAccent:"transparent") }}>
              <span style={{ fontSize:18 }}>{n.icon}</span>
              <span style={{ fontSize:9, fontWeight:700, color:aba===n.id?C.goldDeep:C.textDim, letterSpacing:0.3 }}>{n.label}</span>
            </button>
          );
        })}
      </div>

      {/* Botão Sheets */}
      <button onClick={function(){openDrawer("sheets");}} style={{ position:"fixed", bottom:70, right:16, width:44, height:44, borderRadius:"50%", background:cfg&&cfg.scriptUrl?C.greenLight:C.goldPale, border:"1.5px solid "+(cfg&&cfg.scriptUrl?C.greenBorder:C.borderGold), cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:C.shadowMd, zIndex:400 }} title="Google Sheets">📊</button>

      {/* Drawers */}
      <Drawer open={drawer==="trans"} onClose={closeDrawer} titulo={editTarget?"Editar Lançamento":"Novo Lançamento"}>
        {contas.length===0
          ? <div style={{textAlign:"center",padding:"20px 0"}}><p style={{color:C.textMuted,marginBottom:16}}>Cadastre uma conta primeiro.</p><button onClick={function(){closeDrawer();openDrawer("conta");}} style={Object.assign({},btnP,{width:"auto",padding:"11px 24px"})}>Criar conta</button></div>
          : <FormTrans contas={contas} inicial={editTarget} onSalvar={editTarget?editTrans:addTrans} onClose={closeDrawer} />
        }
      </Drawer>

      <Drawer open={drawer==="jur"} onClose={closeDrawer} titulo="Registrar Honorário">
        {contas.length===0
          ? <div style={{textAlign:"center",padding:"20px 0"}}><p style={{color:C.textMuted,marginBottom:16}}>Cadastre uma conta primeiro.</p><button onClick={function(){closeDrawer();openDrawer("conta");}} style={Object.assign({},btnP,{width:"auto",padding:"11px 24px"})}>Criar conta</button></div>
          : <FormJur contas={contas} onSalvar={addHon} onClose={closeDrawer} />
        }
      </Drawer>

      <Drawer open={drawer==="conta"} onClose={closeDrawer} titulo={editTarget?"Editar Conta":"Nova Conta"}>
        <FormConta inicial={editTarget} onSalvar={editTarget?editConta:addConta} onClose={closeDrawer} />
      </Drawer>

      <Drawer open={drawer==="desejo"} onClose={closeDrawer} titulo={editTarget?"Editar Desejo":"Novo Desejo"}>
        <FormDesejo contas={contas} inicial={editTarget} onSalvar={editTarget?editDesejo:addDesejo} onClose={closeDrawer} />
      </Drawer>

      <Drawer open={drawer==="sheets"} onClose={closeDrawer} titulo="Google Sheets">
        <div>
          <div style={{ background:C.goldPale, border:"1px solid "+C.borderGold, borderRadius:10, padding:"12px 14px", marginBottom:18, fontSize:13, color:C.goldDeep, lineHeight:1.6 }}>
            📋 Cole a URL do Web App e salve. A confirmação é feita direto na planilha — registre um lançamento e veja na aba Transações do Drive.
          </div>
          <Campo label="URL do Web App">
            <input style={Object.assign({},inp,{fontFamily:"'Inconsolata',monospace",fontSize:12})}
              value={sheetsUrl} onChange={function(e) { setSheetsUrl(e.target.value); }}
              placeholder="https://script.google.com/macros/s/…/exec" />
          </Campo>
          {sheetsUrl.trim().startsWith("https://script.google.com") && (
            <div style={{ background:C.greenLight, border:"1px solid "+C.greenBorder, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.green, fontWeight:600 }}>
              ✓ URL válida — clique em Salvar para ativar.
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={closeDrawer} style={Object.assign({},btnO,{flex:1})}>Cancelar</button>
            <button onClick={function() {
              const u = sheetsUrl.trim();
              if (u.startsWith("https://script.google.com")) {
                const novoCfg = { scriptUrl:u };
                setCfg(novoCfg);
                closeDrawer();
                showToast("Google Sheets ativado ✓");
                setTimeout(function() { triggerSync(contas,trans,honorarios,desejos,metas,novoCfg); }, 500);
              } else {
                showToast("URL inválida", "error");
              }
            }} style={Object.assign({},btnP,{flex:1,opacity:sheetsUrl.trim().startsWith("https://script.google.com")?1:0.45})}>
              Salvar e ativar
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
