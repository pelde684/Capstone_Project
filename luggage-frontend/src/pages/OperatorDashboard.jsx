import { Link } from "react-router-dom";
import "./OperatorDashboard.css";

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

const scanPath = (
  <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
);
const shieldPath = (
  <>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </>
);
const handPath = <path d="M3 12l5-3 4 2 4-2 5 3M3 12v3l6 3 3-1 3 1 6-3v-3" />;
const reportPath = (
  <>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M9 12h7M9 16h7" />
  </>
);
const chevron = <path d="M9 6l6 6-6 6" />;

export default function OperatorDashboard() {
  // TODO: replace these with real data from your API
  const stats = {
    pending: 0,
    stored: 0,
    handedOver: 0,
    scansToday: 0,
  };

  return (
    <div className="od">
      <div className="od-stats">
        <div className="od-card od-stat">
          <div>
            <span>Pending Verification</span>
            <strong>{stats.pending}</strong>
          </div>
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </Icon>
        </div>

        <div className="od-card od-stat">
          <div>
            <span>Stored</span>
            <strong>{stats.stored}</strong>
          </div>
          <Icon>
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />
          </Icon>
        </div>

        <div className="od-card od-stat">
          <div>
            <span>Handed Over</span>
            <strong>{stats.handedOver}</strong>
          </div>
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </Icon>
        </div>

        <div className="od-card od-stat">
          <div>
            <span>Today's Scans</span>
            <strong>{stats.scansToday}</strong>
          </div>
          <Icon>{scanPath}</Icon>
        </div>
      </div>

      <div className="od-two">
        <Link to="/operator/scan" className="od-card od-act od-pri">
          <div className="od-ic"><Icon>{scanPath}</Icon></div>
          <h2>Scan QR</h2>
          <p>Scan a student's QR code to find their drop-off or pick-up.</p>
          <em>Open scanner <Icon>{chevron}</Icon></em>
        </Link>

        <Link to="/operator/verification" className="od-card od-act od-g">
          <div className="od-ic"><Icon>{shieldPath}</Icon></div>
          <h2>Verification</h2>
          <p>Check each item before it is stored.</p>
          <em>Verify items <Icon>{chevron}</Icon></em>
        </Link>
      </div>

      <div className="od-two">
        <Link to="/operator/handover" className="od-card od-act od-b od-short">
          <div className="od-ic"><Icon>{handPath}</Icon></div>
          <h2>Handover</h2>
          <p>Return stored items to students.</p>
          <em>Start handover <Icon>{chevron}</Icon></em>
        </Link>

        <Link to="/operator/report" className="od-card od-act od-y od-short">
          <div className="od-ic"><Icon>{reportPath}</Icon></div>
          <h2>Report</h2>
          <p>See activity and export records for the luggage room.</p>
          <em>View report <Icon>{chevron}</Icon></em>
        </Link>
      </div>
    </div>
  );
}