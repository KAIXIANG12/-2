import * as React from "react";
import {
    Box, Stack, Grid, Paper, Typography, TextField, Button, Slider,
    Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Divider, Tooltip
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

/** ===================== 基础：示例数据（可编辑/可替换） ===================== */
const SEED = [
    { name: "Dyson",         revenue: 6000,  growth: 8,   similarity: 55 },
    { name: "Philips",       revenue: 20000, growth: 5,   similarity: 50 },
    { name: "Foreo",         revenue: 450,   growth: 32,  similarity: 70 },
    { name: "NuFACE",        revenue: 220,   growth: 28,  similarity: 68 },
    { name: "Tria Beauty",   revenue: 120,   growth: 24,  similarity: 66 },
    { name: "L'Oréal (Tech)",revenue: 38000, growth: 9,   similarity: 40 },
    { name: "Panasonic",     revenue: 64000, growth: 4,   similarity: 35 },
    { name: "Revlon",        revenue: 2200,  growth: 6,   similarity: 45 },
    { name: "GHD",           revenue: 300,   growth: 12,  similarity: 62 },
    { name: "Conair",        revenue: 2200,  growth: 7,   similarity: 48 },
];

/** ===================== 工具：导出 CSV ===================== */
function exportCsv(rows, filename = "competitors.csv") {
    if (!rows.length) return;
    const header = Object.keys(rows[0]).join(",");
    const body = rows
        .map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const csv = [header, body].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

/** ===================== 规则：分桶逻辑（可按业务微调） =====================
 * - Leaders：营收 ≥ leaderRevenue 或（进入营收Top20% 且 增长 < highGrowth%）
 * - High-Growth：增长 ≥ growthThreshold 且 营收 ≥ minRevenueForChallenger
 * - Direct Counterparts：相似度 ≥ similarityThreshold（同价位/同细分/同渠道）
 * - 其余：归入“Direct & Legacy Players”展示，但不计为重点
 */
function classifyBuckets(data, thresholds) {
    const { leaderRevenue, growthThreshold, similarityThreshold, minRevenueForChallenger } = thresholds;
    if (!data.length) {
        return { leaders: [], challengers: [], counterparts: [], legacy: [] };
    }
    // 计算营收分位（Top20%）
    const sortedByRev = [...data].sort((a, b) => b.revenue - a.revenue);
    const top20CutoffIndex = Math.max(0, Math.floor(data.length * 0.2) - 1);
    const top20Revenue = sortedByRev[top20CutoffIndex]?.revenue ?? Number.POSITIVE_INFINITY;

    const leaders = [];
    const challengers = [];
    const counterparts = [];
    const legacy = [];

    data.forEach((c) => {
        const isLeader =
            c.revenue >= leaderRevenue ||
            (c.revenue >= top20Revenue && c.growth < growthThreshold);

        const isChallenger =
            c.growth >= growthThreshold && c.revenue >= minRevenueForChallenger;

        const isCounterpart = c.similarity >= similarityThreshold; // 与“我方公司”直接对位

        if (isLeader) leaders.push(c);
        else if (isChallenger) challengers.push(c);
        else if (isCounterpart) counterparts.push(c);
        else legacy.push(c);
    });

    return { leaders, challengers, counterparts, legacy };
}

/** ===================== UI：主页面 ===================== */
export default function CompetitorSelection() {
    const [rows, setRows] = React.useState(SEED);

    // 门槛（可交互）
    const [leaderRevenue, setLeaderRevenue] = React.useState(5000); // $M
    const [growthThreshold, setGrowthThreshold] = React.useState(20); // %
    const [similarityThreshold, setSimilarityThreshold] = React.useState(60); // 0~100
    const [minRevenueForChallenger, setMinRevenueForChallenger] = React.useState(100); // $M

    const thresholds = {
        leaderRevenue,
        growthThreshold,
        similarityThreshold,
        minRevenueForChallenger,
    };

    const buckets = React.useMemo(() => classifyBuckets(rows, thresholds), [rows, thresholds]);

    // 新增一行
    const [draft, setDraft] = React.useState({ name: "", revenue: "", growth: "", similarity: "" });
    const addRow = () => {
        if (!draft.name) return;
        const n = {
            name: draft.name.trim(),
            revenue: Number(draft.revenue) || 0,
            growth: Number(draft.growth) || 0,
            similarity: Number(draft.similarity) || 0,
        };
        setRows((prev) => [...prev, n]);
        setDraft({ name: "", revenue: "", growth: "", similarity: "" });
    };

    const delRow = (idx) => {
        setRows((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <Box sx={{ p: 2, bgcolor: "#f5f7fb", minHeight: "100vh" }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Competitor Selection & Prioritization
                </Typography>
                <Chip label="Focus: pick 5–10 most relevant competitors for deep analysis" />
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Export current list to CSV">
                    <Button variant="outlined" onClick={() => exportCsv(rows, "competitors.csv")}>
                        Export CSV
                    </Button>
                </Tooltip>
            </Stack>

            {/* ===== 规则控制区 ===== */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Selection Criteria
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <FieldWithSlider
                            label={`Leader Revenue ≥ ${leaderRevenue.toLocaleString()} (USD$M)`}
                            min={0}
                            max={80000}
                            step={100}
                            value={leaderRevenue}
                            onChange={setLeaderRevenue}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FieldWithSlider
                            label={`High-Growth CAGR ≥ ${growthThreshold}%`}
                            min={0}
                            max={60}
                            step={1}
                            value={growthThreshold}
                            onChange={setGrowthThreshold}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FieldWithSlider
                            label={`Direct Counterpart Similarity ≥ ${similarityThreshold}`}
                            min={0}
                            max={100}
                            step={1}
                            value={similarityThreshold}
                            onChange={setSimilarityThreshold}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FieldWithSlider
                            label={`Challenger Min Revenue ≥ ${minRevenueForChallenger.toLocaleString()} (USD$M)`}
                            min={0}
                            max={5000}
                            step={50}
                            value={minRevenueForChallenger}
                            onChange={setMinRevenueForChallenger}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2}>
                {/* ===== 左：输入表 ===== */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            Competitor List (editable)
                        </Typography>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Revenue (USD$M)</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>CAGR %</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Similarity (0–100)</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((r, i) => (
                                    <TableRow key={r.name + i}>
                                        <TableCell>{r.name}</TableCell>
                                        <TableCell>{r.revenue.toLocaleString()}</TableCell>
                                        <TableCell>{r.growth}%</TableCell>
                                        <TableCell>{r.similarity}</TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => delRow(i)} size="small">
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* 新增行 */}
                                <TableRow>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            placeholder="Brand name"
                                            value={draft.name}
                                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            placeholder="e.g., 1200"
                                            value={draft.revenue}
                                            onChange={(e) => setDraft({ ...draft, revenue: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            placeholder="e.g., 18"
                                            value={draft.growth}
                                            onChange={(e) => setDraft({ ...draft, growth: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            placeholder="e.g., 65"
                                            value={draft.similarity}
                                            onChange={(e) => setDraft({ ...draft, similarity: e.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={addRow}>
                                            Add
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            Guidance
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            • Leaders：<br />
                            • High-Growth：<br />
                            • Direct Counterparts：<br />

                        </Typography>
                    </Paper>
                </Grid>

                {/* ===== 右：分组结果（与示例图风格一致） ===== */}
                <Grid item xs={12} md={5}>
                    <BucketCard
                        title="Market Leaders"
                        color="#E8F0FE"
                        desc="Dominant players with high revenue and market presence."
                        items={buckets.leaders}
                    />
                    <BucketCard
                        title="High-Growth Challengers"
                        color="#E8F8F0"
                        desc="Aggressive players with rapid market share gains (high CAGR)."
                        items={buckets.challengers}
                    />
                    <BucketCard
                        title="Direct Counterparts"
                        color="#F3E8FF"
                        desc="Operate at a similar scale, targeting the same segments/channels."
                        items={buckets.counterparts}
                    />

                    <Divider sx={{ my: 1 }} />
                    <BucketCard
                        title="Direct & Legacy Players"
                        color="#F5F5F5"
                        desc="Broadly available / legacy brands; monitor as background."
                        items={buckets.legacy}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

/** ===================== 小组件 ===================== */

function FieldWithSlider({ label, min, max, step, value, onChange }) {
    return (
        <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
                {label}
            </Typography>
            <Slider
                size="small"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(_, v) => onChange(v)}
            />
        </Box>
    );
}

function BucketCard({ title, color, desc, items }) {
    return (
        <Paper sx={{ p: 2, mb: 2, borderLeft: `6px solid ${color}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title} <Chip size="small" label={items.length} sx={{ ml: 1 }} />
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {desc}
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
                {items.length === 0 && (
                    <Typography variant="body2" color="text.disabled">
                        — none —
                    </Typography>
                )}
                {items.map((c) => (
                    <Box
                        key={c.name}
                        sx={{
                            bgcolor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 1,
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Rev ${c.revenue.toLocaleString()}M · CAGR {c.growth}% · Sim {c.similarity}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
