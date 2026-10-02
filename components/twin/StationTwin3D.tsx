'use client';

import React from 'react';
import { StationAsset, StationId } from '@/types';
import StationTwin2D from './StationTwin2D';

interface StationTwin3DProps {
  stationId: StationId;
  assets: StationAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

// Redirected to 2D vector twin to satisfy pure 2D requirements
export default function StationTwin3D(props: StationTwin3DProps) {
  return <StationTwin2D {...props} />;
}
