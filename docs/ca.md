# NFTLS Certificate Authorities (CA)

In a Public Key Infrastructure, there is one certificate at the beginning of all certificate chains which all the others depend upon to provide validity and trust. This is the responsibility of the Certificate Authority certificate (referred to as CA from this point forward). This hierarchical trust model has been at the heart of critical Web 1.0 and 2.0 technologies such as SSL/TLS, X509, and Smart Cards. The goal of NFTLS is to establish and operate a Web 3.0 version of this infrastructure in order to provide authenticity to blockchain participants and improve security.

## Generating CA Certificates

You can issue your own CA certificate, although it's not recommended. This is a potentially sensitive operation from a securiy perspective, especially if you intend to use this certificate in a public blockchain since unauthorized access to the private key would compromise every other certificate ever issued through the affected CA.

If you absolutely *must* generate a CA certificate for production use, use the following procedures:

1) Generate two private keys on an offline computer, preferrably one that lacks any networking hardware and has a fresh OS installation on it from a trusted medium, or even better a live CD.

2) One of these keys will be the CA signing key, and the other the signing key for the root wildcard domain certificate that you will use for signing all other CSRs in the future.

3) Write down the private key values (and which one is which!) on a piece of paper and store it in a secure location (safe, bank vault, etc.)

4) Use the `nftls` command-line tool to generate a CA CSR which for the root domain certificate address (I.E. you'll sign the CA CSR with both keys), then issue the certificate using the CA private key (self-signed). You'll also need to specify the contract nonce for the transaction used to deploy the smart contract for the token you'll issue for address and domain certificates.

5) Use the `nftls` command-line tool to generate a root wildcard domain CSR (FQDN: `*@platform`), and then issue the root certificate using the newly created CA certificate. Make sure that you specify the token contract address and also indicate that the root certificate is to be installed as the "root token".

6) Using a **brand new** (out of a sealed factory package) USB key, copy the newly generated certificates onto it. Consider destroying any permanent storage mechanisms on the computer afterwards to ensure that the private key is not stored anywhere digitally. Alternatively, use a live CD and then disconnect all permanent storage before booting the computer.

*NEVER* use a CA certificate to directly issue other certificates except for once in order to create a root domain certificate. The CA private key must not be allowed to persist in any digital storage mechanism and should only be stored in memory as required to generate it and subsequently write down its value. Never store CA certificates in the blockchain, they are only used so that if a root certificate is compromised, the CA can still be used in an emergency to issue a new root certificate. Except for issing CA-level authorization signatures, the CA private key should never leave a vault or be known to anyone for any reason.