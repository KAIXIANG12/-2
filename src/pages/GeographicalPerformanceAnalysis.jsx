// src/pages/GeographicalPerformanceAnalysis.jsx
import React, { useMemo, useRef, useState } from "react";
import Plot from "react-plotly.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* -------------------------- 初始 MOCK 数据 -------------------------- */
const COUNTRIES = ["USA", "Canada", "UK", "Germany", "France", "Japan", "Italy", "Spain", "Netherlands", "China"];
const COMPETITORS = ["Our Company", "Competitor 1", "Competitor 2", "Competitor 3", "Competitor 4"];

const METRICS = [
    { key: "market_share", label: "Market Share (%)", type: "share" },
    { key: "revenue", label: "Revenue (M$)", type: "value" },
    { key: "workforce", label: "Workforce (#)", type: "value" },
    { key: "plants", label: "Production Plants (#)", type: "plants" },
    { key: "capacity", label: "Total Capacity (kt)", type: "capacity" },
];

const iso3 = {
    USA: "USA", Canada: "CAN", UK: "GBR", Germany: "DEU", France: "FRA",
    Japan: "JPN", Italy: "ITA", Spain: "ESP", Netherlands: "NLD", China: "CHN"
};

function seed(c, i) {
    const base = 10 + i * 5;
    return {
        market_share: +(Math.max(1, (base % 30)) + (c.length % 7)).toFixed(1),
        revenue: base * 40 + (c.length % 5) * 30,
        workforce: base * 120 + (c.length % 5) * 50,
        plants: (i % 7) + 1,
        capacity: (i % 5 + 1) * 100,
    };
}
function buildInitialRows() {
    const rows = [];
    COUNTRIES.forEach((country, idx) => {
        COMPETITORS.forEach((comp, j) => {
            const s = seed(country, idx + j + (comp === "Our Company" ? 3 : 0));
            rows.push({
                country,
                competitor: comp,
                year: 2024,
                value: { revenue: s.revenue, workforce: s.workforce, capacity: s.capacity, plants: s.plants },
                share: s.market_share,
            });
        });
    });
    return rows;
}

/* ------------------------------ 小工具 ------------------------------ */

// 我方已进入的市场集合（用于 Company-Centric 过滤）
function ourMarketSet(DATA, metricKey) {
    const set = new Set();
    DATA.forEach(r => {
        if (r.competitor !== "Our Company") return;
        const has = metricKey === "market_share"
            ? Number.isFinite(r.share) && r.share > 0
            : Number.isFinite(r.value?.[metricKey]) && r.value[metricKey] > 0;
        if (has) set.add(r.country);
    });
    return set;
}

function getRows(DATA, metricKey, viewMode, selectedCompetitors) {
    const baseRows = DATA;

    // 公司视角：仅限“我方已进入”的国家
    const allowedCountries =
        viewMode === "company" ? ourMarketSet(DATA, metricKey) : null;

    const compSet =
        viewMode === "company"
            ? new Set(["Our Company", ...selectedCompetitors]) // 我方 + 选中的竞品
            : new Set(selectedCompetitors.size ? Array.from(selectedCompetitors) : COMPETITORS);

    return baseRows
        .filter(d => compSet.has(d.competitor))
        .filter(d => (allowedCountries ? allowedCountries.has(d.country) : true))
        .map(d => ({
            country: d.country,
            competitor: d.competitor,
            metric: metricKey === "market_share" ? d.share : d.value[metricKey],
            plants: d.value.plants,
            capacity: d.value.capacity,
            share: d.share
        }));
}

