export const BRANDS = {
  venzo: {
    key: 'venzo',
    name: 'Venzo Technologies',
    domains: ['hire.venzotechnologies.com', 'localhost'],
    logo: '/Venzo_Logo.webp',
    favicon: '/favicon.svg',
    theme: {
      headerBg: `
        radial-gradient(ellipse at 0% 100%, #0030ce 0%, transparent 50%),
        radial-gradient(ellipse at 100% 50%, #0030ce 0%, transparent 40%),
        #0a1628
      `,
      headerText: '#ffffff',
      accentBg: '#0030ce',
      accentText: '#ffffff',
      pageBg: '#e3ebfb',
      cardAccent: 'rgba(59, 130, 246, 0.15)',
      buttonBg: '#0030ce',
      buttonText: '#ffffff',
      chipBg: 'rgba(255,255,255,0.15)',
      chipText: '#ffffff',
    },
  },
  kytz: {
    key: 'kytz',
    name: 'Kytz Labs',
    domains: ['hire.kytzlabs.com'],
    logo: '/KytzTmTag.webp',
    favicon: '/favicon-kytz.svg',
    theme: {
      headerBg: '#0a1628',
      headerText: '#ffffff',
      accentBg: '#c9f001',
      accentText: '#0a1628',
      pageBg: '#f5f5f5',
      cardAccent: 'rgba(212, 244, 66, 0.15)',
      buttonBg: '#c9f001',
      buttonText: '#0a1628',
      chipBg: 'rgba(212, 244, 66, 0.2)',
      chipText: '#c9f001',
    },
  },
  shelfi: {
    key: 'shelfi',
    name: 'SHELFi',
    domains: ['hire.shelfi.in'],
    logo: '/shelfi_logo.svg',
    favicon: '/shelfi_favicon.svg',
    theme: {
      headerBg: '#8F0449',
      headerText: '#ffffff',
      accentBg: '#8F0449',
      accentText: '#ffffff',
      pageBg: '#fdf2f4',
      cardAccent: 'rgba(143, 4, 73, 0.1)',
      buttonBg: '#8F0449',
      buttonText: '#ffffff',
      chipBg: 'rgba(143, 4, 73, 0.15)',
      chipText: '#ffffff',
    },
  },
};

export const BRAND_OPTIONS = [
  { value: 'venzo', label: 'Venzo Technologies' },
  { value: 'kytz', label: 'Kytz Labs' },
  { value: 'shelfi', label: 'SHELFi' },
];

export function getBrandFromHostname(hostname) {
  // Allow ?brand=kytz override for local testing
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const brandOverride = params.get('brand');
    if (brandOverride && BRANDS[brandOverride]) return brandOverride;
  }

  for (const [key, brand] of Object.entries(BRANDS)) {
    if (brand.domains.some(d => hostname.includes(d))) return key;
  }
  return 'venzo';
}

export function getBrandConfig(brandKey) {
  return BRANDS[brandKey] || BRANDS.venzo;
}
