export default {
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        // exclude: /(node_modules)/,
        use: ["style-loader", "css-loader", "sass-loader"], // order of loaders is important
      },
    ],
  },
};
