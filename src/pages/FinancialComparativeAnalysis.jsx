// src/pages/FinancialComparativeAnalysis.jsx
import * as React from "react";
import {
    Box, Paper, Typography, Stack, Link,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, TextField,
    ToggleButton, ToggleButtonGroup
} from "@mui/material";
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
    LineChart, Line, ComposedChart, ReferenceArea
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ---------------- Demo 数据（含 Pretax Income；无 R&D） ---------------- */
const DATA = {
    companies: ["Your Company","Competitor 1","Competitor 2","Competitor 3","Competitor 4","Competitor 5"],
    years: [2020,2021,2022,2023,2024],
    metrics: [
        "Sales Revenue","COGS","SG&A","EBIT","Pretax Income","Net Income","EPS","Gross Income","EBITDA"
    ],
    series: {
        "Sales Revenue": {
            "Your Company": {"2020": 620, "2021": 640, "2022": 480, "2023": 610, "2024": 590},
            "Competitor 1": {"2020": 720, "2021": 700, "2022": 735, "2023": 760, "2024": 780},
            "Competitor 2": {"2020": 500, "2021": 340, "2022": 180, "2023": 280, "2024": 520},
            "Competitor 3": {"2020": 480, "2021": 520, "2022": 600, "2023": 720, "2024": 820},
            "Competitor 4": {"2020": 410, "2021": 300, "2022": 260, "2023": 360, "2024": 420},
            "Competitor 5": {"2020": 510, "2021": 520, "2022": 540, "2023": 560, "2024": 570}
        },
        "Gross Income": {
            "Your Company": {"2020": 260, "2021": 220, "2022": 180, "2023": 200, "2024": 210},
            "Competitor 1": {"2020": 350, "2021": 360, "2022": 380, "2023": 420, "2024": 430},
            "Competitor 2": {"2020": 210, "2021": 140, "2022": 60, "2023": 80, "2024": 120},
            "Competitor 3": {"2020": 260, "2021": 260, "2022": 300, "2023": 360, "2024": 380},
            "Competitor 4": {"2020": 170, "2021": 120, "2022": 80, "2023": 100, "2024": 120},
            "Competitor 5": {"2020": 190, "2021": 200, "2022": 210, "2023": 215, "2024": 220}
        },
        "COGS": {
            "Your Company": {"2020": 360, "2021": 420, "2022": 300, "2023": 410, "2024": 380},
            "Competitor 1": {"2020": 370, "2021": 340, "2022": 355, "2023": 360, "2024": 370},
            "Competitor 2": {"2020": 280, "2021": 200, "2022": 220, "2023": 200, "2024": 260},
            "Competitor 3": {"2020": 240, "2021": 260, "2022": 300, "2023": 360, "2024": 440},
            "Competitor 4": {"2020": 240, "2021": 180, "2022": 180, "2023": 220, "2024": 240},
            "Competitor 5": {"2020": 320, "2021": 320, "2022": 330, "2023": 345, "2024": 350}
        },
        "SG&A": {
            "Your Company": {"2020": 140, "2021": 110, "2022": 85, "2023": 95, "2024": 112},
            "Competitor 1": {"2020": 150, "2021": 150, "2022": 150, "2023": 140, "2024": 120},
            "Competitor 2": {"2020": 120, "2021": 110, "2022": 105, "2023": 100, "2024": 90},
            "Competitor 3": {"2020": 120, "2021": 130, "2022": 110, "2023": 120, "2024": 120},
            "Competitor 4": {"2020": 110, "2021": 100, "2022": 90, "2023": 80, "2024": 78},
            "Competitor 5": {"2020": 95, "2021": 100, "2022": 110, "2023": 115, "2024": 115}
        },
        "EBIT": {
            "Your Company": {"2020": 120, "2021": 110, "2022": 95,  "2023": 105, "2024": 98},
            "Competitor 1": {"2020": 200, "2021": 210, "2022": 230, "2023": 280, "2024": 310},
            "Competitor 2": {"2020": 90,  "2021": 30,  "2022": -45, "2023": -20, "2024": 80},
            "Competitor 3": {"2020": 140, "2021": 130, "2022": 190, "2023": 240, "2024": 260},
            "Competitor 4": {"2020": 60,  "2021": 40,  "2022": -20, "2023": 30,  "2024": 40},
            "Competitor 5": {"2020": 80,  "2021": 70,  "2022": 60,  "2023": 65,  "2024": 70}
        },
        "Pretax Income": {
            "Your Company": {"2020": 110, "2021": 105, "2022": 88,  "2023": 98,  "2024": 92},
            "Competitor 1": {"2020": 190, "2021": 205, "2022": 225, "2023": 270, "2024": 300},
            "Competitor 2": {"2020": 85,  "2021": 26,  "2022": -48, "2023": -18, "2024": 75},
            "Competitor 3": {"2020": 132, "2021": 124, "2022": 182, "2023": 232, "2024": 252},
            "Competitor 4": {"2020": 55,  "2021": 36,  "2022": -22, "2023": 26,  "2024": 36},
            "Competitor 5": {"2020": 76,  "2021": 66,  "2022": 56,  "2023": 60,  "2024": 66}
        },
        "Net Income": {
            "Your Company": {"2020": 80,  "2021": 76,  "2022": 60,  "2023": 68,  "2024": 64},
            "Competitor 1": {"2020": 140, "2021": 150, "2022": 160, "2023": 180, "2024": 200},
            "Competitor 2": {"2020": 60,  "2021": 20,  "2022": -50, "2023": -10, "2024": 50},
            "Competitor 3": {"2020": 85,  "2021": 80,  "2022": 130, "2023": 160, "2024": 180},
            "Competitor 4": {"2020": 30,  "2021": 22,  "2022": -15, "2023": 18,  "2024": 24},
            "Competitor 5": {"2020": 55,  "2021": 50,  "2022": 45,  "2023": 48,  "2024": 52}
        },
        "EPS": {
            "Your Company": {"2020": 2.1, "2021": 2.0, "2022": 1.5, "2023": 1.7, "2024": 1.6},
            "Competitor 1": {"2020": 3.2, "2021": 3.1, "2022": 3.4, "2023": 3.8, "2024": 4.0},
            "Competitor 2": {"2020": 1.2, "2021": 0.4, "2022": -1.1, "2023": -0.2, "2024": 0.9},
            "Competitor 3": {"2020": 2.0, "2021": 1.8, "2022": 2.6, "2023": 3.1, "2024": 3.3},
            "Competitor 4": {"2020": 0.9, "2021": 0.7, "2022": -0.2, "2023": 0.6, "2024": 0.8},
            "Competitor 5": {"2020": 1.5, "2021": 1.4, "2022": 1.3, "2023": 1.35, "2024": 1.4}
        },
        "EBITDA": {
            "Your Company": {"2020": 160, "2021": 150, "2022": 120, "2023": 140, "2024": 135},
            "Competitor 1": {"2020": 240, "2021": 250, "2022": 260, "2023": 300, "2024": 330},
            "Competitor 2": {"2020": 120, "2021": 50,  "2022": -30, "2023": 5,   "2024": 110},
            "Competitor 3": {"2020": 170, "2021": 160, "2022": 220, "2023": 270, "2024": 290},
            "Competitor 4": {"2020": 90,  "2021": 70,  "2022": 10,  "2023": 50,  "2024": 60},
            "Competitor 5": {"2020": 110, "2021": 100, "2022": 95,  "2023": 100, "2024": 105}
        }
    }
};

