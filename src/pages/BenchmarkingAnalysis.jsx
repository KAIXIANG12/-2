// src/pages/BenchmarkingAnalysis.jsx
import * as React from "react";
import Plot from "react-plotly.js";
import {
    Box, Paper, Stack, Typography, Select, MenuItem,
    Button, Tooltip, Table, TableHead, TableBody, TableRow, TableCell,
    Grid, Snackbar, Alert, IconButton, Chip, Divider
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { jsPDF } from "jspdf";

import {
    INDICATORS, MOCK, pickIndicator, getSeriesFor, calcBenchmarks,
    calcGap, exportCsv, rowsFromSeries
} from "../lib/benchmarking";

/** —— 页面：Market Reach → Industry Benchmarks —— */
export default function BenchmarkingAnalysis() {
    const [indicatorKey, setIndicatorKey] = React.useState(INDICATORS[0].key);
    const [overrides, setOverrides] = React.useState({});
    const [toast, setToast] = React.useState({ open: false, type: "success", msg: "" });

    const rawSeries = React.useMemo(() => getSeriesFor(indicatorKey, MOCK), [indicatorKey]);
    const series = React.useMemo(() => applyOverrides(rawSeries, overrides), [rawSeries, overrides]);
    const bm = React.useMemo(() => calcBenchmarks(series), [series]);
    const gap = React.useMemo(() => calcGap(series), [series]);

    const missingCount = React.useMemo(
        () => series.competitors.filter(c => c.value === null || c.value === undefined || c.value === "").length,
        [series]
    );

    const barRef = React.useRef(null);
    const gapRef = React.useRef(null);

    /** 导出：PDF */
    const exportPDF = async () => {
        try {
            const barPng = await toImage(barRef);
            const gapPng = await toImage(gapRef);
            const ind = pickIndicator(indicatorKey);

            const doc = new jsPDF({ unit: "pt", format: "a4" });
            const W = doc.internal.pageSize.getWidth();
            const M = 40;

            doc.setFont("helvetica", "bold"); doc.setFontSize(18);
            doc.text("Market Reach Benchmarking Report", M, 50);
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            doc.text(`Indicator: ${ind?.category} — ${ind?.label}`, M, 68);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, M, 82);
            doc.setDrawColor("#d1d8e0"); doc.line(M, 92, W - M, 92);

            doc.setFont("helvetica", "bold"); doc.setFontSize(11);
            doc.text("Key Metrics", M, 112);
            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
            let y = 128;
            const stats = [
                ["Industry Lowest", fmt(bm.lowest)],
                ["Industry Median", fmt(bm.median)],
                ["Industry Highest", fmt(bm.highest)],
                ["Our Company", fmt(series.company)],
                ["Gap vs Leader", fmt(gap.gap)]
            ];
            stats.forEach(([k, v]) => {
                doc.text(k, M, y);
                doc.text(v, M + 180, y);
                y += 14;
            });

            y += 10;
            doc.setFont("helvetica", "bold"); doc.setFontSize(11);
            doc.text("Benchmark Comparison", M, y);
            y += 8;
            const barW = W - M * 2;
            const barH = 160;
            doc.addImage(barPng, "PNG", M, y, barW, barH, undefined, "FAST");
            y += barH + 16;

            if (y + 180 > doc.internal.pageSize.getHeight() - M) {
                doc.addPage(); y = M;
            }
            doc.setFont("helvetica", "bold"); doc.setFontSize(11);
            doc.text("Gap Analysis", M, y);
            y += 8;
            doc.addImage(gapPng, "PNG", M, y, barW, 140, undefined, "FAST");
            y += 150;

            if (y + 80 > doc.internal.pageSize.getHeight() - M) {
                doc.addPage(); y = M;
            }
            doc.setFont("helvetica", "bold"); doc.setFontSize(11);
            doc.text("Strategic Insights", M, y);
            y += 14;
            doc.setFont("helvetica", "normal"); doc.setFontSize(9);
            wrapText(doc,
                `For ${ind?.label}: Performance gap vs market leader is ${fmt(gap.gap)}. Priority actions: (1) Enhance digital presence and web traffic, (2) Expand distribution channels in untapped segments, (3) Launch targeted brand awareness campaigns.`,
                M, y, W - M * 2, 12
            );

            doc.save(`benchmark_report_${indicatorKey}.pdf`);
            setToast({ open: true, type: "success", msg: "PDF report exported successfully" });
        } catch (e) {
            setToast({ open: true, type: "error", msg: "PDF export failed: " + e.message });
        }
    };

    /** 导入：CSV */
    const fileInputRef = React.useRef(null);
    const onChooseCSV = () => fileInputRef.current?.click();

    const onImportCSV = async (evt) => {
        const file = evt.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = parseCSV(text);
            if (!parsed.length || !("Entity" in parsed[0]) || !("Value" in parsed[0])) {
                throw new Error("Invalid CSV format. Expected columns: Entity, Value");
            }

            const validNames = new Set(["Our Company", ...rawSeries.competitors.map(c => c.name)]);
            const next = {};
            parsed.forEach(r => {
                const name = String(r.Entity).trim();
                const v = r.Value === "" ? null : Number(r.Value);
                if (validNames.has(name) && v !== null && !Number.isNaN(v)) next[name] = v;
            });

            if (Object.keys(next).length === 0) {
                throw new Error("No valid data found in CSV");
            }

            setOverrides(prev => ({ ...prev, ...next }));
            setToast({ open: true, type: "success", msg: `CSV imported: ${Object.keys(next).length} values updated` });
        } catch (e) {
            setToast({ open: true, type: "error", msg: e.message });
        } finally {
            evt.target.value = "";
        }
    };

    return (
        <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: "#f4f6f8", minHeight: "100vh" }}>
            {/* 顶部标题栏 - 超紧凑 */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a2332", mb: 0, fontSize: "1.1rem", lineHeight: 1.3 }}>
                        Industry Benchmarking Analysis
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6c7a89", fontSize: "0.7rem" }}>
                        Competitive Intelligence → Market Reach
                    </Typography>
                </Box>
                <Chip
                    icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                    label={`${INDICATORS.length} Indicators`}
                    size="small"
                    sx={{ bgcolor: "#5c6bc0", color: "#fff", fontWeight: 600, height: 24, fontSize: "0.7rem" }}
                />
            </Stack>

            {/* 控制面板 - 超紧凑单行 */}
            <Paper elevation={0} sx={{ p: 1.25, mb: 1.5, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, width: { xs: "100%", md: "auto" } }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#5a6c7d", fontSize: "0.75rem" }}>
                            Indicator:
                        </Typography>
                        <Select
                            size="small"
                            value={indicatorKey}
                            onChange={(e) => { setIndicatorKey(e.target.value); setOverrides({}); }}
                            sx={{
                                flex: 1,
                                minWidth: { xs: 200, md: 280 },
                                fontSize: "0.8rem",
                                "& .MuiSelect-select": { py: 0.6 },
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d8e0" }
                            }}
                        >
                            {INDICATORS.map(ind => (
                                <MenuItem key={ind.key} value={ind.key} sx={{ fontSize: "0.8rem" }}>
                                    {ind.category} — {ind.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Stack>

                    <Stack direction="row" spacing={0.75}>
                        <Tooltip title="Import CSV data">
                            <IconButton
                                size="small"
                                onClick={onChooseCSV}
                                sx={{
                                    border: "1px solid #d1d8e0",
                                    borderRadius: 1,
                                    p: 0.5,
                                    "&:hover": { bgcolor: "#f8f9fa", borderColor: "#6c7a89" }
                                }}
                            >
                                <UploadFileOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Export CSV">
                            <IconButton
                                size="small"
                                onClick={() => exportCsv(rowsFromSeries(series, bm), `benchmark_${indicatorKey}.csv`)}
                                sx={{
                                    border: "1px solid #d1d8e0",
                                    borderRadius: 1,
                                    p: 0.5,
                                    "&:hover": { bgcolor: "#f8f9fa", borderColor: "#6c7a89" }
                                }}
                            >
                                <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 14 }} />}
                            onClick={exportPDF}
                            sx={{
                                textTransform: "none",
                                bgcolor: "#5c6bc0",
                                fontSize: "0.75rem",
                                px: 1.25,
                                py: 0.4,
                                minHeight: 28,
                                "&:hover": { bgcolor: "#3f51b5" }
                            }}
                        >
                            Export PDF
                        </Button>
                    </Stack>
                </Stack>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={onImportCSV} style={{ display: "none" }} />
            </Paper>

            {/* 相对比例尺卡片 - 修复显示问题 */}
            <RelativeScaleCard indicatorKey={indicatorKey} bm={bm} company={series.company} gap={gap} />

            {/* 主内容区 - 最小间距 */}
            <Grid container spacing={1.25}>
                {/* 左侧：图表 */}
                <Grid item xs={12} lg={8}>
                    <Stack spacing={1.25}>
                        {/* 对比条形图 */}
                        <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a2332", fontSize: "0.85rem" }}>
                                    Performance Comparison
                                </Typography>
                                <Stack direction="row" spacing={0.75}>
                                    <Chip label={`Median: ${fmt(bm.median)}`} size="small" sx={{ fontSize: "0.65rem", height: 20, px: 0.5 }} />
                                    <Chip label={`Gap: ${fmt(gap.gap)}`} size="small" color="error" sx={{ fontSize: "0.65rem", height: 20, px: 0.5 }} />
                                </Stack>
                            </Stack>
                            <Box sx={{ height: { xs: 240, sm: 260, md: 280 } }}>
                                <BenchmarkBar ref={barRef} indicatorKey={indicatorKey} company={series.company} bm={bm} />
                            </Box>
                        </Paper>

                        {/* 详细表格 */}
                        <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700, color: "#1a2332", fontSize: "0.85rem" }}>
                                Detailed Performance Metrics
                            </Typography>
                            <DetailedTable indicatorKey={indicatorKey} series={series} bm={bm} />
                        </Paper>
                    </Stack>
                </Grid>

                {/* 右侧：信息面板 - 超紧凑 */}
                <Grid item xs={12} lg={4}>
                    <Stack spacing={1.25}>
                        {/* 统计卡片 */}
                        <BenchmarkStatsCard bm={bm} company={series.company} gap={gap} />

                        {/* Gap 分析 */}
                        <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "#1a2332", fontSize: "0.85rem" }}>
                                Gap vs Market Leader
                            </Typography>
                            <Box sx={{ height: 180 }}>
                                <GapPlot ref={gapRef} company={series.company} gap={gap} />
                            </Box>
                        </Paper>

                        {/* AI 洞察 */}
                        <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#f8f9fb", borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 14, color: "#5c6bc0" }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a2332", fontSize: "0.8rem" }}>
                                    AI Insights
                                </Typography>
                            </Stack>
                            <AIInsights indicatorKey={indicatorKey} gap={gap} />
                        </Paper>

                        {/* 数据源 */}
                        <DataSourceInfo />
                    </Stack>
                </Grid>
            </Grid>

            {/* 仅在缺失数据时显示提示框（去掉空的绿框） */}
            {missingCount > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5, mt: 1.25,
                        bgcolor: "#fff9e6",
                        border: "1px solid #ffc107",
                        borderRadius: 1.5
                    }}
                >
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#f57c00", fontSize: "0.8rem" }}>
                            ⚠ {missingCount} missing field(s)
                        </Typography>
                        <Stack direction="row" spacing={0.75} sx={{ ml: { md: "auto" } }}>
                            <Button
                                size="small" variant="outlined"
                                onClick={() => exportCsv(rowsFromSeries(series, bm), "template.csv")}
                                sx={{
                                    textTransform: "none",
                                    fontSize: "0.7rem",
                                    py: 0.4,
                                    px: 1.25,
                                    minHeight: 26,
                                    borderColor: "#f57c00",
                                    color: "#f57c00"
                                }}
                            >
                                Template
                            </Button>
                            <Button
                                size="small" variant="outlined"
                                onClick={onChooseCSV}
                                sx={{
                                    textTransform: "none",
                                    fontSize: "0.7rem",
                                    py: 0.4,
                                    px: 1.25,
                                    minHeight: 26,
                                    borderColor: "#f57c00",
                                    color: "#f57c00"
                                }}
                            >
                                Upload
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            )}

            <Snackbar
                open={toast.open}
                onClose={() => setToast({ ...toast, open: false })}
                autoHideDuration={2500}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setToast({ ...toast, open: false })}
                    severity={toast.type}
                    variant="filled"
                    sx={{ width: "100%", fontSize: "0.8rem" }}
                >
                    {toast.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

/** ---------- 子组件们 ---------- */

function RelativeScaleCard({ indicatorKey, bm, company, gap }) {
    const min = bm.lowest, max = bm.highest || 1;
    const norm = (v) => Math.max(0, Math.min(1, (Number(v) - min) / (max - min || 1)));
    const indicator = pickIndicator(indicatorKey);

    return (
        <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#fff", mb: 1.25, borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a2332", fontSize: "0.85rem" }}>
                    Relative Position — {indicator?.label}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        label={`vs Median: ${fmt(Math.abs(bm.median - company))}`}
                        size="small"
                        color={company >= bm.median ? "success" : "default"}
                        sx={{ fontSize: "0.65rem", height: 20, fontWeight: 600, px: 0.75 }}
                    />
                    <Chip
                        label={`vs Leader: ${fmt(gap.leader - company)}`}
                        size="small"
                        color="error"
                        sx={{ fontSize: "0.65rem", height: 20, fontWeight: 600, px: 0.75 }}
                    />
                </Stack>
            </Stack>

            {/* 修复后的渐变条 - 固定高度和标记位置 */}
            <Box sx={{ position: "relative", height: 95, mb: 0.5 }}>
                {/* 渐变背景条 */}
                <Box sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 40,
                    height: 32,
                    borderRadius: 1.5,
                    background: "linear-gradient(90deg, #e74c3c 0%, #f39c12 30%, #f1c40f 50%, #95c93d 70%, #27ae60 100%)",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
                }} />

                {/* 标记点容器 */}
                <Box sx={{ position: "relative", height: "100%" }}>
                    {/* Industry Lowest */}
                    <ScaleMark
                        x={norm(min)}
                        value={fmt(min)}
                        label="Low"
                        type="circle"
                        color="#2c3e50"
                    />

                    {/* Industry Median */}
                    <ScaleMark
                        x={norm(bm.median)}
                        value={fmt(bm.median)}
                        label="Median"
                        type="triangle"
                        color="#2c3e50"
                    />

                    {/* Industry Highest */}
                    <ScaleMark
                        x={norm(max)}
                        value={fmt(max)}
                        label="High"
                        type="circle"
                        color="#2c3e50"
                    />

                    {/* Our Company - 突出显示 */}
                    <ScaleMark
                        x={norm(company)}
                        value={fmt(company)}
                        label="Us"
                        type="diamond"
                        color="#2563eb"
                        highlight
                    />
                </Box>
            </Box>
        </Paper>
    );
}

