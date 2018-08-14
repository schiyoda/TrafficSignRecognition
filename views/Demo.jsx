import React from 'react';
import { ImagePicker, Icon } from 'watson-react-components';

import { classifyImage } from './utilities/request';
import Output from './Output';

const lists = [
  "00000", "00001", "00002", "00003", "00004", "00005", "00006", "00007", "00008", "00009",
  "00010", "00011", "00012", "00013", "00014", "00015", "00016", "00017", "00018"
];

const sampleImages = lists.map(i => ({
  url: `/images/samples/${i}.jpg`,
  alt: `Sample-${i}`,
}));

const TYPE_FILE = 1;
const TYPE_TILE = 0;
const TYPE_URL = 2;
const ACCEPTED_FORMATS =
  '.png, .gif, .jpg, .jpeg, image/png, image/x-png, image/gif, image/jpeg, image/jpg';

export default class Demo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      selectedImage: null,
      loading: false,
      fileError: null,
      urlError: null,
      error: null,
    };

    this.onClickTile = this.onClickTile.bind(this);
    this.onDropAccepted = this.onDropAccepted.bind(this);
    this.onDropRejected = this.onDropRejected.bind(this);
    this.onUrlSubmit = this.onUrlSubmit.bind(this);
    this.onClassify = this.onClassify.bind(this);
    this.onError = this.onError.bind(this);
    this.onClosePreview = this.onClosePreview.bind(this);
  }

  onClickTile({ url }) {
    this.onClassify({ url }, TYPE_TILE);
  }

  onClassify(image, errorType) {
    classifyImage(image)
      .then((data) => {
        this.setState({
          data,
          loading: false,
          selectedImage: image,
        });
      })
      .catch((error) => {
        let errorMessage =
          'There was a problem with the request, please try again';
        if (error.responseJSON && error.responseJSON.error) {
          errorMessage = error.responseJSON.error;
        }
        this.onError(error.status === 0 ? null : errorMessage, errorType);
        this.setState({
          loading: false,
          data: null,
          selectedImage: null,
        });
      });

    this.setState({
      loading: true,
      error: null,
      fileError: null,
      urlError: null,
      data: null,
      selectedImage: image,
    });
  }

  onDropAccepted(file) {
    const reader = new FileReader();
    const self = this;
    reader.onload = () => {
      self.onClassify({ image_data: reader.result }, TYPE_FILE);
    };

    reader.onabort = () => console.log('File reading was aborted');
    reader.onerror = () => console.log('File reading has failed');

    reader.readAsDataURL(file);
  }

  onDropRejected(image) {
    if (
      image.type !== 'image/png' &&
      image.type !== 'image/x-png' &&
      image.type !== 'image/jpeg' &&
      image.type !== 'image/jpg' &&
      image.type !== 'image/gif'
    ) {
      this.onError('Only JPGs, PNGs, and GIFs are supported', 1);
    }
  }

  onClosePreview() {
    this.setState({
      data: null,
    });
  }

  onUrlSubmit({ url }) {
    this.onClassify({ url }, TYPE_URL);
  }

  /**
   * @param errorType  is 0, 1, or 2, where 0 = error, 1 = fileError, 2 = urlError
   */
  onError(errorMessage, errorType) {
    if (typeof errorType === 'undefined') {
      errorType = 0;
    }
    this.setState({
      error: errorType === 0 ? errorMessage : null,
      fileError: errorType === 1 ? errorMessage : null,
      urlError: errorType === 2 ? errorMessage : null,
    });
  }

  render() {
    return (
      <div className="_container _container_small">
        <ImagePicker
          images={sampleImages}
          onClickTile={this.onClickTile}
          onClosePreview={this.onClosePreview}
          onDropAccepted={this.onDropAccepted}
          onDropRejected={this.onDropRejected}
          onUrlSubmit={this.onUrlSubmit}
          onUrlInputChange={this.onUrlInputChange}
          selectedImage={this.state.selectedImage}
          userImage={this.state.userImage}
          error={this.state.error}
          fileError={this.state.fileError}
          urlError={this.state.urlError}
          accept={ACCEPTED_FORMATS}
        />
        {this.state.loading ? (
          <div className="loader--container">
            <Icon type="loader" size="large" />
            <p className="base--p">
              Watson is classifying the image to determine a match...
            </p>
          </div>
        ) : (
          <Output data={this.state.data} image={this.state.selectedImage} />
        )}
      </div>
    );
  }
}

Demo.defaultProps = {
  loading: false,
  error: null,
  data: null,
};

Demo.propTypes = {};
