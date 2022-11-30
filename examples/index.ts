/// <reference path="./declarations.d.ts" />

import { animationFrames, fromEvent } from 'rxjs';
import { configureContainer, MouseControl, World } from 'js-physics-2d';
import { map, startWith } from 'rxjs/operators';

import { Profiler, canvas, clear, drawWorld, projMat } from './services';

import { ChainExample } from './chain.example';
import { ExampleInterface } from './example.interface';
import { PendulumExample } from './pendulum.example';
import { StairsExample } from './stairs.example';
import { StackExample } from './stack.example';
import { GaussExample } from './gauss.example';
import { JointExample } from './joint.example';
import { SuspensionExample } from './suspension.example';
import { HelixExample } from './helix.example';
import { PistonExample } from './piston.example';
import { MeshExample } from './mesh.example';
import { PinballExample } from './pinball.example';
import { GearsExample } from './gears.example';
import { GjkExample } from './gjk.example';
import { ToiExample } from './toi.example';
import { EpaExample } from './epa.example';
import { CcdExample } from './ccd.example';
import { ManifoldExample } from './manifold.example';

const container = configureContainer({
  islandGenerator: 'sole',
});
container.set({ id: 'chain', type: ChainExample });
container.set({ id: 'pendulum', type: PendulumExample });
container.set({ id: 'stairs', type: StairsExample });
container.set({ id: 'stack', type: StackExample });
container.set({ id: 'gauss', type: GaussExample });
container.set({ id: 'joint', type: JointExample });
container.set({ id: 'suspension', type: SuspensionExample });
container.set({ id: 'helix', type: HelixExample });
container.set({ id: 'piston', type: PistonExample });
container.set({ id: 'mesh', type: MeshExample });
container.set({ id: 'pinball', type: PinballExample });
container.set({ id: 'gears', type: GearsExample });
container.set({ id: 'gjk', type: GjkExample });
container.set({ id: 'toi', type: ToiExample });
container.set({ id: 'epa', type: EpaExample });
container.set({ id: 'ccd', type: CcdExample });
container.set({ id: 'manifold', type: ManifoldExample });

let example: ExampleInterface;
let profiler = container.get(Profiler);
let world = container.get(World);
let control = new MouseControl(world, projMat);
control.attach(canvas);

fromEvent(self.document.querySelectorAll('.nav-link'), 'click')
  .pipe(
    map((e: MouseEvent) => (e.target as HTMLAnchorElement).id),
    startWith('joint')
  )
  .subscribe((id) => {
    document
      .querySelectorAll('.nav-link')
      .forEach((e) => e.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    if (example) {
      example.uninstall();
    }
    example = container.get(id);
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
