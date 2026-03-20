'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Work,
  Business,
  LocationOn,
  CurrencyRupee,
  Save,
  ArrowBack,
} from '@mui/icons-material';
import { BRAND_OPTIONS } from '../../lib/constants/brands';
import { useAuth } from '../../hooks/useAuth';

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const JOB_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function JobPostForm({ existingJob = null, onSuccess }) {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    brand: 'venzo',
    department: '',
    location: '',
    employmentType: 'full-time',
    salaryRangeMin: '',
    salaryRangeMax: '',
    description: '',
    requirements: '',
    status: 'OPEN',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (existingJob) {
      setFormData({
        title: existingJob.title || '',
        brand: existingJob.brand || 'venzo',
        department: existingJob.department || '',
        location: existingJob.location || '',
        employmentType: existingJob.employment_type || 'full-time',
        salaryRangeMin: existingJob.salary_range_min || '',
        salaryRangeMax: existingJob.salary_range_max || '',
        description: existingJob.description || '',
        requirements: existingJob.requirements || '',
        status: existingJob.status || 'OPEN',
      });
    }
  }, [existingJob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.brand) newErrors.brand = 'Brand is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (formData.description.trim().length < 100) {
      newErrors.description = 'Description must be at least 100 characters for effective AI evaluation';
    }
    if (formData.salaryRangeMin && formData.salaryRangeMax) {
      if (Number(formData.salaryRangeMin) > Number(formData.salaryRangeMax)) {
        newErrors.salaryRangeMax = 'Max salary must be greater than min salary';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validate()) return;

    setLoading(true);
    try {
      const url = existingJob
        ? `/api/job-posts/${existingJob.id}`
        : '/api/job-posts';
      const method = existingJob ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitSuccess(existingJob ? 'Job post updated successfully!' : 'Job post created successfully!');
        if (onSuccess) {
          onSuccess(data.data);
        } else {
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      } else {
        setSubmitError(data.error || 'Failed to save job post');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight="bold">
          {existingJob ? 'Edit Job Post' : 'Create Job Post'}
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>
      )}
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          {/* Brand */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Company / Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              error={!!errors.brand}
              helperText={errors.brand}
              required
            >
              {BRAND_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {JOB_STATUSES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Title / Position"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              required
              placeholder="e.g., Senior QA Analyst, Full Stack Developer"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Work /></InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Department */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Engineering, Trade Finance"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Business /></InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Chennai, Remote, Hybrid"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><LocationOn /></InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Employment Type */}
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Employment Type"
              name="employmentType"
              value={formData.employmentType}
              onChange={handleChange}
            >
              {EMPLOYMENT_TYPES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Salary Range */}
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              label="Salary Range Min (LPA)"
              name="salaryRangeMin"
              type="number"
              value={formData.salaryRangeMin}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><CurrencyRupee /></InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              label="Salary Range Max (LPA)"
              name="salaryRangeMax"
              type="number"
              value={formData.salaryRangeMax}
              onChange={handleChange}
              error={!!errors.salaryRangeMax}
              helperText={errors.salaryRangeMax}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><CurrencyRupee /></InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={6}
              label="Job Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description || `${formData.description.length} characters (min 100 for AI evaluation)`}
              required
              placeholder="Provide a detailed job description. This will be used by AI to evaluate candidates against this role. Include responsibilities, required skills, qualifications, and any specific domain knowledge needed."
            />
          </Grid>

          {/* Requirements */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Key Requirements (Optional)"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="List key requirements, must-have skills, or qualifications. This helps AI prioritize evaluation criteria."
            />
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                sx={{ minWidth: 160 }}
              >
                {loading ? 'Saving...' : existingJob ? 'Update Job Post' : 'Create Job Post'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
