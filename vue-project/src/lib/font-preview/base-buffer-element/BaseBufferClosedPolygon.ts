import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";
import Point from "../util/Point";
import GlobalManager from "../GlobalManager";
import type GUILine from "../gui-element/interface/GUILine";
import GUIStraightLine from "../gui-element/gui-base-elements/GUIStraightLine";
import GUICubicCurve from "../gui-element/gui-base-elements/GUICubicCurve";

export default class BaseBufferClosedPolygon implements BaseBufferElement {
    private _konvaElement: Konva.Line;
    config: BaseBufferElementConfig;

    private _guiLines: GUILine[] = [];

    constructor(guiLines: GUILine[], konvaGroup: Konva.Group = GlobalManager.instance.gui.lineGroup,
        config: BaseBufferElementConfig = { fill: 'black', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {
        this._guiLines = guiLines
        let { gui, viewPort } = GlobalManager.instance
        let rpoints = []
        let element = this._guiLines[0];
        if (element instanceof GUIStraightLine) {
            let points = element.baseBufferElement.attributes.point1
            let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
            let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
            rpoints.push(canvasX)
            rpoints.push(canvasY)
        } else if (element instanceof GUICubicCurve) {
            let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
            let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
            rpoints.push(canvasX)
            rpoints.push(canvasY)
        }

        for (let i = 0; i < this._guiLines.length; i++) {
            let element = this._guiLines[i];
            if (element instanceof GUIStraightLine) {
                let points = element.baseBufferElement.attributes.point1
                let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
                let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
                rpoints.push(canvasX)
                rpoints.push(canvasY)
            } else if (element instanceof GUICubicCurve) {
                let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
                let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
                rpoints.push(canvasX)
                rpoints.push(canvasY)
            }
    
        }

        let konvaLine = new Konva.Line({
            points: rpoints,
            fill: '#00D2FF',
            stroke: 'black',
            strokeWidth: 0,
            closed: true,
          });

        konvaGroup.add(konvaLine)

        this._konvaElement = konvaLine
        this.config = config
    }

    move(movementX: number, movementY: number, isFinalMove: boolean = false): void {

    }


    public draw() {
        let { gui, viewPort } = GlobalManager.instance
        let rpoints = []
        let element = this._guiLines[0];
        if (element instanceof GUIStraightLine) {
            let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
            let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
            rpoints.push(canvasX)
            rpoints.push(canvasY)
        } else if (element instanceof GUICubicCurve) {
            let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
            let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
            rpoints.push(canvasX)
            rpoints.push(canvasY)
        }

        for (let i = 0; i < this._guiLines.length; i++) {
            let element = this._guiLines[i];
            if (element instanceof GUIStraightLine) {
                let points = element.baseBufferElement.attributes.point1
                let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
                let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
                rpoints.push(canvasX)
                rpoints.push(canvasY)
            } else if (element instanceof GUICubicCurve) {
                let { normalX,normalY } = viewPort.bufferCoordinateToNormalCoordinate(element.baseBufferElement.attributes.point1.x, element.baseBufferElement.attributes.point1.y)
                let { canvasX, canvasY } = gui.normalCoordinateToCanvasCoordinate(normalX, normalY)
                rpoints.push(canvasX)
                rpoints.push(canvasY)
            }
    
        }

        this.konvaElement.points(rpoints)
        this.konvaElement.fill('black')
    }

    get attributes(): {} {
        return {

        }
    }

    get konvaElement(): Konva.Line {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        throw new Error("method not implemented")
    }

}