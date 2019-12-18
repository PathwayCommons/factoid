import _ from 'lodash';
import h from 'react-hyperscript';
import React from 'react';
import { format, formatDistanceToNow, isThisMonth } from 'date-fns';

import { sendMail } from '../../util';
import logger from '../logger';
import DirtyComponent from './dirty-component';
import { tryPromise } from '../../util';

class SendingComponent extends React.Component {
  render() {
    return h('small.mute', [
      h('span', ' Working... '),
      h('i.icon.icon-spinner.document-seeder-submit-spinner')
    ]);
  }
}

class DocumentButtonComponent extends DirtyComponent {
  constructor( props ){
    super( props );

    this.state = {
      sending: false
    };
  }

  doWork( params, value ) {
    return Promise.resolve( { params, value } );
  }

  onDoneWork() {
    return null;
  }

  handleClick( params, value ) {
    tryPromise( () => new Promise( resolve => {
      this.setState({ sending: true }, resolve );
    }))
    .then(() => this.doWork( params, value ) )
    .finally( () => new Promise( resolve => {
      this.setState({ sending: false }, resolve );
    }));
  }

  render(){
    let { label, disableWhen, params, buttonKey: key, value, className } = this.props;
    return h( 'span', { key, className }, [
      h( 'button', {
        value,
        onClick: e => this.handleClick( params, e.target.value ),
        disabled: this.state.sending || disableWhen
      }, [ label ]),
      this.state.sending ? h( SendingComponent ): this.onDoneWork( params, value )
    ]);
  }
}

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

class DocumentEmailButtonComponent extends DocumentButtonComponent {
  constructor( props ){
    super( props );
  }

  doWork( params, value ) {
    const emailType = value;
    const { doc, apiKey } = params;
    return sendMail( emailType, doc, apiKey );
  }

  onDoneWork( params, value ){
    const { doc } = params;
    const { emails } = doc.correspondence();
    const infos = _.filter( emails, { 'emailType': value } );
    const last = toPeriodOrDate( _.get( _.last( infos ), 'date' ) );
    const error = _.get( _.last( infos ), 'error' );
    if( _.size( infos ) ){
      return h( 'small.mute', [
        h('span', ` ${_.size( infos )}`),
        h('span', ` | ${last}`),
        error ? h('span.invalid', ` | ${error.statusText}`): null
      ]);
    } else {
      return null;
    }
  }
}

class DocumentRefreshButtonComponent extends DocumentButtonComponent {
  constructor( props ){
    super( props );
  }

  doWork( params ) {
    const url = '/api/document';
    return fetch( url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( params )
    });
  }
}


export {
  DocumentEmailButtonComponent,
  DocumentRefreshButtonComponent
};