import React, {useState, useEffect} from 'react';
import { 
  useAccount,
  useConnect,
  useDisconnect,
  useContractRead,
  useContractWrite,
} from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from '@rainbow-me/rainbowkit';



export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()

  return (
    <div class="bg-slate-800 flex flex-col h-screen justify-around">
        <div id="header-container" class="flex flex-row justify-center">
          <div id="header" class="flex flex-col align-around">
            <h1 class="decoration-white text-4xl">
              Mechanical Imagination
            </h1>
            <input>
          
            </input>
          </div>
        </div>
        
          
        <div class="flex flex-row justify-center">
          <ConnectButton />
        </div>
    </div>
  )
}
