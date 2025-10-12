import * as React from 'react'
import { Routes, Route, Navigate, useLocation, NavLink, Outlet } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

// 登录页
import Login from "./pages/Auth/Login"

// 顶部一级导航
const TOP = [
    { key: 'cp', label: 'Competitive Positioning', path: '/cp/cvo' },
    { key: 'ca', label: 'Comparative Analysis',    path: '/ca' },
    { key: 'fb', label: 'Financial Benchmarking',  path: '/fb' },
    { key: 'ob', label: 'Operational Benchmarking',path: '/ob' },
]

// CP 左侧子菜单
const CP_MENU = [
    { key:'cvo', label:'Core Value Offer',          path:'/cp/cvo' },
    { key:'cbd', label:'Core Brand Differentiator', path:'/cp/cbd' },
    { key:'bep', label:'Brand Equity Positioning',  path:'/cp/bep' },
    { key:'vbp', label:'Value Based Positioning',   path:'/cp/vbp' },
    { key:'vdm', label:'Value Drivers Mapping',     path:'/cp/vdm' },
    { key:'com', label:'Competitor Offer Mapping',  path:'/cp/com' },
    { key:'pp',  label:'Price Positioning',         path:'/cp/pp'  },
    { key:'csw', label:'Comparative SWOT',          path:'/cp/csw' },
]

/* 顶部品牌条：左 Logo，右 Set up / Help / Login / Avatar */
function BrandBar(){
    return (
        <>
            <AppBar position="fixed" elevation={0} sx={{ bgcolor:'#6F79A8' }}>
                <Toolbar sx={{ minHeight: 64, px: 2 }}>
                    {/* LEFT Logo */}
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: .3 }}>
                        <Box component="span" sx={{ color:'#fff' }}>Strategic</Box>
                        <Box component="span" sx={{ ml: .5, px: .5, borderRadius: .5, bgcolor:'#D95359', color:'#fff', fontWeight: 900 }}>ALLY</Box>
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    {/* 右侧操作 */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button color="inherit" size="small" sx={{ textTransform:'none' }}>Set up</Button>
                        <Button color="inherit" size="small" sx={{ textTransform:'none' }}>Help</Button>
                        {/* Login 入口 */}
                        <Button component={NavLink} to="/auth/login" color="inherit" size="small" sx={{ textTransform:'none' }}>
                            Login
                        </Button>
                        <Avatar sx={{ width: 28, height: 28 }}>F</Avatar>
                    </Stack>
                </Toolbar>
            </AppBar>
            {/* 占位，避免内容被盖住 */}
            <Toolbar sx={{ minHeight: 64 }} />
        </>
    )
}

/* Tabs 导航 */
function TabsBar(){
    const { pathname } = useLocation()
    const current = pathname.startsWith('/cp') ? 0
        : pathname.startsWith('/ca') ? 1
            : pathname.startsWith('/fb') ? 2 : 3
    return (
        <Paper elevation={0}
               sx={{ px: 2, pt: 1, pb: 0, bgcolor:'#E4E8F4', borderRadius: '12px 12px 0 0', borderBottom: '3px solid #6F79A8' }}>
            <Tabs value={current} textColor="inherit" TabIndicatorProps={{ sx:{ bgcolor:'#8A51F1', height: 3 } }}>
                {TOP.map(t => (
                    <Tab key={t.key} label={t.label} component={NavLink} to={t.path}
                         sx={{ textTransform:'none', fontWeight: current===TOP.indexOf(t)?700:600, color:'#000' }}/>
                ))}
            </Tabs>
        </Paper>
    )
}

/* 整页框架 */
function Frame({ children }){
    return (
        <Box sx={{ bgcolor:'#6F79A8', minHeight:'100vh', pb: 6 }}>
            <BrandBar />
            <Container maxWidth={false} sx={{ px: 4 }}>
                <Paper elevation={0} sx={{ mt: 2, borderRadius: 2, overflow:'hidden', bgcolor:'#F3F4F8', width:'100%' }}>
                    <TabsBar />
                    <Box sx={{ p: 2 }}>{children}</Box>
                </Paper>
            </Container>
        </Box>
    )
}

