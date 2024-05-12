import Konva from "konva";
import type BaseBufferElement from "../base-buffer-element/interface/BaseBufferElement";
import type GUIElement from "../gui-element/interface/GUIBaseElement";

export default class BaseBuffer {
    // 当前世界坐标中最大的x,y值
    private _minStorageX: number = 0;  // 单位：myUnit
    private _minStorageY: number = 0;  // 单位：myUnit
    private _maxStorageX: number = 400;  // 单位：myUnit
    private _maxStorageY: number = 400;  // 单位：myUnit

    private _elements: Map<string | number, BaseBufferElement> = new Map<string | number, BaseBufferElement>();

    private _verticalGrid: Konva.Line | null = null
    private _horizontalGrid: Konva.Line | null = null

    constructor() {

    }

    addBaseBufferElement(element: BaseBufferElement) {
        let bbox = element.boudingBox
        if (bbox.minX < this._minStorageX) this._minStorageX = bbox.minX
        if (bbox.minY < this._minStorageY) this._minStorageY = bbox.minY
        if (bbox.maxX > this._maxStorageX) this._maxStorageX = bbox.maxX
        if (bbox.maxY > this._maxStorageY) this._maxStorageY = bbox.maxY
        this._elements.set(element.konvaElement._id, element)
    }

    deleteBaseBufferElement(element: BaseBufferElement) {
        let idx = element.konvaElement._id
        this._elements.delete(idx)
    }

    get bufferWidth(): number {
        return (this._maxStorageX - this._minStorageX) * 2
    }

    get bufferHeight(): number {
        return (this._maxStorageY - this._minStorageY) * 2
    }

    // 世界坐标中的边界x,y值
    get minX(): number {
        return this._minStorageX - this.bufferWidth / 4
    }

    get minY(): number {
        return this._minStorageY - this.bufferHeight / 4
    }

    get maxX(): number {
        return this._maxStorageX + this.bufferWidth / 4
    }

    get maxY(): number {
        return this._maxStorageY + this.bufferHeight / 4
    }

    get elements() {
        return this._elements
    }

    get verticalGrid() {
        return this._verticalGrid
    }

    get horizontalGrid() {
        return this._horizontalGrid
    }

    set verticalGrid(value: Konva.Line | null) {
        this._verticalGrid = value
    }

    set horizontalGrid(value: Konva.Line | null) {
        this._horizontalGrid = value
    }

    set maxStorageY(maxStorageY:number){
        this._maxStorageY = maxStorageY
    }
}