# Installing a Certificate
Once a certificate has been issued, it needs to be installed in order for it to become valid. This is done by encoding the certificate data into a target PNG file, which is now digitally signed and certified. Because of how the data is encoded, it is recommended that you only attempt to digitally sign NFTs which are at least 64x64 in size. Also this process currently only works for PNGs since its a lossless format, so JPEGs cannot be signed and certified using NFTLS at this time.

## NFT Certificates
When a certificate is issued for an NFT, the certificate file is returned to the requestor who can then install the certificate into their image file.

### Example 1: Installing an NFT Certificate
```bash
# the certificate that was issued to you for your NFT.
YOUR_CERT=nft_token.cert.json

# the original NFT image that you used in your CSR.
YOUR_NFT_IMAGE=my_nft.png

# the digitally signed and certified image that you will publish to the blockchain.
YOUR_SIGNED_NFT=my_nft.signed.png

nftls install YOUR_CERT \
    --image YOUR_NFT_IMAGE
    --o YOUR_SIGNED_NFT
```

After installing the certificate, NFTLS will automatically attempt to verify it (offline by default) to ensure all properties are correct. The installation will fail if you attempt to install the certificate into an image file that is different than the one from the CSR, or if the image file is too small.