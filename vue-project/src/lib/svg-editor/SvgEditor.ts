import Konva from 'konva';
import { type KonvaEventObject } from 'konva/lib/Node';
import FontCreatorEvent from './font-creator-event/FontCreatorEvent';
import Queue from './util/Queue';

import BaseBuffer from './core/BaseBuffer';
import ViewPort from './core/ViewPort';
import MoveViewPortEvent from './font-creator-event/MoveViewPortEvent';
import ZoomViewPortEvent from './font-creator-event/ZoomViewPortEvent';
import GUI from './core/GUI';
import GlobalManager from './GlobalManager';
import Renderer from './core/Renderer';
import ZoomViewPortByWheelEvent from './font-creator-event/ZoomViewPortByWheel';
import GUIAttrs from "./gui-element/gui-base-elements/GUIAttrs";

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

export default class SvgEditor {
    /** system event */
    private _isPointerDown: { primary: boolean; secondary: boolean; } = { primary: false, secondary: false };
    private _currentEvent: { primary: PointerEvent | null; secondary: PointerEvent | null; } = { primary: null, secondary: null };
    private _lastEvent: { primary: PointerEvent | null; secondary: PointerEvent | null; } = { primary: null, secondary: null };

    /** system toolbox */
    private _currentTool: string = 'editor';

    private _isDragging: boolean = false;
    private _isSelecting: boolean = false;
    private _svgPath: Map<number, Array<any>> = new Map<number, Array<any>>()
    private _svgMax: number = 0

    private _ifSend: number = 0;
    private _msgSend: Array<any> = [];

    private _ifMarked: boolean = false;
    private _markedId: number = -1;
    private _isMarked: boolean = false;
    private _ifMarkedCanvas: boolean = false;
    private _markPoint: Point = new Point;
    private _textPoint: Point = new Point;

    private _svgMinX: number = -7.5;
    private _svgMaxX: number = 7.5;
    private _svgMinY: number = 0;
    private _svgMaxY: number = 15;

    private _pointPos: boolean = false
    private _linePos: boolean = false
    private _curvePos: boolean = false
    private _posSegment: Array<number> = []

    private _isRect: boolean = false;
    private _isTri: boolean = false;
    private _isCir: boolean = false;
    private _isLineMark: boolean = false;

