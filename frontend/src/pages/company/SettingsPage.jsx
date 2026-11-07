import React, { useState } from "react";
import { mockCompany } from "./mockData";

export default function SettingsPage() {
  const [company, setCompany] = useState(mockCompany);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-heading">Company Settings</h2>
          <p className="page-subheading">Update institution profile, global join token, and AI automated reminders.</p>
        </div>
      </div>

      <div className="data-card" style={{ maxWidth: "720px" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Institution / Enterprise Name</label>
            <input
              type="text"
              className="form-input"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Entity Classification Type</label>
            <select
              className="form-select"
              value={company.type}
              onChange={(e) => setCompany({ ...company, type: e.target.value })}
            >
              <option value="incubator">Corporate Incubator / Accelerator</option>
              <option value="company">Enterprise / Corporation</option>
              <option value="university">University Innovation Center</option>
              <option value="college">College / Academy</option>
            </select>
          </div>
          <div className="form-group">
            <label>Global Enterprise Invite Code</label>
            <input
              type="text"
              className="form-input"
              value={company.invite_code}
              onChange={(e) => setCompany({ ...company, invite_code: e.target.value })}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Unique identifier used for single sign-on / join URLs.</span>
          </div>
          <div className="form-group">
            <label>Inactive Milestone Notification Threshold (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              className="form-input"
              value={company.settings.reminder_days}
              onChange={(e) => setCompany({ ...company, settings: { ...company.settings, reminder_days: Number(e.target.value) } })}
            />
          </div>
          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
            <button type="submit" className="btn-primary">Save Settings</button>
            {saved && <span style={{ color: "green", fontSize: "13px", fontWeight: 700 }}>✓ Settings updated successfully</span>}
          </div>
        </form>
      </div>
    </div>
  );
}