import { Suspense } from 'react';
import PGsPageContent from './PGsPageContent';

export const metadata = {
  title: 'Browse PG Accommodations — KloudPG',
  description: 'Find verified PG accommodations across Bangalore, Mumbai, Pune, Delhi, Hyderabad & Chennai. Filter by budget, gender, amenities and more.',
};

export default function PGsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 0' }}><div className="loading-spinner"><div className="spinner" /></div></div>}>
      <PGsPageContent />
    </Suspense>
  );
}
