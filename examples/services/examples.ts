/** Don't edit this file! It was generated automaticaly */

import { Constructable } from 'typedi';

import { ExampleInterface } from '../example.interface';

export default {
  ccd: (): Promise<Constructable<ExampleInterface>> =>
    import('../ccd.example').then(e => e.CcdExample),
  chain: (): Promise<Constructable<ExampleInterface>> =>
    import('../chain.example').then(e => e.ChainExample),
  conveyor: (): Promise<Constructable<ExampleInterface>> =>
    import('../conveyor.example').then(e => e.ConveyorExample),
  gauss: (): Promise<Constructable<ExampleInterface>> =>
    import('../gauss.example').then(e => e.GaussExample),
  gears: (): Promise<Constructable<ExampleInterface>> =>
    import('../gears.example').then(e => e.GearsExample),
  helix: (): Promise<Constructable<ExampleInterface>> =>
    import('../helix.example').then(e => e.HelixExample),
  joint: (): Promise<Constructable<ExampleInterface>> =>
    import('../joint.example').then(e => e.JointExample),
  material: (): Promise<Constructable<ExampleInterface>> =>
    import('../material.example').then(e => e.MaterialExample),
  mesh: (): Promise<Constructable<ExampleInterface>> =>
    import('../mesh.example').then(e => e.MeshExample),
  pendulum: (): Promise<Constructable<ExampleInterface>> =>
    import('../pendulum.example').then(e => e.PendulumExample),
  pinball: (): Promise<Constructable<ExampleInterface>> =>
    import('../pinball.example').then(e => e.PinballExample),
  piston: (): Promise<Constructable<ExampleInterface>> =>
    import('../piston.example').then(e => e.PistonExample),
  stack: (): Promise<Constructable<ExampleInterface>> =>
    import('../stack.example').then(e => e.StackExample),
  stairs: (): Promise<Constructable<ExampleInterface>> =>
    import('../stairs.example').then(e => e.StairsExample),
  suspension: (): Promise<Constructable<ExampleInterface>> =>
    import('../suspension.example').then(e => e.SuspensionExample),
};