function ScaleMark({ x, value, label, type, color, highlight = false }) {
    return (
        <Box
            sx={{
                position: "absolute",
                left: `${x * 100}%`,
                top: 0,
                transform: "translateX(-50%)",
                textAlign: "center",
                zIndex: highlight ? 10 : 5,
                width: 60
            }}
        >
            {/* 顶部标签 */}
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    fontSize: "0.65rem",
                    fontWeight: highlight ? 700 : 600,
                    color: color,
                    mb: 0.25,
                    lineHeight: 1.2
                }}
            >
                {label}
            </Typography>

            {/* 数值 */}
            <Typography
                variant="caption"
                sx={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: color,
                    mb: 0.5
                }}
            >
                {value}
            </Typography>

            {/* 标记图形 */}
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 32
            }}>
                {type === "circle" && (
                    <Box sx={{
                        width: 10,
                        height: 10,
                        bgcolor: "#fff",
                        border: `2px solid ${color}`,
                        borderRadius: "50%",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }} />
                )}

                {type === "triangle" && (
                    <Box sx={{
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: `10px solid ${color}`,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
                    }} />
                )}

                {type === "diamond" && (
                    <Box sx={{
                        width: 14,
                        height: 14,
                        bgcolor: color,
                        transform: "rotate(45deg)",
                        border: "2px solid #fff",
                        boxShadow: "0 2px 6px rgba(37, 99, 235, 0.4)"
                    }} />
                )}
            </Box>

            {/* 底部连线 */}
            <Box sx={{
                width: 2,
                height: 10,
                bgcolor: color,
                mx: "auto",
                opacity: 0.5
            }} />
        </Box>
    );
}

