import React from 'react';
import { LoginPanel } from "@bedrock_org/passport";
import "@bedrock_org/passport/dist/style.css";

const Login = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoginPanel
        // Content options
        title="Sign in to Quizard"
        logo="https://irp.cdn-website.com/e81c109a/dms3rep/multi/orange-web3-logo-v2a-20241018.svg"
        logoAlt="Orange Web3"
        walletButtonText="Connect Wallet"
        showConnectWallet={true}
        separatorText="OR"

        // Feature toggles
        features={{
          enableWalletConnect: true,
          enableAppleLogin: true,
          enableGoogleLogin: true,
          enableEmailLogin: true,
        }}

        // Style options
        titleClass="text-xl font-bold"
        logoClass="ml-2 md:h-8 h-6"
        panelClass="container p-2 md:p-8 rounded-2xl max-w-[480px]"
        buttonClass="hover:border-orange-500"
        separatorTextClass="bg-orange-900 text-gray-500"
        separatorClass="bg-orange-900"
        linkRowClass="justify-center"
        headerClass="justify-center"
      />
    </div>
  );
};

export default Login;
