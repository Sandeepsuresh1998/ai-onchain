import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, {useState, useEffect} from 'react';
import Web3Modal from "web3modal";
import {ethers} from "ethers";

const providerOptions = {
    
}


export default function Home() {
  
  const [web3Provider, setWeb3Provider] = useState(null);

  async function connectWallet() {
    try {
      let web3modal = new Web3Modal(
        {
          cacheProvider: false,
          providerOptions, 
        }
      );
      const web3ModalInstance = await web3modal.connect();
      const web3ModalProvider = new ethers.providers.Web3Provider(web3ModalInstance);
      console.log(web3ModalProvider);
      if (web3ModalProvider) {
        setWeb3Provider(web3ModalProvider);
      }
    } catch(error) {
      console.log(error);
    }
  }
  return (
    <div className={styles.container}>

      <main className={styles.main}>
        <Head>
          <h1 className={styles.title}>
            Mechanical Imagination
          </h1>
        </Head>
        <div>
          {
            web3Provider == null ? (
              <button onClick={connectWallet}> Connect Wallet </button>
            ) : (
              <p>Address : {web3Provider.provider.selectedAddress}</p>
            )
          }
        </div>
      </main>
    </div>
  )
}
