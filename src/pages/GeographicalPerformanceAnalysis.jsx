import React, { useMemo, useState } from "react";
import Plot from "react-plotly.js";

/**
 * Geographical Performance Analysis (Merged)
 * - Merges: Geographical Performance / Market Share by Country / Production Plant
 * - BRD §6.1.* compliant: metric dropdown, dual view, maps, tables, charts, AI-insight slot
 *
 * NOTE: 此文件内置 mock 数据与最小样式，便于你先跑通交互与结构。
 * 接入真实数据时，只需替换 DATA 与计算方法（保持相同 shape）。
 */

/* -------------------------- MOCK DATA (可替换) -------------------------- */
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

// 生成一点点演示数据
const seed = (c, i) => {
    const base = 10 + i * 5;
    return {
        market_share: +(Math.max(1, (base % 30)) + (c.length % 7)).toFixed(1),
        revenue: base * 40 + (c.length % 5) * 30,
        workforce: base * 120 + (c.length % 5) * 50,
        plants: (i % 7) + 1,
        capacity: (i % 5 + 1) * 100,
    };
};

const DATA = [];
COUNTRIES.forEach((country, idx) => {
    COMPETITORS.forEach((comp, j) => {
        const s = seed(country, idx + j + (comp === "Our Company" ? 3 : 0));
        DATA.push({
            country,
            competitor: comp,
            year: 2024,
            value: {
                revenue: s.revenue,
                workforce: s.workforce,
                capacity: s.capacity,
                plants: s.plants
            },
            share: s.market_share,
        });
    });
});

/* ------------------------------ 小工具函数 ------------------------------ */
const getRows = (metricKey, viewMode, selectedCompetitors) => {
    const compSet =
        viewMode === "company"
            ? new Set(["Our Company", ...selectedCompetitors])
            : new Set(selectedCompetitors.size ? Array.from(selectedCompetitors) : COMPETITORS);

    const rows = DATA.filter(d => compSet.has(d.competitor)).map(d => ({
        country: d.country,
        competitor: d.competitor,
        metric: metricKey === "market_share" ? d.share : d.value[metricKey],
        plants: d.value.plants,
        capacity: d.value.capacity,
        share: d.share
    }));
    return rows;
};

const topCountries = (metricKey, viewMode, selectedCompetitors) => {
    const rows = getRows(metricKey, viewMode, selectedCompetitors);
    const map = new Map();
    rows.forEach(r => {
        const prev = map.get(r.country) || 0;
        map.set(r.country, prev + (Number.isFinite(r.metric) ? r.metric : 0));
    });
    return Array.from(map.entries())
        .map(([country, total]) => ({ country, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
};

const pieDataByCountry = (country, metricKey, viewMode, selectedCompetitors) => {
    const rows = getRows(metricKey, viewMode, selectedCompetitors).filter(r => r.country === country);
    const labels = rows.map(r => r.competitor);
    const values =
        metricKey === "market_share"
            ? rows.map(r => r.share)
            : rows.map(r => r.metric);
    return { labels, values };
};

const tableData = (metricKey, viewMode, selectedCompetitors) => {
    const rows = getRows(metricKey, viewMode, selectedCompetitors);
    const countries = Array.from(new Set(rows.map(r => r.country)));
    const competitors = Array.from(new Set(rows.map(r => r.competitor)));
    const byKey = new Map(rows.map(r => [`${r.country}::${r.competitor}`, r]));
    return { countries, competitors, byKey };
};

/* ------------------------------ 子组件 ------------------------------ */
const Toolbar = ({ metric, setMetric, viewMode, setViewMode, selectedCompetitors, setSelectedCompetitors }) => {
    return (
        <div style={{display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:12}}>
            <h2 style={{margin:0}}>Geographical Performance Analysis</h2>
            <select value={metric} onChange={e=>setMetric(e.target.value)}>
                {METRICS.map(m => <option value={m.key} key={m.key}>{m.label}</option>)}
            </select>
            <div>
                <label style={{marginRight:8}}>View:</label>
                <button onClick={()=>setViewMode("company")} disabled={viewMode==="company"}>Company-Centric</button>
                <button onClick={()=>setViewMode("competitor")} disabled={viewMode==="competitor"} style={{marginLeft:6}}>Competitor-Centric</button>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
                <span>Competitors:</span>
                {COMPETITORS.map(c=>(
                    <label key={c} style={{marginRight:6}}>
                        <input
                            type="checkbox"
                            checked={selectedCompetitors.has(c)}
                            onChange={(e)=>{
                                const next = new Set(selectedCompetitors);
                                if(e.target.checked) next.add(c); else next.delete(c);
                                setSelectedCompetitors(next);
                            }}
                        />
                        {c}
                    </label>
                ))}
            </div>
            <div style={{marginLeft:"auto", display:"flex", gap:8}}>
                <button>Export Excel</button>
                <button>Export PDF/PPT</button>
                <button>Refresh Data</button>
                <button>Manual Data Entry</button>
            </div>
        </div>
    );
};

const SummaryCards = ({ metricKey, viewMode, selectedCompetitors }) => {
    const top10 = useMemo(()=>topCountries(metricKey, viewMode, selectedCompetitors), [metricKey, viewMode, selectedCompetitors]);
    const top = top10[0];
    const total = top10.reduce((s,x)=>s+x.total,0);
    return (
        <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:12}}>
            <Card title="Top Country">{top ? `${top.country} (${top.total.toFixed(1)})` : "-"}</Card>
            <Card title="#Countries">{top10.length}</Card>
            <Card title="Coverage (Top10 Sum)">{total.toFixed(1)}</Card>
            <Card title="Data Freshness">2024-12-31</Card>
            <Card title="AI Insights Ready">Yes</Card>
        </div>
    );
};
const Card = ({title, children}) => (
    <div style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12}}>
        <div style={{fontSize:12, color:"#6b7280"}}>{title}</div>
        <div style={{fontSize:18, fontWeight:600}}>{children}</div>
    </div>
);

