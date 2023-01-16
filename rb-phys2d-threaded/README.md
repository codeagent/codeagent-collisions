# Librirary for launching rb-phys2d physics engine in seperate thread

work in progress

## Build

1. Compile `rb-phys2d` library: `npm run build:clean; npm run build:cjs; npm run build:esm; npm run build:types; npm run build:bundle`
2. Build worker for `rb-phys2d-threaded` library: `npm run build:clean; npm run build:worker`
3. Compile `rb-phys2d-threaded` with running these commands: `npm run build:cjs; npm run build:esm; npm run build:types; npm run build:bundle`