const BenchmarkBar = React.forwardRef(function BenchmarkBar({ indicatorKey, company, bm }, ref) {
    const labels = ["Industry Low", "Industry Median", "Industry High", "Our Company"];
    const values = [bm.lowest, bm.median, bm.highest, company];
    const colors = ["#95a5a6", "#7f8c8d", "#34495e", "#2563eb"];

    return (
        <Plot
            ref={ref}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false, responsive: true }}
            data={[{
                type: "bar",
                x: labels,
                y: values,
                text: values.map(fmt),
                textposition: "outside",
                textfont: { size: 10, weight: 600 },
                marker: {
                    color: colors,
                    line: { color: "#fff", width: 1 }
                },
                hovertemplate: "<b>%{x}</b><br>Value: %{y:,.0f}<extra></extra>"
            }]}
            layout={{
                autosize: true,
                margin: { l: 42, r: 12, t: 5, b: 50 },
                yaxis: {
                    zeroline: true,
                    rangemode: "tozero",
                    gridcolor: "#f0f2f5",
                    title: {
                        text: pickIndicator(indicatorKey)?.label,
                        font: { size: 9, color: "#5a6c7d" }
                    }
                },
                xaxis: {
                    tickfont: { size: 9, color: "#5a6c7d" }
                },
                plot_bgcolor: "#fafbfc",
                paper_bgcolor: "transparent",
                font: { family: "Inter, system-ui, sans-serif" }
            }}
        />
    );
});

