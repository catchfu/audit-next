import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { getBaseUrl } from "./api";
import { getToken, setToken, clearToken, isAdmin, isAuthed } from "./auth";

function Nav() {
  const nav = useNavigate();
  const t = getToken();
  const admin = isAdmin();
  function logout() { clearToken(); nav("/login"); }
  return (
    <div className="nav">
      <div className="brand">Audit Next</div>
      <div className="navlinks">
        <Link to="/">Home</Link>
        <Link to="/validate">Validation</Link>
        <Link to="/lei">LEI & Graph</Link>
        <Link to="/sanctions">Sanctions & Risk</Link>
        <Link to="/evidence">Evidence</Link>
        {t && <Link to="/users">Users</Link>}
        {admin && <Link to="/admin">Admin</Link>}
        {!t ? <Link to="/login">Login</Link> : <a href="#" onClick={logout}>Logout</a>}
      </div>
    </div>
  );
}

function Home() {
  const base = getBaseUrl();
  const [health, setHealth] = useState<any>(null);
  useEffect(() => { fetch(`${base}/health`).then((r) => r.json()).then(setHealth).catch(() => setHealth(null)); }, [base]);
  return (
    <div className="container">
      <div className="hero">
        <div className="card">
          <div className="title">Assurance-grade audit automation</div>
          <div className="subtitle">Aggregate authoritative data, validate ESEF/iXBRL, enrich entities and build tamper-evident evidence.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link to="/validate" className="btn">Validate ESEF</Link>
            <Link to="/lei" className="btn">Explore Entities</Link>
            <Link to="/sanctions" className="btn">Screen Risk</Link>
          </div>
        </div>
        <div className="card">
          <div>Health</div>
          <div className="muted" style={{ marginTop: 6 }}>{health?.ok ? "OK" : "Unavailable"}</div>
        </div>
      </div>
      <div className="cards">
        <div className="card">Inline XBRL and ESEF taxonomy checks</div>
        <div className="card">GLEIF relationships and identifier graph</div>
        <div className="card">Sanctions screening and simplified risk scoring</div>
      </div>
    </div>
  );
}

function ValidationPage() {
  const base = getBaseUrl();
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [validate, setValidate] = useState<any>(null);
  function doValidate() {
    const body: any = {};
    if (url) body.url = url;
    if (content) body.content = content;
    fetch(`${base}/esef/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json()).then(setValidate);
  }
  return (
    <div className="container">
      <div className="grid2">
        <div className="card">
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Report URL" />
          <textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Inline XHTML or XBRL content" style={{ marginTop: 8 }} />
          <button className="btn" onClick={doValidate} style={{ marginTop: 8 }}>Validate</button>
        </div>
        <div className="card mono">{validate ? JSON.stringify(validate, null, 2) : null}</div>
      </div>
    </div>
  );
}

function LeiGraphPage() {
  const base = getBaseUrl();
  const [leiQuery, setLeiQuery] = useState("Allianz");
  const [leiResults, setLeiResults] = useState<any[]>([]);
  const [graph, setGraph] = useState<any | null>(null);
  const graphSummary = useMemo(() => {
    if (!graph) return null;
    const nodes = graph.nodes || [];
    const edges = graph.edges || [];
    return { nodesCount: nodes.length, edgesCount: edges.length };
  }, [graph]);
  function doLeiSearch() {
    fetch(`${base}/lei/search?q=${encodeURIComponent(leiQuery)}`).then((r) => r.json()).then((d) => setLeiResults(d?.data || []));
  }
  function enrichByLei(lei: string) {
    fetch(`${base}/entity/graph/enrich`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lei }) })
      .then((r) => r.json()).then(setGraph);
  }
  return (
    <div className="container">
      <div className="grid2">
        <div className="card">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={leiQuery} onChange={(e) => setLeiQuery(e.target.value)} placeholder="Search LEI by name" />
            <button className="btn" onClick={doLeiSearch}>Search</button>
          </div>
          <div className="list" style={{ marginTop: 8, maxHeight: 220, overflow: "auto" }}>
            {leiResults.map((r) => (
              <div key={r.id} className="list-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{r.attributes?.entity?.legalName?.name || r.id}</div>
                  <div className="muted">{r.id}</div>
                </div>
                <button className="btn" onClick={() => enrichByLei(r.id)}>Enrich</button>
              </div>
            ))}
          </div>
        </div>
        <div className="card mono">
          {graph && (
            <div>
              <div>Nodes {graphSummary?.nodesCount} • Edges {graphSummary?.edgesCount}</div>
              <div style={{ marginTop: 8 }}>{JSON.stringify(graph, null, 2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SanctionsRiskPage() {
  const base = getBaseUrl();
  const [sanctionName, setSanctionName] = useState("John Doe");
  const [sanctionCountry, setSanctionCountry] = useState("");
  const [sanctionRes, setSanctionRes] = useState<any | null>(null);
  const [riskName, setRiskName] = useState("");
  const [riskCompanyNumber, setRiskCompanyNumber] = useState("");
  const [riskRes, setRiskRes] = useState<any | null>(null);
  function doSanctions() {
    const params = new URLSearchParams();
    if (sanctionName) params.set("name", sanctionName);
    if (sanctionCountry) params.set("country", sanctionCountry);
    fetch(`${base}/sanctions/match?${params.toString()}`).then((r) => r.json()).then(setSanctionRes);
  }
  function doRisk() {
    const body: any = {};
    if (riskName) body.name = riskName;
    if (riskCompanyNumber) body.companyNumber = riskCompanyNumber;
    fetch(`${base}/risk/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json()).then(setRiskRes);
  }
  return (
    <div className="container">
      <div className="grid2">
        <div className="card">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={sanctionName} onChange={(e) => setSanctionName(e.target.value)} placeholder="Name" />
            <input className="input" value={sanctionCountry} onChange={(e) => setSanctionCountry(e.target.value)} placeholder="Country" />
            <button className="btn" onClick={doSanctions}>Screen</button>
          </div>
          <div className="mono" style={{ marginTop: 8 }}>{sanctionRes ? JSON.stringify(sanctionRes, null, 2) : null}</div>
        </div>
        <div className="card">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={riskName} onChange={(e) => setRiskName(e.target.value)} placeholder="Risk name" />
            <input className="input" value={riskCompanyNumber} onChange={(e) => setRiskCompanyNumber(e.target.value)} placeholder="Company number" />
            <button className="btn" onClick={doRisk}>Score</button>
          </div>
          <div className="mono" style={{ marginTop: 8 }}>{riskRes ? JSON.stringify(riskRes, null, 2) : null}</div>
        </div>
      </div>
    </div>
  );
}

