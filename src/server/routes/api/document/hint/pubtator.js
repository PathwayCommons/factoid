import _ from 'lodash';

import {
    Hint,
    HINT_TYPES
} from '../../../model/hint.js';

function map (bioCDocument) {
    let hints = [];

    const byText = annotation => {
        const sanitzed = text => text.toLowerCase();
        const { text } = annotation;
        return sanitzed(text);
    };

    const byAnnotation = annotation => {
        
        const isValidType = annotation => {
            const {infons: { type } } = annotation;
            return type === HINT_TYPES.ORGANISM;
        };

        const hasXref = annotation => {
            const { infons } = annotation;
            return _.has(infons, 'identifier');
        };

        return isValidType(annotation) && hasXref(annotation);
    };

}