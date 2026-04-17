interface ReadingRow {
  date: string;
  soilMoisture: number;
  airHumidity: number;
  temperature: number;
  light: number;
}

interface PlantReadingsHistoryProps {
  rows: ReadingRow[];
}

export function PlantReadingsHistory({ rows }: PlantReadingsHistoryProps) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <strong>Readings history</strong>
          <p>Linked plant readings table ready for future backend search and chart endpoints.</p>
        </div>
      </div>
      <div className="records-table__wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Soil humidity</th>
              <th>Air humidity</th>
              <th>Temperature</th>
              <th>Light</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.soilMoisture}%</td>
                <td>{row.airHumidity}%</td>
                <td>{row.temperature} °C</td>
                <td>{row.light} lux</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