function EvidencePage() {
  const base = getBaseUrl();
  const [evidence, setEvidence] = useState<any[]>([]);
  function loadEvidence() { fetch(`${base}/evidence`).then((r) => r.json()).then((d) => setEvidence(d?.chain || [])); }
  return (
    <div className="container">
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button className="btn" onClick={loadEvidence}>Load Evidence</button>
      </div>
      <div className="list">
        {evidence.map((e) => (
          <div key={e.id} className="list-item">
            <div className="muted" style={{ width: 240 }}>{new Date(e.timestamp).toISOString()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{e.type}</div>
              <div className="mono">{JSON.stringify(e.payload)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersPage() {
  const base = getBaseUrl();
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("changeme");
  const [error, setError] = useState("");
  const admin = isAdmin();
  function maskEmail(s: string) {
    if (!s) return "";
    const parts = s.split("@");
    if (parts.length !== 2) return s;
    const [local, domain] = parts;
    const ml = local.length;
    const maskedLocal = ml <= 1 ? "*" : local[0] + "*".repeat(ml - 1);
    const dParts = domain.split(".");
    const d0 = dParts[0] || "";
    const md0 = d0.length <= 1 ? "*" : d0[0] + "*".repeat(d0.length - 1);
    const dRest = dParts.slice(1).join(".");
    return `${maskedLocal}@${md0}${dRest ? "." + dRest : ""}`;
  }
  function load() {
    setError("");
    fetch(`${base}/users`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then((d) => setItems(d.users || []))
      .catch((e) => setError(String(e.message || e)));
  }
  function add() {
    if (!name || !email) return;
    setError("");
    fetch(`${base}/users`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ name, email, password }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then(() => { setName(""); setEmail(""); load(); })
      .catch((e) => setError(String(e.message || e)));
  }
  function remove(id: string) {
    setError("");
    fetch(`${base}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then(() => load())
      .catch((e) => setError(String(e.message || e)));
  }
  return (
    <div className="container">
      <div className="card">
        {!admin && <div className="muted" style={{ marginBottom: 8 }}>Admin-only actions are disabled.</div>}
        <div className="grid2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        </div>
        <div className="grid2" style={{ marginTop: 8 }}>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button className="btn" onClick={load}>Load Users</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={add} disabled={!admin} title={!admin ? "Admin only" : undefined}>Add User</button>
        </div>
        {error && <div className="muted" style={{ marginTop: 8 }}>{error}</div>}
      </div>
      <div className="list" style={{ marginTop: 12 }}>
        {items.map((u) => (
          <div key={u.id} className="list-item">
            <div>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div className="muted">{admin ? u.email : maskEmail(u.email)}</div>
            </div>
            <button className="btn" onClick={() => remove(u.id)} disabled={!admin} title={!admin ? "Admin only" : undefined}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPage() {
  const base = getBaseUrl();
  const [apiBase, setApiBase] = useState(localStorage.getItem("api_base_url") || "http://localhost:3000");
  const [tokens, setTokens] = useState({ ch: localStorage.getItem("key_ch") || "", os: localStorage.getItem("key_os") || "", oc: localStorage.getItem("key_oc") || "" });
  const [status, setStatus] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteTokenOut, setInviteTokenOut] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  useEffect(() => { fetch(`${base}/admin/config/status`).then((r) => r.json()).then(setStatus).catch(() => setStatus(null)); }, [base]);
  function save() {
    localStorage.setItem("api_base_url", apiBase);
    localStorage.setItem("key_ch", tokens.ch);
    localStorage.setItem("key_os", tokens.os);
    localStorage.setItem("key_oc", tokens.oc);
    alert("Saved");
  }
  function createInviteCmd() {
    fetch(`${base}/auth/invite`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) })
      .then((r) => r.json()).then((d) => setInviteTokenOut(d?.token || ""));
  }
  function requestResetCmd() {
    fetch(`${base}/auth/reset/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resetEmail }) })
      .then((r) => r.json()).then((d) => alert(`Reset token: ${d?.token || ""}`));
  }
  return (
    <div className="container">
      <div className="grid2">
        <div className="card">
          <div className="muted">API Base URL</div>
          <input className="input" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
          <div className="muted" style={{ marginTop: 12 }}>External tokens</div>
          <input className="input" value={tokens.ch} onChange={(e) => setTokens({ ...tokens, ch: e.target.value })} placeholder="Companies House API key" style={{ marginTop: 6 }} />
          <input className="input" value={tokens.os} onChange={(e) => setTokens({ ...tokens, os: e.target.value })} placeholder="OpenSanctions API key" style={{ marginTop: 6 }} />
          <input className="input" value={tokens.oc} onChange={(e) => setTokens({ ...tokens, oc: e.target.value })} placeholder="OpenCorporates API token" style={{ marginTop: 6 }} />
          <button className="btn" onClick={save} style={{ marginTop: 12 }}>Save</button>
          <div className="muted" style={{ marginTop: 12 }}>Invites</div>
          <input className="input" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite email" style={{ marginTop: 6 }} />
          <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ marginTop: 6 }}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button className="btn" onClick={createInviteCmd} style={{ marginTop: 8 }}>Create Invite</button>
          {inviteTokenOut && <div className="mono" style={{ marginTop: 6 }}>{inviteTokenOut}</div>}
          <div className="muted" style={{ marginTop: 12 }}>Password Reset</div>
          <input className="input" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email to reset" style={{ marginTop: 6 }} />
          <button className="btn" onClick={requestResetCmd} style={{ marginTop: 8 }}>Request Reset</button>
        </div>
        <div className="card">
          <div>Settings are stored in the browser and used by the UI.</div>
          <div className="muted" style={{ marginTop: 6 }}>Configure base URL and tokens to align with backend environment.</div>
          {status && (
            <div style={{ marginTop: 12 }}>
              <div className="muted">Server</div>
              <div className="mono" style={{ marginTop: 6 }}>{JSON.stringify(status, null, 2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      {isAuthed() && !isAdmin() && (
        <div className="banner banner-assurance">
          <div className="banner-title">Assurance Mode</div>
          <div className="banner-subtitle">Read-only access • Admin-only actions are disabled</div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/validate" element={<ValidationPage />} />
        <Route path="/lei" element={<LeiGraphPage />} />
        <Route path="/sanctions" element={<SanctionsRiskPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/users" element={isAuthed() ? <UsersPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={isAdmin() ? <AdminPage /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
function LoginPage() {
  const base = getBaseUrl();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  function login() {
    setError("");
    fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then((d) => { setToken(d.token); nav("/"); })
      .catch((e) => setError(String(e.message || e)));
  }
  function register() {
    setError("");
    fetch(`${base}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: email, email, password }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then((d) => { setToken(d.token); nav("/"); })
      .catch((e) => setError(String(e.message || e)));
  }
  function acceptInvite() {
    setError("");
    fetch(`${base}/auth/invite/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: inviteToken, name: inviteName, password }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then((d) => { setToken(d.token); nav("/"); })
      .catch((e) => setError(String(e.message || e)));
  }
  function confirmReset() {
    setError("");
    fetch(`${base}/auth/reset/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: resetToken, password: resetPassword }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || "error"); return d; })
      .then(() => { setResetToken(""); setResetPassword(""); alert("Password updated"); })
      .catch((e) => setError(String(e.message || e)));
  }
  return (
    <div className="container">
      <div className="card">
        <div className="muted">Email</div>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="muted" style={{ marginTop: 8 }}>Password</div>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={login}>Login</button>
          <button className="btn" onClick={register}>Register</button>
        </div>
        {error && <div className="muted" style={{ marginTop: 8 }}>{error}</div>}
      </div>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="muted">Accept Invite</div>
          <input className="input" value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} placeholder="Invite token" style={{ marginTop: 6 }} />
          <input className="input" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Your name" style={{ marginTop: 6 }} />
          <button className="btn" onClick={acceptInvite} style={{ marginTop: 8 }}>Accept</button>
        </div>
        <div className="card">
          <div className="muted">Reset Password</div>
          <input className="input" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Reset token" style={{ marginTop: 6 }} />
          <input className="input" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password" style={{ marginTop: 6 }} />
          <button className="btn" onClick={confirmReset} style={{ marginTop: 8 }}>Update</button>
        </div>
      </div>
    </div>
  );
}