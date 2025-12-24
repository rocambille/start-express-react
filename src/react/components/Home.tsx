/*
  Purpose:
  Provide a minimal home page for the application.

  This component is intentionally simple and serves several roles:
  - Acts as the default landing page
  - Demonstrates basic React state handling

  Design notes:
  - No business logic is embedded here
  - Local state is used only for demonstration
  - External documentation is linked instead of duplicated
*/

import { useState } from "react";

function Home() {
  /*
    Local state:
    Used only to demonstrate reactivity and user interaction.
    This state has no impact on the rest of the application.
  */
  const [count, setCount] = useState(0);

  return (
    <>
      {/* **************************************************************** */}
      {/* Title and documentation link                                     */}
      {/* **************************************************************** */}

      <hgroup>
        <h1>StartER</h1>
        <p>
          <a
            href="https://github.com/rocambille/start-express-react/wiki/home-en-US"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        </p>
      </hgroup>

      {/* **************************************************************** */}
      {/* Interactive demo section                                         */}
      {/* **************************************************************** */}

      <div>
        <p data-testid="count-value">{count}</p>

        <button type="button" onClick={() => setCount(count + 1)}>
          Count
        </button>
      </div>
    </>
  );
}

export default Home;
