// Candidate recruitment pipeline statuses

export const CANDIDATE_STATUSES = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEWED: 'INTERVIEWED',
  OFFER_EXTENDED: 'OFFER_EXTENDED',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  ON_HOLD: 'ON_HOLD',
  WITHDRAWN: 'WITHDRAWN',
};

export const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: '#757575',
    bgColor: '#75757520',
    description: 'New application, not yet reviewed',
    order: 1,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: '#2196f3',
    bgColor: '#2196f320',
    description: 'Application is being reviewed',
    order: 2,
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: '#4caf50',
    bgColor: '#4caf5020',
    description: 'Candidate selected for interview',
    order: 3,
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    color: '#ff9800',
    bgColor: '#ff980020',
    description: 'Interview has been scheduled',
    order: 4,
  },
  INTERVIEWED: {
    label: 'Interviewed',
    color: '#9c27b0',
    bgColor: '#9c27b020',
    description: 'Interview completed, awaiting decision',
    order: 5,
  },
  OFFER_EXTENDED: {
    label: 'Offer Extended',
    color: '#00bcd4',
    bgColor: '#00bcd420',
    description: 'Job offer has been sent',
    order: 6,
  },
  HIRED: {
    label: 'Hired',
    color: '#4caf50',
    bgColor: '#4caf5030',
    description: 'Candidate has accepted and joined',
    order: 7,
  },
  REJECTED: {
    label: 'Rejected',
    color: '#f44336',
    bgColor: '#f4433620',
    description: 'Candidate not selected',
    order: 8,
  },
  ON_HOLD: {
    label: 'On Hold',
    color: '#795548',
    bgColor: '#79554820',
    description: 'Decision pending, candidate on hold',
    order: 9,
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: '#9e9e9e',
    bgColor: '#9e9e9e20',
    description: 'Candidate withdrew application',
    order: 10,
  },
};

// Get all status options for dropdowns
export const getStatusOptions = () => {
  return Object.entries(STATUS_CONFIG)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([value, config]) => ({
      value,
      label: config.label,
      color: config.color,
      bgColor: config.bgColor,
      description: config.description,
    }));
};

// Get status display info
export const getStatusDisplay = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
};

// Valid status transitions (optional - for validation)
export const VALID_TRANSITIONS = {
  PENDING: ['UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'ON_HOLD'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED', 'ON_HOLD', 'PENDING'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED', 'ON_HOLD', 'UNDER_REVIEW'],
  INTERVIEW_SCHEDULED: ['INTERVIEWED', 'REJECTED', 'ON_HOLD', 'WITHDRAWN'],
  INTERVIEWED: ['OFFER_EXTENDED', 'REJECTED', 'ON_HOLD', 'SHORTLISTED'],
  OFFER_EXTENDED: ['HIRED', 'REJECTED', 'ON_HOLD', 'WITHDRAWN'],
  HIRED: [],
  REJECTED: ['UNDER_REVIEW', 'PENDING'], // Allow reconsideration
  ON_HOLD: ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'REJECTED'],
  WITHDRAWN: ['PENDING'], // Allow re-application
};
