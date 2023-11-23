interface IMatrixOptions {
    type: "dense" | "sparse" | "base"
}

interface IMatrixSparseOptions extends IMatrixOptions {
    type: "sparse",
    p: number[][],
    v: number[],
    rows: number,
    cols: number
}

interface IMatrixDenseOptions extends IMatrixOptions {
    type: "dense",
    values: number[][]
}

interface IMatrixBaseOptions extends IMatrixOptions {
    type: "base",
    data: number[],
    rows: number,
    cols: number,
}

export default class Matrix {
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
    constructor(options: IMatrixSparseOptions | IMatrixDenseOptions | IMatrixBaseOptions) {
        if (options.type === 'dense') {
            let numCol = -1;
            const { values } = options;
            options.values.forEach(v => {
                if (v.length === 0)
                    throw Error("matrix ctor col length is 0");
                if (numCol !== -1 && numCol !== v.length)
                    throw Error("matrix ctor col length must same");

                this.data.push(...v);
                numCol = v.length;
            });

            this.rows = values.length;
            this.cols = values[0].length;

        } else {
            if (options.rows <= 0 || options.cols <= 0)
                throw Error(`matrix rows and cols must greater than 0`);

            if (options.type === 'sparse') {
                for (let i = 1; i <= options.rows; i++) {
                    for (let j = 1; j <= options.cols; j++) {
                        let hasValue = false;
                        options.p.forEach((p, k) => {
                            if (p[0] === i && p[1] === j) {
                                this.data.push(options.v[k]);
                                hasValue = true;
                            }
                        });

                        if (!hasValue) this.data.push(0);
                    }
                }

                this.rows = options.rows;
                this.cols = options.cols;
            } else {
                if (options.rows <= 0 || options.cols <= 0)
                    throw Error(`matrix rows and cols must greater than 0`);

                if (options.data.length != options.rows * options.cols)
                    throw Error(`matrix rows and cols error`);

                this.data.push(...options.data);
                this.rows = options.rows;
                this.cols = options.cols;
            }
        }
    }

    /**
     * 创建0阵
     * @param rows 行数
     * @param cols 列数
     * @returns 
     */
    static zero(rows: number, cols: number) {
        return new Matrix({
            type: 'base',
            data: new Array<number>(rows * cols).fill(0),
            rows,
            cols
        });
    }

    /**
     * 创建单位阵
     * @param order 行列数 
     * @returns 
     */
    static identity(order: number) {
        const ret = Matrix.zero(order, order);
        for (let i = 1; i <= order; i++) {
            ret.set(i, i, 1);
        }

        return ret;
    }

    /**
     * 设置值
     * @param row 行号 从1开始
     * @param col 列号 从1开始
     * @param val 数据
     */
    set(row: number, col: number, val: number) {
        this.data[this.calIndex(row, col)] = val;
    }

    /**
     * 获取值
     * @param row 行号 从1开始
     * @param col 列号 从1开始
     * @returns 值
     */
    get(row: number, col: number) {
        return this.data[this.calIndex(row, col)];
    }

    /**
     * 设置某一行数据
     * @param index 行号 从1开始
     * @param nums 数据
     */
    setRow(index: number, nums: number[]) {
        this.validRow(index);
        if (nums.length !== this.cols)
            throw Error("length of nums not equal cols");

        for (let i = 1; i <= this.cols; i++) {
            this.set(index, i, nums[i - 1]);
        }
    }

    /**
     * 获取某一行数据
     * @param index 行号 从1开始
     * @returns 行数据
     */
    getRow(index: number) {
        this.validRow(index);

        return this.data.slice((index - 1) * this.cols, index * this.cols);
    }

    /**
     * 设置某一列数据
     * @param index 列号 从1开始
     * @param nums 
     */
    setCol(index: number, nums: number[]) {
        this.validCol(index);
        if (nums.length !== this.rows)
            throw Error("length of nums not equal rows");

        for (let row = 1; row <= this.rows; row++) {
            this.set(row, index, nums[row - 1]);
        }
    }

    /**
     * 获取某一列数据
     * @param index 列号 从1开始
     * @returns 列数据
     */
    getCol(index: number) {
        this.validCol(index);

        const ret: number[] = [];
        for (let row = 1; row <= this.rows; row++) {
            ret.push(this.get(row, index));
        }

        return ret;
    }

    /**
     * 自身倍化
     * @param val 倍数
     * @returns 自身 self
     */
    scaled(val: number) {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = this.data[i] * val;
        }

