// src/pages/MRALayout.jsx
import * as React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
    Box, Paper, Stack, Typography, IconButton, Tooltip,
    List, ListItemButton, ListItemText, Divider, ListSubheader
} from '@mui/material'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

/** 单一来源：/mra 侧边栏菜单（已合并三页为“Geographical Performance Analysis”） */
const MRA_MAIN = [
    { key:'select',  label:'Competitor Selection',               path:'/mra/competitor-selection' },
    { key:'geo',     label:'Geographical Performance Analysis',  path:'/mra/geo' }, // 合并入口
    { key:'bench',   label:'Industry Benchmarks',                path:'/mra/benchmarks' },
    { key:'scale',   label:'Scale-Value Comparison',             path:'/mra/scale-value' },
    { key:'battle',  label:'Battlefield Positioning',            path:'/mra/battlefield' },
    { key:'reach',   label:'Market Reach Analysis',              path:'/mra/market-reach' },
    // 已合并到 geo：以下两项不再出现在侧栏
    // { key:'share',  label:'Market Share by Country',           path:'/mra/share' },
    // { key:'plant',  label:'Production Plant',                  path:'/mra/plant' },
    { key:'channel', label:'Channel Mix Comparison',             path:'/mra/channel-mix' },
    { key:'via',     label:'Vertical Integration Assessment',    path:'/mra/vertical-integration' },
]

// “DATA SOURCE GUIDE” 小节
const MRA_DATASOURCE = [
    { key:'ds-competitor', label:'Competitor Info Data Source', path:'/mra/datasource/competitor-info' },
    { key:'ds-channel',    label:'Channel Mix Data Source',     path:'/mra/datasource/channel-mix' },
]

export default function MRALayout() {
    const [collapsed, setCollapsed] = React.useState(false)
    const sidebarWidth = collapsed ? 56 : 260

    return (
        <Box sx={{ display:'flex', alignItems:'stretch', gap: 2, width:'100%' }}>
            {/* 左侧侧边栏 */}
            <Paper
                variant="outlined"
                sx={{
                    width: sidebarWidth, flex:'0 0 auto', p:0, borderRadius:2,
                    position:'sticky', top:16, height:'calc(100vh - 32px)', overflow:'auto'
                }}
            >
                {/* 标题 + 折叠 */}
                <Stack
                    direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ px:1.5, py:1, bgcolor:'#2b3458', color:'#fff' }}
                >
                    {!collapsed && (
                        <Typography variant="subtitle2" sx={{ fontWeight:800, letterSpacing:.2 }}>
                            Strategic <Box component="span" sx={{ color:'#FF5A5A', fontWeight:900 }}>ALLY</Box>
                        </Typography>
                    )}
                    <Tooltip title={collapsed ? 'Show sidebar' : 'Hide sidebar'}>
                        <IconButton size="small" onClick={() => setCollapsed(v => !v)} sx={{ color:'#fff' }}>
                            {collapsed ? <AddCircleOutlineIcon fontSize="small" /> : <RemoveCircleOutlineIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* 菜单列表 */}
                {!collapsed && (
                    <>
                        <List dense sx={{ py:0, bgcolor:'#E4E8F4' }}>
                            {MRA_MAIN.map(item => (
                                <ListItemButton
                                    key={item.key}
                                    component={NavLink}
                                    to={item.path}
                                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                                    sx={{
                                        '&.active': { bgcolor:'#B3B9DC', '&:hover': { bgcolor:'#B3B9DC' } },
                                    }}
                                >
                                    <ListItemText primaryTypographyProps={{ fontSize: 13.5 }} primary={item.label} />
                                </ListItemButton>
                            ))}
                        </List>

                        <Divider />

                        {/* DATA SOURCE GUIDE 小节 */}
                        <List
                            dense
                            subheader={
                                <ListSubheader component="div" sx={{ bgcolor:'#E4E8F4', fontWeight:800, fontSize:12, color:'#2b3458' }}>
                                    DATA SOURCE GUIDE
                                </ListSubheader>
                            }
                            sx={{ py:0, bgcolor:'#E4E8F4' }}
                        >
                            {MRA_DATASOURCE.map(item => (
                                <ListItemButton
                                    key={item.key}
                                    component={NavLink}
                                    to={item.path}
                                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                                    sx={{ '&.active': { bgcolor:'#B3B9DC', '&:hover': { bgcolor:'#B3B9DC' } } }}
                                >
                                    <ListItemText primaryTypographyProps={{ fontSize: 13.5 }} primary={item.label} />
                                </ListItemButton>
                            ))}
                        </List>
                    </>
                )}
            </Paper>

            {/* 右侧内容区域 */}
            <Box sx={{ flex:'1 1 auto', minWidth:0, width:'100%' }}>
                <Outlet />
            </Box>
        </Box>
    )
}
