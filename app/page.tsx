import React from 'react';
import ProjectAspectsShowcase from '@/components/showcase/ProjectAspectsShowcase';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POLAR COMMAND | Antarctic Digital Twin Platform (SIH26060)',
  description: 'Digital Twin framework for efficient remote management of Indian Antarctic Research Stations Maitri and Bharati.',
};

export default function Home() {
  return <ProjectAspectsShowcase />;
}
