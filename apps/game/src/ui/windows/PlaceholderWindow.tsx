interface PlaceholderWindowProps {
  rows: readonly string[];
  title: string;
}

export function PlaceholderWindow({ rows, title }: PlaceholderWindowProps) {
  return (
    <>
      <div className="focus-window__titlebar">
        <strong>{title}</strong>
      </div>
      <div className="focus-window__body">
        {rows.map((row) => (
          <div key={row} className="focus-row">
            {row}
          </div>
        ))}
      </div>
    </>
  );
}