/* CPLayout */
function CPLayout(){
    const { pathname } = useLocation()
    const [collapsed, setCollapsed] = React.useState(false)
    const sidebarWidth = collapsed ? 56 : 260

    return (
        <Box sx={{ display:'flex', alignItems:'flex-start', gap: 2 }}>
            {/* 左侧侧边栏 */}
            <Paper variant="outlined" sx={{ width: sidebarWidth, flex:'0 0 auto', p:0, borderRadius:2, position:'sticky', top: 16, height:'calc(100vh - 32px)', overflow:'auto' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between"
                       sx={{ px:1.5, py:1, bgcolor:'#fff', borderBottom:'1px solid #e1e6ef' }}>
                    {!collapsed && (
                        <Typography variant="subtitle2" sx={{ fontWeight:700, color:'#E28129' }}>
                            Competitive Positioning
                        </Typography>
                    )}
                    <Tooltip title={collapsed ? 'Show sidebar' : 'Hide sidebar'}>
                        <IconButton size="small" onClick={() => setCollapsed(v => !v)}>
                            {collapsed ? <AddCircleOutlineIcon fontSize="small" /> : <RemoveCircleOutlineIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Stack>

                {!collapsed && (
                    <List dense sx={{ py:0.5, bgcolor:'#E4E8F4' }}>
                        {CP_MENU.map(item => (
                            <ListItemButton key={item.key} component={NavLink} to={item.path}
                                            selected={pathname === item.path}
                                            sx={{ '&.Mui-selected':{ bgcolor:'#B3B9DC', ':hover':{ bgcolor:'#B3B9DC' }}}}>
                                <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary={item.label}/>
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Paper>

            {/* 右侧内容 */}
            <Box sx={{ flex:1, minWidth:0 }}>
                <Outlet />
            </Box>
        </Box>
    )
}

// 占位页面
const Placeholder = ({ title }) => (
    <div style={{ padding: 16 }}>
        <h2>{title}</h2>
    </div>
)

// ---- 引入你的页面 ----
import CoreValueOffer from './pages/CoreValueOffer'
import FBLayout from './pages/FBLayout'
import FinancialComparativeAnalysis from './pages/FinancialComparativeAnalysis'

export default function App(){
    const location = useLocation()
    const isAuth = location.pathname.startsWith('/auth')   // ⭐ 关键：按路径切换渲染

    if (isAuth) {
        // 只渲染 Auth 路由，避免被业务路由的 "*" 抢走
        return (
            <Routes>
                <Route path="/auth/login" element={<Login />} />
                {/* 这里可以继续加 /auth/xxx */}
            </Routes>
        )
    }

    // 其它路径都走原来的 Frame + 业务路由
    return (
        <Frame>
            <Routes>
                <Route path="/" element={<Navigate to="/cp/cvo" replace/>} />
                <Route path="/cp" element={<CPLayout />}>
                    <Route path="cvo" element={<CoreValueOffer />} />
                    <Route path="cbd" element={<Placeholder title="Core Brand Differentiator" />} />
                    <Route path="bep" element={<Placeholder title="Brand Equity Positioning" />} />
                    <Route path="vbp" element={<Placeholder title="Value Based Positioning" />} />
                    <Route path="vdm" element={<Placeholder title="Value Drivers Mapping" />} />
                    <Route path="com" element={<Placeholder title="Competitor Offer Mapping" />} />
                    <Route path="pp"  element={<Placeholder title="Price Positioning" />} />
                    <Route path="csw" element={<Placeholder title="Comparative SWOT" />} />
                    <Route path="*" element={<Navigate to="/cp/cvo" replace/>} />
                </Route>

                <Route path="/ca" element={<Placeholder title="Comparative Analysis (coming soon)" />} />

                <Route path="/fb" element={<FBLayout />}>
                    <Route index element={<FinancialComparativeAnalysis />} />
                    <Route path="revenue" element={<Placeholder title="Revenue Comparison" />} />
                    <Route path="trend" element={<Placeholder title="Financial Performance Trend" />} />
                    <Route path="growth" element={<Placeholder title="Growth Analysis" />} />
                    <Route path="country" element={<Placeholder title="Country Figures" />} />
                    <Route path="market-share" element={<Placeholder title="Market Share" />} />
                    <Route path="market-share-country" element={<Placeholder title="Market Share by Country" />} />
                    <Route path="csw" element={<Placeholder title="Comparative SWOT" />} />
                    <Route path="*" element={<Navigate to="/fb" replace/>} />
                </Route>

                <Route path="/ob" element={<Placeholder title="Operational Benchmarking (coming soon)" />} />
                <Route path="*" element={<Navigate to="/cp/cvo" replace/>} />
            </Routes>
        </Frame>
    )
}
