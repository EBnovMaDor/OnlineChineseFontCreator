import Konva from 'konva';

import BaseBuffer from './core/BaseBuffer';
import ViewPort from './core/ViewPort';
import GUI from './core/GUI';
import GlobalManager from './GlobalManager';
import Renderer from './core/Renderer';

import parse from 'parse-svg-path'
import abs from 'abs-svg-path'
import normalize from 'normalize-svg-path'
import DragElementsEvent from './font-creator-event/DragElementsEvent';
import { Shape } from 'konva/lib/Shape';
import { Stage } from 'konva/lib/Stage';
import { isDecoratedShape } from './util/DecoratedShape';
import Point from './util/Point';
import GUIOnPoint from './gui-element/gui-base-elements/GUIOnPoint';
import GUIOffPoint from './gui-element/gui-base-elements/GUIOffPoint';
import GUILine from './gui-element/gui-base-elements/GUIStraightLine';
import type GUIElement from './gui-element/interface/GUIBaseElement';
import GUIControlLine from './gui-element/gui-base-elements/GUIControlLine';
import GUICubicCurve from './gui-element/gui-base-elements/GUICubicCurve';
import GUIStraightLine from './gui-element/gui-base-elements/GUIStraightLine';
import GUIMarkLine from './gui-element/gui-base-elements/GUIMarkLine';
import { instanceOfGUILine } from './util/InstanceHelper';
import BaseBufferRect from './base-buffer-element/BaseBufferRect';
import type GUIBaseElement from './gui-element/interface/GUIBaseElement';
import RefreshSEBBoxEvent from './font-creator-event/RefreshSEBBoxEvent';
import FontCreatorEventHandler from './core/FontCreatorEventHandler';
import BaseBufferClosedPath from './base-buffer-element/BaseBufferClosedPath';
import GUIClosedPath from './gui-element/gui-base-elements/GUIClosedPath';
import BaseBufferClosedPolygon from './base-buffer-element/BaseBufferClosedPolygon';
import { el } from 'element-plus/es/locales.mjs';
import GUIText from './gui-element/gui-base-elements/GUIText';
import BaseBufferRing from './base-buffer-element/BaseBufferRing';
import GUIRing from './gui-element/gui-base-elements/GUIRing';
import { update } from 'lodash';

const isFingerOrMouse = (e: PointerEvent) => e.pointerType == 'touch' || e.pointerType == 'mouse'
const isFinger = (e: PointerEvent) => e.pointerType == 'touch'
const isPen = (e: PointerEvent) => e.pointerType == 'pen'

export default class SvgPreviewer {
    /** system event */
    // private _isPointerDown: { primary: boolean; secondary: boolean; } = { primary: false, secondary: false };
    // private _currentEvent: { primary: PointerEvent | null; secondary: PointerEvent | null; } = { primary: null, secondary: null };
    // private _lastEvent: { primary: PointerEvent | null; secondary: PointerEvent | null; } = { primary: null, secondary: null };

    /** system toolbox */

    private _svgPath: Map<number, Array<any>> = new Map<number, Array<any>>()
    private _svgPreview: Array<Map<number, Array<any>>> = []
    private _svgWidth: Array<Array<any>> = [] // max, min
    private _svgPostion: Array<Array<number>> = [] // x,y
    private _punctuation: Array<string> = [',', '.', '。', ':']
    private _lineSpace: number = 0
    /** drawing */
    private _baseBuffer: BaseBuffer = new BaseBuffer();
    private _eventHandler: FontCreatorEventHandler = new FontCreatorEventHandler()
    private _viewPort: ViewPort | null = null;
    private _gui: GUI | null = null;
    private _rate: number = 0.1
    private _fps: number = 60;
    private divId: string = '';
    private _wordMaxXPos: number = -100;
    private _wordMinXPos: number = 900;
    private _wordMaxYPos: number = -100;
    private _wordMinYPos: number = 900;

    public static anim: Konva.Animation | null = null;

