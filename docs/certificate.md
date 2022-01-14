# NFTLS Certificates

## Components
- ...request: the first part of the certificate contains the data from the CSR.
- `id`: the NFT address and token number associated with the certificate. Most (but not all) certificates have this field.
- `type` - the type of certificate. Example: 'NFTLS Address Certificate'
- `issuer` - the FQDN and identity information from the registrar.
- `issuerEmail` - the registrar's email address.
- `dateIssued` - The ISO date/time when the certificate was issued.
- `serialNumber` - A 128 bit number to add entropy to the certificate.
- `signature` - The hashed contents of the certificate, signed by the registrar.
