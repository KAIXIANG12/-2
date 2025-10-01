import * as React from "react";
import {
    Box, Paper, Typography, Stack, Link,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Grid, TextField
} from "@mui/material";
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
    LineChart, Line
} from "recharts";

/* ---------------- Demo 数据 ---------------- */
const DATA = {
    companies: ["Your Company","Competitor 1","Competitor 2","Competitor 3","Competitor 4","Competitor 5"],
    years: [2020,2021,2022,2023,2024],
    metrics: ["Sales Revenue","COGS","SG&A","R&D","EBIT","Net Income","EPS","Gross Income","EBITDA"],
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
        "EBIT": {
            "Your Company": {"2020": 120, "2021": 110, "2022": 95, "2023": 105, "2024": 98},
            "Competitor 1": {"2020": 200, "2021": 210, "2022": 230, "2023": 280, "2024": 310},
            "Competitor 2": {"2020": 90, "2021": 30, "2022": -45, "2023": -20, "2024": 80},
            "Competitor 3": {"2020": 140, "2021": 130, "2022": 190, "2023": 240, "2024": 260},
            "Competitor 4": {"2020": 60, "2021": 40, "2022": -20, "2023": 30, "2024": 40},
            "Competitor 5": {"2020": 80, "2021": 70, "2022": 60, "2023": 65, "2024": 70}
        },
        "Net Income": {
            "Your Company": {"2020": 80, "2021": 76, "2022": 60, "2023": 68, "2024": 64},
            "Competitor 1": {"2020": 140, "2021": 150, "2022": 160, "2023": 180, "2024": 200},
            "Competitor 2": {"2020": 60, "2021": 20, "2022": -50, "2023": -10, "2024": 50},
            "Competitor 3": {"2020": 85, "2021": 80, "2022": 130, "2023": 160, "2024": 180},
            "Competitor 4": {"2020": 30, "2021": 22, "2022": -15, "2023": 18, "2024": 24},
            "Competitor 5": {"2020": 55, "2021": 50, "2022": 45, "2023": 48, "2024": 52}
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
            "Competitor 2": {"2020": 120, "2021": 50, "2022": -30, "2023": 5, "2024": 110},
            "Competitor 3": {"2020": 170, "2021": 160, "2022": 220, "2023": 270, "2024": 290},
            "Competitor 4": {"2020": 90, "2021": 70, "2022": 10, "2023": 50, "2024": 60},
            "Competitor 5": {"2020": 110, "2021": 100, "2022": 95, "2023": 100, "2024": 105}
        }
    }
};

const METRIC_LIST = ["Sales Revenue","COGS","SG&A","R&D","EBIT","Net Income","EPS","Gross Income","EBITDA"];
const MARGINABLE = new Set(["Gross Income","EBIT","Pretax Income","Net Income","EBITDA"]);
const COLORS = ["#d43d51","#7A64D8","#2FA7D9","#5DBB63","#E0A100","#7A7A8C","#B35C9D"];
const YEAR_COLORS = ["#6F7FB8","#8898CF","#A3B0DE","#C1C9EB","#DEE2F6"];

/* ---------------- 数据构造 ---------------- */
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

/* ---------------- 图卡外壳 ---------------- */
function ChartPanel({ title, children }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                width: "100%",
                display: "block",
                borderRadius: 2,
                overflow: "hidden"
            }}
        >
            <Box sx={{ px: 1.5, py: 0.75, bgcolor:'#6F79A8', color:'#fff', fontWeight:700, fontSize:14 }}>
                {title}
            </Box>
            <Box sx={{ p: 1.5, width:"100%" }}>
                {children}
            </Box>
        </Paper>
    );
}