/** Dropdown：仅蓝色方块里的指标 */
const METRIC_LIST = [
    "Sales Revenue","COGS","Gross Income","SG&A","EBIT","Pretax Income","Net Income","EBITDA","EPS"
];
/** 哪些指标可计算 Margin（分母为 Sales Revenue） */
const MARGINABLE = new Set(["Gross Income","EBIT","Pretax Income","Net Income","EBITDA"]);

const COLORS = ["#d43d51","#7A64D8","#2FA7D9","#5DBB63","#E0A100","#7A7A8C","#B35C9D"];
const YEAR_COLORS = ["#6F79A8","#8898CF","#A3B0DE","#C1C9EB","#DEE2F6"];

/* ---------------- 工具函数 ---------------- */
function buildSeries(data, metric, companies){
    const years = data.years;
    const m = data.series?.[metric] || {};
    return years.map(y=>{
        const row = { year: y };
        companies.forEach(c => row[c] = m?.[c]?.[String(y)] ?? null);
        return row;
    });
}
function buildByCompany(data, metric, companies){
    const years = data.years.map(String);
    const m = data.series?.[metric] || {};
    return companies.map(c=>{
        const row = { company: c };
        years.forEach(y => { row[y] = m?.[c]?.[y] ?? null; });
        return row;
    });
}
function buildGrowthSeries(data, metric, companies){
    const base = buildSeries(data, metric, companies);
    return base.map((row, i)=>{
        if(i===0) return {year: row.year, ...Object.fromEntries(companies.map(c=>[c,0]))};
        const prev = base[i-1]; const out = {year: row.year};
        companies.forEach(c=>{
            const cur=row[c], pre=prev[c];
            out[c] = (typeof cur==="number" && typeof pre==="number" && pre!==0) ? ((cur-pre)/Math.abs(pre))*100 : 0;
        });
        return out;
    });
}
function buildMarginSeries(data, metric, companies){
    const sales = data.series?.["Sales Revenue"]||{}; const num=data.series?.[metric]||{};
    return data.years.map(y=>{
        const row = {year:y};
        companies.forEach(c=>{
            const n=num?.[c]?.[String(y)], d=sales?.[c]?.[String(y)];
            row[c] = (typeof n==="number" && typeof d==="number" && d!==0) ? (n/d)*100 : 0;
        });
        return row;
    });
}
function buildIndustryAvgByYear(data, metric){
    const years = data.years;
    const m = data.series?.[metric] || {};
    return years.map(y=>{
        let sum=0, cnt=0;
        (data.companies||[]).forEach(c=>{
            const v = m?.[c]?.[String(y)];
            if (typeof v === "number") { sum += v; cnt += 1; }
        });
        return { year: y, avg: cnt ? sum / cnt : 0 };
    });
}
function computeQuartiles(data, metric){
    const m = data.series?.[metric] || {};
    const vals = [];
    (data.companies||[]).forEach(c=>{
        (data.years||[]).forEach(y=>{
            const v = m?.[c]?.[String(y)];
            if (typeof v === "number") vals.push(v);
        });
    });
    if (!vals.length) return { q1: 0, q3: 0 };
    vals.sort((a,b)=>a-b);
    const q = (p) => {
        const idx = (vals.length - 1) * p;
        const lo = Math.floor(idx), hi = Math.ceil(idx);
        if (lo === hi) return vals[lo];
        return vals[lo] * (hi - idx) + vals[hi] * (idx - lo);
    };
    return { q1: q(0.25), q3: q(0.75) };
}
function parseCSV(text){
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("CSV 内容为空");
    const header = lines[0].split(",").map(s=>s.trim().toLowerCase());
    const mi = header.indexOf("metric");
    const ci = header.indexOf("company");
    const yi = header.indexOf("year");
    const vi = header.indexOf("value");
    if (mi<0 || ci<0 || yi<0 || vi<0) throw new Error("CSV 需要列：metric,company,year,value");

    const out = { companies: new Set(), years: new Set(), metrics: new Set(), series: {} };
    for (let i=1;i<lines.length;i++){
        const arr = lines[i].split(",").map(s=>s.trim());
        if (arr.length < 4) continue;
        const metric = arr[mi];
        const company = arr[ci];
        const year = arr[yi];
        const value = Number(arr[vi]);
        if (!metric || !company || !year || !isFinite(value)) continue;

        out.metrics.add(metric);
        out.companies.add(company);
        out.years.add(Number(year));
        out.series[metric] = out.series[metric] || {};
        out.series[metric][company] = out.series[metric][company] || {};
        out.series[metric][company][String(year)] = value;
    }
    const normalized = {
        companies: Array.from(out.companies),
        years: Array.from(out.years).sort((a,b)=>a-b),
        metrics: Array.from(out.metrics),
        series: out.series
    };
    return normalized;
}

