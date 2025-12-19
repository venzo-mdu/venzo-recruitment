'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Checkbox,
  Toolbar,
  Menu,
  MenuItem,
  Divider as MuiDivider,
} from '@mui/material';
import {
  Visibility,
  Star,
  StarBorder,
  Download,
  CalendarToday,
  Delete,
  CheckCircle,
  Warning,
  Cancel,
  Compare,
  MoreVert,
  List,
  Clear,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../lib/utils/validation';
import ColumnFilterMenu from './ColumnFilterMenu';

export default function CandidateTable({
  candidates,
  loading,
  onViewDetails,
  onToggleShortlist,
  onDownloadResume,
  onDelete,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [selected, setSelected] = useState([]);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Column filters
  const [filters, setFilters] = useState({
    full_name: {},
    position: {},
    experience: {},
    expected_salary: {},
    created_at: {},
    relevance: {},
    status: {},
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleDeleteClick = (candidate) => {
    setCandidateToDelete(candidate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (candidateToDelete) {
      onDelete(candidateToDelete.id, candidateToDelete.full_name);
      setDeleteDialogOpen(false);
      setCandidateToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCandidateToDelete(null);
  };

  // Extract suitability from AI summary
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

  const handleFilterChange = (columnName, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [columnName]: filterValue
    }));
    setPage(0); // Reset to first page when filter changes
  };

  // Helper function to check if a specific filter is active
  const isFilterActive = (columnName) => {
    const filter = filters[columnName];
    if (!filter || Object.keys(filter).length === 0) return false;

    // For text/checkbox filters
    if (filter.selected) {
      if (columnName === 'full_name') return filter.selected.length > 0 && filter.selected.length < uniqueNames.length;
      if (columnName === 'position') return filter.selected.length > 0 && filter.selected.length < uniquePositions.length;
      if (columnName === 'relevance') return filter.selected.length > 0 && filter.selected.length < 4;
      if (columnName === 'status') return filter.selected.length > 0 && filter.selected.length < 3;
    }

    // For slider filters
    if (columnName === 'experience') {
      return (filter.min !== undefined && filter.min !== experienceRange.min) ||
             (filter.max !== undefined && filter.max !== experienceRange.max);
    }
    if (columnName === 'expected_salary') {
      return (filter.min !== undefined && filter.min !== salaryRange.min) ||
             (filter.max !== undefined && filter.max !== salaryRange.max);
    }

    // For date filters
    if (columnName === 'created_at') {
      return filter.from || filter.to;
    }

    return false;
  };

  // Bulk selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = paginatedCandidates.map(c => c.id);
      setSelected(allIds);
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (candidateId) => {
    setSelected(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleStatusMenuClick = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleBulkStatusUpdate = (status) => {
    selected.forEach(id => {
      onToggleShortlist(id, status);
    });
    setSelected([]);
    handleStatusMenuClose();
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    selected.forEach(id => {
      const candidate = candidates.find(c => c.id === id);
      if (candidate) {
        onDelete(id, candidate.full_name);
      }
    });
    setSelected([]);
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  const handleCompareClick = () => {
    setCompareDialogOpen(true);
  };

  const handleCompareClose = () => {
    setCompareDialogOpen(false);
  };

  // Get unique values for text filters
  const uniqueNames = useMemo(() => {
    const names = [...new Set(candidates.map(c => c.full_name))].sort();
    return names.map(name => ({ value: name, label: name }));
  }, [candidates]);

  const uniquePositions = useMemo(() => {
    const positions = [...new Set(candidates.map(c => c.position))].sort();
    return positions.map(pos => ({ value: pos, label: pos }));
  }, [candidates]);

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
      full_name: {},
      position: {},
      experience: {},
      expected_salary: {},
      created_at: {},
      relevance: {},
      status: {},
    });
    setPage(0);
  };

  const hasActiveFilters = useMemo(() => {
    // Name filter - active if not all items are selected
    if (filters.full_name.selected && filters.full_name.selected.length > 0 && filters.full_name.selected.length < uniqueNames.length) return true;

    // Position filter - active if not all items are selected
    if (filters.position.selected && filters.position.selected.length > 0 && filters.position.selected.length < uniquePositions.length) return true;

    // Experience filter - active if not at default range
    if (filters.experience.min !== undefined && filters.experience.min !== experienceRange.min) return true;
    if (filters.experience.max !== undefined && filters.experience.max !== experienceRange.max) return true;

    // Salary filter - active if not at default range
    if (filters.expected_salary.min !== undefined && filters.expected_salary.min !== salaryRange.min) return true;
    if (filters.expected_salary.max !== undefined && filters.expected_salary.max !== salaryRange.max) return true;

    // Date filter - active if any date is set
    if (filters.created_at.from || filters.created_at.to) return true;

    // Relevance filter - active if not all items are selected
    if (filters.relevance.selected && filters.relevance.selected.length > 0 && filters.relevance.selected.length < 4) return true;

    // Status filter - active if not all items are selected
    if (filters.status.selected && filters.status.selected.length > 0 && filters.status.selected.length < 3) return true;

    return false;
  }, [filters, uniqueNames.length, uniquePositions.length, experienceRange, salaryRange]);

  // Filter candidates based on all active filters
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Name filter (checkbox list) - only filter if not all items are selected
      if (filters.full_name.selected && filters.full_name.selected.length > 0 && filters.full_name.selected.length < uniqueNames.length) {
        if (!filters.full_name.selected.includes(candidate.full_name)) {
          return false;
        }
      }

      // Position filter (checkbox list) - only filter if not all items are selected
      if (filters.position.selected && filters.position.selected.length > 0 && filters.position.selected.length < uniquePositions.length) {
        if (!filters.position.selected.includes(candidate.position)) {
          return false;
        }
      }

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

      // Created At filter (date range)
      if (filters.created_at.from) {
        const candidateDate = new Date(candidate.created_at);
        const fromDate = new Date(filters.created_at.from);
        if (candidateDate < fromDate) {
          return false;
        }
      }
      if (filters.created_at.to) {
        const candidateDate = new Date(candidate.created_at);
        const toDate = new Date(filters.created_at.to);
        toDate.setHours(23, 59, 59, 999); // Include the entire "to" day
        if (candidateDate > toDate) {
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

      // Status filter (checkbox)
      if (filters.status.selected && filters.status.selected.length > 0 && filters.status.selected.length < 3) {
        if (!filters.status.selected.includes(candidate.status)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, filters, uniqueNames.length, uniquePositions.length, experienceRange, salaryRange]);

  const sortData = (array) => {
    return array.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Handle date sorting
      if (orderBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      }

      // Handle date sorting
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedCandidates = sortData([...filteredCandidates]);
  const paginatedCandidates = sortedCandidates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  const selectedCandidates = candidates.filter(c => selected.includes(c.id));

  return (
    <Paper elevation={2}>
      {/* Bulk Actions Toolbar */}
      {(selected.length || hasActiveFilters) > 0 && (
        <Toolbar
          sx={{
            pl: 2,
            pr: 1,
            bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'flex',
            gap: 2,
          }}
        >
          {selected.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Typography variant="subtitle1" component="div">
            {selected.length} selected
          </Typography>

          <Button
            variant="contained"
            color="inherit"
            size="small"
            startIcon={<List fontSize="small" />}
            onClick={handleStatusMenuClick}
            sx={{
              color: 'primary.light',
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'grey.100', color: 'primary.main', },
              fontSize: '0.8125rem',
              padding: '4px 10px',
              minHeight: '30px'
            }}
          >
            Update Status
          </Button>
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={handleStatusMenuClose}
          >
            <MenuItem onClick={() => handleBulkStatusUpdate('PENDING')}>
              {/* <CheckCircle fontSize="small" sx={{ mr: 1, color: 'default' }} /> */}
              Mark as Pending
            </MenuItem>
            <MenuItem onClick={() => handleBulkStatusUpdate('SHORTLISTED')}>
              {/* <Star fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> */}
              Shortlist
            </MenuItem>
            <MenuItem onClick={() => handleBulkStatusUpdate('REJECTED')}>
              {/* <Cancel fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> */}
              Reject
            </MenuItem>
          </Menu>

          <Button
            variant="contained"
            color="inherit"
            size="small"
            startIcon={<Compare fontSize="small" />}
            onClick={handleCompareClick}
            disabled={selected.length < 2 || selected.length > 5}
            sx={{
              color: 'primary.main',
              bgcolor: 'white',
              '&:hover': { bgcolor: 'grey.100' },
              fontSize: '0.8125rem',
              padding: '4px 10px',
              minHeight: '30px'
            }}
          >
            Compare AI ({selected.length})
          </Button>

          <Tooltip title="Delete Selected">
            <IconButton
              color="inherit"
              size="small"
              onClick={handleBulkDeleteClick}
              sx={{
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': { bgcolor: 'error.dark' },
                padding: '6px'
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
          </Box>
          )}
          {hasActiveFilters && (
          <Button
            variant=""
            size="small"
            startIcon={<Clear fontSize="small" />}
            onClick={handleClearAllFilters}
             sx={{
              fontSize: '0.8125rem',
              padding: '4px 10px',
              minHeight: '30px'
            }}
          >
          Clear All Filters
          </Button>
          )}
        </Toolbar>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell padding="checkbox" sx={{ color: 'white' }}>
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < paginatedCandidates.length}
                  checked={paginatedCandidates.length > 0 && selected.length === paginatedCandidates.length}
                  onChange={handleSelectAll}
                  sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }}
                />
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('full_name') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableSortLabel
                    active={orderBy === 'full_name'}
                    direction={orderBy === 'full_name' ? order : 'asc'}
                    onClick={() => handleSort('full_name')}
                    sx={{
                      color: 'white !important',
                      '&:hover': { color: 'white !important' },
                      '& .MuiTableSortLabel-icon': { color: 'white !important' }
                    }}
                  >
                    Name
                  </TableSortLabel>
                  <ColumnFilterMenu
                    columnName="Name"
                    filterType="text"
                    currentFilter={filters.full_name}
                    onFilterChange={(value) => handleFilterChange('full_name', value)}
                    options={uniqueNames}
                    iconColor="white"
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('position') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableSortLabel
                    active={orderBy === 'position'}
                    direction={orderBy === 'position' ? order : 'asc'}
                    onClick={() => handleSort('position')}
                    sx={{
                      color: 'white !important',
                      '&:hover': { color: 'white !important' },
                      '& .MuiTableSortLabel-icon': { color: 'white !important' }
                    }}
                  >
                    Position
                  </TableSortLabel>
                  <ColumnFilterMenu
                    columnName="Position"
                    filterType="text"
                    currentFilter={filters.position}
                    onFilterChange={(value) => handleFilterChange('position', value)}
                    options={uniquePositions}
                    iconColor="white"
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('experience') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableSortLabel
                    active={orderBy === 'experience'}
                    direction={orderBy === 'experience' ? order : 'asc'}
                    onClick={() => handleSort('experience')}
                    sx={{
                      color: 'white !important',
                      '&:hover': { color: 'white !important' },
                      '& .MuiTableSortLabel-icon': { color: 'white !important' }
                    }}
                  >
                    Experience
                  </TableSortLabel>
                  <ColumnFilterMenu
                    columnName="Experience"
                    filterType="slider"
                    currentFilter={filters.experience}
                    onFilterChange={(value) => handleFilterChange('experience', value)}
                    sliderMin={experienceRange.min}
                    sliderMax={experienceRange.max}
                    sliderStep={1}
                    iconColor="white"
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('expected_salary') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableSortLabel
                    active={orderBy === 'expected_salary'}
                    direction={orderBy === 'expected_salary' ? order : 'asc'}
                    onClick={() => handleSort('expected_salary')}
                    sx={{
                      color: 'white !important',
                      '&:hover': { color: 'white !important' },
                      '& .MuiTableSortLabel-icon': { color: 'white !important' }
                    }}
                  >
                    Expected Salary
                  </TableSortLabel>
                  <ColumnFilterMenu
                    columnName="Expected Salary"
                    filterType="slider"
                    currentFilter={filters.expected_salary}
                    onFilterChange={(value) => handleFilterChange('expected_salary', value)}
                    sliderMin={salaryRange.min}
                    sliderMax={salaryRange.max}
                    sliderStep={10000}
                    iconColor="white"
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('created_at') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TableSortLabel
                    active={orderBy === 'created_at'}
                    direction={orderBy === 'created_at' ? order : 'asc'}
                    onClick={() => handleSort('created_at')}
                    sx={{
                      color: 'white !important',
                      '&:hover': { color: 'white !important' },
                      '& .MuiTableSortLabel-icon': { color: 'white !important' }
                    }}
                  >
                    Applied On
                  </TableSortLabel>
                  <ColumnFilterMenu
                    columnName="Applied On"
                    filterType="date"
                    currentFilter={filters.created_at}
                    onFilterChange={(value) => handleFilterChange('created_at', value)}
                    iconColor="white"
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('relevance') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Relevance
                  <ColumnFilterMenu
                    columnName="Relevance"
                    filterType="checkbox"
                    currentFilter={filters.relevance}
                    onFilterChange={(value) => handleFilterChange('relevance', value)}
                    iconColor="white"
                    options={[
                      { value: 'Good Fit', label: 'Good Fit' },
                      { value: 'Maybe', label: 'Maybe' },
                      { value: 'Not Suitable', label: 'Not Suitable' },
                      { value: 'No AI Summary', label: 'No AI Summary' }
                    ]}
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: isFilterActive('status') ? 'bold' : 'normal' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Status
                  <ColumnFilterMenu
                    columnName="Status"
                    filterType="checkbox"
                    currentFilter={filters.status}
                    onFilterChange={(value) => handleFilterChange('status', value)}
                    iconColor="white"
                    options={[
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'SHORTLISTED', label: 'Shortlisted' },
                      { value: 'REJECTED', label: 'Rejected' }
                    ]}
                  />
                </Box>
              </TableCell>
              <TableCell sx={{ color: 'white' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCandidates.map((candidate) => (
              <TableRow
                key={candidate.id}
                hover
                selected={selected.includes(candidate.id)}
                sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(candidate.id)}
                    onChange={() => handleSelectOne(candidate.id)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="600">
                    {candidate.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {candidate.email}
                  </Typography>
                </TableCell>
                <TableCell>{candidate.position}</TableCell>
                <TableCell>{candidate.experience} years</TableCell>
                <TableCell>{formatCurrency(candidate.expected_salary)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formatDate(candidate.created_at)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {(() => {
                    const suitability = getSuitability(candidate);
                    if (suitability) {
                      return (
                        <Chip
                          icon={suitability.icon}
                          label={suitability.label}
                          color={suitability.color}
                          size="small"
                          sx={{ color: "white" }}
                        />
                      );
                    }
                    return (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={candidate.status === 'SHORTLISTED' ? 'Shortlisted' : candidate.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                    color={candidate.status === 'SHORTLISTED' ? 'success' : candidate.status === 'REJECTED' ? 'error' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onViewDetails(candidate)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={candidate.status === 'SHORTLISTED' ? 'Remove from Shortlist' : 'Add to Shortlist'}>
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => onToggleShortlist(candidate.id, candidate.status)}
                        disabled={candidate.status === 'REJECTED'}
                      >
                        {candidate.status === 'SHORTLISTED' ? <Star /> : <StarBorder />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Resume">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => onDownloadResume(candidate.resume_path, candidate.full_name)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Candidate">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(candidate)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredCandidates.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{candidateToDelete?.full_name}</strong>&apos;s application?
            This action cannot be undone and will permanently remove all their data including the resume.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={handleBulkDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Confirm Bulk Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length} candidate(s)</strong>?
            This action cannot be undone and will permanently remove all their data including resumes.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleBulkDeleteCancel}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete {selected.length} Candidate(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare AI Summaries Dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={handleCompareClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}>
          Compare AI Summaries ({selectedCandidates.length} candidates)
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {selectedCandidates.map((candidate) => (
              <Box
                key={candidate.id}
                sx={{
                  minWidth: 300,
                  maxWidth: 400,
                  flex: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {candidate.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {candidate.position} • {candidate.experience} years
                </Typography>
                <MuiDivider sx={{ my: 2 }} />
                {candidate.ai_summary ? (
                  <Box
                    sx={{
                      maxHeight: 400,
                      overflowY: 'auto',
                      backgroundColor: 'background.default',
                      p: 2,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.85rem',
                        '& strong': {
                          color: 'primary.main',
                          fontWeight: 'bold'
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: candidate.ai_summary
                          .replace(/^(.*?)(?=Score:)/s, (match) => match.replace(/\n/g, '<br/>'))
                          .replace(/\n(Strengths?:)/g, '<br/><strong>$1</strong>')
                          .replace(/\n(Gaps?:)/g, '<br/><strong>$1</strong>')
                          .replace(/\n(Fit for Venzo:)/g, '<br/><strong>$1</strong>')
                          .replace(/\n(➡️ Proceed\?)/g, '<br/><strong>$1</strong>')
                          .replace(/\n•/g, '<br/>•')
                          .replace(/Score: ([\d.]+) \/ 10/g, '<br/><strong style="color: #0030ce; font-size: 1.1em;">Score: $1 / 10</strong>')
                      }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    AI summary not yet generated
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCompareClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
