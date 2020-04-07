module.exports = {
    webpack: (config, {isServer}) => {
        config.plugins = config.plugins || [];

        // Fixes npm packages that depend on `fs` module
        if (!isServer) {
            config.node = {
                fs: "empty"
            };
        }
        config.externals = config.externals || {};
        config.externals['styletron-server'] = 'styletron-server';
        return config;
    },
    env: {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        SERVER_URL: process.env.SERVER_URL,
        SERVER_PORT: process.env.SERVER_PORT
    }
};
