module.exports = {
    apps: [{
        name: "sdp-server",
        script: "dist/index.js",

        // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
        args: 'one two',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }],

    deploy: {
        production: {
            user: 'node',
            host: 'ocean-node',
            ref: 'origin/master',
            repo: "https://github.com/delude88/digitalstage-webrtc-prototype.git",
            path: '/node/digitalstage-proto',
            'post-deploy': 'cd server && npm install && npm run build && pm2 reload ecosystem.config.js --env production'
        }
    }
};
