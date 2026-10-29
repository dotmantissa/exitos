import {
  ArrowDown,
  Check,
  Download,
  ExternalLink,
  Globe,
  KeyRound,
  Moon,
  ShieldCheck,
  Sun,
  Vault,
  Wallet,
} from "lucide-react";

type Props = {
  theme: string;
  onToggleTheme: () => void;
  onOpenVault: () => void;
  onOpenRecovery: () => void;
};

export default function Landing({
  theme,
  onToggleTheme,
  onOpenVault,
  onOpenRecovery,
}: Props) {
  return (
    <div className="landing">
      <a className="skip-link" href="#page-title">
        Skip to the explanation
      </a>
      <header className="landing-header">
        <a className="brand" href="#Start" aria-label="ExitOS introduction">
          <img className="mark" src="/logo.svg" width="42" height="42" alt="" />
          <span>
            ExitOS<span className="brand-sub">A backup way to withdraw</span>
          </span>
        </a>
        <nav aria-label="Introduction navigation">
          <a href="#how-it-works">How it works</a>
          <button onClick={onOpenRecovery}>Open recovery</button>
        </nav>
        <button
          className="icon-button"
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          onClick={onToggleTheme}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button
          className="primary-button landing-header-cta"
          onClick={onOpenVault}
        >
          Try the test vault
        </button>
      </header>
      <main>
        <section className="landing-opening" aria-labelledby="page-title">
          <div className="landing-story">
            <span className="landing-network">
              <Vault size={16} />
              Built on X Layer testnet
            </span>
            <h1 id="page-title" tabIndex={-1}>
              A backup withdrawal page for DeFi vaults.
            </h1>
            <p className="landing-lead">
              Your DeFi app’s website can go offline while your tokens are still
              in its vault. ExitOS gives you another way to withdraw them.
            </p>
            <p className="landing-explanation">
              Save a verified recovery page before you need it. If the usual
              website stops working, open your saved copy, connect your wallet
              and withdraw directly from a supported vault.
            </p>
            <div className="landing-actions">
              <button className="primary-button" onClick={onOpenVault}>
                Try the test vault
                <Vault size={18} />
              </button>
              <a href="#how-it-works" className="text-button">
                See how recovery works
                <ArrowDown size={16} />
              </a>
            </div>
            <div className="landing-scope">
              <span>Live today</span>
              <p>
                One real test vault on X Layer. Deposit and withdraw free XUSD
                test tokens. They have no monetary value.
              </p>
            </div>
          </div>
          <figure className="access-diagram">
            <figcaption>Same vault. A second way to withdraw.</figcaption>
            <div className="access-inputs">
              <div>
                <Globe size={24} strokeWidth={1.5} />
                <strong>Usual website</strong>
                <span>Can go offline</span>
              </div>
              <div className="saved-input">
                <Download size={24} strokeWidth={1.5} />
                <strong>Saved recovery kit</strong>
                <span>Your backup page</span>
              </div>
            </div>
            <div className="access-connectors" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="landing-vault">
              <Vault size={32} strokeWidth={1.25} />
              <strong>Your vault</strong>
              <p>
                The contract holding
                <br />
                your deposited tokens
              </p>
              <span className="vault-doorline" />
            </div>
            <div className="access-output" aria-hidden="true">
              <ArrowDown size={20} />
            </div>
            <div className="landing-wallet">
              <Wallet size={21} />
              <div>
                <strong>Your wallet</strong>
                <span>You approve the withdrawal.</span>
              </div>
            </div>
            <p className="diagram-note">
              The saved page reads approved withdrawal code from the chain. It
              does not need the app’s website to load that code.
            </p>
          </figure>
        </section>
        <section
          id="how-it-works"
          className="landing-how"
          aria-labelledby="how-title"
        >
          <div className="section-context">
            <span>Before the website goes offline</span>
            <h2 id="how-title">
              Prepare once.
              <br />
              Keep a way out.
            </h2>
            <p>
              A vault is a smart contract that holds deposited tokens. The
              website is the interface you usually use to reach it. ExitOS
              prepares a second interface you can keep.
            </p>
          </div>
          <ol className="preparation-list">
            <li>
              <Vault size={23} />
              <div>
                <h3>Use a supported vault</h3>
                <p>
                  Start with our test vault. Connect a wallet, get free XUSD and
                  make a small deposit. Every action is a real testnet
                  transaction.
                </p>
              </div>
            </li>
            <li>
              <Download size={23} />
              <div>
                <h3>Save your recovery kit</h3>
                <p>
                  Download the HTML file while the website is available. Open it
                  in a compatible wallet browser to check it works, then keep it
                  somewhere you can find.
                </p>
              </div>
            </li>
            <li>
              <Wallet size={23} />
              <div>
                <h3>Withdraw through your saved page</h3>
                <p>
                  If the website goes offline, open the file. It checks the
                  approved code, reads your vault balance and lets your wallet
                  send the withdrawal directly.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="landing-audience" aria-label="Who ExitOS helps">
          <div>
            <KeyRound size={23} />
            <h2>For people with tokens in a vault</h2>
            <p>
              Keep a withdrawal page you can open without the usual website.
              Your tokens stay in the vault until you choose to withdraw. Your
              keys stay with you.
            </p>
            <button className="text-button" onClick={onOpenVault}>
              Prepare a test recovery
            </button>
          </div>
          <div>
            <ShieldCheck size={23} />
            <h2>For protocol teams</h2>
            <p>
              Give depositors a prepared recovery path. Approved releases,
              verified code and recorded withdrawal drills help you check that
              the backup actually works.
            </p>
            <a
              className="text-button"
              href="https://github.com/dotmantissa/exitos/blob/main/ARCHITECTURE.md"
              target="_blank"
              rel="noreferrer"
            >
              Read the architecture
              <ExternalLink size={15} />
            </a>
          </div>
        </section>
        <section
          className="landing-questions"
          aria-labelledby="questions-title"
        >
          <div>
            <h2 id="questions-title">A few things to know.</h2>
            <p>Clear expectations make a better backup.</p>
          </div>
          <div className="questions-list">
            <details>
              <summary>What can I use today?</summary>
              <p>
                The ExitOS test vault on X Layer testnet. You can claim free
                XUSD, deposit it, download the recovery kit and withdraw through
                the app or the standalone page. Test OKB pays the network fee.
                XUSD has no monetary value.
              </p>
            </details>
            <details>
              <summary>How is this different from a second website?</summary>
              <p>
                The downloaded kit contains its own verifier. It reads the
                approved recovery module from X Layer and checks its bytes
                before running it. Once saved, it can load withdrawal code
                without contacting the ExitOS website. It still needs an
                internet connection, the chain and a compatible wallet.
              </p>
            </details>
            <details>
              <summary>Who approves the recovery code?</summary>
              <p>
                Two publishers and a safety reviewer approve each version. A
                TapeOut compatible circuit enforces that approval rule. This
                testnet processor is independently deployed. Official TapeOut
                registration and DeWEB delivery are future integrations.
              </p>
            </details>
            <details>
              <summary>
                Does it help if the contract is broken or I lose my keys?
              </summary>
              <p>
                ExitOS covers website outages while the vault and chain remain
                available. It cannot repair a contract exploit or replace lost
                wallet keys. It currently supports the ExitOS test vault.
              </p>
            </details>
          </div>
        </section>
        <section className="landing-next">
          <div>
            <Check size={22} />
            <h2>
              Make a small deposit.
              <br />
              Then bring it back.
            </h2>
            <p>Try the full recovery flow with free test tokens.</p>
          </div>
          <button className="primary-button" onClick={onOpenVault}>
            Try the test vault
            <Vault size={18} />
          </button>
        </section>
      </main>
      <footer className="landing-footer">
        <a className="brand" href="#Start">
          <img className="mark" src="/logo.svg" width="30" height="30" alt="" />
          <span>ExitOS</span>
        </a>
        <span>Backup withdrawals. Your wallet stays in charge.</span>
        <a
          href="https://github.com/dotmantissa/exitos"
          target="_blank"
          rel="noreferrer"
        >
          Source and evidence
          <ExternalLink size={14} />
        </a>
      </footer>
    </div>
  );
}