/* ---------------- 页面 ---------------- */
export default function FinancialComparativeAnalysis(){
    const [raw] = React.useState(DATA);
    const [metric, setMetric] = React.useState("EBIT");
    const [companies, setCompanies] = React.useState(DATA.companies.slice(0,5)); // ≤7

    const allowedMetrics = raw.metrics?.length ? METRIC_LIST.filter(m=> raw.metrics.includes(m)) : METRIC_LIST;

    const byYear     = React.useMemo(()=> buildSeries(raw, metric, companies), [raw, metric, companies]);
    const byCompany  = React.useMemo(()=> buildByCompany(raw, metric, companies), [raw, metric, companies]);
    const growth     = React.useMemo(()=> buildGrowthSeries(raw, metric, companies), [raw, metric, companies]);
    const margin     = React.useMemo(()=> MARGINABLE.has(metric) ? buildMarginSeries(raw, metric, companies) : null, [raw, metric, companies]);

    return (
        <Box sx={{ width:"100%" }}>
            {/* 工具条 */}
            <Paper variant="outlined" sx={{ p:2, width:"100%" }}>
                {/* ✅ 新增：按钮行在选择框上方 */}
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Link component="button" underline="hover" onClick={()=>alert('Add competitor')} sx={{ fontWeight:600 }}>
                        Add Competitor
                    </Link>
                    <Link component="button" underline="hover" onClick={()=>alert('Import')} >
                        Import
                    </Link>
                </Stack>

                {/* 原有选择框行 + Strategic Report */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ flexWrap:'wrap' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap:'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 260 }}>
                            <InputLabel id="metric">Select Financial Metric</InputLabel>
                            <Select labelId="metric" value={metric} label="Select Financial Metric" onChange={e=>setMetric(e.target.value)}>
                                {allowedMetrics.map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}
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

                    {/* 右上角 Strategic Report 链接（保持原来的 mr:4） */}
                    <Link
                        href="#"
                        underline="hover"
                        onClick={(e)=>{ e.preventDefault(); alert('Strategic Report (export)'); }}
                        sx={{ fontWeight:700, color:'#3f51b5', mr: 4 }}
                    >
                        Strategic Report
                    </Link>
                </Stack>
            </Paper>

            {/* 顶部两张柱图：左 8 / 右 4 */}
            <Grid container spacing={2} sx={{ mt: 0, width:"100%" }}>
                <Grid item xs={12} md={8} sx={{ width:"100%" }}>
                    <ChartPanel title={`${metric} — by Year`}>
                        <Box sx={{ width:"100%", minWidth: 720 }}>
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart
                                    data={byYear}
                                    barCategoryGap="20%"
                                    barGap={6}
                                    margin={{ top: 12, right: 16, left: 8, bottom: 28 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                    {companies.map((c,i)=>(
                                        <Bar key={c} dataKey={c} name={c} fill={COLORS[i%COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </ChartPanel>
                </Grid>

                <Grid item xs={12} md={4} sx={{ width:"100%" }}>
                    <ChartPanel title={`${metric} — by Company`}>
                        <Box sx={{ width:"100%", minWidth: 480 }}>
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart
                                    data={byCompany}
                                    barCategoryGap="28%"
                                    barGap={4}
                                    margin={{ top: 12, right: 8, left: 0, bottom: 28 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="company" interval={0} tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                    {raw.years.map((y,i)=>(
                                        <Bar key={y} dataKey={String(y)} name={String(y)} fill={YEAR_COLORS[i%YEAR_COLORS.length]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </ChartPanel>
                </Grid>
            </Grid>

            {/* 下部两张折线：黑底 + 发光 */}
            <Grid container spacing={2} sx={{ mt: 0, width:"100%" }}>
                <Grid item xs={12} md={6} sx={{ width:"100%" }}>
                    <ChartPanel title={`${metric} Growth`}>
                        <Box sx={{ width:"100%", minWidth: 600, bgcolor:'#111', borderRadius: 1 }}>
                            <ResponsiveContainer width="100%" height={420}>
                                <LineChart data={growth} margin={{ top: 12, right: 16, left: 8, bottom: 28 }}>
                                    <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                                    <XAxis dataKey="year" stroke="#ddd" tick={{ fill:'#ddd' }} />
                                    <YAxis tickFormatter={(v)=>`${Math.round(v)}%`} stroke="#ddd" tick={{ fill:'#ddd' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor:'#1f1f1f', border:'none', color:'#fff' }}
                                        labelStyle={{ color:'#fff' }}
                                        formatter={(v)=> `${Math.round(v*10)/10}%`}
                                    />
                                    <Legend verticalAlign="bottom" height={24} iconSize={8}
                                            wrapperStyle={{ fontSize: 12, color:'#fff' }} />
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
                </Grid>

                <Grid item xs={12} md={6} sx={{ width:"100%" }}>
                    <ChartPanel title={`${metric} Margin`}>
                        <Box sx={{ width:"100%", minWidth: 600, bgcolor:'#111', borderRadius: 1 }}>
                            {margin ? (
                                <ResponsiveContainer width="100%" height={420}>
                                    <LineChart data={margin} margin={{ top: 12, right: 16, left: 8, bottom: 28 }}>
                                        <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                                        <XAxis dataKey="year" stroke="#ddd" tick={{ fill:'#ddd' }} />
                                        <YAxis tickFormatter={(v)=>`${Math.round(v)}%`} stroke="#ddd" tick={{ fill:'#ddd' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor:'#1f1f1f', border:'none', color:'#fff' }}
                                            labelStyle={{ color:'#fff' }}
                                            formatter={(v)=> `${Math.round(v*10)/10}%`}
                                        />
                                        <Legend verticalAlign="bottom" height={24} iconSize={8}
                                                wrapperStyle={{ fontSize: 12, color:'#fff' }} />
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
                            ) : (
                                <Box p={2} color="#bbb" sx={{ minHeight: 420, display:'flex', alignItems:'center' }}>
                                    Margin chart applies to: Gross Income, EBIT, Pretax Income, Net Income, EBITDA.
                                </Box>
                            )}
                        </Box>
                    </ChartPanel>
                </Grid>
            </Grid>

            {/* 文本区块：上下排 */}
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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>1. Elevate Product Leadership</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {`Hero Capsules: Launch tightly curated, design-forward collections…
Brand-Building Collaborations: Introduce designer partnerships and expand private-label to ~40% of mix.
Quality Upgrade: Enhance specifications and introduce extended warranties to signal confidence.
Data-Driven Development: Use consumer insights, returns analysis, and search data to shorten design cycles and sharpen relevance.
Impact: Increases product credibility, enables premium pricing, and builds earned media visibility.`}
                </Typography>
            </Paper>
        </Box>
    );
}
