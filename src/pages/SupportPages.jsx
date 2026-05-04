import Link from 'next/link';
import { Mail, MapPin, Phone, Search, ShieldCheck, FileText, MessageSquare, Home } from 'lucide-react';

const faqItems = [
  ['How do I book a PG visit?', 'Open any PG listing, choose Book Visit, fill in your visit date and phone number, then submit the request.'],
  ['Where can I see my bookings?', 'After login, open Profile or Dashboard and select My Bookings to track pending and confirmed requests.'],
  ['How do I save a PG?', 'Use the Save action on a PG listing. Saved PGs appear in your Profile under Saved PGs.'],
  ['Can owners list PGs?', 'Yes. Register as an owner, open My Listings, and add your PG details with photos, pricing, and amenities.'],
];

function SupportHero({ icon, title, description }) {
  return (
    <div className="support-hero">
      <div className="support-hero-icon">{icon}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function HelpPage() {
  return (
    <SupportPageLayout>
      <SupportHero icon={<Search size={30} />} title="Help Center" description="Find quick answers for bookings, saved PGs, owner listings, and payments." />
      <div className="support-grid">
        {faqItems.map(([question, answer]) => (
          <article className="support-card" key={question}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </SupportPageLayout>
  );
}

export function ContactPage() {
  return (
    <SupportPageLayout>
      <SupportHero icon={<MessageSquare size={30} />} title="Contact Us" description="Need help with a booking or listing? Reach the KloudPG support team." />
      <div className="support-contact-grid">
        <a className="support-card support-contact-card" href="mailto:support@kloudpg.com">
          <Mail size={22} />
          <div><h2>Email</h2><p>support@kloudpg.com</p></div>
        </a>
        <a className="support-card support-contact-card" href="tel:+919006352900">
          <Phone size={22} />
          <div><h2>Phone</h2><p>+91 9006352900</p></div>
        </a>
        <div className="support-card support-contact-card">
          <MapPin size={22} />
          <div><h2>Office</h2><p>Viman Nagar, Pune, India</p></div>
        </div>
      </div>
    </SupportPageLayout>
  );
}

export function PrivacyPage() {
  return (
    <SupportPageLayout>
      <SupportHero icon={<ShieldCheck size={30} />} title="Privacy Policy" description="How KloudPG handles account, booking, and listing information." />
      <PolicySections sections={[
        ['Information we collect', 'We collect profile details, contact information, booking requests, saved PG activity, and listing information needed to run the platform.'],
        ['How we use information', 'We use data to authenticate users, show relevant PGs, process bookings, support communication, improve safety, and maintain the service.'],
        ['Data sharing', 'We share booking contact details only with the relevant user or PG owner when required for a booking workflow.'],
        ['Your choices', 'You can update your name, phone, and profile picture from Profile. You may contact support for account or privacy requests.'],
      ]} />
    </SupportPageLayout>
  );
}

export function TermsPage() {
  return (
    <SupportPageLayout>
      <SupportHero icon={<FileText size={30} />} title="Terms of Service" description="The basic rules for using KloudPG as a student, professional, owner, or admin." />
      <PolicySections sections={[
        ['Using KloudPG', 'Use the platform honestly, provide accurate details, and do not misuse booking, chat, payment, review, or complaint features.'],
        ['Bookings and visits', 'Booking requests are subject to owner confirmation and PG availability. Visit details should be coordinated respectfully.'],
        ['Owner listings', 'Owners are responsible for accurate photos, prices, amenities, room details, and legal permission to list their PG.'],
        ['Platform changes', 'KloudPG may update features, policies, or availability to improve reliability, safety, and user experience.'],
      ]} />
    </SupportPageLayout>
  );
}

function PolicySections({ sections }) {
  return (
    <div className="support-policy">
      {sections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
    </div>
  );
}

function SupportPageLayout({ children }) {
  return (
    <div className="container support-page">
      {children}
      <div className="support-cta">
        <Home size={18} />
        <span>Ready to continue?</span>
        <Link href="/pgs" className="btn btn-primary btn-sm">Browse PGs</Link>
      </div>
    </div>
  );
}
