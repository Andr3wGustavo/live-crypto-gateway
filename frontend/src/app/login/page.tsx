"use client";

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { SiweMessage } from 'siwe';

export default function LoginPage() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<'' | 'fetching_nonce' | 'signing' | 'verifying' | 'success' | 'error'>('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    if (!isConnected || !address) {
      return open();
    }

    try {
      setStatus('fetching_nonce');
      setErrorMsg('');

      // 1. Get nonce from backend
      const nonceRes = await fetch('http://localhost:8080/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
      const nonce = await nonceRes.text();

      setStatus('signing');

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the Live Crypto app.',
        uri: window.location.origin,
        version: '1',
        chainId: 1, // You could get this from useChainId()
        nonce,
      });

      const preparedMessage = message.prepareMessage();

      // 3. Sign message
      const signature = await signMessageAsync({ message: preparedMessage });

      setStatus('verifying');

      // 4. Verify signature with backend
      const verifyRes = await fetch('http://localhost:8080/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: preparedMessage, signature }),
      });

      if (!verifyRes.ok) throw new Error('Verification failed');

      const data = await verifyRes.json();
      
      // Store token in localStorage (in production, HttpOnly cookies are better)
      localStorage.setItem('jwt', data.token);
      
      setStatus('success');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred during sign-in.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="border border-primary p-8 max-w-md w-full bg-black shadow-[0_0_15px_rgba(0,255,0,0.2)]">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-6">&gt; STREAMER LOGIN_</h1>
        
        <div className="space-y-6">
          {!isConnected ? (
            <button 
              onClick={() => open()}
              className="w-full py-3 border border-primary hover:bg-primary/10 transition-colors uppercase font-bold tracking-wider"
            >
              [ CONNECT WALLET ]
            </button>
          ) : (
            <div className="text-center">
              <p className="mb-4 opacity-80 text-sm">Connected: <span className="font-mono text-primary">{address}</span></p>
              
              <button 
                onClick={handleSignIn}
                disabled={status !== '' && status !== 'error'}
                className="w-full py-3 bg-primary text-black hover:bg-primary/80 transition-colors uppercase font-bold tracking-wider disabled:opacity-50"
              >
                {status === '' ? '[ SIGN IN WITH ETHEREUM ]' : 
                 status === 'fetching_nonce' ? '[ FETCHING NONCE... ]' :
                 status === 'signing' ? '[ AWAITING SIGNATURE... ]' :
                 status === 'verifying' ? '[ VERIFYING... ]' :
                 status === 'success' ? '[ SUCCESS ]' : '[ RETRY SIGN IN ]'}
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 border border-red-500 text-red-500 text-sm font-mono text-center">
              ERROR: {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
