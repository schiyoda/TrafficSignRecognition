import React from 'react';
import PropTypes from 'prop-types';
import { JsonLinkInline } from 'watson-react-components';

export default class JsonComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: props.show || false,
    };

    this.onShow = this.onShow.bind(this);
  }

  onShow() {
    this.setState({ show: !this.state.show });
  }

  render() {
    return (
      <JsonLinkInline
        json={this.props.item}
        onShow={this.onShow}
        onExit={this.onShow}
        showJson={this.state.show}
        description={this.props.description}
      />
    );
  }

}

JsonComponent.defaultProps = {
  show: false,
  children: null,
  item: null,
  description: null,
};

JsonComponent.propTypes = {
  show: PropTypes.bool,
  children: PropTypes.object, // eslint-disable-line
  item: PropTypes.object, // eslint-disable-line
  description: PropTypes.element,
};

