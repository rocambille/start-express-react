import { useState } from "react";

function Home() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Home</h1>
      <p>Lorem Ipsum</p>
      <div>
        <div>{count}</div>
        <button type="button" onClick={() => setCount(count + 1)}>
          Count
        </button>
      </div>
    </>
  );
}

export default Home;
