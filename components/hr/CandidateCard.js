'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Star,
  StarBorder,
  Download,
  Email,
  Phone,
  Work,
  AttachMoney,
  CalendarToday,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../lib/utils/validation';

export default function CandidateCard({
  candidate,
  onViewDetails,
  onToggleShortlist,
  onDownloadResume,
}) {
  return (
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
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
              {candidate.full_name}
            </Typography>
            <Chip
              label={candidate.position}
              color="primary"
              size="small"
              icon={<Work />}
            />
          </Box>
          <Chip
            label={candidate.is_shortlisted ? 'Shortlisted' : 'Pending'}
            color={candidate.is_shortlisted ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Contact Info */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Email sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {candidate.email}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Phone sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              {candidate.phone}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Experience
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {candidate.experience} years
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Expected Salary
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {formatCurrency(candidate.expected_salary)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Notice Period
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {candidate.notice_period} days
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Applied On
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {formatDate(candidate.created_at)}
            </Typography>
          </Box>
        </Box>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <Chip key={index} label={skill} size="small" variant="outlined" />
              ))}
              {candidate.skills.length > 3 && (
                <Chip label={`+${candidate.skills.length - 3} more`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onViewDetails(candidate)}
            >
              <Visibility />
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
        </Box>
        <Tooltip title={candidate.is_shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}>
          <IconButton
            size="small"
            color="warning"
            onClick={() => onToggleShortlist(candidate.id, !candidate.is_shortlisted)}
          >
            {candidate.is_shortlisted ? <Star /> : <StarBorder />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
