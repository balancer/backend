import { describe, it, expect } from 'bun:test';
import { mergeArraysById } from './merge-arrays-by-id';
import _ from 'lodash';

// filepath: modules/helper/merge-arrays-by-id.test.ts

describe('mergeArraysById', () => {
    it('should merge two objects', () => {
        const obj1 = {
            propA: 'A',
            propB: 'B',
        };
        const obj2 = {
            propC: 'C',
        };
        const result = _.mergeWith(obj1, obj2, mergeArraysById);
        expect(result).toEqual({
            propA: 'A',
            propB: 'B',
            propC: 'C',
        });
    });
    it('should merge two arrays of objects with ids', () => {
        const objArray1 = {
            prop: [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' },
            ],
        };
        const objArray2 = {
            prop: [
                { id: 2, name: 'Robert' },
                { id: 3, name: 'Charlie' },
            ],
        };
        const result = _.mergeWith(objArray1, objArray2, mergeArraysById);

        expect(result.prop).toEqual([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Robert' },
            { id: 3, name: 'Charlie' },
        ]);
    });

    it('should overwrite with srcValue when merging an array of objects with ids and an array of numbers', () => {
        const objArray = { prop: { id: 1, name: 'Alice' } };
        const numArray = { prop: [1, 2, 3] };
        const result = _.mergeWith(objArray, numArray, mergeArraysById);

        expect(result.prop).toEqual([1, 2, 3]);
    });

    it('should overwrite with srcValue when merging an array of objects with ids and a single string', () => {
        const objArray = { prop: { id: 1, name: 'Alice' } };
        const str = { prop: 'hello' };
        const result = _.mergeWith(objArray, str, mergeArraysById);

        expect(result.prop).toEqual('hello');
    });

    it('should overwrite with srcValue when merging two arrays of numbers', () => {
        const numArray1 = { prop: [1, 2, 3] };
        const numArray2 = { prop: [4, 5, 6] };
        const result = _.mergeWith(numArray1, numArray2, mergeArraysById);

        expect(result.prop).toEqual([4, 5, 6]);
    });

    it('should return srcValue when merging an array with an empty array', () => {
        const objArray = { prop: [{ id: 1, name: 'Alice' }] };
        const emptyArray = { prop: [] };
        const result = _.mergeWith(objArray, emptyArray, mergeArraysById);

        expect(result.prop).toEqual([]);
    });

    it('should overwrite with srcValue when merging two arrays without ids', () => {
        const objArray1 = { prop: [{ name: 'Alice' }, { name: 'Bob' }] };
        const objArray2 = { prop: [{ name: 'Charlie' }] };
        const result = _.mergeWith(objArray1, objArray2, mergeArraysById);

        expect(result.prop).toEqual([{ name: 'Charlie' }]);
    });
});