/* ---------------- 图卡外壳 ---------------- */
function ChartPanel({ title, children }) {
    return (
        <Paper
            variant="outlined"
            sx={{ width: "100%", display: "block", borderRadius: 2, overflow: "hidden" }}
        >
            <Box sx={{ px: 1.5, py: 0.75, bgcolor:'#6F79A8', color:'#fff', fontWeight:700, fontSize:14 }}>
                {title}
            </Box>
            <Box
                sx={{
                    p: 1.5,
                    width: "100%",
                    minWidth: 0,
                    "& .recharts-responsive-container": { width: "100% !important" }
                }}
            >
                {children}
            </Box>
        </Paper>
    );
}

/* ---------------- 页面 ---------------- */
export default function FinancialComparativeAnalysis(){
    const [raw, setRaw] = React.useState(DATA);
    const [metricSel, setMetricSel] = React.useState("Sales Revenue");
    const [companies, setCompanies] = React.useState(DATA.companies.slice(0,5)); // ≤7
    const [chartType, setChartType] = React.useState("bar"); // bar | line

    const fileInputRef = React.useRef(null);
    const exportRef = React.useRef(null); // 导出 PDF 用

    const isModeEPS = metricSel === "EPS"; // EPS 选择时不渲染图表
    const baseForTop = metricSel;
    const growthMetric = metricSel;
    const marginMetric = metricSel;

    const METRIC_LIST_LOCAL = React.useRef(METRIC_LIST).current;
    const allowedMetrics = raw.metrics?.length ? METRIC_LIST_LOCAL.filter(m=> raw.metrics.includes(m)) : METRIC_LIST_LOCAL;
    const dropdownOptions = [...allowedMetrics];

    const byYear     = React.useMemo(()=> buildSeries(raw, baseForTop, companies), [raw, baseForTop, companies]);
    const byCompany  = React.useMemo(()=> buildByCompany(raw, baseForTop, companies), [raw, baseForTop, companies]);
    const growth     = React.useMemo(()=> buildGrowthSeries(raw, growthMetric, companies), [raw, growthMetric, companies]);
    const margin     = React.useMemo(()=> (
        MARGINABLE.has(marginMetric) ? buildMarginSeries(raw, marginMetric, companies) : null
    ), [raw, marginMetric, companies]);

    const showMargin = !!margin;
    const chartKey = `${metricSel}|${companies.join(",")}|${chartType}`;

    const industryAvgByYear = React.useMemo(()=> buildIndustryAvgByYear(raw, baseForTop), [raw, baseForTop]);
    const quartilesTop = React.useMemo(()=> computeQuartiles(raw, baseForTop), [raw, baseForTop]);

    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            let next;
            if (file.name.toLowerCase().endsWith(".json")) {
                next = JSON.parse(text);
            } else if (file.name.toLowerCase().endsWith(".csv")) {
                next = parseCSV(text);
            } else {
                alert("仅支持 .json 或 .csv");
                e.target.value = "";
                return;
            }
            if (!next || !next.series || !next.years || !next.companies) throw new Error("数据结构不完整");
            setRaw(next);
            setCompanies(next.companies.slice(0,5));
            alert("数据导入成功");
        } catch (err) {
            console.error(err);
            alert(`导入失败：${err.message || err}`);
        } finally {
            e.target.value = "";
        }
    };

    // 导出 CSV（扁平：metric,company,year,value）
    const handleExportCSV = () => {
        const lines = ["metric,company,year,value"];
        (raw.metrics || dropdownOptions).forEach(metric => {
            const m = raw.series?.[metric] || {};
            (raw.companies || companies).forEach(c => {
                (raw.years || []).forEach(y => {
                    const v = m?.[c]?.[String(y)];
                    if (v === undefined || v === null) return;
                    lines.push(`${metric},${c},${y},${v}`);
                });
            });
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financial_comparative_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // 导出 PDF（整页）
    const handleExportPDF = async () => {
        if (!exportRef.current) return;
        const canvas = await html2canvas(exportRef.current, {
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

        let position = 10;
        let heightLeft = imgHeight;

        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= (pageHeight - position);

        while (heightLeft > 0) {
            pdf.addPage();
            position = 10;
            pdf.addImage(imgData, "PNG", 10, position - (imgHeight - heightLeft), imgWidth, imgHeight, "", "FAST");
            heightLeft -= (pageHeight - position);
        }
        pdf.save(`Financial_Comparative_${Date.now()}.pdf`);
    };

    return (
        <Box ref={exportRef} sx={{ width:"100%" }}>
            {/* 工具条 */}
            <Paper variant="outlined" sx={{ p:2, width:"100%" }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1, flexWrap:'wrap' }}>
                    <Link component="button" underline="hover" onClick={()=>alert('Add competitor')} sx={{ fontWeight:600 }}>
                        Add Competitor
                    </Link>

                    <Link component="button" underline="hover" onClick={handleImportClick}>
                        Import
                    </Link>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.csv"
                        style={{ display:'none' }}
                        onChange={handleFileChange}
                    />

                    <Box sx={{ ml: { xs: 0, md: 2 } }}>
                        <ToggleButtonGroup
                            size="small"
                            value={chartType}
                            exclusive
                            onChange={(e,val)=>{ if(val) setChartType(val); }}
                            aria-label="chart type"
                        >
                            <ToggleButton value="bar" aria-label="bar">Bar</ToggleButton>
                            <ToggleButton value="line" aria-label="trend">Trend</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Stack>

                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ flexWrap:'wrap' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap:'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel id="metric">Select Financial Metric</InputLabel>
                            <Select
                                labelId="metric"
                                value={metricSel}
                                label="Select Financial Metric"
                                onChange={e=>setMetricSel(e.target.value)}
                            >
                                {dropdownOptions.map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 360 }}>
                            <InputLabel id="companies">Companies (≤7)</InputLabel>
                            <Select
                                multiple
                                labelId="companies"
                                value={companies}
                                onChange={(e)=>{
                                    const next = e.target.value;
                                    if (next.length <= 7) setCompanies(next);
                                }}
                                input={<OutlinedInput label="Companies (≤7)"/>}
                                renderValue={(sel)=>(
                                    <Box sx={{ display:'flex', flexWrap:'wrap', gap: .5 }}>
                                        {sel.map(s=><Chip key={s} size="small" label={s} />)}
                                    </Box>
                                )}
                            >
                                {raw.companies.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* 右上角：Strategic Report 导出 PDF + Export CSV */}
                    <Stack direction="row" spacing={3} alignItems="center" sx={{ mr: 4 }}>
                        <Link
                            href="#"
                            underline="hover"
                            onClick={(e)=>{ e.preventDefault(); handleExportCSV(); }}
                            sx={{ fontWeight:700, color:'#3f51b5' }}
                        >
                            Export CSV
                        </Link>
                        <Link
                            href="#"
                            underline="hover"
                            onClick={(e)=>{ e.preventDefault(); handleExportPDF(); }}
                            sx={{ fontWeight:700, color:'#3f51b5' }}
                        >
                            Strategic Report
                        </Link>
                    </Stack>
                </Stack>
            </Paper>

            {/* EPS 选中时不渲染图表 */}
            {!isModeEPS && (
                <>
                    {/* 第一行：by Year / by Company */}
                    <Box sx={{
                        mt: 2, width: "100%",
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2
                    }}>
                        {/* 左：by Year */}
                        <Box sx={{ minWidth: 0 }}>
                            <ChartPanel title={`${baseForTop} — by Year`}>
                                <Box key={`top-left|${chartKey}`} sx={{ width:'100%', minWidth: 0 }}>
                                    <ResponsiveContainer width="100%" height={360}>
                                        {chartType === "bar" ? (
                                            <ComposedChart
                                                data={byYear.map((row)=>{
                                                    const ia = industryAvgByYear.find(r=>r.year===row.year)?.avg ?? 0;
                                                    return { ...row, "Industry Avg": ia };
                                                })}
                                                margin={{ top: 12, right: 28, left: 16, bottom: 50 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="year" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <ReferenceArea y1={quartilesTop.q1} y2={quartilesTop.q3} strokeOpacity={0} fill="#6F79A8" fillOpacity={0.08} />
                                                {companies.map((c,i)=>(
                                                    <Bar key={c} dataKey={c} name={c} fill={COLORS[i%COLORS.length]} />
                                                ))}
                                                <Line type="monotone" dataKey="Industry Avg" stroke="#444" strokeDasharray="5 5" dot={false} />
                                            </ComposedChart>
                                        ) : (
                                            <LineChart
                                                data={byYear.map((row)=>{
                                                    const ia = industryAvgByYear.find(r=>r.year===row.year)?.avg ?? 0;
                                                    return { ...row, "Industry Avg": ia };
                                                })}
                                                margin={{ top: 12, right: 28, left: 16, bottom: 50 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="year" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <ReferenceArea y1={quartilesTop.q1} y2={quartilesTop.q3} strokeOpacity={0} fill="#6F79A8" fillOpacity={0.08} />
                                                {companies.map((c,i)=>(
                                                    <Line key={c} type="monotone" dataKey={c} stroke={COLORS[i%COLORS.length]} dot={false} strokeWidth={2}/>
                                                ))}
                                                <Line type="monotone" dataKey="Industry Avg" stroke="#444" strokeDasharray="5 5" dot={false} />
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </Box>
                            </ChartPanel>
                        </Box>

                        {/* 右：by Company */}
                        <Box sx={{ minWidth: 0 }}>
                            <ChartPanel title={`${baseForTop} — by Company`}>
                                <Box key={`top-right|${chartKey}`} sx={{ width:'100%', minWidth: 0 }}>
                                    <ResponsiveContainer width="100%" height={360}>
                                        {chartType === "bar" ? (
                                            <ComposedChart
                                                data={byCompany}
                                                margin={{ top: 12, right: 20, left: 16, bottom: 50 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="company" interval={0} tick={{ fontSize: 12 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <ReferenceArea y1={quartilesTop.q1} y2={quartilesTop.q3} strokeOpacity={0} fill="#6F79A8" fillOpacity={0.08} />
                                                {raw.years.map((y,i)=>(
                                                    <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[i%YEAR_COLORS.length]} />
                                                ))}
                                            </ComposedChart>
                                        ) : (
                                            <LineChart
                                                data={byCompany}
                                                margin={{ top: 12, right: 20, left: 16, bottom: 50 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="company" interval={0} tick={{ fontSize: 12 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <ReferenceArea y1={quartilesTop.q1} y2={quartilesTop.q3} strokeOpacity={0} fill="#6F79A8" fillOpacity={0.08} />
                                                {raw.years.map((y,i)=>(
                                                    <Line key={y} type="monotone" dataKey={String(y)} name={String(y)} stroke={YEAR_COLORS[i%YEAR_COLORS.length]} dot={false} />
                                                ))}
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </Box>
                            </ChartPanel>
                        </Box>
                    </Box>

                    {/* 第二行：Growth + （可选）Margin */}
                    <Box sx={{
                        mt: 2, width: "100%",
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: showMargin ? '1fr 1fr' : '1fr' },
                        gap: 2
                    }}>
                        {/* Growth */}
                        <Box sx={{ minWidth: 0 }}>
                            <ChartPanel title={`${growthMetric} Growth`}>
                                <Box key={`g|${chartKey}`} sx={{ width:"100%", minWidth: 0, bgcolor:'#111', borderRadius: 1 }}>
                                    <ResponsiveContainer width="100%" height={420}>
                                        <LineChart data={growth} margin={{ top: 16, right: 28, left: 16, bottom: 50 }}>
                                            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                                            <XAxis dataKey="year" stroke="#ddd" tick={{ fill:'#ddd' }} />
                                            <YAxis tickFormatter={(v)=>`${Math.round(v)}%`} stroke="#ddd" tick={{ fill:'#ddd' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor:'#1f1f1f', border:'none', color:'#fff' }}
                                                labelStyle={{ color:'#fff' }}
                                                formatter={(v)=> `${Math.round(v*10)/10}%`}
                                            />
                                            <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12, color:'#fff' }} />
                                            <defs>
                                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur"/>
                                                        <feMergeNode in="SourceGraphic"/>
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            {companies.map((c,i)=> (
                                                <Line
                                                    key={c}
                                                    type="monotone"
                                                    dataKey={c}
                                                    stroke={COLORS[i%COLORS.length]}
                                                    strokeWidth={3}
                                                    dot={false}
                                                    filter="url(#glow)"
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </ChartPanel>
                        </Box>

                        {/* Margin（仅在支持时渲染） */}
                        {showMargin && (
                            <Box sx={{ minWidth: 0 }}>
                                <ChartPanel title={`${metricSel} Margin`}>
                                    <Box key={`m|${chartKey}`} sx={{ width:"100%", minWidth: 0, bgcolor:'#111', borderRadius: 1 }}>
                                        <ResponsiveContainer width="100%" height={420}>
                                            <LineChart data={margin} margin={{ top: 16, right: 28, left: 16, bottom: 50 }}>
                                                <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                                                <XAxis dataKey="year" stroke="#ddd" tick={{ fill:'#ddd' }} />
                                                <YAxis tickFormatter={(v)=>`${Math.round(v)}%`} stroke="#ddd" tick={{ fill:'#ddd' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor:'#1f1f1f', border:'none', color:'#fff' }}
                                                    labelStyle={{ color:'#fff' }}
                                                    formatter={(v)=> `${Math.round(v*10)/10}%`}
                                                />
                                                <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12, color:'#fff' }} />
                                                <defs>
                                                    <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                                                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                                                        <feMerge>
                                                            <feMergeNode in="coloredBlur"/>
                                                            <feMergeNode in="SourceGraphic"/>
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                {companies.map((c,i)=> (
                                                    <Line
                                                        key={c}
                                                        type="monotone"
                                                        dataKey={c}
                                                        stroke={COLORS[i%COLORS.length]}
                                                        strokeWidth={3}
                                                        dot={false}
                                                        filter="url(#glow2)"
                                                    />
                                                ))}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </ChartPanel>
                            </Box>
                        )}
                    </Box>
                </>
            )}

            {/* 文本区块（保持不变） */}
            <Paper elevation={0} sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid #e0e0e0', width:"100%" }}>
                <Typography sx={{
                    mb: 1, fontWeight: 700, color: "#6464A0",
                    textDecoration: "underline", textUnderlineOffset: 3
                }}>
                    Strategic Direction
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        placeholder="AI will synthesize the one-page strategic direction here…"
                    />
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e0e0e0', width:"100%" }}>
                <Typography sx={{
                    mb: 1, fontWeight: 700, color: "#6464A0",
                    textDecoration: "underline", textUnderlineOffset: 3
                }}>
                    Tactical Actions
                </Typography>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>AI will synthesize</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {`AI generation`}
                </Typography>
            </Paper>
        </Box>
    );
}
