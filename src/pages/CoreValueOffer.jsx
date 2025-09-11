import { useMemo, useState } from "react";
import {
    Box, Paper, Typography, Stack, Link, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Slider, Popover, InputAdornment
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";

/* -------------------- 初始数据 -------------------- */
const INIT = [
    { id: crypto.randomUUID(), name: "Our Company",   pl: 3, oe: 5, ci: 8 },
    { id: crypto.randomUUID(), name: "Competitor 1",  pl: 7, oe: 5, ci: 6 },
    { id: crypto.randomUUID(), name: "Competitor 2",  pl: 7, oe: 4, ci: 7 },
    { id: crypto.randomUUID(), name: "Competitor 3",  pl: 9, oe: 4, ci: 8 },
    { id: crypto.randomUUID(), name: "Competitor 4",  pl: 8, oe: 9, ci: 5 },
    { id: crypto.randomUUID(), name: "Competitor 5",  pl: 7, oe: 6, ci: 4 },
    { id: crypto.randomUUID(), name: "Competitor 6",  pl: 8, oe: 9, ci: 6 },
    { id: crypto.randomUUID(), name: "Competitor 7",  pl: 8, oe: 6, ci: 7 },
    { id: crypto.randomUUID(), name: "Competitor 8",  pl: 7, oe: 6, ci: 8 },
    { id: crypto.randomUUID(), name: "Competitor 9",  pl: 6, oe:10, ci: 8 },
    { id: crypto.randomUUID(), name: "Competitor 10", pl: 8, oe: 5, ci: 9 },
];

const clamp = (n) => Math.max(1, Math.min(10, Number(n) || 1));

/* Value Offer：取本行最高维度 */
const valueOfferOf = (r) => {
    const triplet = [
        { label: "Product Leadership", v: +r.pl },
        { label: "Operational Excellence", v: +r.oe },
        { label: "Customer Intimacy", v: +r.ci },
    ].sort((a,b)=>b.v-a.v);
    return triplet[0].label;
};

/* VO 颜色（接近设计稿） */
// ✅ 按品牌色替换（浅底 + 深字）
const VO_BG = {
    "Customer Intimacy":      "#CCD2E6", // 浅蓝
    "Operational Excellence": "#CCC7E3", // 浅紫
    "Product Leadership":     "#FCDEBA", // 浅橙
};
const VO_TXT = {
    "Customer Intimacy":      "#495A96", // 深蓝
    "Operational Excellence": "#6464A0", // 深紫
    "Product Leadership":     "#F79522", // 亮橙
};


/* 分位工具 */
const pct = (arr, p) => {
    const a = [...arr].sort((x,y)=>x-y);
    if (!a.length) return 0;
    const i = Math.floor((p/100)*(a.length-1));
    return a[i];
};

export default function CoreValueOffer() {
    const [rows, setRows] = useState(INIT);

    /* —— 搜索 / 过滤 —— */
    const [query, setQuery] = useState("");
    const [plRange, setPlRange] = useState([1,10]);
    const [oeRange, setOeRange] = useState([1,10]);
    const [ciRange, setCiRange] = useState([1,10]);
    const [filterAnchor, setFilterAnchor] = useState(null);

    /* —— 选中行（用于 Remove） —— */
    const [selectedId, setSelectedId] = useState(null);

    const add = () => setRows(rs => [...rs, { id:crypto.randomUUID(), name:"Competitor", pl:5, oe:5, ci:5 }]);
    const removeSelected = () => setRows(rs => rs.filter(r => r.id !== selectedId));

    const openFilter = (e) => setFilterAnchor(e.currentTarget);
    const closeFilter = () => setFilterAnchor(null);
    const clearAll = () => { setQuery(""); setPlRange([1,10]); setOeRange([1,10]); setCiRange([1,10]); };

    /* —— 分位：每列各算 Top/Bottom 10% —— */
    const p10 = useMemo(() => ({
        pl: pct(rows.map(r=>+r.pl), 10),
        oe: pct(rows.map(r=>+r.oe), 10),
        ci: pct(rows.map(r=>+r.ci), 10),
    }), [rows]);

    const p90 = useMemo(() => ({
        pl: pct(rows.map(r=>+r.pl), 90),
        oe: pct(rows.map(r=>+r.oe), 90),
        ci: pct(rows.map(r=>+r.ci), 90),
    }), [rows]);

    /* —— 搜索 + 范围过滤后的可见数据 —— */
    const visibleRows = rows.filter(r => {
        const nameOk = r.name.toLowerCase().includes(query.toLowerCase());
        const plOk = r.pl >= plRange[0] && r.pl <= plRange[1];
        const oeOk = r.oe >= oeRange[0] && r.oe <= oeRange[1];
        const ciOk = r.ci >= ciRange[0] && r.ci <= ciRange[1];
        return nameOk && plOk && oeOk && ciOk;
    });

    /* 雷达图：三个维度三条线，轴为 competitor */
    const radarData = visibleRows.map(r => ({ name:r.name, PL:+r.pl, OE:+r.oe, CI:+r.ci }));

    /* —— 样式 —— */
    const headCell = { background:"#E9EEF8", border:"1px solid #d9dfe9", fontWeight:700 };
    const cellStyle = (col, v) => ({
        backgroundColor: v>=p90[col] ? "#E4F6EA" : v<=p10[col] ? "#FBE8E8" : "transparent",
        border: "1px solid #d9dfe9",
        padding: 0
    });

    return (
        <Box>
            {/* 工具条：Add / Import / Search / Filter / Remove */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.25 }}>
                <Link underline="hover" component="button" onClick={add} sx={{ fontWeight:600 }}>
                    Add Competitor
                </Link>
                <Link underline="hover" component="button" onClick={()=>alert("Import coming soon")}>
                    Import
                </Link>

                <TextField
                    size="small"
                    placeholder="Search competitors..."
                    value={query}
                    onChange={(e)=>setQuery(e.target.value)}
                    sx={{ ml:1, minWidth:320 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchRoundedIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                />

                <Button variant="outlined" size="small" startIcon={<FilterListRoundedIcon />} onClick={openFilter}>
                    Filter
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml:1 }}
                    disabled={!selectedId}
                    onClick={removeSelected}
                >
                    Remove
                </Button>

                {/* 过滤弹层 */}
                <Popover
                    open={Boolean(filterAnchor)}
                    anchorEl={filterAnchor}
                    onClose={closeFilter}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                    <Box sx={{ p:2, width: 360 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter by score range (1–10)</Typography>
                        <Range label="Product Leadership" value={plRange} onChange={setPlRange}/>
                        <Range label="Operational Excellence" value={oeRange} onChange={setOeRange}/>
                        <Range label="Customer Intimacy" value={ciRange} onChange={setCiRange}/>
                        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt:1 }}>
                            <Button size="small" onClick={clearAll}>Clear</Button>
                            <Button size="small" variant="contained" onClick={closeFilter}>Apply</Button>
                        </Stack>
                    </Box>
                </Popover>
            </Stack>

            {/* 上半：表格 + 雷达图 */}
            <Stack direction={{xs:"column", md:"row"}} spacing={2} alignItems="stretch">
                {/* 表格卡片 */}
                <Paper variant="outlined" sx={{ flex: 1, p:0, borderRadius:2, overflow:"hidden" }}>
                    <TableContainer>
                        <Table size="small" sx={{ borderCollapse:"separate", borderSpacing:0 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={headCell}>Competitors</TableCell>
                                    <TableCell sx={headCell} align="center">Product Leadership</TableCell>
                                    <TableCell sx={headCell} align="center">Operational Excellence</TableCell>
                                    <TableCell sx={headCell} align="center">Customer Intimacy</TableCell>
                                    <TableCell sx={headCell} align="center">Value Offer</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {visibleRows.map((r)=> {
                                    const vo = valueOfferOf(r);
                                    const selected = r.id === selectedId;
                                    return (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            selected={selected}
                                            onClick={()=> setSelectedId(r.id)}
                                            sx={{ cursor:"pointer" }}
                                        >
                                            <TableCell sx={{ border:"1px solid #d9dfe9" }}>
                                                <TextField
                                                    variant="standard"
                                                    value={r.name}
                                                    onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,name:e.target.value}:x))}
                                                    fullWidth
                                                    InputProps={{ disableUnderline:true, sx:{ px:1, py:0.75, fontWeight:r.name==="Our Company"?700:500 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="center" sx={cellStyle("pl", +r.pl)}>
                                                <TextField
                                                    type="number" variant="standard" value={r.pl}
                                                    onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,pl:clamp(e.target.value)}:x))}
                                                    inputProps={{ min:1, max:10 }}
                                                    fullWidth
                                                    InputProps={{ disableUnderline:true, sx:{ textAlign:"center", py:0.75 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="center" sx={cellStyle("oe", +r.oe)}>
                                                <TextField
                                                    type="number" variant="standard" value={r.oe}
                                                    onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,oe:clamp(e.target.value)}:x))}
                                                    inputProps={{ min:1, max:10 }}
                                                    fullWidth
                                                    InputProps={{ disableUnderline:true, sx:{ textAlign:"center", py:0.75 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="center" sx={cellStyle("ci", +r.ci)}>
                                                <TextField
                                                    type="number" variant="standard" value={r.ci}
                                                    onChange={(e)=>setRows(rs=>rs.map(x=>x.id===r.id?{...x,ci:clamp(e.target.value)}:x))}
                                                    inputProps={{ min:1, max:10 }}
                                                    fullWidth
                                                    InputProps={{ disableUnderline:true, sx:{ textAlign:"center", py:0.75 } }}
                                                />
                                            </TableCell>

                                            <TableCell align="left" sx={{ border:"1px solid #d9dfe9", p:0 }}>
                                                <Box
                                                    sx={{
                                                        px:1, py:0.5,
                                                        bgcolor: VO_BG[vo], color: VO_TXT[vo],
                                                        fontWeight: 700, borderRadius: 0
                                                    }}
                                                >
                                                    {vo}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {visibleRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py:3, color:"#8080B1" }}>
                                            No competitors match current filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* 雷达图卡片 */}
                <Paper variant="outlined" sx={{ width:{xs:"100%", md: 520}, borderRadius: 10, p:2 }}>
                    {/* ✅ Strategic Report 链接（右上角） */}
                    <Box sx={{ display:'flex', justifyContent:'flex-end', mb: 1 }}>
                        <Link
                            href="#"
                            underline="hover"
                            sx={{ fontSize: 14, color:'#6464A0' }}
                            onClick={(e)=>{ e.preventDefault(); alert('Strategic Report export coming soon'); }}
                        >
                            Strategic Report
                        </Link>
                    </Box>

                    <Box sx={{ bgcolor:"#F7F8FC", border:"1px solid #e3e7f1", borderRadius: 4, p:1 }}>
                        <div style={{ width:"100%", height: 340 }}>
                            <ResponsiveContainer>
                                <RadarChart outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="name" />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                    <Radar name="Product Leadership" dataKey="PL" stroke="#2F87D1" fill="#2F87D1" fillOpacity={0.08}/>
                                    <Radar name="Operational Excellence" dataKey="OE" stroke="#C061C3" fill="#C061C3" fillOpacity={0.08}/>
                                    <Radar name="Customer Intimacy" dataKey="CI" stroke="#F39C12" fill="#F39C12" fillOpacity={0.08}/>
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Box>
                </Paper>
            </Stack>

            {/* 下半：文本区块 */}
            {/* Strategic Insight */}
            <Paper elevation={0} sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography sx={{
                    mb: 1, fontWeight: 700, color: "#6464A0",
                    textDecoration: "underline", textUnderlineOffset: 3
                }}>
                    Strategic Insight
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Our Company’s Position</Typography>
                <Typography sx={{ mb: 1.25 }}>
                    <b>Product Leadership:</b> Scoring 3, our company significantly lags behind competitors. Most rivals are rated
                    between 7–9, leaving our offering vulnerable to perceptions of weak design, quality, or innovation. This is the
                    biggest gap to close.
                </Typography>
                <Typography sx={{ mb: 1.25 }}>
                    <b>Operational Excellence:</b> With a score of 5, we sit at an average level. We are not failing but are far from
                    excelling compared to competitors like Wayfair UK (7) or The Senator Group (7). This suggests processes, supply
                    chain, and cost efficiencies are not differentiators.
                </Typography>
                <Typography>
                    <b>Customer Intimacy:</b> At 8, our company’s strongest dimension, we outperform most competitors (second only
                    to Heal’s at 9). This indicates strong customer service, relationships, and tailored experiences—our current source
                    of competitive advantage.
                </Typography>
            </Paper>

            {/* Strategic Direction */}
            <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography
                    sx={{
                        mb: 1,
                        fontWeight: 700,
                        color: "#6464A0",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                    }}
                >
                    Strategic Direction
                </Typography>

                {/* 仅用于留内边距和白底，不再加边框 */}
                <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        variant="standard"                 // ← 改成无外框
                        InputProps={{ disableUnderline: true }}  // ← 去掉底部横线
                        defaultValue="Become the design-led, service-obsessed home brand: keep your intimacy moat, rapidly lift product credibility, and tidy up operations so the experience matches the promise."
                    />
                </Box>
            </Paper>


            {/* Tactical Actions */}
            <Paper elevation={0} sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography sx={{
                    mb: 1, fontWeight: 700, color: "#6464A0",
                    textDecoration: "underline", textUnderlineOffset: 3
                }}>
                    Tactical Actions
                </Typography>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>1. Elevate Product Leadership</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {`Hero Capsules: Launch tightly curated, design-forward collections (modular, sustainable, small-space solutions) to reset product perception.
Brand-Building Collaborations: Introduce designer partnerships and expand private-label to ~40% of mix.
Quality Upgrade: Enhance specifications and introduce extended warranties to signal confidence.
Data-Driven Development: Use consumer insights, returns analysis, and search data to shorten design cycles and sharpen relevance.
Impact: Increases product credibility, enables premium pricing, and builds earned media visibility.`}
                </Typography>
            </Paper>
        </Box>
    );
}

/* --- 滑块子组件（1–10） --- */
function Range({ label, value, onChange }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color:"#8080B1" }}>{label}</Typography>
            <Slider
                size="small"
                value={value}
                onChange={(_, v)=>onChange(v)}
                valueLabelDisplay="auto"
                min={1}
                max={10}
                marks={[{value:1,label:"1"},{value:10,label:"10"}]}
            />
        </Box>
    );
}
