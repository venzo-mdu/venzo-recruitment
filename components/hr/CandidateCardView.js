'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Paper,
  Button,
  Drawer,
  Badge,
  Checkbox,
  FormControlLabel,
  Slider,
  TextField,
} from '@mui/material';
import {
  Visibility,
  Star,
  StarBorder,
  Download,
  Delete,
  Email,
  Phone,
  Work,
  CalendarToday,
  CheckCircle,
  Warning,
  Cancel,
  CurrencyRupee,
  Clear,
  FilterList,
  Close,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../lib/utils/validation';

export default function CandidateCardView({
  candidates,
  loading = false,
  onViewDetails,
  onToggleShortlist,
  onDownloadResume,
  onDelete,
}) {
  // Filter state
  const [filters, setFilters] = useState({
    experience: {},
    expected_salary: {},
    status: {},
    relevance: {},
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleFilterChange = (columnName, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [columnName]: filterValue
    }));
  };

  // Get min/max for sliders
  const experienceRange = useMemo(() => {
    if (candidates.length === 0) return { min: 0, max: 30 };
    const experiences = candidates.map(c => c.experience);
    return {
      min: Math.floor(Math.min(...experiences)),
      max: Math.ceil(Math.max(...experiences))
    };
  }, [candidates]);

  const salaryRange = useMemo(() => {
    if (candidates.length === 0) return { min: 0, max: 2000000 };
    const salaries = candidates.map(c => c.expected_salary);
    return {
      min: Math.floor(Math.min(...salaries) / 10000) * 10000,
      max: Math.ceil(Math.max(...salaries) / 10000) * 10000
    };
  }, [candidates]);

  const handleClearAllFilters = () => {
    setFilters({
      experience: {},
      expected_salary: {},
      status: {},
      relevance: {},
    });
  };

  // Extract suitability from AI summary - MUST BE DEFINED BEFORE USE
  const getSuitability = (candidate) => {
    if (!candidate.ai_summary) return null;

    const proceedMatch = candidate.ai_summary.match(/Proceed:\s*(Yes|Maybe|No)/i);
    if (proceedMatch) {
      const decision = proceedMatch[1].toLowerCase();
      if (decision === 'yes') {
        return { label: 'Good Fit', color: 'success', icon: <CheckCircle fontSize="small" /> };
      } else if (decision === 'maybe') {
        return { label: 'Maybe', color: 'warning', icon: <Warning fontSize="small" /> };
      } else {
        return { label: 'Not Suitable', color: 'error', icon: <Cancel fontSize="small" /> };
      }
    }
    return null;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Experience filter
    if ((filters.experience.min !== undefined && filters.experience.min !== experienceRange.min) ||
        (filters.experience.max !== undefined && filters.experience.max !== experienceRange.max)) {
      count++;
    }

    // Salary filter
    if ((filters.expected_salary.min !== undefined && filters.expected_salary.min !== salaryRange.min) ||
        (filters.expected_salary.max !== undefined && filters.expected_salary.max !== salaryRange.max)) {
      count++;
    }

    // Status filter
    if (filters.status.selected && filters.status.selected.length > 0 && filters.status.selected.length < 3) {
      count++;
    }

    // Relevance filter
    if (filters.relevance.selected && filters.relevance.selected.length > 0 && filters.relevance.selected.length < 4) {
      count++;
    }

    return count;
  }, [filters, experienceRange, salaryRange]);

  const hasActiveFilters = activeFilterCount > 0;

  // Filter candidates based on all active filters
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Experience filter (slider range) - only filter if not at default range
      if (filters.experience.min !== undefined && filters.experience.min !== experienceRange.min) {
        if (candidate.experience < filters.experience.min) {
          return false;
        }
      }
      if (filters.experience.max !== undefined && filters.experience.max !== experienceRange.max) {
        if (candidate.experience > filters.experience.max) {
          return false;
        }
      }

      // Expected Salary filter (slider range) - only filter if not at default range
      if (filters.expected_salary.min !== undefined && filters.expected_salary.min !== salaryRange.min) {
        if (candidate.expected_salary < filters.expected_salary.min) {
          return false;
        }
      }
      if (filters.expected_salary.max !== undefined && filters.expected_salary.max !== salaryRange.max) {
        if (candidate.expected_salary > filters.expected_salary.max) {
          return false;
        }
      }

      // Status filter (checkbox)
      if (filters.status.selected && filters.status.selected.length > 0 && filters.status.selected.length < 3) {
        if (!filters.status.selected.includes(candidate.status)) {
          return false;
        }
      }

      // Relevance filter (checkbox)
      if (filters.relevance.selected && filters.relevance.selected.length > 0 && filters.relevance.selected.length < 4) {
        const suitability = getSuitability(candidate);
        const relevanceValue = suitability ? suitability.label : 'No AI Summary';
        if (!filters.relevance.selected.includes(relevanceValue)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, filters, experienceRange, salaryRange]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (candidates.length === 0) {
    return (
      <Paper sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No candidates found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your filters
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      {/* Filter Button and Active Filters */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        {/* Spacer to push everything to the right */}
        <Box sx={{ flex: 1 }} />

        {/* Active Filter Chips */}
        {filters.status.selected && filters.status.selected.length > 0 && filters.status.selected.length < 3 && (
          <Chip
            label={`Status: ${filters.status.selected.map(s => s === 'SHORTLISTED' ? 'Shortlisted' : s === 'REJECTED' ? 'Rejected' : 'Pending').join(', ')}`}
            size="small"
            onDelete={() => handleFilterChange('status', {})}
            sx={{ fontSize: '0.75rem', height: '24px' }}
          />
        )}
        {((filters.experience.min !== undefined && filters.experience.min !== experienceRange.min) ||
          (filters.experience.max !== undefined && filters.experience.max !== experienceRange.max)) && (
          <Chip
            label={`Experience: ${filters.experience.min || experienceRange.min}-${filters.experience.max || experienceRange.max} yrs`}
            size="small"
            onDelete={() => handleFilterChange('experience', {})}
            sx={{ fontSize: '0.75rem', height: '24px' }}
          />
        )}
        {((filters.expected_salary.min !== undefined && filters.expected_salary.min !== salaryRange.min) ||
          (filters.expected_salary.max !== undefined && filters.expected_salary.max !== salaryRange.max)) && (
          <Chip
            label={`Salary: ${formatCurrency(filters.expected_salary.min || salaryRange.min)}-${formatCurrency(filters.expected_salary.max || salaryRange.max)}`}
            size="small"
            onDelete={() => handleFilterChange('expected_salary', {})}
            sx={{ fontSize: '0.75rem', height: '24px' }}
          />
        )}
        {filters.relevance.selected && filters.relevance.selected.length > 0 && filters.relevance.selected.length < 4 && (
          <Chip
            label={`Relevance: ${filters.relevance.selected.join(', ')}`}
            size="small"
            onDelete={() => handleFilterChange('relevance', {})}
            sx={{ fontSize: '0.75rem', height: '24px' }}
          />
        )}

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="text"
            size="small"
            startIcon={<Clear fontSize="small" />}
            onClick={handleClearAllFilters}
            sx={{
              fontSize: '0.75rem',
              textTransform: 'none',
            }}
          >
            Clear All
          </Button>
        )}

        {/* Filter Button */}
        <Button
          variant="outlined"
          size="small"
          endIcon={
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterList fontSize="small" />
            </Badge>
          }
          onClick={() => setDrawerOpen(true)}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Filters
        </Button>
      </Box>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '85%', sm: 400 },
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Filters
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Filter Sections - Scrollable */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'auto', pr: 1 }}>
          {/* Status Filter */}
          <Box>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.secondary', mb: 1.5 }}>
              Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                { value: 'PENDING', label: 'Pending' },
                { value: 'SHORTLISTED', label: 'Shortlisted' },
                { value: 'REJECTED', label: 'Rejected' }
              ].map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={filters.status.selected?.includes(option.value) || false}
                      onChange={(e) => {
                        const selected = filters.status.selected || [];
                        if (e.target.checked) {
                          handleFilterChange('status', { selected: [...selected, option.value] });
                        } else {
                          handleFilterChange('status', { selected: selected.filter(v => v !== option.value) });
                        }
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{option.label}</Typography>}
                  sx={{ ml: 0 }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Experience Filter */}
          <Box>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.secondary', mb: 1 }}>
              Years of Experience
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
              <TextField
                label="Min"
                type="number"
                size="small"
                value={filters.experience.min !== undefined ? filters.experience.min : experienceRange.min}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || experienceRange.min;
                  handleFilterChange('experience', {
                    ...filters.experience,
                    min: value
                  });
                }}
                inputProps={{ min: experienceRange.min, max: experienceRange.max }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" color="text.secondary">-</Typography>
              <TextField
                label="Max"
                type="number"
                size="small"
                value={filters.experience.max !== undefined ? filters.experience.max : experienceRange.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || experienceRange.max;
                  handleFilterChange('experience', {
                    ...filters.experience,
                    max: value
                  });
                }}
                inputProps={{ min: experienceRange.min, max: experienceRange.max }}
                sx={{ flex: 1 }}
              />
            </Box>
            <Slider
            sx={{ width: '90%', ml: '6%'}}
              value={[
                filters.experience.min !== undefined ? filters.experience.min : experienceRange.min,
                filters.experience.max !== undefined ? filters.experience.max : experienceRange.max
              ]}
              onChange={(_e, newValue) => {
                handleFilterChange('experience', { min: newValue[0], max: newValue[1] });
              }}
              valueLabelDisplay="auto"
              min={experienceRange.min}
              max={experienceRange.max}
              step={1}
            />
          </Box>

          <Divider />

          {/* Salary Filter */}
          <Box>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.secondary', mb: 1 }}>
              Expected Salary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
              <TextField
                label="Min"
                type="number"
                size="small"
                value={filters.expected_salary.min !== undefined ? filters.expected_salary.min : salaryRange.min}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || salaryRange.min;
                  handleFilterChange('expected_salary', {
                    ...filters.expected_salary,
                    min: value
                  });
                }}
                inputProps={{ min: salaryRange.min, max: salaryRange.max, step: 10000 }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" color="text.secondary">-</Typography>
              <TextField
                label="Max"
                type="number"
                size="small"
                value={filters.expected_salary.max !== undefined ? filters.expected_salary.max : salaryRange.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || salaryRange.max;
                  handleFilterChange('expected_salary', {
                    ...filters.expected_salary,
                    max: value
                  });
                }}
                inputProps={{ min: salaryRange.min, max: salaryRange.max, step: 10000 }}
                sx={{ flex: 1 }}
              />
            </Box>
            <Slider
            sx={{ width: '90%', ml: '6%'}}
              value={[
                filters.expected_salary.min !== undefined ? filters.expected_salary.min : salaryRange.min,
                filters.expected_salary.max !== undefined ? filters.expected_salary.max : salaryRange.max
              ]}
              onChange={(_e, newValue) => {
                handleFilterChange('expected_salary', { min: newValue[0], max: newValue[1] });
              }}
              valueLabelDisplay="auto"
              min={salaryRange.min}
              max={salaryRange.max}
              step={10000}
            />
          </Box>

          <Divider />

          {/* Relevance Filter */}
          <Box>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ color: 'text.secondary', mb: 1.5 }}>
              AI Relevance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                { value: 'Good Fit', label: 'Good Fit' },
                { value: 'Maybe', label: 'Maybe' },
                { value: 'Not Suitable', label: 'Not Suitable' },
                { value: 'No AI Summary', label: 'No AI Summary' }
              ].map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={filters.relevance.selected?.includes(option.value) || false}
                      onChange={(e) => {
                        const selected = filters.relevance.selected || [];
                        if (e.target.checked) {
                          handleFilterChange('relevance', { selected: [...selected, option.value] });
                        } else {
                          handleFilterChange('relevance', { selected: selected.filter(v => v !== option.value) });
                        }
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{option.label}</Typography>}
                  sx={{ ml: 0 }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Drawer Footer - Pinned to Bottom */}
        <Box sx={{ pt: 3, display: 'flex', gap: 2, borderTop: 1, borderColor: 'divider', mt: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleClearAllFilters}
            startIcon={<Clear />}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Apply
          </Button>
        </Box>
      </Drawer>

      {/* Results Count */}
      {filteredCandidates.length !== candidates.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredCandidates.length} of {candidates.length} candidates
        </Typography>
      )}

      {/* No Results Message */}
      {filteredCandidates.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No candidates match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting or clearing your filters
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearAllFilters}
            sx={{ mt: 2 }}
          >
            Clear All Filters
          </Button>
        </Paper>
      )}

      {/* Cards Grid */}
      {filteredCandidates.length > 0 && (
        <Grid container spacing={2}>
          {filteredCandidates.map((candidate) => {
        const suitability = getSuitability(candidate);

        return (
          <Grid item xs={12} sm={6} md={6} lg={3} key={candidate.id}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 0.5, pt: 1.5, px: 1.5 }}>
                {/* Header with Avatar and Actions */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40,
                      mr: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {getInitials(candidate.full_name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.9375rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}
                    >
                      {candidate.full_name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                      }}
                    >
                      {candidate.position}
                    </Typography>
                  </Box>
                </Box>

                {/* Status and Relevance Chips */}
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={candidate.status === 'SHORTLISTED' ? 'Shortlisted' : candidate.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                    color={candidate.status === 'SHORTLISTED' ? 'success' : candidate.status === 'REJECTED' ? 'error' : 'default'}
                    size="small"
                  />
                  {suitability && (
                    <Chip
                      icon={suitability.icon}
                      label={suitability.label}
                      color={suitability.color}
                      size="small"
                      sx={{ color: "white" }}
                    />
                  )}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Contact Info */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                    <Email sx={{ color: 'text.secondary', fontSize: 14 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem',
                      }}
                    >
                      {candidate.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone sx={{ color: 'text.secondary', fontSize: 14 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {candidate.phone}
                    </Typography>
                  </Box>
                </Box>

                {/* Details Grid */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 0.75,
                  mb: 1
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Experience
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8125rem' }}>
                      {candidate.experience} yrs
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Salary
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8125rem' }}>
                      {formatCurrency(candidate.expected_salary)}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Applied On
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.8125rem' }}>
                      {formatDate(candidate.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  borderTop: 1,
                  borderColor: 'divider',
                  py: 0.5,
                  px: 0.5,
                }}
              >
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onViewDetails(candidate)}
                    sx={{ padding: '6px' }}
                  >
                    <Visibility sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={candidate.status === 'SHORTLISTED' ? 'Remove from Shortlist' : 'Add to Shortlist'}>
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => onToggleShortlist(candidate.id, candidate.status)}
                    disabled={candidate.status === 'REJECTED'}
                    sx={{ padding: '6px' }}
                  >
                    {candidate.status === 'SHORTLISTED' ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Resume">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => onDownloadResume(candidate.resume_path, candidate.full_name)}
                    sx={{ padding: '6px' }}
                  >
                    <Download sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Candidate">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(candidate.id, candidate.full_name)}
                    sx={{ padding: '6px' }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
      )}
    </>
  );
}
