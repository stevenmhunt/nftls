# Creating a Certificate Signing Request (CSR)

Much like generating an SSL certificate using *openssl*, you must first generate a *Certificate Signing Request* to acquire an NFTLS certificate. In the request itself you will state your identity, the intent of the certificate, and then sign it using one or more relevant addresses associated with the target blockchain.

## NFT Certificates
You can request a certificate for a specific NFT, allowing you to authenticate that specific image file as well as who created it. If you intend to publish your NFT with an embedded certificate, you'll want to request and and install your certificate *before* finalizing your NFT.

### Example 1: Token CSR
```bash
# your blockchain platform (eth, polygon, etc.)
PLATFORM=eth

# your blockchain private key (be careful...)
YOUR_KEY=0x......

# the contract address for your NFT (must match a signature)
YOUR_NFT_ADDRESS=0x......

# your NFT image.
YOUR_NFT_IMAGE=my_nft.png

# the token ID for your NFT.
YOUR_NFT_TOKENID=999

# the Fully Qualified Token Name (FQTN)
YOUR_FQTN="$YOUR_NFT_ADDRESS#$YOUR_NFT_TOKENID@$PLATFORM"

# your name (or organization name)
YOUR_NAME="Bobby Tables"

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQTN, O=$YOUR_NAME, C=US, S=Florida, L=Orlando"

nftls request token $YOUR_KEY \
    --image $YOUR_NFT_IMAGE \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    -o csr.json
```

If you're concerned about exposing your private key by writing it to an environment variable, you can optionally omit the `<signing key>` parameter after `request token` or set it to `-` and the command-line tool will automatically prompt you to enter your key into a secure input prompt. NFTLS is also compatible with Ethereum wallet applications, so if you use [the web-based CSR order system on our website](https://nftls.io/account) you can let the wallet manage signing the CSR.

Once you have successfully generated your CSR file you can provide it to a registrar who can verify your information and then issue a certificate through the Certificate Authority (CA).

## Address and Contract Certificates
If you have a large collection of NFTs or a contract or address in the blockchain you wish to verify, you can request an address certificate. Once you have a certificate associated with the address of your NFT, you can use it to sign your own individual NFT certificates.

Unlike an NFT certificate which is installed directly into the image content itself, *address* and *domain* certificates must minted as NFTs by the CA and then transferred to the same address used to sign the request. You can optionally provide an image to write the certificate to, and then request a certificate using that image.

### Example 2: Address CSR
```bash
# your blockchain platform (eth, polygon, etc.)
PLATFORM=eth

# your blockchain private key (be careful...)
YOUR_KEY=0x......

# your blockchain address (must match a signature)
YOUR_ADDRESS=0x......

# the base image for your certificate, make it something nice :) It must be 512x512 for address and domain certificates.
YOUR_BASE_IMAGE=my_address_cert.png

# the Fully Qualified Domain Name (FQDN)
YOUR_FQDN="$YOUR_ADDRESS@$PLATFORM"

# your name (or organization name)
YOUR_NAME="Bobby Tables"

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=$YOUR_NAME, C=US, S=Florida, L=Orlando"

# (optional)
nftls render address-token $YOUR_KEY \
        --image $YOUR_BASE_IMAGE \
        --name $YOUR_FQTN \
        -o ./cert.png

nftls request address $YOUR_KEY \
    --image ./cert.png \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    -o csr.json
```

## Domain and Wildcard Certificates
If you have a blockchain domain name or TLD, you may want to verify your identity to others or possibly sell and issue certificates to subdomains. As with address certificates, you can optionally render an image for embedding the resultant certificate.

### Example 3: Domain CSR
```bash
# your blockchain platform (eth, polygon, etc.)
PLATFORM=eth

# your blockchain private key (be careful...)
YOUR_KEY=0x......

# the base image for your certificate, make it something nice :) It must be 512x512 for address and domain certificates.
YOUR_BASE_IMAGE=my_address_cert.png

# the Fully Qualified Domain Name (FQDN)
YOUR_FQDN="mydomainname.wallet@$PLATFORM"

# your name (or organization name)
YOUR_NAME="Bobby Tables"

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=$YOUR_NAME, C=US, S=Florida, L=Orlando"

# (optional)
nftls render address-token $YOUR_KEY \
        --image $YOUR_BASE_IMAGE \
        --name $YOUR_FQDN \
        -o ./cert.png

nftls request domain $YOUR_KEY \
    --image ./cert.png \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    -o csr.json
```

### Example 4: TLD Wildcard CSR
```bash
# your blockchain platform (eth, polygon, etc.)
PLATFORM=eth

# your blockchain private key (be careful...)
YOUR_KEY=0x......

# the base image for your certificate, make it something nice :) It must be 512x512 for address and domain certificates.
YOUR_BASE_IMAGE=my_address_cert.png

# the Fully Qualified Domain Name (FQDN)
YOUR_FQDN="*.mytld@$PLATFORM"

# your name (or organization name)
YOUR_NAME="Bobby Tables"

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=$YOUR_NAME, C=US, S=Florida, L=Orlando"

# capture the security code when generating the token.
nftls render address-token $YOUR_KEY \
        --image $YOUR_BASE_IMAGE \
        --name $YOUR_FQDN \
        -o ./cert.png

nftls request domain $YOUR_KEY \
    --image ./cert.png \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    -o csr.json
```
