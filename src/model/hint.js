import _ from 'lodash';

const HINT_TYPE = Object.freeze({
    ORGANISM: 'organism'
});
const HINT_TYPES = _.flatMap(HINT_TYPE);

const HINT_PASSAGE = Object.freeze({
    TITLE: 'title',
    ABSTRACT: 'abstract'
});
const HINT_PASSAGES = _.flatMap(HINT_PASSAGE);

/**
 * Class representing a Hint.
 */
class Hint{

    /**
     * Create a Hint.
     * @param {string} text - The hint text.
     * @param {string} type - The hint type.
     * @param {Object} xref - The hint xref.
     * @param {string} section - The hint section.
     */
    constructor(text, type, xref, section){
        this._text = text;
        this._type = type;
        this._xref = xref;
        this._section = section;
    }

    /**
     * Get the hint text.
     * @returns {string} The hint text.
     */
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
