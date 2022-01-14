# Re-Issuing NFTLS Certificates

While NFTLS certificates don't expire like SSL or x509 certificates, there may be cases where a certificate needs to be re-issued. This would generally be necessary if a private key associated with a domain token were compromised, or worse yet the root domain certificate for the entire CA. In order to remedy such a situation, a certificate will need to be re-issued with a new private key. Re-issuing of NFT certificates is not applicable since NFT certificates cannot issue other certificates and their validity is not tied to who owns the token.

## Address and Contract Certificates

To re-issue an address certificate, you first need the original certificate file. Then, create a CSR and token image for the new certificate and process the reissue through the registrar.

### Example 1: Re-issuing an Address Certificate
```bash
# the original certificate that is being invalidated (can be JSON or a PNG).
ORIGINAL_CERT="compromised.cert.json"

# the CSR file signed by the new private key.
CSR_FILE="replacement_cert.csr.json"

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

# The ISO date/time at which the previous certificate should be considered "compromised".
COMPROMISED_TIME="2022-01-14T17:22:43.013Z"

nftls reissue $ORIGINAL_CERT $CSR_FILE $YOUR_KEY \
    --id "$NFT_ADDRESS#$NFT_TOKEN_ID" \
    --issuer "$YOUR_INFO" \
    --email $NFTLS_EMAIL \
    --starting-at $COMPROMISED_TIME \
    -o new_cert.cert.json
```

After issuing the certificate, you must install it into the new token image and mint the specified NFT address and ID. Once minted, it needs to be owned by the parent signing key's address in order to be valid, since all child keys are considered compromised. For the purposes of certificate chain verification, any certificates issued by the compromised certificate after the `starting-at` time are considered void. It is the responsibility of the registrar to ensure that this value is appropriate and won't "change history" in an inappropriate way, as this would affect the reputation of the registrar and have a negative impact on peoples' trust of the entire certificate system.

## Domain Certificates
The process of re-issuing domain certificates is identical to that of address certificates. The ability to re-issue certificates in the case of a security breach is why CA certificates are not used directly to process CSRs, so that if the root domain certificate were compromised it would still be possible to recover the CA and "fix" the compromised key.

## CA Certificates
Unfortunately, CA certificates themselves cannot be re-issued. Once a CA private key is compromised, then the entire CA and all child certificates are compromised. This is why CA certificates are not managed through the blockchain directly, why a root domain certificate is always issued from the CA to sign CSRs on its behalf, and why the security procedures for CA private keys are so extreme. The process for re-issuing a certificate always depends on a higher authority being able to sign off on the new certificate, and since CAs by definition have to be self-signed there isn't a way to prove whether any newly issued certificates are from the original owner or an unauthorized person who has access to the key. It may be possible in the future to "revoke" a certificate without re-issuing it, but hopefully the need to invalidate an entire CA will never be required.