const GapPlot = React.forwardRef(function GapPlot({ company, gap }, ref) {
    return (
        <Plot
            ref={ref}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false, responsive: true }}
            data={[{
                type: "indicator",
                mode: "number+gauge+delta",
                value: company,
                number: {
                    valueformat: ".2f",
                    font: { size: 22, weight: 700 }
                },
                delta: {
                    reference: gap.leader,
                    decreasing: { color: "#e74c3c" },
                    increasing: { color: "#27ae60" },
                    font: { size: 13 }
                },
                gauge: {
                    shape: "bullet",
                    axis: { range: [0, Math.max(gap.leader, company) * 1.1] },
                    threshold: {
                        value: gap.leader,
                        line: { color: "#2c3e50", width: 2 }
                    },
                    bar: { color: "#2563eb", thickness: 0.7 },
                    bgcolor: "#f0f2f5",
                    borderwidth: 0
                },
                title: {
                    text: "Current vs Leader",
                    font: { size: 10, color: "#5a6c7d" }
                },
                domain: { x: [0, 1], y: [0, 1] }
            }]}
            layout={{
                autosize: true,
                margin: { l: 18, r: 12, t: 24, b: 8 },
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { family: "Inter, system-ui, sans-serif" }
            }}
        />
    );
});

function BenchmarkStatsCard({ bm, company, gap }) {
    const stats = [
        { label: "Our Position", value: company, color: "#2563eb", highlight: true },
        { label: "Industry Low", value: bm.lowest, color: "#95a5a6" },
        { label: "Industry Median", value: bm.median, color: "#7f8c8d" },
        { label: "Industry High", value: bm.highest, color: "#34495e" },
    ];

    return (
        <Paper elevation={0} sx={{ p: 1.75, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #e1e8ed" }}>
            <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 700, color: "#1a2332", fontSize: "0.85rem" }}>
                Key Metrics
            </Typography>
            <Stack spacing={0.9}>
                {stats.map((stat, idx) => (
                    <Box key={idx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.35 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: "0.7rem",
                                    color: stat.highlight ? stat.color : "#5a6c7d",
                                    fontWeight: stat.highlight ? 700 : 500
                                }}
                            >
                                {stat.label}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 700,
                                    color: stat.color,
                                    fontSize: "0.8rem"
                                }}
                            >
                                {fmt(stat.value)}
                            </Typography>
                        </Stack>
                        <Box sx={{ height: 4, bgcolor: "#f0f2f5", borderRadius: 0.5, overflow: "hidden" }}>
                            <Box sx={{
                                height: "100%",
                                bgcolor: stat.color,
                                width: `${Math.min(100, (stat.value / (bm.highest || 1)) * 100)}%`,
                                transition: "width 0.3s ease"
                            }} />
                        </Box>
                    </Box>
                ))}
            </Stack>

            <Divider sx={{ my: 1.25 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#5a6c7d", fontWeight: 600 }}>
                    Gap
                </Typography>
                <Chip
                    label={fmt(gap.gap)}
                    size="small"
                    color="error"
                    sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700, px: 0.75 }}
                />
            </Stack>
        </Paper>
    );
}

