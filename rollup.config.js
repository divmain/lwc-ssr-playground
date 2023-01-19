// This config is used when running the dev server with live reload.

const lwc = require('@lwc/rollup-plugin');
const replace = require('@rollup/plugin-replace');
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');

const __ENV__ = process.env.NODE_ENV ?? 'development';

module.exports = (args) => ({
    input: 'src/entry-client.js',
    output: {
        file: 'dist/entry-client.js',
        format: 'esm',
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify(__ENV__),
            preventAssignment: true,
        }),
        lwc(),
        args.watch &&
            serve({
                open: false,
                port: 3000,
            }),
        args.watch && livereload(),
    ],
});
