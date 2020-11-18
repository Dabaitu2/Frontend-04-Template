import { Component, createElement } from './framework';
import { RENDER_TO_DOM } from './dom';

const d = [
  'https://images.unsplash.com/photo-1602836831227-0eff587abd57?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1603270605862-d17a445f0cf7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1605152182393-89837947eecd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
  'https://images.unsplash.com/photo-1604630720374-9ad1b6dd01e3?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixlib=rb-1.2.1&q=80&w=800',
];

class Carousel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      a: 1,
    };
  }
  render() {
    let src = this.props.src.map(s => ({
      backgroundImage: `url('${s}')`,
    }));
    return (
      <div className={'carousel'} onClick={() => {
        this.setState({
          a: this.state.a + 1,
        });
      }}>
        {src.map(s => (
          <div
            style={`background-image: ${s.backgroundImage};`}
          />
        ))}
        <span>{this.state.a}</span>
        <div>{this.children}</div>
      </div>
    );
  }
}

RENDER_TO_DOM(
  <Carousel src={d}>
    <span>hello</span>
  </Carousel>,
  document.getElementById('app')
);
