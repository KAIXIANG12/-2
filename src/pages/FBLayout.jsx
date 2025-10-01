import * as React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
    Box, Paper, Stack, Typography, IconButton, Tooltip, List, ListItemButton, ListItemText
} from '@mui/material'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

const FB_MENU = [
    { key:'fca', label:'Financial Comparative Analysis', path:'/fb' },
    { key:'rev', label:'Revenue Comparison',             path:'/fb/revenue' },
    { key:'fpt', label:'Financial Performance Trend',    path:'/fb/trend' },
    { key:'ga',  label:'Growth Analysis',                path:'/fb/growth' },
    { key:'cf',  label:'Country Figures',                path:'/fb/country' },
    { key:'ms',  label:'Market Share',                   path:'/fb/market-share' },
    { key:'msc', label:'Market Share by Country',        path:'/fb/market-share-country' },
    { key:'csw', label:'Comparative SWOT',               path:'/fb/csw' },
]

export default function FBLayout(){
    const { pathname } = useLocation()
    const [collapsed, setCollapsed] = React.useState(false)
    const sidebarWidth = collapsed ? 56 : 260

    return (
        // 🚩 关键：让这一层就铺满整行，并允许右侧自由伸展
        <Box sx={{ display:'flex', alignItems:'stretch', gap: 2, width:'100%' }}>
            {/* 左侧侧边栏 */}
            <Paper variant="outlined" sx={{
                width: sidebarWidth, flex:'0 0 auto', p:0, borderRadius:2,
                position:'sticky', top: 16, height:'calc(100vh - 32px)', overflow:'auto'
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between"
                       sx={{ px:1.5, py:1, bgcolor:'#fff', borderBottom:'1px solid #e1e6ef' }}>
                    {!collapsed && (
                        <Typography variant="subtitle2" sx={{ fontWeight:700, color:'#E28129' }}>
                            Financial Benchmarking
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
                        {FB_MENU.map(item => (
                            <ListItemButton
                                key={item.key}
                                component={NavLink}
                                to={item.path}
                                sx={{ '&.active': { bgcolor:'#B3B9DC', '&:hover':{ bgcolor:'#B3B9DC' }}}}
                            >
                                <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary={item.label}/>
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Paper>

            {/* 右侧内容 —— 🚩 关键：允许扩展并明确 width:100% */}
            <Box sx={{ flex:'1 1 auto', minWidth:0, width:'100%' }}>
                <Outlet />
            </Box>
        </Box>
    )
}
