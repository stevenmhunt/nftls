# Signing a CSR and Issuing a Certificate

Once a CSR is generated by someone who wants to receive an NFTLS certificate, a certificate can be issued by a higher-level authority in the certificate chain such as the CA or a wildcard domain certificate. It is the responsibility of the certificate registrar to verify that the information in the CSR is accurate, as the reputation and trust associated with a certificate is only as good as the quality of the processes being used by the organization(s) signing certificates.

## NFT Certificates

### Example 1: Issuing an NFT Certificate
```bash
# the CSR file provided by the requestor.
CSR_FILE="nft_token.csr.json"

# your blockchain private key (be careful...)
YOUR_KEY=0x......

# The FQDN from the parent certificate associated with your signing key.
YOUR_FQDN="..."

# organization name (or your name if an individual)
YOUR_NAME="Certificate Registrar Company"

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=$YOUR_NAME, C=US, S=California, L=San Francisco"

nftls issue $CSR_FILE $YOUR_KEY \
    --issuer "$YOUR_INFO" \
    --email $NFTLS_EMAIL \
    -o nft_token.cert.json
```

## Address and Contract Certificates

While the NFT certicicate is installed directly into an NFT image and then ultimately written to the blockchain by the requestor, address and domain certificates must be minted into an NFT by the registrar and then transferred to the requestor's address in order for the certificate to be considered valid. When you issue the certificate, you will need to add the token address which also must match your signing key or "for" address in your parent certificate that you're signing on behalf of.

### Example 2: Issuing an Address Certificate
```bash
# the CSR file provided by the requestor.
CSR_FILE="address.csr.json"

# your blockchain private key (be careful...)
YOUR_KEY=0x......

# The FQDN from the parent certificate associated with your signing key.
YOUR_FQDN="..."

# The address from where the NFT for this certificate will be minted.
# This MUST match the signing key or "for" address in your domain certificate.
NFT_ADDRESS=0x....

# The token number of the NFT that will be associated with this certificate.
NFT_TOKEN_ID=123

# organization name (or your name if an individual)
YOUR_NAME="Certificate Registrar Company"

# your email contact information
YOUR_EMAIL="your email address"

# you can specify your information using the same field names as in an SSL CSR.
YOUR_INFO="CN=$YOUR_FQDN, O=$YOUR_NAME, C=US, S=California, L=San Francisco"

nftls issue $CSR_FILE $YOUR_KEY \
    --token "$NFT_ADDRESS" \
    --issuer "$YOUR_INFO" \
    --email $NFTLS_EMAIL \
    -o address.cert.json
```

## Address and Contract Certificates

The process of issuing a domain certificate is identical to that of an address certificate because address versus domain information is contained within the CSR, so the registrar does not provide any additional parameters.