import _ from 'lodash';

export const mergeArraysById = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue) && _.isArray(srcValue)) {
        const objHasId = objValue[0] && typeof objValue[0] === 'object' && 'id' in objValue[0];
        const srcHasId = srcValue[0] && typeof srcValue[0] === 'object' && 'id' in srcValue[0];

        // If both arrays are objects with ids -> merge by id
        if (objHasId && srcHasId) {
            return _.unionBy(
                objValue.map((obj) => {
                    const match = srcValue.find((src: any) => src.id === obj.id);
                    return match ? _.mergeWith({}, obj, match, mergeArraysById) : obj;
                }),
                srcValue,
                'id',
            );
        }

        // Otherwise, just use srcValue (overwrite)
        return srcValue;
    }
};
