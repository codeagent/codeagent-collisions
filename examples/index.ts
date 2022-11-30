/// <reference path="./declarations.d.ts" />

import { animationFrames, fromEvent } from 'rxjs';
import { Constructable } from 'typedi';
import { configureContainer, MouseControl, World } from 'js-physics-2d';
import { map, startWith, switchMap, tap } from 'rxjs/operators';

import { Profiler, canvas, clear, drawWorld, projMat } from './services';
import { ExampleInterface } from './example.interface';

const container = configureContainer({});

const examples: Record<string, () => Promise<Constructable<ExampleInterface>>> =
  {
    chain: () => import('./chain.example').then((e) => e['ChainExample']),
    pendulum: () =>
      import('./pendulum.example').then((e) => e['PendulumExample']),
    stairs: () => import('./stairs.example').then((e) => e['StairsExample']),
    stack: () => import('./stack.example').then((e) => e['StackExample']),
    gauss: () => import('./gauss.example').then((e) => e['GaussExample']),
    joint: () => import('./joint.example').then((e) => e['JointExample']),
    suspension: () =>
      import('./suspension.example').then((e) => e['SuspensionExample']),
    helix: () => import('./helix.example').then((e) => e['HelixExample']),
    piston: () => import('./piston.example').then((e) => e['PistonExample']),
    mesh: () => import('./mesh.example').then((e) => e['MeshExample']),
    pinball: () => import('./pinball.example').then((e) => e['PinballExample']),
    gears: () => import('./gears.example').then((e) => e['GearsExample']),
    gjk: () => import('./gjk.example').then((e) => e['GjkExample']),
    toi: () => import('./toi.example').then((e) => e['ToiExample']),
    epa: () => import('./epa.example').then((e) => e['EpaExample']),
    ccd: () => import('./ccd.example').then((e) => e['CcdExample']),
    manifold: () =>
      import('./manifold.example').then((e) => e['ManifoldExample']),
  };

type ExampleId = keyof typeof examples;

const loadExample = async (id: ExampleId): Promise<ExampleInterface> => {
  if (container.has(id)) {
    return Promise.resolve(container.get<ExampleInterface>(id));
  }
  return examples[id]().then((type: Constructable<ExampleInterface>) =>
    container.set({ id, type }).get(type)
  );
};

let example: ExampleInterface;
let profiler = container.get(Profiler);
let world = container.get(World);
let control = new MouseControl(world, projMat);
control.attach(canvas);

fromEvent(self.document.querySelectorAll('.nav-link'), 'click')
  .pipe(
    map((e: MouseEvent) => (e.target as HTMLAnchorElement).id),
    startWith('joint'),
    tap((id) => {
      document
        .querySelectorAll('.nav-link')
        .forEach((e) => e.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }),
    switchMap((id: ExampleId) => loadExample(id))
  )
  .subscribe((e) => {
    if (example) {
      example.uninstall();
    }
    example = e;
    example.install();
  });

const dt = 1.0 / 60.0;

animationFrames().subscribe(() => {
  clear();

  profiler.begin('step');
  world.step(dt);
  profiler.end('step');

  profiler.begin('draw');
  drawWorld(world);
  profiler.end('draw');
});

profiler.listen('draw', 'step').subscribe((e) => {
  document.getElementById('step').innerHTML = `${e.step.toFixed(2)}`;
  document.getElementById('draw').innerHTML = `${e.draw.toFixed(2)}`;
});
