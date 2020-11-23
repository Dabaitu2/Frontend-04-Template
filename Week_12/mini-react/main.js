import MiniReact from './index';

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
      a: 1,
    };
    this.clickHandler = this.clickHandler.bind(this);
  }
  clickHandler() {
    this.setState({
      a: this.state.a + 1,
    });
  }
  render() {
    let src = this.props.src.map(s => ({
      backgroundImage: `url('${s}')`,
    }));
    return (
      <div className={'carousel'} onClick={this.clickHandler}>
        {src.map(s => (
          <div style={`background-image: ${s.backgroundImage};`} />
        ))}
        <span>{this.state.a}</span>
        <div>{this.children}</div>
        <Hello />
      </div>
    );
  }
}

// 不管是函数式组件还是class, 最后都会被解释为function
// 由于函数式组件最后会返回一个jsx, 这个jsx转化为createElement之后的最后会返回新的某种Wrapper，这个Wrapper会成为新的构造函数。
// 最后 new 回来就是个内部正常实例，因此不会有这个函数本身的实例
// 这也印证了react官方所解释的, "无状态组件不会创建实例"
const Hello = () => {
  return <div>hi</div>;
};

MiniReact.RENDER_TO_DOM(
  <Carousel src={d}>
    <span>hello</span>
  </Carousel>,
  document.getElementById('app')
);
