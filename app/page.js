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
        backgroundColor: '#e3ebfb',
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Logo width={200} height={70} />
          </Box>
          {/* <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #0030ce 30%, #3354d9 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Join Venzo
          </Typography> */}
          <Typography variant="h6" color="text.secondary">
            Start your journey with us. Fill out the application form below.
          </Typography>
        </Box>

        <CandidateForm onSuccess={handleSuccess} />

        <SuccessDialog open={showSuccessDialog} onClose={handleCloseDialog} />
      </Container>
    </Box>
  );
}
