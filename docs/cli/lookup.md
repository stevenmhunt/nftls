# NFTLS Certificate Lookup

Once a certificate has been written to the blockchain, other people or programs interacting with that certificate may want to verify that the certificate was issued by well-known and valid authorities. To validate a certificate within the blockchain, the chain of certificates connecting the certificate in question to a valid CA must be established. You can use the `nftls-lookup` command to query the blockchain and perform this check. In order to provide a clear separation between offline and online functionality, all online functions are located within this command.

## Connecting to the Blockchain

The `nftls-lookup` command needs to be able to connect to the correct blockchain in order to validate certificate chains. While the program comes pre-configured with the default providers from [ethers.js](https://docs.ethers.io/v5/), you will likely want to add an API key from your Ethereum service API of choice. For example, you can use an [etherscan.io API key](https://etherscan.io/apis) to connect:

### Example 1: Connecting to Ethereum via Etherscan
```bash
# Connect to Ethereum
PLATFORM=eth

# your etherscan.io API key
API_KEY=...........

nftls-lookup platform add eth Etherscan $API_KEY
```

## Managing Certificate Authorities

In order to perform a lookup on a certificate chain, you need to have the required CA certificate installed on your machine. You can get a list of installed CAs by running `nftls-lookup ca list`. You can also add and remove CA certificates.

### Example 1: Adding a CA Certificate
```bash
# the new CA certificate to add.
CA_CERT="new_ca.cert.json"

nftls-lookup ca add $CA_CERT
```

You'll notice that all relevant information on the CA including network name is extracted from the certificate file and added to your local environment. CA certificates from nftls.io come pre-configured in the library so you won't need to perform this operation unless you have a custom CA certificate.

## Resolving a Certificate Chain

You can visually inspect a certificate chain by running `nftls-lookup resolve <file>`, which will automatically download any required assets from the blockchain and then display a tree showing all certificates and their statuses in the chain.

## Validating a Certificate Chain

You can also use `nftls-lookup validate <file>` to validate that a certificate chain is valid.

## Downloading a Certificate

You can also use `nftls-lookup download <FQDN or FQTN>` to download a certificate through the blockchain.