    private _multiSelectingRectPos: {
        x1: number,
        y1: number,
        x2: number,
        y2: number
    } = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0
        }

    private _circlePos: {
        x1: number,
        y1: number
    } = {
            x1: 0,
            y1: 0
        }

    /** drawing */
    private _baseBuffer: BaseBuffer = new BaseBuffer();
    private _eventHandler: FontCreatorEventHandler = new FontCreatorEventHandler()
    private _viewPort: ViewPort | null = null;
    private _gui: GUI | null = null;

    private _fps: number = 60;

    public static anim: Konva.Animation | null = null;

    constructor(divId: string) {
        console.info("SvgEditor Init")
        GlobalManager.instance.baseBuffer = this._baseBuffer

        /** 初始化GUI绘制区域 */
        this._gui = new GUI(divId,true)
        GlobalManager.instance.gui = this._gui

        /** 初始化视口，宽高为世界宽高的一半，且居中，比例和gui比例保持一致 */
        this._viewPort = new ViewPort(
            this._baseBuffer.minX + this._baseBuffer.bufferWidth / 4,
            this._baseBuffer.minY + this._baseBuffer.bufferHeight / 4,
            this._baseBuffer.bufferWidth / 2)

        GlobalManager.instance.viewPort = this._viewPort

        GlobalManager.instance.eventHandler = this._eventHandler

        this._gui.bindWindowResize()
        this._gui.bindScrollBarEvent()
        this._gui.bindPixelRatioChange()

        this._gui.initDecoratedRect()

        this.bindPointerEvents()
        this.bindWheelEvents()

        SvgEditor.anim = new Konva.Animation((frame) => {
            this._fps = frame?.frameRate!
            this._eventHandler.handleEvents()
            Renderer.renderCanvas()
        }, this._gui.mainLayer);

        SvgEditor.anim.start();

        this.init();
    }

    public init(): void {
        this.importSVG();
    }

    public importSVG() {
        this._svgPath.clear()
        this._msgSend = [['i']]
        this.ifSend = 1
    }

    public handleSVG(e: any) {
        // console.log(this._svgPath)
        this._msgSend = []
        let op = e.op
        if (op == 'edit') {
            let svg_id = e.svg_id
            let startPointX = Number(e.startPointX)
            let startPointY = Number(e.startPointY)
            let endPointX = Number(e.endPointX)
            let endPointY = Number(e.endPointY)
            let isClosed = e.isClose === "true" ? true : false;
            let fill = e.fill === "true" ? true : false;
            let lineString = e.line.replace(/\[|\]|\'|\"/g, '').split(',')
            // console.log("linestring", lineString)
            let lines = []
            for (let i = 0; i < lineString.length; i = i + 22) {
                let segment = []
                let comment = []
                let markline = []
                segment.push(lineString[i])
                segment.push(Number(lineString[i + 1]))
                segment.push(Number(lineString[i + 2]))
                segment.push(Number(lineString[i + 3]))
                segment.push(Number(lineString[i + 4]))
                segment.push(Number(lineString[i + 5]))
                segment.push(Number(lineString[i + 6]))
                comment.push(lineString[i + 7])
                comment.push(lineString[i + 8])
                comment.push(lineString[i + 9])
                comment.push(lineString[i + 10])
                comment.push(lineString[i + 11])
                comment.push(lineString[i + 12])
                comment.push(lineString[i + 13])
                markline.push(Number(lineString[i + 14]))
                markline.push(Number(lineString[i + 15]))
                markline.push(Number(lineString[i + 16]))
                markline.push(Number(lineString[i + 17]))
                markline.push(Number(lineString[i + 18]))
                markline.push(Number(lineString[i + 19]))
                markline.push(Number(lineString[i + 20]))
                markline.push(Number(lineString[i + 21]))
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
            console.log("edit", this._svgPath)
            this.acceptSVG()
        }
        else if (op == 'delete') {
            let svg_id = e.svg_id
            this._svgPath.delete(svg_id)
            // console.log("delete", this._svgPath)
            this.acceptSVG()
        }
        else if (op == 'changeFill') {
            let svg_id = e.svg_id
            let path = this._svgPath.get(svg_id)
            path![0].fill = e.fill
            this._svgPath.set(svg_id, path!)
            console.log("changeFill", this._svgPath)
            // this.acceptSVG()

        }

    }
    public transSegment(element: any): Array<any> {
        for (let elementSelected of this._gui!.selectedElements.values()) {
            elementSelected.isSelected = false
        }
        this._gui!.selectedElementsRect!.baseBufferElement.width = 0
        this._gui!.selectedElementsRect!.baseBufferElement.height = 0

        if (this._currentTool != 'editor') { this.saveSVG() }
        let allSegements = []
        // let minmax = [this._svgMinX, this._svgMinY, this._svgMaxX, this._svgMaxY, this._bufferMinX, this._bufferMinY, this._bufferMaxX, this._bufferMaxY]
        // allSegements.push(minmax)

        let lines = []
        if (element instanceof GUIStraightLine || element instanceof GUICubicCurve) {
            // console.log("18test", element.previousGUIPoint?.previousGUILine?.nextGUIPoint)
            if (element.isVisible == true) {
                let segement = []
                let comment = []
                let markLine = []
                segement.push('C')
                comment.push(element.comment)
                comment.push(element.previousGUIPoint?.comment)
                comment.push(element.nextGUIPoint?.comment)
                if (element.previousMarkLine) {
                    markLine.push(element.previousMarkLine.l)
                    markLine.push(element.previousMarkLine.nextGUIPoint?.baseBufferElement.center.x)
                    markLine.push(element.previousMarkLine.nextGUIPoint?.baseBufferElement.center.y)
                }
                else {
                    markLine.push(0)
                    markLine.push(0)
                    markLine.push(0)
                }
                if (element.nextMarkLine) {
                    markLine.push(element.nextMarkLine.l)
                    markLine.push(element.nextMarkLine.nextGUIPoint?.baseBufferElement.center.x)
                    markLine.push(element.nextMarkLine.nextGUIPoint?.baseBufferElement.center.y)
                }
                else {
                    markLine.push(0)
                    markLine.push(0)
                    markLine.push(0)
                }
                if (element.previousGUIPoint?.markRing) {
                    markLine.push(1)
                }
                else {
                    markLine.push(0)
                }
                if (element.nextGUIPoint?.markRing) {
                    markLine.push(1)
                }
                else {
                    markLine.push(0)
                }
                // console.log("MAP", this._gui!.guiBaseElements)
                // console.log("ELEMENT:!!!", element)
                // console.log("START OF A LINE: ", segement)
                if (element instanceof GUIStraightLine) {
                    segement.push(element.previousGUIPoint?.baseBufferElement.center.x)
                    segement.push(element.previousGUIPoint?.baseBufferElement.center.y)
                    segement.push(element.nextGUIPoint?.baseBufferElement.center.x)
                    segement.push(element.nextGUIPoint?.baseBufferElement.center.y)
                    comment.push("")
                    comment.push("")
                    comment.push("")
                    comment.push("")
                }
                else {
                    segement.push(element.previousGUIPoint?.nextControlPoint?.baseBufferElement.center.x)
                    segement.push(element.previousGUIPoint?.nextControlPoint?.baseBufferElement.center.y)
                    segement.push(element.nextGUIPoint?.previousControlPoint?.baseBufferElement.center.x)
                    segement.push(element.nextGUIPoint?.previousControlPoint?.baseBufferElement.center.y)
                    comment.push(element.previousGUIPoint?.nextControlPoint?.comment)
                    comment.push(element.previousGUIPoint?.nextControlPoint?.correspondingGUIControlLine?.comment)
                    comment.push(element.nextGUIPoint?.previousControlPoint?.comment)
                    comment.push(element.nextGUIPoint?.previousControlPoint?.correspondingGUIControlLine?.comment)
                }
                segement.push(element.nextGUIPoint?.baseBufferElement.center.x)
                segement.push(element.nextGUIPoint?.baseBufferElement.center.y)
                segement.push(comment)
                segement.push(markLine)
                // console.log("this is a line: ", segement)
                lines.push(segement)
                this.inVisible(element)
                let preLine = element.previousGUIPoint?.previousGUILine
                // console.log("preline.next", preLine?.nextGUIPoint)
                // console.log("preline.pre", preLine?.previousGUIPoint)
                let flagLoop = 0
                let startPointX = element.previousGUIPoint?.baseBufferElement.center.x
                let startPointY = element.previousGUIPoint?.baseBufferElement.center.y
                while (preLine != null) {
                    // console.log("MAP", this._gui!.guiBaseElements)
                    // console.log("PRELINE:!!!", preLine)
                    // console.log("preline.next", preLine.nextGUIPoint)
                    // console.log("preline.pre", preLine.previousGUIPoint)
                    segement = []
                    comment = []
                    markLine = []
                    segement.push('C');
                    if (preLine.previousMarkLine) {
                        markLine.push(preLine.previousMarkLine.l)
                        markLine.push(preLine.previousMarkLine.nextGUIPoint?.baseBufferElement.center.x)
                        markLine.push(preLine.previousMarkLine.nextGUIPoint?.baseBufferElement.center.y)
                    }
                    else {
                        markLine.push(0)
                        markLine.push(0)
                        markLine.push(0)
                    }
                    if (preLine.nextMarkLine) {
                        markLine.push(preLine.nextMarkLine.l)
                        markLine.push(preLine.nextMarkLine.nextGUIPoint?.baseBufferElement.center.x)
                        markLine.push(preLine.nextMarkLine.nextGUIPoint?.baseBufferElement.center.y)
                    }
                    else {
                        markLine.push(0)
                        markLine.push(0)
                        markLine.push(0)
                    }
                    if (preLine.previousGUIPoint instanceof GUIOnPoint) {
                        if (preLine.previousGUIPoint?.markRing) {
                            markLine.push(1)
                        }
                        else {
                            markLine.push(0)
                        }

                    }
                    if (preLine.nextGUIPoint instanceof GUIOnPoint) {
                        if (preLine.nextGUIPoint?.markRing) {
                            markLine.push(1)
                        }
                        else {
                            markLine.push(0)
                        }
                    }
                    comment.push(preLine.comment)
                    comment.push(preLine.previousGUIPoint?.comment)
                    comment.push(preLine.nextGUIPoint?.comment)
                    // console.log("START OF A PRE LINE: ", segement)
                    if (preLine instanceof GUIStraightLine || preLine instanceof GUICubicCurve) {
                        if (preLine instanceof GUIStraightLine) {
                            segement.push(preLine.previousGUIPoint?.baseBufferElement.center.x)
                            segement.push(preLine.previousGUIPoint?.baseBufferElement.center.y)
                            segement.push(preLine.nextGUIPoint?.baseBufferElement.center.x)
                            segement.push(preLine.nextGUIPoint?.baseBufferElement.center.y)
                            comment.push("")
                            comment.push("")
                            comment.push("")
                            comment.push("")
                        }
                        else {
                            segement.push(preLine.previousGUIPoint?.nextControlPoint?.baseBufferElement.center.x)
                            segement.push(preLine.previousGUIPoint?.nextControlPoint?.baseBufferElement.center.y)
                            segement.push(preLine.nextGUIPoint?.previousControlPoint?.baseBufferElement.center.x)
                            segement.push(preLine.nextGUIPoint?.previousControlPoint?.baseBufferElement.center.y)
                            comment.push(preLine.previousGUIPoint?.nextControlPoint?.comment)
                            comment.push(preLine.previousGUIPoint?.nextControlPoint?.correspondingGUIControlLine?.comment)
                            comment.push(preLine.nextGUIPoint?.previousControlPoint?.comment)
                            comment.push(preLine.nextGUIPoint?.previousControlPoint?.correspondingGUIControlLine?.comment)
                        }
                        segement.push(preLine.nextGUIPoint?.baseBufferElement.center.x)
                        segement.push(preLine.nextGUIPoint?.baseBufferElement.center.y)
                        segement.push(comment)
                        segement.push(markLine)
                        // console.log("this is a pre line: ", segement)
                        lines.unshift(segement)

                        this.inVisible(preLine)
                        if (preLine.previousGUIPoint?.previousGUILine == null) {
                            startPointX = preLine.previousGUIPoint?.baseBufferElement.center.x
                            startPointY = preLine.previousGUIPoint?.baseBufferElement.center.y
                            break;
                        }
                        preLine = preLine.previousGUIPoint?.previousGUILine
                        if (preLine == element) {
                            startPointX = preLine.nextGUIPoint?.baseBufferElement.center.x
                            startPointY = preLine.nextGUIPoint?.baseBufferElement.center.y
                            flagLoop = 1
                            break;
                        }
                    }
                    else break
                }
                if (flagLoop == 0) {
                    // 往后放到空为止
                    let nextLine = element.nextGUIPoint?.nextGUILine
                    while (nextLine != null) {
                        // console.log("MAP", this._gui!.guiBaseElements)
                        // console.log("NEXTLINE:!!!", nextLine)
                        // console.log("nextline.nextpoint:", nextLine.nextGUIPoint)
                        segement = []
                        comment = []
                        markLine = []
                        segement.push('C');
                        if (nextLine.previousMarkLine) {
                            markLine.push(nextLine.previousMarkLine.l)
                            markLine.push(nextLine.previousMarkLine.nextGUIPoint?.baseBufferElement.center.x)
                            markLine.push(nextLine.previousMarkLine.nextGUIPoint?.baseBufferElement.center.y)
                        }
                        else {
                            markLine.push(0)
                            markLine.push(0)
                            markLine.push(0)
                        }
                        if (nextLine.nextMarkLine) {
                            markLine.push(nextLine.nextMarkLine.l)
                            markLine.push(nextLine.nextMarkLine.nextGUIPoint?.baseBufferElement.center.x)
                            markLine.push(nextLine.nextMarkLine.nextGUIPoint?.baseBufferElement.center.y)
                        }
                        else {
                            markLine.push(0)
                            markLine.push(0)
                            markLine.push(0)
                        }
                        if (nextLine.previousGUIPoint instanceof GUIOnPoint) {
                            if (nextLine.previousGUIPoint?.markRing) {
                                markLine.push(1)
                            }
                            else {
                                markLine.push(0)
                            }

                        }
                        if (nextLine.nextGUIPoint instanceof GUIOnPoint) {
                            if (nextLine.nextGUIPoint?.markRing) {
                                markLine.push(1)
                            }
                            else {
                                markLine.push(0)
                            }
                        }
                        comment.push(nextLine.comment)
                        comment.push(nextLine.previousGUIPoint?.comment)
                        comment.push(nextLine.nextGUIPoint?.comment)
                        // console.log("START OF A NEXT LINE: ", segement)
                        if (nextLine instanceof GUIStraightLine || nextLine instanceof GUICubicCurve)
                        // if (nextLine instanceof GUIStraightLine || nextLine instanceof GUICubicCurve)
                        {
                            if (nextLine instanceof GUIStraightLine) {
                                segement.push(nextLine.previousGUIPoint?.baseBufferElement.center.x)
                                segement.push(nextLine.previousGUIPoint?.baseBufferElement.center.y)
                                segement.push(nextLine.nextGUIPoint?.baseBufferElement.center.x)
                                segement.push(nextLine.nextGUIPoint?.baseBufferElement.center.y)
                                comment.push("")
                                comment.push("")
                                comment.push("")
                                comment.push("")
                            }
                            else {
                                segement.push(nextLine.previousGUIPoint?.nextControlPoint?.baseBufferElement.center.x)
                                segement.push(nextLine.previousGUIPoint?.nextControlPoint?.baseBufferElement.center.y)
                                segement.push(nextLine.nextGUIPoint?.previousControlPoint?.baseBufferElement.center.x)
                                segement.push(nextLine.nextGUIPoint?.previousControlPoint?.baseBufferElement.center.y)
                                comment.push(nextLine.previousGUIPoint?.nextControlPoint?.comment)
                                comment.push(nextLine.previousGUIPoint?.nextControlPoint?.correspondingGUIControlLine?.comment)
                                comment.push(nextLine.nextGUIPoint?.previousControlPoint?.comment)
                                comment.push(nextLine.nextGUIPoint?.previousControlPoint?.correspondingGUIControlLine?.comment)

                            }
                            segement.push(nextLine.nextGUIPoint?.baseBufferElement.center.x)
                            segement.push(nextLine.nextGUIPoint?.baseBufferElement.center.y)
                            segement.push(comment)
                            segement.push(markLine)
                            // console.log("this is a next line: ", segement)
                            lines.push(segement)

                            this.inVisible(nextLine)
                            nextLine = nextLine.nextGUIPoint?.nextGUILine
                        }
                        else break
                    }
                }
                let endPointX = lines[lines.length - 1][5]
                let endPointY = lines[lines.length - 1][6]
                allSegements.push({
                    startPointX,
                    startPointY,
                    endPointX,
                    endPointY,
                    lines,
                    isClosed: (startPointX == endPointX && startPointY == endPointY)
                })
            }
        }
        else if (element instanceof GUIText) {
            if (element.isVisible == true) {
                let segement = []

                segement.push('T')
                segement.push(element.baseBufferElement.center.x)
                segement.push(element.baseBufferElement.center.y)
                segement.push(element.baseBufferElement.text)
                element.isVisible = false
                allSegements.push({
                    startPointX: element.baseBufferElement.center.x,
                    startPointY: element.baseBufferElement.center.y,
                    endPointX: element.baseBufferElement.center.x,
                    endPointY: element.baseBufferElement.center.y,
                    segement,
                    isClosed: false
                })
                this.inVisible(element)
            }
        }
        // this.saveSVG()
        return allSegements
    }

    public transCmt(): Array<any> {
        let allComments = []
        // console.log("this._gui!.guiBaseElements", this._gui!.guiBaseElements)
        for (let element of this._gui!.guiBaseElements.values()) {
            if (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIControlLine) {
                if (element.comment != "") {
                    allComments.push(element.guiElementId)
                    allComments.push(element.comment)
                }
            }
        }
        return allComments
    }

    public acceptSVG() {
        for (let element of this._gui!.guiBaseElements.values()) {
            if (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIControlLine || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIText || element instanceof GUIMarkLine || element instanceof GUIRing) {
                // console.log("delete", element)
                element.isVisible = false
                element.delete()
            }
        }
        this._gui!.guiElementIndex = 0
        for (let id of this._svgPath.keys()) {
            let i = this._svgPath.get(id)!
            // console.log('current seg', i[0])
            this.renderOneSegment(id, i[0])
        }
    }

    private inVisible(element: GUIStraightLine | GUICubicCurve | GUIText) {
        if (element instanceof GUIText) {
            element.isVisible = false
            return
        }
        if (element.previousGUIPoint) {
            element.previousGUIPoint.isVisible = false
            if (element.previousGUIPoint.nextControlPoint) {
                element.previousGUIPoint.nextControlPoint.isVisible = false
                if (element.previousGUIPoint.nextControlPoint.correspondingGUIControlLine)
                    element.previousGUIPoint.nextControlPoint.correspondingGUIControlLine.isVisible = false
            }
        }
        if (element.nextGUIPoint) {
            element.nextGUIPoint.isVisible = false
            if (element.nextGUIPoint.previousControlPoint) {
                element.nextGUIPoint.previousControlPoint.isVisible = false
                if (element.nextGUIPoint.previousControlPoint.correspondingGUIControlLine)
                    element.nextGUIPoint.previousControlPoint.correspondingGUIControlLine.isVisible = false
            }
        }
        element.isVisible = false
    }

    get msgSend() {
        return this._msgSend;
    }

    set msgSend(msgSend: Array<any>) {
        this._msgSend = msgSend;
    }

    get ifSend(): number {
        return this._ifSend
    }

    set ifSend(ifSend: number) {
        this._ifSend = ifSend
    }

    get ifMarked(): boolean {
        return this._ifMarked
    }

    set ifMarked(ifMarked: boolean) {
        this._ifMarked = ifMarked
    }

    get isMarked(): boolean {
        return this._isMarked
    }

    set isMarked(isMarked: boolean) {
        this._isMarked = isMarked
    }
    get ifMarkedCanvas(): boolean {
        return this._ifMarkedCanvas
    }

    set ifMarkedCanvas(ifMarkedCanvas: boolean) {
        this._ifMarkedCanvas = ifMarkedCanvas
    }

    get markPoint(): { x: number, y: number } {
        return {
            x: this._markPoint.x,
            y: this._markPoint.y
        }
    }
    get textPoint(): { x: number, y: number } {
        return {
            x: this._textPoint.x,
            y: this._textPoint.y
        }
    }
    get markedId(): number {
        return this._markedId
    }

    set markedId(markedId: number) {
        this._markedId = markedId
    }

    get pointPos(): boolean {
        return this._pointPos
    }

    set pointPos(pointPos: boolean) {
        this._pointPos = pointPos
    }

    get linePos(): boolean {
        return this._linePos
    }

    set linePos(linePos: boolean) {
        this._linePos = linePos
    }

    get curvePos(): boolean {
        return this._curvePos
    }

    set curvePos(curvePos: boolean) {
        this._curvePos = curvePos
    }

    get posSegment(): Array<number> {
        return this._posSegment
    }

    set posSegment(posSegment: Array<number>) {
        this._posSegment = posSegment
    }

    get currentTool(): string {
        return this._currentTool
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

    get fps(): number {
        return this._fps
    }

    public setTool(tool: string): void {
        this._currentTool = tool
    }

    /** IPAD单指移动 / PC鼠标拖动 */
    private moveViewBox(e: PointerEvent): void {
        // if (e.target != this._canvas) return
        if (this._currentTool == 'move'
            && this._isPointerDown.primary
            && this._lastEvent.primary
            && !this._isPointerDown.secondary
            && isFingerOrMouse(this._currentEvent.primary!)) {
            let { movementX, movementY } = e
            // fix for touch 
            if (movementX == undefined) {
                movementX = this._currentEvent.primary!.screenX - this._lastEvent.primary!.screenX
                movementY = this._currentEvent.primary!.screenY - this._lastEvent.primary!.screenY
            }
            this._eventHandler.addEvent(new MoveViewPortEvent(movementX, movementY, e))
        }
    }

    private dragElements(e: PointerEvent, isFinal: boolean = false): void {
        if (this._gui!.selectedElements.size != 0
            && (this._currentTool == 'editor' || this._currentTool == 'addStraightLine' || this._currentTool == 'addCurve' || this._currentTool == 'shapeMark')
            && this._isDragging
            && this._isPointerDown.primary
            && this._lastEvent.primary
            && !this._isPointerDown.secondary
            && isFingerOrMouse(this._currentEvent.primary!)
        ) {
            // console.log("拖动中——")
            let { movementX, movementY } = e
            // fix for touch 
            if (movementX == undefined) {
                movementX = this._currentEvent.primary!.screenX - this._lastEvent.primary!.screenX
                movementY = this._currentEvent.primary!.screenY - this._lastEvent.primary!.screenY
            }
            this._eventHandler.addEvent(new DragElementsEvent(movementX, movementY, this._gui!.selectedElements, e, isFinal))
            this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
        }
    }

    /** IPAD 双指缩放 */
    private zoomViewBox(e: PointerEvent): void {
        if (this._isPointerDown.primary && isFinger(this._currentEvent.primary!)
            && this._isPointerDown.secondary && isFinger(this._currentEvent.secondary!)
        ) {
            if (this._lastEvent.primary == null || this._lastEvent.secondary == null) return
            if (this._currentEvent.primary == null || this._currentEvent.secondary == null) return

            this._eventHandler.addEvent(new ZoomViewPortEvent(
                this._lastEvent.primary.clientX, this._lastEvent.primary.clientY,
                this._currentEvent.primary.clientX, this._currentEvent.primary.clientY,
                this._lastEvent.secondary.clientX, this._lastEvent.secondary.clientY,
                this._currentEvent.secondary.clientX, this._currentEvent.secondary.clientY, e)
            )
        }
    }

    private changePointerStatus(target: Shape | Stage | null, e: PointerEvent): void {
        const isPrimary = (e: PointerEvent) => e.isPrimary
        let eventType = e.type
        /** set member */
        if (isPrimary(e)) {
            this._lastEvent.primary = this._currentEvent.primary
            this._currentEvent.primary = e
        } else {
            this._lastEvent.secondary = this._currentEvent.secondary
            this._currentEvent.secondary = e
        }
        if (e.cancelable) e.preventDefault();
        /** set is pointer down */
        if (eventType == 'pointerdown') {
            if (isPrimary(e)) this._isPointerDown.primary = true
            else this._isPointerDown.secondary = true
            if (this._currentTool != 'ruler') {
                this._pointPos = false
                this._linePos = false
                this._curvePos = false
            }
            this._isRect = false
            this._isCir = false
            this._isTri = false
            this._isLineMark = false
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.x = 0
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.y = 0
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.x = 0
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.y = 0
            if (this._currentTool == 'editor') {
                if (!e.ctrlKey) {
                    if (isDecoratedShape(target!)) {
                        if (target.guiElement instanceof GUIMarkLine) {
                            console.log("cannot be selected")
                        }
                        else if (target.guiElement instanceof GUIOnPoint && target.guiElement.previousGUILine instanceof GUIMarkLine) {
                            console.log("cannot be selected")
                        }
                        else {
                            if (this._gui!.selectedElements.size == 0) {
                                target.guiElement.isSelected = true
                            } else if (this._gui!.selectedElements.size == 1) {
                                if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                } else {
                                    for (let element of this._gui!.selectedElements.values()) {
                                        element.isSelected = false
                                    }
                                    target.guiElement.isSelected = true
                                }
                            } else if (this._gui!.selectedElements.size > 1) {
                                if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                } else {
                                    for (let element of this._gui!.selectedElements.values()) {
                                        element.isSelected = false
                                    }
                                    target.guiElement.isSelected = true
                                }
                            }
                            this._isSelecting = false
                            this._isDragging = true
                        }
                    } else {
                        let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                        let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                        for (let element of this._gui!.selectedElements.values()) {
                            element.isSelected = false
                        }
                        this._isDragging = false
                        this._isSelecting = true
                        this._multiSelectingRectPos.x1 = bufferX
                        this._multiSelectingRectPos.y1 = bufferY
                    }
                } else {
                    if (isDecoratedShape(target!)) {
                        if (target.guiElement instanceof GUIMarkLine) {
                            console.log("cannot be selected")
                        }
                        else if (target.guiElement instanceof GUIOnPoint && target.guiElement.previousGUILine instanceof GUIMarkLine) {
                            console.log("cannot be selected")
                        }
                        else {
                            if (this._gui!.selectedElements.size == 0) {
                                target.guiElement.isSelected = true
                            } else if (this._gui!.selectedElements.size == 1) {
                                if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                    target.guiElement.isSelected = false
                                } else {
                                    target.guiElement.isSelected = true
                                }
                            } else if (this._gui!.selectedElements.size > 1) {
                                if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                    this._gui!.selectedElements.get(target.guiElement.guiElementId)!.isSelected = false
                                } else {
                                    target.guiElement.isSelected = true
                                }
                            }
                            this._isSelecting = false
                            this._isDragging = true
                            this._gui!.selectedElementsRect!.baseBufferElement.width = 0
                            this._gui!.selectedElementsRect!.baseBufferElement.height = 0
                        }
                    } else {
                        let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                        let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                        this._isDragging = false
                        this._isSelecting = true
                        this._multiSelectingRectPos.x1 = bufferX
                        this._multiSelectingRectPos.y1 = bufferY
                    }
                }
            }
            else if (this._currentTool == 'addStraightLine') {
                console.log("ADD MODE --LINE")
                // console.log("this._isSelecting", this._isSelecting)
                // 设置模式为新建直线
                let flagPoint = 0 // 模式为直接新建直线
                // 清空所选元素
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                // 判断是否选中元素
                if (isDecoratedShape(target!)) {
                    target.guiElement.isSelected = true
                    if (this._gui!.selectedElements.size == 1) {
                        for (let currentGUIPoint of this._gui!.selectedElements.values()) {
                            // console.log("currentGUI",currentGUIPoint)
                            // console.log("targetGUIPoint",targetGUIPoint)
                            // 判断选择的元素是否只有一根线的端点
                            if (currentGUIPoint instanceof GUIOnPoint && (currentGUIPoint.nextGUILine == null || currentGUIPoint.previousGUILine == null)) {
                                // 设置模式为从端点连线
                                flagPoint = 1
                            }
                        }
                    }
                }
                this._isSelecting = false
                this._isDragging = true

                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                let targetPoint = new Point(bufferX, bufferY)
                let targetGUIPoint = new GUIOnPoint(targetPoint)

                if (flagPoint == 1) {
                    // console.log("选中了只有一根线的端点")
                    for (let currentGUIPoint of this._gui!.selectedElements.values()) {
                        if (currentGUIPoint instanceof GUIOnPoint) {
                            let currentPoint = currentGUIPoint.baseBufferElement.attributes["center"]
                            let guiLine = new GUIStraightLine(currentPoint, targetPoint)
                            guiLine.guiSegmentId = currentGUIPoint.guiSegmentId
                            targetGUIPoint.guiSegmentId = currentGUIPoint.guiSegmentId
                            // 确定当前直线的前后点
                            if (currentGUIPoint.previousGUILine == null) {
                                currentGUIPoint.previousGUILine = guiLine
                                targetGUIPoint.previousGUILine = null
                                targetGUIPoint.nextGUILine = guiLine
                                guiLine.previousGUIPoint = targetGUIPoint
                                guiLine.nextGUIPoint = currentGUIPoint
                            }
                            else {
                                currentGUIPoint.nextGUILine = guiLine
                                targetGUIPoint.nextGUILine = null
                                targetGUIPoint.previousGUILine = guiLine
                                guiLine.previousGUIPoint = currentGUIPoint
                                guiLine.nextGUIPoint = targetGUIPoint
                            }
                            // console.debug("construct Line", currentPoint, targetPoint)
                            // 取消原处点的选中
                            this._gui!.selectedElements.get(currentGUIPoint.guiElementId)!.isSelected = false
                        }
                    }
                }
                else {
                    // console.log("选中了直线/曲线/有前后线的端点/曲线控制点/画布")
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    this._svgMax = this._svgMax + 1
                    let currentPoint = new Point(targetPoint.x, targetPoint.y)
                    let currentGUIPoint = new GUIOnPoint(currentPoint)
                    currentGUIPoint.guiSegmentId = this._svgMax
                    // console.log("将当前直线加入队列中")
                    let guiLine = new GUIStraightLine(currentPoint, targetPoint)
                    guiLine.guiSegmentId = this._svgMax
                    targetGUIPoint.guiSegmentId = this._svgMax
                    // 确定当前直线的前后点
                    targetGUIPoint.previousGUILine = guiLine
                    currentGUIPoint.nextGUILine = guiLine
                    targetGUIPoint.nextGUILine = null
                    currentGUIPoint.previousGUILine = null
                    guiLine.previousGUIPoint = currentGUIPoint
                    guiLine.nextGUIPoint = targetGUIPoint
                    // console.debug("construct Line", currentPoint, targetPoint)
                }
                // 选中新建点开始拖拽
                this._gui!.selectedElements.set(targetGUIPoint.guiElementId, targetGUIPoint)
                this._gui!.selectedElements.get(targetGUIPoint.guiElementId)!.isSelected = true
            }
            else if (this._currentTool == 'addCurve') {
                // 添加曲线
                console.log("ADD MODE --CURVE")
                // 设置模式为新建直线
                let flagPoint = 0 // 模式为直接新建直线
                // 清空所选元素
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                // 判断是否选中元素
                if (isDecoratedShape(target!)) {
                    target.guiElement.isSelected = true
                    if (this._gui!.selectedElements.size == 1) {
                        for (let currentGUIPoint of this._gui!.selectedElements.values()) {
                            // console.log("currentGUI",currentGUIPoint)
                            // console.log("targetGUIPoint",targetGUIPoint)
                            // 判断选择的元素是否只有一根线的端点
                            if (currentGUIPoint instanceof GUIOnPoint && (currentGUIPoint.nextGUILine == null || currentGUIPoint.previousGUILine == null)) {
                                // 设置模式为从端点连线
                                flagPoint = 1
                            }
                        }
                    }
                }
                this._isSelecting = false
                this._isDragging = true

                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                // 端点
                let targetPoint = new Point(bufferX, bufferY)
                let targetGUIPoint = new GUIOnPoint(targetPoint)
                // 控制点


                if (flagPoint == 1) {
                    // console.log("选中了只有一根线的端点")
                    for (let currentGUIPoint of this._gui!.selectedElements.values()) {
                        if (currentGUIPoint instanceof GUIOnPoint) {
                            let currentPoint = currentGUIPoint.baseBufferElement.attributes["center"]
                            // 控制线
                            let controlPoint1 = new Point(targetPoint.x + 1, targetPoint.y)
                            let controlPoint2 = new Point(targetPoint.x + 1, targetPoint.y)
                            let controlGUIPoint1 = new GUIOffPoint(controlPoint1)
                            controlGUIPoint1.guiSegmentId = currentGUIPoint.guiSegmentId
                            let controlGUIPoint2 = new GUIOffPoint(controlPoint2)
                            controlGUIPoint2.guiSegmentId = currentGUIPoint.guiSegmentId
                            let controlGUILine1 = new GUIControlLine(controlPoint1, currentPoint, currentGUIPoint, controlGUIPoint1)
                            controlGUILine1.guiSegmentId = currentGUIPoint.guiSegmentId
                            let controlGUILine2 = new GUIControlLine(controlPoint2, targetPoint, targetGUIPoint, controlGUIPoint2)
                            controlGUILine2.guiSegmentId = currentGUIPoint.guiSegmentId
                            let guiLine = new GUICubicCurve(currentPoint, targetPoint, controlPoint1, controlPoint2)
                            guiLine.guiSegmentId = currentGUIPoint.guiSegmentId
                            targetGUIPoint.guiSegmentId = currentGUIPoint.guiSegmentId
                            // 绑定控制线和点
                            controlGUIPoint1.correspondingGUIPoint = currentGUIPoint
                            controlGUIPoint1.correspondingGUIControlLine = controlGUILine1
                            controlGUILine1.onPoint = currentGUIPoint
                            controlGUILine1.offPoint = controlGUIPoint1

                            controlGUIPoint2.correspondingGUIPoint = targetGUIPoint
                            controlGUIPoint2.correspondingGUIControlLine = controlGUILine2
                            controlGUILine2.onPoint = targetGUIPoint
                            controlGUILine2.offPoint = controlGUIPoint2

                            // 确定当前直线的前后点
                            if (currentGUIPoint.previousGUILine == null) {
                                currentGUIPoint.previousGUILine = guiLine
                                currentGUIPoint.previousControlPoint = controlGUIPoint1

                                targetGUIPoint.previousGUILine = null
                                targetGUIPoint.previousControlPoint = null
                                targetGUIPoint.nextGUILine = guiLine
                                targetGUIPoint.nextControlPoint = controlGUIPoint2

                                guiLine.nextGUIPoint = currentGUIPoint
                                guiLine.previousGUIPoint = targetGUIPoint
                            }
                            else {
                                currentGUIPoint.nextGUILine = guiLine
                                currentGUIPoint.nextControlPoint = controlGUIPoint1

                                targetGUIPoint.nextGUILine = null
                                targetGUIPoint.nextControlPoint = null
                                targetGUIPoint.previousGUILine = guiLine
                                targetGUIPoint.previousControlPoint = controlGUIPoint2

                                guiLine.previousGUIPoint = currentGUIPoint
                                guiLine.nextGUIPoint = targetGUIPoint
                            }
                            // console.debug("construct Line", currentPoint, targetPoint)
                            // 取消原处点的选中
                            this._gui!.selectedElements.get(currentGUIPoint.guiElementId)!.isSelected = false
                        }
                    }
                }
                else {
                    // console.log("选中了直线/曲线/有前后线的端点/曲线控制点/画布")
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    this._svgMax = this._svgMax + 1
                    let currentPoint = new Point(targetPoint.x, targetPoint.y)
                    let currentGUIPoint = new GUIOnPoint(currentPoint)
                    currentGUIPoint.guiSegmentId = this._svgMax
                    // 控制线
                    let controlPoint1 = new Point(targetPoint.x + 1, targetPoint.y)
                    let controlPoint2 = new Point(targetPoint.x + 1, targetPoint.y)
                    let controlGUIPoint1 = new GUIOffPoint(controlPoint1)
                    controlGUIPoint1.guiSegmentId = this._svgMax
                    let controlGUIPoint2 = new GUIOffPoint(controlPoint2)
                    controlGUIPoint2.guiSegmentId = this._svgMax
                    let controlGUILine1 = new GUIControlLine(controlPoint1, currentPoint, currentGUIPoint, controlGUIPoint1)
                    controlGUILine1.guiSegmentId = this._svgMax
                    let controlGUILine2 = new GUIControlLine(controlPoint2, targetPoint, targetGUIPoint, controlGUIPoint2)
                    controlGUILine2.guiSegmentId = this._svgMax
                    // console.log("将当前直线加入队列中")
                    let guiLine = new GUICubicCurve(currentPoint, targetPoint, controlPoint1, controlPoint2)
                    guiLine.guiSegmentId = this._svgMax
                    targetGUIPoint.guiSegmentId = this._svgMax
                    // 确定当前直线的前后点
                    controlGUIPoint1.correspondingGUIPoint = currentGUIPoint
                    controlGUIPoint1.correspondingGUIControlLine = controlGUILine1
                    controlGUILine1.onPoint = currentGUIPoint
                    controlGUILine1.offPoint = controlGUIPoint1

                    controlGUIPoint2.correspondingGUIPoint = targetGUIPoint
                    controlGUIPoint2.correspondingGUIControlLine = controlGUILine2
                    controlGUILine2.onPoint = targetGUIPoint
                    controlGUILine2.offPoint = controlGUIPoint2

                    currentGUIPoint.nextGUILine = guiLine
                    currentGUIPoint.nextControlPoint = controlGUIPoint1
                    currentGUIPoint.previousGUILine = null
                    currentGUIPoint.previousControlPoint = null

                    targetGUIPoint.nextGUILine = null
                    targetGUIPoint.nextControlPoint = null
                    targetGUIPoint.previousGUILine = guiLine
                    targetGUIPoint.previousControlPoint = controlGUIPoint2

                    guiLine.previousGUIPoint = currentGUIPoint
                    guiLine.nextGUIPoint = targetGUIPoint

                    // console.debug("construct Line", currentPoint, targetPoint, controlGUIPoint1, controlGUIPoint2)
                }
                // 选中新建点开始拖拽
                this._gui!.selectedElements.set(targetGUIPoint.guiElementId, targetGUIPoint)
                this._gui!.selectedElements.get(targetGUIPoint.guiElementId)!.isSelected = true
            }
            else if (this._currentTool == 'deleteLine') {
                console.log("DELETE MODE - LINE")
                //首先判断是否选中元素了
                this._isSelecting = false
                this._isDragging = true
                if (isDecoratedShape(target!)) { //选中元素了
                    // console.log("一、选中元素了")
                    // 取消之前所有元素的选中，只选中当前元素
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    target.guiElement.isSelected = true
                    // if (this._gui!.selectedElements.size > 1) {
                    //     let iterator = this._gui!.selectedElements.values()
                    //     console.log(iterator.next())
                    //     let line = iterator.next().value
                    //     line.isVisible = false
                    //     for (let element of this._gui!.selectedElements.values()) {
                    //         if (element instanceof GUIOnPoint) {
                    //             if ((element.previousGUILine == null || element.previousGUILine?.isVisible == false) && (element.nextGUILine == null || element.nextGUILine?.isVisible == false)) {
                    //                 element.isVisible = false
                    //             }
                    //         }
                    //         else {
                    //             element.isVisible = false
                    //         }
                    //     }
                    // }
                    // target.guiElement.isSelected = false

                    if (instanceOfGUILine(target.guiElement)) {
                        target.guiElement.isVisible = false

                        let previousGUIPoint = target.guiElement.previousGUIPoint
                        let nextGUIPoint = target.guiElement.nextGUIPoint!
                        if (previousGUIPoint instanceof GUIOnPoint && nextGUIPoint instanceof GUIOnPoint) {
                            if (previousGUIPoint.previousGUILine && nextGUIPoint.nextGUILine) {
                                console.log('both')
                                // 判断是否同一根
                                let isClose = this._svgPath.get(target.guiElement.guiSegmentId!)!
                                if (isClose[0].isClosed) {
                                    let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                    this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                                }
                                else {
                                    let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                    this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                                    seg = this.transSegment(nextGUIPoint.nextGUILine)
                                    this._svgMax = this._svgMax + 1
                                    this._msgSend.push(['add', this._svgMax, seg, true])
                                }
                            }
                            else if (previousGUIPoint.previousGUILine) {
                                console.log('pre')
                                let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                            }
                            else if (nextGUIPoint.nextGUILine) {
                                console.log('next')
                                let seg = this.transSegment(nextGUIPoint.nextGUILine)

                                this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                                // this._msgSend.push(['delete', targetPoint.guiSegmentId])
                            }
                            else {
                                console.log('none')
                                // let seg = this.transSegment(target.guiElement)
                                this._msgSend.push(['delete', target.guiElement.guiSegmentId])
                            }
                        }
                    }
                }
            }
            else if (this._currentTool == 'deletePoint') {
                this._isSelecting = false
                this._isDragging = true
                console.log("DELETE MODE - POINT")
                //首先判断是否选中元素了
                if (isDecoratedShape(target!)) { //选中元素了
                    // console.log("一、选中元素了")
                    // 取消之前所有元素的选中，只选中当前元素
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    let element = target.guiElement
                    if (element instanceof GUIOnPoint) {
                        element.isVisible = false
                        if (element.previousGUILine)
                            element.previousGUILine.isVisible = false
                        if (element.nextGUILine)
                            element.nextGUILine.isVisible = false
                        let previousGUIPoint = element.previousGUILine?.previousGUIPoint
                        let nextGUIPoint = element.nextGUILine?.nextGUIPoint

                        if (previousGUIPoint instanceof GUIOnPoint && nextGUIPoint instanceof GUIOnPoint) {
                            if (previousGUIPoint.previousGUILine && nextGUIPoint.nextGUILine) {
                                console.log('both')
                                // 判断是否同一根
                                let isClose = this._svgPath.get(target.guiElement.guiSegmentId!)!
                                if (isClose[0].isClosed) {
                                    let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                    this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                                }
                                else {
                                    let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                    this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                                    seg = this.transSegment(nextGUIPoint.nextGUILine)
                                    this._svgMax = this._svgMax + 1
                                    this._msgSend.push(['add', this._svgMax, seg, true])
                                }
                            }
                            else if (previousGUIPoint.previousGUILine) {
                                console.log('pre')
                                let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg], this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill)
                            }
                            else if (nextGUIPoint.nextGUILine) {
                                console.log('next')
                                let seg = this.transSegment(nextGUIPoint.nextGUILine)

                                this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                                // this._msgSend.push(['delete', targetPoint.guiSegmentId])
                            }
                            else {
                                console.log('none')
                                // let seg = this.transSegment(target.guiElement)
                                this._msgSend.push(['delete', target.guiElement.guiSegmentId])
                            }
                        }
                        else if (previousGUIPoint instanceof GUIOnPoint) {
                            if (previousGUIPoint.previousGUILine) {
                                let seg = this.transSegment(previousGUIPoint.previousGUILine)
                                this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                            }
                            else {
                                this._msgSend.push(['delete', target.guiElement.guiSegmentId])
                            }
                        }
                        else if (nextGUIPoint instanceof GUIOnPoint) {
                            if (nextGUIPoint.nextGUILine) {
                                let seg = this.transSegment(nextGUIPoint.nextGUILine)
                                this._msgSend.push(['edit', target.guiElement.guiSegmentId, seg, this._svgPath.get(target.guiElement!.guiSegmentId)![0].fill])
                            }
                            else {
                                this._msgSend.push(['delete', target.guiElement.guiSegmentId])
                            }
                        }
                        // 前线是直线
                        // if (element.previousGUILine instanceof GUIStraightLine) {
                        //     if (element.previousGUILine.isVisible == true) {
                        //         // 删除前线
                        //         element.previousGUILine.isVisible = false
                        //         // 判断前线的另一个点是否还有线连着
                        //         if (element.previousGUILine.previousGUIPoint instanceof GUIOnPoint && (element.previousGUILine.previousGUIPoint.previousGUILine == null || element.previousGUILine.previousGUIPoint.previousGUILine.isVisible == false)) {
                        //             element.previousGUILine.previousGUIPoint.isVisible = false
                        //         }
                        //     }
                        // }
                        // 前线是曲线
                        // else if (element.previousGUILine instanceof GUICubicCurve) {
                        //     if (element.previousGUILine.isVisible == true) {
                        //         // 删除前线
                        //         element.previousGUILine.isVisible = false
                        //         // 删除前控制线
                        //         if (element.previousControlPoint != null && element.previousControlPoint.correspondingGUIControlLine != null) {
                        //             element.previousControlPoint.isVisible = false
                        //             element.previousControlPoint.correspondingGUIControlLine.isVisible = false
                        //         }
                        //         if (element.previousGUILine.previousGUIPoint instanceof GUIOnPoint) {
                        //             // 删除另一个点的后控制线
                        //             if (element.previousGUILine.previousGUIPoint.nextControlPoint != null && element.previousGUILine.previousGUIPoint.nextControlPoint.correspondingGUIControlLine != null) {
                        //                 element.previousGUILine.previousGUIPoint.nextControlPoint.isVisible = false
                        //                 element.previousGUILine.previousGUIPoint.nextControlPoint.correspondingGUIControlLine.isVisible = false
                        //             }
                        //             // 判断前线的另一个点是否还有线连着
                        //             if (element.previousGUILine.previousGUIPoint.previousGUILine == null || element.previousGUILine.previousGUIPoint.previousGUILine.isVisible == false) {
                        //                 element.previousGUILine.previousGUIPoint.isVisible = false
                        //             }
                        //         }
                        //     }
                        // }
                        // if (element.nextGUILine instanceof GUIStraightLine) {
                        //     if (element.nextGUILine.isVisible == true) {
                        //         element.nextGUILine.isVisible = false
                        //         if (element.nextGUILine.nextGUIPoint instanceof GUIOnPoint && (element.nextGUILine.nextGUIPoint.nextGUILine == null || element.nextGUILine.nextGUIPoint.nextGUILine.isVisible == false)) {
                        //             element.nextGUILine.nextGUIPoint.isVisible = false
                        //         }
                        //     }
                        // }
                        // else if (element.nextGUILine instanceof GUICubicCurve) {
                        //     if (element.nextGUILine.isVisible == true) {
                        //         // 删除后线
                        //         element.nextGUILine.isVisible = false
                        //         // 删除后控制线
                        //         if (element.nextControlPoint != null && element.nextControlPoint.correspondingGUIControlLine != null) {
                        //             element.nextControlPoint.isVisible = false
                        //             element.nextControlPoint.correspondingGUIControlLine.isVisible = false
                        //         }
                        //         if (element.nextGUILine.nextGUIPoint instanceof GUIOnPoint) {
                        //             // 删除另一个点的后控制线
                        //             if (element.nextGUILine.nextGUIPoint.previousControlPoint != null && element.nextGUILine.nextGUIPoint.previousControlPoint.correspondingGUIControlLine != null) {
                        //                 element.nextGUILine.nextGUIPoint.previousControlPoint.isVisible = false
                        //                 element.nextGUILine.nextGUIPoint.previousControlPoint.correspondingGUIControlLine.isVisible = false
                        //             }
                        //             // 判断前线的另一个点是否还有线连着
                        //             if (element.nextGUILine.nextGUIPoint.nextGUILine == null || element.nextGUILine.nextGUIPoint.nextGUILine.isVisible == false) {
                        //                 element.nextGUILine.nextGUIPoint.isVisible = false
                        //             }
                        //         }
                        //     }
                        // }
                    }

                }
            }
            else if (this._currentTool == 'mark') {
                console.log("MARK")
                if (isDecoratedShape(target!)) { //选中元素了
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    target.guiElement.isSelected = true
                    this._isSelecting = false
                    this._isDragging = false

                    this._ifMarked = true
                    this._markedId = target.guiElement.guiElementId

                    let commentPos = new Point(e.clientX, e.clientY)
                    this._textPoint = commentPos
                }
                else {
                    console.log("no element choose to mark!")
                }
            }
            //添加文本
            else if (this._currentTool == 'markText') {
                // console.log("Text")
                // if (this._ifMarkedCanvas == false) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                let targetPoint = new Point(bufferX, bufferY)
                let textPos = new Point(e.clientX, e.clientY)

                this._markPoint = targetPoint
                this._textPoint = textPos
                this._ifMarkedCanvas = true
                // }

            }
            else if (this._currentTool == 'deleteMark') {
                this._isSelecting = false
                this._isDragging = true
                console.log("DELETE MODE - MARK")
                //首先判断是否选中元素了
                if (isDecoratedShape(target!)) { //选中元素了
                    // console.log("一、选中元素了")
                    // 取消之前所有元素的选中，只选中当前元素
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    target.guiElement.isSelected = true
                    if (this._gui!.selectedElements.size == 1) {
                        for (let element of this._gui!.selectedElements.values()) {
                            // 选中一个端点
                            if (element instanceof GUIText) {
                                element.isVisible = false
                            }
                        }
                    }
                    this._msgSend.push(['delete', target.guiElement.guiSegmentId])
                    target.guiElement.isSelected = false
                }
            }
            else if (this._currentTool == 'addRectangle') {
                this._isRect = true
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._isDragging = false
                this._isSelecting = false

                this._multiSelectingRectPos.x1 = bufferX
                this._multiSelectingRectPos.y1 = bufferY
            }
            else if (this._currentTool == 'addCircle') {
                this._isCir = true
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._isDragging = false
                this._isSelecting = false

                this._circlePos.x1 = bufferX
                this._circlePos.y1 = bufferY
                this._gui!.multiSelectingCircle!.baseBufferElement.center.x = this._circlePos.x1
                this._gui!.multiSelectingCircle!.baseBufferElement.center.y = this._circlePos.y1
            }
            else if (this._currentTool == 'addTriangle') {
                this._isTri = true
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._isDragging = false
                this._isSelecting = false
                this._circlePos.x1 = bufferX
                this._circlePos.y1 = bufferY
                this._gui!.multiSelectingTri!.baseBufferElement.center.x = this._circlePos.x1
                this._gui!.multiSelectingTri!.baseBufferElement.center.y = this._circlePos.y1
            }
            else if (this._currentTool == 'ruler') {
                console.log("ruler MODE")
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                if (isDecoratedShape(target!)) { //选中元素了

                    target.guiElement.isSelected = true

                    if (target.guiElement instanceof GUIOnPoint) {
                        this._posSegment = []
                        this._posSegment.push(target.guiElement!.baseBufferElement.center.x)
                        this._posSegment.push(target.guiElement!.baseBufferElement.center.y)
                        this._pointPos = true
                        this._linePos = false
                        this._curvePos = false
                    }
                    else if (target.guiElement instanceof GUILine) {
                        this._posSegment = []
                        let x1 = target.guiElement.previousGUIPoint!.baseBufferElement.center.x
                        let y1 = target.guiElement.previousGUIPoint!.baseBufferElement.center.y
                        let x2 = target.guiElement.nextGUIPoint!.baseBufferElement.center.x
                        let y2 = target.guiElement.nextGUIPoint!.baseBufferElement.center.y
                        let l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
                        let a = Math.round(Math.asin(Math.abs(y1 - y2) / l) / Math.PI * 180)
                        this._posSegment.push(x1)
                        this._posSegment.push(y1)
                        this._posSegment.push(x2)
                        this._posSegment.push(y2)
                        this._posSegment.push(l)
                        this._posSegment.push(a)

                        this._pointPos = false
                        this._linePos = true
                        this._curvePos = false
                    }
                    else if (target.guiElement instanceof GUICubicCurve) {
                        this._posSegment = []
                        let x1 = target.guiElement.previousGUIPoint!.baseBufferElement.center.x
                        let y1 = target.guiElement.previousGUIPoint!.baseBufferElement.center.y
                        let x2 = target.guiElement.nextGUIPoint!.baseBufferElement.center.x
                        let y2 = target.guiElement.nextGUIPoint!.baseBufferElement.center.y
                        let cx1 = target.guiElement.previousGUIPoint!.nextControlPoint!.baseBufferElement.center.x
                        let cy1 = target.guiElement.previousGUIPoint!.nextControlPoint!.baseBufferElement.center.y
                        let cx2 = target.guiElement.nextGUIPoint!.previousControlPoint!.baseBufferElement.center.x
                        let cy2 = target.guiElement.nextGUIPoint!.previousControlPoint!.baseBufferElement.center.y
                        let l1 = Math.sqrt((x1 - cx1) * (x1 - cx1) + (y1 - cy1) * (y1 - cy1))
                        let l2 = Math.sqrt((x2 - cx2) * (x2 - cx2) + (y2 - cy2) * (y2 - cy2))
                        let a1 = Math.round(Math.asin(Math.abs(y1 - cy1) / l1) / Math.PI * 180)
                        let a2 = Math.round(Math.asin(Math.abs(y2 - cy2) / l2) / Math.PI * 180)
                        this._posSegment.push(x1)
                        this._posSegment.push(y1)
                        this._posSegment.push(x2)
                        this._posSegment.push(y2)
                        this._posSegment.push(l1)
                        this._posSegment.push(l2)
                        this._posSegment.push(a1)
                        this._posSegment.push(a2)
                        this._pointPos = false
                        this._linePos = false
                        this._curvePos = true
                    }

                    this._isSelecting = false
                    this._isDragging = false

                } else {
                    //选中画布了
                    // console.log("二、选中画布了，停止拖拽元素操作,清空所有元素并开始框选行为")
                    let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                    let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }


                    this._posSegment = []
                    let x1 = bufferX
                    let y1 = bufferY
                    let x2 = bufferX
                    let y2 = bufferY
                    let l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
                    // let a = Math.round(Math.asin(Math.abs(y1 - y2) / l) / Math.PI * 180)
                    let a = 0
                    this._posSegment.push(x1)
                    this._posSegment.push(y1)
                    this._posSegment.push(x2)
                    this._posSegment.push(y2)
                    this._posSegment.push(l)
                    this._posSegment.push(a)
                    this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.x = bufferX
                    this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.y = bufferY
                    this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.x = bufferX
                    this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.y = bufferY
                    this._isDragging = false
                    this._isSelecting = true
                    this._pointPos = false
                    this._linePos = true
                    this._curvePos = false
                }
            }
            else if (this._currentTool == 'shapeMark') {
                if (isDecoratedShape(target!)) {
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    if (target.guiElement instanceof GUIStraightLine) {
                        // 选中直线
                        this._isSelecting = false
                        this._isDragging = false
                        this._isLineMark = true
                        let guiStraightLine = target.guiElement
                        let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                        let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                        let point1 = guiStraightLine?.previousGUIPoint
                        let point2 = guiStraightLine?.nextGUIPoint
                        let newX = 0, newY = 0
                        let startPoint
                        let startGUIPoint
                        if (point1!.baseBufferElement.center.y == point2!.baseBufferElement.center.y) {
                            if (Math.abs(bufferX - point1!.baseBufferElement.center.x) > Math.abs(point2!.baseBufferElement.center.x - bufferX)) {
                                newX = point2!.baseBufferElement.center.x
                                newY = point2!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point2
                            }
                            else {
                                newX = point1!.baseBufferElement.center.x
                                newY = point1!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point1
                            }
                        }
                        else {
                            if (Math.abs(bufferY - point1!.baseBufferElement.center.y) > Math.abs(point2!.baseBufferElement.center.y - bufferY)) {
                                newX = point2!.baseBufferElement.center.x
                                newY = point2!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point2
                            }
                            else {
                                newX = point1!.baseBufferElement.center.x
                                newY = point1!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point1
                            }
                        }
                        let endPoint = new Point(bufferX, bufferY)
                        let endGUIPoint = new GUIOnPoint(endPoint)
                        let markGUILine = new GUIMarkLine(startPoint, endPoint, startGUIPoint, endGUIPoint, guiStraightLine)
                        endGUIPoint.previousGUILine = markGUILine
                        if (point1!.baseBufferElement.center.y == point2!.baseBufferElement.center.y) {
                            if (Math.abs(bufferX - point1!.baseBufferElement.center.x) > Math.abs(point2!.baseBufferElement.center.x - bufferX)) {
                                guiStraightLine.nextMarkLine = markGUILine
                            }
                            else {
                                guiStraightLine.previousMarkLine = markGUILine
                            }
                        }
                        else {
                            if (Math.abs(bufferY - point1!.baseBufferElement.center.y) > Math.abs(point2!.baseBufferElement.center.y - bufferY)) {
                                guiStraightLine.nextMarkLine = markGUILine
                            }
                            else {
                                guiStraightLine.previousMarkLine = markGUILine
                            }
                        }
                        this._multiSelectingRectPos.x1 = newX
                        this._multiSelectingRectPos.y1 = newY
                        this._gui!.selectedElements.set(endGUIPoint.guiElementId, endGUIPoint)
                        this._gui!.selectedElements.get(endGUIPoint.guiElementId)!.isSelected = true
                    }
                    else if (target.guiElement instanceof GUICubicCurve) {
                        // 选中曲线
                        this._isSelecting = false
                        this._isDragging = false
                        this._isLineMark = true
                        let guiCurve = target.guiElement
                        let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                        let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                        let point1 = guiCurve?.previousGUIPoint
                        let point2 = guiCurve?.nextGUIPoint
                        let fatherLine
                        let newX = 0, newY = 0
                        let startPoint
                        let startGUIPoint
                        if (point1!.baseBufferElement.center.y == point2!.baseBufferElement.center.y) {
                            if (Math.abs(bufferX - point1!.baseBufferElement.center.x) > Math.abs(point2!.baseBufferElement.center.x - bufferX)) {
                                newX = point2!.baseBufferElement.center.x
                                newY = point2!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point2
                                fatherLine = point2?.previousControlPoint?.correspondingGUIControlLine
                            }
                            else {
                                newX = point1!.baseBufferElement.center.x
                                newY = point1!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point1
                                fatherLine = point1?.nextControlPoint?.correspondingGUIControlLine
                            }
                        }
                        else {
                            if (Math.abs(bufferY - point1!.baseBufferElement.center.y) > Math.abs(point2!.baseBufferElement.center.y - bufferY)) {
                                newX = point2!.baseBufferElement.center.x
                                newY = point2!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point2
                                fatherLine = point2?.previousControlPoint?.correspondingGUIControlLine
                            }
                            else {
                                newX = point1!.baseBufferElement.center.x
                                newY = point1!.baseBufferElement.center.y
                                startPoint = new Point(newX, newY)
                                startGUIPoint = point1
                                fatherLine = point1?.nextControlPoint?.correspondingGUIControlLine
                            }
                        }
                        let endPoint = new Point(bufferX, bufferY)
                        let endGUIPoint = new GUIOnPoint(endPoint)
                        let markGUILine = new GUIMarkLine(startPoint, endPoint, startGUIPoint, endGUIPoint, fatherLine)
                        endGUIPoint.previousGUILine = markGUILine
                        if (point1!.baseBufferElement.center.y == point2!.baseBufferElement.center.y) {
                            if (Math.abs(bufferX - point1!.baseBufferElement.center.x) > Math.abs(point2!.baseBufferElement.center.x - bufferX)) {
                                guiCurve.nextMarkLine = markGUILine
                            }
                            else {
                                guiCurve.previousMarkLine = markGUILine
                            }
                        }
                        else {
                            if (Math.abs(bufferY - point1!.baseBufferElement.center.y) > Math.abs(point2!.baseBufferElement.center.y - bufferY)) {
                                guiCurve.nextMarkLine = markGUILine
                            }
                            else {
                                guiCurve.previousMarkLine = markGUILine
                            }
                        }
                        this._multiSelectingRectPos.x1 = newX
                        this._multiSelectingRectPos.y1 = newY
                        this._gui!.selectedElements.set(endGUIPoint.guiElementId, endGUIPoint)
                        this._gui!.selectedElements.get(endGUIPoint.guiElementId)!.isSelected = true
                    }
                    else if (target.guiElement instanceof GUIOnPoint) {
                        // 选中点
                        this._isSelecting = false
                        this._isDragging = false
                        let guiPoint = target.guiElement
                        // let markRing = new BaseBufferRing(guiPoint.baseBufferElement.center)
                        let markGUIRing = new GUIRing(guiPoint.baseBufferElement.center)
                        markGUIRing.fatherPoint = guiPoint
                        guiPoint.markRing = markGUIRing
                        // console.log("transcontrol",endGUIPoint)
                        if (guiPoint.previousGUILine) {
                            let seg = this.transSegment(guiPoint.previousGUILine)
                            // console.log("transcontrol",seg)
                            this._msgSend.push(['edit', guiPoint.guiSegmentId, seg, this._svgPath.get(guiPoint!.guiSegmentId)![0].fill])
                        }
                        else if (guiPoint.nextGUILine) {
                            let seg = this.transSegment(guiPoint.nextGUILine)
                            // console.log("transcontrol",seg)
                            this._msgSend.push(['edit', guiPoint.guiSegmentId, seg, this._svgPath.get(guiPoint!.guiSegmentId)![0].fill])
                        }
                        this._ifSend = 1
                    }

                }
            }
            else if (this._currentTool == 'changeFill') {
                if (isDecoratedShape(target!)) {
                    console.log("here")
                    if (this._svgPath.get(target.guiElement.guiSegmentId)![0].fill == true)
                        this._msgSend.push(['changeFill', target.guiElement.guiSegmentId, false])
                    else
                        this._msgSend.push(['changeFill', target.guiElement.guiSegmentId, true])
                }
                this._ifSend = 1
            }

            this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
        } else if (eventType == 'pointermove') {
            if (this._isSelecting && this._linePos) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.x = bufferX
                this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.y = bufferY
                let x1 = this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.x
                let y1 = this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.y
                let x2 = bufferX
                let y2 = bufferY
                let l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
                let a = 0
                if (l != 0) {
                    a = Math.round(Math.asin(Math.abs(y1 - y2) / l) / Math.PI * 180)
                }
                this._posSegment[2] = bufferX
                this._posSegment[3] = bufferY
                this._posSegment[4] = l
                this._posSegment[5] = a
            }
            else if ((this._isSelecting || this._isRect) && !this._linePos) {
                // console.log("正在拖动——")
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                if (bufferX <= this._multiSelectingRectPos.x1) {
                    this._gui!.multiSelectingRect!.baseBufferElement.leftTop.x = bufferX
                    this._gui!.multiSelectingRect!.baseBufferElement.width = this._multiSelectingRectPos.x1 - bufferX
                } else {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.x = this._multiSelectingRectPos.x1
                    this._gui!.multiSelectingRect!.baseBufferElement.width = bufferX - this._multiSelectingRectPos.x1
                }

                if (bufferY <= this._multiSelectingRectPos.y1) {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.y = bufferY
                    this._gui!.multiSelectingRect!.baseBufferElement.height = this._multiSelectingRectPos.y1 - bufferY
                } else {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.y = this._multiSelectingRectPos.y1
                    this._gui!.multiSelectingRect!.baseBufferElement.height = bufferY - this._multiSelectingRectPos.y1
                }
            }
            else if (this._isCir) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                this._gui!.multiSelectingCircle!.baseBufferElement.radius = Math.sqrt(Math.pow(this._circlePos.x1 - bufferX, 2) + Math.pow(this._circlePos.y1 - bufferY, 2)) * 2.5
            }
            else if (this._isTri) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                this._gui!.multiSelectingTri!.baseBufferElement.radius = Math.sqrt(Math.pow(this._circlePos.x1 - bufferX, 2) + Math.pow(this._circlePos.y1 - bufferY, 2)) * 2.5
            }
            else if (this._isLineMark) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                let endGUIPoint
                for (endGUIPoint of this._gui!.selectedElements.values()) {
                }
                if (endGUIPoint instanceof GUIOnPoint) {
                    let guiMarkLine = endGUIPoint.previousGUILine
                    if (guiMarkLine instanceof GUIMarkLine) {
                        let guiLine = guiMarkLine.fatherGUILine
                        if (instanceOfGUILine(guiLine)) {
                            let point1 = guiLine?.previousGUIPoint
                            let point2 = guiLine?.nextGUIPoint
                            if (point1!.baseBufferElement.center.y == point2!.baseBufferElement.center.y) {
                                endGUIPoint.baseBufferElement.center.x = bufferX
                                endGUIPoint.baseBufferElement.center.y = point1!.baseBufferElement.center.y
                            }
                            else if (point1!.baseBufferElement.center.x == point2!.baseBufferElement.center.x) {
                                endGUIPoint.baseBufferElement.center.x = point1!.baseBufferElement.center.x
                                endGUIPoint.baseBufferElement.center.y = bufferY
                            }
                            else {
                                let newX = this._multiSelectingRectPos.x1 - (point1!.baseBufferElement.center.x - point2!.baseBufferElement.center.x) / (point1!.baseBufferElement.center.y - point2!.baseBufferElement.center.y) * (this._multiSelectingRectPos.y1 - bufferY)
                                endGUIPoint.baseBufferElement.center.x = newX
                                endGUIPoint.baseBufferElement.center.y = bufferY
                            }
                        }
                    }
                }
            }
            else if (this._isDragging) {
                for (let element of this._gui!.selectedElements.values()) {
                    if (element instanceof GUIOffPoint) {
                        element = element.correspondingGUIPoint!
                    }
                    if (element instanceof GUIOnPoint) {
                        if (element.previousGUILine instanceof GUIStraightLine) {
                            let newelement = element.previousGUILine
                            if (newelement.previousMarkLine) {
                                let x1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.previousMarkLine.l
                                x1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x = (x1 - x2) / ll * l + x1
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y = (y1 - y2) / ll * l + y1
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.x = newelement.previousGUIPoint!.baseBufferElement.center.x
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.y = newelement.previousGUIPoint!.baseBufferElement.center.y
                            }
                            if (newelement.nextMarkLine) {
                                let x1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.nextMarkLine.l
                                x1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y

                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x = (x1 - x2) / ll * l + x1
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y = (y1 - y2) / ll * l + y1
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.x = newelement.nextGUIPoint!.baseBufferElement.center.x
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.y = newelement.nextGUIPoint!.baseBufferElement.center.y

                            }
                        }
                        else if (element.previousGUILine instanceof GUICubicCurve) {
                            let newelement = element.previousGUILine
                            if (newelement.previousMarkLine) {
                                let x1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.previousMarkLine.l
                                x1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x = (x1 - x2) / ll * l + x1
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y = (y1 - y2) / ll * l + y1
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.x = newelement.previousGUIPoint!.baseBufferElement.center.x
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.y = newelement.previousGUIPoint!.baseBufferElement.center.y
                            }
                            if (newelement.nextMarkLine) {
                                let x1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.nextMarkLine.l
                                x1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y

                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x = -(x1 - x2) / ll * l + x2
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y = -(y1 - y2) / ll * l + y2
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.x = newelement.nextGUIPoint!.baseBufferElement.center.x
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.y = newelement.nextGUIPoint!.baseBufferElement.center.y

                            }
                        }
                        if (element.nextGUILine instanceof GUIStraightLine) {
                            let newelement = element.nextGUILine
                            if (newelement.previousMarkLine) {
                                let x1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.previousMarkLine.l
                                x1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x = (x1 - x2) / ll * l + x1
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y = (y1 - y2) / ll * l + y1
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.x = newelement.previousGUIPoint!.baseBufferElement.center.x
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.y = newelement.previousGUIPoint!.baseBufferElement.center.y
                            }
                            if (newelement.nextMarkLine) {
                                let x1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.nextMarkLine.l
                                x1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y

                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x = (x1 - x2) / ll * l + x1
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y = (y1 - y2) / ll * l + y1
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.x = newelement.nextGUIPoint!.baseBufferElement.center.x
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.y = newelement.nextGUIPoint!.baseBufferElement.center.y

                            }
                        }
                        else if (element.nextGUILine instanceof GUICubicCurve) {
                            let newelement = element.nextGUILine
                            if (newelement.previousMarkLine) {
                                let x1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.previousMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.previousMarkLine.l
                                x1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.previousMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.previousMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.x = (x1 - x2) / ll * l + x1
                                newelement.previousMarkLine.nextGUIPoint!.baseBufferElement.center.y = (y1 - y2) / ll * l + y1
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.x = newelement.previousGUIPoint!.baseBufferElement.center.x
                                newelement.previousMarkLine.baseBufferElement.attributes.point1.y = newelement.previousGUIPoint!.baseBufferElement.center.y
                            }
                            if (newelement.nextMarkLine) {
                                let x1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.x
                                let x2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x
                                let y1 = newelement.nextMarkLine.previousGUIPoint!.baseBufferElement.center.y
                                let y2 = newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y
                                let l = newelement.nextMarkLine.l
                                x1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.x
                                x2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.x
                                y1 = newelement.nextMarkLine.fatherGUILine!.nextGUIPoint!.baseBufferElement.center.y
                                y2 = newelement.nextMarkLine.fatherGUILine!.previousGUIPoint!.baseBufferElement.center.y

                                let ll = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.x = -(x1 - x2) / ll * l + x2
                                newelement.nextMarkLine.nextGUIPoint!.baseBufferElement.center.y = -(y1 - y2) / ll * l + y2
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.x = newelement.nextGUIPoint!.baseBufferElement.center.x
                                newelement.nextMarkLine.baseBufferElement.attributes.point1.y = newelement.nextGUIPoint!.baseBufferElement.center.y

                            }
                        }
                    }
                }
            }
            this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
        } else if (eventType == 'pointerup' || eventType == 'pointerleave') {
            if (this._isDragging) {
                this.dragElements(e, true)
                if (this._currentTool == 'editor') {
                    if (isDecoratedShape(target!)) {

                        if (this._gui!.selectedElements.size == 1) {
                            let flagEdit = 1
                            // console.log("选中一个元素")
                            let currentPoint, targetPoint, currPoint
                            let mergeFlag = 1
                            for (let element of this.gui!.selectedElements.values()) {
                                currPoint = element
                                if (element instanceof GUIOnPoint) {
                                    // console.log("选中元素是个点")
                                    currentPoint = element
                                    if (currentPoint.previousGUILine != null && currentPoint.nextGUILine != null) {
                                        mergeFlag = 0
                                    }
                                }
                                else {
                                    mergeFlag = 0
                                }
                            }
                            if (target.guiElement instanceof GUIOnPoint) {
                                targetPoint = target.guiElement
                                // console.log("目标元素是个点")
                                if (targetPoint.previousGUILine != null && targetPoint.nextGUILine != null) {
                                    mergeFlag = 0
                                }
                            }
                            else {
                                mergeFlag = 0
                            }
                            if (mergeFlag == 1) {

                                if (currentPoint instanceof GUIOnPoint && targetPoint instanceof GUIOnPoint) {
                                    if (currentPoint.nextGUILine == null) {
                                        if (targetPoint.previousGUILine == null) {
                                            currentPoint.nextGUILine = targetPoint.nextGUILine
                                            if (currentPoint.nextGUILine) {
                                                currentPoint.nextGUILine.previousGUIPoint = currentPoint
                                                currentPoint.nextGUILine.baseBufferElement.attributes = { point1: currentPoint.baseBufferElement.center }
                                            }
                                            currentPoint.nextControlPoint = targetPoint.nextControlPoint
                                            if (currentPoint.nextControlPoint && targetPoint.nextControlPoint && currentPoint.nextControlPoint.correspondingGUIControlLine && currentPoint.nextControlPoint.correspondingGUIControlLine.onPoint) {
                                                currentPoint.nextControlPoint.baseBufferElement.center = targetPoint.nextControlPoint.baseBufferElement.center
                                                currentPoint.nextControlPoint.correspondingGUIControlLine.onPoint = currentPoint
                                                currentPoint.nextControlPoint.correspondingGUIControlLine.baseBufferElement.attributes = { point2: currentPoint.baseBufferElement.center }
                                                currentPoint.nextControlPoint.correspondingGUIControlLine.onPoint.baseBufferElement.center = currentPoint.baseBufferElement.center
                                            }
                                            targetPoint.isVisible = false
                                            flagEdit = 0
                                            if (currentPoint.guiSegmentId == targetPoint.guiSegmentId) {
                                                console.log("circle")
                                                let seg = this.transSegment(currentPoint.previousGUILine!)
                                                this._msgSend.push(['edit', currentPoint.guiSegmentId, seg, this._svgPath.get(currentPoint!.guiSegmentId)![0].fill])
                                            }
                                            else {
                                                let seg = this.transSegment(currentPoint.previousGUILine!)
                                                this._msgSend.push(['edit', currentPoint.guiSegmentId, seg, this._svgPath.get(currentPoint!.guiSegmentId)![0].fill])
                                                this._msgSend.push(['delete', targetPoint.guiSegmentId])
                                            }
                                        }
                                        else if (targetPoint.nextGUILine == null) {
                                        }
                                    }
                                    else if (currentPoint?.previousGUILine == null) {
                                        if (targetPoint?.previousGUILine == null) {
                                        }
                                        else if (targetPoint.nextGUILine == null) {

                                            currentPoint.previousGUILine = targetPoint.previousGUILine

                                            if (currentPoint.previousGUILine) {
                                                currentPoint.previousGUILine.nextGUIPoint = currentPoint
                                                currentPoint.previousGUILine.baseBufferElement.attributes = { point2: currentPoint.baseBufferElement.center }
                                            }
                                            currentPoint.previousControlPoint = targetPoint.previousControlPoint
                                            if (currentPoint.previousControlPoint && targetPoint.previousControlPoint && currentPoint.previousControlPoint.correspondingGUIControlLine && currentPoint.previousControlPoint.correspondingGUIControlLine.onPoint) {
                                                currentPoint.previousControlPoint.baseBufferElement.center = targetPoint.previousControlPoint.baseBufferElement.center
                                                currentPoint.previousControlPoint.correspondingGUIControlLine.onPoint = currentPoint
                                                currentPoint.previousControlPoint.correspondingGUIControlLine.baseBufferElement.attributes = { point2: currentPoint.baseBufferElement.center }
                                                currentPoint.previousControlPoint.correspondingGUIControlLine.onPoint.baseBufferElement.center = currentPoint.baseBufferElement.center
                                            }
                                            targetPoint.isVisible = false
                                            flagEdit = 0
                                            if (currentPoint.guiSegmentId == targetPoint.guiSegmentId) {
                                                let seg = this.transSegment(currentPoint.previousGUILine!)

                                                this._msgSend.push(['edit', currentPoint.guiSegmentId, seg, this._svgPath.get(currentPoint!.guiSegmentId)![0].fill])
                                            }
                                            else {
                                                let seg = this.transSegment(currentPoint.previousGUILine!)

                                                this._msgSend.push(['edit', currentPoint.guiSegmentId, seg, this._svgPath.get(currentPoint!.guiSegmentId)![0].fill])
                                                this._msgSend.push(['delete', targetPoint.guiSegmentId])
                                            }
                                        }

                                    }

                                }
                            }
                            if (flagEdit == 1) {
                                if (currPoint instanceof GUIOnPoint) {
                                    if (currPoint.previousGUILine) {
                                        let seg = this.transSegment(currPoint.previousGUILine!)

                                        this._msgSend.push(['edit', currPoint.guiSegmentId, seg, this._svgPath.get(currPoint!.guiSegmentId)![0].fill])
                                    }
                                    else if (currPoint.nextGUILine) {
                                        let seg = this.transSegment(currPoint.nextGUILine!)

                                        this._msgSend.push(['edit', currPoint.guiSegmentId, seg, this._svgPath.get(currPoint!.guiSegmentId)![0].fill])
                                    }
                                }
                                else if (currPoint instanceof GUIOffPoint) {
                                    if (currPoint.correspondingGUIPoint?.previousGUILine) {
                                        let seg = this.transSegment(currPoint.correspondingGUIPoint?.previousGUILine)

                                        this._msgSend.push(['edit', currPoint.guiSegmentId, seg, this._svgPath.get(currPoint!.guiSegmentId)![0].fill])
                                    }
                                    else if (currPoint.correspondingGUIPoint?.nextGUILine) {
                                        let seg = this.transSegment(currPoint.correspondingGUIPoint?.nextGUILine)

                                        this._msgSend.push(['edit', currPoint.guiSegmentId, seg, this._svgPath.get(currPoint!.guiSegmentId)![0].fill])
                                    }
                                }
                            }
                        }
                        else {
                            let updateArray: Map<number, any> = new Map<number, any>()
                            for (let element of this.gui!.selectedElements.values()) {
                                if (updateArray.has(element.guiSegmentId)) {
                                }
                                else {
                                    if (element instanceof GUIStraightLine || element instanceof GUICubicCurve) {
                                        updateArray.set(element.guiSegmentId, element)
                                    }
                                    else if (element instanceof GUIOnPoint) {
                                        if (element.previousGUILine) {
                                            updateArray.set(element.guiSegmentId, element.previousGUILine)
                                        }
                                        else if (element.nextGUILine) {
                                            updateArray.set(element.guiSegmentId, element.nextGUILine)
                                        }
                                    }
                                    else if (element instanceof GUIOffPoint) {
                                        if (element.correspondingGUIPoint?.previousGUILine) {
                                            updateArray.set(element.guiSegmentId, element.correspondingGUIPoint?.previousGUILine)
                                        }
                                        else if (element.correspondingGUIPoint?.nextGUILine) {
                                            updateArray.set(element.guiSegmentId, element.correspondingGUIPoint?.nextGUILine)
                                        }
                                    }
                                    else if (element instanceof GUIControlLine) {
                                        if (element.onPoint?.previousGUILine) {
                                            updateArray.set(element.guiSegmentId, element.onPoint?.previousGUILine)
                                        }
                                        else if (element.onPoint?.nextGUILine) {
                                            updateArray.set(element.guiSegmentId, element.onPoint?.nextGUILine)
                                        }
                                    }
                                }
                            }

                            for (let svg_id of updateArray.keys()) {
                                let svg_element = updateArray.get(svg_id)
                                let seg = this.transSegment(svg_element)
                                this._msgSend.push(['edit', svg_id, seg, this._svgPath.get(svg_id)![0].fill])
                            }
                            // console.log("this.svg", this._msgSend)
                        }
                    }
                }
                else if (this._currentTool == 'addStraightLine') {
                    if (isDecoratedShape(target!)) {
                        if (this._gui!.selectedElements.size == 1) {
                            for (let element of this.gui!.selectedElements.values()) {
                                if (element instanceof GUIOnPoint) {
                                    if (element.previousGUILine) {
                                        let seg = this.transSegment(element.previousGUILine!)
                                        console.log("addStraightLinesegment", seg)
                                        this._msgSend.push(['add', element.guiSegmentId, seg, true])
                                    }
                                    else if (element.nextGUILine) {
                                        let seg = this.transSegment(element.nextGUILine!)
                                        console.log("addStraightLinesegment", seg)
                                        this._msgSend.push(['add', element.guiSegmentId, seg, true])
                                    }
                                }
                            }
                        }
                    }
                }
                else if (this._currentTool == 'addCurve') {

                    if (isDecoratedShape(target!)) {
                        if (this._gui!.selectedElements.size == 1) {
                            // console.log("选中一个元素")
                            let curveLine
                            for (let element of this.gui!.selectedElements.values()) {
                                if (element instanceof GUIOnPoint) {

                                    if (element.previousGUILine)
                                        curveLine = element.previousGUILine
                                    else if (element.nextGUILine)
                                        curveLine = element.nextGUILine
                                    let controlPoint1 = new Point(curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.x! * 2 / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.x! / 3, curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.y! * 2 / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.y! / 3)
                                    let controlPoint2 = new Point(curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.x! / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.x! * 2 / 3, curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.y! / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.y! * 2 / 3)
                                    if (curveLine?.previousGUIPoint instanceof GUIOnPoint) {
                                        curveLine!.previousGUIPoint!.nextControlPoint!.baseBufferElement.center = controlPoint1
                                        curveLine.previousGUIPoint.nextControlPoint!.correspondingGUIControlLine!.baseBufferElement.attributes.point2 = controlPoint1
                                    }

                                    if (curveLine?.nextGUIPoint instanceof GUIOnPoint) {
                                        curveLine!.nextGUIPoint!.previousControlPoint!.baseBufferElement.center = controlPoint2
                                        curveLine.nextGUIPoint.previousControlPoint!.correspondingGUIControlLine!.baseBufferElement.attributes.point1 = controlPoint2
                                    }

                                    if (element.previousGUILine) {
                                        let seg = this.transSegment(element.previousGUILine!)

                                        this._msgSend.push(['add', element.guiSegmentId, seg, true])
                                    }
                                    else if (element.nextGUILine) {
                                        let seg = this.transSegment(element.nextGUILine!)

                                        this._msgSend.push(['add', element.guiSegmentId, seg, true])
                                    }
                                }
                            }

                        }
                    }
                }
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = false
                if (this._currentTool == 'shapeMark') {

                }
                else if (this._currentTool != 'mark' && (!e.ctrlKey)) {
                    this._ifSend = 1
                    // console.log("hebing",this.msgSend)
                    // console.log("我是ts里的ifsend", this._ifSend)
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                }

                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))

            }
            else if (this._linePos) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                this._multiSelectingRectPos.x1 = 0
                this._multiSelectingRectPos.y1 = 0
                this._gui!.multiSelectingRect!.baseBufferElement.width = 0
                this._gui!.multiSelectingRect!.baseBufferElement.height = 0
                this._isDragging = false
                this._isSelecting = false
                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
            }
            else if (this._isSelecting && !this._linePos) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                if (bufferX <= this._multiSelectingRectPos.x1) {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.x = bufferX
                    this._gui!.multiSelectingRect!.baseBufferElement.width = this._multiSelectingRectPos.x1 - bufferX
                } else {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.x = this._multiSelectingRectPos.x1
                    this._gui!.multiSelectingRect!.baseBufferElement.width = bufferX - this._multiSelectingRectPos.x1
                }

                if (bufferY <= this._multiSelectingRectPos.y1) {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.y = bufferY
                    this._gui!.multiSelectingRect!.baseBufferElement.height = this._multiSelectingRectPos.y1 - bufferY
                } else {
                    this._gui!.multiSelectingRect!.baseBufferElement.attributes.leftTop.y = this._multiSelectingRectPos.y1
                    this._gui!.multiSelectingRect!.baseBufferElement.height = bufferY - this._multiSelectingRectPos.y1
                }

                let minBufferX = Math.min(this._multiSelectingRectPos.x1, bufferX)
                let maxBufferX = Math.max(this._multiSelectingRectPos.x1, bufferX)
                let minBufferY = Math.min(this._multiSelectingRectPos.y1, bufferY)
                let maxBufferY = Math.max(this._multiSelectingRectPos.y1, bufferY)

                if (!e.ctrlKey) {
                    // console.log("框选行为结束，非CTRL MODE判定，全部重新框选")
                    for (let element of this.gui!.guiBaseElements.values()) {
                        if (!instanceOfGUILine(element)) {
                            let bbox = element.baseBufferElement.boudingBox
                            if (bbox.minX > minBufferX && bbox.maxX < maxBufferX && bbox.minY > minBufferY && bbox.maxY < maxBufferY && element.isVisible == true) {
                                element.isSelected = true
                            }
                        }
                    }
                } else {
                    // console.log("框选行为结束，CTRL MODE判定，所有被选中元素得到相反的选择状态")
                    for (let element of this.gui!.guiBaseElements.values()) {
                        if (!instanceOfGUILine(element)) {
                            let bbox = element.baseBufferElement.boudingBox
                            if (bbox.minX > minBufferX && bbox.maxX < maxBufferX && bbox.minY > minBufferY && bbox.maxY < maxBufferY && element.isVisible == true) {
                                let isSelected = element.isSelected
                                element.isSelected = !isSelected
                            }
                        }
                    }
                }

                this._multiSelectingRectPos.x1 = 0
                this._multiSelectingRectPos.y1 = 0
                this._gui!.multiSelectingRect!.baseBufferElement.width = 0
                this._gui!.multiSelectingRect!.baseBufferElement.height = 0
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = false

                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
            }
            else if (this._isRect) {
                // console.log("先前处于框选行为，此为结束框选终点，计算框选矩形相关内容")
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                this._multiSelectingRectPos.x2 = bufferX
                this._multiSelectingRectPos.y2 = bufferY

                let point1 = new Point(this._multiSelectingRectPos.x1, this._multiSelectingRectPos.y1)
                let point2 = new Point(this._multiSelectingRectPos.x1, this._multiSelectingRectPos.y2)
                let point3 = new Point(this._multiSelectingRectPos.x2, this._multiSelectingRectPos.y2)
                let point4 = new Point(this._multiSelectingRectPos.x2, this._multiSelectingRectPos.y1)

                let guiPoint1 = new GUIOnPoint(point1)
                let guiPoint2 = new GUIOnPoint(point2)
                let guiPoint3 = new GUIOnPoint(point3)
                let guiPoint4 = new GUIOnPoint(point4)

                let guiLine1 = new GUIStraightLine(point1, point2)
                guiPoint2.previousGUILine = guiLine1
                guiPoint1.nextGUILine = guiLine1
                guiLine1.previousGUIPoint = guiPoint1
                guiLine1.nextGUIPoint = guiPoint2

                let guiLine2 = new GUIStraightLine(point2, point3)
                guiPoint3.previousGUILine = guiLine2
                guiPoint2.nextGUILine = guiLine2
                guiLine2.previousGUIPoint = guiPoint2
                guiLine2.nextGUIPoint = guiPoint3

                let guiLine3 = new GUIStraightLine(point3, point4)
                guiPoint4.previousGUILine = guiLine3
                guiPoint3.nextGUILine = guiLine3
                guiLine3.previousGUIPoint = guiPoint3
                guiLine3.nextGUIPoint = guiPoint4

                let guiLine4 = new GUIStraightLine(point4, point1)
                guiPoint1.previousGUILine = guiLine4
                guiPoint4.nextGUILine = guiLine4
                guiLine4.previousGUIPoint = guiPoint4
                guiLine4.nextGUIPoint = guiPoint1

                // help
                let seg = this.transSegment(guiLine4)
                this._svgMax = this._svgMax + 1
                this._msgSend.push(['add', this._svgMax, seg, true])

                this._ifSend = 1
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }

                this._multiSelectingRectPos.x1 = 0
                this._multiSelectingRectPos.y1 = 0
                this._gui!.multiSelectingRect!.baseBufferElement.width = 0
                this._gui!.multiSelectingRect!.baseBufferElement.height = 0
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = false

                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
            }
            else if (this._isCir) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                let radius = Math.sqrt(Math.pow(this._circlePos.x1 - bufferX, 2) + Math.pow(this._circlePos.y1 - bufferY, 2))
                let controlRadius = (4 / 3) * (Math.sqrt(2) - 1) * radius
                let point1 = new Point(this._circlePos.x1, this._circlePos.y1 + radius)
                let point2 = new Point(this._circlePos.x1 + radius, this._circlePos.y1)
                let point3 = new Point(this._circlePos.x1, this._circlePos.y1 - radius)
                let point4 = new Point(this._circlePos.x1 - radius, this._circlePos.y1)

                let guiPoint1 = new GUIOnPoint(point1)
                let guiPoint2 = new GUIOnPoint(point2)
                let guiPoint3 = new GUIOnPoint(point3)
                let guiPoint4 = new GUIOnPoint(point4)

                let controlPoint11 = new Point(this._circlePos.x1 - controlRadius, this._circlePos.y1 + radius)
                let controlPoint12 = new Point(this._circlePos.x1 + controlRadius, this._circlePos.y1 + radius)
                let controlGUIPoint11 = new GUIOffPoint(controlPoint11)
                let controlGUIPoint12 = new GUIOffPoint(controlPoint12)
                let controlGUILine11 = new GUIControlLine(controlPoint11, point1, guiPoint1, controlGUIPoint11)
                let controlGUILine12 = new GUIControlLine(controlPoint12, point1, guiPoint1, controlGUIPoint12)

                let controlPoint21 = new Point(this._circlePos.x1 + radius, this._circlePos.y1 + controlRadius)
                let controlPoint22 = new Point(this._circlePos.x1 + radius, this._circlePos.y1 - controlRadius)
                let controlGUIPoint21 = new GUIOffPoint(controlPoint21)
                let controlGUIPoint22 = new GUIOffPoint(controlPoint22)
                let controlGUILine21 = new GUIControlLine(controlPoint21, point2, guiPoint2, controlGUIPoint21)
                let controlGUILine22 = new GUIControlLine(controlPoint22, point2, guiPoint2, controlGUIPoint22)

                let controlPoint31 = new Point(this._circlePos.x1 + controlRadius, this._circlePos.y1 - radius)
                let controlPoint32 = new Point(this._circlePos.x1 - controlRadius, this._circlePos.y1 - radius)
                let controlGUIPoint31 = new GUIOffPoint(controlPoint31)
                let controlGUIPoint32 = new GUIOffPoint(controlPoint32)
                let controlGUILine31 = new GUIControlLine(controlPoint31, point3, guiPoint3, controlGUIPoint31)
                let controlGUILine32 = new GUIControlLine(controlPoint32, point3, guiPoint3, controlGUIPoint32)

                let controlPoint41 = new Point(this._circlePos.x1 - radius, this._circlePos.y1 - controlRadius)
                let controlPoint42 = new Point(this._circlePos.x1 - radius, this._circlePos.y1 + controlRadius)
                let controlGUIPoint41 = new GUIOffPoint(controlPoint41)
                let controlGUIPoint42 = new GUIOffPoint(controlPoint42)
                let controlGUILine41 = new GUIControlLine(controlPoint41, point4, guiPoint4, controlGUIPoint41)
                let controlGUILine42 = new GUIControlLine(controlPoint42, point4, guiPoint4, controlGUIPoint42)

                let guiLine1 = new GUICubicCurve(point1, point2, controlPoint12, controlPoint21)
                let guiLine2 = new GUICubicCurve(point2, point3, controlPoint22, controlPoint31)
                let guiLine3 = new GUICubicCurve(point3, point4, controlPoint32, controlPoint41)
                let guiLine4 = new GUICubicCurve(point4, point1, controlPoint42, controlPoint11)

                controlGUIPoint11.correspondingGUIPoint = guiPoint1
                controlGUIPoint12.correspondingGUIPoint = guiPoint1
                controlGUIPoint21.correspondingGUIPoint = guiPoint2
                controlGUIPoint22.correspondingGUIPoint = guiPoint2
                controlGUIPoint31.correspondingGUIPoint = guiPoint3
                controlGUIPoint32.correspondingGUIPoint = guiPoint3
                controlGUIPoint41.correspondingGUIPoint = guiPoint4
                controlGUIPoint42.correspondingGUIPoint = guiPoint4
                controlGUIPoint11.correspondingGUIControlLine = controlGUILine11
                controlGUIPoint12.correspondingGUIControlLine = controlGUILine12
                controlGUIPoint21.correspondingGUIControlLine = controlGUILine21
                controlGUIPoint22.correspondingGUIControlLine = controlGUILine22
                controlGUIPoint31.correspondingGUIControlLine = controlGUILine31
                controlGUIPoint32.correspondingGUIControlLine = controlGUILine32
                controlGUIPoint41.correspondingGUIControlLine = controlGUILine41
                controlGUIPoint42.correspondingGUIControlLine = controlGUILine42

                controlGUILine11.onPoint = guiPoint1
                controlGUILine12.onPoint = guiPoint1
                controlGUILine21.onPoint = guiPoint2
                controlGUILine22.onPoint = guiPoint2
                controlGUILine31.onPoint = guiPoint3
                controlGUILine32.onPoint = guiPoint3
                controlGUILine41.onPoint = guiPoint4
                controlGUILine42.onPoint = guiPoint4

                controlGUILine11.offPoint = controlGUIPoint11
                controlGUILine12.offPoint = controlGUIPoint12
                controlGUILine21.offPoint = controlGUIPoint21
                controlGUILine22.offPoint = controlGUIPoint22
                controlGUILine31.offPoint = controlGUIPoint31
                controlGUILine32.offPoint = controlGUIPoint32
                controlGUILine41.offPoint = controlGUIPoint41
                controlGUILine42.offPoint = controlGUIPoint42

                guiPoint1.previousGUILine = guiLine4
                guiPoint1.nextGUILine = guiLine1
                guiPoint1.previousControlPoint = controlGUIPoint11
                guiPoint1.nextControlPoint = controlGUIPoint12

                guiPoint2.previousGUILine = guiLine1
                guiPoint2.nextGUILine = guiLine2
                guiPoint2.previousControlPoint = controlGUIPoint21
                guiPoint2.nextControlPoint = controlGUIPoint22

                guiPoint3.previousGUILine = guiLine2
                guiPoint3.nextGUILine = guiLine3
                guiPoint3.previousControlPoint = controlGUIPoint31
                guiPoint3.nextControlPoint = controlGUIPoint32

                guiPoint4.previousGUILine = guiLine3
                guiPoint4.nextGUILine = guiLine4
                guiPoint4.previousControlPoint = controlGUIPoint41
                guiPoint4.nextControlPoint = controlGUIPoint42

                guiLine1.previousGUIPoint = guiPoint1
                guiLine1.nextGUIPoint = guiPoint2
                guiLine2.previousGUIPoint = guiPoint2
                guiLine2.nextGUIPoint = guiPoint3
                guiLine3.previousGUIPoint = guiPoint3
                guiLine3.nextGUIPoint = guiPoint4
                guiLine4.previousGUIPoint = guiPoint4
                guiLine4.nextGUIPoint = guiPoint1

                let seg = this.transSegment(guiLine4)
                this._svgMax = this._svgMax + 1
                this._msgSend.push(['add', this._svgMax, seg, true])

                this._ifSend = 1
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }

                this._circlePos.x1 = 0
                this._circlePos.y1 = 0
                this._gui!.multiSelectingCircle!.baseBufferElement.center.x = 0
                this._gui!.multiSelectingCircle!.baseBufferElement.center.y = 0
                this._gui!.multiSelectingCircle!.baseBufferElement.radius = 0
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = false

                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
            }
            else if (this._isTri) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                let radius = Math.sqrt(Math.pow(this._circlePos.x1 - bufferX, 2) + Math.pow(this._circlePos.y1 - bufferY, 2))

                let point1 = new Point(this._circlePos.x1, this._circlePos.y1 - radius)
                let point2 = new Point(this._circlePos.x1 + Math.sqrt(3) / 2 * radius, this._circlePos.y1 + radius / 2)
                let point3 = new Point(this._circlePos.x1 - Math.sqrt(3) / 2 * radius, this._circlePos.y1 + radius / 2)

                let guiPoint1 = new GUIOnPoint(point1)
                let guiPoint2 = new GUIOnPoint(point2)
                let guiPoint3 = new GUIOnPoint(point3)

                let guiLine1 = new GUIStraightLine(point1, point2)
                guiPoint2.previousGUILine = guiLine1
                guiPoint1.nextGUILine = guiLine1
                guiLine1.previousGUIPoint = guiPoint1
                guiLine1.nextGUIPoint = guiPoint2

                let guiLine2 = new GUIStraightLine(point2, point3)
                guiPoint3.previousGUILine = guiLine2
                guiPoint2.nextGUILine = guiLine2
                guiLine2.previousGUIPoint = guiPoint2
                guiLine2.nextGUIPoint = guiPoint3

                let guiLine3 = new GUIStraightLine(point3, point1)
                guiPoint1.previousGUILine = guiLine3
                guiPoint3.nextGUILine = guiLine3
                guiLine3.previousGUIPoint = guiPoint3
                guiLine3.nextGUIPoint = guiPoint1

                let seg = this.transSegment(guiLine3)
                this._svgMax = this._svgMax + 1
                this._msgSend.push(['add', this._svgMax, seg, true])

                this._ifSend = 1
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }

                this._circlePos.x1 = 0
                this._circlePos.y1 = 0
                this._gui!.multiSelectingTri!.baseBufferElement.center.x = 0
                this._gui!.multiSelectingTri!.baseBufferElement.center.y = 0
                this._gui!.multiSelectingTri!.baseBufferElement.radius = 0
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = false
                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
            }
            else if (this._isLineMark) {
                let endGUIPoint
                for (endGUIPoint of this._gui!.selectedElements.values()) {
                }
                if (endGUIPoint instanceof GUIOnPoint) {
                    endGUIPoint.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkingOnPoint)
                    let guiMarkLine = endGUIPoint.previousGUILine
                    console.log()
                    if (guiMarkLine instanceof GUIMarkLine) {
                        let x1 = guiMarkLine.previousGUIPoint!.baseBufferElement.center.x
                        let x2 = guiMarkLine.nextGUIPoint!.baseBufferElement.center.x
                        let y1 = guiMarkLine.previousGUIPoint!.baseBufferElement.center.y
                        let y2 = guiMarkLine.nextGUIPoint!.baseBufferElement.center.y
                        guiMarkLine.l = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                        // console.log("transsegment",guiMarkLine.fatherGUILine)
                        if (guiMarkLine.fatherGUILine instanceof GUIStraightLine) {
                            let seg = this.transSegment(guiMarkLine.fatherGUILine)
                            this._msgSend.push(['edit', guiMarkLine.fatherGUILine!.guiSegmentId, seg, this._svgPath.get(guiMarkLine.fatherGUILine!.guiSegmentId)![0].fill])
                        }
                        else if (guiMarkLine.fatherGUILine instanceof GUIControlLine) {
                            if (guiMarkLine.fatherGUILine.onPoint?.previousGUILine) {
                                // console.log("transcontrol",endGUIPoint)
                                let seg = this.transSegment(guiMarkLine.fatherGUILine.onPoint.previousGUILine)
                                // console.log("transcontrol",seg)
                                this._msgSend.push(['edit', guiMarkLine.fatherGUILine!.guiSegmentId, seg, this._svgPath.get(guiMarkLine.fatherGUILine!.guiSegmentId)![0].fill])
                            }
                            else if (guiMarkLine.fatherGUILine.onPoint?.nextGUILine) {
                                // console.log("transcontrol",endGUIPoint)
                                let seg = this.transSegment(guiMarkLine.fatherGUILine.onPoint.nextGUILine)
                                // console.log("transcontrol",seg)
                                this._msgSend.push(['edit', guiMarkLine.fatherGUILine!.guiSegmentId, seg, seg, this._svgPath.get(guiMarkLine.fatherGUILine!.guiSegmentId)![0].fill])
                            }

                        }
                        // console.log("transsegment",seg)


                        this._ifSend = 1
                    }
                }
                this._isDragging = false
                this._isSelecting = false
                this._isLineMark = false
                for (endGUIPoint of this._gui!.selectedElements.values()) {
                    endGUIPoint.isSelected = false
                }

            }
            if (isPrimary(e)) {
                this._isPointerDown.primary = false
                this._currentEvent.primary = null
                this._lastEvent.primary = null
            }
            else {
                this._isPointerDown.secondary = false
                this._currentEvent.secondary = null
                this._lastEvent.secondary = null
            }
        }

    }

    /** 触控、鼠标、笔 */
    private async bindPointerEvents() {
        let that = this
        const isPrimary = (e: PointerEvent) => e.isPrimary

        const onPointerDown = (e: KonvaEventObject<PointerEvent>) => {
            // console.debug("onpointer down")
            this.changePointerStatus(e.target, e.evt)
        }

        const onPointerMove = (e: KonvaEventObject<PointerEvent>) => {
            this.changePointerStatus(e.target, e.evt)

            this.moveViewBox(e.evt)
            this.zoomViewBox(e.evt)

            this.dragElements(e.evt, false)
        }

        const onPointerUp = (e: KonvaEventObject<PointerEvent>) => {
            // console.debug("onpointer up")
            this.changePointerStatus(e.target, e.evt)
        }

        const onPointerLeave = (e: PointerEvent) => {
            this.changePointerStatus(null, e)
        }

        /** We use PointerEvent, PointerEvent extends from MouseEvent
         *  @link https://developer.mozilla.org/en-US/docs/web/api/pointerevent
         *  
         *  Attribute 'pointerType' shows the type of pointer device that triggered the event,
         *  it can be 'mouse', 'pen' or 'touch'
         */
        this._gui!.canvas.on('pointerdown', (e: KonvaEventObject<PointerEvent>) => {
            onPointerDown(e)
        });

        this._gui!.canvas.on('pointermove', (e: KonvaEventObject<PointerEvent>) => {
            onPointerMove(e)
        })

        this._gui!.canvas.on('pointerup', (e: KonvaEventObject<PointerEvent>) => {
            onPointerUp(e)
        })

        this._gui!.canvas.on('mouseover', (e) => {
            if (this._currentTool == 'move') document.body.style.cursor = 'pointer';
        })

        this._gui!.canvas.on('mouseout', (e) => {
            if (this._currentTool == 'move') document.body.style.cursor = 'default';
        });

        // fix for mouse leave
        this._gui!.divElement.onpointerleave = onPointerLeave
    }

    /** PC 鼠标滚轮 + MAC触控板 支持 */
    private bindWheelEvents() {
        let that = this
        this._gui!.canvas.addEventListener('wheel', function (e: any) {
            // 阻止默认事件，防止页面滚动
            e.preventDefault();

            if (e.altKey) {
                // PC：ctrl + 滚轮 / 触控板：双指向内向外 = 缩放
                that._eventHandler.addEvent(new ZoomViewPortByWheelEvent(e.clientX, e.clientY, e.deltaY, e))
            } else if (e.shiftKey) {
                // PC：shift + 滚轮 = 左右滑动
                that._eventHandler.addEvent(new MoveViewPortEvent(-e.deltaY, 0, e))
            } else {
                // PC：单纯滚轮 / 触控板双指左右上下 = 滑动
                that._eventHandler.addEvent(new MoveViewPortEvent(-e.deltaX, -e.deltaY, e))
            }
        });
    }

    public test() {
        this.saveSVG()
        this.changeToPreview()
    }

    public importSVGPath(path: string) {
        try {
            const segments = normalize(abs(parse(path)))
            // console.log("parse(path) is :\n", parse(path))
            // console.log("abs(parse(path)) is :\n", abs(parse(path)))
            // console.log("current segment is :\n", segments)
            this.svgPathSegementsTo(segments)
        } catch (err) {
            console.log("error", err)
        }

    }

    public unMark(svgMarkedId: number) {
        let element = this.gui!.guiBaseElements.get(svgMarkedId)
        // console.log(element)
        if (element instanceof GUIStraightLine || element instanceof GUICubicCurve) {
            element.baseBufferElement.config = Object.assign({}, GUIAttrs.Line)
        }
        else if (element instanceof GUIOnPoint) {
            element.baseBufferElement.config = Object.assign({}, GUIAttrs.OnPoint)
        }
        else if (element instanceof GUIOffPoint) {
            element.baseBufferElement.config = Object.assign({}, GUIAttrs.OffPoint)
        }
        // element!.comment = ""
    }
    public Mark(svgMarkedId: number) {
        let element = this.gui!.guiBaseElements.get(svgMarkedId)
        // console.log(element)
        if (element instanceof GUIStraightLine || element instanceof GUICubicCurve) {
            element.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedLine)
        }
        else if (element instanceof GUIOnPoint) {
            element.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedOnPoint)
        }
        else if (element instanceof GUIOffPoint) {
            element.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedOffPoint)
        }
    }
    public showComment(cmtMarkedId: number) {
        let element = this.gui!.guiBaseElements.get(cmtMarkedId)
        return element?.comment
    }

    public markComment(svgMarkedId: number, comment: string) {
        let element = this.gui!.guiBaseElements.get(svgMarkedId)
        element!.comment = comment
        // console.log(element)
        let seg = this.transSegment(element)
        this._msgSend.push(['edit', element!.guiSegmentId, seg, this._svgPath.get(element!.guiSegmentId)![0].fill])
    }

    public markOnCanvas(x: number, y: number, comment: string) {
        let currentComment = new GUIText(new Point(x, y), comment)
        this._svgMax = this._svgMax + 1

        currentComment.guiSegmentId = this._svgMax

        let seg = this.transSegment(currentComment)
        this._msgSend.push(['add', this._svgMax, seg, true])
        // console.log("currentcomment",currentComment)
    }


    private renderOneSegment(id: number, segement: any) {
        let { gui, baseBuffer } = GlobalManager.instance
        let text = segement.lines[0]
        if (text[0] == 'T') {
            let point = new Point(text[1], text[2]);
            let guiText = new GUIText(point, text[3]);
            guiText.guiSegmentId = id
            console.log(guiText)
            return
        }
        let isClosed = segement.isClosed
        let startPoint: Point = new Point(segement.startPointX, segement.startPointY)
        let currentPoint = startPoint
        let segments = segement.lines
        let startGUIPoint = new GUIOnPoint(startPoint)
        startGUIPoint.guiSegmentId = id
        if (id > this._svgMax) this._svgMax = id
        let currentGUIPoint = startGUIPoint
        let currentGUILine = null
        let currentControlPoint = null
        // console.log('segments.length', segments.length)
        for (let i = 0; i < segments.length; i++) {
            let targetPoint = (i == segments.length - 1 && isClosed) ? startPoint : new Point(segments[i][5], segments[i][6])
            let targetGUIPoint = (i == segments.length - 1 && isClosed) ? startGUIPoint : new GUIOnPoint(targetPoint)
            targetGUIPoint.guiSegmentId = id
            if (segments[i][3] == segments[i][5] && segments[i][4] == segments[i][6]) {
                //直线
                let guiLine = new GUIStraightLine(currentPoint, targetPoint)
                guiLine.guiSegmentId = id
                currentGUIPoint.nextGUILine = guiLine
                currentGUIPoint.previousGUILine = currentGUILine

                targetGUIPoint.previousGUILine = guiLine

                guiLine.previousGUIPoint = currentGUIPoint
                guiLine.nextGUIPoint = targetGUIPoint

                guiLine.comment = segments[i][7][0]
                guiLine.previousGUIPoint.comment = segments[i][7][1]
                guiLine.nextGUIPoint.comment = segments[i][7][2]

                if (segments[i][8][0] != 0) {
                    let endPoint = new Point(segments[i][8][1], segments[i][8][2])
                    let endGUIPoint = new GUIOnPoint(endPoint)
                    endGUIPoint.guiSegmentId = id
                    let markGUILine = new GUIMarkLine(currentPoint, endPoint, currentGUIPoint, endGUIPoint, guiLine)
                    markGUILine.guiSegmentId = id
                    endGUIPoint.previousGUILine = markGUILine
                    markGUILine.l = segments[i][8][0]
                    guiLine.previousMarkLine = markGUILine

                }
                if (segments[i][8][3] != 0) {
                    let endPoint = new Point(segments[i][8][4], segments[i][8][5])
                    let endGUIPoint = new GUIOnPoint(endPoint)
                    endGUIPoint.guiSegmentId = id
                    let markGUILine = new GUIMarkLine(targetPoint, endPoint, targetGUIPoint, endGUIPoint, guiLine)
                    markGUILine.guiSegmentId = id
                    endGUIPoint.previousGUILine = markGUILine
                    markGUILine.l = segments[i][8][3]
                    guiLine.nextMarkLine = markGUILine
                }

                if (segments[i][8][6] == 1) {
                    let markGUIRing = new GUIRing(guiLine.previousGUIPoint.baseBufferElement.center)
                    markGUIRing.fatherPoint = guiLine.previousGUIPoint
                    guiLine.previousGUIPoint.markRing = markGUIRing
                }
                if (segments[i][8][7] == 1) {
                    let markGUIRing = new GUIRing(guiLine.nextGUIPoint.baseBufferElement.center)
                    markGUIRing.fatherPoint = guiLine.nextGUIPoint
                    guiLine.nextGUIPoint.markRing = markGUIRing
                }
                currentGUILine = guiLine
                currentPoint = targetPoint
                currentGUIPoint = targetGUIPoint
                // console.log("construct Line", currentGUILine)
            } else {
                //三次贝塞尔曲线
                let controlPoint1 = new Point(segments[i][1], segments[i][2])
                let controlPoint2 = new Point(segments[i][3], segments[i][4])
                let controlGUIPoint1 = new GUIOffPoint(controlPoint1)
                let controlGUIPoint2 = new GUIOffPoint(controlPoint2)
                let controlGUILine1 = new GUIControlLine(controlPoint1, currentPoint)
                let controlGUILine2 = new GUIControlLine(controlPoint2, targetPoint)
                controlGUIPoint1.guiSegmentId = id
                controlGUIPoint2.guiSegmentId = id
                controlGUILine1.guiSegmentId = id
                controlGUILine2.guiSegmentId = id
                let guiLine = new GUICubicCurve(currentPoint, targetPoint, controlPoint1, controlPoint2)
                guiLine.guiSegmentId = id
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

                guiLine.comment = segments[i][7][0]
                guiLine.previousGUIPoint.comment = segments[i][7][1]
                guiLine.nextGUIPoint.comment = segments[i][7][2]
                guiLine.previousGUIPoint.nextControlPoint!.comment = segments[i][7][3]
                guiLine.previousGUIPoint.nextControlPoint!.correspondingGUIControlLine!.comment == segments[i][7][4]
                guiLine.nextGUIPoint.previousControlPoint!.comment = segments[i][7][5]
                guiLine.nextGUIPoint.previousControlPoint!.correspondingGUIControlLine!.comment == segments[i][7][6]
                if (segments[i][8][0] != 0) {
                    let endPoint = new Point(segments[i][8][1], segments[i][8][2])
                    let endGUIPoint = new GUIOnPoint(endPoint)
                    endGUIPoint.guiSegmentId = id
                    let markGUILine = new GUIMarkLine(currentPoint, endPoint, currentGUIPoint, endGUIPoint, controlGUILine1)
                    markGUILine.guiSegmentId = id
                    endGUIPoint.previousGUILine = markGUILine
                    markGUILine.l = segments[i][8][0]
                    guiLine.previousMarkLine = markGUILine

                }
                if (segments[i][8][3] != 0) {
                    let endPoint = new Point(segments[i][8][4], segments[i][8][5])
                    let endGUIPoint = new GUIOnPoint(endPoint)
                    endGUIPoint.guiSegmentId = id
                    let markGUILine = new GUIMarkLine(targetPoint, endPoint, targetGUIPoint, endGUIPoint, controlGUILine2)
                    markGUILine.guiSegmentId = id
                    endGUIPoint.previousGUILine = markGUILine
                    markGUILine.l = segments[i][8][3]
                    guiLine.nextMarkLine = markGUILine
                }
                if (segments[i][8][6] == 1) {
                    let markGUIRing = new GUIRing(guiLine.previousGUIPoint.baseBufferElement.center)
                    markGUIRing.fatherPoint = guiLine.previousGUIPoint
                    guiLine.previousGUIPoint.markRing = markGUIRing
                }
                if (segments[i][8][7] == 1) {
                    let markGUIRing = new GUIRing(guiLine.nextGUIPoint.baseBufferElement.center)
                    markGUIRing.fatherPoint = guiLine.nextGUIPoint
                    guiLine.nextGUIPoint.markRing = markGUIRing
                }
                currentPoint = targetPoint
                currentGUIPoint = targetGUIPoint
                currentGUILine = guiLine
                currentControlPoint = controlGUIPoint2
                // console.debug("construct Cubic Curve", controlPoint1, controlPoint2, targetPoint)
            }
        }
        // console.log("!!!render!!!", this._gui!.guiBaseElements)
    }

    private svgPathSegementsTo(segments: Array<any>) {
        let allSegements = []

        let startPointX = 0
        let startPointY = 0
        let lines = []
        let endPointX = 0
        let endPointY = 0

        let { gui, baseBuffer, viewPort } = GlobalManager.instance
        let bufferWidth = baseBuffer.bufferWidth;
        let bufferHeight = baseBuffer.bufferHeight;

        let bufferMinX = baseBuffer.minX + bufferWidth / 3;
        let bufferMinY = baseBuffer.minY + bufferHeight / 3;
        let bufferMaxX = baseBuffer.maxX - bufferWidth / 3;
        let bufferMaxY = baseBuffer.maxY - bufferHeight / 3;

        let emptyComment = ["", "", "", "", "", "", ""]
        for (let i = 0; i < segments.length; i++) {
            let command = segments[i][0]
            if (command == 'M') {
                startPointX = segments[i][1]
                startPointY = segments[i][2]
            } else if (command == 'C') {
                segments[i].push(emptyComment)
                lines.push(segments[i])
                if (i == segments.length - 1 || segments[i + 1][0] == 'M') {
                    //该段最后一个点
                    endPointX = segments[i][5]
                    endPointY = segments[i][6]
                    allSegements.push({
                        startPointX,
                        startPointY,
                        endPointX,
                        endPointY,
                        lines,
                        isClosed: (startPointX == endPointX && startPointY == endPointY)
                    })
                    lines = []
                }
            }
        }
        console.log("allSegements", allSegements)
        let minX = this._svgMinX
        let maxX = this._svgMaxX
        let minY = this._svgMinY
        let maxY = this._svgMaxY

        let newSegments = []
        for (let i = 0; i < allSegements.length; i++) {
            allSegements[i].startPointX = this.transform(minX, maxX, bufferMinX, bufferMaxX, allSegements[i].startPointX)
            allSegements[i].startPointY = this.transform(minY, maxY, bufferMinY, bufferMaxY, allSegements[i].startPointY)
            allSegements[i].endPointX = this.transform(minX, maxX, bufferMinX, bufferMaxX, allSegements[i].endPointX)
            allSegements[i].endPointY = this.transform(minY, maxY, bufferMinY, bufferMaxY, allSegements[i].endPointY)
            for (let j = 0; j < allSegements[i].lines.length; j++) {
                allSegements[i].lines[j][1] = this.transform(minX, maxX, bufferMinX, bufferMaxX, allSegements[i].lines[j][1])
                allSegements[i].lines[j][2] = this.transform(minY, maxY, bufferMinY, bufferMaxY, allSegements[i].lines[j][2])
                allSegements[i].lines[j][3] = this.transform(minX, maxX, bufferMinX, bufferMaxX, allSegements[i].lines[j][3])
                allSegements[i].lines[j][4] = this.transform(minY, maxY, bufferMinY, bufferMaxY, allSegements[i].lines[j][4])
                allSegements[i].lines[j][5] = this.transform(minX, maxX, bufferMinX, bufferMaxX, allSegements[i].lines[j][5])
                allSegements[i].lines[j][6] = this.transform(minY, maxY, bufferMinY, bufferMaxY, allSegements[i].lines[j][6])
            }
        }
        for (let i = 0; i < allSegements.length; i++) {
            this.renderOneSegment(0, allSegements[i])
        }
    }

    private transform(min: number, max: number, min2: number, max2: number, x: number) {
        return (x - min) / (max - min) * (max2 - min2) + min2
    }

    public saveSVG() {
        for (let element of this._gui!.guiBaseElements.values()) {
            if (element.isVisible == false && (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIControlLine || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIText)) {
                element.delete()
            }
        }
    }

    public changeToPreview() {
        // console.log("1111")
        for (let element of this._gui!.guiBaseElements.values()) {
            if (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIControlLine || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIText || element instanceof GUIMarkLine || element instanceof GUIRing) {
                // console.log("delete", element)
                element.isVisible = false
                element.delete()
            }
        }
        this._gui!.guiElementIndex = 0
        let falseArray = []
        for (let id of this._svgPath.keys()) {
            let i = this._svgPath.get(id)!
            if (i[0].fill == false) {
                falseArray.push(i[0])
                continue
            }
            console.log('current seg', i[0])
            this.renderOneSegment(id, i[0])

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
        for (let id = 0; id < falseArray.length; id++) {
            let i = falseArray[id]
            // if(i[0].fill == false){
            //     falseArray.push(i)
            //     continue
            // }
            console.log('current seg', i)
            this.renderOneSegment(id, i)

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
}

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        import.meta.hot!.invalidate()
        SvgEditor.anim!.stop()
    })
}