function topCountries(DATA, metricKey, viewMode, selectedCompetitors) {
    const rows = getRows(DATA, metricKey, viewMode, selectedCompetitors);
    const agg = new Map();
    if (metricKey === "market_share") {
        if (viewMode === "company") {
            rows
                .filter(r => r.competitor === "Our Company")
                .forEach(r => agg.set(r.country, (agg.get(r.country) ?? 0) + (r.share ?? 0)));
        } else {
            const byCountryMax = new Map();
            rows.forEach(r => {
                const cur = byCountryMax.get(r.country) ?? 0;
                byCountryMax.set(r.country, Math.max(cur, r.share ?? 0));
            });
            byCountryMax.forEach((v, k) => agg.set(k, v));
        }
    } else {
        rows.forEach(r => agg.set(r.country, (agg.get(r.country) ?? 0) + (Number.isFinite(r.metric) ? r.metric : 0)));
    }
    return Array.from(agg.entries())
        .map(([country, total]) => ({ country, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
}

/* —— 修复：返回饼图安全数据 —— */
function pieDataByCountry(DATA, country, metricKey, viewMode, selectedCompetitors) {
    const rows = getRows(DATA, metricKey, viewMode, selectedCompetitors).filter(r => r.country === country);

    const pairs = rows.map(r => {
        const raw = metricKey === "market_share" ? r.share : r.metric;
        const val = Number(raw);
        return {
            label: r.competitor || "N/A",
            value: Number.isFinite(val) && val >= 0 ? val : 0
        };
    }).filter(p => p.value > 0);

    if (pairs.length === 0) {
        // 防止 Plotly 空数组或全 0 崩溃
        return { labels: ["No data"], values: [1], isEmpty: true };
    }
    return { labels: pairs.map(p => p.label), values: pairs.map(p => p.value), isEmpty: false };
}

function tableData(DATA, metricKey, viewMode, selectedCompetitors) {
    const rows = getRows(DATA, metricKey, viewMode, selectedCompetitors);
    const countries = Array.from(new Set(rows.map(r => r.country)));
    const competitors = Array.from(new Set(rows.map(r => r.competitor)));
    const byKey = new Map(rows.map(r => [`${r.country}::${r.competitor}`, r]));
    return { countries, competitors, byKey };
}

// 导出 CSV（包含缺失字段；满足“离线补齐再导入”）
function toCSV(DATA) {
    const lines = ["country,competitor,metric,year,value"];
    DATA.forEach(r => {
        lines.push(`${r.country},${r.competitor},market_share,${r.year},${Number(r.share ?? 0)}`);
        Object.entries(r.value || {}).forEach(([metric, val]) => {
            lines.push(`${r.country},${r.competitor},${metric},${r.year},${Number(val ?? 0)}`);
        });
    });
    return lines.join("\n");
}

// 解析 CSV
function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("CSV is empty");
    const head = lines[0].split(",").map(s => s.trim().toLowerCase());
    const ci = head.indexOf("country");
    const pi = head.indexOf("competitor");
    const mi = head.indexOf("metric");
    const yi = head.indexOf("year");
    const vi = head.indexOf("value");
    if (ci < 0 || pi < 0 || mi < 0 || yi < 0 || vi < 0) {
        throw new Error("CSV header must be: country,competitor,metric,year,value");
    }

    const key = (c, p, y) => `${c}::${p}::${y}`;
    const rowsMap = new Map();

    for (let i = 1; i < lines.length; i++) {
        const arr = lines[i].split(",").map(s => s.trim());
        if (arr.length < 5) continue;
        const country = arr[ci];
        const competitor = arr[pi];
        const metric = arr[mi];
        const year = Number(arr[yi] || 2024);
        const value = Number(arr[vi]);

        if (!country || !competitor || !metric || !Number.isFinite(year)) continue;
        const k = key(country, competitor, year);
        let row = rowsMap.get(k);
        if (!row) {
            row = { country, competitor, year, value: { revenue: null, workforce: null, capacity: null, plants: null }, share: null };
            rowsMap.set(k, row);
        }
        if (metric === "market_share") row.share = Number.isFinite(value) ? value : row.share;
        else if (["revenue", "workforce", "capacity", "plants"].includes(metric)) row.value[metric] = Number.isFinite(value) ? value : row.value[metric];
    }
    return Array.from(rowsMap.values());
}

// 合并导入：仅覆盖上传中包含的字段（满足 FR-4.3）
function mergeRows(existing, incoming) {
    const key = (r) => `${r.country}::${r.competitor}::${r.year}`;
    const map = new Map(existing.map(r => [key(r), { ...r, value: { ...r.value } }]));
    incoming.forEach(nr => {
        const k = key(nr);
        const cur = map.get(k) || {
            country: nr.country,
            competitor: nr.competitor,
            year: nr.year,
            value: { revenue: null, workforce: null, capacity: null, plants: null },
            share: null
        };
        // 仅覆盖提供的字段
        if (Number.isFinite(nr.share)) cur.share = nr.share;
        ["revenue", "workforce", "capacity", "plants"].forEach(m => {
            if (Number.isFinite(nr.value?.[m])) cur.value[m] = nr.value[m];
        });
        map.set(k, cur);
    });
    return Array.from(map.values());
}

/* ------------------------------ 子组件 ------------------------------ */
function Toolbar({
                     metric, setMetric, viewMode, setViewMode, selectedCompetitors, setSelectedCompetitors,
                     onImport, onExportCSV, onExportPDF, onRefresh, onOpenManual
                 }) {
    const inputRef = useRef(null);
    const trigger = () => inputRef.current?.click();

    return (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Geographical Performance Analysis</h2>

            <select value={metric} onChange={e => setMetric(e.target.value)}>
                {METRICS.map(m => <option value={m.key} key={m.key}>{m.label}</option>)}
            </select>

            <div>
                <label style={{ marginRight: 8 }}>View:</label>
                <button onClick={() => setViewMode("company")} disabled={viewMode === "company"}>Company-Centric</button>
                <button onClick={() => setViewMode("competitor")} disabled={viewMode === "competitor"} style={{ marginLeft: 6 }}>Competitor-Centric</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Competitors:</span>
                {COMPETITORS.map(c => (
                    <label key={c} style={{ marginRight: 6 }}>
                        <input
                            type="checkbox"
                            checked={selectedCompetitors.has(c)}
                            onChange={(e) => {
                                const next = new Set(selectedCompetitors);
                                if (e.target.checked) next.add(c); else next.delete(c);
                                setSelectedCompetitors(next);
                            }}
                        />
                        {c}
                    </label>
                ))}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={trigger}>Import (.csv / .json)</button>
                <input ref={inputRef} type="file" accept=".csv,.json" style={{ display: "none" }}
                       onChange={(e) => onImport(e.target.files?.[0] || null)} />
                <button onClick={onExportCSV}>Export CSV</button>
                <button onClick={onExportPDF}>Export PDF</button>
                <button onClick={onRefresh}>Refresh Data</button>
                <button onClick={onOpenManual}>Manual Data Entry</button>
            </div>
        </div>
    );
}

const SummaryCards = ({ DATA, metricKey, viewMode, selectedCompetitors }) => {
    const top10 = useMemo(() => topCountries(DATA, metricKey, viewMode, selectedCompetitors), [DATA, metricKey, viewMode, selectedCompetitors]);
    const top = top10[0];
    const total = top10.reduce((s, x) => s + x.total, 0);
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 12 }}>
            <Card title="Top Country">{top ? `${top.country} (${top.total.toFixed(1)})` : "-"}</Card>
            <Card title="#Countries">{top10.length}</Card>
            <Card title="Coverage (Top10 Sum)">{total.toFixed(1)}</Card>
            <Card title="Data Freshness">2024-12-31</Card>
            <Card title="AI Insights Ready">Yes</Card>
        </div>
    );
};
const Card = ({ title, children }) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{children}</div>
    </div>
);

