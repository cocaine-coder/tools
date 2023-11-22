export class Matrix {
    /**
     * 数据
     */
    private data: number[] = [];

    /**
     * 行数
     */
    readonly rows: number;

    /**
     * 列数
     */
    readonly cols: number;

    /**
     *
     */
    constructor(value: number[][] | {
        p: number[][],
        v: number[],
        rows: number,
        cols: number
    }) {
        if (value instanceof Array) {
            let numCol = -1;
            value.forEach(v => {
                if (v.length === 0) throw Error("matrix ctor col length is 0");
                if (numCol !== -1 && numCol !== v.length) throw Error("matrix ctor col length must same");

                this.data.push(...v);
            });

            this.rows = value.length;
            this.cols = value[0].length;
        } else {
            for (let i = 0; i < value.rows; i++) {
                for (let j = 0; j < value.cols; j++) {
                    let hasValue = false;
                    value.p.forEach((v, k) => {
                        if (v[0] === i && v[1] === j) {
                            this.data.push(value.v[k]);
                            hasValue = true;
                        }
                    });

                    if (!hasValue) this.data.push(0);
                }

            }

            this.rows = value.rows;
            this.cols = value.cols;
        }
    }

    static zero(rows: number, cols: number) {
        return new Matrix({ p: [], v: [], rows, cols });
    }

    static identity(order: number) {
        let p: number[][] = [];
        let v: number[] = [];
        for (let i = 0; i < order; i++) {
            p.push([i, i]);
            v.push(1);
        }

        return new Matrix({ p, v, rows: order, cols: order });
    }

    set(rol: number, col: number, val: number) {
        this.data[this.calIndex(rol, col)] = val;
    }

    get(rol: number, col: number) {
        return this.data[this.calIndex(rol, col)];
    }

    scaled(val: number) {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = this.data[i] * val;
        }
    }

    setRow(index: number, nums: number[]) {
        this.validRow(index);
        if (nums.length !== this.cols) throw Error("length of nums not equal cols");
        for (let i = 0; i < this.cols; i++) {
            this.data[index * this.cols + i] = nums[i];
        }
    }

    setCol(index: number, nums: number[]) {
        this.validCol(index);
        if (nums.length !== this.rows) throw Error("length of nums not equal rows");
        for (let i = 0; i < this.rows; i++) {
            this.data[index + i * this.cols] = nums[i];
        }
    }

    add(m: Matrix): Matrix {

    }

    sub(m: Matrix): Matrix {

    }

    transpose(): Matrix {

    }

    inverse(): Matrix {

    }

    mul(m: Matrix): Matrix {

    }

    private calIndex(rol: number, col: number) {
        this.validRowAndCol(rol, col);

        return rol * this.cols + col;
    }

    private validRowAndCol(rol: number, col: number) {
        this.validRow(rol);
        this.validCol(col);
    }

    private validRow(rol: number) {
        if (rol < 0 || rol >= this.rows)
            throw Error(`rol (${rol}) out of range (${this.rows})`);
    }

    private validCol(col: number) {
        if (col < 0 || col >= this.cols)
            throw Error(`rol (${col}) out of range (${this.cols})`);
    }
}

