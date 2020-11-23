import {createElement, Component} from './framework';
import {RENDER_TO_DOM} from './dom';

export * from './dom';
export * from './framework';
export default class MiniReact {
  static createElement = createElement;
  static RENDER_TO_DOM = RENDER_TO_DOM;
  static Component = Component;
}
