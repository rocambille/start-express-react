import { useId, useMemo, useState, useTransition } from "react";

// Mock data to demonstrate the useTransition hook
const generateLargeDataset = () => {
  return Array.from({ length: 20000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    category: ["Electronics", "Books", "Clothing", "Home", "Sports"][i % 5],
    price: Math.floor(Math.random() * 1000) + 10,
  }));
};

const UseTransitionExample = () => {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputId = useId();
  const descriptionId = useId();

  // Generate data once
  const data = useMemo(() => generateLargeDataset(), []);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!query) return data.slice(0, 100); // Show first 100 items when no search

    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    );
  }, [data, query]);

  const handleSearch = (value: string) => {
    // Use startTransition to mark this state update as non-urgent
    // This allows React to keep the UI responsive during expensive filtering
    startTransition(() => {
      setQuery(value);
    });
  };

  return (
    <div className="use-transition-example">
      <div className="example-header">
        <h3>🚀 useTransition Hook Example</h3>
        <p>
          This example demonstrates how <code>useTransition</code> keeps the UI
          responsive during expensive operations. Try typing in the search box
          below:
        </p>
      </div>

      <div className="search-section">
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "500",
          }}
        >
          Search Items:
        </label>
        <input
          id={inputId}
          type="text"
          placeholder="Search items or categories..."
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
          aria-describedby={descriptionId}
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            width: "300px",
            marginBottom: "16px",
          }}
        />

        <div
          id={descriptionId}
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "8px",
          }}
        >
          Type to filter through 20,000 items. Notice how the input stays
          responsive.
        </div>

        {isPending && (
          <output
            className="loading-indicator"
            aria-live="polite"
            aria-label="Filtering results"
            style={{
              color: "#666",
              fontSize: "14px",
              marginLeft: "12px",
              display: "inline-block",
            }}
          >
            🔄 Filtering...
          </output>
        )}
      </div>

      <div className="results-section">
        <output
          style={{ color: "#666", marginBottom: "12px" }}
          aria-live="polite"
        >
          Showing {filteredData.length} items {query && `for "${query}"`}
        </output>

        <div
          className="results-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "12px",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #eee",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          {filteredData.slice(0, 50).map((item) => (
            <div
              key={item.id}
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {item.name}
              </div>
              <div style={{ color: "#666", fontSize: "14px" }}>
                {item.category} - ${item.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="explanation"
        style={{
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "#f0f8ff",
          borderRadius: "4px",
          border: "1px solid #b8daff",
        }}
      >
        <h4>💡 How it works:</h4>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Without useTransition:</strong> The search input would
            freeze during expensive filtering operations
          </li>
          <li>
            <strong>With useTransition:</strong> The input remains responsive
            while React processes the filter in the background
          </li>
          <li>
            <strong>isPending:</strong> Indicates when a transition is in
            progress, perfect for showing loading states
          </li>
          <li>
            <strong>startTransition:</strong> Marks state updates as non-urgent,
            allowing React to prioritize user interactions
          </li>
        </ul>

        <div style={{ marginTop: "12px", fontSize: "14px", color: "#666" }}>
          <strong>Best for:</strong> Search filters, sorting, pagination, data
          transformations, and any operation that might block the UI.
        </div>
      </div>
    </div>
  );
};

export default UseTransitionExample;
