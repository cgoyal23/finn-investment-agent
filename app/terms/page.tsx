export default function Terms() {
  return (
    <main className="legal-page">
      <a href="/" className="login-wordmark">
        finn<span>.</span>
      </a>
      <h1>A research prototype, with clear limits.</h1>
      <p>
        FINN helps explore public company documents and historical market data.
        It does not execute trades, provide personalised investment advice or
        promise future returns.
      </p>
      <h2>Check the source</h2>
      <p>
        AI output can be wrong. Inspect source documents, dates, reporting units
        and measurement basis before relying on an interpretation. A source link
        does not independently prove every claim.
      </p>
      <h2>Data freshness</h2>
      <p>
        The filing library contains selected historical examples. Charts label
        their latest available session. Background monitoring and continuous
        exchange ingestion are not yet enabled.
      </p>
      <h2>Accounts and availability</h2>
      <p>
        Google sign-in requires configuration by the project owner. The public
        sample desk remains available without pretending a visitor is signed in.
        Third-party providers may impose limits or become unavailable.
      </p>
      <a className="button primary" href="/">
        Explore FINN
      </a>
    </main>
  );
}