const WorldMap = ({ metricKey, viewMode, selectedCompetitors }) => {
    const top10 = useMemo(()=>topCountries(metricKey, viewMode, selectedCompetitors), [metricKey, viewMode, selectedCompetitors]);
    const locations = top10.map(x=>iso3[x.country] || x.country);
    const z = top10.map(x=>x.total);
    return (
        <Plot
            style={{width:"100%", height:420}}
            config={{displayModeBar:false, responsive:true}}
            data={[{
                type: "choropleth",
                locationmode: "ISO-3",
                locations,
                z,
                colorscale: "Blues",
                colorbar: {title: METRICS.find(m=>m.key===metricKey)?.label || metricKey}
            }]}
            layout={{
                margin:{l:0,r:0,t:0,b:0},
                geo:{projection:{type:"equirectangular"}}
            }}
        />
    );
};

const Top10Bar = ({ metricKey, viewMode, selectedCompetitors }) => {
    const top10 = useMemo(()=>topCountries(metricKey, viewMode, selectedCompetitors), [metricKey, viewMode, selectedCompetitors]);
    return (
        <Plot
            style={{width:"100%", height:420}}
            config={{displayModeBar:false, responsive:true}}
            data={[{
                type:"bar",
                x: top10.map(x=>x.total),
                y: top10.map(x=>x.country),
                orientation:"h"
            }]}
            layout={{margin:{l:120,r:10,t:10,b:30}, yaxis:{autorange:"reversed"}, title:"Top 10 Markets"}}
        />
    );
};

const Tabs = ({ active, setActive }) => {
    const tabs = ["Market Table", "Share by Country", "Production Plants", "Heatmap"];
    return (
        <div style={{display:"flex", gap:8, marginTop:12, marginBottom:8}}>
            {tabs.map(t=>(
                <button key={t} onClick={()=>setActive(t)} disabled={active===t}>{t}</button>
            ))}
        </div>
    );
};