    constructor(divId: string) {
        console.info("divId",divId)
        this.divId = divId
        GlobalManager.instance.baseBuffer = this._baseBuffer

        /** 初始化GUI绘制区域 */
        this._gui = new GUI(divId, false)
        GlobalManager.instance.gui = this._gui

        /** 初始化视口，宽高为世界宽高的一半，且居中，比例和gui比例保持一致 */
        this._baseBuffer.maxStorageY = 200
        this._viewPort = new ViewPort(
            this._baseBuffer.minX + this._baseBuffer.bufferWidth / 4,
            this._baseBuffer.minY + this._baseBuffer.bufferHeight / 4,
            this._baseBuffer.bufferWidth / 2)

        GlobalManager.instance.viewPort = this._viewPort

        GlobalManager.instance.eventHandler = this._eventHandler

        // this._gui.bindWindowResize()
        // this._gui.bindScrollBarEvent()
        // this._gui.bindPixelRatioChange()

        // this._gui.initDecoratedRect()

        SvgPreviewer.anim = new Konva.Animation((frame) => {
            this._fps = frame?.frameRate!
            this._eventHandler.handleEvents()
            Renderer.renderCanvas()
        }, this._gui.mainLayer);

        SvgPreviewer.anim.start();

        this.init();
    }

    public init(): void {

    }

    public refresh(): void {
        this._svgPath.clear()
        this._svgPreview = []
        this._svgWidth = []
        this._lineSpace = 0
    }

    public update(): void {
        this._gui = new GUI(this.divId, false)
        GlobalManager.instance.gui = this._gui
        this._gui!.guiElementIndex = 0
        this._svgPostion = []
    }