/* ------------------- 地图（满足“自动生成世界地图”） ------------------- */
const WorldMap = ({ DATA, metricKey, viewMode, selectedCompetitors }) => {
    const rows = getRows(DATA, metricKey, viewMode, selectedCompetitors);
    const valByCountry = new Map();

    if (metricKey === "market_share") {
        if (viewMode === "company") {
            rows.filter(r => r.competitor === "Our Company")
                .forEach(r => valByCountry.set(r.country, r.share ?? 0));
        } else {
            rows.forEach(r => {
                const cur = valByCountry.get(r.country) ?? 0;
                valByCountry.set(r.country, Math.max(cur, r.share ?? 0));
            });
        }
    } else {
        rows.forEach(r => valByCountry.set(r.country, (valByCountry.get(r.country) ?? 0) + (r.metric ?? 0)));
    }

    // 仅绘制允许的国家（公司视角下会被过滤）
    const visibleCountries = COUNTRIES.filter(cty => valByCountry.has(cty));
    const locations = visibleCountries.map(cty => iso3[cty] || cty);
    const z = visibleCountries.map(cty => valByCountry.get(cty) ?? 0);

    const isPercent = metricKey === "market_share";
    const hoverTpl = isPercent ? "%{text}<br>%{z:.1f}%<extra></extra>" : "%{text}<br>%{z:.0f}<extra></extra>";
    const colorbarTitle = METRICS.find(m => m.key === metricKey)?.label || metricKey;

    return (
        <Plot
            style={{ width: "100%", height: 420 }}
            config={{ displayModeBar: false, responsive: true }}
            data={[{
                type: "choropleth",
                locationmode: "ISO-3",
                locations,
                z,
                text: visibleCountries,
                colorscale: "YlGnBu",
                colorbar: { title: colorbarTitle, ticksuffix: isPercent ? "%" : "" },
                hovertemplate: hoverTpl,
                zauto: true
            }]}
            layout={{
                margin: { l: 0, r: 0, t: 0, b: 0 },
                geo: {
                    projection: { type: "natural earth" },
                    fitbounds: "locations",
                    showcountries: true,
                    countrycolor: "#d1d5db",
                    countrywidth: 0.8,
                    showland: true,
                    landcolor: "#f5f5f5",
                    showocean: true,
                    oceancolor: "#e6f0fa",
                    lakecolor: "#e6f0fa",
                    coastlinecolor: "#cbd5e1",
                    bgcolor: "#ffffff"
                }
            }}
        />
    );
};

