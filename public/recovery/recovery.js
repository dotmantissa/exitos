export function mount(root, context) {
  const mark =
    '<svg viewBox="0 0 48 48" width="38" height="38" aria-label="ExitOS"><rect width="48" height="48" rx="12" fill="#35482D"/><path d="M13 37V23a11 11 0 0 1 22 0v14M19 37V23a5 5 0 0 1 10 0v14" fill="none" stroke="#F6F4EB" stroke-width="3.2"/><path d="M29 37h9" stroke="#DFE8CA" stroke-width="3.2"/></svg>';
  const style = document.createElement("style");
  style.textContent = `:root{--bg:#F6F4EB;--surface:#FCFBF6;--text:#263323;--muted:#667160;--line:#DADCCF;--action:#35482D;--on:#FAFAF1;--tint:#DFE8CA;color-scheme:light} :root[data-theme=dark]{--bg:#121810;--surface:#1C2519;--text:#F1F1DF;--muted:#A5AF9C;--line:#35412F;--action:#CADBA4;--on:#17210F;--tint:#2E3F23;color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:'IBM Plex Sans',sans-serif;font-size:15px}main{max-width:560px;margin:45px auto;padding:25px}header{display:flex;align-items:center;gap:12px}header strong{font-size:24px;letter-spacing:-1px}header button{margin-left:auto;border:1px solid var(--line);font-size:12px;padding:9px 12px;background:transparent;color:var(--text)}h1{font:400 39px/1.15 'Roboto Slab',serif;letter-spacing:-1.2px;margin:40px 0 17px}p{color:var(--muted);font-size:13px;line-height:1.7}section{border-top:1px solid var(--line);margin-top:26px;padding-top:24px}label{display:block;margin-bottom:9px;font-size:13px}input{width:100%;padding:16px;background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:10px;font:400 26px 'IBM Plex Sans',sans-serif}button{cursor:pointer;font:500 14px 'IBM Plex Sans',sans-serif;border:0;border-radius:9px;padding:14px 20px;background:var(--action);color:var(--on)}button:disabled{opacity:.45;cursor:not-allowed}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--action);outline-offset:4px}.full{width:100%;margin-top:18px}.secondary{background:transparent;color:var(--text);border:1px solid var(--line);margin-top:10px}.balance{font-size:38px;font-variant-numeric:tabular-nums;letter-spacing:-1px;margin:10px 0}.balance span{font-size:15px;letter-spacing:0;color:var(--muted)}.badge{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);margin-top:28px}.dot{width:6px;height:6px;background:var(--action);border-radius:50%}dl{font-size:13px}dl>div{display:flex;justify-content:space-between;gap:20px;padding:14px 0;border-bottom:1px solid var(--line)}dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere;text-align:right}.message{background:var(--tint);padding:13px 16px;border-radius:8px;font-size:13px;line-height:1.7;margin:20px 0;overflow-wrap:anywhere}.receipt{display:block;color:var(--action);margin-top:18px;font-size:12px;overflow-wrap:anywhere}footer{border-top:1px solid var(--line);margin-top:35px;padding-top:17px}footer p{font-size:11px}#review[hidden],#position[hidden],#receipt[hidden]{display:none}@media(max-width:540px){main{margin:10px auto;padding:22px}h1{font-size:33px}}`;
  document.head.append(style);
  root.innerHTML = `<main><header>${mark}<strong>ExitOS</strong><button id="theme" aria-label="Change color theme">Change theme</button></header><h1>Withdraw without<br/>the usual website.</h1><p>This is your saved backup withdrawal page. It reads approved code from X Layer, then lets your wallet withdraw XUSD directly from the test vault.</p><div class="badge"><span class="dot"></span>Release ${context.version} verified on X Layer testnet</div><section><button id="connect" class="full">Connect wallet</button><div id="position" hidden><p id="account"></p><div class="balance"><b id="balance"></b> <span>XUSD you can withdraw</span></div><label for="amount">Amount to withdraw</label><input id="amount" inputmode="decimal" autocomplete="off" placeholder="0.00"/><button id="max" class="secondary">Use full available amount</button><button id="continue" class="full">Review withdrawal</button></div><div id="review" hidden><h2>Review your withdrawal.</h2><dl><div><dt>Amount</dt><dd id="review-amount"></dd></div><div><dt>Destination</dt><dd id="review-wallet"></dd></div><div><dt>Network</dt><dd>X Layer testnet</dd></div></dl><p>Your XUSD goes from the vault to the wallet shown above. These test tokens have no monetary value. The approved code, your account and available balance are checked again before signing.</p><button id="confirm" class="full">Confirm in wallet</button><button id="back" class="secondary full">Change amount</button></div><div id="message" class="message" role="status" hidden></div><a id="receipt" class="receipt" target="_blank" rel="noreferrer" hidden>View actual transaction</a></section><footer><p>TAP 02 compatible testnet processor. Independently deployed. One OKX operated RPC. The saved verifier is trusted software. This route covers website outages, while the chain and vault remain available.</p></footer></main>`;
  const $ = (id) => root.querySelector("#" + id);
  const say = (text) => {
    $("message").hidden = false;
    $("message").textContent = text;
  };
  let who,
    available,
    entered,
    busy = false,
    reviewAccount;
  $("theme").onclick = () => {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("exitos.theme", next);
    } catch {}
  };
  async function refresh() {
    const value = await context.position(who);
    available = value.maximum;
    $("balance").textContent = context.format(available);
  }
  $("connect").onclick = async () => {
    if (busy) return;
    busy = true;
    $("connect").disabled = true;
    try {
      who = await context.connect();
      await refresh();
      $("account").textContent = "Connected: " + who;
      $("position").hidden = false;
      $("connect").hidden = true;
      $("message").hidden = true;
    } catch (error) {
      say(context.error(error));
    } finally {
      busy = false;
      $("connect").disabled = false;
    }
  };
  $("max").onclick = () => {
    $("amount").value = context.units(available);
  };
  $("continue").onclick = () => {
    try {
      entered = context.parse($("amount").value, available);
      reviewAccount = who;
      $("review-amount").textContent = context.units(entered) + " XUSD";
      $("review-wallet").textContent = who;
      $("position").hidden = true;
      $("review").hidden = false;
      $("message").hidden = true;
      $("confirm").focus();
    } catch (error) {
      say(context.error(error));
    }
  };
  $("back").onclick = () => {
    $("review").hidden = true;
    $("position").hidden = false;
    $("amount").focus();
  };
  $("confirm").onclick = async () => {
    if (busy) return;
    busy = true;
    $("confirm").disabled = true;
    $("back").disabled = true;
    $("receipt").hidden = true;
    try {
      say("Checking the approved route and your balance…");
      await context.withdraw(entered, reviewAccount, (stage, hash) => {
        say(
          stage === "wallet"
            ? "Check the request in your wallet."
            : stage === "pending"
              ? "Transaction sent. Waiting for the actual receipt."
              : stage,
        );
        if (hash) {
          $("receipt").href = context.explorer(hash);
          $("receipt").hidden = false;
        }
      });
      say("Withdrawal confirmed. Your XUSD is back in your wallet.");
      await refresh();
      $("review").hidden = true;
      $("position").hidden = false;
      $("amount").value = "";
    } catch (error) {
      say(context.error(error));
    } finally {
      busy = false;
      $("confirm").disabled = false;
      $("back").disabled = false;
    }
  };
}
