const { error } = require('../../../util');

class Progression {
  constructor({ STAGES, canGoToStage, getStage, goToStage }){
    this.STAGES = {};

    STAGES.forEach( key => {
      this.STAGES[key] = key;
    } );

    if( STAGES[STAGES.length-1] !== 'COMPLETED' ){
      throw error('A Progression must have COMPLETED as the final stage');
    }

    this.ORDERED_STAGES = STAGES.slice();

    this.getStage = getStage;

    this.canGoToStage = canGoToStage;

    this.goToStage = goToStage;
  }

  getStageIndex( stage ){
    return this.ORDERED_STAGES.indexOf( stage );
  }

  getNextStage( stage ){
    return this.ORDERED_STAGES[ this.getStageIndex(stage) + 1 ];
  }

  getPrevStage( stage ){
    return this.ORDERED_STAGES[ this.getStageIndex(stage) - 1 ];
  }

  back(){
    this.goToStage( this.getPrevStage( this.getStage() ) );
  }

  forward(){
    this.goToStage( this.getNextStage( this.getStage() ) );
  }

  canGoBack(){
    return this.canGoToStage( this.getPrevStage( this.getStage() ) );
  }

  canGoForward(){
    return this.canGoToStage( this.getNextStage( this.getStage() ) );
  }
}

module.exports = Progression;
