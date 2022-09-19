import '../styles/globals.css'
import { ThirdwebProvider } from '@3rdweb/react'
import { ChakraProvider } from '@chakra-ui/react'

function MyApp({ Component, pageProps }) {
  // Put the ethereum chain ids of the chains you want to support
  const supportedChainIds = [1, 3, 5, 42, 80001]

  // Ethereun Mainnet - 1 (ETH)

  // Goerli Test Network - 5 (ETH)
  // Kovan Test Network -  42 (ETH)
  // Polygon Mumbai Test Network - 80001 (MATIC)

  /**
   * Include the connectors you want to support
   * injected - MetaMask
   * magic - Magic Link
   * walletconnect - Wallet Connect
   * walletlink - Coinbase Wallet
   */
  const connectors = {
    injected: {},
    // magic: {
    //   apiKey: 'pk_...', // Your magic api key
    //   chainId: 1, // The chain ID you want to allow on magic
    // },
    // walletconnect: {},
  }

  return (
    <ThirdwebProvider
      connectors={connectors}
      supportedChainIds={supportedChainIds}
    >
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </ThirdwebProvider>
  )
}

export default MyApp
