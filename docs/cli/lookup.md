# NFTLS Certificate Lookup

Once a certificate has been written to the blockchain, other people or programs interacting with that certificate may want to verify that the certificate was issued by well-known and valid authorities. To validate a certificate within the blockchain, the chain of certificates connecting the certificate in question to a valid CA must be established. You can use the `nftls-lookup` command to query the blockchain and perform this check. In order to provide a clear separation between offline and online functionality, all online functions are located within this command.

## Connecting to the Blockchain

The `nftls-lookup` command needs to be able to connect to the correct blockchain in order to validate certificate chains. In order to connect, you'll need an [etherscan.io API key](https://etherscan.io/apis). Once you've generated your API key, you can connect.

### Example 1: Connecting to Ethereum
```bash
# Connect to Ethereum
PLATFORM=eth

# your etherscan.io API key
API_KEY=...........

# (optional) the Ethereum network that you want to use.
# default: mainnet
ENV=mainnet

nftls-lookup connect $PLATFORM $API_KEY $ENV
```

Once you've entered the correct credentials, you'll be able to perform certificate chain lookups against the blockchain.

## Managing Certificate Authorities

In order to perform a lookup on a certificate chain, you need to have the required CA certificate installed on your machine. You can get a list of installed CAs by running `nftls-lookup ca list`. You can also add and remove CA certificates.

### Example 1: Adding a CA Certificate
```bash
# the new CA certificate to add.
CA_CERT="new_ca.cert.json"

# the name of the CA.
CA_NAME="New CA"

nftls-lookup ca add $CA_CERT \
    --name $CA_NAME
```

## Inspecting a Certificate Chain

You can visually inspect a certificate chain by running `nftls-lookup inspect <file>`, which will automatically download any required assets from the blockchain and then display a tree showing all certificates and their statuses in the chain.

## Validating a Certificate Chain

You can also use `nftls-lookup validate <file>` to validate that a certificate chain is valid.