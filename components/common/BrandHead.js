'use client';

import { useEffect } from 'react';
import { getBrandFromHostname, getBrandConfig } from '../../lib/constants/brands';

export default function BrandHead() {
  useEffect(() => {
    const brand = getBrandFromHostname(window.location.hostname);
    const config = getBrandConfig(brand);

    // Update favicon
    let link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = config.favicon;
    } else {
      link = document.createElement('link');
      link.rel = 'icon';
      link.href = config.favicon;
      document.head.appendChild(link);
    }

    // Update title
    document.title = `${config.name} - Careers`;
  }, []);

  return null;
}
