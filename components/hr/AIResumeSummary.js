'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { AutoAwesome, Refresh } from '@mui/icons-material';

export default function AIResumeSummary({ candidate, onSummaryGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(candidate?.ai_summary || '');

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          resumePath: candidate.resume_path,
          candidateName: candidate.full_name,
          position: candidate.position,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data.summary);
      onSummaryGenerated?.(data.summary);
    } catch (err) {
      console.error('Generate summary error:', err);
      setError(err.message || 'Failed to generate AI summary');
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading && !error) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 3,
          textAlign: 'center',
          backgroundColor: 'background.default',
          border: '2px dashed',
          borderColor: 'divider',
        }}
      >
        <AutoAwesome sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          AI Resume Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Generate an AI-powered summary of this candidate&apos;s resume to quickly understand their qualifications.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={handleGenerateSummary}
          disabled={loading}
        >
          Generate AI Summary
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Analyzing resume with AI...
          </Typography>
          <Typography variant="caption" color="text.secondary">
            This may take 10-20 seconds
          </Typography>
        </Paper>
      ) : summary ? (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            backgroundColor: 'info.light',
            borderLeft: 4,
            borderColor: 'info.main',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoAwesome sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                AI Resume Analysis
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={handleGenerateSummary}
              disabled={loading}
            >
              Regenerate
            </Button>
          </Box>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
            }}
          >
            {summary}
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
}
