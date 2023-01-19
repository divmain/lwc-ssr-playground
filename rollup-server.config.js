// This config is used when running `server.js`.

const lwc = require('@lwc/rollup-plugin');
const replace = require('@rollup/plugin-replace');
const alias = require('@rollup/plugin-alias');

const simpleRollupConfig = require('./rollup.config.js');

const __ENV__ = process.env.NODE_ENV ?? 'development';

module.exports = [
    // Client-only build.
    simpleRollupConfig({ watch: false }),

    // Client build to rehydrate after SSR.
    {
        input: 'src/entry-client-ssr.js',
        output: {
          file: 'dist/entry-rehydrate.js',
          format: 'cjs'
        },
        plugins: [
          lwc(),
          replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            preventAssignment: true,
          }),
        ],
        watch: {
          exclude: ["node_modules/**"]
        }
      },

    // Component code only, for import during server-side rendering.
    {
        input: 'src/app.js',
        output: {
          file: 'dist/app.js',
          format: 'cjs',
        },
        external: [/node_modules/],
        // external: ['lwc'],
        plugins: [
          alias({
            entries: [{
              find: 'lwc',
              replacement: require.resolve('@lwc/engine-server'),
            }],
          }),
          replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            preventAssignment: true,
          }),
          lwc(),
        ].filter(Boolean),
        watch: {
          exclude: ["node_modules/**"]
        }
      },
];
