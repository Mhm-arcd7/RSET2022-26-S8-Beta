import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo brand">REDACTLY</div>

      <ul className="nav-links">
        <li>Upload</li>
        <li>Dashboard</li>
        <li>History</li>
        <li className="cta">Get Started</li>
      </ul>
    </nav>
  );
};

export default Navbar;