function DetailedTable({ indicatorKey, series, bm }) {
    const rows = [
        { name: "Our Company", value: series.company, isCompany: true },
        ...series.competitors.map(c => ({ name: c.name, value: c.value, isCompany: false }))
    ];

    const getPerfIcon = (value) => {
        if (value === null || value === undefined || value === "")
            return <RemoveIcon sx={{ fontSize: 15, color: "#bdc3c7" }} />;
        if (value >= bm.median && value >= (bm.lowest + (bm.highest - bm.lowest) * 0.75))
            return <ArrowUpwardIcon sx={{ fontSize: 15, color: "#27ae60" }} />;
        if (value >= bm.median)
            return <RemoveIcon sx={{ fontSize: 15, color: "#f39c12" }} />;
        return <ArrowDownwardIcon sx={{ fontSize: 15, color: "#e74c3c" }} />;
    };

    return (
        <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: "#5a6c7d" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#fff", py: 0.85, fontSize: "0.7rem" }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#fff", py: 0.85, fontSize: "0.7rem" }}>Indicator</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#fff", py: 0.85, fontSize: "0.7rem" }}>Entity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#fff", py: 0.85, fontSize: "0.7rem" }}>Value</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: "#fff", py: 0.85, fontSize: "0.7rem" }}>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((r, idx) => (
                        <TableRow
                            key={r.name}
                            sx={{
                                bgcolor: r.isCompany ? "#eff6ff" : (idx % 2 === 0 ? "#fafbfc" : "#fff"),
                                "&:hover": { bgcolor: "#f0f4f8" }
                            }}
                        >
                            <TableCell sx={{ py: 0.8, fontSize: "0.75rem", fontWeight: r.isCompany ? 600 : 400 }}>
                                {pickIndicator(indicatorKey)?.category}
                            </TableCell>
                            <TableCell sx={{ py: 0.8, fontSize: "0.75rem", fontWeight: r.isCompany ? 600 : 400 }}>
                                {pickIndicator(indicatorKey)?.label}
                            </TableCell>
                            <TableCell sx={{
                                py: 0.8,
                                fontSize: "0.75rem",
                                fontWeight: r.isCompany ? 700 : 500,
                                color: r.isCompany ? "#2563eb" : "#2c3e50"
                            }}>
                                {r.name}
                            </TableCell>
                            <TableCell align="right" sx={{
                                py: 0.8,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: r.isCompany ? "#2563eb" : "#2c3e50"
                            }}>
                                {fmt(r.value)}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 0.8 }}>
                                {getPerfIcon(r.value)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
}

