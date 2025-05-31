import React, { ReactNode, useState } from 'react';
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton,
  Switch,
  FormControlLabel
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookIcon from '@mui/icons-material/Book';
import QuizIcon from '@mui/icons-material/Quiz';
import CodeIcon from '@mui/icons-material/Code';
import TodayIcon from '@mui/icons-material/Today';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSettingsStore } from '@/features/progress/useSettingsStoreFirebase';

const drawerWidth = 240;

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { settings, toggleDarkMode } = useSettingsStore();
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Daily Plan', icon: <TodayIcon />, path: '/daily' },
    { text: 'Theory', icon: <BookIcon />, path: '/theory' },
    { text: 'Questions', icon: <QuizIcon />, path: '/questions' },
    { text: 'Coding Tasks', icon: <CodeIcon />, path: '/tasks' },
    { text: 'Progress', icon: <AssessmentIcon />, path: '/progress' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];


  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Interview Prep
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isSelected = router.pathname === item.path;
          
          return (
            <div key={item.text}>
              <Link href={item.path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItem 
                  sx={{
                    backgroundColor: isSelected ? 'primary.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: isSelected ? 'primary.light' : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              </Link>
            </div>
          );
        })}
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Frontend Interview Prep
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <Toolbar /> {/* Adds spacing below app bar */}
        {children}
      </Box>
    </Box>
  );
}
