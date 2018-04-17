import {execSync} from 'child_process';
import path from 'path';


// Build JSON URL map - you could move this to a custom build script
// that writes the URL map to a file and then just import/require it
// in here instead of generating it whenever webpack is executed
const urlMap = JSON.parse(execSync('flask url_map_to_json', {
    env: Object.assign({FLASK_APP: 'app.py'}, process.env),
}));


export default {
    mode: 'development',
    devtool: 'source-map',
    entry: './js/app.js',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        // enable the flask-urls babel plugin and provide it
                        // with our flask URL map
                        plugins: [['flask-urls', {urlMap}]]
                    }
                }
            }
        ]
    },
    output: {
        path: path.resolve(__dirname, 'static/dist'),
        filename: 'app.bundle.js'
    }
};
