import _ from 'lodash';
import h from 'react-hyperscript';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';

import { sendMail } from '../../util';
import logger from '../logger';
import DirtyComponent from './dirty-component';
import { tryPromise } from '../../util';

// Date formatting
const DATE_FORMAT = 'MMMM-dd-yyyy';
const getTimeSince = dateString => formatDistanceToNow( new Date( dateString ), { addSuffix: true } );
const toDateString = dateString => format( new Date( dateString ), DATE_FORMAT );
const toPeriodOrDate = dateString => {
  try {
    if ( !dateString ) return;
    const d = new Date( dateString );
    return isThisMonth( d ) ? getTimeSince( d ) : toDateString( d );
  } catch( e ){
    logger.error( `Error parsing date: ${e}`);
  }
};

class DocumentEmailButtonComponent extends DirtyComponent {
  constructor( props ){
    super( props );

    this.state = {
      sending: false
    };
  }

  handleEmail( e, doc ) {
    const emailType = e.target.value;

    tryPromise( () => new Promise( resolve => {
      this.setState({ sending: true }, resolve );
    }))
    .then( () => sendMail( emailType, doc, this.props.apiKey ) )
    .finally( () => new Promise( resolve => {
      this.setState({ sending: false }, resolve );
    }));
  }

  render(){
    let { doc, emailType, label, className, disableWhen } = this.props;
    const { emails } = doc.correspondence();
    const infos = _.filter( emails, { 'emailType': emailType } );
    const last = toPeriodOrDate( _.get( _.last( infos ), 'date' ) );
    const error = _.get( _.last( infos ), 'error' );

    const sendingComponent = h('small.mute', [
      h('span', ' Sending mail '),
      h('i.icon.icon-spinner.document-seeder-submit-spinner')
    ]);

    const getDoneSending = ( err, infos ) => {
      if( _.size( infos ) ){
        return h( 'small.mute', [
          h('span', ` ${_.size( infos )}`),
          h('span', ` | ${last}`),
          err ? h('span.invalid', ` | ${error.statusText}`): null
        ]);
      }
    };

    return h( 'div', { key: emailType, className }, [
      h( 'button.email-button', {
        value: emailType,
        onClick: e => this.handleEmail( e, doc ),
        disabled: this.state.sending || disableWhen
      }, label ),
      this.state.sending ? sendingComponent: getDoneSending( error, infos )
    ]);
  }
}

export default DocumentEmailButtonComponent;