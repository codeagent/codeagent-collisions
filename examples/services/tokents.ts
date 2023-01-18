import { RendererInterface } from 'rb-phys2d-renderer';
import { ContainerInstance, Token } from 'typedi';

import { Examples } from './loader';

export const EXAMPLES_TOKEN = new Token<Examples>('EXAMPLES');
export const CONTAINER_TOKEN = new Token<ContainerInstance>('CONTAINER');
export const RENDERER_TOKEN = new Token<RendererInterface>('RENDERER');
