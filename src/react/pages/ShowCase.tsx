import UseTransitionExample from "../components/UseTransitionExample";

function ShowCase() {
  return (
    <div className="showcase-page">
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <header style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1>🎯 React Hooks ShowCase</h1>
          <p style={{ fontSize: "18px", color: "#666", marginTop: "8px" }}>
            Practical examples of React hooks in action
          </p>
        </header>

        <main>
          <section style={{ marginBottom: "40px" }}>
            <UseTransitionExample />
          </section>

          {/* Future examples can be added here */}
          <section
            style={{
              padding: "20px",
              border: "2px dashed #ddd",
              borderRadius: "8px",
              textAlign: "center",
              color: "#999",
            }}
          >
            <h3>More Examples Coming Soon!</h3>
            <p>This showcase will be expanded with more React hook examples.</p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ShowCase;
