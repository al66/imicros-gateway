var webpack = require('webpack');

module.exports = {
    plugins: [
        // ...
        new webpack.DefinePlugin({
          'process.env': {
            NODE_ENV: '"production"'
          }
        }),
        new webpack.ProvidePlugin({
            '$': "jquery",
            'jQuery': "jquery",
            'Popper': ['popper.js', 'default'],
            'Bootstrap': 'bootstrap'
        }),        
    ],
    entry: './src/main.js',
    output: {
        filename: './public/js/bundle.js'
    },
    resolve: {
      alias: {
        'vue': 'vue/dist/vue.common.js'
      }
    },    
    module: {
        // Special compilation rules
        loaders: [
            {
                // Ask webpack to check: If this file ends with .js, then apply some transforms
                test: /\.js$/,
                // Transform it with babel
                loader: 'babel-loader',
                // don't transform node_modules folder (which don't need to be compiled)
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                loaders: ['style-loader','css-loader']
            },
            {
                test: /\.png$/,
                loader: "url-loader?limit=100000"
            },
            {
                 test: /\.jpg$/,
                 loader: "file-loader"
            },
            {
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=application/font-woff'
            },
            {
                 test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                 loader: 'url-loader?limit=10000&mimetype=application/octet-stream'
            },
            {
                 test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                 loader: 'file-loader'
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
            }            
        ]
    },
    devServer: {
        host: '127.0.0.1',
        port: 4040,
    }
};