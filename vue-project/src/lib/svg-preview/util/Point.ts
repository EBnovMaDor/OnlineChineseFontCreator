export default class Point {
    private _x: number = 0
    private _y: number = 0

    constructor(x: number = 0, y: number = 0) {
        this._x = x
        this._y = y
    }

    set x(x: number) {
        this._x = x
    }

    get x(): number {
        return this._x
    }

    set y(y: number) {
        this._y = y
    }

    get y(): number {
        return this._y
    }
}