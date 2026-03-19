'use client';

import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

export default function SuccessDialog({ open, onClose, brandName, brandTheme }) {
  const accentColor = brandTheme?.buttonBg || '#0030ce';
  const accentText = brandTheme?.buttonText || '#ffffff';
  const company = brandName || 'us';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <CheckCircle sx={{ fontSize: 80, color: accentColor }} />
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 2 }}>
          Application Submitted!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Thank you for applying to {company}. We have received your application and will review it shortly.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You will receive a confirmation email at the address you provided. Our team will contact you if your profile matches our requirements.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          size="large"
          sx={{
            px: 4,
            backgroundColor: accentColor,
            color: accentText,
            '&:hover': { backgroundColor: accentColor, opacity: 0.9 },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
