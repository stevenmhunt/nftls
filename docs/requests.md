# Initiating a Certificate Signing Request (CSR)

Much like generating an SSL certificate using `openssl`, you must first generate a *Certificate Signing Request* to acquire an NFTLS certificate. In the request itself you will state your identity, the intent of the certificate, and then sign it using one or more relevant addresses associated with the target blockchain.

## NFT Certificates
You can request a certificate for a specific NFT, allowing you to authenticate that specific image file as well as who creataed it. If you intend to publish your NFT with an embedded certificate, you'll want to request and and install your certificate *before* finalizing your NFT.

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

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQTN, O=Your Name or Company, C=US, S=Florida, L=Orlando"

nftls request token $YOUR_KEY \
    --image $YOUR_NFT_IMAGE \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    -o csr.json
```

If you're concerned about exposing your private key by writing it to an environment variable, you can optionally omit the `<signing key>` parameter after `request token` and the command-line tool will automatically prompt you to enter your key into a secure input prompt.

Once you have successfully generated your CSR file you can provide it to a registrar who can verify your information and then issue a certificate through the Certificate Authority (CA).

## Address & Contract Certificates
If you have a large collection of NFTs or a contract or address in the blockchain you wish to verify, you can request an address certificate. Once you have a certificate associated with the address of your NFT, you can use it to sign your own individual NFT certificates.

Unlike an NFT certificate which is installed directly into the image content itself, *address* and *domain* certificates must minted as NFTs by the CA and then transferred to the same address used to sign the request. You must first generate a valid image to write the certificate to, and then request a certificate using that image.

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

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=Your Name or Company, C=US, S=Florida, L=Orlando"

# capture the security code when generating the token.
CODE=$(
    nftls render address-token $YOUR_KEY \
        --image $YOUR_BASE_IMAGE \
        --name $YOUR_FQTN \
        -o ./cert.png
)

nftls request address $YOUR_KEY \
    --image ./cert.png \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    --code $CODE \
    -o csr.json
```

## Domain and Wildcard Certificates
If you have a blockchain domain name or TLD, you may want to verify your identity to others or possibly sell and issue certificates to subdomains. As with address certificates, you'll need to render an image for embedding the resultant certificate.

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

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=Your Name or Company, C=US, S=Florida, L=Orlando"

# capture the security code when generating the token.
CODE=$(
    nftls render domain-token $YOUR_KEY \
        --image $YOUR_BASE_IMAGE \
        --name $YOUR_FQDN \
        -o ./cert.png
)

nftls request domain $YOUR_KEY \
    --image ./cert.png \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    --code $CODE \
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

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=Your Name or Company, C=US, S=Florida, L=Orlando"

# capture the security code when generating the token.
CODE=$(
    nftls render domain-token $YOUR_KEY \
        --image $YOUR_BASE_IMAGE \
        --name $YOUR_FQDN \
        -o ./cert.png
)

nftls request domain $YOUR_KEY \
    --image ./cert.png \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    --code $CODE \
    -o csr.json
```

## Certificate Authorities
You can also request your own CA certificate, although you may have difficulty finding a registrar who will help you with this request. This is a potentially sensitive operation from a securiy perspective, especially if you intend to use this certificate in a public blockchain since unauthorized access to the private key could invalidate the entire certificate chain.

If you must generate a CA certificate for use on a public blockchain, use the following procedures:

1) Generate two private keys on an offline computer, preferrably one that lacks any networking hardware.

2) One of these keys will be the CA private key, and the other the private key for the root wildcard domain certificate that you will use for signing all other CSRs in the future.

3) Write down the private key values (and which one is which!) on a piece of paper and store it in a secure location (safe, bank vault, etc.

4) Use the `nftls` command-line tool to generate a CA CSR which forwards to the root domain certificate address (I.E. you'll sign the CA CSR with both keys), then issue the certificate using the CA private key (self-signed).

5) Use the `nftls` command-line tool to render a domain token image and generate a root wildcard domain CSR (FQDN: `*@platform`), and the issue the root certificate using the newly created CA certificate.

6) Using a **brand new** (out of a sealed factory package) USB key, copy the newly generated certificates onto it. Consider destroying any permanent storage mechanisms on the computer afterwards to ensure that the private key is not stored anywhere digitally.

*NEVER* use a CA certificate to directly generate CSRs other than the one time required to create a root certificate. The CA private key shouldn't exist in any digital storage mechanism for any longer than is required to generate it and subsequently write down its value. Never store CA certificates in the blockchain, they are only used so that if a root certificate is compromised, the CA can still be used in an emergency to issue a new root certificate. Except for this particular situation, the CA private key should never leave a vault or be known to anyone for any reason.