import React, {useState, useEffect} from 'react';
import { server } from '../config';
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
import {DefaultService} from "../backend-client";
import {OpenAPI} from "../backend-client";

OpenAPI.BASE = 'http://localhost:8000';

class PromptForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {value: '', imageUrl: ''};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        DefaultService.stableDiffusionImg2TxtPost({prompt: this.state.value})
            .then((result) =>
                this.setState({imageUrl: result.image_uri})
            )
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Enter Prompt:
                        <input type="text" value={this.state.value} onChange={this.handleChange} />
                    </label>
                    <br/>
                    <input type="submit" value="Generate Image" />
                </form>
                <img src={this.state.imageUrl} alt={"stable diffusion image."}/>
            </div>
        );
    }
}

export default function Home() {

    const TOKEN_URI = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7";

    const { address, isConnected } = useAccount()
    const { connect } = useConnect({
      connector: new InjectedConnector(),
    })
    const { disconnect } = useDisconnect()


    const mintNFT = async (address, tokenURI, hash) => {
      const response = await fetch(`${server}/api/mint`, {
        method: 'POST',
        body: JSON.stringify({
          address,
          tokenURI,
          hash,
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      console.log(data)
  }

  return (
    <div class="bg-slate-800 flex flex-col h-screen justify-around">
        <div id="header-container" class="flex flex-row justify-center">
          <div id="header" class="flex flex-col align-around">
            <h1 class="decoration-white text-4xl">
              Mechanical Imagination
            </h1>
          <PromptForm/>
          </div>
        </div>
        
        <div class="flex flex-row justify-center">
          <ConnectButton />
        </div>

        <div>
          <button onClick={() => mintNFT(address, TOKEN_URI, "placeholder hash")}>Mint</button>
        </div>
    </div>
  )
}

