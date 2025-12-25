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
  TextField,
  CircularProgress,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Close,
  Email,
  Phone,
  Work,
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
  Send,
  Comment,
  Edit,
  SwapHoriz,
  ArrowForward,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../lib/utils/validation';
import { useState, useEffect } from 'react';
import { getStatusOptions, getStatusDisplay } from '../../lib/constants/statuses';

export default function CandidateDetail({ candidate, open, onClose, onStatusChange, onRefresh }) {
  const [regenerating, setRegenerating] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Status change modal state
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [statusChangeComment, setStatusChangeComment] = useState('');
  const [submittingStatusChange, setSubmittingStatusChange] = useState(false);

  // Fetch comments when dialog opens
  useEffect(() => {
    if (open && candidate?.id) {
      fetchComments();
    }
  }, [open, candidate?.id]);

  const fetchComments = async () => {
    if (!candidate?.id) return;
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/comments?candidateId=${candidate.id}`);
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !candidate?.id) return;
    setSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          comment: newComment.trim(),
          authorName: 'HR',
        }),
      });
      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editingCommentText.trim() }),
      });
      if (response.ok) {
        setEditingCommentId(null);
        setEditingCommentText('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  // Status change handlers
  const openStatusChangeModal = (newStatus = '') => {
    setSelectedNewStatus(newStatus);
    setStatusChangeComment('');
    setStatusChangeModalOpen(true);
  };

  const closeStatusChangeModal = () => {
    setStatusChangeModalOpen(false);
    setSelectedNewStatus('');
    setStatusChangeComment('');
  };

  const handleStatusChangeSubmit = async () => {
    if (!selectedNewStatus || !statusChangeComment.trim()) return;

    setSubmittingStatusChange(true);
    try {
      // First, add the comment with status change info
      const commentResponse = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          comment: statusChangeComment.trim(),
          authorName: 'HR',
          statusFrom: candidate.status,
          statusTo: selectedNewStatus,
          isStatusChange: true,
        }),
      });

      if (!commentResponse.ok) {
        throw new Error('Failed to add comment');
      }

      // Then update the candidate status
      if (onStatusChange) {
        await onStatusChange(candidate.id, selectedNewStatus);
      }

      // Refresh comments
      fetchComments();

      // Close modal
      closeStatusChangeModal();

      // Refresh parent data if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSubmittingStatusChange(false);
    }
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h5" component="span" fontWeight="bold">
                {candidate.full_name}
              </Typography>
              {(() => {
                const statusConfig = getStatusDisplay(candidate.status);
                return (
                  <Chip
                    label={statusConfig.label}
                    size="small"
                    sx={{
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                      fontWeight: 600,
                      border: `1px solid ${statusConfig.color}40`,
                    }}
                  />
                );
              })()}
              <Button
                size="small"
                variant="outlined"
                startIcon={<SwapHoriz sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                onClick={() => openStatusChangeModal()}
                sx={{
                  ml: 1,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  py: { xs: 0.25, sm: 0.5 },
                  px: { xs: 1, sm: 1.5 },
                  minHeight: { xs: 24, sm: 28 },
                }}
              >
                Change Status
              </Button>
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

          {/* Comments/Feedback Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Comment sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Comments & Feedback
              </Typography>
              <Chip label={comments.length} size="small" color="primary" variant="outlined" />
            </Box>

            {/* Add Comment Form */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a comment or feedback..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                multiline
                maxRows={3}
                disabled={submittingComment}
              />
              <Button
                variant="contained"
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                {submittingComment ? <CircularProgress size={20} /> : <Send />}
              </Button>
            </Box>

            {/* Comments List */}
            {loadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, backgroundColor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Be the first to add feedback!
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflow: 'auto' }}>
                {comments.map((comment) => (
                  <Box
                    key={comment.id}
                    sx={{
                      backgroundColor: 'background.default',
                      p: 2,
                      borderRadius: 2,
                      borderLeft: 3,
                      borderColor: 'primary.light',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                        {comment.author_name?.charAt(0) || 'H'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight="600">
                            {comment.author_name || 'HR'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCommentDate(comment.created_at)}
                          </Typography>
                          {comment.updated_at !== comment.created_at && (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                              (edited)
                            </Typography>
                          )}
                        </Box>

                        {/* Status Change Badge */}
                        {comment.is_status_change && comment.status_from && comment.status_to && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                              p: 1,
                              backgroundColor: 'primary.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'primary.200',
                            }}
                          >
                            <SwapHoriz fontSize="small" sx={{ color: 'primary.main' }} />
                            <Typography variant="caption" color="text.secondary">
                              Status changed:
                            </Typography>
                            <Chip
                              label={getStatusDisplay(comment.status_from).label}
                              size="small"
                              sx={{
                                backgroundColor: getStatusDisplay(comment.status_from).bgColor,
                                color: getStatusDisplay(comment.status_from).color,
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                            <ArrowForward fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Chip
                              label={getStatusDisplay(comment.status_to).label}
                              size="small"
                              sx={{
                                backgroundColor: getStatusDisplay(comment.status_to).bgColor,
                                color: getStatusDisplay(comment.status_to).color,
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        )}

                        {editingCommentId === comment.id ? (
                          <Box sx={{ mt: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              multiline
                              maxRows={4}
                              autoFocus
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button size="small" variant="contained" onClick={() => handleUpdateComment(comment.id)}>
                                Save
                              </Button>
                              <Button size="small" variant="outlined" onClick={cancelEditing}>
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {comment.comment}
                          </Typography>
                        )}
                      </Box>

                      {/* Edit/Delete buttons */}
                      {editingCommentId !== comment.id && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => startEditingComment(comment)} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteComment(comment.id)} sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
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
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Status Change Modal */}
      <Dialog
        open={statusChangeModalOpen}
        onClose={closeStatusChangeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="primary" />
            <Typography variant="h6">Change Candidate Status</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Current Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Chip
                label={getStatusDisplay(candidate.status).label}
                sx={{
                  backgroundColor: getStatusDisplay(candidate.status).bgColor,
                  color: getStatusDisplay(candidate.status).color,
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* New Status Select */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>New Status *</InputLabel>
              <Select
                value={selectedNewStatus}
                onChange={(e) => setSelectedNewStatus(e.target.value)}
                label="New Status *"
              >
                {getStatusOptions()
                  .filter((status) => status.value !== candidate.status)
                  .map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: status.color,
                          }}
                        />
                        <Box>
                          <Typography variant="body1">{status.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {status.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Mandatory Comment */}
            <TextField
              fullWidth
              label="Comment / Feedback *"
              placeholder="Please provide a reason for this status change..."
              value={statusChangeComment}
              onChange={(e) => setStatusChangeComment(e.target.value)}
              multiline
              rows={3}
              required
              helperText="A comment is required when changing status"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeStatusChangeModal} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleStatusChangeSubmit}
            variant="contained"
            disabled={!selectedNewStatus || !statusChangeComment.trim() || submittingStatusChange}
            startIcon={submittingStatusChange ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            {submittingStatusChange ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
