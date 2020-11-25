import MiniReact, { RENDER_TO_DOM } from './index';
import { Carousel } from './carousel';

const d = [
  'https://images.unsplash.com/photo-1602836831227-0eff587abd57?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1603270605862-d17a445f0cf7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1605152182393-89837947eecd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1604630720374-9ad1b6dd01e3?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
];

RENDER_TO_DOM(
  <Carousel src={d} autoPlay={true} />,
  document.getElementById('app')
);
