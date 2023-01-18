import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

const onwarn = (warning, warn) => {
  // skip circular dependency warnings
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    return;
  }

  warn(warning);
};

const stringifySourcePlugin = () => {
  return {
    name: 'stringify-source',

    generateBundle(options, bundle) {
      for (const name in bundle) {
        bundle[name].code = `export default ${JSON.stringify(
          bundle[name].code
        )};`;
      }
    },
  };
};

export default process.env.BUILD === 'worker'
  ? {
      input: 'src/host/index.ts',
      context: 'self',
      onwarn,
      output: [
        {
          file: `dist/bundle/worker.js`,
          format: 'es',
          sourcemap: true,
        },
        {
          file: `dist/bundle/worker.min.js`,
          format: 'es',
          sourcemap: true,
          plugins: [terser()],
        },
        {
          file: `src/proxy/worker-source.ts`,
          format: 'es',
          sourcemap: false,
          plugins: [stringifySourcePlugin(), terser()],
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        typescript({ tsconfig: __dirname + '/tsconfig.worker.json' }),
      ],
    }
  : {
      input: 'src/index.ts',
      context: 'self',
      onwarn,
      output: [
        {
          file: `dist/bundle/${pkg.name}.js`,
          format: 'iife',
          name: 'rbPhys2dThreaded',
          sourcemap: true,
          globals: {
            'rb-phys2d': 'rbPhys2d',
          },
        },
        {
          file: `dist/bundle/${pkg.name}.min.js`,
          format: 'iife',
          name: 'rbPhys2dThreaded',
          sourcemap: true,
          plugins: [terser()],
          globals: {
            'rb-phys2d': 'rbPhys2d',
          },
        },
      ],
      external: ['rb-phys2d'],
      plugins: [
        resolve(),
        commonjs(),
        typescript({ tsconfig: __dirname + '/tsconfig.esm.json' }),
      ],
    };
