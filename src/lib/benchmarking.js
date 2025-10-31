// src/lib/benchmarking.js

/** ---- 数据模型（与 BRD 对齐）----
 * Indicator: { key, label, category }
 * Datum: { indicatorKey, company: number, competitors: [{name, value}] }
 * Benchmarks 通过数据计算得到：lowest / median / highest
 */

export const INDICATORS = [
    { key: "market_share",        label: "Market Share (%)",           category: "Market Share" },
    { key: "relative_share",      label: "Relative Market Share",      category: "Market Share" },
    { key: "market_share_growth", label: "Market Share Growth (%)",    category: "Market Share" },
    { key: "penetration_rate",    label: "Market Penetration Rate",    category: "Market Reach" },
    { key: "awareness",           label: "Brand Awareness / Recall",   category: "Market Reach" },
    { key: "customer_base",       label: "Customer Base Size",         category: "Market Reach" },
    { key: "website_traffic",     label: "Website Traffic (Monthly)",  category: "Market Reach" },
    { key: "digital_reach",       label: "Digital Reach (Mio)",         category: "Market Reach" },
    { key: "social_reach",        label: "Social Media Reach",         category: "Market Reach" },
    { key: "geo_penetration",     label: "Geographic Penetration (%)", category: "Market Reach" },
    { key: "geo_coverage",        label: "Geographic Coverage (#)",    category: "Market Reach" },
    { key: "channel_penetration", label: "Distribution Channel Penetration (%)", category: "Market Reach" },
    { key: "sov",                 label: "Share of Voice (SOV) (%)",   category: "Market Positioning" },
    { key: "csat",                label: "Customer Satisfaction (CSAT) (%)", category: "Market Positioning" },
    { key: "nps",                 label: "Net Promoter Score (NPS)",   category: "Market Positioning" },
];

/** ---- Mock 数据（可替换为后端返回）----
 * 注意：百分比型字段控制在 0~100 内，避免超过 100%（呼应你同学的反馈）
 */
const C = ["Top Competitor 1", "Top Competitor 2", "Top Competitor 3", "Top Competitor 4"];

function clampPct(n) { return Math.max(0, Math.min(100, Number(n))); }

export const MOCK = [
    d("market_share",        19,   [20, 18, 15, 10].map(clampPct)),
    d("relative_share",      60,   [100,90,75,50]),
    d("market_share_growth", 2.0,  [3.0, 1.0, 1.5, 0.5]),
    d("penetration_rate",    18,   [28,25,22,18]),
    d("awareness",           35,   [55,45,50,46].map(clampPct)),
    d("customer_base",       75000,[125000,110000,95000,70000]),
    d("website_traffic",     180000,[250000,200000,189999,165000]),
    d("digital_reach",       2100000,[3500000,3000000,2400000,2000000]),
    d("social_reach",        850000,[1600000,1300000,1100000,900000]),
    d("geo_penetration",     40,    [65,55,60,63].map(clampPct)),
    d("geo_coverage",        6,     [8,7,8,7]),
    d("channel_penetration", 60,    [80,75,70,75]),
    d("sov",                 10,    [22,20,18,20]),
    d("csat",                78,    [85,82,81,80].map(clampPct)),
    d("nps",                 22,    [30,28,27,26]),
];

function d(key, companyValue, compValues) {
    return {
        indicatorKey: key,
        company: companyValue,
        competitors: C.map((name, i) => ({ name, value: compValues[i] })),
    };
}

/** ---- 计算工具 ---- */
export function pickIndicator(key) {
    return INDICATORS.find(x => x.key === key);
}

export function getSeriesFor(key, data = MOCK) {
    return data.find(d => d.indicatorKey === key);
}

export function calcBenchmarks(series) {
    const values = [
        series.company,
        ...series.competitors.map(c => c.value),
    ].map(Number).filter(v => Number.isFinite(v));
    values.sort((a,b)=>a-b);
    const lowest = values[0] ?? 0;
    const highest = values[values.length-1] ?? 0;
    const median = values.length
        ? (values.length % 2
            ? values[(values.length-1)/2]
            : (values[values.length/2-1] + values[values.length/2]) / 2)
        : 0;
    return { lowest, median, highest };
}

/** Gap: 公司 vs 市场领导者（max） */
export function calcGap(series) {
    const leader = Math.max(series.company, ...series.competitors.map(c=>c.value));
    return { leader, gap: leader - series.company };
}

/** UI 图标：强/中/弱（Low/Med/High） */
export function strengthIcon(value, lowest, median, highest) {
    if (value >= median && value >= (lowest + (highest-lowest)*0.75)) return "▲ strong";
    if (value >= median) return "■ avg";
    return "▼ weak";
}

/** 导出 CSV（无需额外依赖） */
export function exportCsv(rows, filename="benchmark.csv") {
    const header = Object.keys(rows[0] || {}).join(",");
    const lines = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

/** 将 series 转成导出行 */
export function rowsFromSeries(series, benchmarks) {
    return [
        { Field: "Indicator", Value: series.indicatorKey },
        { Field: "Company", Value: series.company },
        ...series.competitors.map(c => ({ Field: c.name, Value: c.value })),
        { Field: "Industry Lowest", Value: benchmarks.lowest },
        { Field: "Industry Median", Value: benchmarks.median },
        { Field: "Industry Highest", Value: benchmarks.highest },
    ];
}
