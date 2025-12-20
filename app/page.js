'use client';

import { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import CandidateForm from '../components/candidate/CandidateForm';
import SuccessDialog from '../components/common/SuccessDialog';
import Logo from '../components/common/Logo';

export default function HomePage() {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSuccess = () => {
    setShowSuccessDialog(true);
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 0% 0%, rgba(8, 8, 42, 1) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 40%, rgba(7, 56, 175, 1) 0%, transparent 40%),
          radial-gradient(ellipse at 100% 100%, rgba(8, 8, 42, 1) 0%, transparent 50%),
          radial-gradient(ellipse at 0% 100%, rgba(7, 56, 175, 1) 0%, transparent 50%),
          rgba(8, 8, 42, 1)
        `,
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 0 }}>
            <Logo width={200} height={70} variant="white" />
          </Box>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Start your journey with us. Fill out the application form below.
          </Typography>
        </Box>

        <CandidateForm onSuccess={handleSuccess} />

        <SuccessDialog open={showSuccessDialog} onClose={handleCloseDialog} />
      </Container>
    </Box>
  );
}
