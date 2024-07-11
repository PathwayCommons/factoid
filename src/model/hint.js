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
