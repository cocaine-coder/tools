import Matrix from "../libs/matrix";

import { describe, test, expect } from 'vitest';


describe("matrix", () => {
    test("ctor get set", () => {
        const m1 = new Matrix({ type: 'base', data: [1, 0, 0, 1], rows: 2, cols: 2 });
        const m2 = new Matrix({ type: 'dense', values: [[1, 0], [0, 1]] });
        const m3 = new Matrix({ type: 'sparse', p: [[1, 1], [2, 2]], v: [1, 1], rows: 2, cols: 2 });

        expect(() => new Matrix({ type: 'base', data: [1, 2, 3], rows: 2, cols: 2 })).toThrowError();
        expect(() => new Matrix({ type: 'base', data: [], rows: 0, cols: 0 }));
        expect(() => new Matrix({ type: 'dense', values: [[1, 2], [1]] })).toThrowError();

        expect(m1.rows).toBe(2);
        expect(m1.cols).toBe(2);

        expect(m2.rows).toBe(2);
        expect(m2.cols).toBe(2);

        expect(m3.rows).toBe(2);
        expect(m3.cols).toBe(2);

        expect(m1.get(1, 1)).toBe(1);
        expect(m1.get(1, 2)).toBe(0);
        expect(m1.get(2, 1)).toBe(0);
        expect(m1.get(2, 2)).toBe(1);

        expect(m2.get(1, 1)).toBe(1);
        expect(m2.get(1, 2)).toBe(0);
        expect(m2.get(2, 1)).toBe(0);
        expect(m2.get(2, 2)).toBe(1);

        expect(m3.get(1, 1)).toBe(1);
        expect(m3.get(1, 2)).toBe(0);
        expect(m3.get(2, 1)).toBe(0);
        expect(m3.get(2, 2)).toBe(1);

        m1.set(1, 2, 1);
        m2.set(1, 2, 1);
        m3.set(1, 2, 1);

        expect(m1.get(1, 2)).toBe(1);
        expect(m2.get(1, 2)).toBe(1);
        expect(m3.get(1, 2)).toBe(1);

        expect(() => m1.set(3, 3, 0)).toThrowError();
        expect(() => m1.get(3, 3)).toThrowError();
    });

    test("zero", () => {
        const m = Matrix.zero(2, 2);
        expect(m.rows).toBe(2);
        expect(m.cols).toBe(2);

        expect(m.get(1, 1)).toBe(0);
        expect(m.get(1, 2)).toBe(0);
        expect(m.get(2, 1)).toBe(0);
        expect(m.get(2, 2)).toBe(0);
    });

    test('identity', () => {
        const m = Matrix.identity(2);

        expect(m.rows).toBe(2);
        expect(m.cols).toBe(2);

        expect(m.get(1, 1)).toBe(1);
        expect(m.get(1, 2)).toBe(0);
        expect(m.get(2, 1)).toBe(0);
        expect(m.get(2, 2)).toBe(1);
    });

    test("getRow setRow getCol setCol", () => {
        const m = Matrix.identity(2);

        expect(m.getRow(1)).deep.equal([1, 0]);
        expect(m.getCol(2)).deep.equal([0, 1]);

        m.setRow(1, [2, 2]);
        expect(m.get(1, 1)).toBe(2);
        expect(m.get(1, 2)).toBe(2);

        m.setCol(1, [3, 3]);
        expect(m.get(1, 1)).toBe(3);
        expect(m.get(2, 1)).toBe(3);

        expect(() => m.setRow(1, [])).toThrowError();
        expect(() => m.setCol(1, [])).toThrowError();
        expect(() => m.setRow(3, [1, 2, 3])).toThrowError();
        expect(() => m.setCol(3, [1, 2, 3])).toThrowError();
    });

    test("scaled", () => {
        const m = Matrix.identity(2);
        const m1 = m.scaled(2);

        expect(m.get(1, 1)).toBe(2);
        expect(m.get(1, 2)).toBe(0);
        expect(m.get(2, 1)).toBe(0);
        expect(m.get(2, 2)).toBe(2);

        expect(m).toBe(m1);
    });

    test('clone', () => {
        const m = Matrix.identity(2);
        const mCopy = m.clone();

        expect(m).not.toBe(mCopy);
        expect(m.get(1, 1)).toBe(mCopy.get(1, 1));
        expect(m.get(1, 2)).toBe(mCopy.get(1, 2));
        expect(m.get(2, 1)).toBe(mCopy.get(2, 1));
        expect(m.get(2, 2)).toBe(mCopy.get(2, 2));
    });

    test('add', () => {
        const m = Matrix.identity(2);
        const mCopy = m.clone();

        const ret = m.add(mCopy);

        expect(m.get(1, 1)).toBe(1);
        expect(m.get(1, 2)).toBe(0);
        expect(m.get(2, 1)).toBe(0);
        expect(m.get(2, 2)).toBe(1);

        expect(ret.get(1, 1)).toBe(2);
        expect(ret.get(1, 2)).toBe(0);
        expect(ret.get(2, 1)).toBe(0);
        expect(ret.get(2, 2)).toBe(2);
    });

    test('sub', () => {
        const m = Matrix.identity(2);
        const mCopy = m.clone();

        const ret = m.sub(mCopy);

        expect(ret.get(1, 1)).toBe(0);
        expect(ret.get(1, 2)).toBe(0);
        expect(ret.get(2, 1)).toBe(0);
        expect(ret.get(2, 2)).toBe(0);
    });

    test('mul', () => {
        const m1 = new Matrix({
            type: 'dense', values: [
                [1, 1],
                [2, 2],
                [1, 1]]
        });
        const m2 = new Matrix({
            type: 'dense', values: [
                [1, 1, 1, 1],
                [2, 2, 2, 2]]
        });

        expect(() => m2.mul(m1)).toThrowError();

        const ret = m1.mul(m2);

        expect(ret.rows).toBe(3);
        expect(ret.cols).toBe(4);

        expect(ret.get(1, 1)).toBe(3);
        expect(ret.get(1, 2)).toBe(3);
        expect(ret.get(1, 3)).toBe(3);
        expect(ret.get(1, 4)).toBe(3);
        expect(ret.get(2, 1)).toBe(6);
        expect(ret.get(2, 2)).toBe(6);
        expect(ret.get(2, 3)).toBe(6);
        expect(ret.get(2, 4)).toBe(6);
        expect(ret.get(3, 1)).toBe(3);
        expect(ret.get(3, 2)).toBe(3);
        expect(ret.get(3, 3)).toBe(3);
        expect(ret.get(3, 4)).toBe(3);
    });

    test("transpose", () => {
        const m = new Matrix({
            type: 'dense', values: [
                [1, 2],
                [3, 4]]
        });

        const ret = m.transpose();

        expect(ret.rows).toBe(2);
        expect(ret.cols).toBe(2);

        expect(ret.get(1, 1)).toBe(1);
        expect(ret.get(1, 2)).toBe(3);
        expect(ret.get(2, 1)).toBe(2);
        expect(ret.get(2, 2)).toBe(4);
    });

    test("firstMinor", () => {
        const m = new Matrix({
            type: 'dense', values: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]
        });

        let ret = m.firstMinor(1, 1);

        expect(ret.rows).toBe(2);
        expect(ret.cols).toBe(2);

        expect(ret.get(1, 1)).toBe(5);
        expect(ret.get(1, 2)).toBe(6);
        expect(ret.get(2, 1)).toBe(8);
        expect(ret.get(2, 2)).toBe(9);

        ret = m.firstMinor(1, 2);
        expect(ret.get(1, 1)).toBe(4);
        expect(ret.get(1, 2)).toBe(6);
        expect(ret.get(2, 1)).toBe(7);
        expect(ret.get(2, 2)).toBe(9);

        ret = m.firstMinor(2, 2);
        expect(ret.get(1, 1)).toBe(1);
        expect(ret.get(1, 2)).toBe(3);
        expect(ret.get(2, 1)).toBe(7);
        expect(ret.get(2, 2)).toBe(9);
    });

    test("det", () => {
        let ret = new Matrix({
            type: 'dense', values: [
                [0, 1, 0],
                [2, 15, 3],
                [1, 41, 2]
            ]
        }).det();
        expect(ret).toBe(-1);

        ret = new Matrix({
            type: 'dense', values: [
                [0, 1],
                [2, 15]
            ]
        }).det();
        expect(ret).toBe(-2);

        ret = new Matrix({
            type: 'dense', values: [
                [1]
            ]
        }).det();
        expect(ret).toBe(1);


        ret = new Matrix({
            type: 'dense', values: [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 16]
            ]
        }).det();
        expect(ret).toBe(0);
    });

    test('inverse', () => {
        let ret = new Matrix({
            type: 'dense', values: [
                [1, 2],
                [-1, -3]
            ]
        }).inverse();

        expect(ret.get(1, 1)).toBe(3);
        expect(ret.get(1, 2)).toBe(2);
        expect(ret.get(2, 1)).toBe(-1);
        expect(ret.get(2, 2)).toBe(-1);
    });
});