import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  Fingerprint,
  House,
  KeyRound,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Vault,
  Wallet,
  X,
  DoorOpen,
  FileCheck2,
  CircleAlert,
} from "lucide-react";
import { formatUnits, parseEventLogs, type Address, type Hex } from "viem";
import {
  client,
  deployment,
  explorer,
  assetAbi,
  vaultAbi,
} from "../chain/config";
import {
  connectWallet,
  getProvider,
  humanError,
  switchNetwork,
  wallet,
} from "../chain/wallet";
import {
  readPosition,
  prepareTransaction,
  type Position,
  type Action,
} from "../chain/position";
import { verifyRelease, type VerifiedRelease } from "../chain/verification";
import { displayAmount, parseAmount, shortAddress } from "../lib/amounts";

type Page = "Overview" | "Recovery" | "Releases" | "Activity";
type RecordItem = {
  hash: Hex;
  account: Address;
  action: Action;
  amount: string;
  status: "pending" | "included" | "reverted";
  at: number;
  block?: string;
};
type Flow = {
  action: Action;
  amount: string;
  step:
    | "amount"
    | "checking"
    | "review"
    | "wallet"
    | "pending"
    | "done"
    | "error";
  fee?: bigint;
  hash?: Hex;
  error?: string;
};
const actionTitle = {
  claim: "Claim test credit",
  approve: "Allow XUSD",
  deposit: "Add to the vault",
  withdraw: "Bring it home",
};
const nav = [
  { label: "Overview", icon: House },
  { label: "Recovery", icon: DoorOpen },
  { label: "Releases", icon: FileCheck2 },
  { label: "Activity", icon: Activity },
] as const;
function loadHistory(): RecordItem[] {
  try {
    const data = JSON.parse(localStorage.getItem("exitos.activity") || "[]");
    return Array.isArray(data)
      ? data
          .filter(
            (v) =>
              /^0x[a-fA-F0-9]{64}$/.test(v.hash) &&
              /^0x[a-fA-F0-9]{40}$/.test(v.account) &&
              ["claim", "approve", "deposit", "withdraw"].includes(v.action) &&
              ["pending", "included", "reverted"].includes(v.status),
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
}
function Mark({ small = false }: { small?: boolean }) {
  return (
    <img
      className={small ? "mark small" : "mark"}
      src="/logo.svg"
      alt="ExitOS"
      width={small ? 28 : 42}
      height={small ? 28 : 42}
    />
  );
}
function LinkOut({
  address,
  children,
}: {
  address: Address | string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={explorer(address as Address, "address")}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ExternalLink size={14} />
    </a>
  );
}
function Empty({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Wallet;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Icon size={30} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(
    (["Overview", "Recovery", "Releases", "Activity"].includes(
      location.hash.slice(1),
    )
      ? location.hash.slice(1)
      : "Overview") as Page,
  );
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || "light",
  );
  const [account, setAccount] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [position, setPosition] = useState<Position>();
  const [release, setRelease] = useState<VerifiedRelease>();
  const [releaseError, setReleaseError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [flow, setFlow] = useState<Flow>();
  const [records, setRecords] = useState<RecordItem[]>(loadHistory);
  const [copied, setCopied] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [kitReady, setKitReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const version = useRef(0),
    lock = useRef(false),
    accountRef = useRef(account);
  accountRef.current = account;
  const disconnected = !account;
  const wrongNetwork = !!account && chainId !== 1952;
  const available =
    !!deployment && !!release && !!account && !wrongNetwork && !loading;
  const accountRecords = records.filter(
    (v) => v.account.toLowerCase() === account?.toLowerCase(),
  );

  const inspect = useCallback(async () => {
    setReleaseError("");
    try {
      setRelease(await verifyRelease());
    } catch (e) {
      setRelease(undefined);
      setReleaseError(humanError(e));
    }
  }, []);
  const refresh = useCallback(async () => {
    if (
      !account ||
      chainId !== 1952 ||
      !deployment ||
      accountRef.current?.toLowerCase() !== account.toLowerCase()
    )
      return;
    const current = ++version.current;
    const stillCurrent = () =>
      current === version.current &&
      accountRef.current?.toLowerCase() === account.toLowerCase();
    setLoading(true);
    setError("");
    try {
      const next = await readPosition(account);
      if (stillCurrent()) setPosition(next);
    } catch (e) {
      if (stillCurrent()) {
        setPosition(undefined);
        setError(humanError(e));
      }
    } finally {
      if (stillCurrent()) setLoading(false);
    }
  }, [account, chainId]);
  useEffect(() => {
    void inspect();
  }, [inspect]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const change = () =>
      setPage(
        nav.find((v) => v.label === location.hash.slice(1))?.label ??
          "Overview",
      );
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;
    const reset = () => {
      version.current++;
      setPosition(undefined);
      setFlow((current) => (current?.hash ? current : undefined));
      setError("");
    };
    const accounts = (value: unknown) => {
      reset();
      setAccount((value as Address[])[0]);
    };
    const network = (value: unknown) => {
      reset();
      setChainId(Number(value));
    };
    const disconnect = () => {
      reset();
      setAccount(undefined);
      setChainId(undefined);
    };
    provider.on?.("accountsChanged", accounts);
    provider.on?.("chainChanged", network);
    provider.on?.("disconnect", disconnect);
    return () => {
      provider.removeListener?.("accountsChanged", accounts);
      provider.removeListener?.("chainChanged", network);
      provider.removeListener?.("disconnect", disconnect);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("exitos.activity", JSON.stringify(records));
    } catch {}
  }, [records]);
  useEffect(() => {
    let stopped = false;
    const pending = records.filter((v) => v.status === "pending");
    if (!pending.length) return;
    const interval = setInterval(() => {
      void Promise.all(
        pending.map(async (item) => {
          try {
            const receipt = await client.getTransactionReceipt({
              hash: item.hash,
            });
            if (!stopped)
              setRecords((current) =>
                current.map((v) =>
                  v.hash === item.hash
                    ? {
                        ...v,
                        status:
                          receipt.status === "success"
                            ? "included"
                            : "reverted",
                        block: String(receipt.blockNumber),
                      }
                    : v,
                ),
              );
          } catch {}
        }),
      );
    }, 12000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [records]);
  useEffect(() => {
    if (flow && !dialog.current?.open) dialog.current?.showModal();
    if (!flow && dialog.current?.open) dialog.current?.close();
  }, [flow]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => setKitReady(true))
        .catch(() => setKitReady(false));
  }, []);

  const connect = async () => {
    if (connecting) return;
    setConnecting(true);
    setError("");
    try {
      const result = await connectWallet();
      setAccount(result.account);
      setChainId(result.chainId);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setConnecting(false);
    }
  };
  const changeNetwork = async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      await switchNetwork(provider);
      setChainId(Number(await provider.request({ method: "eth_chainId" })));
    } catch (e) {
      setError(humanError(e));
    }
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("exitos.theme", next);
    } catch {}
  };
  const go = (next: Page) => {
    setPage(next);
    location.hash = next;
    setMobileNav(false);
  };
  const start = (action: Action) => {
    setFlow({
      action,
      amount: action === "claim" ? "1000" : "",
      step: action === "claim" ? "review" : "amount",
    });
  };
  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setError(
        "Your browser could not copy that. You can select the address in the details instead.",
      );
    }
  };
  const review = async () => {
    if (!flow || !account || !position) return;
    try {
      const amount = parseAmount(
        flow.amount,
        18,
        flow.action === "withdraw" ? position.maximum : position.walletBalance,
      );
      const action =
        flow.action === "deposit" && amount > position.allowance
          ? "approve"
          : flow.action;
      setFlow({ ...flow, action, step: "checking", error: undefined });
      const current = version.current;
      const prepared = await prepareTransaction(action, amount, account);
      if (current !== version.current) return;
      setFlow({
        ...flow,
        action,
        step: "review",
        fee: prepared.fee,
        error: undefined,
      });
    } catch (e) {
      setFlow((current) =>
        current
          ? { ...current, step: "amount", error: humanError(e) }
          : current,
      );
    }
  };
  const confirm = async () => {
    if (lock.current || !flow || !account || wrongNetwork) return;
    lock.current = true;
    const selected = { ...flow },
      who = account,
      current = version.current;
    try {
      setFlow({ ...selected, step: "checking", error: undefined });
      const amount =
        selected.action === "claim"
          ? 1000n * 10n ** 18n
          : parseAmount(selected.amount, 18);
      const prepared = await prepareTransaction(selected.action, amount, who);
      const provider = getProvider();
      if (!provider) throw new Error("Your wallet is no longer connected.");
      const accounts = (await provider.request({
        method: "eth_accounts",
      })) as Address[];
      const network = Number(await provider.request({ method: "eth_chainId" }));
      if (
        current !== version.current ||
        accounts[0]?.toLowerCase() !== who.toLowerCase() ||
        network !== 1952
      )
        throw new Error(
          "Your account or network changed. Please review again.",
        );
      setFlow({ ...selected, step: "wallet" });
      const hash = await wallet(provider).sendTransaction({
        account: who,
        ...prepared.tx,
        gas: prepared.gas,
      });
      setRecords((items) =>
        [
          {
            hash,
            account: who,
            action: selected.action,
            amount: formatUnits(amount, 18),
            status: "pending" as const,
            at: Date.now(),
          },
          ...items,
        ].slice(0, 30),
      );
      setFlow({ ...selected, step: "pending", hash });
      let receipt;
      try {
        receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 180000,
        });
      } catch {
        throw new Error(
          "The transaction is still being tracked in Activity. Check there before trying again.",
        );
      }
      const actual = await client.getTransaction({ hash });
      if (
        actual.from.toLowerCase() !== who.toLowerCase() ||
        actual.to?.toLowerCase() !== prepared.tx.to.toLowerCase() ||
        actual.input !== prepared.tx.data ||
        actual.value !== 0n
      )
        throw new Error(
          "The returned transaction does not match the reviewed request.",
        );
      setRecords((items) =>
        items.map((v) =>
          v.hash === hash
            ? {
                ...v,
                status: receipt.status === "success" ? "included" : "reverted",
                block: String(receipt.blockNumber),
              }
            : v,
        ),
      );
      if (receipt.status !== "success")
        throw new Error(
          "The transaction reverted. Your intended transfer was not completed.",
        );
      const event =
        selected.action === "deposit"
          ? "Deposit"
          : selected.action === "withdraw"
            ? "Withdraw"
            : undefined;
      if (
        event &&
        !parseEventLogs({
          abi: vaultAbi,
          logs: receipt.logs,
          eventName: event,
        }).some(
          (log) =>
            log.address.toLowerCase() === deployment!.vault.toLowerCase() &&
            log.args.owner?.toLowerCase() === who.toLowerCase() &&
            log.args.assets === amount,
        )
      )
        throw new Error(
          "The expected vault event was not found. Inspect the receipt before continuing.",
        );
      if (
        selected.action === "claim" &&
        !parseEventLogs({
          abi: assetAbi,
          logs: receipt.logs,
          eventName: "Transfer",
        }).some(
          (log) =>
            log.address.toLowerCase() === deployment!.asset.toLowerCase() &&
            log.args.to.toLowerCase() === who.toLowerCase() &&
            log.args.value === amount,
        )
      )
        throw new Error("The expected test credit transfer was not found.");
      if (selected.action === "approve") {
        const allowance = await client.readContract({
          address: deployment!.asset,
          abi: assetAbi,
          functionName: "allowance",
          args: [who, deployment!.vault],
          blockNumber: receipt.blockNumber,
        });
        if (allowance !== amount)
          throw new Error(
            "The receipt did not establish the reviewed allowance.",
          );
      }
      await refresh();
      setFlow({ ...selected, step: "done", hash });
    } catch (e) {
      setFlow((state) =>
        state ? { ...state, step: "error", error: humanError(e) } : state,
      );
    } finally {
      lock.current = false;
    }
  };
  const busy = flow && ["checking", "wallet", "pending"].includes(flow.step);
  const close = () => {
    if (!busy) setFlow(undefined);
  };
  const saveKit = async () => {
    if (!deployment) return;
    try {
      const response = await fetch("/recovery-kit.html");
      if (!response.ok)
        throw new Error("The recovery kit is not available yet.");
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = "ExitOS recovery kit.html";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(humanError(e));
    }
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "expanded" : ""}`}>
        <a
          className="brand"
          aria-label="ExitOS overview"
          href="#Overview"
          onClick={() => go("Overview")}
        >
          <Mark />
          <span>
            ExitOS<span className="brand-sub">A clear way out</span>
          </span>
        </a>
        <button
          className="icon-button mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={mobileNav}
          onClick={() => setMobileNav(!mobileNav)}
        >
          <Menu size={22} />
        </button>
        <nav aria-label="Main navigation">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              aria-label={label}
              className={`nav-item ${page === label ? "active" : ""}`}
              aria-current={page === label ? "page" : undefined}
              onClick={() => go(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {page === label && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-badge">
            <span className="status-dot" />X Layer testnet
          </div>
          <p>
            Real transactions.
            <br />
            Test assets only.
          </p>
          <div className="sidebar-tools">
            <button
              className="icon-button"
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <a
              className="icon-button"
              href="https://github.com/dotmantissa/exitos"
              target="_blank"
              rel="noreferrer"
              aria-label="Source and documentation"
            >
              <CircleHelp size={19} />
            </a>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace
            <ChevronRight size={14} />
            <span>{page}</span>
          </div>
          <button
            className={`wallet-button ${account ? "connected" : ""}`}
            onClick={account ? () => copy(account, "wallet") : connect}
            disabled={connecting}
          >
            <Wallet size={17} />
            {connecting
              ? "Connecting…"
              : account
                ? shortAddress(account)
                : "Connect wallet"}
            {copied === "wallet" && <Check size={15} />}
          </button>
          {account && (
            <button
              className="icon-button disconnect"
              aria-label="Disconnect wallet"
              onClick={() => {
                version.current++;
                setAccount(undefined);
                setPosition(undefined);
                setFlow(undefined);
              }}
            >
              <LogOut size={17} />
            </button>
          )}
        </header>
        <div className="page-body">
          <div className="title-row">
            <div>
              <h1>
                {page === "Overview"
                  ? "A little preparation.\nA clear way out."
                  : page === "Recovery"
                    ? "Your wallet.\nYour way home."
                    : page === "Releases"
                      ? "Know what\nyou are opening."
                      : "Every move,\naccounted for."}
              </h1>
              <p className="intro">
                {page === "Overview"
                  ? "Keep a verified route to your assets, even when the usual website takes a day off."
                  : page === "Recovery"
                    ? "Open the approved recovery route and withdraw directly to your wallet."
                    : page === "Releases"
                      ? "A recovery release earns your trust through its code, its policy, and its approvals."
                      : "Actual transaction receipts from X Layer testnet. Nothing here is a rehearsal."}
              </p>
            </div>
            <div className="title-stamp">
              <ShieldCheck size={24} strokeWidth={1.4} />
              <span>
                Your wallet
                <br />
                stays in charge
              </span>
            </div>
          </div>
          {(error || wrongNetwork) && (
            <div className="notice error" role="alert">
              <CircleAlert size={18} />
              <span>
                {wrongNetwork
                  ? "Your wallet is on another network. Switch to X Layer testnet to continue."
                  : error}
              </span>
              {wrongNetwork && (
                <button className="text-button" onClick={changeNetwork}>
                  Switch network
                </button>
              )}
            </div>
          )}
          {!deployment && (
            <div className="notice" role="status">
              <Vault size={18} />
              <span>
                The testnet contracts are awaiting deployment. Balances and
                actions appear once their addresses and receipts are verified.
              </span>
            </div>
          )}
          <div className="split-layout">
            <section className="primary-pane">
              {(page === "Overview" || page === "Recovery") && (
                <>
                  <section
                    className="balance-section"
                    aria-label="Vault position"
                  >
                    <div className="section-heading">
                      <span>
                        {page === "Overview"
                          ? "Your prepared position"
                          : "Available to withdraw"}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Refresh balances and release"
                        disabled={loading || !account}
                        onClick={() => {
                          void refresh();
                          void inspect();
                        }}
                      >
                        <RefreshCw
                          className={loading ? "spinning" : ""}
                          size={17}
                        />
                      </button>
                    </div>
                    <div className="balance">
                      {position
                        ? displayAmount(
                            page === "Recovery"
                              ? position.maximum
                              : position.assets,
                          )
                        : "…"}
                      <span>XUSD</span>
                    </div>
                    <div className="balance-foot">
                      {loading
                        ? "Reading your position from X Layer…"
                        : position
                          ? `Test credit in the vault. Block ${position.block}`
                          : disconnected
                            ? "Connect your wallet to see your position."
                            : "No verified position available yet."}
                    </div>
                  </section>
                  <div className="ledger-heading">
                    <h2>
                      {page === "Overview"
                        ? "Position ledger"
                        : "The supported route"}
                    </h2>
                    <span>ERC4626 vault</span>
                  </div>
                  <section className="ledger">
                    <div className="ledger-asset">
                      <div className="asset-mark">
                        <Vault size={23} />
                      </div>
                      <div>
                        <h3>ExitOS test vault</h3>
                        <p>
                          XUSD <span className="pill">Test asset</span>
                        </p>
                      </div>
                      <div className="ledger-value">
                        {position ? displayAmount(position.assets) : "…"}
                        <span>XUSD</span>
                      </div>
                    </div>
                    <div className="ledger-detail">
                      <span>
                        <ShieldCheck size={15} />
                        {release ? "Release verified" : "Release not verified"}
                      </span>
                      <button
                        className="text-button"
                        onClick={() => go("Releases")}
                      >
                        Inspect release
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="ledger-actions">
                      <button
                        className="secondary-button"
                        onClick={() => start("deposit")}
                        disabled={
                          !available ||
                          !position ||
                          position.walletBalance === 0n
                        }
                      >
                        Add test credit
                      </button>
                      <button
                        className="primary-button"
                        onClick={() => start("withdraw")}
                        disabled={
                          !available || !position || position.maximum === 0n
                        }
                      >
                        <DoorOpen size={17} />
                        Withdraw
                      </button>
                    </div>
                  </section>
                  {disconnected ? (
                    <div className="connect-note">
                      <KeyRound size={22} />
                      <div>
                        <h3>Start with the wallet you already use.</h3>
                        <p>
                          We only request your public address. Every transaction
                          needs your approval.
                        </p>
                        <button
                          className="text-button"
                          onClick={connect}
                          disabled={connecting}
                        >
                          Connect your wallet
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <section className="wallet-credit">
                      <div>
                        <h3>Wallet test credit</h3>
                        <p>
                          {position
                            ? `${displayAmount(position.walletBalance)} XUSD available`
                            : "Waiting for a verified balance"}
                        </p>
                      </div>
                      <button
                        className="secondary-button compact"
                        onClick={() => start("claim")}
                        disabled={
                          !available ||
                          !position ||
                          position.nextClaimAt >
                            BigInt(Math.floor(Date.now() / 1000))
                        }
                      >
                        Claim 1,000 XUSD
                      </button>
                      <p className="fine-print">
                        The faucet mints test credit once a day. Your wallet
                        needs{" "}
                        <a
                          href="https://web3.okx.com/xlayer/faucet/xlayerfaucet"
                          target="_blank"
                          rel="noreferrer"
                        >
                          test OKB
                        </a>{" "}
                        for gas.
                      </p>
                    </section>
                  )}
                  {page === "Recovery" && (
                    <section className="saved-route">
                      <Download size={22} />
                      <div>
                        <h3>Keep a copy close.</h3>
                        <p>
                          The downloaded kit includes a standalone verifier. It
                          reads the approved recovery code from the chain, so
                          the application server can be unavailable.
                        </p>
                        <button
                          className="secondary-button compact"
                          disabled={!release}
                          onClick={saveKit}
                        >
                          Download recovery kit
                        </button>
                      </div>
                    </section>
                  )}
                  <div className="scope-note">
                    <CircleHelp size={16} />
                    <p>
                      This route handles website outages for the test vault.
                      Contract failures and lost keys need a different response.
                    </p>
                  </div>
                </>
              )}
              {page === "Releases" && (
                <>
                  <div className="release-heading">
                    <Fingerprint size={28} />
                    <div>
                      <h2>
                        {release
                          ? `Release ${release.version}`
                          : "Awaiting a verified release"}
                      </h2>
                      <p>
                        {release
                          ? `Admitted ${new Date(release.admittedAt * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
                          : "Approval is read from the registry, never assumed."}
                      </p>
                    </div>
                    <span className={`pill ${release ? "good" : ""}`}>
                      {release ? "Approved" : "Unavailable"}
                    </span>
                  </div>
                  {releaseError && (
                    <div className="notice error" role="alert">
                      <CircleAlert size={18} />
                      <span>{releaseError}</span>
                    </div>
                  )}
                  <div className="verification-list">
                    {[
                      [
                        "Contract identity",
                        "All five runtime code hashes match the saved deployment.",
                      ],
                      [
                        "Release authority",
                        "Two of three publishers and the safety reviewer must sign.",
                      ],
                      [
                        "Circuit commitment",
                        "Eight NAND gates enforce the admission policy.",
                      ],
                      [
                        "Bundle integrity",
                        "The manifest and executable bytes match the approved root.",
                      ],
                    ].map(([title, body]) => (
                      <div key={title}>
                        {release ? (
                          <CheckCheck size={19} />
                        ) : (
                          <Fingerprint size={19} />
                        )}
                        <div>
                          <h3>{title}</h3>
                          <p>{body}</p>
                        </div>
                        <span>{release ? "Verified" : "Pending"}</span>
                      </div>
                    ))}
                  </div>
                  <button className="secondary-button" onClick={inspect}>
                    <RefreshCw size={16} />
                    Check release again
                  </button>
                  {deployment && (
                    <details className="technical-details">
                      <summary>Addresses and fingerprints</summary>
                      <dl>
                        {(
                          [
                            "vault",
                            "asset",
                            "processor",
                            "registry",
                            "store",
                          ] as const
                        ).map((key) => (
                          <div key={key}>
                            <dt>{key[0].toUpperCase() + key.slice(1)}</dt>
                            <dd>
                              <LinkOut address={deployment![key]}>
                                {deployment![key]}
                              </LinkOut>
                            </dd>
                          </div>
                        ))}
                        <div>
                          <dt>Manifest root</dt>
                          <dd className="hash">
                            {deployment.root}
                            <button
                              className="icon-button"
                              aria-label="Copy manifest root"
                              onClick={() => copy(deployment!.root, "root")}
                            >
                              {copied === "root" ? (
                                <Check size={15} />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>
                          </dd>
                        </div>
                        <div>
                          <dt>Read block</dt>
                          <dd>
                            {release ? String(release.block) : "Unavailable"}
                          </dd>
                        </div>
                      </dl>
                    </details>
                  )}
                  <div className="scope-note">
                    <CircleHelp size={16} />
                    <p>
                      The processor uses TapeOut TAP 02 semantics. This testnet
                      deployment is independently deployed and is not registered
                      in the official factory. The browser verifier is a trusted
                      bootstrap, and reads one OKX operated RPC.
                    </p>
                  </div>
                </>
              )}
              {page === "Activity" && (
                <>
                  <div className="ledger-heading">
                    <h2>Wallet activity</h2>
                    <span>{accountRecords.length} recorded</span>
                  </div>
                  {!account || !accountRecords.length ? (
                    <Empty
                      icon={Activity}
                      title={
                        account
                          ? "A quiet ledger is a good start."
                          : "Your wallet tells the story."
                      }
                    >
                      {account
                        ? "Your claims, deposits and withdrawals will appear here after you send them."
                        : "Connect your wallet to see transactions recorded by this browser."}
                    </Empty>
                  ) : (
                    <div className="activity-list">
                      {accountRecords.map((item) => (
                        <a
                          className="activity-row"
                          href={explorer(item.hash)}
                          target="_blank"
                          rel="noreferrer"
                          key={item.hash}
                        >
                          <span className="activity-icon">
                            {item.status === "pending" ? (
                              <LoaderCircle size={20} />
                            ) : item.status === "reverted" ? (
                              <CircleAlert size={20} />
                            ) : (
                              <Check size={20} />
                            )}
                          </span>
                          <div>
                            <h3>{actionTitle[item.action]}</h3>
                            <p>
                              {new Date(item.at).toLocaleString()} ·{" "}
                              {shortAddress(item.hash)}
                            </p>
                          </div>
                          <div className="activity-amount">
                            {item.amount} XUSD
                            <span>
                              {item.status === "included"
                                ? "Included on L2"
                                : item.status === "reverted"
                                  ? "Reverted"
                                  : "Pending"}
                            </span>
                          </div>
                          <ExternalLink size={15} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="scope-note">
                    <CircleHelp size={16} />
                    <p>
                      History is stored in this browser and checked against
                      actual receipts. L2 inclusion is shown separately from
                      Ethereum settlement.
                    </p>
                  </div>
                </>
              )}
            </section>
            <aside className="route-pane" aria-label="Recovery route status">
              <div className="route-top">
                <span className="status-dot" />
                <span>
                  {release ? "Verified route" : "Route awaiting verification"}
                </span>
                <ShieldCheck size={17} />
              </div>
              <div className={`aperture ${release ? "ready" : ""}`}>
                <div className="aperture-frame">
                  <div className="aperture-inner">
                    <Mark small />
                    <span className="door-line" />
                    <h2>
                      A way back.
                      <br />
                      Already thought
                      <br />
                      through.
                    </h2>
                    <p>
                      From the vault.
                      <br />
                      Straight to your wallet.
                    </p>
                    <div className="door-base">
                      <span />
                      <DoorOpen size={25} strokeWidth={1.3} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="route-caption">
                <span className="caption-icon">
                  <KeyRound size={18} />
                </span>
                <p>
                  We prepare the route.
                  <br />
                  <strong>You hold the keys.</strong>
                </p>
              </div>
              <div className="route-footer">
                <div>
                  <span>Recovery kit</span>
                  <strong>
                    {kitReady && release
                      ? "Saved in this browser"
                      : release
                        ? "Not saved yet"
                        : "Awaiting approved release"}
                  </strong>
                </div>
                <button
                  className="icon-button"
                  aria-label="Open recovery workspace"
                  onClick={() => go("Recovery")}
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
              {page === "Recovery" && (
                <a
                  className={`route-link ${!release ? "disabled" : ""}`}
                  href={release ? "/recovery-kit.html" : undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!release}
                >
                  Open standalone route
                  <ExternalLink size={15} />
                </a>
              )}
            </aside>
          </div>
          <footer className="page-footer">
            <span>
              <Mark small />A calmer way home.
            </span>
            <span>
              Built on X Layer <span className="footer-separator" />
              Testnet 1952
            </span>
          </footer>
        </div>
      </main>
      <dialog
        ref={dialog}
        className="transaction-dialog"
        aria-labelledby="dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        onClose={() => {
          if (!busy) setFlow(undefined);
        }}
      >
        {flow && (
          <>
            <div className="dialog-top">
              <Mark small />
              <span>X Layer testnet</span>
              <button
                className="icon-button"
                aria-label="Close transaction"
                onClick={close}
                disabled={!!busy}
              >
                <X size={21} />
              </button>
            </div>
            <div className="dialog-content">
              <h2 id="dialog-title">
                {flow.step === "done"
                  ? flow.action === "withdraw"
                    ? "Home, safely."
                    : flow.action === "approve"
                      ? "Allowance confirmed."
                      : "That is on the chain."
                  : actionTitle[flow.action]}
              </h2>
              <p className="dialog-intro">
                {flow.step === "amount"
                  ? "No rush. Choose an amount, then check the details."
                  : flow.step === "done"
                    ? "The transaction was included on X Layer. Check your position when you return."
                    : flow.action === "approve"
                      ? "Allow the vault to transfer exactly this amount. This does not deposit it yet."
                      : "Your wallet signs the request. The contract handles the transfer."}
              </p>
              {flow.step === "amount" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void review();
                  }}
                >
                  <label htmlFor="amount">Amount in XUSD</label>
                  <div className="amount-input">
                    <input
                      id="amount"
                      autoFocus
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={flow.amount}
                      aria-describedby="amount-help amount-error"
                      aria-invalid={!!flow.error}
                      onChange={(e) =>
                        setFlow({
                          ...flow,
                          amount: e.target.value,
                          error: undefined,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFlow({
                          ...flow,
                          amount: formatUnits(
                            flow.action === "withdraw"
                              ? (position?.maximum ?? 0n)
                              : (position?.walletBalance ?? 0n),
                            18,
                          ),
                          error: undefined,
                        })
                      }
                    >
                      Max
                    </button>
                  </div>
                  <p className="input-help" id="amount-help">
                    Available:{" "}
                    {displayAmount(
                      flow.action === "withdraw"
                        ? (position?.maximum ?? 0n)
                        : (position?.walletBalance ?? 0n),
                    )}{" "}
                    XUSD. Test credit has no monetary value.
                  </p>
                  {flow.error && (
                    <p className="form-error" id="amount-error" role="alert">
                      {flow.error}
                    </p>
                  )}
                  <button className="primary-button full" type="submit">
                    Review{" "}
                    {flow.action === "withdraw" ? "withdrawal" : "deposit"}
                    <ChevronRight size={17} />
                  </button>
                </form>
              )}
              {flow.step === "review" && (
                <>
                  <dl className="review-list">
                    <div>
                      <dt>
                        {flow.action === "approve" ? "Allowance" : "Amount"}
                      </dt>
                      <dd>{flow.amount} XUSD</dd>
                    </div>
                    <div>
                      <dt>Wallet</dt>
                      <dd>
                        {account ? shortAddress(account) : "Disconnected"}
                      </dd>
                    </div>
                    <div>
                      <dt>Contract</dt>
                      <dd>
                        {deployment ? (
                          <LinkOut
                            address={
                              flow.action === "claim" ||
                              flow.action === "approve"
                                ? deployment.asset
                                : deployment.vault
                            }
                          >
                            {shortAddress(
                              flow.action === "claim" ||
                                flow.action === "approve"
                                ? deployment.asset
                                : deployment.vault,
                            )}
                          </LinkOut>
                        ) : (
                          "Unavailable"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Network</dt>
                      <dd>X Layer testnet</dd>
                    </div>
                    <div>
                      <dt>Estimated gas</dt>
                      <dd>
                        {flow.fee
                          ? `${displayAmount(flow.fee, 18, 8)} OKB`
                          : "Checked before signing"}
                      </dd>
                    </div>
                  </dl>
                  <div className="review-assurance">
                    <ShieldCheck size={18} />
                    <span>
                      Release and balances are checked again before your wallet
                      opens. This testnet route uses one RPC operator.
                    </span>
                  </div>
                  <button
                    className="primary-button full"
                    onClick={confirm}
                    disabled={!available}
                  >
                    Confirm in wallet
                    <Wallet size={17} />
                  </button>
                  {flow.action !== "claim" && (
                    <button
                      className="text-button full"
                      onClick={() =>
                        setFlow({
                          ...flow,
                          action:
                            flow.action === "approve" ? "deposit" : flow.action,
                          step: "amount",
                        })
                      }
                    >
                      Change amount
                    </button>
                  )}
                </>
              )}
              {busy && (
                <div className="transaction-progress">
                  <LoaderCircle className="spinning" size={30} />
                  <h3>
                    {flow.step === "checking"
                      ? "Checking the route…"
                      : flow.step === "wallet"
                        ? "Ready in your wallet."
                        : "Transaction sent."}
                  </h3>
                  <p>
                    {flow.step === "checking"
                      ? "Reading fresh balances, release identity and gas."
                      : flow.step === "wallet"
                        ? "Check the request there, then approve or decline."
                        : "Waiting for an actual receipt from X Layer."}
                  </p>
                </div>
              )}
              {flow.step === "done" && (
                <>
                  <div className="success-mark">
                    <Check size={35} />
                  </div>
                  <p className="done-amount">
                    {flow.amount} <span>XUSD</span>
                  </p>
                  <button
                    className="primary-button full"
                    onClick={() =>
                      flow.action === "approve"
                        ? setFlow({
                            ...flow,
                            action: "deposit",
                            step: "amount",
                            hash: undefined,
                          })
                        : setFlow(undefined)
                    }
                  >
                    {flow.action === "approve"
                      ? "Continue to deposit"
                      : "Back to your position"}
                  </button>
                </>
              )}
              {flow.step === "error" && (
                <>
                  <div className="notice error" role="alert">
                    <CircleAlert size={19} />
                    <span>{flow.error}</span>
                  </div>
                  <button
                    className="secondary-button full"
                    onClick={() =>
                      flow.hash
                        ? (setFlow(undefined), go("Activity"))
                        : setFlow({
                            ...flow,
                            step: flow.action === "claim" ? "review" : "amount",
                            error: undefined,
                          })
                    }
                  >
                    {flow.hash
                      ? "View transaction in Activity"
                      : "Review again"}
                  </button>
                </>
              )}
              {flow.hash && (
                <a
                  className="receipt-link"
                  href={explorer(flow.hash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View actual transaction
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
