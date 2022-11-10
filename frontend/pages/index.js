import React, { useState, useEffect, useCallback } from "react";
import Particles from "react-particles";
import { loadFull } from "tsparticles";
import { DefaultService } from "../backend-client";
import { OpenAPI } from "../backend-client";
import {
  Typography,
  ThemeProvider,
  createTheme,
  Box,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import text_to_hash from "../util/text_to_hash";
import contract from "../util/SyntheticDreams.json";
import { Magic } from "magic-sdk"
import { ConnectExtension } from "@magic-ext/connect";
import { ethers } from "ethers";
import { Configuration, OpenAIApi } from "openai";
import { wallet } from "@rainbow-me/rainbowkit";

const darkTheme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: "#6a1b9a",
    },
    mode: "dark",
  },
});

OpenAPI.BASE = process.env.URL;
// OpenAPI.BASE = "http://localhost:8000";

export default function Home() {
  const [alert, setAlert] = useState({
    msg: "",
    type: "success",
  });
  const [imageUrl, setImageUrl] = useState(null);
  const [isImageLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState(null);
  const [address, setAddress ] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [magic, setMagic] = useState(null);
  const [provider, setProvider] = useState(null);
  const [openai, setOpenAI] = useState(null);
  const [walletType, setWalletType] = useState(null);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          console.log("Address changed")
          setAddress(accounts[0]);
        } else {
          setAddress(null);
        }
      });
    }
  }

  useEffect(() => {

    // Set Magic Instance
    const magicInstance = new Magic(process.env.MAGIC_PK_LIVE, { 
      network: 'goerli',
      extensions: [new ConnectExtension()]
    });
    const providerInstance = new ethers.providers.Web3Provider(magicInstance.rpcProvider);

    // Create Dalle2 Instance
    const configuration = new Configuration({
      apiKey: process.env.DALLE_SK,
    });
    const openai = new OpenAIApi(configuration);
  
    setMagic(magicInstance)
    setProvider(providerInstance)
    setOpenAI(openai)

    addWalletListener()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault();
    setImageUrl(null);
    const val = event.target.elements.prompt.value.trim();
    console.log("Going to generate image with: " + val)
    if (!val) return;
    setTextInput(val);

    try {
      setIsLoading(true);
      const response = await openai.createImage({
        prompt: val,
        n: 1,
        size: "1024x1024",
        user: address,
      });
      const image_url = response.data.data[0].url;
      setImageUrl(image_url);
      setAlert({
        msg: "dreaming complete",
      });
    } catch (e) {
      console.log(e);
      setAlert({
        msg: "Bug in the dream code.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const create_metadata = async () => {
    const baseIpfsUrl = "https://gateway.pinata.cloud/ipfs/";
    // Read-Only Contract instance
    const contractInstance = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contract.abi,
      provider,
    )
    // Get IPFS link for the Image
    const imageRes = await DefaultService.uploadImageToIpfsUploadImagePost({
      image_uri: imageUrl,
    });
    const ipfsImageUrl = imageRes.ipfs_uri.replace("ipfs://", baseIpfsUrl);

    // Create hashed text for inputted text for smart contract
    const hashedText = text_to_hash(textInput);

    // Grab next token id
    let tokenId = await contractInstance.getCurrentToken()
    const newTokenId = tokenId.toNumber() + 1 

    // Contruct metadata with next token id
    var metadata = {
      name: `Dream #${newTokenId}`,
      description: textInput,
      image: ipfsImageUrl,
    };

    // Call api to pin metadata
    const metadataRes =
      await DefaultService.uploadMetadataToIpfsUploadMetadataPost({
        metadata: metadata,
      });
    const nft_metadata_uri = baseIpfsUrl + metadataRes.ipfs_uri
    
    return {nft_metadata_uri, hashedText}
  }

  const byteSize = str => new Blob([str]).size;

  const handleMint = async (event) => {
    event.preventDefault();
    // TODO: Create check that texted input is not taken
    // TODO: Alternative, let tx fail at the contract level (bad UX, less work)

    const walletInfo = await magic.connect.getWalletInfo();
    console.log("Wallet Type", walletInfo.walletType)
    
    try {
      if (!isConnected) {
        setAlert({
          msg: "Please connect wallet!",
          type: "error"
        });
        return
      }

      const {nft_metadata_uri, hashedText} = await create_metadata();
      const signer = await provider.getSigner();
      const addr = await signer.getAddress()
      // Read/Write Contract instance
      const contractInstance = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contract.abi,
        signer,
      )
      const final_hashed_text = hashedText.valueOf()
      console.log("Type of hashed text", typeof(final_hashed_text))
      // Gas estimations
      const mint_price = ethers.utils.parseEther('0.05')
      let overrideOptions = {
        value: ethers.utils.parseEther("0.05"),
      }
      if (walletInfo.walletType != "magic") {

        // Use alchemy provider directly, magic seems to fail
        // TODO: Change network based on prod vs int
        const alchemyProvider = new ethers.providers.AlchemyProvider("goerli", process.env.API_KEY)
        const provider_contract = new ethers.Contract(
          process.env.CONTRACT_ADDRESS,
          contract.abi,
          alchemyProvider,
        )
        // Manually calculate gas and pass into wallet
        console.log("Starting gas estimation flow for non MC wallets")
        const mintGasFees = await provider_contract.estimateGas.mintToken(
            addr,
            nft_metadata_uri,
            final_hashed_text,
            {
              value: mint_price
            },
        );
        
        console.log("Mint Gas Fess", mintGasFees)
        overrideOptions = {
          gasLimit: mintGasFees,
          value: ethers.utils.parseEther("0.05"),
        }
      }
      const tx = await contractInstance.mintToken(addr,nft_metadata_uri,final_hashed_text, overrideOptions);
      const receipt = await tx.wait()
      console.log(receipt)
      setAlert({
        msg: "Minted!",
      });
    } catch (error) {
      console.log(error)
    }
  }

  const login = async () => {
    provider.listAccounts().then(accounts => {
      setAddress(accounts[0])
      console.log("Connected Account",accounts[0])
      setIsConnected(true);
      magic.connect.getWalletInfo().then(walletInfo => {
        console.log("Setting wallet type: " + walletInfo.walletType)
        setWalletType(walletInfo.walletType)
      });
    });
  };

  const showWallet = () => {
    magic.connect.showWallet().catch((e) => {
      console.log("Error showing wallet", e);
    });
  }

  const disconnectWallet = async () => {
    await magic.connect.disconnect().catch((e) => {
      console.log(e)
    });  
    setIsConnected(false)
    setAddress(null)
  }
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <TsParticles />
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={!!alert.msg}
        onClose={() => setAlert({})}
      >
        <Alert severity={alert.type || "success"} sx={{ width: "100%" }}>
          {alert.msg}
        </Alert>
      </Snackbar>
      <div
        style={{
          height: "100vh",
          width: "100vw",
        }}
      >
        <AppContainer>
          <AppTitle>Synthetic Dreams</AppTitle>
          <Paper elevation={2} sx={{ my: 2, overflow: "hidden" }}>
            {!isImageLoading && !imageUrl && (
              <div></div>
            )}
            
            {isImageLoading && (
              <Box
                minHeight="30vh"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
              <CircularProgress />
              </Box>
            )}

            {!isImageLoading && imageUrl && (
              <Box
                minHeight="30vh"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  width="100%"
                  src={imageUrl}
                  alt={"stable diffusion image."}
                />              
              </Box>
            )}

          </Paper>
          <Box
            as="form"
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
            sx={{
              background: "#000",
            }}
          >
            <TextField
              name="prompt"
              size="small"
              label="Image Prompt"
              placeholder="a golden retriever in the style of a cave painting"
            />
            <Box mb={2} />
            <Button type="submit" variant="contained">
              generate
            </Button>
            <Box mb={2} />
            {imageUrl && (
              <>
                <Button onClick={handleMint} variant="outlined">
                  Mint
                </Button>
                <Box mb={2} />
              </>
            )}
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{
                "& div": {
                  width: "100%",
                },
                "& button": {
                  width: "100%",
                  textAlign: "center !important",
                },
              }}
            >
              {!isConnected && (
                <Button onClick={login} variant="outlined">
                  Connect Wallet
                </Button> 
              )}

              {isConnected && (
                <div>
                  {walletType == "magic" && (
                    <Button onClick={showWallet} variant="outlined">
                      Show Wallet
                    </Button>
                  )}
                  

                  <Button onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
              )}
              
            </Box>
          </Box>
        </AppContainer>
      </div>
    </ThemeProvider>
  );
}

const AppTitle = ({ children }) => (
  <Typography
    textTransform="uppercase"
    variant="h3"
    sx={{
      letterSpacing: ["2px", "8px"],
      textShadow: "-3px -3px 0px #fff4, 4px 4px 0px #6a1b9af0",
    }}
  >
    {children}
  </Typography>
);

const AppContainer = ({ children }) => (
  <Box
    padding={[2, 6]}
    justifyContent="center"
    alignItems="center"
    textAlign="center"
    // sx={{
    //   display: ["block", "flex"],
    //   flexDirection: ["column"],
    // }}
    // height="100%"
    maxWidth="600px"
    mx="auto"
  >
    {children}
  </Box>
);

const TsParticles = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        zIndex: "-1",
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: {
            color: {
              value: "#000",
            },
          },
          fpsLimit: 120,
          interactivity: {
            detect_on: "window",
            events: {
              onHover: {
                enable: true,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              repulse: {
                distance: 200,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: "#fff4",
            },
            links: {
              color: "#6a1b9a40",
              distance: 150,
              enable: true,
              opacity: 0.5,
              width: 1,
            },
            move: {
              directions: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 3,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 5 },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
};
