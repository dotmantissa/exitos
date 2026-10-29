import {
  createWalletClient,
  custom,
  type EIP1193Provider,
  type Address,
} from "viem";
import { chain } from "./config";
export type InjectedProvider = EIP1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
};
declare global {
  interface Window {
    ethereum?: InjectedProvider;
    okxwallet?: InjectedProvider;
  }
}
export function getProvider() {
  return window.okxwallet ?? window.ethereum;
}
export function wallet(provider: InjectedProvider) {
  return createWalletClient({ chain, transport: custom(provider) });
}
export async function connectWallet(): Promise<{
  account: Address;
  chainId: number;
  provider: InjectedProvider;
}> {
  const provider = getProvider();
  if (!provider)
    throw new Error(
      "Open ExitOS in your wallet browser, or install a browser wallet first.",
    );
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as Address[];
  if (!accounts[0]) throw new Error("Your wallet did not share an account.");
  const id = (await provider.request({ method: "eth_chainId" })) as string;
  return { account: accounts[0], chainId: Number(id), provider };
}
export async function switchNetwork(provider: InjectedProvider) {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a0" }],
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x7a0",
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls.default.http,
          blockExplorerUrls: [chain.blockExplorers.default.url],
        },
      ],
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x7a0" }],
    });
  }
}
export function humanError(error: unknown): string {
  const value = error as {
    code?: number;
    shortMessage?: string;
    message?: string;
    cause?: { code?: number };
  };
  if (
    value.code === 4001 ||
    value.cause?.code === 4001 ||
    /rejected|denied/i.test(value.shortMessage ?? value.message ?? "")
  )
    return "You declined the request. Nothing was sent.";
  return (
    value.shortMessage ??
    value.message ??
    "Something interrupted the request. Please try again."
  );
}
