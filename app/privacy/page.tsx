export default function Privacy() {
  return (
    <main className="legal-page">
      <a href="/" className="login-wordmark">
        finn<span>.</span>
      </a>
      <h1>Your information, explained.</h1>
      <p>
        FINN is an investment-research prototype maintained by the owner of the
        linked GitHub repository.
      </p>
      <h2>Google sign-in</h2>
      <p>
        When configured, Google verifies your identity. FINN receives your
        Google account identifier, name and verified email address. It does not
        request Gmail inbox access or receive your Google password. A signed,
        HttpOnly session cookie keeps you signed in for up to seven days. Sign
        out to clear it.
      </p>
      <h2>Your desk and notebook</h2>
      <p>
        Watchlists, notes, saved insights, comparison choices and alert settings
        are stored in this browser. They are not synchronised across devices.
        Signed-in accounts use separate local desk records in this browser; the
        sample desk has its own records. Signing out does not erase those
        records. Remove private notes and clear site storage before sharing a
        browser.
      </p>
      <h2>Research requests</h2>
      <p>
        Questions and source extracts are sent to FINN’s server and to the
        configured Gemini API to generate an answer. Google’s applicable API
        data terms apply. Use public company documents rather than confidential
        material. Responses may be held in a temporary server cache.
      </p>
      <h2>External sources</h2>
      <p>
        Market prices come from Yahoo Finance. Opening a company document takes
        you to the publisher’s website. Those services have their own policies.
      </p>
      <h2>Contact and removal</h2>
      <p>
        Use the project owner’s GitHub repository for support:{" "}
        <a href="https://github.com/cgoyal23/finn-investment-agent">
          finn-investment-agent
        </a>
        . Clear this site’s browser storage to remove local preferences and
        notes. The notebook also offers individual deletion.
      </p>
      <a className="button primary" href="/login">
        Back to sign-in
      </a>
    </main>
  );
}
