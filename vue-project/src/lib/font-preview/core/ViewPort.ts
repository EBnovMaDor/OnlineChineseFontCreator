import GlobalManager from "../GlobalManager";

export default class ViewPort {
    // 视口自身的属性，坐标为世界坐标
    private _x: number = 0;  // 单位：myUnit
    private _y: number = 0;  // 单位：myUnit
    private _width: number = 0;  // 单位：myUnit，其中_height通过GUI的宽高比计算得到

    constructor(x: number = 0, y: number = 0, width: number = 300) {
        this._x = x
        this._y = y

        this._width = width
        this.setViewPortScale(width)
    }

    get x(): number {
        return this._x
    }

    get y(): number {
        return this._y
    }

    get width(): number {
        return this._width
    }

    get height(): number {
        return this.width / GlobalManager.instance.gui.canvasScale
    }

    public bufferCoordinateToNormalCoordinate(bufferX: number, bufferY: number): { normalX: number, normalY: number } {
        return {
            normalX: (bufferX - this._x) / this.width,
            normalY: (bufferY - this._y) / this.height
        }
    }

    public normalCoordinateToBufferCoordinate(normalX: number, normalY: number): { bufferX: number, bufferY: number } {
        return {
            bufferX: normalX * this.width + this._x,
            bufferY: normalY * this.height + this._y
        }
    }

    public bufferWidthToNormalWidth(bufferWidth: number): number {
        return bufferWidth / this.width
    }

    public bufferHeightToNormalHeight(bufferHeight: number): number {
        return bufferHeight / this.height
    }

    public normalWidthToBufferWidth(normalWidth: number): number {
        return normalWidth * this.width
    }

    public normalHeightToBufferHeight(normalHeight: number): number {
        return normalHeight * this.height
    }

    public setViewPortScale(width: number) {
        let { baseBuffer, gui } = GlobalManager.instance
        let microIncrement = 1e-4
        width = Math.max(baseBuffer.bufferWidth / 50, width)
        width = Math.min(width, baseBuffer.bufferWidth)
        width = Math.min(width, baseBuffer.bufferHeight * gui.canvasScale)
        if ((this.height + this.y - baseBuffer.minY) > (baseBuffer.bufferHeight - microIncrement)) {
            width = Math.min(width, (baseBuffer.bufferHeight - microIncrement - this.y + baseBuffer.minY) * gui.canvasScale)
        } else if ((this.width + this.x - baseBuffer.minX) > (baseBuffer.bufferWidth - microIncrement)) {
            width = Math.min(width, baseBuffer.bufferWidth - microIncrement - this.x + baseBuffer.minX)
        }
        this._width = width

        // 依据当前放缩结果对x和y进行限制，以防ViewBox超出当前世界边界
        this._x = Math.min(this._x, baseBuffer.maxX - this.width)
        this._x = Math.max(this._x, baseBuffer.minX)
        this._y = Math.min(this._y, baseBuffer.maxY - this.height)
        this._y = Math.max(this._y, baseBuffer.minY)
    }

    public setViewPortPos(x: number, y: number) {
        let baseBuffer = GlobalManager.instance.baseBuffer
        x = Math.min(x, baseBuffer.maxX - this.width)
        x = Math.max(x, baseBuffer.minX)
        this._x = x
        y = Math.min(y, baseBuffer.maxY - this.height)
        y = Math.max(y, baseBuffer.minY)
        this._y = y
    }

    public getViewPort(): { x: number, y: number, width: number, height: number } {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        }
    }

}