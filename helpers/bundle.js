import fs from 'fs'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'

const performBuilds = async (
  builds,
) => {
  return Promise.all(
    builds.map(
      async (buildOptions) => {
        try {
          const result = await Bun.build(buildOptions)
          if (!result.success) {
            console.warn('Build failed', result.logs)
            return
          }
        } catch (error) {
          console.error('Rebuild failed for', buildOptions.outfile, error)
        }
      },
    ),
  )
}

const bundle = async (
  builds,
  options,
) => {
  // For production add additional builds.
  if (isProduction) {
    const buildCount = builds.length
    for (let i = 0; i < buildCount; i++) {
      const buildOptions = Object.assign({}, builds[i], {
        define: {
          'process.env.NODE_ENV': "'production'",
        },
        drop: [
          'console',
          'debugger',
        ],
        minify: true,
      })

      // Append min suffix to file name for minified builds.
      const suffixes = []
      if (buildOptions.minify) {
        suffixes.push('min')
      }
      let filePath = buildOptions.outfile.split('.')
      filePath.splice(filePath.length - 1, 0, ...suffixes)
      buildOptions.outfile = filePath = filePath.join('.')

      builds.push(buildOptions)
    }
  }

  const watchedDirectories = new Set()
  if (options.watch) {
    if (Array.isArray(options.watch)) {
      for (const watchPath of options.watch) {
        watchedDirectories.add(watchPath)
      }
    } if (typeof (options.watch) === 'string') {
      watchedDirectories.add(options.watch)
    }
  }

  for (let i = builds.length - 1; i >= 0; i--) {
    let buildOptions = builds[i]

    if (
      !buildOptions.entrypoints
      || !buildOptions.outfile
    ) {
      console.warn('Bundle options are missing entrypoints or outfile properties.')
      // Remove from list.
      builds.splice(i, 1)
      continue
    }

    const outfile = path.parse(buildOptions.outfile)
    builds[i] = buildOptions = Object.assign({
      format: 'esm',
      minify: false,
      naming: "[dir]/" + outfile.base,
      outdir: outfile.dir,
      sourcemap: 'external',
      target: 'browser',
    }, buildOptions)

    if (!Array.isArray(buildOptions.entrypoints)) {
      buildOptions.entrypoints = [
        buildOptions.entrypoints,
      ]
    }

    if (!isProduction) {
      watchedDirectories.add(
        path.dirname(buildOptions.entrypoints[0]),
      )
    }
  }

  performBuilds(builds)
  console.log('Bundles build')

  if (!isProduction) {
    for (const watchDirectory of watchedDirectories) {
      fs.watch(watchDirectory, {
        recursive: true,
      }, async (_eventType, filename) => {
        if (
          !filename
          || (
            !filename.endsWith('.css')
            && !filename.endsWith('.js')
          )
        ) {
          return
        }

        console.log('Rebuilding bundles. File changed:', filename)
        await performBuilds(builds)
        console.log('Bundles rebuild')
      })
      console.log('Watching for file changes in:', watchDirectory)
    }
  }
}

export default async (
  files,
  options,
) => {
  if (!Array.isArray(files)) {
    files = [
      files,
    ]
  } else {
    files = files.flat()
  }
  await bundle(
    files,
    options,
  )
}
