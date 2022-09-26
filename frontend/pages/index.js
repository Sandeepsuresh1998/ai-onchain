import React, { useState, useEffect } from "react";
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
import text_to_hash from "./util/text_to_hash";
const ethers = require('ethers');

const darkTheme = createTheme({
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: "#6a1b9a",
    },
    mode: "dark",
  },
});

OpenAPI.BASE = "http://localhost:8000";

export default function Home() {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState(null);
  const [textHash, setTextHash] = useState(null);
  const { address, isConnected } = useAccount();
  const { data: signer, isError, signerIsLoading } = useSigner()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect()

  // TODO: This might break in deployment 
  const contract = require("../../artifacts/contracts/AINFT.sol/AINFT.json");
  const { config } = usePrepareContractWrite({
    addressOrName: '0x724e0AEcf6Cf6c0f883581609500A9Fd1Afd2661',
    contractInterface: contract.abi,
    functionName: 'mintToken',
    signerOrProvider: signer,
    args: [
        address,
        metadataUrl,
        textHash,
    ],
    overrides: {
      value: ethers.utils.parseEther('0.05')
    }
  })

  const { data, isMinting, isSuccess, write } = useContractWrite(config)

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

    const baseIpfsUrl = "https://gateway.pinata.cloud/ipfs/"

    // Pin image URL to IPFS
    const imageRes = await DefaultService.uploadImageToIpfsUploadImagePost({
      image_uri: imageUrl,
    });

    // Remove ipfs://
    var ipfsHash = imageRes.ipfs_uri.substring(7)
    const ipfsImageUrl = baseIpfsUrl + ipfsHash

    // Construct metadata json
    // TODO: Add token id to name, this might have some race conditions
    // TODO: Alt: throw smaller version of hashed text into name (looks robotic)
    var metadata = {
      "name": "Dream # 323",
      "description": val,
      "image": ipfsImageUrl,
    }

    // Call api to pin metadata
    const metadataRes = await DefaultService.uploadMetadataToIpfsUploadMetadataPost({
      metadata: metadata,
    })

    // Setting necessary components to state
    setMetadataUrl(baseIpfsUrl + metadataRes.ipfs_uri)
    setTextHash(text_to_hash(textInput))
    
    // // TODO: Call contract to mint NFT with now pinned tokenURI
    // const response = await fetch(`${server}/api/mint`, {
    //   method: "POST",
    //   body: JSON.stringify({
    //     address,
    //     metadataUrl,
    //     textInput,
    //   }),
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });
    
    // console.log(response)

    // TODO: Call contract using wagmi and signer given from the constructor

    // TODO: Set UI to successful minting page    
  };

  return (
    <ThemeProvider theme={darkTheme}>
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
              {!isLoading && !imageUrl && (
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
              placeholder="cool dog in style of cave painting"
            />
            <Box mb={2} />
            <Button type="submit" variant="contained">
              generate
            </Button>
            <Box mb={2} />
            {imageUrl && (
              <>
                <Button onClick={handleMint}variant="outlined">Mint</Button>
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
