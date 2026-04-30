export default function BarChart({ values = [52, 60, 66, 80, 72, 88], labels = ['T11', 'T12', 'T01', 'T02', 'T03', 'Tháng này'] }) {
  return (
    <div className="bar-chart">
      {values.map((value, index) => (
        <div className="bar-item" key={labels[index]}>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${value}%` }} />
          </div>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}
