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

const darkTheme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: "#6a1b9a",
    },
    mode: "dark",
  },
});

// OpenAPI.BASE = "https://txt2img-api.vercel.app";
OpenAPI.BASE = "http://localhost:8000";


export default function Home() {
  const [alert, setAlert] = useState({
    msg: "",
    type: "success",
  });
  const [imageUrl, setImageUrl] = useState(null);
  const [isImageLoading, setIsLoading] = useState(false);
  const [isMintLoading, setMintLoading] = useState(false);
  const [textInput, setTextInput] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState(null);
  const [textHash, setTextHash] = useState(null);
  const [address, setAddress ] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [magic, setMagic] = useState(null);
  const [provider, setProvider] = useState(null);

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
    const magicInstance = new Magic(process.env.MAGIC_PK_LIVE, { 
      network: 'goerli',
      extensions: [new ConnectExtension()]
    });
    
    const providerInstance = new ethers.providers.Web3Provider(magicInstance.rpcProvider);

    setMagic(magicInstance)
    setProvider(providerInstance)
    addWalletListener()
  }, [])

  const handleSubmit = async (event) => {
    setIsLoading(true);
    setImageUrl(null);
    event.preventDefault();
    const val = event.target.elements.prompt.value.trim();
    setTextInput(val);
    if (!val) return;

    try {

      const res = await DefaultService.stableDiffusionImg2TxtPost({
        prompt: val,
      });
      setImageUrl(res.image_uris[0]);
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
    setTextHash(hashedText);

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

    setMetadataUrl(nft_metadata_uri);

    return {nft_metadata_uri, hashedText}
  }

  const byteSize = str => new Blob([str]).size;

  const handleMint = async (event) => {
    event.preventDefault();
    // TODO: Create check that texted input is not taken
    // TODO: Alternative, let tx fail at the contract level (bad UX, less work)

    
    setMintLoading(true);
    try {
      if (!isConnected || (address == null)) {
        setAlert({
          msg: "Please connect wallet!",
          type: "error"
        });
        return
      }

      if (!window.ethereum) {
        setAlert({
          msg: "Please connect wallet!",
          type: "error"
        });
        return
      }

      const {nft_metadata_uri, hashedText} = await create_metadata();
      
      const signer = await provider.getSigner();
      console.log("Signer", signer)

      const addr = await signer.getAddress()
      console.log("Address from signer", addr)

      // Read/Write Contract instance
      const contractInstance = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contract.abi,
        signer,
      )

      console.log("Contract", contractInstance)
      console.log("Signer", signer)
      console.log("Window", window.ethereum)
      console.log("Address", addr)
      console.log("Hashed Text", byteSize(hashedText))
      console.log("Text Input", byteSize(textInput))
      console.log("Token Metadata", nft_metadata_uri)
      const final_hashed_text = hashedText.valueOf()
      const mint_price = ethers.utils.parseEther("0.05")
      console.log("Mint PRice", mint_price)

      // NOTE: We need to do gas estimations for a third party wallet connection but not for MC users.
      //console.log(await magic.connect.getWalletInfo())
      // Gas estimations
      // const gasPrice = await provider.getGasPrice();
      // const mintGasFees = await contractInstance.estimateGas.mintToken(
      //     addr,
      //     nft_metadata_uri,
      //     final_hashed_text,
      // );
      // const final_gas_price = gasPrice * mintGasFees;

      // console.log("Gas Price", gasPrice)
      // console.log("Mint Gas Fees", gasPrice)

      // console.log("Contract Address", process.env.CONTRACT_ADDRESS)
      

      // const overrideOptions = {
      //   "value": ethers.utils.parseEther("0.05"),
      // }

      try{
         const tx = await contractInstance.mintToken(addr,nft_metadata_uri,final_hashed_text, {
          // gasPrice: gasPrice,
          // gasLimit: "99000",
          value: mint_price,
        });
 
        console.log(typeof(tx))
        const receipt = await tx.wait()

        console.log("Receipt", receipt)

        // TODO: Set UI to successful minting page
        setAlert({
          msg: "Minted!",
        });

    } catch (error) {
      console.log(error)
    }
    } catch (e) {
      console.error(e);
    } finally {
      setMintLoading(false);
    }
  };

  const login = () => {
    provider.listAccounts().then(accounts => {
      setAddress(accounts[0])
      console.log("Connected Account",accounts[0])
      setIsConnected(true);
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
                  <Button onClick={showWallet} variant="outlined">
                    {address}
                  </Button>

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
