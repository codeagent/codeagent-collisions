import { ContainerInstance, Token } from 'typedi';
import { Examples } from './loader';
import { RendererInterface } from './renderer.interface';

export const EXAMPLES_TOKEN = new Token<Examples>('EXAMPLES');
export const CONTAINER_TOKEN = new Token<ContainerInstance>('CONTAINER');
export const RENDERER_TOKEN = new Token<RendererInterface>('RENDERER');
export const COLORS_TOKEN = new Token<string[]>('COLORS');
