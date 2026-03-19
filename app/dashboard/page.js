'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Button,
  TextField,
  Chip,
  Checkbox,
  ListItemText,
  ListSubheader,
  MenuItem,
  FormControl,
  Select,
  OutlinedInput,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  People,
  Star,
  TrendingUp,
  DateRange,
  ViewList,
  ViewModule,
  PersonOutline,
  GroupOutlined,
  Search,
  Clear,
} from '@mui/icons-material';
import CandidateTable from '../../components/hr/CandidateTable';
import CandidateCardView from '../../components/hr/CandidateCardView';
import CandidateDetail from '../../components/hr/CandidateDetail';
import { getCandidates, updateCandidateStatus, deleteCandidate } from '../../lib/services/candidateService';
import { getResumeUrl } from '../../lib/services/storageService';
import { getJobPosts } from '../../lib/services/jobPostService';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user } = useAuth();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [viewMode, setViewMode] = useState('table');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);
  const initialLoadDone = useRef(false);

  // Job post state
  const [jobPosts, setJobPosts] = useState([]);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [showMyJobs, setShowMyJobs] = useState(true);

  // Group jobs by brand
  const groupedJobs = useMemo(() => {
    const groups = { venzo: [], kytz: [], shelfi: [] };
    jobPosts.forEach(job => {
      const brand = job.brand || 'venzo';
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(job);
    });
    return groups;
  }, [jobPosts]);

  // Load job posts on mount and when filter changes
  useEffect(() => {
    if (user) {
      loadJobPosts();
    }
  }, [user, showMyJobs]);

  // Debounce search input
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  // Load candidates when selected jobs or search changes (skip until initial job load is done)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    loadCandidates();
  }, [selectedJobIds, debouncedSearch]);

  const loadJobPosts = async () => {
    setJobsLoading(true);
    try {
      const filters = {};
      if (showMyJobs && user) {
        filters.createdBy = user.id;
      }
      const result = await getJobPosts(filters);
      if (result.success) {
        setJobPosts(result.data);
        const jobIds = result.data.map(j => j.id);
        setSelectedJobIds(jobIds);
        // Load candidates immediately on first load to avoid double trigger
        initialLoadDone.current = true;
        await loadCandidatesWithIds(jobIds);
      } else {
        showSnackbar('Failed to load job posts', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred while loading job posts', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  const loadCandidatesWithIds = async (jobIds, search) => {
    if (!jobIds || jobIds.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const filters = { jobPostIds: jobIds };
      if (search?.trim()) {
        filters.search = search.trim();
      }
      const result = await getCandidates(filters);
      if (result.success) {
        setCandidates(result.data);
        setLoading(false);
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

  const loadCandidates = () => loadCandidatesWithIds(selectedJobIds, debouncedSearch);

  const generateMissingAISummaries = async (candidateList) => {
    const candidatesWithoutSummary = candidateList.filter(
      c => !c.ai_summary || c.ai_summary.trim() === ''
    );

    if (candidatesWithoutSummary.length === 0) return;

    setAiProcessing(true);
    setAiProgress({ current: 0, total: candidatesWithoutSummary.length });

    for (let i = 0; i < candidatesWithoutSummary.length; i++) {
      const candidate = candidatesWithoutSummary[i];

      try {
        setAiProgress({ current: i + 1, total: candidatesWithoutSummary.length });

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
          setCandidates(prev =>
            prev.map(c => {
              if (c.id === candidate.id) {
                return {
                  ...c,
                  ai_summary: data.summary,
                  ai_analysis: data.analysis,
                  overall_score: data.analysis?.overall_score || data.analysis?.scoring?.overall_score || c.overall_score,
                  recommendation: data.analysis?.recommendation || c.recommendation,
                };
              }
              return c;
            })
          );
        }
      } catch (error) {
        console.error(`Error generating AI summary for: ${candidate.full_name}`, error);
      }

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
      const newStatus = currentStatus === 'SHORTLISTED' ? 'PENDING' : 'SHORTLISTED';
      const result = await updateCandidateStatus(candidateId, newStatus);
      if (result.success) {
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
        window.open(result.url, '_blank');
        showSnackbar('Resume opened in new tab', 'success');
      } else {
        showSnackbar('Failed to download resume', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred', 'error');
    }
  };

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    try {
      const result = await deleteCandidate(candidateId);
      if (result.success) {
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

  const handleJobFilterChange = (_event, newValue) => {
    if (newValue !== null) {
      setShowMyJobs(newValue === 'mine');
    }
  };

  const handleJobSelectionChange = (event) => {
    const value = event.target.value;
    // MUI Select returns 'string' on backspace or array
    setSelectedJobIds(typeof value === 'string' ? value.split(',') : value);
  };

  // Build menu items with brand groups
  const renderJobMenuItems = () => {
    const items = [];
    const brandLabels = { venzo: 'Venzo Technologies', kytz: 'Kytz Labs', shelfi: 'SHELFi' };

    for (const [brand, jobs] of Object.entries(groupedJobs)) {
      if (jobs.length === 0) continue;

      const allBrandSelected = jobs.every(j => selectedJobIds.includes(j.id));
      const someBrandSelected = jobs.some(j => selectedJobIds.includes(j.id));

      items.push(
        <ListSubheader
          key={`header-${brand}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'action.hover' },
            lineHeight: '36px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (allBrandSelected) {
              // Deselect all jobs of this brand
              setSelectedJobIds(prev => prev.filter(id => !jobs.find(j => j.id === id)));
            } else {
              // Select all jobs of this brand
              const brandJobIds = jobs.map(j => j.id);
              setSelectedJobIds(prev => [...new Set([...prev, ...brandJobIds])]);
            }
          }}
        >
          <Checkbox
            size="small"
            checked={allBrandSelected}
            indeterminate={someBrandSelected && !allBrandSelected}
            sx={{ p: 0, mr: 0.5 }}
          />
          <Chip
            label={brandLabels[brand] || brand}
            size="small"
            color={brand === 'kytz' ? 'secondary' : 'primary'}
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
          <Typography variant="caption" color="text.secondary">
            ({jobs.length} job{jobs.length > 1 ? 's' : ''})
          </Typography>
        </ListSubheader>
      );

      for (const job of jobs) {
        items.push(
          <MenuItem key={job.id} value={job.id} sx={{ pl: 4 }}>
            <Checkbox size="small" checked={selectedJobIds.includes(job.id)} />
            <ListItemText
              primary={job.title}
              secondary={[job.department, job.location, job.status !== 'OPEN' ? job.status : ''].filter(Boolean).join(' · ')}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        );
      }
    }

    return items;
  };

  // Calculate statistics
  const stats = {
    total: candidates.length,
    inProcess: candidates.filter(c =>
      ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_EXTENDED'].includes(c.status)
    ).length,
    thisWeek: candidates.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.created_at) >= weekAgo;
    }).length,
    hired: candidates.filter(c => c.status === 'HIRED').length,
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

  const effectiveViewMode = isMobile ? 'card' : viewMode;

  const handleViewModeChange = (_event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Render selected value in the select
  const renderSelectedValue = (selected) => {
    if (selected.length === 0) return 'No jobs selected';
    return `${selected.length} Job${selected.length > 1 ? 's' : ''} Selected`;
  };

  return (
    <Box>
      {/* Header: Title + View Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Candidate Management
        </Typography>
        {!isMobile && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="table" sx={{ px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.8rem' }}>
              <ViewList fontSize="small" sx={{ mr: 0.5 }} />
              Table
            </ToggleButton>
            <ToggleButton value="card" sx={{ px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.8rem' }}>
              <ViewModule fontSize="small" sx={{ mr: 0.5 }} />
              Cards
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Toolbar: Job filters + Search */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Job ownership toggle */}
        <ToggleButtonGroup
          value={showMyJobs ? 'mine' : 'all'}
          exclusive
          onChange={handleJobFilterChange}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="mine" sx={{ px: 1.5, py: 0.6, textTransform: 'none', fontSize: '0.8rem' }}>
            My Jobs
          </ToggleButton>
          <ToggleButton value="all" sx={{ px: 1.5, py: 0.6, textTransform: 'none', fontSize: '0.8rem' }}>
            All Jobs
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Job select */}
        <FormControl size="small" sx={{ minWidth: 180, flexShrink: 0 }}>
          <Select
            multiple
            value={selectedJobIds}
            onChange={handleJobSelectionChange}
            input={<OutlinedInput />}
            displayEmpty
            renderValue={renderSelectedValue}
            MenuProps={{ PaperProps: { sx: { maxHeight: 400 } } }}
            sx={{ fontSize: '0.85rem' }}
          >
            {renderJobMenuItems()}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search candidates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: '25%' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* No jobs message */}
      {jobPosts.length === 0 && !jobsLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No job posts found. <Button size="small" onClick={() => router.push('/dashboard/jobs/new')}>Create one</Button>
        </Alert>
      )}

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

      {/* Statistics Cards */}
      {selectedJobIds.length > 0 && (
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard icon={<People />} title="Total Applications" value={stats.total} color="#0030ce" />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} title="In Process" value={stats.inProcess} color="#ff9800" />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard icon={<DateRange />} title="This Week" value={stats.thisWeek} color="#2196f3" />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard icon={<Star />} title="Hired" value={stats.hired} color="#4caf50" />
          </Grid>
        </Grid>
      )}

      {/* Candidate View - Table or Card based on view mode */}
      {selectedJobIds.length > 0 && (
        <>
          {effectiveViewMode === 'table' ? (
            <CandidateTable
              candidates={candidates}
              loading={loading}
              onViewDetails={handleViewDetails}
              onToggleShortlist={handleToggleShortlist}
              onUpdateStatus={handleUpdateStatus}
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
        </>
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetail
        candidate={selectedCandidate}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStatusChange={handleUpdateStatus}
        onRefresh={() => {
          loadCandidates();
          if (selectedCandidate) {
            const updated = candidates.find(c => c.id === selectedCandidate.id);
            if (updated) setSelectedCandidate(updated);
          }
        }}
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
