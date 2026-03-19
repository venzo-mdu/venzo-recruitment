'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Work,
  LocationOn,
  CurrencyRupee,
  People,
  MoreVert,
  PersonOutline,
  GroupOutlined,
  Search,
  Clear,
  OpenInNew,
} from '@mui/icons-material';
import { getJobPosts, deleteJobPost } from '../../../lib/services/jobPostService';
import { useAuth } from '../../../hooks/useAuth';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'success' },
  DRAFT: { label: 'Draft', color: 'default' },
  PAUSED: { label: 'Paused', color: 'warning' },
  CLOSED: { label: 'Closed', color: 'error' },
};

const EMPLOYMENT_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'internship': 'Internship',
};

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMyJobs, setShowMyJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({ open: false, job: null });

  // Context menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuJob, setMenuJob] = useState(null);

  useEffect(() => {
    if (user) loadJobs();
  }, [user, showMyJobs]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (showMyJobs && user) {
        filters.createdBy = user.id;
      }
      const result = await getJobPosts(filters);
      if (result.success) {
        setJobPosts(result.data);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.job) return;
    try {
      const result = await deleteJobPost(deleteDialog.job.id);
      if (result.success) {
        setJobPosts(prev => prev.filter(j => j.id !== deleteDialog.job.id));
        setSnackbar({ open: true, message: 'Job post deleted', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete job post', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'An error occurred', severity: 'error' });
    } finally {
      setDeleteDialog({ open: false, job: null });
    }
  };

  const handleStatusToggle = async (job) => {
    const newStatus = job.status === 'OPEN' ? 'PAUSED' : 'OPEN';
    try {
      const response = await fetch(`/api/job-posts/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setJobPosts(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
        setSnackbar({ open: true, message: `Job ${newStatus === 'OPEN' ? 'opened' : 'paused'}`, severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
    setMenuAnchor(null);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (v) => v >= 100000 ? `${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L` : v.toLocaleString('en-IN');
    if (min && max) return `₹${fmt(min)} – ₹${fmt(max)}`;
    if (min) return `From ₹${fmt(min)}`;
    return `Up to ₹${fmt(max)}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter jobs by search
  const filteredJobs = jobPosts.filter(job => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(q) ||
      job.department?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q) ||
      job.brand?.toLowerCase().includes(q)
    );
  });

  // Group by brand
  const venzoJobs = filteredJobs.filter(j => j.brand === 'venzo');
  const kytzJobs = filteredJobs.filter(j => j.brand === 'kytz');
  const shelfiJobs = filteredJobs.filter(j => j.brand === 'shelfi');

  const JobCard = ({ job }) => {
    const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.DRAFT;

    return (
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: 3 },
        }}
      >
        <CardContent sx={{ flex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {/* Header: status + menu */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip label={statusConfig.label} color={statusConfig.color} size="small" />
              <Chip
                label={job.brand === 'kytz' ? 'Kytz' : 'Venzo'}
                size="small"
                variant="outlined"
                color={job.brand === 'kytz' ? 'secondary' : 'primary'}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuJob(job); }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          {/* Title */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3 }}>
            {job.title}
          </Typography>

          {/* Meta */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {job.department && (
              <Typography variant="caption" color="text.secondary">
                {job.department}
              </Typography>
            )}
            {job.department && job.location && (
              <Typography variant="caption" color="text.secondary">·</Typography>
            )}
            {job.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <LocationOn sx={{ fontSize: 13, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">{job.location}</Typography>
              </Box>
            )}
          </Box>

          {/* Employment type + salary */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {job.employment_type && (
              <Chip
                icon={<Work sx={{ fontSize: 13 }} />}
                label={EMPLOYMENT_LABELS[job.employment_type] || job.employment_type}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
            {(job.salary_range_min || job.salary_range_max) && (
              <Chip
                icon={<CurrencyRupee sx={{ fontSize: 13 }} />}
                label={formatSalary(job.salary_range_min, job.salary_range_max)}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>

          {/* Description preview */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            }}
          >
            {job.description}
          </Typography>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              Created {formatDate(job.created_at)}
              {!showMyJobs && job.created_by_email && ` by ${job.created_by_email}`}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const JobSection = ({ title, jobs, brandColor }) => {
    if (jobs.length === 0) return null;
    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
          <Chip label={jobs.length} size="small" color={brandColor} variant="outlined" />
        </Box>
        <Grid container spacing={2}>
          {jobs.map(job => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header: Title + Create Job */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Job Posts
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/dashboard/jobs/new')}
          sx={{ px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.8rem' }}
        >
          Create Job
        </Button>
      </Box>

      {/* Toolbar: Job filters + Search */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <ToggleButtonGroup
          value={showMyJobs ? 'mine' : 'all'}
          exclusive
          onChange={(_e, v) => v !== null && setShowMyJobs(v === 'mine')}
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

        <Box sx={{ flex: 1 }} />

        <TextField
          size="small"
          placeholder="Search jobs..."
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

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredJobs.length === 0 ? (
        <Alert severity="info">
          {jobPosts.length === 0
            ? <>No job posts yet. <Button size="small" onClick={() => router.push('/dashboard/jobs/new')}>Create your first job</Button></>
            : 'No jobs match your search.'
          }
        </Alert>
      ) : (
        <>
          <JobSection title="Venzo Technologies" jobs={venzoJobs} brandColor="primary" />
          <JobSection title="Kytz Labs" jobs={kytzJobs} brandColor="secondary" />
          <JobSection title="SHELFi" jobs={shelfiJobs} brandColor="error" />
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { router.push(`/dashboard/jobs/${menuJob?.id}/edit`); setMenuAnchor(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { window.open(`/jobs/${menuJob?.slug || menuJob?.id}`, '_blank'); setMenuAnchor(null); }}>
          <ListItemIcon><OpenInNew fontSize="small" /></ListItemIcon>
          <ListItemText>View Public Page</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuJob && handleStatusToggle(menuJob)}>
          <ListItemIcon>
            {menuJob?.status === 'OPEN' ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{menuJob?.status === 'OPEN' ? 'Pause Job' : 'Open Job'}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setDeleteDialog({ open: true, job: menuJob }); setMenuAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, job: null })}>
        <DialogTitle>Delete Job Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteDialog.job?.title}&quot;? This action cannot be undone.
            Candidates linked to this job will remain but will no longer be associated with any job post.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, job: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
