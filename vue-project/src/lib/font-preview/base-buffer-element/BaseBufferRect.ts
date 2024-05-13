import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import GlobalManager from "../GlobalManager";
import Point from "../util/Point";
import { decorateShape } from "../util/DecoratedShape";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";

export default class BaseBufferRect implements BaseBufferElement {
    private _konvaElement: Konva.Rect;
    config: BaseBufferElementConfig;

    /** attributes */
    private _leftTop: Point;
    private _width: number = 0
    private _height: number = 0

    constructor(point: Point, width: number, height: number,
        konvaGroup: Konva.Group = GlobalManager.instance.gui.pointGroup,
        config: BaseBufferElementConfig = { fill: '', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {

        this._leftTop = point;
        this._width = width
        this._height = height

        let { gui, viewPort } = GlobalManager.instance

        let { normalX, normalY } = viewPort.bufferCoordinateToNormalCoordinate(this._leftTop.x, this._leftTop.y)
        let normalWidth = viewPort.bufferWidthToNormalWidth(this._width)
        let normalHeight = viewPort.bufferHeightToNormalHeight(this._height)

        let konvaElement = new Konva.Rect({
            x: normalX * gui.canvasWidth,
            y: normalY * gui.canvasHeight,
            width: normalWidth * gui.canvasWidth,
            height: normalHeight * gui.canvasHeight,
            opacity: config.opacity,
            stroke: config.stroke,
            strokeWidth: config.strokeWidth
        })

        konvaGroup.add(konvaElement)

        this._konvaElement = konvaElement
        this.config = config
    }

    move(movementX: number, movementY: number, isFinalMove: boolean = false): void {
        throw new Error("Method not implemented.");
    }

    public draw(): void {
        let { gui, viewPort } = GlobalManager.instance
        let { normalX, normalY } = viewPort.bufferCoordinateToNormalCoordinate(this._leftTop.x, this._leftTop.y)
        let normalWidth = viewPort.bufferWidthToNormalWidth(this._width)
        let normalHeight = viewPort.bufferHeightToNormalHeight(this._height)
        if (Number.isNaN(normalX) || Number.isNaN(normalY) || Number.isNaN(normalWidth) || Number.isNaN(normalHeight) || Number.isNaN(gui.canvasWidth) || Number.isNaN(gui.canvasHeight)) {
            console.log(normalX, normalY, normalWidth, normalHeight);
        }          
        else {
            this.konvaElement.x(normalX * gui.canvasWidth)
            this.konvaElement.y(normalY * gui.canvasHeight)
            this.konvaElement.width(normalWidth * gui.canvasWidth)
            this.konvaElement.height(normalHeight * gui.canvasHeight)
            this.konvaElement.opacity(this.config.opacity!)
            this.konvaElement.stroke(this.config.stroke)
            this.konvaElement.fill(this.config.fill!)
            this.konvaElement.strokeWidth(this.config.strokeWidth)
        }
    }

    get attributes(): { leftTop: Point, width: number, height: number } {
        return {
            leftTop: this._leftTop,
            width: this._width,
            height: this._height
        }
    }

    get leftTop(): Point {
        return this._leftTop
    }

    get width(): number {
        return this._width
    }

    get height(): number {
        return this._height
    }

    set width(width: number) {
        this._width = width
    }

    set height(height: number) {
        this._height = height
    }

    get konvaElement(): Konva.Rect {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: this._leftTop.x,
            minY: this._leftTop.y,
            maxX: this._leftTop.x + this._width,
            maxY: this._leftTop.y + this._height
        }
    }


}