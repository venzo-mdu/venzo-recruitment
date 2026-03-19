'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn,
  Work,
  CurrencyRupee,
  ArrowForward,
} from '@mui/icons-material';
import Logo from '../components/common/Logo';
import { getBrandFromHostname, getBrandConfig } from '../lib/constants/brands';

export default function HomePage() {
  const router = useRouter();
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState('venzo');
  const [brandConfig, setBrandConfig] = useState(getBrandConfig('venzo'));

  useEffect(() => {
    const detectedBrand = getBrandFromHostname(window.location.hostname);
    setBrand(detectedBrand);
    setBrandConfig(getBrandConfig(detectedBrand));
    loadJobPosts(detectedBrand);
  }, []);

  const loadJobPosts = async (brandKey) => {
    try {
      const response = await fetch(`/api/job-posts?brand=${brandKey}&status=OPEN`);
      const data = await response.json();
      if (data.success) {
        setJobPosts(data.data);
      }
    } catch (error) {
      console.error('Error loading job posts:', error);
    } finally {
      setLoading(false);
    }
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

        {/* Header */}
        <Box
          sx={{
            background: t.headerBg,
            color: t.headerText,
            py: { xs: 4, md: 6 },
            px: { xs: 2, md: 4 },
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <Logo width={140} height={50} variant="white" brand={brand} />
            </Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
                lineHeight: 1.1,
                mb: 1,
                color: t.headerText,
              }}
            >
              Join {brandConfig.name}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                opacity: 0.85,
                color: t.headerText,
              }}
            >
              Explore our open positions and find the right fit for your career
            </Typography>
          </Container>
        </Box>

        {/* Job Listings */}
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: t.buttonBg }} />
            </Box>
          ) : jobPosts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No open positions at the moment
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Check back soon for new opportunities at {brandConfig.name}.
              </Typography>
            </Box>
          ) : (
            <>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 3, color: '#0a1628' }}
              >
                Open Positions ({jobPosts.length})
              </Typography>
              <Grid container spacing={3}>
                {jobPosts.map((job) => (
                  <Grid item xs={12} sm={6} md={4} key={job.id}>
                    <Card
                      elevation={2}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/jobs/${job.slug || job.id}`)}
                    >
                      <CardContent sx={{ flex: 1, p: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          gutterBottom
                          sx={{ color: '#0a1628', lineHeight: 1.3 }}
                        >
                          {job.title}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {job.employment_type && (
                            <Chip
                              icon={<Work sx={{ fontSize: 16 }} />}
                              label={employmentTypeLabels[job.employment_type] || job.employment_type}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {job.location && (
                            <Chip
                              icon={<LocationOn sx={{ fontSize: 16 }} />}
                              label={job.location}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {job.department && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {job.department}
                          </Typography>
                        )}

                        {(job.salary_range_min || job.salary_range_max) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <CurrencyRupee sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatSalaryRange(job.salary_range_min, job.salary_range_max)}
                            </Typography>
                          </Box>
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {job.description}
                        </Typography>
                      </CardContent>

                      <CardActions sx={{ px: 3, pb: 2 }}>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForward />}
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/jobs/${job.slug || job.id}`);
                          }}
                          sx={{
                            backgroundColor: t.buttonBg,
                            color: t.buttonText,
                            '&:hover': {
                              backgroundColor: t.buttonBg,
                              opacity: 0.9,
                            },
                          }}
                        >
                          View & Apply
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Container>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 3, opacity: 0.6 }}>
          <Typography variant="body2" color="text.secondary">
            {brandConfig.name} Careers
          </Typography>
        </Box>
      </Box>
    </>
  );
}
