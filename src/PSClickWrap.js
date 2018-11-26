/* global _ps */
import React from 'react';
import PropTypes from 'prop-types';
import isRequiredIf from 'react-proptype-conditional-require';
import PSSnippet from './PSSnippet';

class PSClickWrap extends React.Component {
  constructor(props) {
    super(props);
    this.createClickWrap = this.createClickWrap.bind(this);
    this.state = {
      clickwrapGroupKey: null,
      dynamicGroup: false,
    };
    const { psScriptUrl, accessId, testMode, disableSending, dynamic, signerId } = this.props;
    if (!PSSnippet.isSnippetLoaded(psScriptUrl)) {
      PSSnippet.injectSnippet(psScriptUrl);
    }
    _ps('create', accessId, {
      test_mode: testMode,
      disable_sending: disableSending,
      dynamic,
      signer_id: signerId,
    });
  }

  componentDidMount() {
    this.createClickWrap();
  }

  componentDidUpdate(prevProps) {
    const {
      clickWrapStyle, renderData, filter, groupKey,
    } = this.props;
    const { clickwrapGroupKey, dynamicGroup } = this.state;
    if (clickWrapStyle !== prevProps.clickWrapStyle && !dynamicGroup) {
      _ps.getByKey(clickwrapGroupKey).site.set('style', clickWrapStyle);
      _ps.getByKey(clickwrapGroupKey).retrieveHTML();
    }
    if (renderData !== prevProps.renderData) {
      _ps(`${clickwrapGroupKey}:retrieveHTML`, renderData);
    }
    if (clickWrapStyle !== prevProps.clickWrapStyle && dynamicGroup) {
      this.createClickWrap();
    }
    if (filter !== prevProps.filter && dynamicGroup) {
      this.createClickWrap();
    }
    if (groupKey !== prevProps.groupKey && !dynamicGroup) {
      this.createClickWrap();
      _ps.getByKey(clickwrapGroupKey).retrieveHTML();
    }
  }

  componentWillUnmount() {
    const { groupKey } = this.props;
    if (_ps && _ps.getByKey(groupKey) && _ps.getByKey(groupKey).rendered) {
      _ps.getByKey(groupKey).rendered = false;
    }
  }

  setEventListeners(groupKey) {
    const { onAgree, onValid, onInvalid, onSent } = this.props;
    if (onAgree) {
      _ps.on('sent', (event, parameters, group) => {
        if (event === 'agreed' && group.get('key') === groupKey) {
          onAgree(parameters, group);
        }
      });
    }
    if (onValid) {
      _ps.on('valid', (parameters, context) => {
        if (context.get('key') === groupKey) {
          onValid(parameters, context);
        }
      });
    }
    if (onInvalid) {
      _ps.on('invalid', (parameters, context) => {
        if (context.get('key') === groupKey) {
          onInvalid(parameters, context);
        }
      });
    }
    if (onSent) {
      _ps.on('sent', (event, parameters, group) => {
        if (group.get('key') === groupKey) {
          onSent(event, parameters, group);
        }
      });
    }
  }


  createClickWrap() {
    const { filter, containerId, signerIdSelector, clickWrapStyle, displayAll, renderData, displayImmediately, forceScroll, groupKey, confirmationEmail } = this.props;
    const options = { filter, container_selector: containerId, confirmation_email: confirmationEmail, signer_id_selector: signerIdSelector, style: clickWrapStyle, display_all: displayAll, render_data: renderData, auto_run: displayImmediately, force_scroll: forceScroll };
    if (groupKey) {
      this.setState({ clickwrapGroupKey: groupKey, dynamicGroup: false });
      _ps('load', groupKey, { ...options,
        event_callback: (err, group) => {
          if (group) {
            this.setState({ clickwrapGroupKey: groupKey });
            group.render();
            this.setEventListeners(groupKey);
          }
        } });
    } else {
      _ps('load', {
        ...options,
        event_callback: (err, group) => {
          if (group) {
            this.setState({
              clickwrapGroupKey: group.get('key'),
              dynamicGroup: true,
            });
            this.setEventListeners(group.get('key'));
          }
        },
      });
    }
  }


  render() {
    const { containerId } = this.props;
    return <div id={containerId} />;
  }
}

PSClickWrap.FILTER_OR_GROUPKEY_REQUIRED_ERROR_MESSAGE = 'PSClickWrap Error: You must provide either a groupKey or filter prop in order to use the PactSafe ClickWrap component!';
PSClickWrap.MUST_PROVIDE_RENDER_DATA_ERROR_MESSAGE = 'PSClickWrap Error: You must provide a renderData prop when passing down the dynamic prop';
PSClickWrap.MUST_PROVIDE_SIGNER_ID_OR_SIGNER_ID_SELECTOR = 'PSClickWrap Error: You must provide either a signer ID or a signer ID selector';

PSClickWrap.propTypes = {
  accessId: PropTypes.string.isRequired,
  clickWrapStyle: PropTypes.oneOf([
    'full',
    'scroll',
    'checkbox',
    'combined',
    'embedded',
  ]),
  confirmationEmail: PropTypes.bool,
  disableSending: PropTypes.bool,
  displayAll: PropTypes.bool,
  displayImmediately: PropTypes.bool,
  dynamic: PropTypes.bool,
  containerId: PropTypes.string,
  filter: isRequiredIf(
    PropTypes.string,
    props => !props.hasOwnProperty('groupKey'),
    PSClickWrap.FILTER_OR_GROUPKEY_REQUIRED_ERROR_MESSAGE,
  ),
  forceScroll: PropTypes.bool,
  groupKey: isRequiredIf(
    PropTypes.string,
    props => !props.hasOwnProperty('filter'),
    PSClickWrap.FILTER_OR_GROUPKEY_REQUIRED_ERROR_MESSAGE,
  ),
  psScriptUrl: PropTypes.string,
  renderData: isRequiredIf(
    PropTypes.object,
    props => props.hasOwnProperty('dynamic') && props.dynamic === true,
    PSClickWrap.MUST_PROVIDE_RENDER_DATA_ERROR_MESSAGE,
  ),
  signerIdSelector: isRequiredIf(
    PropTypes.string,
    props => !props.hasOwnProperty('signerId'),
    PSClickWrap.MUST_PROVIDE_SIGNER_ID_OR_SIGNER_ID_SELECTOR,
  ),
  signerId: isRequiredIf(
    PropTypes.string,
    props => !props.hasOwnProperty('signerIdSelector'),
    PSClickWrap.MUST_PROVIDE_SIGNER_ID_OR_SIGNER_ID_SELECTOR,
  ),
  testMode: PropTypes.bool,
  onValid: PropTypes.func,
  onInvalid: PropTypes.func,
  onSent: PropTypes.func,
  onAgree: PropTypes.func,
};

PSClickWrap.defaultProps = {
  confirmationEmail: false,
  psScriptUrl: '//vault.pactsafe.io/ps.min.js',
  containerId: 'ps-clickwrap',
  displayImmediately: true,
  disableSending: false,
  displayAll: true,
  dynamic: false,
  testMode: false,
};

export default PSClickWrap;
