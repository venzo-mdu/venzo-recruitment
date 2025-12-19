'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Link,
} from '@mui/material';
import {
  Close,
  Email,
  Phone,
  Work,
  AttachMoney,
  CalendarToday,
  LinkedIn,
  Language,
  Star,
  Description,
  StarBorder,
  Delete,
  Refresh,
  CheckCircle,
  Warning,
  Cancel,
  CurrencyRupee,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../lib/utils/validation';
import { useState } from 'react';

export default function CandidateDetail({ candidate, open, onClose, onToggleShortlist, onReject }) {
  const [regenerating, setRegenerating] = useState(false);

  console.log('CandidateDetail candidate:', candidate);
  if (!candidate) return null;

  // Extract suitability from AI summary
  const getSuitability = () => {
    if (!candidate.ai_summary) return null;

    const proceedMatch = candidate.ai_summary.match(/Proceed:\s*(Yes|Maybe|No)/i);
    if (proceedMatch) {
      const decision = proceedMatch[1].toLowerCase();
      if (decision === 'yes') {
        return { label: 'Good Fit', color: 'success.main', icon: <CheckCircle fontSize="small" /> };
      } else if (decision === 'maybe') {
        return { label: 'Maybe', color: 'warning.main', icon: <Warning fontSize="small" /> };
      } else {
        return { label: 'Not Suitable', color: 'error.main', icon: <Cancel fontSize="small" /> };
      }
    }
    return null;
  };

  const suitability = getSuitability();

  const handleShortlist = () => {
    if (onToggleShortlist) {
      onToggleShortlist(candidate.id, candidate.status);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(candidate.id);
    }
  };

  const handleRegenerateAnalysis = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          resumePath: candidate.resume_path,
          candidateName: candidate.full_name,
        }),
      });

      if (response.ok) {
        // Reload the page or refetch candidates
        window.location.reload();
      }
    } catch (error) {
      console.error('Error regenerating analysis:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const InfoRow = ({ icon, label, value, link = null }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ mr: 2, color: 'primary.main', mt: 0.5 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        {link ? (
          <Link href={link} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: 'break-all' }}>
            {value}
          </Link>
        ) : (
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const CompactInfoItem = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight="500">
        {value}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" component="span" fontWeight="bold">
                {candidate.full_name}
              </Typography>
              {candidate.status === 'SHORTLISTED' && (
                <Chip
                  icon={<Star />}
                  label="Shortlisted"
                  color="success"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
              {candidate.status === 'REJECTED' && (
                <Chip
                  label="Rejected"
                  color="error"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.email}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">•</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.phone}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={3}>
          {/* AI Review Summary - TOP PRIORITY */}
          {candidate.ai_summary && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                AI Review Summary
              </Typography>
              <Box
                sx={{
                  backgroundColor: 'background.default',
                  p: 3,
                  borderRadius: 2,
                  borderLeft: 4,
                  borderColor: 'primary.main',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
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
                      .replace(/\n(Proceed:)/g, '<br/><strong>$1</strong>')
                      .replace(/\n•/g, '<br/>•')
                      .replace(/Score: ([\d.]+) \/ 10/g, '<br/><strong style="color: #0030ce; font-size: 1.1em;">Score: $1 / 10</strong>')
                  }}
                />
              </Box>
            </Grid>
          )}

          {/* Skills - Below AI Summary */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {candidate.skills.map((skill, index) => (
                  <Chip key={index} label={skill} color="primary" variant="outlined" size="small" />
                ))}
              </Box>
            </Grid>
          )}

          {/* Compact Job Details Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
              Job Details
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              backgroundColor: 'background.default',
              p: 2,
              borderRadius: 2
            }}>
              <CompactInfoItem icon={<Work fontSize="small" />} label="Position" value={candidate.position} />
              <CompactInfoItem icon={<Description fontSize="small" />} label="Experience" value={`${candidate.experience} years`} />
              <CompactInfoItem icon={<CurrencyRupee fontSize="small" />} label="Expected Salary" value={formatCurrency(candidate.expected_salary)} />
              <CompactInfoItem icon={<CalendarToday fontSize="small" />} label="Notice Period" value={`${candidate.notice_period} days`} />
              {suitability ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ color: suitability.color, display: 'flex', alignItems: 'center' }}>
                    {suitability.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Relevance:
                  </Typography>
                  <Typography variant="body2" fontWeight="500" sx={{ color: suitability.color }}>
                    {suitability.label}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                    <Warning fontSize="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Suitability:
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    -
                  </Typography>
                </Box>
              )}
              <CompactInfoItem icon={<CalendarToday fontSize="small" />} label="Applied On" value={formatDate(candidate.created_at)} />
            </Box>
          </Grid>

          {/* Links */}
          {(candidate.linkedin_url || candidate.portfolio_url) && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Links
              </Typography>
              {candidate.linkedin_url && (
                <InfoRow
                  icon={<LinkedIn />}
                  label="LinkedIn"
                  value={candidate.linkedin_url}
                  link={candidate.linkedin_url}
                />
              )}
              {candidate.portfolio_url && (
                <InfoRow
                  icon={<Language />}
                  label="Portfolio"
                  value={candidate.portfolio_url}
                  link={candidate.portfolio_url}
                />
              )}
            </Grid>
          )}

          {/* Cover Letter */}
          {candidate.cover_letter && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Cover Letter
              </Typography>
              <Box sx={{ backgroundColor: 'background.default', p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {candidate.cover_letter}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
          onClick={handleRegenerateAnalysis}
          variant="outlined"
          color="primary"
          startIcon={<Refresh />}
          disabled={regenerating}
        >
          {regenerating ? 'Regenerating...' : 'Regenerate Analysis'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleReject}
          variant="outlined"
          color="error"
          startIcon={<Delete />}
        >
          Reject
        </Button>
        <Button
          onClick={handleShortlist}
          variant={candidate.status === 'SHORTLISTED' ? "contained" : "outlined" }
          color={candidate.status === 'SHORTLISTED' ? "warning" : "success"}
          startIcon={candidate.status === 'SHORTLISTED' ? <Star /> : <StarBorder />  }
          disabled={candidate.status === 'REJECTED'}
        >
          {candidate.status === 'SHORTLISTED' ? 'Remove Shortlist' : 'Shortlist'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
