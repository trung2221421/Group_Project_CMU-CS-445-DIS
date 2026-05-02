export default function DonutChart({ value = 92, label = 'Tỷ lệ đi làm' }) {
  return (
    <div className="donut" style={{ '--value': `${value * 3.6}deg` }}>
      <div className="donut-inner">
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