function AIInsights({ indicatorKey, gap }) {
    const ind = pickIndicator(indicatorKey);
    return (
        <Typography variant="body2" sx={{
            lineHeight: 1.6,
            color: "#5a6c7d",
            fontSize: "0.75rem",
            letterSpacing: "0.01em"
        }}>
            Gap of <b style={{ color: "#e74c3c" }}>{fmt(gap.gap)}</b> vs leader requires action.
            <b> Priorities:</b> Digital enhancement, channel expansion, targeted campaigns.
        </Typography>
    );
}

function DataSourceInfo() {
    return (
        <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#fafbfc", borderRadius: 1.5, border: "1px solid #e8eaed" }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.75 }}>
                <InfoOutlinedIcon sx={{ fontSize: 13, color: "#5a6c7d" }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#1a2332", fontSize: "0.7rem" }}>
                    Sources
                </Typography>
            </Stack>
            <Typography variant="caption" sx={{ display: "block", lineHeight: 1.4, color: "#6c7a89", fontSize: "0.65rem" }}>
                <b>Internal:</b> Financials, CRM<br/>
                <b>External:</b> Gartner, IDC<br/>
                <b>Digital:</b> SimilarWeb
            </Typography>
        </Paper>
    );
}

/** ---------- 工具函数 ---------- */
function fmt(n) {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return "-";
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

async function toImage(plotRef) {
    const el = plotRef?.current?.el;
    if (!el || !window.Plotly) return "";
    await window.Plotly.Plots.resize(el);
    return await window.Plotly.toImage(el, { format: "png", height: el.offsetHeight, width: el.offsetWidth, scale: 2 });
}

function wrapText(doc, text, x, y, maxW, lh = 12) {
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((t, i) => doc.text(t, x, y + i * lh));
}

function applyOverrides(series, overrides) {
    const company = overrides["Our Company"] ?? series.company;
    const competitors = series.competitors.map(c => ({
        ...c,
        value: overrides[c.name] !== undefined ? overrides[c.name] : c.value
    }));
    return { ...series, company, competitors };
}

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    const idxEntity = headers.findIndex(h => /^entity$/i.test(h));
    const idxValue = headers.findIndex(h => /^value$/i.test(h));
    if (idxEntity < 0 || idxValue < 0) return [];
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = splitCsvLine(lines[i]);
        rows.push({ Entity: cols[idxEntity], Value: cols[idxValue] });
    }
    return rows;
}

function splitCsvLine(line) {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; continue; }
        cur += ch;
    }
    out.push(cur.trim());
    return out;
}
