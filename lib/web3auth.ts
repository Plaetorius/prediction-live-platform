"use client"

import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import { type Web3AuthContextConfig } from "@web3auth/modal/react";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

if (!clientId) {
  throw new Error('NEXT_PUBLIC_WEB3AUTH_CLIENT_ID environment variable is required');
}

export const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    walletServicesConfig: {
      modalZIndex: 99999,
      enableKeyExport: false,
      whiteLabel: {
        showWidgetButton: true,
        buttonPosition: "bottom-right",
        hideNftDisplay: false,
        hideTokenDisplay: false,
        hideTransfers: false,
        hideTopup: false,
        hideReceive: false,
        hideSwap: false,
        hideShowAllTokens: false,
        hideWalletConnect: false,
        defaultPortfolio: "token",
      },
    },
  }
};