        return this;
    }

    /**
     * 复制一个新的矩阵对象
     * @returns 矩阵对象
     */
    clone() {
        return new Matrix({
            type: 'base',
            data: this.data.concat([]),
            rows: this.rows,
            cols: this.cols
        });
    }

    /**
     * 矩阵相加
     * @param m 另一个矩阵 
     * @returns 矩阵相加结果 (新的矩阵对象)
     */
    add(m: Matrix): Matrix {
        if (this.rows !== m.rows || this.cols !== m.cols)
            throw Error(`matrix row or col not match`);

        const clone = this.clone();
        for (let row = 1; row <= this.rows; row++) {
            for (let col = 1; col <= this.cols; col++) {
                clone.set(row, col, clone.get(row, col) + m.get(row, col));
            }
        }

        return clone;
    }

    /**
     * 矩阵相减
     * @param m 另一个矩阵 
     * @returns 矩阵相减结果 (新的矩阵对象)
     */
    sub(m: Matrix): Matrix {
        return this.add(m.clone().scaled(-1));
    }

    /**
     * 矩阵相乘
     * @param m 另一个矩阵 
     * @returns 矩阵相乘结果 (新的矩阵对象)
     */
    mul(m: Matrix): Matrix {
        if (this.cols !== m.rows)
            throw Error(`mul: matrix not match`);

        const ret = Matrix.zero(this.rows, m.cols);

        for (let row = 1; row <= this.rows; row++) {
            for (let col = 1; col <= m.cols; col++) {
                const rowData = this.getRow(row);
                const colData = m.getCol(col);

                ret.set(row, col,
                    rowData.reduce((p, c, index) => p + c * colData[index], 0));
            }
        }

        return ret;
    }

    /**
     * 求转置矩阵
     * @returns 转置矩阵 (新的矩阵对象)
     */
    transpose(): Matrix {
        const ret = Matrix.zero(this.cols, this.rows);

        for (let row = 1; row <= this.rows; row++) {
            const rowData = this.getRow(row);
            ret.setCol(row, rowData);
        }

        return ret;
    }

    /**
     * 余子式
     * @param row 跳过行号 从1开始
     * @param col 跳过列号 从1开始
     * @returns 新矩阵对象
     */
    firstMinor(row: number, col: number): Matrix {
        this.validRowAndCol(row, col);
        this.validSquare();

        const data: number[] = [];

        for (let r = 1; r <= this.rows; r++) {
            if (r === row) continue;

            for (let c = 1; c <= this.cols; c++) {
                if (c === col) continue;

                data.push(this.get(r, c));
            }
        }


        return new Matrix({
            type: 'base',
            data,
            rows: this.rows - 1,
            cols: this.cols - 1
        });
    }

    /**
     * 行列式
     * @returns 
     */
    det(): number {
        this.validSquare();

        let ret = 0;
        if (this.cols > 2) {
            for (let col = 1; col <= this.cols; col++) {
                ret += Math.pow(-1, 1 + col) *
                    this.get(1, col) *
                    this.firstMinor(1, col).det();
            }
        }
        else if (this.cols === 2) {
            ret = this.get(1, 1) * this.get(2, 2) -
                this.get(1, 2) * this.get(2, 1);
        }
        else {
            ret = this.get(1, 1);
        }

        return ret;
    }

    /**
     * 伴随矩阵
     * @returns 
     */
    adjoint(): Matrix {
        this.validSquare();

        const m = Matrix.zero(this.rows, this.cols);

        for (let row = 1; row <= this.rows; row++) {
            for (let col = 1; col <= this.cols; col++) {
                m.set(row, col,
                    Math.pow(-1, row + col) * this.firstMinor(row, col).det());
            }
        }

        return m.transpose();
    }

    /**
     * 逆矩阵
     * @throws
     * @returns matrix det is zero, can not inverse
     */
    inverse(): Matrix {
        const det = this.det();
        if (Math.abs(det) < 0.000001)
            throw Error("matrix det is zero, can not inverse");

        return this.adjoint().scaled(1 / det);
    }

    /**
     * 计算行列对应的下标
     * @param row 行
     * @param col 列
     * @returns 数据下标
     */
    private calIndex(row: number, col: number) {
        this.validRowAndCol(row, col);

        return (row - 1) * this.cols + col - 1;
    }

    /**
     * 验证是否为方阵
     * @param rols 行数
     * @param cols 列数
     */
    private validSquare(rols?: number, cols?: number) {
        rols ??= this.rows;
        cols ??= this.cols;

        if (rols !== cols) throw Error(`matrix is not square`);
    }

    /**
     * 验证行和列是否合法
     * @param rol 行
     * @param col 列
     */
    private validRowAndCol(rol: number, col: number) {
        this.validRow(rol);
        this.validCol(col);
    }

    private validRow(rol: number) {
        if (rol <= 0 || rol > this.rows)
            throw Error(`rol (${rol}) out of range (${this.rows})`);
    }

    private validCol(col: number) {
        if (col <= 0 || col > this.cols)
            throw Error(`rol (${col}) out of range (${this.cols})`);
    }
}