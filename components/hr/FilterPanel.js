'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Work,
  AttachMoney,
  Star,
  CalendarToday,
} from '@mui/icons-material';

export default function FilterPanel({ onFilterChange, onReset }) {
  const [filters, setFilters] = useState({
    search: '',
    position: '',
    minExperience: '',
    maxExperience: '',
    minSalary: '',
    maxSalary: '',
    isShortlisted: '',
    startDate: '',
    endDate: '',
  });

  const [activeFilters, setActiveFilters] = useState([]);

  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    const applied = [];
    const cleanFilters = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        cleanFilters[key] = value;

        // Create active filter chips
        let label = '';
        switch (key) {
          case 'search':
            label = `Search: ${value}`;
            break;
          case 'position':
            label = `Position: ${value}`;
            break;
          case 'minExperience':
            label = `Min Exp: ${value}y`;
            break;
          case 'maxExperience':
            label = `Max Exp: ${value}y`;
            break;
          case 'minSalary':
            label = `Min Salary: ₹${parseInt(value).toLocaleString()}`;
            break;
          case 'maxSalary':
            label = `Max Salary: ₹${parseInt(value).toLocaleString()}`;
            break;
          case 'isShortlisted':
            label = value === 'true' ? 'Shortlisted Only' : 'Not Shortlisted';
            break;
          case 'startDate':
            label = `From: ${new Date(value).toLocaleDateString()}`;
            break;
          case 'endDate':
            label = `To: ${new Date(value).toLocaleDateString()}`;
            break;
        }
        if (label) applied.push({ key, label });
      }
    });

    setActiveFilters(applied);
    onFilterChange(cleanFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      position: '',
      minExperience: '',
      maxExperience: '',
      minSalary: '',
      maxSalary: '',
      isShortlisted: '',
      startDate: '',
      endDate: '',
    };
    setFilters(resetFilters);
    setActiveFilters([]);
    onReset();
  };

  const handleRemoveFilter = (key) => {
    handleChange(key, '');
    // Reapply filters without the removed one
    setTimeout(handleApplyFilters, 0);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FilterList sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Filter Candidates
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Search */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Name, email, or position"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Position */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Position"
            value={filters.position}
            onChange={(e) => handleChange('position', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Work />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Experience Range */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Min Experience (years)"
            type="number"
            value={filters.minExperience}
            onChange={(e) => handleChange('minExperience', e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Max Experience (years)"
            type="number"
            value={filters.maxExperience}
            onChange={(e) => handleChange('maxExperience', e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Grid>

        {/* Salary Range */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Min Salary (INR)"
            type="number"
            value={filters.minSalary}
            onChange={(e) => handleChange('minSalary', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              ),
            }}
            inputProps={{ min: 0 }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Max Salary (INR)"
            type="number"
            value={filters.maxSalary}
            onChange={(e) => handleChange('maxSalary', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              ),
            }}
            inputProps={{ min: 0 }}
          />
        </Grid>

        {/* Shortlisted Status */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Shortlist Status</InputLabel>
            <Select
              value={filters.isShortlisted}
              label="Shortlist Status"
              onChange={(e) => handleChange('isShortlisted', e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <Star />
                </InputAdornment>
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Shortlisted</MenuItem>
              <MenuItem value="false">Not Shortlisted</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Date Range */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Application From"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Application To"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleReset}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              startIcon={<FilterList />}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </Box>
        </Grid>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                Active Filters:
              </Typography>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter.key}
                  label={filter.label}
                  onDelete={() => handleRemoveFilter(filter.key)}
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
