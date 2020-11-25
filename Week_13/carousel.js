// 指的是图像的移动方向。比如 1->2 实际上是整体backward
import MiniReact from './index';

const Direction = {
  forward: 1,
  backward: -1,
};

// class 组件就是正常wrapper之一，本身就是构造函数，会生成属于这个class的实例
export class Carousel extends MiniReact.Component {
  constructor(props) {
    super(props);
    this.timer = null;
    this.state = {
      currentIndex: 0,
      nextIndex: 1,
      lastIndex: this.props.src.length - 1,
      startX: -1,
      moveX: 0,
      isActive: false,
      autoPlay: this.props.autoPlay,
      direction: Direction.backward
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.autoPlay && !!this.state.autoPlay) {
      this.autoPlay();
    }
  }

  componentDidMount() {
    if (this.state.autoPlay) {
      console.log('[Carousel] AutoPlay: %c ON', 'color: green;');
      this.autoPlay();
    } else {
      console.log('[Carousel] AutoPlay:%c OFF', 'color: red;');
    }
  }

  autoPlay = () => {
    const length = this.props.src.length;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      if (this.state.autoPlay) {
        this.setState({
          direction: Direction.backward,
          lastIndex: this.state.currentIndex,
          currentIndex: this.state.nextIndex,
          nextIndex: (this.state.nextIndex + 1) % length,
        });
        this.autoPlay();
      }
    }, 3000);
  };

  down = event => {
    document.addEventListener('mousemove', this.move);
    document.addEventListener('mouseup', this.up);
    this.setState({
      startX: event.clientX,
      isActive: true,
      autoPlay: false,
    });
  };

  move = event => {
    this.setState({
      moveX: Math.max(Math.min(event.clientX - this.state.startX, 400), -400),
    });
  };

  up = () => {
    const length = this.props.src.length;
    document.removeEventListener('mousemove', this.move);
    document.removeEventListener('mouseup', this.up);
    this.setState({
      startX: -1,
      moveX: 0,
      isActive: false,
      autoPlay: this.props.autoPlay,
      direction:
        this.state.moveX <= -150
          ? Direction.backward
          : this.state.moveX <= 0
          ? Direction.forward
          : this.state.moveX <= 150
            ? Direction.backward
            : Direction.forward,
      lastIndex:
        this.state.moveX < -150
          ? this.state.currentIndex
          : this.state.moveX > 150
          ? (this.state.lastIndex - 1 + length) % length
          : this.state.lastIndex,
      currentIndex:
        this.state.moveX < -150
          ? this.state.nextIndex
          : this.state.moveX > 150
          ? (this.state.currentIndex - 1 + length) % length
          : this.state.currentIndex,
      nextIndex:
        this.state.moveX < -150
          ? (this.state.nextIndex + 1) % length
          : this.state.moveX > 150
          ? (this.state.nextIndex - 1 + length) % length
          : this.state.nextIndex,
    });
  };

  calculateStyle = index => {
    return !this.state.isActive
      ? this.calculateAutoStyle(index)
      : this.calculateManualStyle(index);
  };

  calculateManualStyle = index => {
    if (this.state.currentIndex === 0) {
      if (index === this.state.lastIndex) {
        return `
            transform: translateX(-${index * 400 + 400 - this.state.moveX}px);
          `;
      }
    } else if (this.state.currentIndex === this.props.src.length - 1) {
      if (index === this.state.nextIndex) {
        return `
            transform: translateX(${400 + this.state.moveX}px);
          `;
      }
    }
    return `
      transform: translateX(${
      -this.state.currentIndex * 400 + this.state.moveX
    }px);
    `;
  };

  calculateAutoStyle = index => {
    return `
        position: relative;
        transition: ${this.calculateAutoTransition(index)};
        transform: translateX(${-this.calculateAutoTranslate(index)}%);
        z-index: ${this.calculateAutoZIndex(index)};
    `;
  };

  calculateAutoTranslate = index => {
    if (index === this.state.currentIndex) {
      return index * 100;
    } else if (index === this.state.nextIndex) {
      return index * 100 - 100;
    } else if (index === this.state.lastIndex) {
      return index * 100 + 100;
    } else {
      return this.state.currentIndex * 100;
    }
  };

  calculateAutoTransition = index => {
    if (index === this.state.currentIndex) {
      return '.5s ease';
    } else {
      if (this.state.direction === Direction.forward) {
        if (index === this.state.nextIndex) {
          return '.5s ease';
        }
      } else if (this.state.direction === Direction.backward) {
        if (index === this.state.lastIndex) {
          return '.5s ease';
        }
      }
      return '0';
    }
  };

  calculateAutoZIndex = index => {
    if (index === this.state.currentIndex) {
      return 2;
    } else if (index === this.state.nextIndex) {
      return 1;
    } else {
      return -1;
    }
  };

  // 对于真实的react, onmousedown实际上是 onMouseDown， 换了个名字是因为所有的事件都是synthetic event
  // 即合成事件，也就是所有的事件都交由 document 来处理了
  render() {
    let src = this.props.src.map(s => ({
      backgroundImage: `url('${s}')`,
    }));
    return (
      <div>
        <div className={'carousel'} onMouseDown={this.down}>
          {src.map((s, index) => (
            <div
              style={
                `background-image: ${s.backgroundImage};` +
                this.calculateStyle(index)
              }
            />
          ))}
        </div>
        <span>{this.state.moveX}</span>
      </div>
    );
  }
}
