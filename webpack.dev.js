const path = require('path');

const EnvironmentPlugin = require('webpack').EnvironmentPlugin;

module.exports = {
    mode: 'development',
    entry: './index.ts',
    devtool: 'source-map',
    output: { filename: 'bundle.js' },
    plugins: [
        new EnvironmentPlugin({
            DEV: true,
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader'],
                exclude: /node_modules/,
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, './public/'),
            publicPath: '/',
            watch: true
        },

        compress: true,
        port: 4040,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};
