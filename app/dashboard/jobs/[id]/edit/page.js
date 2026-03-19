'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Alert } from '@mui/material';
import JobPostForm from '../../../../../components/hr/JobPostForm';

export default function EditJobPage() {
  const params = useParams();
  const [jobPost, setJobPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/job-posts/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setJobPost(data.data);
        } else {
          setError(data.error || 'Failed to load job post');
        }
      } catch (err) {
        setError('Failed to load job post');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [params.id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ py: 2 }}>
      <JobPostForm existingJob={jobPost} />
    </Box>
  );
}
