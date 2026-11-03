import React from 'react';
import { Building, CheckCircle2, XCircle, Clock } from 'lucide-react';

const icons = {
  total: Building,
  available: CheckCircle2,
  sold: XCircle,
  onhold: Clock,
};

export default function StatCard({ type, label, count, footnote, onClick }) {
  const Icon = icons[type] || Building;

  return (
    <div className={`stat-card ${type}`} onClick={onClick}>
      <div className="stat-icon-wrapper">
        <Icon size={26} />
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-count">{count}</span>
        {footnote && <span className="stat-footnote">{footnote}</span>}
      </div>
    </div>
  );
}
