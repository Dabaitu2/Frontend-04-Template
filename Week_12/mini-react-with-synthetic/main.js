import MiniReact, { RENDER_TO_DOM } from './index';

const d = [
  'https://images.unsplash.com/photo-1602836831227-0eff587abd57?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1603270605862-d17a445f0cf7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1605152182393-89837947eecd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1604630720374-9ad1b6dd01e3?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
];

// class 组件就是正常wrapper之一，本身就是构造函数，会生成属于这个class的实例
class Carousel extends MiniReact.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentIndex: 0,
      nextIndex: 1,
    };
    this.autoPlay = this.autoPlay.bind(this);
    this.move = this.move.bind(this);
    this.down = this.down.bind(this);
    this.up = this.up.bind(this);
  }

  componentDidMount() {
    if (this.props.autoPlay) {
      console.log('[Carousel] AutoPlay: %c ON', 'color: green;');
      this.autoPlay();
    } else {
      console.log('[Carousel] AutoPlay:%c OFF', 'color: red;');
    }
  }

  autoPlay() {
    const length = this.props.src.length;
    setInterval(() => {
      this.setState({
        lastIndex: this.state.currentIndex,
        currentIndex: this.state.nextIndex,
        nextIndex: (this.state.nextIndex + 1) % length,
      });
    }, 3000);
  }

  down(event) {
    console.log('down');
    let target = event.target;
    target.addEventListener('mousemove', this.move);
    target.addEventListener('mouseup', this.up);
  }

  move(event) {
    console.log('move');
  }

  up(event) {
    console.log('up')
    let target = event.target;
    target.removeEventListener('mousemove', this.move);
    target.removeEventListener('mouseup', this.up);
  }

  componentDidUpdate() {
  }

  calculateTranslate(index) {
    if (index === this.state.currentIndex) {
      return index * 100;
    } else if (index === this.state.nextIndex) {
      return index * 100 - 100;
    } else if (index === this.state.lastIndex) {
      return index * 100 + 100
    } else {
      return 0;
    }
  }

  calculateZIndex(index) {
    if (index === this.state.currentIndex || index === this.state.nextIndex) {
      return 'show';
    } else
      return 'hidden';
  }


  // 对于真实的react, onmousedown实际上是 onMouseDown， 换了个名字是因为所有的事件都是synthetic event
  // 即合成事件，也就是所有的事件都交由 document 来处理了
  render() {
    let src = this.props.src.map(s => ({
      backgroundImage: `url('${s}')`,
    }));
    return (
      <div className={'carousel'} onmousedown={this.down}>
        {src.map((s, index) => (
          <div
            style={`
              background-image: ${s.backgroundImage};
              transform: translateX(${-this.calculateTranslate(index)}%);
              visibility: ${this.calculateZIndex(index)}; 
          `}
          />
        ))}
      </div>
    );
  }
}

RENDER_TO_DOM(<Carousel src={d} autoPlay={false} />, document.getElementById('app'));
