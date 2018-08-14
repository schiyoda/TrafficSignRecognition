import React from 'react';
import PropTypes from 'prop-types';

/**
 * Get Coordinates for div element of classified image
 * Originally found here:
 * http://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document#answer-26230989
 * @param {Object} elem Div element for classified image
 */
const getCoords = (elem) => { // crossbrowser version
  const box = elem.getBoundingClientRect();

  const body = document.body;
  const docEl = document.documentElement;

  const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

  const clientTop = docEl.clientTop || body.clientTop || 0;
  const clientLeft = docEl.clientLeft || body.clientLeft || 0;

  const top = (box.top + scrollTop) - clientTop;
  const left = (box.left + scrollLeft) - clientLeft;

  return { top: Math.round(top), left: Math.round(left) };
};

/**
 * Transform Box Locations relative to image container
 * @param {Array} boxes List of boxes to draw for faces
 * @param {Object} image Classified Image
 */
const transformBoxLocations = (boxes = [], image) => {
  const transformedBoxes = [];
  const coordinates = getCoords(image);
  const ratio = image.getBoundingClientRect().width / image.naturalWidth || 1;
  boxes.forEach((box) => {
    transformedBoxes.push({
      width: box.width * ratio,
      height: box.height * ratio,
      top: coordinates.top + (box.top * ratio),
      left: coordinates.left + (box.left * ratio),
    });
  });
  return transformedBoxes;
};


export default class ClassifiedImage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      boxes: props.boxes,
    };

    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    setTimeout(() => {
      this.handleResize();
    }, 0);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    if (document.querySelector('.output--image')) {
      this.setState({
        boxes: transformBoxLocations(this.props.boxes, document.querySelector('.output--image')),
      });
    }
  }

  render() {
    return (
      <div>
        <div className="image--container">
          <img
            alt="Classified results"
            className="output--image"
            src={this.props.image.url || this.props.image.image_data}
          />
        </div>
        {this.state.boxes ? <Boxes boxes={this.state.boxes} /> : null }
      </div>
    );
  }

}

ClassifiedImage.defaultProps = {
  boxes: null,
};

ClassifiedImage.propTypes = {
  image: PropTypes.shape({
    url: PropTypes.string,
    image_data: PropTypes.string,
  }).isRequired,
  boxes: PropTypes.arrayOf(PropTypes.object),
};

/**
 * Returns dimensions of a box for face
 * @param {Object} box Box coordinates
 */
const boxLocationAsPx = box => ({
  height: `${box.height}px`,
  left: `${box.left}px`,
  top: `${box.top}px`,
  width: `${box.width}px`,
});

/**
 * Draw Boxes for faces based on their location returned by classifier
 * @param {Object} data Contains locations of faces
 */
const Boxes = data => (
  <div className=".boxes">
    {data.boxes.map(item => (<div key={`${item.left}-${item.top}`} className="box-location" style={boxLocationAsPx(item)} />))}
  </div>
);
