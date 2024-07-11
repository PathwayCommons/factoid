import _ from 'lodash';

//import { ENTITY_TYPE } from './entity-type.js';

const HINT_TYPE = Object.freeze({
    ORGANISM: 'organism'
});
const HINT_TYPES = _.flatMap(HINT_TYPE);


const HINT_PASSAGE = Object.freeze({
    TITLE: 'title',
    ABSTRACT: 'abstract'
});
const HINT_PASSAGES = _.flatMap(HINT_PASSAGE);

class Hint{

    get text(){
        return this._text;
    }

    set text(value){
        this._text = value;
    }

    get type(){
        return this._type;
    }

    set type(value){
        if( value != HINT_TYPES.ORGANISM){
            throw new Error('Invalid type' + value);
        }
        this._type = value;
    }

    get xref(){
        return this._xref;
    }

    set xref(value){
        if (!value.dbPrefix || !value.id){
            throw new Error('Invalid xref' + JSON.stringify(value));
        }
        this._xref = value;
    }

    get section(){
        return this._section;
    }

    set section(value){
        if( value != HINT_PASSAGES.TITLE && value != HINT_PASSAGES.ABSTRACT){
            throw new Error('Invalid section' + value);
        }
        this._section = value;
    }


}
export { 
    Hint, 
    HINT_TYPES, 
    HINT_PASSAGES 
};
