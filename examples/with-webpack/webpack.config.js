import path from 'path';
import { NavitaPlugin } from "@navita/webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const isDevelopment = process.env.NODE_ENV !== "production";

export default {
  entry: './src/index.js',
  mode: isDevelopment ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-typescript',
            '@babel/preset-react'
          ],
          plugins: [
            isDevelopment && 'react-refresh/babel'
          ].filter(Boolean),
        }
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
  },
  output: {
    path: path.resolve('dist'),
    clean: true,
  },
  devtool: 'eval-source-map',
  devServer: {
    hot: true,
    devMiddleware: {
      writeToDisk: true
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join('src', 'index.html'),
    }),
    new MiniCssExtractPlugin(),
    new NavitaPlugin(),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  stats: true,
};
