'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  People,
  Star,
  TrendingUp,
  DateRange,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import CandidateTable from '../../components/hr/CandidateTable';
import CandidateCardView from '../../components/hr/CandidateCardView';
import CandidateDetail from '../../components/hr/CandidateDetail';
import { getCandidates, updateCandidateStatus, deleteCandidate } from '../../lib/services/candidateService';
import { getResumeUrl } from '../../lib/services/storageService';

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const result = await getCandidates();
      if (result.success) {
        setCandidates(result.data);
        setLoading(false); // Set loading to false immediately after fetching

        // Trigger AI analysis for candidates without summaries (non-blocking)
        // Don't await - let it run in the background
        generateMissingAISummaries(result.data);
      } else {
        showSnackbar('Failed to load candidates', 'error');
        setLoading(false);
      }
    } catch (error) {
      showSnackbar('An error occurred while loading candidates', 'error');
      setLoading(false);
    }
  };

  const generateMissingAISummaries = async (candidateList) => {
    // Find candidates without AI summaries
    const candidatesWithoutSummary = candidateList.filter(
      c => !c.ai_summary || c.ai_summary.trim() === ''
    );

    if (candidatesWithoutSummary.length === 0) {
      return; // No candidates need AI analysis
    }

    setAiProcessing(true);
    setAiProgress({ current: 0, total: candidatesWithoutSummary.length });

    console.log(`Starting AI analysis for ${candidatesWithoutSummary.length} candidates...`);

    // Process candidates one by one
    for (let i = 0; i < candidatesWithoutSummary.length; i++) {
      const candidate = candidatesWithoutSummary[i];

      try {
        setAiProgress({ current: i + 1, total: candidatesWithoutSummary.length });

        console.log(`Generating AI summary for: ${candidate.full_name}`);

        const response = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: candidate.id,
            resumePath: candidate.resume_path,
            candidateName: candidate.full_name,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Update local state with new summary and analysis data
          setCandidates(prev =>
            prev.map(c => {
              if (c.id === candidate.id) {
                return {
                  ...c,
                  ai_summary: data.summary,
                  ai_analysis: data.analysis,
                  overall_score: data.analysis?.scoring?.overall_score || c.overall_score,
                  recommendation: data.analysis?.recommendation || c.recommendation,
                };
              }
              return c;
            })
          );

          console.log(`✓ AI summary generated for: ${candidate.full_name}`);
        } else {
          console.error(`✗ Failed to generate AI summary for: ${candidate.full_name}`, data.error);
        }
      } catch (error) {
        console.error(`✗ Error generating AI summary for: ${candidate.full_name}`, error);
      }

      // Add a small delay to avoid rate limiting
      if (i < candidatesWithoutSummary.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setAiProcessing(false);
    setAiProgress({ current: 0, total: 0 });

    if (candidatesWithoutSummary.length > 0) {
      showSnackbar(
        `AI analysis completed for ${candidatesWithoutSummary.length} candidate(s)`,
        'success'
      );
    }
  };


  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailOpen(true);
  };

  const handleToggleShortlist = async (candidateId, currentStatus) => {
    try {
      // Toggle between SHORTLISTED and PENDING
      const newStatus = currentStatus === 'SHORTLISTED' ? 'PENDING' : 'SHORTLISTED';
      const result = await updateCandidateStatus(candidateId, newStatus);
      if (result.success) {
        // Update local state
        setCandidates(prev =>
          prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c)
        );
        showSnackbar(
          newStatus === 'SHORTLISTED' ? 'Candidate shortlisted' : 'Candidate removed from shortlist',
          'success'
        );
      } else {
        showSnackbar('Failed to update status', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred', 'error');
    }
  };

  const handleUpdateStatus = async (candidateId, newStatus) => {
    try {
      const result = await updateCandidateStatus(candidateId, newStatus);
      if (result.success) {
        // Update local state
        setCandidates(prev =>
          prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c)
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const handleDownloadResume = async (resumePath, candidateName) => {
    try {
      const result = await getResumeUrl(resumePath);
      if (result.success) {
        // Open in new tab
        window.open(result.url, '_blank');
        showSnackbar('Resume opened in new tab', 'success');
      } else {
        showSnackbar('Failed to download resume', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred', 'error');
    }
  };

  const handleRejectCandidate = async (candidateId) => {
    try {
      const result = await updateCandidateStatus(candidateId, 'REJECTED');
      if (result.success) {
        // Update local state
        setCandidates(prev =>
          prev.map(c => c.id === candidateId ? { ...c, status: 'REJECTED' } : c)
        );
        showSnackbar('Candidate has been rejected', 'success');
      } else {
        showSnackbar('Failed to reject candidate', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred', 'error');
    }
  };

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    try {
      const result = await deleteCandidate(candidateId);
      if (result.success) {
        // Remove from local state
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
        showSnackbar(`${candidateName}'s application has been deleted`, 'success');
      } else {
        showSnackbar('Failed to delete candidate', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred while deleting', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate statistics
  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'SHORTLISTED').length,
    thisWeek: candidates.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.created_at) >= weekAgo;
    }).length,
    avgSalary: candidates.length > 0
      ? Math.round(candidates.reduce((sum, c) => sum + c.expected_salary, 0) / candidates.length)
      : 0,
  };

  const StatCard = ({ icon, title, value, color }) => (
    <Card elevation={2}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            <Typography
              fontWeight="bold"
              sx={{
                color,
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              p: { xs: 1, sm: 1.5, md: 2 },
              borderRadius: 2,
              color,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiSvgIcon-root': {
                fontSize: { xs: 24, sm: 32, md: 40 },
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Determine which view to show
  const effectiveViewMode = isMobile ? 'card' : viewMode;

  const handleViewModeChange = (_event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box>
      {/* Header with Title and View Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Candidate Management
        </Typography>

        {/* View Toggle - Only show on desktop */}
        {!isMobile && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewList fontSize="small" sx={{ mr: 0.5 }} />
              Table
            </ToggleButton>
            <ToggleButton value="card" aria-label="card view">
              <ViewModule fontSize="small" sx={{ mr: 0.5 }} />
              Cards
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* AI Processing Indicator */}
      {aiProcessing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Generating AI summaries... ({aiProgress.current} of {aiProgress.total})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(aiProgress.current / aiProgress.total) * 100}
            />
          </Box>
        </Alert>
      )}

      {/* Statistics Cards - 2 per row on mobile (xs=6), 4 per row on desktop */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<People />}
            title="Total Applications"
            value={stats.total}
            color="#0030ce"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<Star />}
            title="Shortlisted"
            value={stats.shortlisted}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<DateRange />}
            title="This Week"
            value={stats.thisWeek}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp />}
            title="Avg Salary"
            value={`₹${(stats.avgSalary / 100000).toFixed(1)}L`}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Candidate View - Table or Card based on view mode */}
      {effectiveViewMode === 'table' ? (
        <CandidateTable
          candidates={candidates}
          loading={loading}
          onViewDetails={handleViewDetails}
          onToggleShortlist={handleToggleShortlist}
          onDownloadResume={handleDownloadResume}
          onDelete={handleDeleteCandidate}
        />
      ) : (
        <CandidateCardView
          candidates={candidates}
          loading={loading}
          onViewDetails={handleViewDetails}
          onToggleShortlist={handleToggleShortlist}
          onUpdateStatus={handleUpdateStatus}
          onDownloadResume={handleDownloadResume}
          onDelete={handleDeleteCandidate}
        />
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetail
        candidate={selectedCandidate}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onToggleShortlist={handleToggleShortlist}
        onReject={handleRejectCandidate}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