    public handleSVG(e: any) {
        let op = e.op
        if (op == 'preview') {
            let svg_id = e.svg_id
            let startPointX = Number(e.startPointX) * this._rate
            let startPointY = Number(e.startPointY) * this._rate
            let endPointX = Number(e.endPointX) * this._rate
            let endPointY = Number(e.endPointY) * this._rate
            this._wordMaxXPos = (startPointX > this._wordMaxXPos) ? startPointX : this._wordMaxXPos
            this._wordMaxXPos = (endPointX > this._wordMaxXPos) ? endPointX : this._wordMaxXPos
            this._wordMinXPos = (startPointX < this._wordMinXPos) ? startPointX : this._wordMinXPos
            this._wordMinXPos = (endPointX < this._wordMinXPos) ? endPointX : this._wordMinXPos
            this._wordMaxYPos = (startPointY > this._wordMaxYPos) ? startPointY : this._wordMaxYPos
            this._wordMaxYPos = (endPointY > this._wordMaxYPos) ? endPointY : this._wordMaxYPos
            this._wordMinYPos = (startPointY < this._wordMinYPos) ? startPointY : this._wordMinYPos
            this._wordMinYPos = (endPointY < this._wordMinYPos) ? endPointY : this._wordMinYPos
            let isClosed = e.isClose === "true" ? true : false;
            let fill = e.fill === "true" ? true : false;
            let lineString = e.line.replace(/\[|\]|\'|\"/g, '').split(',')
            let lines = []
            for (let i = 0; i < lineString.length; i = i + 22) {
                let segment = []
                let comment = []
                let markline = []
                segment.push(lineString[i])
                segment.push(Number(lineString[i + 1]) * this._rate)
                this._wordMaxXPos = (Number(lineString[i + 1]) * this._rate > this._wordMaxXPos) ? Number(lineString[i + 1]) * this._rate : this._wordMaxXPos
                this._wordMinXPos = (Number(lineString[i + 1]) * this._rate < this._wordMinXPos) ? Number(lineString[i + 1]) * this._rate : this._wordMinXPos
                segment.push(Number(lineString[i + 2]) * this._rate)
                this._wordMaxYPos = (Number(lineString[i + 2]) * this._rate > this._wordMaxYPos) ? Number(lineString[i + 2]) * this._rate : this._wordMaxYPos
                this._wordMinYPos = (Number(lineString[i + 2]) * this._rate < this._wordMinYPos) ? Number(lineString[i + 2]) * this._rate : this._wordMinYPos
                segment.push(Number(lineString[i + 3]) * this._rate)
                this._wordMaxXPos = (Number(lineString[i + 3]) * this._rate > this._wordMaxXPos) ? Number(lineString[i + 3]) * this._rate : this._wordMaxXPos
                this._wordMinXPos = (Number(lineString[i + 3]) * this._rate < this._wordMinXPos) ? Number(lineString[i + 3]) * this._rate : this._wordMinXPos
                segment.push(Number(lineString[i + 4]) * this._rate)
                this._wordMaxYPos = (Number(lineString[i + 4]) * this._rate > this._wordMaxYPos) ? Number(lineString[i + 4]) * this._rate : this._wordMaxYPos
                this._wordMinYPos = (Number(lineString[i + 4]) * this._rate < this._wordMinYPos) ? Number(lineString[i + 4]) * this._rate : this._wordMinYPos
                segment.push(Number(lineString[i + 5]) * this._rate)
                this._wordMaxXPos = (Number(lineString[i + 5]) * this._rate > this._wordMaxXPos) ? Number(lineString[i + 5]) * this._rate : this._wordMaxXPos
                this._wordMinXPos = (Number(lineString[i + 5]) * this._rate < this._wordMinXPos) ? Number(lineString[i + 5]) * this._rate : this._wordMinXPos
                segment.push(Number(lineString[i + 6]) * this._rate)
                this._wordMaxYPos = (Number(lineString[i + 6]) * this._rate > this._wordMaxYPos) ? Number(lineString[i + 6]) * this._rate : this._wordMaxYPos
                this._wordMinYPos = (Number(lineString[i + 6]) * this._rate < this._wordMinYPos) ? Number(lineString[i + 6]) * this._rate : this._wordMinYPos
                comment.push(lineString[i + 7])
                comment.push(lineString[i + 8])
                comment.push(lineString[i + 9])
                comment.push(lineString[i + 10])
                comment.push(lineString[i + 11])
                comment.push(lineString[i + 12])
                comment.push(lineString[i + 13])
                markline.push(Number(lineString[i + 14]) * this._rate)
                markline.push(Number(lineString[i + 15]) * this._rate)
                markline.push(Number(lineString[i + 16]) * this._rate)
                markline.push(Number(lineString[i + 17]) * this._rate)
                markline.push(Number(lineString[i + 18]) * this._rate)
                markline.push(Number(lineString[i + 19]) * this._rate)
                markline.push(Number(lineString[i + 20]) * this._rate)
                markline.push(Number(lineString[i + 21]) * this._rate)

                segment.push(comment)
                segment.push(markline)
                lines.push(segment)
            }
            let allSegements = []
            allSegements.push({
                startPointX,
                startPointY,
                endPointX,
                endPointY,
                lines,
                isClosed,
                fill
            })
            this._svgPath.set(svg_id, allSegements)
        }
        else if (op == 'previewEnd') {
            this._svgPreview.push(this._svgPath)
            // console.log(this._svgPreview)
            this._svgPath = new Map<number, Array<any>>()
            this._svgWidth.push([this._wordMaxXPos, this._wordMinXPos, e.word])
            // console.log("svgwidth", this._svgWidth)
            this._lineSpace = (this._wordMaxYPos - this._wordMinYPos > this._lineSpace) ? this._wordMaxYPos - this._wordMinYPos : this._lineSpace
            this._wordMaxXPos = -100
            this._wordMinXPos = 900
            this._wordMaxYPos = -100
            this._wordMinYPos = 900
        }
    }

    public typeSetting(wordSSpacing: string, lineSSpacing: string, fontSSize: string) {
        let wordSpacing, lineSpacing, fontSize: number
        if (fontSSize == '') fontSize = 1
        else fontSize = Number(fontSSize)
        if (wordSSpacing == '') wordSpacing = 0
        else wordSpacing = Number(wordSSpacing)
        if (lineSSpacing == '')
            lineSpacing = this._lineSpace * fontSize
        else lineSpacing = Number(lineSSpacing) + this._lineSpace * fontSize


        let line = 390
        let currentX = 0
        let currentY = 2
        for (let i = 0; i < this._svgWidth.length; i++) {
            if (fontSize * (this._svgWidth[i][0] - this._svgWidth[i][1]) + currentX <= line) {
                this._svgPostion.push([currentX, currentY, fontSize])
                currentX = currentX + fontSize * (this._svgWidth[i][0] - this._svgWidth[i][1]) + wordSpacing
                currentY = currentY
            }
            else {
                // 随意随意随意随意随意随意随意随意随,意随意
                if (this._punctuation.includes(this._svgWidth[i][2])) {
                    let last = this._svgPostion[this._svgPostion.length - 1]
                    this._svgPostion[this._svgPostion.length - 1] = [0, currentY + lineSpacing, fontSize]
                    currentX = currentX - last[0]
                    this._svgPostion.push([currentX, currentY + lineSpacing, fontSize])
                    currentX = currentX + fontSize * (this._svgWidth[i][0] - this._svgWidth[i][1]) + wordSpacing
                    currentY = currentY + lineSpacing
                }
                else {
                    this._svgPostion.push([0, currentY + lineSpacing, fontSize])
                    currentX = fontSize * (this._svgWidth[i][0] - this._svgWidth[i][1]) + wordSpacing
                    currentY = currentY + lineSpacing
                }
            }
        }
    }

    public changeToPreview() {

        let falseArray = []
        for (let previewID = 0; previewID < this._svgPreview.length; previewID++) {
            console.log("previewID", previewID)
            let currentSVGPath = this._svgPreview[previewID]
            console.log("currentSVGPath", currentSVGPath)

            for (let id of currentSVGPath.keys()) {
                let i = currentSVGPath.get(id)!
                if (i[0].fill == false) {
                    falseArray.push([i[0], previewID])
                    continue
                }
                this.renderOneSegment(i[0], previewID)
                for (let element of this._gui!.guiBaseElements.values()) {
                    if (!(element instanceof GUIStraightLine) && !(element instanceof GUICubicCurve)) {
                        element.isVisible = false
                    } else {
                        if (element.isVisible) {
                            element.isVisible = false
                            let isClosed = true
                            let arr = []
                            let currentGUILine = element
                            let nextGUILine = (element.nextGUIPoint! as GUIOnPoint).nextGUILine
                            arr.push(currentGUILine)
                            while (nextGUILine != currentGUILine) {
                                if (nextGUILine == null) {
                                    isClosed = false
                                    break
                                }
                                nextGUILine!.isVisible = false
                                arr.push(nextGUILine)
                                nextGUILine = (nextGUILine!.nextGUIPoint! as GUIOnPoint).nextGUILine
                            }
                            if (isClosed) {
                                let a = new GUIClosedPath(new BaseBufferClosedPath(arr))
                                a.baseBufferElement.config.fill = 'black'
                                this._gui!.addGUIPreviewElement(a)
                            }
                        }
                    }
                }
                this.saveSVG()
            }
        }
        for (let id = 0; id < falseArray.length; id++) {
            let i = falseArray[id]
            this.renderOneSegment(i[0], i[1])

            for (let element of this._gui!.guiBaseElements.values()) {
                if (!(element instanceof GUIStraightLine) && !(element instanceof GUICubicCurve)) {
                    element.isVisible = false
                } else {
                    if (element.isVisible) {
                        element.isVisible = false
                        let isClosed = true
                        let arr = []
                        let currentGUILine = element
                        let nextGUILine = (element.nextGUIPoint! as GUIOnPoint).nextGUILine
                        arr.push(currentGUILine)
                        while (nextGUILine != currentGUILine) {
                            if (nextGUILine == null) {
                                isClosed = false
                                break
                            }
                            nextGUILine!.isVisible = false
                            arr.push(nextGUILine)
                            nextGUILine = (nextGUILine!.nextGUIPoint! as GUIOnPoint).nextGUILine
                        }
                        if (isClosed) {
                            let a = new GUIClosedPath(new BaseBufferClosedPath(arr))
                            a.baseBufferElement.config.fill = 'white'
                            this._gui!.addGUIPreviewElement(a)
                        }
                    }
                }
            }
            this.saveSVG()
        }

    }

    private renderOneSegment(segement: any, previewId: number) {
        let { gui, baseBuffer } = GlobalManager.instance
        let text = segement.lines[0]
        if (text[0] == 'T') {
            let point = new Point(text[1], text[2]);
            let guiText = new GUIText(point, text[3]);
            console.log(guiText)
            return
        }
        let addX = this._svgPostion[previewId][0]
        let addY = this._svgPostion[previewId][1]
        let size = this._svgPostion[previewId][2]
        let isClosed = segement.isClosed
        let startPoint: Point = new Point(segement.startPointX * size + addX, segement.startPointY * size + addY)
        let currentPoint = startPoint
        let segments = segement.lines
        let startGUIPoint = new GUIOnPoint(startPoint)
        let currentGUIPoint = startGUIPoint
        let currentGUILine = null
        let currentControlPoint = null
        for (let i = 0; i < segments.length; i++) {
            let targetPoint = (i == segments.length - 1 && isClosed) ? startPoint : new Point(segments[i][5] * size + addX, segments[i][6] * size + addY)
            let targetGUIPoint = (i == segments.length - 1 && isClosed) ? startGUIPoint : new GUIOnPoint(targetPoint)
            if (segments[i][3] == segments[i][5] && segments[i][4] == segments[i][6]) {
                //直线
                let guiLine = new GUIStraightLine(currentPoint, targetPoint)
                currentGUIPoint.nextGUILine = guiLine
                currentGUIPoint.previousGUILine = currentGUILine

                targetGUIPoint.previousGUILine = guiLine

                guiLine.previousGUIPoint = currentGUIPoint
                guiLine.nextGUIPoint = targetGUIPoint

                currentGUILine = guiLine
                currentPoint = targetPoint
                currentGUIPoint = targetGUIPoint
            } else {
                //三次贝塞尔曲线
                let controlPoint1 = new Point(segments[i][1] * size + addX, segments[i][2] * size + addY)
                let controlPoint2 = new Point(segments[i][3] * size + addX, segments[i][4] * size + addY)
                let controlGUIPoint1 = new GUIOffPoint(controlPoint1)
                let controlGUIPoint2 = new GUIOffPoint(controlPoint2)
                let controlGUILine1 = new GUIControlLine(controlPoint1, currentPoint)
                let controlGUILine2 = new GUIControlLine(controlPoint2, targetPoint)
                let guiLine = new GUICubicCurve(currentPoint, targetPoint, controlPoint1, controlPoint2)
                currentGUIPoint.previousGUILine = currentGUILine
                currentGUIPoint.previousControlPoint = currentControlPoint
                currentGUIPoint.nextGUILine = guiLine
                currentGUIPoint.nextControlPoint = controlGUIPoint1

                targetGUIPoint.previousGUILine = guiLine
                targetGUIPoint.previousControlPoint = controlGUIPoint2

                controlGUIPoint1.correspondingGUIPoint = currentGUIPoint
                controlGUIPoint2.correspondingGUIPoint = targetGUIPoint

                controlGUIPoint1.correspondingGUIControlLine = controlGUILine1
                controlGUIPoint2.correspondingGUIControlLine = controlGUILine2

                controlGUILine1.onPoint = currentGUIPoint
                controlGUILine1.offPoint = controlGUIPoint1

                controlGUILine2.onPoint = targetGUIPoint
                controlGUILine2.offPoint = controlGUIPoint2

                guiLine.previousGUIPoint = currentGUIPoint
                guiLine.nextGUIPoint = targetGUIPoint

                currentPoint = targetPoint
                currentGUIPoint = targetGUIPoint
                currentGUILine = guiLine
                currentControlPoint = controlGUIPoint2
            }
        }
    }

    public saveSVG() {
        for (let element of this._gui!.guiBaseElements.values()) {
            if (element.isVisible == false && (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIControlLine || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIText)) {
                element.delete()
            }
        }
    }
    public acceptSVG() {
        this._gui!.guiElementIndex = 0
        for (let previewID = 0; previewID < this._svgPreview.length; previewID++) {
            let currentSVGPath = this._svgPreview[previewID]
            for (let id of currentSVGPath.keys()) {
                let i = currentSVGPath.get(id)!
                // this.renderOneSegment(i[0])
            }
        }
        this.changeToPreview()
    }
    get viewPort(): ViewPort {
        return this._viewPort!
    }
    get baseBuffer(): BaseBuffer {
        return this._baseBuffer
    }
    get gui(): GUI {
        return this._gui!
    }
}

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        import.meta.hot!.invalidate()
        SvgPreviewer.anim!.stop()
    })
}
