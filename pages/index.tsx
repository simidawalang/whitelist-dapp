import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { Button } from "@/components";
import coinImg from "@/assets/coins-3D.png";
import { ABI, WHITELIST_CONTRACT_ADDRESS } from "@/constants";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [numWhitelistedAddresses, setNumWhitelistedAddresses] = useState(0);
  const [loading, setLoading] = useState(false);

  const getSignerOrProvider = async (needSigner = false) => {
    const web3Modal = new Web3Modal({
      network: "goerli",
      cacheProvider: true,
      providerOptions: {},
      disableInjectedProvider: false,
    });

    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const handleAccountsChange = async () => {
    const provider = new providers.Web3Provider(window?.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);

    if (accounts.length > 0) {
      setCurrentAccount(accounts[0]);
      await checkIfWhitelisted();
    } else {
      setCurrentAccount("");
      setIsConnected(false);
    }
  };

  const checkIfWhitelisted = async () => {
    try {
      const provider = await getSignerOrProvider();
      const accounts = await provider.send("eth_requestAccounts", []);

      const whitelisContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        ABI,
        provider
      );

      const _isWhitelisted = await whitelisContract.whitelistedAddresses(
        accounts[0]
      );
      setIsWhitelisted(_isWhitelisted);
    } catch (e) {
      console.debug(e);
    }
  };

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getSignerOrProvider(true);

      const whitelisContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const tx = await whitelisContract.addAddressToWhitelist();
      await tx.wait();
      setIsWhitelisted(true);
    } catch (e) {
      console.debug(e);
    }
  };

  const checkIfConnected = async () => {
    try {
      const provider = await getSignerOrProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      setCurrentAccount(accounts[0]);
      setIsConnected(true);
    } catch (e) {
      setIsConnected(false);
      console.debug(e);
    }
  };

  const connectWallet = async () => {
    try {
      const provider = await getSignerOrProvider();
      const accounts = await provider.listAccounts();
      setCurrentAccount(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkIfConnected();
    checkIfWhitelisted();
  }, [currentAccount]);

  useEffect(() => {
    window?.ethereum?.on("accountsChanged", handleAccountsChange);

    return () => {
      window?.ethereum?.on("accountsChanged", handleAccountsChange);
    };
  });

  return (
    <>
      <Head>
        <title>Orisa NFT Whitelist</title>
        <meta name="description" content="Orisa NFT Whitelist" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        {currentAccount && (
          <div className="current-account">
            {`${currentAccount.slice(0, 5)}...${currentAccount.slice(35)}`}
          </div>
        )}
        <div className="main">
          <div className="intro-block">
            <h1 className="title">Orisa</h1>
            <p className="description">
              For fans of <span className="highlighted-text">Yoruba</span>{" "}
              mythology
            </p>
            {!isConnected && (
              <Button
                className="btn-glow"
                content="Connect Wallet"
                onClick={connectWallet}
              />
            )}
            {!isWhitelisted && (
              <Button
                className="btn-glow"
                content="Join Whitelist"
                onClick={addAddressToWhitelist}
              />
            )}
            {isConnected && isWhitelisted && (
              <p>Congrats, you have been whitelisted!</p>
            )}
          </div>
          <div>
            <Image
              className="orisa-img"
              src="https://res.cloudinary.com/dtumqh3dd/image/upload/v1674788780/nft-dapp/3_uu5f12.jpg"
              alt="Osun the river goddess"
              priority
              width={400}
              height={600}
            />
          </div>
        </div>
      </main>
    </>
  );
}
