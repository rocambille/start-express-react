import { useState } from "react";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <>
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
