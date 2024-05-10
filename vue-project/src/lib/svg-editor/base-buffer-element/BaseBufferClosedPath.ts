import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";
import Point from "../util/Point";
import GlobalManager from "../GlobalManager";
import type GUILine from "../gui-element/interface/GUILine";
import GUIStraightLine from "../gui-element/gui-base-elements/GUIStraightLine";
import GUICubicCurve from "../gui-element/gui-base-elements/GUICubicCurve";

export default class BaseBufferClosedPath implements BaseBufferElement {
    private _konvaElement: Konva.Path;
    config: BaseBufferElementConfig;

    private _guiLines: GUILine[] = [];

    constructor(guiLines: GUILine[], konvaGroup: Konva.Group = GlobalManager.instance.gui.lineGroup,
        config: BaseBufferElementConfig = { fill: 'black', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {
        this._guiLines = guiLines

        let allData = ""
        let element = this._guiLines[0];
        if (element instanceof GUIStraightLine) {
            let points = element.baseBufferElement.konvaElement.points()
            let data = `M${points[0]},${points[1]} L${points[2]},${points[3]} `
            allData += data
        } else if (element instanceof GUICubicCurve) {
            let data = element.baseBufferElement.konvaElement.data()
            allData += data
        }

        for (let i = 0; i < this._guiLines.length; i++) {
            let element = this._guiLines[i];
            if (element instanceof GUIStraightLine) {
                let points = element.baseBufferElement.konvaElement.points()
                let data = `L${points[2]},${points[3]} `
                allData += data
            } else if (element instanceof GUICubicCurve) {
                let data = element.baseBufferElement.konvaElement.data()
                data = data.replace(/M\d+\.\d+,\d+\.\d+\s/, "");
                allData += data
            }
        }

        let konvaLine = new Konva.Path({
            data: allData,
            fill: 'black',
            opacity: config.opacity,
            stroke: config.stroke,  // 设置颜色
            strokeWidth: config.strokeWidth  // 设置宽度
        })

        konvaGroup.add(konvaLine)

        this._konvaElement = konvaLine
        this.config = config
    }

    move(movementX: number, movementY: number, isFinalMove: boolean = false): void {

    }


    public draw() {
        let { gui, viewPort } = GlobalManager.instance
        let allData = ""
        let element = this._guiLines[0];
        if (element instanceof GUIStraightLine) {
            let points = element.baseBufferElement.konvaElement.points()
            let data = `M${points[0]},${points[1]} L${points[2]},${points[3]} `
            allData += data
        } else if (element instanceof GUICubicCurve) {
            let data = element.baseBufferElement.konvaElement.data()
            allData += data
        }

        for (let i = 0; i < this._guiLines.length; i++) {
            let element = this._guiLines[i];
            if (element instanceof GUIStraightLine) {
                let points = element.baseBufferElement.konvaElement.points()
                let data = `L${points[2]},${points[3]} `
                allData += data
            } else if (element instanceof GUICubicCurve) {
                let data = element.baseBufferElement.konvaElement.data()
                data = data.replace(/M\d+\.\d+,\d+\.\d+\s/, "");
                allData += data
            }
        }

        this.konvaElement.data(allData)
        this.konvaElement.fill(this.config.fill!)
        this.konvaElement.opacity(this.config.opacity!)
        this.konvaElement.strokeWidth(this.config.strokeWidth)
    }

    get attributes(): {} {
        return {

        }
    }

    get konvaElement(): Konva.Path {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        throw new Error("method not implemented")
    }

}