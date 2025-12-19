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
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
        </Box>
        <DialogTitle sx={{ p: 0, mb: 2 }}>
          <Typography variant="h4" component="div" fontWeight="bold">
            Application Submitted!
          </Typography>
        </DialogTitle>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Thank you for applying to Venzo. We have received your application and will review it shortly.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You will receive a confirmation email at the address you provided. Our HR team will contact you if your profile matches our requirements.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          size="large"
          sx={{ px: 4 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
