'use client';

import { Box } from '@mui/material';
import Image from 'next/image';

export default function Logo({ width = 180, height = 60, variant = 'default' }) {
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
        src="/Venzo_Logo.webp"
        alt="Venzo Logo"
        width={width}
        height={height}
        priority
        style={{ objectFit: 'contain' }}
      />
    </Box>
  );
}
