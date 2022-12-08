import { ExampleInterface } from 'examples/example.interface';
import { Constructable, ContainerInstance, Inject, Service } from 'typedi';
import { CONTAINER_TOKEN, EXAMPLES_TOKEN } from './tokents';

export type Examples = Record<
  string,
  () => Promise<Constructable<ExampleInterface>>
>;

@Service()
export class ExampleLoader {
  constructor(
    @Inject(EXAMPLES_TOKEN) private readonly examples: Examples,
    @Inject(CONTAINER_TOKEN) private readonly container: ContainerInstance
  ) {}

  async loadExample(id: string): Promise<ExampleInterface> {
    if (this.container.has(id)) {
      return Promise.resolve(this.container.get(id));
    }

    return this.examples[id]().then((type: Constructable<ExampleInterface>) =>
      this.container.set({ id, type }).get<ExampleInterface>(id)
    );
  }
}
