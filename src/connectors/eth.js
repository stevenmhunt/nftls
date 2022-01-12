async function etherscanClientFactory(/* apiKey, env */) {
    return {
    // online lookup functions go here...
        async locateCertificate(/* name, address */) {
            // no idea how this works yet...
        },
    };
}

module.exports = etherscanClientFactory;
