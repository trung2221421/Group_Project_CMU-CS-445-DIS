import Card from './Card.jsx';

export default function StatCard({ icon: Icon, label, value, note, tone = 'blue', danger = false }) {
  return (
    <Card className={`stat-card ${danger ? 'stat-danger' : ''}`}>
      <div className={`stat-icon ${tone}`}>{Icon ? <Icon size={22} /> : null}</div>
      {note ? <span className={`stat-note ${danger ? 'danger-text' : ''}`}>{note}</span> : null}
      <p>{label}</p>
      <h3>{value}</h3>
    </Card>
  );
}
