import { useState } from "react";

const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-card">
      <button
        className="collapsible-header"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className={`chevron ${open ? "open" : ""}`}>⌄</span>
      </button>

      <div className="collapsible-content">
        {open && children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