const Top10Bar = ({ DATA, metricKey, viewMode, selectedCompetitors }) => {
    const top10 = useMemo(() => topCountries(DATA, metricKey, viewMode, selectedCompetitors), [DATA, metricKey, viewMode, selectedCompetitors]);
    return (
        <Plot
            style={{ width: "100%", height: 420 }}
            config={{ displayModeBar: false, responsive: true }}
            data={[{ type: "bar", x: top10.map(x => x.total), y: top10.map(x => x.country), orientation: "h" }]}
            layout={{ margin: { l: 120, r: 10, t: 10, b: 30 }, yaxis: { autorange: "reversed" }, title: "Top 10 Markets" }}
        />
    );
};

const Tabs = ({ active, setActive }) => {
    const tabs = ["Market Table", "Share by Country", "Production Plants", "Heatmap"];
    return (
        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 8 }}>
            {tabs.map(t => (
                <button key={t} onClick={() => setActive(t)} disabled={active === t}>{t}</button>
            ))}
        </div>
    );
};

const MarketTable = ({ DATA, metricKey, viewMode, selectedCompetitors }) => {
    const { countries, competitors, byKey } = useMemo(
        () => tableData(DATA, metricKey, viewMode, selectedCompetitors),
        [DATA, metricKey, viewMode, selectedCompetitors]
    );
    return (
        <div style={{ overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                <tr>
                    <th style={th}>Country</th>
                    {competitors.map(c => <th key={c} style={th}>{c}</th>)}
                </tr>
                </thead>
                <tbody>
                {countries.map(cty => (
                    <tr key={cty}>
                        <td style={td}>{cty}</td>
                        {competitors.map(c => {
                            const r = byKey.get(`${cty}::${c}`);
                            const v = metricKey === "market_share" ? r?.share : r?.metric;
                            return <td key={c} style={td}>{v ?? "-"}</td>;
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

/* ---------------- Share by Country：修复空/非法值导致不渲染 ---------------- */
const ShareByCountryGrid = ({ DATA, metricKey, viewMode, selectedCompetitors }) => {
    const baseList = COUNTRIES;
    // 受公司视角限制后，可能可视国家减少
    const allowed = viewMode === "company" ? Array.from(ourMarketSet(DATA, metricKey)) : baseList;
    const countries = allowed.slice(0, 6);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {countries.map(cty => {
                const { labels, values, isEmpty } = pieDataByCountry(DATA, cty, metricKey, viewMode, selectedCompetitors);
                return (
                    <div key={cty} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                        <div style={{ padding: "8px 12px", fontWeight: 600 }}>{cty}</div>
                        {isEmpty ? (
                            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 12 }}>
                                No data for {cty}
                            </div>
                        ) : (
                            <Plot
                                style={{ width: "100%", height: 260 }}
                                config={{ displayModeBar: false, responsive: true }}
                                data={[{ type: "pie", labels, values, textinfo: "label+percent" }]}
                                layout={{ margin: { l: 10, r: 10, t: 0, b: 0 }, showlegend: false }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

/* ---------------- Production Plants（你要的样式） ---------------- */
const PlantsByCountryGrid = ({ DATA, viewMode, selectedCompetitors }) => {
    const rows = getRows(DATA, "plants", viewMode, selectedCompetitors);
    const countries = Array.from(new Set(rows.map(r => r.country))).slice(0, 6);
    const plantMax = Math.max(1, ...rows.map(r => r.plants || 0));
    const capMax = Math.max(1, ...rows.map(r => r.capacity || 0));

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {countries.map(cty => {
                const subset = rows.filter(r => r.country === cty);
                const totalPlants = subset.reduce((s, x) => s + (x.plants || 0), 0);
                const totalCap = subset.reduce((s, x) => s + (x.capacity || 0), 0);

                return (
                    <div key={cty} style={panel}>
                        <div style={panelHeader}>
                            <span style={countryTitle}>COUNTRY</span>
                            <span style={countryName}>{cty}</span>
                        </div>

                        <div style={gridHeader}>
                            <div style={{ padding: "6px 8px" }}>Key Players</div>
                            <div style={{ padding: "6px 8px", textAlign: "center" }}>Plant #</div>
                            <div style={{ padding: "6px 8px", textAlign: "center" }}>Total Capacity</div>
                        </div>

                        <div>
                            {subset.map(s => (
                                <div key={s.competitor} style={gridRow}>
                                    <div style={cellLeft}>{s.competitor}</div>
                                    <div style={cellBar}>
                                        <HBar value={s.plants || 0} max={plantMax} fill="#5b84c6" track="#e8eef7" />
                                    </div>
                                    <div style={cellBar}>
                                        <HBar value={s.capacity || 0} max={capMax} fill="#d8c9a3" track="#f3efe3" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={totalRow}>
                            <div style={cellLeftBold}>TOTAL</div>
                            <div style={cellTotal}>{totalPlants}</div>
                            <div style={cellTotal}>{totalCap}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function HBar({ value, max, fill, track, height = 16 }) {
    const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
    return (
        <div style={{
            position: "relative", background: track, height, borderRadius: 6, overflow: "hidden", border: "1px solid #d7dee9"
        }}>
            <div style={{ width: `${pct}%`, height: "100%", background: fill }} />
            <div style={{
                position: "absolute", right: 6, top: 0, bottom: 0, display: "flex",
                alignItems: "center", fontSize: 12, color: "#0f172a", fontWeight: 600
            }}>
                {value}
            </div>
        </div>
    );
}

const HeatmapMatrix = ({ DATA, metricKey, viewMode, selectedCompetitors }) => {
    const { countries, competitors, byKey } = useMemo(
        () => tableData(DATA, metricKey, viewMode, selectedCompetitors),
        [DATA, metricKey, viewMode, selectedCompetitors]
    );
    const z = competitors.map(c => countries.map(cty => {
        const r = byKey.get(`${cty}::${c}`);
        return metricKey === "market_share" ? (r?.share ?? 0) : (r?.metric ?? 0);
    }));
    return (
        <Plot
            style={{ width: "100%", height: 360 }}
            config={{ displayModeBar: false, responsive: true }}
            data={[{ type: "heatmap", z, x: countries, y: competitors, colorscale: "Blues" }]}
            layout={{ margin: { l: 160, r: 10, t: 10, b: 60 } }}
        />
    );
};

const AIInsightsPanel = ({ metricKey }) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Insights (placeholder)</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Dominant markets detected based on <b>{METRICS.find(m => m.key === metricKey)?.label}</b>.</li>
            <li>White-space opportunities and gaps vs. leader.</li>
            <li>3–5 strategic directions（BRD Prompt then generate automatically）。</li>
        </ul>
    </div>
);

function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
            <div style={{ background: "#fff", borderRadius: 8, width: 520, maxWidth: "90vw", padding: 16 }}>
                {children}
                <div style={{ textAlign: "right", marginTop: 12 }}>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

/* --------------------------------- 样式 -------------------------------- */
const th = { textAlign: "left", background: "#f9fafb", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0 };
const td = { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" };

const panel = { background: "#fff", border: "1px solid #d9dee7", borderRadius: 8, boxShadow: "0 1px 0 rgba(16,24,40,.02)", overflow: "hidden" };
const panelHeader = { display: "flex", alignItems: "baseline", gap: 8, padding: "10px 12px", borderBottom: "1px solid #e5e7eb", background: "#f7f9fc" };
const countryTitle = { fontSize: 12, letterSpacing: 1.2, color: "#6b7280" };
const countryName = { fontSize: 14, fontWeight: 700, color: "#111827" };

const gridHeader = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "#f3f6fb", borderBottom: "1px solid #e5e7eb", color: "#334155", fontWeight: 600, fontSize: 12 };
const gridRow = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", alignItems: "center", gap: 0, borderBottom: "1px solid #f1f5f9" };
const cellLeft = { padding: "8px 8px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" };
const cellLeftBold = { padding: "8px 8px", fontSize: 12, fontWeight: 700, color: "#111827" };
const cellBar = { padding: "8px 10px" };
const totalRow = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "#f8fafc", borderTop: "1px solid #e5e7eb", fontWeight: 700 };
const cellTotal = { padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" };

/* ------------------------------- 主页面 ------------------------------- */
export default function GeographicalPerformanceAnalysis() {
    const [DATA, setDATA] = useState(buildInitialRows());
    const [metric, setMetric] = useState(METRICS[0].key);
    const [viewMode, setViewMode] = useState("company"); // company | competitor
    const [activeTab, setActive] = useState("Market Table");
    const [selectedCompetitors, setSelectedCompetitors] = useState(new Set(["Our Company", "Competitor 1", "Competitor 2"]));
    const [toast, setToast] = useState("");

    const [dlgOpen, setDlgOpen] = useState(false);
    const [form, setForm] = useState({ country: COUNTRIES[0], competitor: COMPETITORS[0], metric: "market_share", year: 2024, value: 0 });

    const pageRef = useRef(null);

    const handleImport = async (file) => {
        if (!file) return;
        try {
            let rows;
            const text = await file.text();
            if (file.name.toLowerCase().endsWith(".json")) {
                const obj = JSON.parse(text);
                if (!Array.isArray(obj)) throw new Error("JSON must be an array of rows");
                rows = obj;
            } else {
                rows = parseCSV(text);
            }
            if (!rows.length) throw new Error("No records");

            // 与现有数据合并，仅覆盖提供字段（FR-4.3）
            const next = mergeRows(DATA, rows);
            setDATA(next);
            setToast(`Imported ${rows.length} records (merged)`);
        } catch (e) {
            console.error(e);
            setToast(`Import failed: ${e.message || e}`);
        }
    };

    const handleExportCSV = () => {
        const csv = toCSV(DATA);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `geographical_performance_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = async () => {
        if (!pageRef.current) return;
        const canvas = await html2canvas(pageRef.current, {
            backgroundColor: "#ffffff",
            scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio,
            useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let position = 10; let heightLeft = imgHeight;
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= (pageHeight - position);
        while (heightLeft > 0) {
            pdf.addPage();
            position = 10;
            pdf.addImage(imgData, "PNG", 10, position - (imgHeight - heightLeft), imgWidth, imgHeight, "", "FAST");
            heightLeft -= (pageHeight - position);
        }
        pdf.save(`Geographical_Performance_${Date.now()}.pdf`);
    };

    const handleRefresh = () => { setDATA(buildInitialRows()); setToast("Data refreshed"); };

    const openManual = () => { setDlgOpen(true); };
    const submitManual = () => {
        const { country, competitor, metric: m, year, value } = form;
        const idx = DATA.findIndex(r => r.country === country && r.competitor === competitor && r.year === Number(year));
        let next = [...DATA];
        if (idx >= 0) {
            const row = { ...next[idx], value: { ...next[idx].value } };
            if (m === "market_share") row.share = Number(value);
            else row.value[m] = Number(value);
            next[idx] = row;
        } else {
            const base = { country, competitor, year: Number(year), value: { revenue: null, workforce: null, capacity: null, plants: null }, share: null };
            if (m === "market_share") base.share = Number(value);
            else base.value[m] = Number(value);
            next.push(base);
        }
        setDATA(next);
        setDlgOpen(false);
        setToast("Record saved");
    };

    return (
        <div ref={pageRef} style={{ padding: 16, background: "#f3f4f6", minHeight: "100vh" }}>
            <Toolbar
                metric={metric} setMetric={setMetric}
                viewMode={viewMode} setViewMode={setViewMode}
                selectedCompetitors={selectedCompetitors} setSelectedCompetitors={setSelectedCompetitors}
                onImport={handleImport} onExportCSV={handleExportCSV} onExportPDF={handleExportPDF}
                onRefresh={handleRefresh} onOpenManual={openManual}
            />

            <SummaryCards DATA={DATA} metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div><WorldMap DATA={DATA} metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} /></div>
                <div><Top10Bar DATA={DATA} metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} /></div>
            </div>

            <Tabs active={activeTab} setActive={setActive} />

            {activeTab === "Market Table" && (
                <MarketTable DATA={DATA} metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}
            {activeTab === "Share by Country" && (
                <ShareByCountryGrid DATA={DATA} metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}
            {activeTab === "Production Plants" && (
                <PlantsByCountryGrid DATA={DATA} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}
            {activeTab === "Heatmap" && (
                <HeatmapMatrix DATA={DATA} metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                        <b>Missing Data</b>：support CSV/JSON import — <a href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }}>Export Template</a>
                    </div>
                </div>
                <AIInsightsPanel metricKey={metric} />
            </div>

            {toast && (
                <div
                    onAnimationEnd={() => setToast("")}
                    style={{
                        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
                        background: "#111", color: "#fff", padding: "8px 12px", borderRadius: 8, opacity: .95
                    }}
                >
                    {toast}
                </div>
            )}

            <Modal open={dlgOpen} onClose={() => setDlgOpen(false)}>
                <h3 style={{ marginTop: 0 }}>Manual Data Entry</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label>Country
                        <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label>Competitor
                        <select value={form.competitor} onChange={e => setForm({ ...form, competitor: e.target.value })}>
                            {COMPETITORS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label>Metric
                        <select value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })}>
                            {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                        </select>
                    </label>
                    <label>Year
                        <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                    </label>
                    <label style={{ gridColumn: "1 / span 2" }}>Value
                        <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={{ width: "100%" }} />
                    </label>
                </div>
                <div style={{ textAlign: "right", marginTop: 12 }}>
                    <button onClick={submitManual}>Save</button>
                </div>
            </Modal>
        </div>
    );
}