const MarketTable = ({ metricKey, viewMode, selectedCompetitors }) => {
    const { countries, competitors, byKey } = useMemo(
        () => tableData(metricKey, viewMode, selectedCompetitors),
        [metricKey, viewMode, selectedCompetitors]
    );
    return (
        <div style={{overflow:"auto", border:"1px solid #e5e7eb", borderRadius:8}}>
            <table style={{borderCollapse:"collapse", width:"100%"}}>
                <thead>
                <tr>
                    <th style={th}>Country</th>
                    {competitors.map(c=> <th key={c} style={th}>{c}</th>)}
                </tr>
                </thead>
                <tbody>
                {countries.map(cty=>(
                    <tr key={cty}>
                        <td style={td}>{cty}</td>
                        {competitors.map(c=>{
                            const r = byKey.get(`${cty}::${c}`);
                            const v = metricKey==="market_share" ? r?.share : r?.metric;
                            return <td key={c} style={td}>{v ?? "-"}</td>;
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

const ShareByCountryGrid = ({ metricKey, viewMode, selectedCompetitors }) => {
    const countries = COUNTRIES.slice(0, 6);
    return (
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12}}>
            {countries.map(cty=>{
                const {labels, values} = pieDataByCountry(cty, metricKey, viewMode, selectedCompetitors);
                return (
                    <div key={cty} style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:8}}>
                        <div style={{padding:"8px 12px", fontWeight:600}}>{cty}</div>
                        <Plot
                            style={{width:"100%", height:260}}
                            config={{displayModeBar:false, responsive:true}}
                            data={[{type:"pie", labels, values, textinfo:"label+percent"}]}
                            layout={{margin:{l:10,r:10,t:0,b:0}, showlegend:false}}
                        />
                    </div>
                );
            })}
        </div>
    );
};

const PlantsByCountryGrid = ({ viewMode, selectedCompetitors }) => {
    const rows = getRows("plants", viewMode, selectedCompetitors);
    const countries = Array.from(new Set(rows.map(r=>r.country))).slice(0,6);
    return (
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12}}>
            {countries.map(cty=>{
                const subset = rows.filter(r=>r.country===cty);
                return (
                    <div key={cty} style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12}}>
                        <div style={{fontWeight:600, marginBottom:8}}>{cty}</div>
                        {subset.map(s=>(
                            <div key={s.competitor} style={{marginBottom:8}}>
                                <div style={{fontSize:12, color:"#6b7280"}}>{s.competitor}</div>
                                <BarPair label1="Plant #" v1={s.plants} max1={8} label2="Capacity" v2={s.capacity} max2={600}/>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

const BarPair = ({label1, v1, max1, label2, v2, max2}) => {
    const bar = (v, max) => (
        <div style={{background:"#e5e7eb", height:8, borderRadius:6}}>
            <div style={{width:`${Math.min(100, (v/max)*100)}%`, height:8, background:"#60a5fa", borderRadius:6}}/>
        </div>
    );
    return (
        <div>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:12}}><span>{label1}</span><b>{v1}</b></div>
            {bar(v1, max1)}
            <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginTop:4}}><span>{label2}</span><b>{v2}</b></div>
            {bar(v2, max2)}
        </div>
    );
};

const HeatmapMatrix = ({ metricKey, viewMode, selectedCompetitors }) => {
    const { countries, competitors, byKey } = useMemo(
        () => tableData(metricKey, viewMode, selectedCompetitors),
        [metricKey, viewMode, selectedCompetitors]
    );
    const z = competitors.map(c => countries.map(cty => {
        const r = byKey.get(`${cty}::${c}`);
        return metricKey==="market_share" ? (r?.share ?? 0) : (r?.metric ?? 0);
    }));
    return (
        <Plot
            style={{width:"100%", height:360}}
            config={{displayModeBar:false, responsive:true}}
            data={[{type:"heatmap", z, x:countries, y:competitors, colorscale:"Blues"}]}
            layout={{margin:{l:160,r:10,t:10,b:60}}}
        />
    );
};

const AIInsightsPanel = ({ metricKey }) => (
    <div style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12}}>
        <div style={{fontWeight:600, marginBottom:6}}>AI Insights (placeholder)</div>
        <ul style={{margin:0, paddingLeft:18}}>
            <li>Dominant markets detected based on <b>{METRICS.find(m=>m.key===metricKey)?.label}</b>.</li>
            <li>White-space opportunities and gaps vs. leader.</li>
            <li>3–5 strategic directions (board-grade) —— 接入你 BRD 两套 Prompt 生成。</li>
        </ul>
    </div>
);

/* --------------------------------- 样式 -------------------------------- */
const th = { textAlign:"left", background:"#f9fafb", padding:"8px 12px", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0 };
const td = { padding:"8px 12px", borderBottom:"1px solid #f1f5f9", whiteSpace:"nowrap" };

/* ------------------------------- 主页面 ------------------------------- */
export default function GeographicalPerformanceAnalysis() {
    const [metric, setMetric] = useState(METRICS[0].key);
    const [viewMode, setViewMode] = useState("company");
    const [activeTab, setActive] = useState("Market Table");
    const [selectedCompetitors, setSelectedCompetitors] = useState(new Set(["Our Company","Competitor 1","Competitor 2"]));

    return (
        <div style={{padding:16, background:"#f3f4f6", minHeight:"100vh"}}>
            <Toolbar
                metric={metric}
                setMetric={setMetric}
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedCompetitors={selectedCompetitors}
                setSelectedCompetitors={setSelectedCompetitors}
            />

            <SummaryCards metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />

            {/* 主视图区：左地图 + 右Top10 */}
            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:12}}>
                <div><WorldMap metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} /></div>
                <div><Top10Bar metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} /></div>
            </div>

            <Tabs active={activeTab} setActive={setActive} />

            {activeTab === "Market Table" && (
                <MarketTable metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}
            {activeTab === "Share by Country" && (
                <ShareByCountryGrid metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}
            {activeTab === "Production Plants" && (
                <PlantsByCountryGrid viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}
            {activeTab === "Heatmap" && (
                <HeatmapMatrix metricKey={metric} viewMode={viewMode} selectedCompetitors={selectedCompetitors} />
            )}

            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:12, marginTop:12}}>
                <div>
                    <div style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12}}>
                        <b>Missing Data</b>：0 fields — <a href="#">Export Template</a> ｜ <a href="#">Re-Upload</a>
                    </div>
                </div>
                <AIInsightsPanel metricKey={metric} />
            </div>
        </div>
    );
}
