import React, { useState, useEffect, useCallback } from "react";
import Particles from "react-particles";
import { loadFull } from "tsparticles";
import { server } from "../config";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useSigner,
} from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
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
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

import CssBaseline from "@mui/material/CssBaseline";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import text_to_hash from "../util/text_to_hash"
const ethers = require("ethers");

const darkTheme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: "#6a1b9a",
    },
    mode: "dark",
  },
});

OpenAPI.BASE = process.env.SERVER_URL | "http://localhost:8000";

export default function Home() {
  const [imageUrl, setImageUrl] = useState(null);
  const [isImageLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState(null);
  const [textHash, setTextHash] = useState(null);
  const { address, isConnected } = useAccount();
  const { data: signer, isError, signerIsLoading } = useSigner();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  const particlesInit = useCallback(async (engine) => {
    console.log(engine);
    // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    await console.log(container);
  }, []);
  const contract = require("../util/SyntheticDreams.json");

  const { config } = usePrepareContractWrite({
    addressOrName: process.env.CONTRACT_ADDRESS,
    contractInterface: contract.abi,
    functionName: "mintToken",
    args: [address, metadataUrl, textHash],
    overrides: {
      value: ethers.utils.parseEther("0.05"),
    },
  });

  const { data, error, isLoading, isSuccess, write } = useContractWrite(config);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const val = event.target.elements.prompt.value.trim();
    setTextInput(val);
    if (!val) return;

    try {
      setIsLoading(true);
      setImageUrl(null);

      const res = await DefaultService.stableDiffusionImg2TxtPost({
        prompt: val,
      });
      setImageUrl(res.image_uri);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async (event) => {

    // TODO: Create check that texted input is not taken
    // TODO: Alternative, let tx fail at the contract level (bad UX, less work)

    const baseIpfsUrl = "https://gateway.pinata.cloud/ipfs/";

    // Pin image URL to IPFS
    const imageRes = await DefaultService.uploadImageToIpfsUploadImagePost({
      image_uri: imageUrl,
    });

    // Remove ipfs:// and add gateway
    const ipfsImageUrl = imageRes.ipfs_uri.replace("ipfs://", baseIpfsUrl);
    const hashedText = text_to_hash(textInput);
    setTextHash(hashedText);

    // Construct metadata json
    // TODO: Alt: throw smaller version of hashed text into name (looks robotic)
    var metadata = {
      name: `Dream: ${hashedText.substring(0, 4)}`,
      description: textInput,
      image: ipfsImageUrl,
    };

    // Call api to pin metadata
    const metadataRes =
      await DefaultService.uploadMetadataToIpfsUploadMetadataPost({
        metadata: metadata,
      });

    setMetadataUrl(baseIpfsUrl + metadataRes.ipfs_uri);

    await write?.();
    // TODO: Set UI to successful minting page
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        style={{
          position: "relative",
          zIndex: "-1",
        }}
      >
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
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
      <CssBaseline />
      <div
        style={{
          height: "100vh",
          width: "100vw",
        }}
      >
        <Box
          padding={2}
          pt={[2, 6]}
          justifyContent="center"
          alignItems="center"
          textAlign="center"
          maxWidth="600px"
          mx="auto"
        >
          <Typography
            textTransform="uppercase"
            variant="h3"
            sx={{
              letterSpacing: ["2px", "8px"],
              textShadow: "-3px -3px 0px #fff4, 4px 4px 0px #6a1b9af0",
            }}
          >
            Synthetic Dreams
          </Typography>
          <Paper elevation={2} sx={{ my: 2, overflow: "hidden" }}>
            <Box
              minHeight="30vh"
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading && <CircularProgress />}
              {!isLoading && imageUrl && (
                <img
                  width="100%"
                  src={imageUrl}
                  alt={"stable diffusion image."}
                />
              )}
              {!isImageLoading && !imageUrl && (
                <ImageSearchIcon sx={{ fontSize: "5rem" }} />
              )}
            </Box>
          </Paper>
          <Box
            as="form"
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
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
              <ConnectButton />
            </Box>
          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
}
