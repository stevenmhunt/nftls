# NFTLS Certificate Signing Requests (CSRs)

## Components
- `type` - the type of certificate that is being requested. Example: 'NFTLS Address Request'
- `subject` - contains the requested FQDN or FQTN as well identity information from the requestor.
- `email` - the email address of the requestor. Registrars will generally provide issued certificates to this email address only.
- `imageHash` - A SHA-256 hash of the image being certified by the request.
- `dateRequested` - The ISO date/time when the request was made.
- `signature` - The hashed contents of the request, signed by the requestor's private key.
- `requestAddress` - The requestor's address.
- `requestSignature` - Another signature which includes the request address. This second signature prevents a third party from modifying the request address without changing the signature.
- `forAddress` - (optional) Allows you to specify a different address associated with certificate than the signing key. There are cases (such as with root domain certificates) where this separation is done for security reasons.
- `forSignature` - (optional) In order to point the certificate at a different address, you must prove that you have control over that address by signing with its private key.