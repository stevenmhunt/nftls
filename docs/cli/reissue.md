# Re-Issuing NFTLS Certificates

While NFTLS certificates don't expire like SSL or x509 certificates, there may be cases where a certificate needs to be re-issued. This would generally be necessary if a private key associated with a domain token were compromised, or worse yet the root domain certificate for the entire CA. In order to remedy such a situation, a certificate will need to be re-issued with a new private key. Re-issuing of NFT certificates is not applicable since NFT certificates cannot issue other certificates and their validity is not tied to who owns the token.

## Address and Contract Certificates

To re-issue an address certificate, you need to create a CSR for the new certificate and process the reissue through the registrar.

### Example 1: Re-issuing an Address Certificate
```bash
# the version number of the replacement certificate
NEW_VERSION=1

# your blockchain platform (eth, eth:rinkeby, etc.)
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
    --version $NEW_VERSION \
    --image $YOUR_NFT_IMAGE \
    --subject "$YOUR_INFO" \
    --email $YOUR_EMAIL \
    -o csr.json
```
After issuing the certificate, you must install it into the new token image and mint the specified NFT address and ID. Once minted, it needs to be owned by the parent signing key's address in order to be valid, since all child keys are considered compromised.

## Domain Certificates
The process of re-issuing domain certificates is identical to that of address certificates. The ability to re-issue certificates in the case of a security breach is why CA certificates are not used directly to process CSRs, so that if the root domain certificate were compromised it would still be possible to recover the CA and "fix" the compromised key. Note that the NFTLS Ethereum contract itself supports a mechanism that allows the CA to authorize a "redeploy" of the entire token in the event that the root certificate is compromised.

## CA Certificates
Unfortunately, CA certificates themselves cannot be re-issued. Once a CA private key is compromised, then the entire CA and all child certificates are compromised. This is why CA certificates are not managed through the blockchain directly, why a root domain certificate is always issued from the CA to sign CSRs on its behalf, and why the security procedures for CA private keys are so extreme. The process for re-issuing a certificate always depends on a higher authority being able to sign off on the new certificate, and since CAs by definition have to be self-signed there isn't a way to prove whether any newly issued certificates are from the original owner or an unauthorized person who has access to the key.
