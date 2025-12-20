'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

export default function SuccessDialog({ open, onClose }) {
  const darkTheme = {
    background: 'rgba(8, 8, 42, 0.98)',
    border: 'rgba(7, 56, 175, 0.5)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    accent: 'rgba(7, 56, 175, 1)',
    success: '#22c55e',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: darkTheme.background,
          backgroundImage: 'linear-gradient(180deg, rgba(8, 8, 42, 1) 0%, rgba(7, 56, 175, 0.3) 100%)',
          border: `1px solid ${darkTheme.border}`,
          borderRadius: 3,
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <CheckCircle sx={{ fontSize: 80, color: darkTheme.success }} />
        </Box>
        <DialogTitle sx={{ p: 0, mb: 2 }}>
          <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: darkTheme.text }}>
            Application Submitted!
          </Typography>
        </DialogTitle>
        <Typography variant="body1" sx={{ mb: 2, color: darkTheme.textSecondary }}>
          Thank you for applying to Venzo. We have received your application and will review it shortly.
        </Typography>
        <Typography variant="body2" sx={{ color: darkTheme.textSecondary }}>
          You will receive a confirmation email at the address you provided. Our HR team will contact you if your profile matches our requirements.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          size="large"
          sx={{
            px: 4,
            backgroundColor: darkTheme.accent,
            color: '#ffffff',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'rgba(7, 70, 200, 1)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
