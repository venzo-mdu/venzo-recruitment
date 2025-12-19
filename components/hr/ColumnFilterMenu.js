'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
  IconButton,
  Slider,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

export default function ColumnFilterMenu({
  columnName,
  filterType = 'text', // 'text', 'number', 'date', 'slider'
  currentFilter,
  onFilterChange,
  options = [], // For checkbox filters
  iconColor = 'inherit', // Color for the filter icon
  sliderMin = 0, // For slider filters
  sliderMax = 100, // For slider filters
  sliderStep = 1, // For slider filters
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterValue, setFilterValue] = useState(currentFilter || {});
  const initialized = useRef(false);

  // Sync filterValue with currentFilter when it changes
  useEffect(() => {
    if (currentFilter) {
      setFilterValue(currentFilter);
    }
  }, [currentFilter]);

  // Initialize text/checkbox filters with all items selected (only once)
  useEffect(() => {
    if (initialized.current) return;

    if ((filterType === 'text' || filterType === 'checkbox') && options.length > 0) {
      if (!currentFilter || !currentFilter.selected || currentFilter.selected.length === 0) {
        const allValues = options.map(opt => opt.value);
        setFilterValue({ selected: allValues });
        initialized.current = true;
      }
    }
    if (filterType === 'slider') {
      if (!currentFilter || (!currentFilter.min && !currentFilter.max)) {
        setFilterValue({ min: sliderMin, max: sliderMax });
        initialized.current = true;
      }
    }
  }, [filterType, options.length, currentFilter, sliderMin, sliderMax]);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    onFilterChange(filterValue);
    handleClose();
  };

  const handleClear = () => {
    setFilterValue({});
    onFilterChange({});
    handleClose();
  };

  const hasActiveFilter = currentFilter && Object.keys(currentFilter).some(key => currentFilter[key]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const allValues = options.map(opt => opt.value);
      setFilterValue({ selected: allValues });
    } else {
      setFilterValue({ selected: [] });
    }
  };

  const isAllSelected = filterValue.selected?.length === options.length;
  const isSomeSelected = filterValue.selected?.length > 0 && filterValue.selected?.length < options.length;

  const renderFilterContent = () => {
    switch (filterType) {
      case 'text':
      case 'checkbox':
        return (
          <Box>
            {/* Select All Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  sx={{
                    padding: '4px',
                    '& .MuiSvgIcon-root': { fontSize: 18 }
                  }}
                />
              }
              label={<Typography variant="body2" fontWeight="bold">Select All</Typography>}
              sx={{ mb: 1, pl: 0.5 }}
            />
            <Divider sx={{ mb: 1 }} />
            {/* Options List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 250, overflow: 'auto' }}>
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={filterValue.selected?.includes(option.value) || false}
                      onChange={(e) => {
                        const selected = filterValue.selected || [];
                        if (e.target.checked) {
                          setFilterValue({ selected: [...selected, option.value] });
                        } else {
                          setFilterValue({ selected: selected.filter(v => v !== option.value) });
                        }
                      }}
                      sx={{
                        padding: '4px',
                        '& .MuiSvgIcon-root': { fontSize: 18 }
                      }}
                    />
                  }
                  label={<Typography variant="body2">{option.label}</Typography>}
                  sx={{ py: 0.25, ml: 0 }}
                />
              ))}
            </Box>
          </Box>
        );

      case 'slider':
        return (
          <Box sx={{ px: 1, py: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Range: {filterValue.min || sliderMin} - {filterValue.max || sliderMax}
            </Typography>
            <Slider
              value={[filterValue.min || sliderMin, filterValue.max || sliderMax]}
              onChange={(e, newValue) => {
                setFilterValue({ min: newValue[0], max: newValue[1] });
              }}
              valueLabelDisplay="auto"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 'date':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              value={filterValue.from || ''}
              onChange={(e) => setFilterValue({ ...filterValue, from: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              value={filterValue.to || ''}
              onChange={(e) => setFilterValue({ ...filterValue, to: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          ml: 0.5,
          color: iconColor,
          fontWeight: hasActiveFilter ? 'bolder' : 'normal',
          opacity: hasActiveFilter ? 1 : 0.5,
          '&:hover': { opacity: 1 },
        }}
      >
        <FilterList fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 250,
            p: 2,
          },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Filter {columnName}
          </Typography>
        </Box>

        {renderFilterContent()}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button
            onClick={handleClear}
            variant="outlined"
            color="inherit"
            sx={{
              fontSize: '0.8125rem',
              padding: '4px 12px',
              minHeight: '28px'
            }}
          >
            Clear
          </Button>
          <Button
            onClick={handleApply}
            variant="contained"
            sx={{
              fontSize: '0.8125rem',
              padding: '4px 12px',
              minHeight: '28px'
            }}
          >
            Apply
          </Button>
        </Box>
      </Menu>
    </>
  );
}
