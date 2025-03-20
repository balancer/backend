import _ from 'lodash';

export const mergeArraysById = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue)) {
        return _.unionBy(
            objValue.map((obj) => {
                const match = srcValue.find((src: any) => src.id === obj.id);
                return match ? _.merge({}, obj, match) : obj;
            }),
            srcValue,
            'id',
        );
    }
};
