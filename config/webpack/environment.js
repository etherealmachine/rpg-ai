const { environment } = require('@rails/webpacker')

environment.loaders.append("css", {
  test: /\.css$/,
  use: ['style-loader', 'astroturf/css-loader']
});
environment.loaders.append("tsx", {
  test: /\.tsx?$/,
  use: ['astroturf/loader'],
})

module.exports = environment
