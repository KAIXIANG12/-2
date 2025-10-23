// src/pages/CoreValueOffer.jsx
import { useMemo, useState, useRef } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Link,
    Button,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Slider,
    Popover,
    InputAdornment,
    Snackbar,
    Alert,
    Switch,
    FormControlLabel,
    IconButton,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* -------------------- 初始数据 -------------------- */
function uid() {
    try {
        return crypto.randomUUID();
    } catch {
        return "id_" + Math.random().toString(36).slice(2);
    }
}
const INIT = [
    { id: uid(), name: "Our Company", pl: 3, oe: 5, ci: 8 },
    { id: uid(), name: "Competitor 1", pl: 7, oe: 5, ci: 6 },
    { id: uid(), name: "Competitor 2", pl: 7, oe: 4, ci: 7 },
    { id: uid(), name: "Competitor 3", pl: 9, oe: 4, ci: 8 },
    { id: uid(), name: "Competitor 4", pl: 8, oe: 9, ci: 5 },
    { id: uid(), name: "Competitor 5", pl: 7, oe: 6, ci: 4 },
    { id: uid(), name: "Competitor 6", pl: 8, oe: 9, ci: 6 },
    { id: uid(), name: "Competitor 7", pl: 8, oe: 6, ci: 7 },
    { id: uid(), name: "Competitor 8", pl: 7, oe: 6, ci: 8 },
    { id: uid(), name: "Competitor 9", pl: 6, oe: 10, ci: 8 },
    { id: uid(), name: "Competitor 10", pl: 8, oe: 5, ci: 9 },
];

const clamp = (n) => Math.max(1, Math.min(10, Number(n) || 1));

/* Value Offer：取本行最高维度 */
const valueOfferOf = (r) => {
    const triplet = [
        { label: "Product Leadership", v: +r.pl },
        { label: "Operational Excellence", v: +r.oe },
        { label: "Customer Intimacy", v: +r.ci },
    ].sort((a, b) => b.v - a.v);
    return triplet[0].label;
};

/* VO 颜色 */
const VO_BG = {
    "Customer Intimacy": "#CCD2E6",
    "Operational Excellence": "#CCC7E3",
    "Product Leadership": "#FCDEBA",
};
const VO_TXT = {
    "Customer Intimacy": "#495A96",
    "Operational Excellence": "#6464A0",
    "Product Leadership": "#F79522",
};

/* 百分位工具 */
const pct = (arr, p) => {
    const a = [...arr].sort((x, y) => x - y);
    if (!a.length) return 0;
    const i = Math.floor((p / 100) * (a.length - 1));
    return a[i];
};

