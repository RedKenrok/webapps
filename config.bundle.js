import bundle from './helpers/bundle.js'

await bundle([{
  entrypoints: 'src/home/app.css',
  outfile: 'docs/app.css',
}, {
  entrypoints: 'src/home/app.js',
  outfile: 'docs/app.js',
}, {
  entrypoints: 'src/toaln/app.css',
  outfile: 'docs/toaln/app.css',
}, {
  format: 'iife',
  entrypoints: 'src/toaln/app.js',
  outfile: 'docs/toaln/app.js',
}, {
  entrypoints: 'src/toaln/sw.js',
  outfile: 'docs/toaln/sw.js',
}], {
  watch: 'src/shared',
})
