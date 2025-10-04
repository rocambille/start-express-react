import { useFormStatus } from "react-dom";
import { useState } from "react";

/**
 * Submit button that uses useFormStatus to show pending state
 * This component must be a child of a form to access form status
 */
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

/**
 * Form status indicator that displays detailed information
 */
function FormStatusIndicator() {
  const { pending, data, method, action } = useFormStatus();

  if (!pending && !data) return null;

  return (
    <div
      style={{
        padding: "1rem",
        marginTop: "1rem",
        backgroundColor: pending ? "#fff3cd" : "#d1e7dd",
        borderRadius: "0.25rem",
        border: `1px solid ${pending ? "#ffc107" : "#198754"}`,
      }}
    >
      <p>
        <strong>Form Status:</strong> {pending ? "⏳ Pending" : "✅ Completed"}
      </p>
      {data && (
        <p>
          <strong>Form Data:</strong> {data.get("name") as string}
        </p>
      )}
      {method && (
        <p>
          <strong>Method:</strong> {method}
        </p>
      )}
    </div>
  );
}

/**
 * Main showcase component demonstrating useFormStatus hook
 */
function UseFormStatusShowcase() {
  const [submissions, setSubmissions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    setIsProcessing(true);

    // Simulate async operation (e.g., API call)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const submission = `${name} (${email}): ${message}`;
    setSubmissions((prev) => [...prev, submission]);
    setIsProcessing(false);
  };

  return (
    <div>
      <h2>useFormStatus Hook Showcase</h2>

      <p>
        The <code>useFormStatus</code> hook provides information about the
        status of a form submission. It's useful for showing loading states,
        disabling submit buttons during submission, and accessing form data.
      </p>

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "1rem",
          borderRadius: "0.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <h3>Key Features:</h3>
        <ul>
          <li>
            <strong>pending:</strong> Boolean indicating if form is submitting
          </li>
          <li>
            <strong>data:</strong> FormData object containing form values
          </li>
          <li>
            <strong>method:</strong> HTTP method (get/post)
          </li>
          <li>
            <strong>action:</strong> Function or URL the form submits to
          </li>
        </ul>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Try it out:</h3>
        <form
          action={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: "500px",
          }}
        >
          <div>
            <label htmlFor="name">
              Name <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              required
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email">
              Email <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="message">
              Message <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              placeholder="Your message here..."
              rows={4}
            />
          </div>

          {/* Submit button using useFormStatus */}
          <SubmitButton />

          {/* Status indicator showing form state */}
          <FormStatusIndicator />
        </form>

        {isProcessing && (
          <p style={{ marginTop: "1rem", color: "#0066cc" }}>
            Processing your submission...
          </p>
        )}

        {submissions.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <h3>Submissions:</h3>
            <ul>
              {submissions.map((sub, index) => (
                <li key={index}>{sub}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#e7f3ff",
          borderLeft: "4px solid #0066cc",
          borderRadius: "0.25rem",
        }}
      >
        <h4>💡 Important Note:</h4>
        <p>
          The <code>useFormStatus</code> hook must be called from a component
          that is rendered <strong>inside a form</strong>. That's why we have
          separate <code>SubmitButton</code> and{" "}
          <code>FormStatusIndicator</code> components as children of the form.
        </p>
      </div>
    </div>
  );
}

export default UseFormStatusShowcase;
