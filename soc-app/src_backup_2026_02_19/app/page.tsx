import { getScenarios } from '@/lib/data';
import DashboardClient from './dashboard-client';

export const revalidate = 0;

export default async function Home() {
  const scenarios = await getScenarios();

  return <DashboardClient scenarios={scenarios} />;
}
