'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload,
  Person,
  Email,
  Phone,
  CurrencyRupee,
} from '@mui/icons-material';
import { validateCandidateForm, validateResume, formatIndianNumber, numberToWords } from '../../lib/utils/validation';
import { uploadResume } from '../../lib/services/storageService';
import { submitCandidate } from '../../lib/services/candidateService';

export default function CandidateForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentSalary: '',
    expectedSalary: '',
  });

  const [displayValues, setDisplayValues] = useState({
    currentSalary: '',
    expectedSalary: '',
  });

  const [resume, setResume] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSalaryWarning, setShowSalaryWarning] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle salary fields with formatting
    if (name === 'currentSalary' || name === 'expectedSalary') {
      // Remove all non-digit characters
      const numericValue = value.replace(/[^\d]/g, '');

      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));

      // Format for display
      if (numericValue) {
        setDisplayValues(prev => ({
          ...prev,
          [name]: formatIndianNumber(numericValue)
        }));

        // Check if salary is above 9 lakhs (900000)
        const salaryValue = parseFloat(numericValue);
        if (salaryValue > 900000) {
          setShowSalaryWarning(true);
        } else {
          setShowSalaryWarning(false);
        }
      } else {
        setDisplayValues(prev => ({
          ...prev,
          [name]: ''
        }));
        setShowSalaryWarning(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear general submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateResume(file);
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          resume: validation.errors.join(', ')
        }));
        setResume(null);
      } else {
        setErrors(prev => ({
          ...prev,
          resume: ''
        }));
        setResume(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({}); // Clear all previous errors

    // Validate form
    const validation = validateCandidateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setSubmitError('Please fix the errors in the form before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate resume
    if (!resume) {
      setErrors(prev => ({ ...prev, resume: 'Resume is required' }));
      setSubmitError('Please upload your resume to continue.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      // Upload resume
      const uploadResult = await uploadResume(resume, formData.email);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload resume. Please try again.');
      }

      // Submit candidate data
      const candidateData = {
        ...formData,
        resumePath: uploadResult.path,
        currentSalary: parseFloat(formData.currentSalary),
        expectedSalary: parseFloat(formData.expectedSalary),
      };

      const submitResult = await submitCandidate(candidateData);
      if (!submitResult.success) {
        // Check if it's a duplicate error and highlight the field
        if (submitResult.error.includes('email address has already been used')) {
          setErrors({ email: 'This email has already been used' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (submitResult.error.includes('phone number has already been used')) {
          setErrors({ phone: 'This phone number has already been used' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        throw new Error(submitResult.error || 'Failed to submit application. Please try again.');
      }

      // Send confirmation email (don't fail the submission if email fails)
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateEmail: formData.email,
            candidateName: formData.fullName,
          }),
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue anyway - application was submitted successfully
      }

      // Success callback
      onSuccess?.();
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'An unexpected error occurred. Please try again or contact support.');

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      {/* <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
        Apply to Venzo
      </Typography> */}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Full Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              helperText={errors.fullName}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Current Salary */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Salary"
              name="currentSalary"
              type="text"
              value={displayValues.currentSalary}
              onChange={handleChange}
              error={!!errors.currentSalary}
              helperText={errors.currentSalary || (formData.currentSalary ? numberToWords(parseFloat(formData.currentSalary)) : '')}
              required
              placeholder="Enter amount"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Expected Salary */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expected Salary"
              name="expectedSalary"
              type="text"
              value={displayValues.expectedSalary}
              onChange={handleChange}
              error={!!errors.expectedSalary}
              helperText={errors.expectedSalary || (formData.expectedSalary ? numberToWords(parseFloat(formData.expectedSalary)) : '')}
              required
              placeholder="Enter amount"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Salary Warning */}
          {showSalaryWarning && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 0 }}>
                <strong>Note:</strong> Your salary expectation is above ₹9,00,000 per annum. Please note that we are looking for candidates with ₹6,00,000 to ₹9,00,000 per annum. Applications with higher expectations may or may not be considered.
              </Alert>
            </Grid>
          )}

          {/* Resume Upload */}
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ py: 2 }}
              color={errors.resume ? 'error' : 'primary'}
            >
              {resume ? resume.name : 'Upload Resume (PDF only)'}
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={handleResumeChange}
              />
            </Button>
            {errors.resume && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.resume}
              </Typography>
            )}
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
