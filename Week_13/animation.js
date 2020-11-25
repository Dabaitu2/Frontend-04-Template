const TICK = Symbol('tick');
const TICK_HANDLER = Symbol('tick_handler');
const ANIMATIONS = Symbol('animations');

export class Timeline {
  constructor() {
    this[ANIMATIONS] = new Set();
  }
  start() {
    let startTime = Date.now();
    this[TICK] = () => {
      for (let animation of this[ANIMATIONS]) {
        animation.receive(Date.now() - startTime);
      }
      requestAnimationFrame(this[TICK]);
    };
    this[TICK]();
  }
  pause() {}
  resume() {}
  reset() {}
  add(animation) {
    this[ANIMATIONS].add(animation);
  }
}

export class Animation {
  constructor(object, property, startValue, endValue, duration, delay, timingFunction) {
    this.object = object;
    this.property = property;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.delay = delay;
    this.timingFunction = timingFunction;
  }
  receive(time) {
    let range = (this.endValue - this.startValue);
    this.object[this.property] = this.startValue + range * time / this.duration;
  }
}


let tl = new Timeline();
tl.add
