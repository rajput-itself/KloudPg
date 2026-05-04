import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import HomePage from '@/app/page';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import ForgotPasswordPage from '@/app/forgot-password/page';
import PGsPage from '@/app/pgs/page';
import PGDetailPage from '@/app/pgs/[id]/page';
import DashboardPage from '@/app/dashboard/page';
import OwnerDashboardPage from '@/app/owner/dashboard/page';
import AdminDashboardPage from '@/app/admin/dashboard/page';
import AdminUsersPage from '@/app/admin/users/page';
import AdminPGsPage from '@/app/admin/pgs/page';
import AdminBookingsPage from '@/app/admin/bookings/page';
import AdminComplaintsPage from '@/app/admin/complaints/page';
import AdminReportsPage from '@/app/admin/reports/page';
import NotificationsPage from '@/app/notifications/page';
import ChatInboxPage from '@/app/chat/page';
import ChatPage from '@/app/chat/[pg_id]/page';
import PaymentPage from '@/app/payment/[booking_id]/page';
import ProfilePage from '@/pages/ProfilePage';
import { ContactPage, HelpPage, PrivacyPage, TermsPage } from '@/pages/SupportPages';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="page-wrapper">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pgs" element={<PGsPage />} />
          <Route path="/pgs/:id" element={<PGDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/pgs" element={<AdminPGsPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/chat" element={<ChatInboxPage />} />
          <Route path="/chat/:pg_id" element={<ChatPage />} />
          <Route path="/payment/:booking_id" element={<PaymentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  );
}
