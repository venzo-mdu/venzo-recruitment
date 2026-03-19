'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  Work,
  CurrencyRupee,
  ArrowBack,
  Business,
} from '@mui/icons-material';
import CandidateForm from '../../../components/candidate/CandidateForm';
import SuccessDialog from '../../../components/common/SuccessDialog';
import Logo from '../../../components/common/Logo';
import { getBrandFromHostname, getBrandConfig } from '../../../lib/constants/brands';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [jobPost, setJobPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [brand, setBrand] = useState('venzo');
  const [brandConfig, setBrandConfig] = useState(getBrandConfig('venzo'));

  useEffect(() => {
    const detectedBrand = getBrandFromHostname(window.location.hostname);
    setBrand(detectedBrand);
    setBrandConfig(getBrandConfig(detectedBrand));
    fetchJobPost();
  }, [params.id]);

  const fetchJobPost = async () => {
    try {
      const response = await fetch(`/api/job-posts/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setJobPost(data.data);
        // Use job's brand or domain-detected brand
        const effectiveBrand = data.data.brand || getBrandFromHostname(window.location.hostname);
        setBrand(effectiveBrand);
        setBrandConfig(getBrandConfig(effectiveBrand));
      } else {
        setError('Job post not found');
      }
    } catch (err) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccessDialog(true);
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    // Preserve brand context — append brand param on localhost
    const isLocalhost = window.location.hostname.includes('localhost');
    const brandParam = isLocalhost && brand !== 'venzo' ? `?brand=${brand}` : '';
    router.push(`/${brandParam}`);
  };

  const formatSalaryRange = (min, max) => {
    if (!min && !max) return null;
    const format = (val) => {
      if (val >= 100000) return `${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)} LPA`;
      return `${val.toLocaleString('en-IN')}`;
    };
    if (min && max) return `${format(min)} – ${format(max)}`;
    if (min) return `From ${format(min)}`;
    return `Up to ${format(max)}`;
  };

  const employmentTypeLabels = {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    'contract': 'Contract',
    'internship': 'Internship',
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !jobPost) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Job not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/')}>
          Back to Jobs
        </Button>
      </Container>
    );
  }

  const t = brandConfig.theme;

  return (
    <>
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TF36G24R');`}
      </Script>

      <Box sx={{ minHeight: '100vh', backgroundColor: t.pageBg }}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TF36G24R"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <Grid container sx={{ height: { md: '100vh' }, minHeight: { xs: 'auto', md: '100vh' }, maxHeight: { md: '100vh' }, overflow: 'hidden' }}>
          {/* Left Pane - Job Description */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              background: t.headerBg,
              color: t.headerText,
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 2.5, sm: 3, md: 3 },
              height: { md: '100vh' },
              overflow: 'hidden',
            }}
          >
            {/* Fixed nav bar at top */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexShrink: 0 }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => router.push('/')}
                  sx={{ color: t.headerText, minWidth: 'auto', px: 1 }}
                  size="small"
                >
                  All Jobs
                </Button>
                <Box sx={{ flex: 1 }} />
                <Logo width={120} height={40} variant="white" brand={brand} />
            </Box>

            {/* Content area */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Job Title */}
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  lineHeight: 1.1,
                  mb: 1.5,
                  flexShrink: 0,
                  color: t.headerText,
                }}
              >
                {jobPost.title}
              </Typography>

              {/* Meta chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, flexShrink: 0 }}>
                {jobPost.employment_type && (
                  <Chip
                    icon={<Work sx={{ fontSize: 16, color: `${t.chipText} !important` }} />}
                    label={employmentTypeLabels[jobPost.employment_type] || jobPost.employment_type}
                    size="small"
                    sx={{ backgroundColor: t.chipBg, color: t.chipText }}
                  />
                )}
                {jobPost.location && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 16, color: `${t.chipText} !important` }} />}
                    label={jobPost.location}
                    size="small"
                    sx={{ backgroundColor: t.chipBg, color: t.chipText }}
                  />
                )}
                {jobPost.department && (
                  <Chip
                    icon={<Business sx={{ fontSize: 16, color: `${t.chipText} !important` }} />}
                    label={jobPost.department}
                    size="small"
                    sx={{ backgroundColor: t.chipBg, color: t.chipText }}
                  />
                )}
              </Box>

              {/* Salary */}
              {(jobPost.salary_range_min || jobPost.salary_range_max) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, flexShrink: 0, color: t.headerText }}>
                  <CurrencyRupee sx={{ fontSize: 16 }} />
                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.95rem' }}>
                    {formatSalaryRange(jobPost.salary_range_min, jobPost.salary_range_max)}
                  </Typography>
                </Box>
              )}

              {/* Description */}
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: t.cardAccent,
                  borderRadius: 2,
                  p: { xs: 1.5, sm: 2 },
                  mb: 1.5,
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1, color: t.headerText, flexShrink: 0 }}
                >
                  About this role
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    color: `${t.headerText}e6`,
                    lineHeight: 1.6,
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    '& p': { m: 0, mb: 0.5 },
                    '& br': { display: 'block', content: '""', mb: 0.3 },
                  }}
                >
                  {jobPost.description.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para.replace(/\n/g, ' ').trim()}</p>
                  ))}
                </Typography>
              </Paper>

              {/* Requirements */}
              {jobPost.requirements && (
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: t.accentBg,
                    borderRadius: 2,
                    p: { xs: 1.5, sm: 2 },
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 0.5, color: t.accentText }}
                  >
                    Key Requirements
                  </Typography>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      color: t.accentText,
                      opacity: 0.85,
                      lineHeight: 1.5,
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      '& p': { m: 0, mb: 0.3 },
                    }}
                  >
                    {jobPost.requirements.split(/\n\n+/).map((para, i) => (
                      <p key={i}>{para.replace(/\n/g, ' ').trim()}</p>
                    ))}
                  </Typography>
                </Paper>
              )}
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
              p: { xs: 2, sm: 3, md: 3 },
              backgroundColor: t.pageBg,
              height: { md: '100vh' },
              overflow: 'hidden',
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
                Apply for {jobPost.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: 'center' }}
              >
                Fill out the form below to submit your application
              </Typography>

              <CandidateForm
                onSuccess={handleSuccess}
                jobPostId={jobPost.id}
                jobTitle={jobPost.title}
                employmentType={jobPost.employment_type}
                brandTheme={t}
                brandKey={brand}
              />
            </Container>
          </Grid>
        </Grid>

        <SuccessDialog open={showSuccessDialog} onClose={handleCloseDialog} brandName={brandConfig.name} brandTheme={t} />
      </Box>
    </>
  );
}
