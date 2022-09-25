import React, { useState, useEffect } from "react";
import { server } from "../config";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useContractRead,
  useContractWrite,
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
  const TOKEN_URI =
    "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7";
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  const mintNFT = async (address, tokenURI, hash) => {
    const response = await fetch(`${server}/api/mint`, {
      method: "POST",
      body: JSON.stringify({
        address,
        tokenURI,
        hash,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log(data);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const val = event.target.elements.prompt.value;
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

  const handleMint = async () => {
    alert("todo");
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
            Imagination
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
                <Button variant="outlined">Mint</Button>
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