export default function CoreValueOffer() {
    const [rows, setRows] = useState(INIT);

    // 搜索 / 过滤
    const [query, setQuery] = useState("");
    const [plRange, setPlRange] = useState([1, 10]);
    const [oeRange, setOeRange] = useState([1, 10]);
    const [ciRange, setCiRange] = useState([1, 10]);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [useVisibleForPct, setUseVisibleForPct] = useState(false);

    // 选中行（用于雷达高亮）
    const [selectedId, setSelectedId] = useState(null);

    // 通知
    const [toast, setToast] = useState({ open: false, msg: "" });

    // 导出用：把“表格+图+文本区”包在一个容器里截取
    const exportRef = useRef(null);

    // 新增
    const add = () =>
        setRows((rs) => [
            ...rs,
            { id: uid(), name: "Competitor", pl: 5, oe: 5, ci: 5 },
        ]);

    // 行内删除（禁删 Our Company）
    const removeRow = (r) => {
        if (r.name.trim().toLowerCase() === "our company") {
            setToast({ open: true, msg: "“Our Company” 不能删除。" });
            return;
        }
        setRows((rs) => rs.filter((x) => x.id !== r.id));
        if (selectedId === r.id) setSelectedId(null);
    };

    const openFilter = (e) => setFilterAnchor(e.currentTarget);
    const closeFilter = () => setFilterAnchor(null);
    const clearAll = () => {
        setQuery("");
        setPlRange([1, 10]);
        setOeRange([1, 10]);
        setCiRange([1, 10]);
    };

    // 过滤后的可见数据
    const visibleRows = rows.filter((r) => {
        const nameOk = r.name.toLowerCase().includes(query.toLowerCase());
        const plOk = r.pl >= plRange[0] && r.pl <= plRange[1];
        const oeOk = r.oe >= oeRange[0] && r.oe <= oeRange[1];
        const ciOk = r.ci >= ciRange[0] && r.ci <= ciRange[1];
        return nameOk && plOk && oeOk && ciOk;
    });

    // Top/Bottom 10% 阈值（可切换以“全部数据/可见数据”为基准）
    const basis = useVisibleForPct ? visibleRows : rows;
    const p10 = useMemo(
        () => ({
            pl: pct(basis.map((r) => +r.pl), 10),
            oe: pct(basis.map((r) => +r.oe), 10),
            ci: pct(basis.map((r) => +r.ci), 10),
        }),
        [basis]
    );
    const p90 = useMemo(
        () => ({
            pl: pct(basis.map((r) => +r.pl), 90),
            oe: pct(basis.map((r) => +r.oe), 90),
            ci: pct(basis.map((r) => +r.ci), 90),
        }),
        [basis]
    );

    // 雷达图数据
    const radarData = visibleRows.map((r) => ({
        name: r.name,
        PL: +r.pl,
        OE: +r.oe,
        CI: +r.ci,
    }));
    const selectedRow = rows.find((r) => r.id === selectedId);

    // 样式
    const headCell = {
        background: "#E9EEF8",
        border: "1px solid #d9dfe9",
        fontWeight: 700,
        position: "sticky",
        top: 0,
        zIndex: 2,
    };
    const firstCol = {
        position: "sticky",
        left: 0,
        zIndex: 1,
        background: "#fff",
    };
    const cellStyle = (col, v) => ({
        backgroundColor:
            v >= p90[col] ? "#E4F6EA" : v <= p10[col] ? "#FBE8E8" : "transparent",
        border: "1px solid #d9dfe9",
        padding: 0,
    });

    /* ---------- CSV 导入 ---------- */
    const fileRef = useRef(null);
    const handlePickFile = () => fileRef.current?.click();

    const onImportCSV = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = parseCSV(text);
            if (!parsed.length) throw new Error("Empty file");
            setRows((rs) => {
                const ours =
                    rs.find(
                        (r) => r.name.trim().toLowerCase() === "our company"
                    ) || INIT[0];
                const others = parsed.filter(
                    (p) => p.name.trim().toLowerCase() !== "our company"
                );
                return [ours, ...others.map((o) => ({ ...o, id: uid() }))];
            });
            setToast({ open: true, msg: `Imported ${parsed.length} rows.` });
        } catch (err) {
            setToast({ open: true, msg: `Import failed: ${err.message}` });
        } finally {
            e.target.value = "";
        }
    };

    /* ---------- 导出 Strategic Report（PDF） ---------- */
    const handleExportReport = async () => {
        if (!exportRef.current) return;
        // 1) 截图容器
        const canvas = await html2canvas(exportRef.current, {
            backgroundColor: "#ffffff",
            scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio,
            useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");

        // 2) 计算分页并写入 PDF（A4 纵向）
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth - 20; // 左右各留 10mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10; // 顶部留白 10mm

        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= pageHeight - position;

        while (heightLeft > 0) {
            pdf.addPage();
            position = 10;
            pdf.addImage(
                imgData,
                "PNG",
                10,
                position - (imgHeight - heightLeft),
                imgWidth,
                imgHeight,
                "",
                "FAST"
            );
            heightLeft -= pageHeight - 10;
        }

        const ts = new Date()
            .toISOString()
            .replace(/[-:T]/g, "")
            .slice(0, 14);
        pdf.save(`Strategic_Report_${ts}.pdf`);
    };

    return (
        <Box ref={exportRef}>
            {/* 工具条：Add / Import / Search / Filter / Strategic Report */}
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 1.25, flexWrap: "wrap" }}
            >
                <Link
                    underline="hover"
                    component="button"
                    onClick={add}
                    sx={{ fontWeight: 600 }}
                >
                    Add Competitor
                </Link>

                <Button
                    size="small"
                    variant="text"
                    startIcon={<UploadRoundedIcon />}
                    onClick={handlePickFile}
                >
                    Import CSV
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={onImportCSV}
                />

                <TextField
                    size="small"
                    placeholder="Search competitors..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{ ml: { xs: 0, sm: 1 }, minWidth: 260 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchRoundedIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FilterListRoundedIcon />}
                    onClick={openFilter}
                >
                    Filter
                </Button>

                <Tooltip title="绿色=Top 10%；红色=Bottom 10%。可在 Filter 中切换按全部数据或按筛选后的可见数据计算。">
                    <InfoOutlinedIcon fontSize="small" sx={{ color: "#8080B1" }} />
                </Tooltip>

                <Box sx={{ flex: 1 }} />

                {/* ✅ 黑色 Strategic Report：导出 PDF */}
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleExportReport}
                    sx={{
                        textTransform: "none",
                        bgcolor: "#000",
                        "&:hover": { bgcolor: "#111" },
                    }}
                >
                    Strategic Report
                </Button>

                {/* 过滤弹层 */}
                <Popover
                    open={Boolean(filterAnchor)}
                    anchorEl={filterAnchor}
                    onClose={closeFilter}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                    <Box sx={{ p: 2, width: 380 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Filter by score range (1–10)
                        </Typography>
                        <Range
                            label="Product Leadership"
                            value={plRange}
                            onChange={setPlRange}
                        />
                        <Range
                            label="Operational Excellence"
                            value={oeRange}
                            onChange={setOeRange}
                        />
                        <Range
                            label="Customer Intimacy"
                            value={ciRange}
                            onChange={setCiRange}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={useVisibleForPct}
                                    onChange={(e) => setUseVisibleForPct(e.target.checked)}
                                />
                            }
                            label="Use visible rows for Top/Bottom 10%"
                            sx={{ mt: 0.5 }}
                        />

                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" onClick={clearAll}>
                                Clear
                            </Button>
                            <Button size="small" variant="contained" onClick={closeFilter}>
                                Apply
                            </Button>
                        </Stack>
                    </Box>
                </Popover>
            </Stack>

            {/* 上半：表格 + 雷达图 */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                {/* 表格卡片 */}
                <Paper
                    variant="outlined"
                    sx={{ flex: 1, p: 0, borderRadius: 2, overflow: "auto", maxHeight: 520 }}
                >
                    <TableContainer sx={{ maxHeight: 520 }}>
                        <Table stickyHeader size="small" sx={{ borderCollapse: "separate", borderSpacing: 0 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...headCell, ...firstCol }}>Competitors</TableCell>
                                    <TableCell sx={headCell} align="center">
                                        Product Leadership
                                    </TableCell>
                                    <TableCell sx={headCell} align="center">
                                        Operational Excellence
                                    </TableCell>
                                    <TableCell sx={headCell} align="center">
                                        Customer Intimacy
                                    </TableCell>
                                    <TableCell sx={headCell} align="center">
                                        Value Offer
                                    </TableCell>
                                    <TableCell sx={headCell} align="center" width={56}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visibleRows.map((r) => {
                                    const vo = valueOfferOf(r);
                                    const selected = r.id === selectedId;
                                    return (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            selected={selected}
                                            onClick={() => setSelectedId(r.id)}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell sx={{ border: "1px solid #d9dfe9", ...firstCol }}>
                                                <TextField
                                                    variant="standard"
                                                    value={r.name}
                                                    onChange={(e) =>
                                                        setRows((rs) =>
                                                            rs.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x))
                                                        )
                                                    }
                                                    fullWidth
                                                    InputProps={{
                                                        disableUnderline: true,
                                                        sx: { px: 1, py: 0.75, fontWeight: r.name === "Our Company" ? 700 : 500 },
                                                    }}
                                                />
                                            </TableCell>

                                            <TableCell align="center" sx={cellStyle("pl", +r.pl)}>
                                                <TextField
                                                    type="number"
                                                    variant="standard"
                                                    value={r.pl}
                                                    onChange={(e) =>
                                                        setRows((rs) =>
                                                            rs.map((x) =>
                                                                x.id === r.id ? { ...x, pl: clamp(e.target.value) } : x
                                                            )
                                                        )
                                                    }
                                                    inputProps={{ min: 1, max: 10 }}
                                                    fullWidth
                                                    InputProps={{ disableUnderline: true, sx: { textAlign: "center", py: 0.75 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="center" sx={cellStyle("oe", +r.oe)}>
                                                <TextField
                                                    type="number"
                                                    variant="standard"
                                                    value={r.oe}
                                                    onChange={(e) =>
                                                        setRows((rs) =>
                                                            rs.map((x) =>
                                                                x.id === r.id ? { ...x, oe: clamp(e.target.value) } : x
                                                            )
                                                        )
                                                    }
                                                    inputProps={{ min: 1, max: 10 }}
                                                    fullWidth
                                                    InputProps={{ disableUnderline: true, sx: { textAlign: "center", py: 0.75 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="center" sx={cellStyle("ci", +r.ci)}>
                                                <TextField
                                                    type="number"
                                                    variant="standard"
                                                    value={r.ci}
                                                    onChange={(e) =>
                                                        setRows((rs) =>
                                                            rs.map((x) =>
                                                                x.id === r.id ? { ...x, ci: clamp(e.target.value) } : x
                                                            )
                                                        )
                                                    }
                                                    inputProps={{ min: 1, max: 10 }}
                                                    fullWidth
                                                    InputProps={{ disableUnderline: true, sx: { textAlign: "center", py: 0.75 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="left" sx={{ border: "1px solid #d9dfe9", p: 0 }}>
                                                <Box
                                                    sx={{
                                                        px: 1,
                                                        py: 0.5,
                                                        bgcolor: VO_BG[vo],
                                                        color: VO_TXT[vo],
                                                        fontWeight: 700,
                                                        borderRadius: 0,
                                                    }}
                                                >
                                                    {vo}
                                                </Box>
                                            </TableCell>

                                            <TableCell align="center" sx={{ border: "1px solid #d9dfe9" }}>
                                                <Tooltip
                                                    title={
                                                        r.name.trim().toLowerCase() === "our company"
                                                            ? "“Our Company” 不能删除"
                                                            : "Delete"
                                                    }
                                                >
                          <span>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeRow(r);
                                }}
                                disabled={r.name.trim().toLowerCase() === "our company"}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {visibleRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#8080B1" }}>
                                            No competitors match current filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* 雷达图卡片（优化样式，无蓝色链接按钮） */}
                <Paper variant="outlined" sx={{ width: { xs: "100%", md: 560 }, borderRadius: 3, pt: 1, px: 1.5, pb: 2 }}>
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 3,
                            background:
                                "radial-gradient(circle at 50% 0%, #ffffff 0%, #f7f9fb 40%, #f2f5f9 100%)",
                            border: "1px solid #e6e9f2",
                        }}
                    >
                        <div style={{ width: "100%", height: 360 }}>
                            <ResponsiveContainer>
                                <RadarChart outerRadius="78%" data={radarData}>
                                    <Legend
                                        iconType="plainline"
                                        verticalAlign="top"
                                        align="left"
                                        wrapperStyle={{ paddingBottom: 8, marginLeft: 8 }}
                                    />
                                    <PolarGrid stroke="#D9DEE7" />
                                    <PolarAngleAxis
                                        dataKey="name"
                                        tick={{ fill: "#777C86", fontSize: 12, fontWeight: 700 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 10]}
                                        tick={{ fill: "#B0B6C2", fontSize: 12, fontWeight: 700 }}
                                        ticks={[0, 2, 4, 6, 8, 10]}
                                        stroke="#E2E6EE"
                                    />
                                    <Radar
                                        name="Product Leadership"
                                        dataKey="PL"
                                        stroke="#2F87D1"
                                        fill="#2F87D1"
                                        fillOpacity={selectedRow ? 0.04 : 0.1}
                                        strokeOpacity={selectedRow ? 0.35 : 1}
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Radar
                                        name="Operational Excellence"
                                        dataKey="OE"
                                        stroke="#C061C3"
                                        fill="#C061C3"
                                        fillOpacity={selectedRow ? 0.04 : 0.1}
                                        strokeOpacity={selectedRow ? 0.35 : 1}
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                    <Radar
                                        name="Customer Intimacy"
                                        dataKey="CI"
                                        stroke="#F39C12"
                                        fill="#F39C12"
                                        fillOpacity={selectedRow ? 0.04 : 0.1}
                                        strokeOpacity={selectedRow ? 0.35 : 1}
                                        strokeWidth={3}
                                        dot={false}
                                        isAnimationActive={false}
                                    />

                                    {/* 高亮选中行 */}
                                    {selectedRow && (
                                        <>
                                            <Radar
                                                name={`${selectedRow.name} • PL`}
                                                dataKey="PL"
                                                stroke="#2F87D1"
                                                fill="#2F87D1"
                                                fillOpacity={0.18}
                                                strokeWidth={3}
                                                data={radarData.filter((d) => d.name === selectedRow.name)}
                                            />
                                            <Radar
                                                name={`${selectedRow.name} • OE`}
                                                dataKey="OE"
                                                stroke="#C061C3"
                                                fill="#C061C3"
                                                fillOpacity={0.18}
                                                strokeWidth={3}
                                                data={radarData.filter((d) => d.name === selectedRow.name)}
                                            />
                                            <Radar
                                                name={`${selectedRow.name} • CI`}
                                                dataKey="CI"
                                                stroke="#F39C12"
                                                fill="#F39C12"
                                                fillOpacity={0.18}
                                                strokeWidth={3}
                                                data={radarData.filter((d) => d.name === selectedRow.name)}
                                            />
                                        </>
                                    )}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Box>
                </Paper>
            </Stack>

            {/* 下半：仅 3 个文本板块（可编辑，占位，后续接 AI 输出） */}
            <TextBlock
                title="Strategic Insight"
                defaultValue={`Our Company’s Position
Product Leadership: Scoring 3, our company significantly lags behind competitors (most at 7–9).
Operational Excellence: Average at 5; not a differentiator vs. OE leaders.
Customer Intimacy: Strongest at 8; current competitive moat and messaging anchor.`}
            />
            <TextBlock
                title="Strategic Direction"
                defaultValue="Become the design-led, service-obsessed home brand: retain intimacy leadership, rapidly lift product credibility, and streamline operations so experience matches promise."
            />
            <TextBlock
                title="Tactical Actions"
                defaultValue={`1) Elevate Product Leadership: launch curated hero capsules; add designer collabs; push private-label to ~40%; upgrade specs & warranties.
2) Tighten Operations: supplier rationalization; S&OP cadence; returns-led quality loop.
3) Deepen Intimacy: proactive service playbook; member benefits; data-driven personalization.`}
            />

            <Snackbar
                open={toast.open}
                autoHideDuration={2200}
                onClose={() => setToast({ open: false, msg: "" })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="info" variant="filled" sx={{ width: "100%" }}>
                    {toast.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

/* --- 滑块子组件（1–10） --- */
function Range({ label, value, onChange }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#8080B1" }}>
                {label}
            </Typography>
            <Slider
                size="small"
                value={value}
                onChange={(_, v) => onChange(v)}
                valueLabelDisplay="auto"
                min={1}
                max={10}
                marks={[
                    { value: 1, label: "1" },
                    { value: 10, label: "10" },
                ]}
            />
        </Box>
    );
}

/* --- 文本板块（白底无下划线，便于复制） --- */
function TextBlock({ title, defaultValue }) {
    return (
        <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: 2, border: "1px solid #e0e0e0" }}>
            <Typography
                sx={{
                    mb: 1,
                    fontWeight: 700,
                    color: "#6464A0",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                }}
            >
                {title}
            </Typography>
            <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 1 }}>
                <TextField
                    fullWidth
                    multiline
                    minRows={title === "Strategic Direction" ? 2 : 6}
                    variant="standard"
                    defaultValue={defaultValue}
                    InputProps={{ disableUnderline: true }}
                />
            </Box>
        </Paper>
    );
}

/* --- CSV 工具 --- */
function parseCSV(text) {
    // 期待 header: name,pl,oe,ci
    const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length);
    if (!lines.length) return [];
    const header = lines[0].toLowerCase().replace(/\s/g, "");
    const idx = { name: -1, pl: -1, oe: -1, ci: -1 };
    header.split(",").forEach((h, i) => {
        if (h.includes("name")) idx.name = i;
        if (h.includes("pl")) idx.pl = i;
        if (h.includes("oe")) idx.oe = i;
        if (h.includes("ci")) idx.ci = i;
    });
    if (idx.name < 0 || idx.pl < 0 || idx.oe < 0 || idx.ci < 0)
        throw new Error("Header must include name, pl, oe, ci");

    const out = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = splitCSVLine(lines[i]);
        if (!parts.length) continue;
        const obj = {
            name: (parts[idx.name] ?? "").trim(),
            pl: clamp(parts[idx.pl]),
            oe: clamp(parts[idx.oe]),
            ci: clamp(parts[idx.ci]),
        };
        if (obj.name) out.push(obj);
    }
    return out;
}

function splitCSVLine(line) {
    const res = [];
    let cur = "",
        inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQ && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else inQ = !inQ;
        } else if (ch === "," && !inQ) {
            res.push(cur);
            cur = "";
        } else cur += ch;
    }
    res.push(cur);
    return res;
}
