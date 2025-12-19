'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CircularProgress,
} from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';

export default function DashboardLayout({ children }) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Box sx={{ mr: 2 }}>
            <Logo width={120} height={40} variant="white" />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', ml: 2 }}>
            CandidAI
          </Typography>
          <Typography variant="body2" sx={{ mr: 3, display: { xs: 'none', sm: 'block' } }}>
            {user?.email}
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<Logout />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
