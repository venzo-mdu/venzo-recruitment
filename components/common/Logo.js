'use client';

import { Box } from '@mui/material';
import Image from 'next/image';
import { getBrandConfig } from '../../lib/constants/brands';

export default function Logo({ width = 180, height = 60, variant = 'default', brand = 'venzo' }) {
  const brandConfig = getBrandConfig(brand);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: variant === 'white' ? 'brightness(0) invert(1)' : 'none',
      }}
    >
      <Image
        src={brandConfig.logo}
        alt={`${brandConfig.name} Logo`}
        width={width}
        height={height}
        priority
        style={{ objectFit: 'contain' }}
      />
    </Box>
  );
}
