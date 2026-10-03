import React from 'react';
import ProjectAspectsShowcase from '@/components/showcase/ProjectAspectsShowcase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Aspects & Architecture | POLAR COMMAND SIH26060',
  description: 'Comprehensive architectural overview of the POLAR COMMAND Antarctic Digital Twin framework for SIH26060.',
};

export default function OverviewPage() {
  return <ProjectAspectsShowcase />;
}
