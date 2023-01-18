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

export default {
  input: 'src/index.ts',
  context: 'self',
  onwarn,
  output: [
    {
      file: `dist/bundle/${pkg.name}.js`,
      format: 'iife',
      name: 'rbPhys2dRenderer',
      sourcemap: true,
      globals: {
        'rb-phys2d': 'rbPhys2d',
      },
    },
    {
      file: `dist/bundle/${pkg.name}.min.js`,
      format: 'iife',
      name: 'rbPhys2dRenderer',
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
