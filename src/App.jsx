import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
const APP_PASSWORD = "325874Nn";

const CATEGORIES = ["Combustible", "Reparación", "Mantenimiento", "Neumáticos", "Multa", "Peaje", "Lavado", "Otro"];
const DOC_TYPES = ["Seguro", "Documento", "Manual", "Factura", "Contrato", "Otro"];
const categoryColor = {
  "Combustible": "#F59E0B", "Reparación": "#EF4444", "Mantenimiento": "#3B82F6",
  "Neumáticos": "#8B5CF6", "Multa": "#EC4899", "Peaje": "#6B7280", "Lavado": "#06B6D4", "Otro": "#9CA3AF",
};

function LoginScreen({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = () => {
    if (pwd === APP_PASSWORD) {
      sessionStorage.setItem("fleet_auth", "1");
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ background: "#0F1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono&display=swap');
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        .shake{animation:shake .4s ease}
      `}</style>
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ background: "#FBBF24", borderRadius: 12, width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px" }}>🚐</div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 32, color: "#F9FAFB", letterSpacing: 2, marginBottom: 4 }}>FLEET</div>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: "#6B7280", letterSpacing: 2, marginBottom: 40 }}>GESTOR DE FLOTA</div>

        <div className={shake ? "shake" : ""} style={{ background: "#1A1D27", border: `1px solid ${error ? "#EF4444" : "#252836"}`, borderRadius: 8, padding: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#6B7280", marginBottom: 8, textAlign: "left" }}>Contraseña</div>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{ background: "#252836", border: `1px solid ${error ? "#EF4444" : "#374151"}`, borderRadius: 4, padding: "10px 14px", color: "#E5E7EB", fontFamily: "'DM Mono'", fontSize: 16, width: "100%", outline: "none", marginBottom: 8, letterSpacing: 4 }}
            autoFocus
          />
          {error && <div style={{ color: "#EF4444", fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, marginBottom: 8, textAlign: "left" }}>Contraseña incorrecta</div>}
          <button
            onClick={handleLogin}
            style={{ background: "#FBBF24", color: "#0F1117", border: "none", borderRadius: 4, padding: "10px 0", fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: 4 }}
          >
            Entrar →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FleetManager() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem("fleet_auth"));
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [scanModal, setScanModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [addRepairModal, setAddRepairModal] = useState(false);
  const [addDocModal, setAddDocModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileRef = useRef();
  const docFileRef = useRef();

  const [newVehicle, setNewVehicle] = useState({ plate: "", model: "", year: "", km: "", color: "#E8A838" });
  const [newRepair, setNewRepair] = useState({ vehicleId: "", date: "", description: "", workshop: "", cost: "", km: "", status: "Pendiente" });
  const [newDoc, setNewDoc] = useState({ vehicleId: "", name: "", type: "Seguro", expiry: "" });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: "", date: "", category: "", amount: "", description: "", supplier: "" });

  useEffect(() => {
    if (!authed) return;
    (async () => {
      const [v, e, r, d] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("repairs").select("*"),
        supabase.from("docs").select("*"),
      ]);
      setVehicles(v.data || []);
      setExpenses((e.data || []).map(x => ({ ...x, vehicleId: x.vehicle_id, amount: Number(x.amount) })));
      setRepairs((r.data || []).map(x => ({ ...x, vehicleId: x.vehicle_id, cost: Number(x.cost) })));
      setDocs((d.data || []).map(x => ({ ...x, vehicleId: x.vehicle_id })));
      setReady(true);
    })();
  }, [authed]);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const totalByVehicle = (vid) => expenses.filter(e => e.vehicleId === vid).reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ANTHROPIC_API_KEY) { showNotif("Configura VITE_ANTHROPIC_API_KEY en Vercel", "error"); return; }
    setScanning(true); setScannedData(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
            { type: "text", text: `Analiza esta factura/ticket y extrae los datos. Responde SOLO con JSON sin markdown:\n{"supplier":"nombre empresa","date":"YYYY-MM-DD","amount":número,"category":"Combustible|Reparación|Mantenimiento|Neumáticos|Multa|Peaje|Lavado|Otro","description":"descripción breve","confidence":"alta|media|baja"}` }
          ]}]
        })
      });
      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setScannedData(parsed);
      setExpenseForm(p => ({ ...p, supplier: parsed.supplier || "", date: parsed.date || "", amount: parsed.amount?.toString() || "", category: parsed.category || "Otro", description: parsed.description || "" }));
    } catch {
      showNotif("No se pudo leer la imagen. Completa los datos manualmente.", "error");
      setScannedData({ confidence: "baja" });
    }
    setScanning(false);
  };

  const saveExpense = async () => {
    if (!expenseForm.vehicleId || !expenseForm.amount) { showNotif("Selecciona vehículo e importe", "error"); return; }
    const rec = { id: "e" + Date.now(), vehicle_id: expenseForm.vehicleId, date: expenseForm.date || new Date().toISOString().slice(0, 10), category: expenseForm.category || "Otro", amount: parseFloat(expenseForm.amount), description: expenseForm.description, supplier: expenseForm.supplier };
    const { error } = await supabase.from("expenses").insert(rec);
    if (error) { showNotif("Error al guardar", "error"); return; }
    setExpenses(p => [{ ...rec, vehicleId: rec.vehicle_id }, ...p]);
    setScanModal(false); setScannedData(null);
    setExpenseForm({ vehicleId: "", date: "", category: "", amount: "", description: "", supplier: "" });
    showNotif("Gasto guardado ✓");
  };

  const saveVehicle = async () => {
    if (!newVehicle.plate || !newVehicle.model) { showNotif("Matrícula y modelo obligatorios", "error"); return; }
    const rec = { id: "v" + Date.now(), plate: newVehicle.plate, model: newVehicle.model, year: parseInt(newVehicle.year) || null, km: parseInt(newVehicle.km) || 0, color: newVehicle.color };
    const { error } = await supabase.from("vehicles").insert(rec);
    if (error) { showNotif("Error al guardar", "error"); return; }
    setVehicles(p => [...p, rec]);
    setAddVehicleModal(false); setNewVehicle({ plate: "", model: "", year: "", km: "", color: "#E8A838" });
    showNotif("Vehículo añadido ✓");
  };

  const saveRepair = async () => {
    if (!newRepair.vehicleId || !newRepair.description) { showNotif("Vehículo y descripción obligatorios", "error"); return; }
    const rec = { id: "r" + Date.now(), vehicle_id: newRepair.vehicleId, date: newRepair.date, description: newRepair.description, workshop: newRepair.workshop, cost: parseFloat(newRepair.cost) || 0, km: parseInt(newRepair.km) || 0, status: newRepair.status };
    const { error } = await supabase.from("repairs").insert(rec);
    if (error) { showNotif("Error al guardar", "error"); return; }
    setRepairs(p => [{ ...rec, vehicleId: rec.vehicle_id }, ...p]);
    setAddRepairModal(false); setNewRepair({ vehicleId: "", date: "", description: "", workshop: "", cost: "", km: "", status: "Pendiente" });
    showNotif("Reparación guardada ✓");
  };

  const saveDoc = async () => {
    if (!newDoc.vehicleId || !newDoc.name) { showNotif("Vehículo y nombre obligatorios", "error"); return; }
    const rec = { id: "d" + Date.now(), vehicle_id: newDoc.vehicleId, name: newDoc.name, type: newDoc.type, expiry: newDoc.expiry || null, size: "—" };
    const { error } = await supabase.from("docs").insert(rec);
    if (error) { showNotif("Error al guardar", "error"); return; }
    setDocs(p => [...p, { ...rec, vehicleId: rec.vehicle_id }]);
    setAddDocModal(false); setNewDoc({ vehicleId: "", name: "", type: "Seguro", expiry: "" });
    showNotif("Documento guardado ✓");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === "expense") { await supabase.from("expenses").delete().eq("id", id); setExpenses(p => p.filter(x => x.id !== id)); }
    if (type === "repair")  { await supabase.from("repairs").delete().eq("id", id);  setRepairs(p => p.filter(x => x.id !== id)); }
    if (type === "doc")     { await supabase.from("docs").delete().eq("id", id);     setDocs(p => p.filter(x => x.id !== id)); }
    if (type === "vehicle") { await supabase.from("vehicles").delete().eq("id", id); setVehicles(p => p.filter(x => x.id !== id)); setExpenses(p => p.filter(x => x.vehicleId !== id)); setRepairs(p => p.filter(x => x.vehicleId !== id)); setDocs(p => p.filter(x => x.vehicleId !== id)); }
    setDeleteConfirm(null); showNotif("Eliminado ✓");
  };

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const expensesByCategory = CATEGORIES.map(cat => ({ cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);
  const pendingRepairs = repairs.filter(r => r.status === "Pendiente");
  const expiringDocs = docs.filter(d => { if (!d.expiry) return false; return (new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24) < 60; });

  if (!ready) return (
    <div style={{ background: "#0F1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🚐</div>
      <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 18, color: "#FBBF24", letterSpacing: 2 }}>CARGANDO FLOTA...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0F1117", minHeight: "100vh", color: "#E5E7EB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Barlow+Condensed:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#1A1D27}::-webkit-scrollbar-thumb{background:#374151;border-radius:2px}
        .tab-btn{background:none;border:none;cursor:pointer;padding:10px 16px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
        .tab-btn:hover{color:#E5E7EB}.tab-btn.active{color:#FBBF24;border-bottom-color:#FBBF24}
        .card{background:#1A1D27;border:1px solid #252836;border-radius:6px}
        .btn-primary{background:#FBBF24;color:#0F1117;border:none;border-radius:4px;padding:8px 16px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:background .15s}
        .btn-primary:hover{background:#F59E0B}
        .btn-ghost{background:none;color:#9CA3AF;border:1px solid #374151;border-radius:4px;padding:7px 14px;font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .15s}
        .btn-ghost:hover{color:#E5E7EB;border-color:#6B7280}
        .btn-danger{background:none;color:#EF4444;border:1px solid #EF444444;border-radius:4px;padding:5px 10px;font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:11px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .15s}
        .btn-danger:hover{background:#EF444422}
        .input{background:#252836;border:1px solid #374151;border-radius:4px;padding:8px 12px;color:#E5E7EB;font-family:'DM Mono',monospace;font-size:13px;width:100%;outline:none;transition:border .15s}
        .input:focus{border-color:#FBBF24}
        .select{background:#252836;border:1px solid #374151;border-radius:4px;padding:8px 12px;color:#E5E7EB;font-family:'Barlow Condensed',sans-serif;font-size:14px;width:100%;outline:none;cursor:pointer}
        .label{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6B7280;margin-bottom:5px;display:block}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
        .modal{background:#1A1D27;border:1px solid #374151;border-radius:8px;padding:24px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
        .badge{display:inline-block;padding:2px 8px;border-radius:3px;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
        .row{display:grid;gap:12px}.row-2{grid-template-columns:1fr 1fr}
        .notif{position:fixed;top:20px;right:20px;z-index:200;padding:12px 20px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;letter-spacing:.5px;animation:slideIn .2s ease}
        @keyframes slideIn{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
        .veh-card{cursor:pointer;transition:all .15s;border-left:3px solid transparent}
        .veh-card:hover{background:#1E2130}.veh-card.selected{background:#1E2130}
        .scan-drop{border:2px dashed #374151;border-radius:6px;padding:32px;text-align:center;cursor:pointer;transition:all .15s}
        .scan-drop:hover{border-color:#FBBF24;background:rgba(251,191,36,.05)}
        .stat-num{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;line-height:1}
        .section-title{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B7280;padding-bottom:8px;border-bottom:1px solid #252836;margin-bottom:12px}
        .expense-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid #252836;transition:background .1s}
        .expense-row:hover{background:#1E2130}
        .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
      `}</style>

      {/* Header */}
      <div style={{ background: "#13151F", borderBottom: "1px solid #252836", padding: "0 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "#FBBF24", borderRadius: 4, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚐</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: 1, color: "#F9FAFB" }}>FLEET</div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 9, color: "#6B7280", letterSpacing: 2, marginTop: -2 }}>GESTOR DE FLOTA · ☁️ SINCRONIZADO</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn-primary" onClick={() => setScanModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>📷</span> Escanear Factura
              </button>
              <button className="btn-ghost" onClick={() => { sessionStorage.removeItem("fleet_auth"); setAuthed(false); }} title="Cerrar sesión">🔒</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2, marginTop: 6, overflowX: "auto" }}>
            {[["dashboard","📊 Panel"],["vehicles","🚐 Vehículos"],["expenses","💳 Gastos"],["repairs","🔧 Reparaciones"],["docs","📁 Documentos"]].map(([id, label]) => (
              <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
              {[
                { label: "Gasto Total", value: `${totalAll.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, icon: "💶", color: "#FBBF24" },
                { label: "Vehículos", value: vehicles.length, icon: "🚐", color: "#3B82F6" },
                { label: "Rep. Pendientes", value: pendingRepairs.length, icon: "🔧", color: pendingRepairs.length > 0 ? "#EF4444" : "#10B981" },
                { label: "Docs por Vencer", value: expiringDocs.length, icon: "⚠️", color: expiringDocs.length > 0 ? "#F59E0B" : "#10B981" },
              ].map((k, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
                  <div className="stat-num" style={{ color: k.color }}>{k.value}</div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#6B7280", marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card" style={{ padding: 16 }}>
                <div className="section-title">Gasto por Vehículo</div>
                {vehicles.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>Sin vehículos. Añade el primero.</div> :
                  vehicles.map(v => {
                    const total = totalByVehicle(v.id);
                    const pct = totalAll > 0 ? (total / totalAll) * 100 : 0;
                    return (
                      <div key={v.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 13 }}>{v.plate} <span style={{ color: "#6B7280", fontWeight: 400 }}>{v.model}</span></span>
                          <span style={{ color: "#FBBF24", fontWeight: 700 }}>{total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                        </div>
                        <div style={{ background: "#252836", borderRadius: 2, height: 4 }}>
                          <div style={{ width: `${pct}%`, background: v.color, height: "100%", borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div className="section-title">Gasto por Categoría</div>
                {expensesByCategory.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>Sin gastos aún.</div> :
                  expensesByCategory.map(({ cat, total }) => (
                    <div key={cat} className="expense-row">
                      <div className="dot" style={{ background: categoryColor[cat] }} />
                      <span style={{ flex: 1, fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: 14 }}>{cat}</span>
                      <span style={{ color: "#FBBF24" }}>{total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                    </div>
                  ))}
              </div>
            </div>
            {(pendingRepairs.length > 0 || expiringDocs.length > 0) && (
              <div className="card" style={{ padding: 16, borderColor: "#F59E0B44" }}>
                <div className="section-title" style={{ color: "#F59E0B" }}>⚠️ Alertas</div>
                {pendingRepairs.map(r => (
                  <div key={r.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #252836", alignItems: "center" }}>
                    <span>🔧</span>
                    <span style={{ flex: 1 }}><span style={{ color: "#FBBF24", fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{getVehicle(r.vehicleId)?.plate}</span> — {r.description}</span>
                    <span className="badge" style={{ background: "#EF444422", color: "#EF4444" }}>Pendiente</span>
                  </div>
                ))}
                {expiringDocs.map(d => {
                  const days = Math.ceil((new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={d.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #252836", alignItems: "center" }}>
                      <span>📄</span>
                      <span style={{ flex: 1 }}><span style={{ color: "#FBBF24", fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>{getVehicle(d.vehicleId)?.plate}</span> — {d.name}</span>
                      <span className="badge" style={{ background: "#F59E0B22", color: "#F59E0B" }}>Vence en {days}d</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div className="section-title" style={{ marginBottom: 0, border: "none" }}>Últimos Gastos</div>
                <button className="btn-ghost" onClick={() => setTab("expenses")}>Ver todos →</button>
              </div>
              {expenses.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>Sin gastos. Escanea tu primera factura.</div> :
                expenses.slice(0, 5).map(exp => (
                  <div key={exp.id} className="expense-row">
                    <div className="dot" style={{ background: categoryColor[exp.category] }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: 14 }}>{exp.description || exp.category}</div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>{getVehicle(exp.vehicleId)?.plate} · {exp.supplier} · {exp.date}</div>
                    </div>
                    <div style={{ color: "#FBBF24", fontWeight: 700 }}>{exp.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === "vehicles" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 24, letterSpacing: 1 }}>Vehículos</h2>
              <button className="btn-primary" onClick={() => setAddVehicleModal(true)}>+ Añadir Vehículo</button>
            </div>
            {vehicles.length === 0 && <div style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>Sin vehículos. Añade el primero.</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {vehicles.map(v => {
                const vRepairs = repairs.filter(r => r.vehicleId === v.id);
                const vDocs = docs.filter(d => d.vehicleId === v.id);
                return (
                  <div key={v.id} className={`card veh-card ${selectedVehicle === v.id ? "selected" : ""}`} style={{ padding: 16, borderLeftColor: v.color, borderLeftWidth: 4 }} onClick={() => setSelectedVehicle(selectedVehicle === v.id ? null : v.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 22 }}>{v.plate}</div>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: 15, color: "#9CA3AF" }}>{v.model} · {v.year}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 32 }}>🚐</span>
                        <button className="btn-danger" onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: "vehicle", id: v.id, label: v.plate }); }}>Eliminar</button>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid #252836", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                      {[{ label: "Gastos", value: totalByVehicle(v.id).toLocaleString("es-ES", { minimumFractionDigits: 0 }) + " €" }, { label: "Km", value: (v.km || 0).toLocaleString("es-ES") }, { label: "Docs", value: vDocs.length }].map((s, i) => (
                        <div key={i}>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 18, color: v.color }}>{s.value}</div>
                          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#6B7280" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {selectedVehicle === v.id && vRepairs.length > 0 && (
                      <div style={{ marginTop: 12, borderTop: "1px solid #374151", paddingTop: 12 }}>
                        <div className="section-title">Últimas reparaciones</div>
                        {vRepairs.slice(0, 3).map(r => (
                          <div key={r.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid #252836", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#D1D5DB" }}>{r.description}</span>
                            <span className="badge" style={{ background: r.status === "Pendiente" ? "#EF444422" : "#10B98122", color: r.status === "Pendiente" ? "#EF4444" : "#10B981" }}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "expenses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 24, letterSpacing: 1 }}>Gastos</h2>
              <button className="btn-primary" onClick={() => setScanModal(true)}>📷 Escanear Factura</button>
            </div>
            {expenses.length === 0 && <div style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>Sin gastos. Escanea tu primera factura.</div>}
            {vehicles.map(v => {
              const vExp = expenses.filter(e => e.vehicleId === v.id);
              if (vExp.length === 0) return null;
              return (
                <div key={v.id} className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
                  <div style={{ background: "#13151F", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${v.color}` }}>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 16 }}>
                      <span style={{ color: v.color }}>{v.plate}</span> <span style={{ color: "#9CA3AF" }}>— {v.model}</span>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 18, color: "#FBBF24" }}>{totalByVehicle(v.id).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>
                  </div>
                  {vExp.map(exp => (
                    <div key={exp.id} className="expense-row" style={{ padding: "10px 16px" }}>
                      <div className="dot" style={{ background: categoryColor[exp.category] }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: 14 }}>{exp.description || exp.category}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{exp.supplier} · {exp.date}</div>
                      </div>
                      <span className="badge" style={{ background: `${categoryColor[exp.category]}22`, color: categoryColor[exp.category], marginRight: 10 }}>{exp.category}</span>
                      <div style={{ color: "#FBBF24", fontWeight: 700, minWidth: 80, textAlign: "right", marginRight: 8 }}>{exp.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>
                      <button className="btn-danger" onClick={() => setDeleteConfirm({ type: "expense", id: exp.id, label: exp.description || exp.category })}>✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {tab === "repairs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 24, letterSpacing: 1 }}>Historial de Reparaciones</h2>
              <button className="btn-primary" onClick={() => setAddRepairModal(true)}>+ Nueva Reparación</button>
            </div>
            {repairs.length === 0 && <div style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>Sin reparaciones registradas.</div>}
            <div style={{ display: "grid", gap: 10 }}>
              {repairs.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => {
                const v = getVehicle(r.vehicleId);
                return (
                  <div key={r.id} className="card" style={{ padding: 16, borderLeft: `4px solid ${r.status === "Pendiente" ? "#EF4444" : "#10B981"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 16, color: v?.color }}>{v?.plate}</span>
                          <span style={{ color: "#9CA3AF", fontSize: 13 }}>{v?.model}</span>
                          <span className="badge" style={{ background: r.status === "Pendiente" ? "#EF444422" : "#10B98122", color: r.status === "Pendiente" ? "#EF4444" : "#10B981" }}>{r.status}</span>
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{r.description}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>🔧 {r.workshop} · 📅 {r.date} {r.km > 0 && `· 🛣 ${r.km.toLocaleString("es-ES")} km`}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {r.cost > 0 && <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 22, color: "#FBBF24" }}>{r.cost.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</div>}
                        <button className="btn-danger" onClick={() => setDeleteConfirm({ type: "repair", id: r.id, label: r.description })}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "docs" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 24, letterSpacing: 1 }}>Biblioteca de Documentos</h2>
              <button className="btn-primary" onClick={() => setAddDocModal(true)}>+ Añadir Documento</button>
            </div>
            {vehicles.map(v => {
              const vDocs = docs.filter(d => d.vehicleId === v.id);
              return (
                <div key={v.id} className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
                  <div style={{ background: "#13151F", padding: "12px 16px", borderLeft: `4px solid ${v.color}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 16, color: v.color }}>{v.plate}</span>
                    <span style={{ color: "#9CA3AF" }}>— {v.model}</span>
                    <span className="badge" style={{ background: "#374151", color: "#9CA3AF", marginLeft: "auto" }}>{vDocs.length} docs</span>
                  </div>
                  {vDocs.length === 0 ? <div style={{ padding: "20px 16px", color: "#6B7280", fontSize: 13 }}>Sin documentos.</div> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
                      {vDocs.map(d => {
                        const isExpiring = d.expiry && (new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24) < 60;
                        const icons = { Seguro: "🛡️", Documento: "📄", Manual: "📚", Factura: "🧾", Contrato: "📝", Otro: "📁" };
                        return (
                          <div key={d.id} style={{ padding: "14px 16px", borderRight: "1px solid #252836", borderBottom: "1px solid #252836" }}>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>{icons[d.type] || "📁"}</div>
                            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{d.name}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span className="badge" style={{ background: "#374151", color: "#9CA3AF", fontSize: 10 }}>{d.type}</span>
                              {d.expiry && <span style={{ fontSize: 10, color: isExpiring ? "#F59E0B" : "#6B7280" }}>{isExpiring ? "⚠️ " : ""}{d.expiry}</span>}
                            </div>
                            <button className="btn-danger" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setDeleteConfirm({ type: "doc", id: d.id, label: d.name })}>Eliminar</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {scanModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setScanModal(false)}>
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>📷 Escanear Factura con IA</div>
            <div className="scan-drop" onClick={() => fileRef.current.click()} style={{ marginBottom: 16 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
              {scanning ? <div><div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div><div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: "#FBBF24" }}>Analizando con IA...</div></div>
              : scannedData ? <div><div style={{ fontSize: 32, marginBottom: 6 }}>✅</div><div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: "#10B981", marginBottom: 4 }}>Datos extraídos</div><span className="badge" style={{ background: "#374151", color: "#9CA3AF" }}>Confianza: {scannedData.confidence}</span></div>
              : <div><div style={{ fontSize: 40, marginBottom: 8 }}>📷</div><div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 16, color: "#9CA3AF" }}>Toca para subir foto de factura</div><div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>La IA extraerá los datos automáticamente</div></div>}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div><label className="label">Vehículo *</label>
                <select className="select" value={expenseForm.vehicleId} onChange={e => setExpenseForm(p => ({ ...p, vehicleId: e.target.value }))}>
                  <option value="">Seleccionar vehículo...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
                </select>
              </div>
              <div className="row row-2">
                <div><label className="label">Categoría</label>
                  <select className="select" value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Importe (€) *</label><input className="input" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" /></div>
              </div>
              <div className="row row-2">
                <div><label className="label">Proveedor</label><input className="input" value={expenseForm.supplier} onChange={e => setExpenseForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Nombre empresa" /></div>
                <div><label className="label">Fecha</label><input className="input" type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div><label className="label">Descripción</label><input className="input" value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalle del gasto" /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => { setScanModal(false); setScannedData(null); setExpenseForm({ vehicleId: "", date: "", category: "", amount: "", description: "", supplier: "" }); }}>Cancelar</button>
              <button className="btn-primary" onClick={saveExpense}>Guardar Gasto</button>
            </div>
          </div>
        </div>
      )}

      {addVehicleModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddVehicleModal(false)}>
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>🚐 Nuevo Vehículo</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div className="row row-2">
                <div><label className="label">Matrícula *</label><input className="input" value={newVehicle.plate} onChange={e => setNewVehicle(p => ({ ...p, plate: e.target.value }))} placeholder="1234 ABC" /></div>
                <div><label className="label">Año</label><input className="input" type="number" value={newVehicle.year} onChange={e => setNewVehicle(p => ({ ...p, year: e.target.value }))} placeholder="2022" /></div>
              </div>
              <div><label className="label">Modelo *</label><input className="input" value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))} placeholder="Mercedes Sprinter 316" /></div>
              <div className="row row-2">
                <div><label className="label">Kilómetros</label><input className="input" type="number" value={newVehicle.km} onChange={e => setNewVehicle(p => ({ ...p, km: e.target.value }))} placeholder="0" /></div>
                <div><label className="label">Color etiqueta</label><input className="input" type="color" value={newVehicle.color} onChange={e => setNewVehicle(p => ({ ...p, color: e.target.value }))} style={{ padding: "4px 8px", height: 38 }} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setAddVehicleModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveVehicle}>Añadir Vehículo</button>
            </div>
          </div>
        </div>
      )}

      {addRepairModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddRepairModal(false)}>
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>🔧 Nueva Reparación</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div><label className="label">Vehículo *</label>
                <select className="select" value={newRepair.vehicleId} onChange={e => setNewRepair(p => ({ ...p, vehicleId: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
                </select>
              </div>
              <div><label className="label">Descripción *</label><input className="input" value={newRepair.description} onChange={e => setNewRepair(p => ({ ...p, description: e.target.value }))} placeholder="Ej: Cambio correa distribución" /></div>
              <div className="row row-2">
                <div><label className="label">Taller</label><input className="input" value={newRepair.workshop} onChange={e => setNewRepair(p => ({ ...p, workshop: e.target.value }))} placeholder="Nombre del taller" /></div>
                <div><label className="label">Coste (€)</label><input className="input" type="number" value={newRepair.cost} onChange={e => setNewRepair(p => ({ ...p, cost: e.target.value }))} placeholder="0.00" /></div>
              </div>
              <div className="row row-2">
                <div><label className="label">Fecha</label><input className="input" type="date" value={newRepair.date} onChange={e => setNewRepair(p => ({ ...p, date: e.target.value }))} /></div>
                <div><label className="label">Kilómetros</label><input className="input" type="number" value={newRepair.km} onChange={e => setNewRepair(p => ({ ...p, km: e.target.value }))} placeholder="0" /></div>
              </div>
              <div><label className="label">Estado</label>
                <select className="select" value={newRepair.status} onChange={e => setNewRepair(p => ({ ...p, status: e.target.value }))}>
                  <option>Pendiente</option><option>En proceso</option><option>Completada</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setAddRepairModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveRepair}>Guardar Reparación</button>
            </div>
          </div>
        </div>
      )}

      {addDocModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddDocModal(false)}>
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 22, marginBottom: 20 }}>📁 Nuevo Documento</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div><label className="label">Vehículo *</label>
                <select className="select" value={newDoc.vehicleId} onChange={e => setNewDoc(p => ({ ...p, vehicleId: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
                </select>
              </div>
              <div><label className="label">Nombre del documento *</label><input className="input" value={newDoc.name} onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Póliza Seguro 2025" /></div>
              <div className="row row-2">
                <div><label className="label">Tipo</label>
                  <select className="select" value={newDoc.type} onChange={e => setNewDoc(p => ({ ...p, type: e.target.value }))}>
                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Fecha vencimiento</label><input className="input" type="date" value={newDoc.expiry} onChange={e => setNewDoc(p => ({ ...p, expiry: e.target.value }))} /></div>
              </div>
              <div className="scan-drop" onClick={() => docFileRef.current.click()} style={{ padding: 16 }}>
                <input ref={docFileRef} type="file" style={{ display: "none" }} />
                <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: "#9CA3AF" }}>Subir archivo (PDF, imagen...)</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setAddDocModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveDoc}>Guardar Documento</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>¿Eliminar?</div>
            <div style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 20 }}>"{deleteConfirm.label}"<br />Esta acción no se puede deshacer.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-primary" style={{ background: "#EF4444" }} onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="notif" style={{ background: notification.type === "error" ? "#EF4444" : "#10B981", color: "#fff" }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
