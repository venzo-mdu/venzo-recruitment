export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

export const validateResume = (file) => {
  const errors = [];

  if (!file) {
    errors.push('Resume file is required');
    return { isValid: false, errors };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('Resume file must be less than 5MB');
  }

  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF files are allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCandidateForm = (formData) => {
  const errors = {};

  // Required fields
  if (!formData.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!formData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(formData.phone)) {
    errors.phone = 'Invalid phone number format';
  }

  if (!formData.currentSalary) {
    errors.currentSalary = 'Current salary is required';
  } else if (formData.currentSalary < 0) {
    errors.currentSalary = 'Current salary must be positive';
  }

  if (!formData.expectedSalary) {
    errors.expectedSalary = 'Expected salary is required';
  } else if (formData.expectedSalary < 0) {
    errors.expectedSalary = 'Expected salary must be positive';
  }

  if (!formData.noticePeriod && formData.noticePeriod !== 0) {
    errors.noticePeriod = 'Notice period is required';
  } else if (formData.noticePeriod < 0) {
    errors.noticePeriod = 'Notice period must be 0 or positive';
  } else if (formData.noticePeriod > 365) {
    errors.noticePeriod = 'Notice period cannot exceed 365 days';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatIndianNumber = (num) => {
  if (!num) return '';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const numberToWords = (num) => {
  if (!num || num <= 0) return '';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  let words = [];

  if (crore > 0) {
    words.push(`${crore} Crore${crore > 1 ? 's' : ''}`);
  }
  if (lakh > 0) {
    words.push(`${lakh} Lakh${lakh > 1 ? 's' : ''}`);
  }
  if (thousand > 0) {
    words.push(`${thousand} Thousand`);
  }
  if (remainder > 0 && words.length > 0) {
    words.push(`${remainder}`);
  }

  return words.join(' ') || num.toString();
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};
