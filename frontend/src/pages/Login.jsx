import { motion } from 'framer-motion';
import { LoginPanel } from '@bedrock_org/passport';
import '@bedrock_org/passport/dist/style.css';

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1A] via-[#1a1f2e] to-[#0A0F1A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <LoginPanel
          // Content options
          title="Sign in to"
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
          titleClass="text-xl font-bold text-white"
          logoClass="ml-2 md:h-8 h-6"
          panelClass="container p-2 md:p-8 rounded-2xl max-w-[480px] bg-[#1a1f2e] border border-gray-800"
          buttonClass="hover:border-orange-500"
          separatorTextClass="bg-[#1a1f2e] text-gray-500"
          separatorClass="bg-gray-800"
          linkRowClass="justify-center"
          headerClass="justify-center"
        />

        {/* Features */}
        <div className="mt-8 space-y-3 bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400">🎯</span>
            </div>
            <span className="text-sm">Multiple quiz categories</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400">🏆</span>
            </div>
            <span className="text-sm">Weekly league competitions</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400">⚡</span>
            </div>
            <span className="text-sm">Real-time challenges</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Built for Orange Agent Jam Competition
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
