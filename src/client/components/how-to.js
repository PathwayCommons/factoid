const React = require('react');
const { Component } = React;
const h = require('react-hyperscript');
const Tooltip = require('./tooltip');

class HowTo extends Component {
  constructor( props ){
    super( props );

    let viewed = JSON.parse( localStorage.getItem('viewedHowTo') || false );

    this.state = Object.assign( {
      src: '/how-to.mp4',
      points: [
        { time: 0, description: 'Create and match biological entities' },
        { time: 19, description: 'Create interactions' },
        { time: 29, description: 'Submit' }
      ],
      viewed,
      viewedAtInit: viewed,
      loaded: false
    }, props );
  }

  goToPoint( pt ){
    this.video.currentTime = pt;

    this.video.play();
  }

  close(){
    this.video.pause();

    localStorage.setItem('viewedHowTo', true);

    this.setState({ viewed: true });
  }

  componentDidMount(){
    let vid = this.video;

    if( vid ){
      vid.addEventListener('loadeddata', () => {
        if( vid.readyState >= 2 ){
          this.setState({ loaded: true });
        }
      });
    }
  }

  render(){
    let s = this.state;

    if( s.viewed ){
      return h('div.how-to-already-viewed');
    }

    return h('div.how-to' + (s.viewed ? '.how-to-viewed' : ''), [
      h('div.how-to-bg', {
        onClick: () => this.close()
      }),
      h('div.how-to-content', [
        h('h3.how-to-title', 'Getting started'),
        h('video.how-to-video', {
          src: s.src,
          ref: video => this.video = video,
          autoPlay: true,
          controls: false
        }),
        h('i.how-to-spinner.icon.icon-spinner' + (s.loaded ? '.how-to-spinner-loaded' : '')),
        h('div.how-to-points', s.points.map( (pt, i) => h(Tooltip, {
          description: pt.description,
          tippy: { position: 'bottom' }
        }, [
          h('button.how-to-point', {
            onClick: () => this.goToPoint( pt.time )
          }, [
            h('span.how-to-point-index', i + 1)
          ])
        ]) )),
        h('button.how-to-close', {
          onClick: () => this.close()
        }, 'Close')
      ])
    ]);
  }
}

module.exports = HowTo;
