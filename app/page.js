'use client';

import { useState } from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { CheckBox as CheckBoxIcon } from '@mui/icons-material';
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

  const checklistItems = [
    'Can speak clearly on calls and write crisp updates',
    'Are comfortable with systems/screens/flows',
    'Learn fast, ask smart questions',
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#e3ebfb',
      }}
    >
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Left Pane - Job Info */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            background: `
              radial-gradient(ellipse at 0% 100%, #0030ce 0%, transparent 50%),
              radial-gradient(ellipse at 100% 50%, #0030ce 0%, transparent 40%),
              #0a1628
            `,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 2.5, sm: 4, md: 5 },
          }}
        >
          <Box>
            {/* Logo */}
            <Box sx={{ mb: { xs: 2, md: 4 } }}>
              <Logo width={140} height={50} variant="white" />
            </Box>

            {/* Main Headline */}
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2.25rem', md: '2.5rem' },
                lineHeight: 1.1,
                mb: { xs: 0.5, md: 1 },
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
              }}
            >
              Stop Processing Trade Finance.
            </Typography>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2.25rem', md: '2.5rem' },
                lineHeight: 1.1,
                mb: { xs: 1.5, md: 2 },
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
              }}
            >
              Start Building It.
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                fontSize: { xs: '0.85rem', sm: '1.1rem' },
                mb: { xs: 2, md: 4 },
                opacity: 0.9,
              }}
            >
              Move from Ops to TradeTech: QA → Implementation Consulting
            </Typography>

            {/* You'll fit right in section - Hidden on mobile */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderRadius: 2,
                p: 2,
                mb: 3,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  mb: 2,
                  color: 'white',
                }}
              >
                You'll fit right in if you
              </Typography>

              {checklistItems.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <CheckBoxIcon
                    sx={{
                      color: '#60a5fa',
                      fontSize: 22,
                      mt: 0.2,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'white',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    {item}
                  </Typography>
                </Box>
              ))}
            </Paper>

            {/* Additional note - Hidden on mobile */}
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                mb: { xs: 3, md: 4 },
                opacity: 0.9,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              And of course, know LC's, Guarantees, Collections, SWIFT in your sleep.
            </Typography>

            {/* Bottom Info Card */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: '#0030ce',
                borderRadius: 2,
                p: { xs: 1.5, sm: 2.5 },
                mt: 'auto',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  mb: { xs: 0.5, sm: 1.5 },
                  fontSize: { xs: '0.8rem', sm: '1rem' },
                }}
              >
                Work on Trade Finance, SCF & TBML platforms with leading banks and fintechs.
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1.1rem' },
                }}
              >
                Chennai/Hybrid | ₹6–9 LPA | 15 openings
              </Typography>
            </Paper>
          </Box>
        </Grid>

        {/* Right Pane - Application Form */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: '#e3ebfb',
          }}
        >
          <Container maxWidth="sm" sx={{ py: { xs: 2, md: 0 } }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 600,
                mb: 1,
                textAlign: 'center',
                color: '#0a1628',
              }}
            >
              Apply Now
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, textAlign: 'center' }}
            >
              Fill out the form below to submit your application
            </Typography>

            <CandidateForm onSuccess={handleSuccess} />
          </Container>
        </Grid>
      </Grid>

      <SuccessDialog open={showSuccessDialog} onClose={handleCloseDialog} />
    </Box>
  );
}
