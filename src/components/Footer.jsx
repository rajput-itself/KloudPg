import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>KloudPG</h3>
            <p>
              India&apos;s trusted platform for finding the perfect PG accommodation.
              We connect students and professionals with verified PG owners across major cities.
            </p>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/pgs">Browse PGs</Link></li>
              <li><Link href="/register">List Your PG</Link></li>
              <li><Link href="/login">Login</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Top Cities</h4>
            <ul>
              <li><Link href="/pgs?city=Bangalore">Bangalore</Link></li>
              <li><Link href="/pgs?city=Mumbai">Mumbai</Link></li>
              <li><Link href="/pgs?city=Pune">Pune</Link></li>
              <li><Link href="/pgs?city=Delhi">Delhi</Link></li>
              <li><Link href="/pgs?city=Hyderabad">Hyderabad</Link></li>
              <li><Link href="/pgs?city=Chennai">Chennai</Link></li>
              <li><Link href="/pgs">More Cities</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li><Link href="/help">Help Center</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 KloudPG. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
