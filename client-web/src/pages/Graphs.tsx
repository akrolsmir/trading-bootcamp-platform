export function Graphs() {
  const urls = [
    // A, B, C, D
    "market/122",
    "market/123",
    // sum
    "market/119",

    // C, D
    "market/124",
    "market/125",
    // avg
    "market/121",
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: "8px",
        position: "fixed",
        backgroundColor: "black",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {urls.map((url, i) => (
        <iframe
          key={i}
          src={url}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title={`Graph ${i + 1}`}
        />
      ))}
    </div>
  );
}
