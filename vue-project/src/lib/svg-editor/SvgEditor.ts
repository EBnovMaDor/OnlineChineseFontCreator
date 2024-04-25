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

    private _ifSend: number = 0;
    private _ifMarked: boolean = false;
    private _markedId: number = -1;
    private _isMarked: boolean = false;
    private _ifMarkedCanvas: boolean = false;
    private _markPoint: Point = new Point;
    private _textPoint: Point = new Point;

    private _svgMinX: number = -5;
    private _svgMaxX: number = 5;
    private _svgMinY: number = 0;
    private _svgMaxY: number = 10;

    private _pointPos: boolean = false
    private _linePos: boolean = false
    private _curvePos: boolean = false
    private _posSegment: Array<number> = []
    // private _bufferMinX: number = 0;
    // private _bufferMinY: number = 0;
    // private _bufferMaxX: number = 0;
    // private _bufferMaxY: number = 0;

    private _isRect: boolean = false;
    private _isTri: boolean = false;
    private _isCir: boolean = false;

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
        this._gui = new GUI(divId)
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
        // let { gui, baseBuffer, viewPort } = GlobalManager.instance
        // this.importSVGPath("m 0 0 M 3 1 M 3 0 C 3.6667 0 4.3333 0 6 0 L 6 1 M 4 2 L 8 1 Q 10 3 7 3 Q 5 5 3 4 C 2 4 1 4 0 2 Z M 9 5 L 3 7 L 5 9 L 9 5")
    }

    public importSVG(svgPath: string) {
        let { gui, baseBuffer, viewPort } = GlobalManager.instance
        console.log(svgPath)
        this.importSVGPath(svgPath)
        this.ifSend = 1
    }

    public exportSVG() {
        this.saveSVG()
        for (let element of this._gui!.guiBaseElements.values()) {
            // if(element.isChosen == false){}
        }
    }

    public transSVG(): Array<any> {
        if (this._currentTool != 'editor') { this.saveSVG() }
        let allSegements = []
        // let minmax = [this._svgMinX, this._svgMinY, this._svgMaxX, this._svgMaxY, this._bufferMinX, this._bufferMinY, this._bufferMaxX, this._bufferMaxY]
        // allSegements.push(minmax)

        for (let element of this._gui!.guiBaseElements.values()) {
            let lines = []
            if (element instanceof GUIStraightLine || element instanceof GUICubicCurve) {
                // console.log("18test", element.previousGUIPoint?.previousGUILine?.nextGUIPoint)
                if (element.isVisible == true) {
                    let segement = []
                    let comment = []
                    segement.push('C')
                    comment.push(element.comment)
                    comment.push(element.previousGUIPoint?.comment)
                    comment.push(element.nextGUIPoint?.comment)
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
                        segement.push('C');
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
                            segement.push('C');
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
            if (element instanceof GUIText) {
                if (element.isVisible == true) {
                    let segement = []

                    segement.push('T')
                    segement.push(element.baseBufferElement.center.x)
                    segement.push(element.baseBufferElement.center.y)
                    segement.push(element.baseBufferElement.text)
                    element.isVisible = false
                    allSegements.push(segement)
                    this.inVisible(element)
                }
            }
        }
        this.saveSVG()
        return allSegements
    }

    public transCmt(): Array<any> {
        let allComments = []
        console.log("this._gui!.guiBaseElements",this._gui!.guiBaseElements)
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

    public acceptSVG(allSegements: Array<any>) {
        for (let element of this._gui!.guiBaseElements.values()) {
            if (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIControlLine || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIText) {
                // console.log("delete", element)
                element.isVisible = false
                element.delete()
            }
        }
        this._gui!.guiElementIndex = 0
        // console.log("deleteMAP?????", this._gui!.guiBaseElements)
        // this._svgMinX = allSegements[0][0]
        // this._svgMinY = allSegements[0][1]
        // this._svgMaxX = allSegements[0][2]
        // this._svgMaxY = allSegements[0][3]
        // this._bufferMinX = allSegements[0][4]
        // this._bufferMinY = allSegements[0][5]
        // this._bufferMaxX = allSegements[0][6]
        // this._bufferMaxY = allSegements[0][7]

        // console.log(this._svgMinX)
        console.log("accept", allSegements)
        for (let i = 0; i < allSegements.length; i++) {
            this.renderOneSegment(allSegements[i])
        }
        // for (let i = 0; i < allComments.length; i++) {
        //     let element = this.gui.guiBaseElements.get(allComments[i])
        //     i++
        //     element!.comment = allComments[i]
        //     // console.log("commented element",element)
        //     // if (element instanceof GUIStraightLine || element instanceof GUICubicCurve) {
        //     //     element.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedLine)
        //     // }
        //     // else if (element instanceof GUIOnPoint) {
        //     //     element.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedOnPoint)
        //     // }
        //     // else if (element instanceof GUIOffPoint) {
        //     //     element.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedOffPoint)
        //     // }
        // }
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
            && (this._currentTool == 'editor' || this._currentTool == 'addStraightLine' || this._currentTool == 'addCurve' || this._currentTool == 'test')
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
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.x = 0
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point1.y = 0
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.x = 0
            this._gui!.multiSelectingLine!.baseBufferElement.attributes.point2.y = 0
            if (this._currentTool == 'editor') {
                console.log("EDITOR MODE")
                if (!e.ctrlKey) {
                    // console.log("NO CTRL MODE")
                    //首先判断是否选中元素了
                    if (isDecoratedShape(target!)) { //选中元素了
                        // console.log("一、选中元素了")
                        //判断上下文，是否先前已经选中多个元素
                        if (this._gui!.selectedElements.size == 0) {
                            // console.log("1、先前没有选中任何元素,新增元素")
                            target.guiElement.isSelected = true
                            console.log("当前选中的元素：", target.guiElement)
                            // if (target.guiElement.comment != "") {
                            //     this._isMarked = true
                            //     this._markedId = target.guiElement.guiElementId
                            // }
                            // else {
                            //     this._isMarked = false
                            // }
                        } else if (this._gui!.selectedElements.size == 1) {
                            // console.log("2、先前选中单个元素")
                            if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                // console.log("1）当前选的元素等于先前选的元素，无变换 Finish")
                            } else {
                                // console.log("2）当前选的元素不等于先前选的元素 清空元素并新增 Finish")
                                //重置selected中元素的isSelected为False
                                for (let element of this._gui!.selectedElements.values()) {
                                    element.isSelected = false
                                }
                                target.guiElement.isSelected = true
                                // console.log("当前选中的元素：", target.guiElement)
                            }
                            // if (target.guiElement.comment != "") {
                            //     this._isMarked = true
                            //     this._markedId = target.guiElement.guiElementId
                            // }
                            // else {
                            //     this._isMarked = false
                            // }
                        } else if (this._gui!.selectedElements.size > 1) {
                            // console.log("3、先前选中多个元素")
                            if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                //已经选中了，且是多选，所以开启拖拽操作
                                // console.log("1）当前选的元素是先前选的元素中的一个")
                            } else {
                                //重置selected中所有元素的isSelected为False
                                // console.log("2）当前选的元素不是先前选的元素中的一个，清空元素并新增 Finish")
                                //重置selected中元素的isSelected为False
                                for (let element of this._gui!.selectedElements.values()) {
                                    element.isSelected = false
                                }
                                target.guiElement.isSelected = true
                                // console.log("当前选中的元素：", target.guiElement)
                                // if (target.guiElement.comment != "") {
                                //     this._isMarked = true
                                //     this._markedId = target.guiElement.guiElementId
                                // }
                                // else {
                                //     this._isMarked = false
                                // }
                            }
                        }
                        this._isSelecting = false
                        this._isDragging = true
                        this._isRect = false
                        this._isCir = false
                        this._isTri = false

                    } else {
                        //选中画布了
                        // console.log("二、选中画布了，停止拖拽元素操作,清空所有元素并开始框选行为")
                        let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                        let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                        for (let element of this._gui!.selectedElements.values()) {
                            element.isSelected = false
                        }
                        this._isDragging = false
                        this._isSelecting = true
                        this._isRect = false
                        this._isCir = false
                        this._isTri = false

                        this._multiSelectingRectPos.x1 = bufferX
                        this._multiSelectingRectPos.y1 = bufferY
                    }
                } else {
                    // console.log("CTRL MODE")
                    if (isDecoratedShape(target!)) { //选中元素了
                        // console.log("一、选中元素了")
                        //判断上下文，是否先前已经选中多个元素
                        if (this._gui!.selectedElements.size == 0) {
                            // console.log("1、先前没有选中任何元素,新增元素")
                            target.guiElement.isSelected = true
                        } else if (this._gui!.selectedElements.size == 1) {
                            // console.log("2、先前选中单个元素")
                            if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                // console.log("1）当前选的元素等于先前选的元素，取消该元素选中 Finish")
                                target.guiElement.isSelected = false
                            } else {
                                // console.log("2）当前选的元素不等于先前选的元素 新增元素 Finish")
                                target.guiElement.isSelected = true
                            }
                        } else if (this._gui!.selectedElements.size > 1) {
                            // console.log("3、先前选中多个元素")
                            if (this._gui!.selectedElements.has(target.guiElement.guiElementId)) {
                                //已经选中了，且是多选，所以开启拖拽操作
                                // console.log("1）当前选的元素是先前选的元素中的一个 删除该元素 Finish")
                                this._gui!.selectedElements.get(target.guiElement.guiElementId)!.isSelected = false
                            } else {
                                //重置selected中所有元素的isSelected为False
                                // console.log("2）当前选的元素不是先前选的元素中的一个，新增元素 Finish")
                                target.guiElement.isSelected = true
                            }
                        }
                        this._isSelecting = false
                        this._isDragging = true
                        this._isRect = false
                        this._isCir = false
                        this._isTri = false

                        this._gui!.selectedElementsRect!.baseBufferElement.width = 0
                        this._gui!.selectedElementsRect!.baseBufferElement.height = 0
                    } else {
                        // console.log("二、选中画布了，停止拖拽元素操作,开始框选行为")
                        let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                        let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                        this._isDragging = false
                        this._isSelecting = true
                        this._isRect = false
                        this._isCir = false
                        this._isTri = false

                        this._multiSelectingRectPos.x1 = bufferX
                        this._multiSelectingRectPos.y1 = bufferY
                    }
                }
                // console.log("this._selectedElement", this._gui!.selectedElements)
            }
            else if (this._currentTool == 'addStraightLine') {
                console.log("ADD MODE --LINE")
                console.log("this._isSelecting", this._isSelecting)
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
                this._isRect = false
                this._isCir = false
                this._isTri = false

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
                    let currentPoint = new Point(targetPoint.x, targetPoint.y)
                    let currentGUIPoint = new GUIOnPoint(currentPoint)
                    // console.log("将当前直线加入队列中")
                    let guiLine = new GUIStraightLine(currentPoint, targetPoint)
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
                this._isRect = false
                this._isCir = false
                this._isTri = false

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
                            let controlGUIPoint2 = new GUIOffPoint(controlPoint2)
                            let controlGUILine1 = new GUIControlLine(controlPoint1, currentPoint, currentGUIPoint, controlGUIPoint1)
                            let controlGUILine2 = new GUIControlLine(controlPoint2, targetPoint, targetGUIPoint, controlGUIPoint2)

                            let guiLine = new GUICubicCurve(currentPoint, targetPoint, controlPoint1, controlPoint2)

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
                    let currentPoint = new Point(targetPoint.x, targetPoint.y)
                    let currentGUIPoint = new GUIOnPoint(currentPoint)
                    // 控制线
                    let controlPoint1 = new Point(targetPoint.x + 1, targetPoint.y)
                    let controlPoint2 = new Point(targetPoint.x + 1, targetPoint.y)
                    let controlGUIPoint1 = new GUIOffPoint(controlPoint1)
                    let controlGUIPoint2 = new GUIOffPoint(controlPoint2)
                    let controlGUILine1 = new GUIControlLine(controlPoint1, currentPoint, currentGUIPoint, controlGUIPoint1)
                    let controlGUILine2 = new GUIControlLine(controlPoint2, targetPoint, targetGUIPoint, controlGUIPoint2)
                    // console.log("将当前直线加入队列中")
                    let guiLine = new GUICubicCurve(currentPoint, targetPoint, controlPoint1, controlPoint2)
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
                this._isRect = false
                this._isCir = false
                this._isTri = false
                if (isDecoratedShape(target!)) { //选中元素了
                    // console.log("一、选中元素了")
                    // 取消之前所有元素的选中，只选中当前元素
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    target.guiElement.isSelected = true
                    if (this._gui!.selectedElements.size > 1) {
                        let iterator = this._gui!.selectedElements.values()
                        console.log(iterator.next())
                        let line = iterator.next().value
                        line.isVisible = false
                        for (let element of this._gui!.selectedElements.values()) {
                            if (element instanceof GUIOnPoint) {
                                if ((element.previousGUILine == null || element.previousGUILine?.isVisible == false) && (element.nextGUILine == null || element.nextGUILine?.isVisible == false)) {
                                    element.isVisible = false
                                }
                            }
                            else {
                                element.isVisible = false
                            }
                        }
                    }
                    target.guiElement.isSelected = false
                }
            }
            else if (this._currentTool == 'deletePoint') {
                this._isSelecting = false
                this._isDragging = true
                this._isRect = false
                this._isCir = false
                this._isTri = false
                console.log("DELETE MODE - POINT")
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
                            if (element instanceof GUIOnPoint) {
                                element.isVisible = false
                                // 前线是直线
                                if (element.previousGUILine instanceof GUIStraightLine) {
                                    if (element.previousGUILine.isVisible == true) {
                                        // 删除前线
                                        element.previousGUILine.isVisible = false
                                        // 判断前线的另一个点是否还有线连着
                                        if (element.previousGUILine.previousGUIPoint instanceof GUIOnPoint && (element.previousGUILine.previousGUIPoint.previousGUILine == null || element.previousGUILine.previousGUIPoint.previousGUILine.isVisible == false)) {
                                            element.previousGUILine.previousGUIPoint.isVisible = false
                                        }
                                    }
                                }
                                // 前线是曲线
                                else if (element.previousGUILine instanceof GUICubicCurve) {
                                    if (element.previousGUILine.isVisible == true) {
                                        // 删除前线
                                        element.previousGUILine.isVisible = false
                                        // 删除前控制线
                                        if (element.previousControlPoint != null && element.previousControlPoint.correspondingGUIControlLine != null) {
                                            element.previousControlPoint.isVisible = false
                                            element.previousControlPoint.correspondingGUIControlLine.isVisible = false
                                        }
                                        if (element.previousGUILine.previousGUIPoint instanceof GUIOnPoint) {
                                            // 删除另一个点的后控制线
                                            if (element.previousGUILine.previousGUIPoint.nextControlPoint != null && element.previousGUILine.previousGUIPoint.nextControlPoint.correspondingGUIControlLine != null) {
                                                element.previousGUILine.previousGUIPoint.nextControlPoint.isVisible = false
                                                element.previousGUILine.previousGUIPoint.nextControlPoint.correspondingGUIControlLine.isVisible = false
                                            }
                                            // 判断前线的另一个点是否还有线连着
                                            if (element.previousGUILine.previousGUIPoint.previousGUILine == null || element.previousGUILine.previousGUIPoint.previousGUILine.isVisible == false) {
                                                element.previousGUILine.previousGUIPoint.isVisible = false
                                            }
                                        }
                                    }
                                }
                                if (element.nextGUILine instanceof GUIStraightLine) {
                                    if (element.nextGUILine.isVisible == true) {
                                        element.nextGUILine.isVisible = false
                                        if (element.nextGUILine.nextGUIPoint instanceof GUIOnPoint && (element.nextGUILine.nextGUIPoint.nextGUILine == null || element.nextGUILine.nextGUIPoint.nextGUILine.isVisible == false)) {
                                            element.nextGUILine.nextGUIPoint.isVisible = false
                                        }
                                    }
                                }
                                else if (element.nextGUILine instanceof GUICubicCurve) {
                                    if (element.nextGUILine.isVisible == true) {
                                        // 删除后线
                                        element.nextGUILine.isVisible = false
                                        // 删除后控制线
                                        if (element.nextControlPoint != null && element.nextControlPoint.correspondingGUIControlLine != null) {
                                            element.nextControlPoint.isVisible = false
                                            element.nextControlPoint.correspondingGUIControlLine.isVisible = false
                                        }
                                        if (element.nextGUILine.nextGUIPoint instanceof GUIOnPoint) {
                                            // 删除另一个点的后控制线
                                            if (element.nextGUILine.nextGUIPoint.previousControlPoint != null && element.nextGUILine.nextGUIPoint.previousControlPoint.correspondingGUIControlLine != null) {
                                                element.nextGUILine.nextGUIPoint.previousControlPoint.isVisible = false
                                                element.nextGUILine.nextGUIPoint.previousControlPoint.correspondingGUIControlLine.isVisible = false
                                            }
                                            // 判断前线的另一个点是否还有线连着
                                            if (element.nextGUILine.nextGUIPoint.nextGUILine == null || element.nextGUILine.nextGUIPoint.nextGUILine.isVisible == false) {
                                                element.nextGUILine.nextGUIPoint.isVisible = false
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    target.guiElement.isSelected = false
                }
            }
            else if (this._currentTool == 'mark') {
                console.log("MARK")
                if (isDecoratedShape(target!)) { //选中元素了
                    // console.log("一、选中元素了")
                    //重置selected中元素的isSelected为False
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
                    target.guiElement.isSelected = true

                    // console.log("当前选中的元素：", target.guiElement)
                    this._isSelecting = false
                    this._isDragging = true
                    this._isRect = false
                    this._isCir = false
                    this._isTri = false

                    this._ifMarked = true
                    this._markedId = target.guiElement.guiElementId

                    let commentPos = new Point(e.clientX, e.clientY)
                    this._textPoint = commentPos
                    // if (target.guiElement instanceof GUIStraightLine || target.guiElement instanceof GUICubicCurve) {
                    //     target.guiElement.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedLine)
                    // }
                    // else if (target.guiElement instanceof GUIOnPoint) {
                    //     target.guiElement.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedOnPoint)
                    // }
                    // else if (target.guiElement instanceof GUIOffPoint) {
                    //     target.guiElement.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkedOffPoint)
                    // }

                }
                else {
                    // 选中画布了
                    console.log("no element choose to mark!")
                }
            }
            //添加文本
            else if (this._currentTool == 'markText') {
                console.log("Text")
                if (this._ifMarkedCanvas == false) {
                    let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                    let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                    let targetPoint = new Point(bufferX, bufferY)
                    let textPos = new Point(e.clientX, e.clientY)
                    this._markPoint = targetPoint
                    this._textPoint = textPos
                    this._ifMarkedCanvas = true
                }

            }
            else if (this._currentTool == 'deleteMark') {
                this._isSelecting = false
                this._isDragging = true
                this._isRect = false
                this._isCir = false
                this._isTri = false
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
                    target.guiElement.isSelected = false
                }
            }
            else if (this._currentTool == 'addRectangle') {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._isDragging = false
                this._isSelecting = false
                this._isRect = true
                this._isCir = false
                this._isTri = false

                this._multiSelectingRectPos.x1 = bufferX
                this._multiSelectingRectPos.y1 = bufferY
            }
            else if (this._currentTool == 'addCircle') {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = true
                this._isTri = false

                this._circlePos.x1 = bufferX
                this._circlePos.y1 = bufferY
                this._gui!.multiSelectingCircle!.baseBufferElement.center.x = this._circlePos.x1
                this._gui!.multiSelectingCircle!.baseBufferElement.center.y = this._circlePos.y1
            }
            else if (this._currentTool == 'addTriangle') {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = true

                this._circlePos.x1 = bufferX
                this._circlePos.y1 = bufferY
                this._gui!.multiSelectingTri!.baseBufferElement.center.x = this._circlePos.x1
                this._gui!.multiSelectingTri!.baseBufferElement.center.y = this._circlePos.y1
            }
            else if (this._currentTool == 'ruler') {
                console.log("ruler MODE")
                if (isDecoratedShape(target!)) { //选中元素了
                    for (let element of this._gui!.selectedElements.values()) {
                        element.isSelected = false
                    }
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
                    this._isRect = false
                    this._isCir = false
                    this._isTri = false

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
                    this._isRect = false
                    this._isCir = false
                    this._isTri = false
                    this._pointPos = false
                    this._linePos = true
                    this._curvePos = false
                }
            }
            else if (this._currentTool == 'test') {
                console.log("TEST")
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
            else if (this._isSelecting || this._isRect) {
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
                this._gui!.multiSelectingCircle!.baseBufferElement.radius = Math.sqrt(Math.pow(this._circlePos.x1 - bufferX, 2) + Math.pow(this._circlePos.y1 - bufferY, 2))
            }
            else if (this._isTri) {
                let { normalX, normalY } = this.gui.clientCoordinateToNormalCoordinate(e.clientX, e.clientY)
                let { bufferX, bufferY } = this.viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)
                this._gui!.multiSelectingTri!.baseBufferElement.radius = Math.sqrt(Math.pow(this._circlePos.x1 - bufferX, 2) + Math.pow(this._circlePos.y1 - bufferY, 2))
            }
            this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))
        } else if (eventType == 'pointerup' || eventType == 'pointerleave') {
            // if (this._currentTool == 'deletemark') {
            //     this._ifSend = 1
            //     // console.log("我是ts里的ifsend", this._ifSend)
            //     for (let element of this._gui!.selectedElements.values()) {
            //         element.isSelected = false
            //     }
            // }
            if (this._isDragging) {
                // console.log("先前处于拖拽行为，且选中元素长度>0 执行最终拖拽取整")
                this.dragElements(e, true)
                if (this._currentTool == 'editor') {
                    if (isDecoratedShape(target!)) {
                        // console.log("松手时有个元素！", target)
                        if (this._gui!.selectedElements.size == 1) {
                            // console.log("选中一个元素")
                            let currentPoint, targetPoint
                            let mergeFlag = 1
                            for (let element of this.gui!.selectedElements.values()) {
                                if (element instanceof GUIOnPoint) {
                                    // console.log("选中元素是个点")
                                    currentPoint = element
                                    if (currentPoint.previousGUILine != null && currentPoint.nextGUILine != null) {
                                        mergeFlag = 0
                                        // console.log("选中元素有前后线")
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
                                    // console.log("目标元素有前后线")
                                }
                            }
                            else {
                                mergeFlag = 0
                            }
                            // console.log("ifMerge", mergeFlag)
                            if (mergeFlag == 1) {
                                // 这两个点可以合并
                                // console.log("开始合并两个点")
                                if (currentPoint instanceof GUIOnPoint && targetPoint instanceof GUIOnPoint) {
                                    // console.log("这是两个点")
                                    // console.log("当前点的前线：", currentPoint.previousGUILine)
                                    // console.log("当前点的后线：", currentPoint.nextGUILine)
                                    if (currentPoint.nextGUILine == null) {
                                        // console.log("当前点没有后线")
                                        // console.log("目标点的前线：", targetPoint.previousGUILine)
                                        // console.log("目标点的后线：", targetPoint.nextGUILine)
                                        if (targetPoint.previousGUILine == null) {
                                            // console.log("目标点没有前线")
                                            // console.log("合并！！")
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
                                            // console.log("currentPoint.previousGUILine", currentPoint.previousGUILine)
                                            // console.log("targetPoint", targetPoint)
                                            // console.log("currentPoint", currentPoint)
                                            // console.log("这个线连的两个点", currentPoint.previousGUILine?.previousGUIPoint, currentPoint.previousGUILine?.nextGUIPoint)
                                        }
                                        else if (targetPoint.nextGUILine == null) {

                                        }

                                    }
                                    else if (currentPoint?.previousGUILine == null) {
                                        if (targetPoint?.previousGUILine == null) {

                                        }
                                        else if (targetPoint.nextGUILine == null) {

                                            // console.log("目标点没有前线")
                                            // console.log("我我我合并！！")
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
                                            // console.log("currentPoint.previousGUILine", currentPoint.previousGUILine)
                                            // console.log("targetPoint", targetPoint)
                                            // console.log("currentPoint", currentPoint)
                                            // console.log("这个线连的两个点", currentPoint.previousGUILine.previousGUIPoint, currentPoint.previousGUILine.nextGUIPoint)
                                        }

                                    }

                                }

                                // console.log("MERGEMAP", this._gui!.guiBaseElements)
                            }
                        }
                    }
                }
                else if (this._currentTool == 'addCurve') {
                    if (isDecoratedShape(target!)) {
                        // console.log("松手时有个元素！", target)
                        if (this._gui!.selectedElements.size == 1) {
                            // console.log("选中一个元素")
                            let curveLine
                            for (let element of this.gui!.selectedElements.values()) {
                                if (element instanceof GUIOnPoint) {
                                    // console.log("选中元素是个on点")
                                    curveLine = element.previousGUILine
                                    let controlPoint1 = new Point(curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.x! * 2 / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.x! / 3, curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.y! * 2 / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.y! / 3)
                                    let controlPoint2 = new Point(curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.x! / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.x! * 2 / 3, curveLine?.previousGUIPoint?.baseBufferElement.attributes.center.y! / 3 + curveLine?.nextGUIPoint?.baseBufferElement.attributes.center.y! * 2 / 3)
                                    if (curveLine?.previousGUIPoint instanceof GUIOnPoint)
                                        curveLine!.previousGUIPoint!.nextControlPoint!.baseBufferElement.center = controlPoint1

                                    if (curveLine?.nextGUIPoint instanceof GUIOnPoint)
                                        curveLine!.nextGUIPoint!.previousControlPoint!.baseBufferElement.center = controlPoint2
                                }
                            }

                        }
                    }
                }

                // let segment = this.transSVG()
                // console.log("这是我自己写的输出SVG的结果: ", segment)

                this._isDragging = false
                this._isSelecting = false
                this._isRect = false
                this._isCir = false
                this._isTri = false


                // if (isPrimary(e)) {
                //     this._isPointerDown.primary = false
                //     this._currentEvent.primary = null
                //     this._lastEvent.primary = null
                // }
                // else {
                //     this._isPointerDown.secondary = false
                //     this._currentEvent.secondary = null
                //     this._lastEvent.secondary = null
                // }
                if (this._currentTool != 'mark' && (!e.ctrlKey)) {
                    this._ifSend = 1
                    // console.log("我是ts里的ifsend", this._ifSend)

                }
                for (let element of this._gui!.selectedElements.values()) {
                    element.isSelected = false
                }
                this._eventHandler.addEvent(new RefreshSEBBoxEvent(e))

            }
            else if (this._isSelecting) {
                // console.log("先前处于框选行为，此为结束框选终点，计算框选矩形相关内容")
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
        console.log(element)
    }

    public markOnCanvas(x: number, y: number, comment: string) {
        let currentComment = new GUIText(new Point(x, y), comment)
        console.log(currentComment)
    }


    private renderOneSegment(segement: any) {
        let { gui, baseBuffer } = GlobalManager.instance
        if (segement[0] == 'T') {
            let point = new Point(segement[1], segement[2]);
            let guiText = new GUIText(point, segement[3]);
            console.log(guiText)
            return
        }
        let isClosed = segement.isClosed
        let startPoint: Point = new Point(segement.startPointX, segement.startPointY)
        let currentPoint = startPoint
        let segments = segement.lines
        let startGUIPoint = new GUIOnPoint(startPoint)
        let currentGUIPoint = startGUIPoint
        let currentGUILine = null
        let currentControlPoint = null
        for (let i = 0; i < segments.length; i++) {
            let targetPoint = (i == segments.length - 1 && isClosed) ? startPoint : new Point(segments[i][5], segments[i][6])
            let targetGUIPoint = (i == segments.length - 1 && isClosed) ? startGUIPoint : new GUIOnPoint(targetPoint)
            if (segments[i][3] == segments[i][5] && segments[i][4] == segments[i][6]) {
                //直线
                let guiLine = new GUIStraightLine(currentPoint, targetPoint)
                currentGUIPoint.nextGUILine = guiLine
                currentGUIPoint.previousGUILine = currentGUILine

                targetGUIPoint.previousGUILine = guiLine

                guiLine.previousGUIPoint = currentGUIPoint
                guiLine.nextGUIPoint = targetGUIPoint

                // console.log("render!!",segments[i][7])
                guiLine.comment = segments[i][7][0]
                guiLine.previousGUIPoint.comment = segments[i][7][1]
                guiLine.nextGUIPoint.comment = segments[i][7][2]

                currentGUILine = guiLine
                currentPoint = targetPoint
                currentGUIPoint = targetGUIPoint

                // console.debug("construct Line", currentPoint, targetPoint)
            } else {
                //三次贝塞尔曲线
                let controlPoint1 = new Point(segments[i][1], segments[i][2])
                let controlPoint2 = new Point(segments[i][3], segments[i][4])
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

                guiLine.comment = segments[i][7][0]
                guiLine.previousGUIPoint.comment = segments[i][7][1]
                guiLine.nextGUIPoint.comment = segments[i][7][2]
                guiLine.previousGUIPoint.nextControlPoint!.comment = segments[i][7][3]
                guiLine.previousGUIPoint.nextControlPoint!.correspondingGUIControlLine!.comment == segments[i][7][4]
                guiLine.nextGUIPoint.previousControlPoint!.comment = segments[i][7][5]
                guiLine.nextGUIPoint.previousControlPoint!.correspondingGUIControlLine!.comment == segments[i][7][6]

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

        // this._bufferMinX = bufferMinX
        // this._bufferMinY = bufferMinY
        // this._bufferMaxX = bufferMaxX
        // this._bufferMaxY = bufferMaxY

        // let minX = 1e7;
        // let minY = 1e7;
        // let maxX = -1e7;
        // let maxY = -1e7;
        let emptyComment = ["", "", "", "", "", "", ""]
        for (let i = 0; i < segments.length; i++) {
            let command = segments[i][0]
            if (command == 'M') {
                startPointX = segments[i][1]
                startPointY = segments[i][2]
                // if (startPointX < minX) minX = startPointX
                // if (startPointY < minY) minY = startPointY
                // if (startPointX > maxX) maxX = startPointX
                // if (startPointY > maxY) maxY = startPointY
            } else if (command == 'C') {
                // if (segments[i][1] < minX) minX = segments[i][1]
                // if (segments[i][2] < minY) minY = segments[i][2]
                // if (segments[i][1] > maxX) maxX = segments[i][1]
                // if (segments[i][2] > maxY) maxY = segments[i][2]
                // if (segments[i][3] < minX) minX = segments[i][3]
                // if (segments[i][4] < minY) minY = segments[i][4]
                // if (segments[i][3] > maxX) maxX = segments[i][3]
                // if (segments[i][4] > maxY) maxY = segments[i][4]
                // if (segments[i][5] < minX) minX = segments[i][5]
                // if (segments[i][6] < minY) minY = segments[i][6]
                // if (segments[i][5] > maxX) maxX = segments[i][5]
                // if (segments[i][6] > maxY) maxY = segments[i][6]
                segments[i].push(emptyComment)
                // console.log("import",segments[i])
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
        // console.log("minX, maxX, minY, maxY", minX, maxX, minY, maxY)
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
            // console.log("render:",allSegements[i])
            this.renderOneSegment(allSegements[i])
        }
    }

    private transform(min: number, max: number, min2: number, max2: number, x: number) {
        return (x - min) / (max - min) * (max2 - min2) + min2
    }

    public saveSVG() {
        console.log("saveSVG")
        for (let element of this._gui!.guiBaseElements.values()) {
            // console.log("delete",element)
            if (element.isVisible == false && (element instanceof GUIStraightLine || element instanceof GUICubicCurve || element instanceof GUIControlLine || element instanceof GUIOffPoint || element instanceof GUIOnPoint || element instanceof GUIText)) {
                // console.log("delete", element)
                element.delete()
            }
        }
    }

    public changeToPreview() {
        console.log("changeToPreview")
        for (let element of this._gui!.guiBaseElements.values()) {
            if (!instanceOfGUILine(element) || element instanceof GUIControlLine) {
                element.isVisible = false
            } else {
                if (element.isVisible) {
                    // console.log("element.isVisible", element, element.isVisible)
                    //没访问问过的线段
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
                        arr.push(nextGUILine)
                        nextGUILine = (nextGUILine!.nextGUIPoint! as GUIOnPoint).nextGUILine
                    }
                    if (isClosed) {
                        // console.log("isClosed", element)
                        // console.log("isClosed", arr)
                        for (let i = 0; i < arr.length; i++) {
                            if (arr[i] instanceof GUICubicCurve) {
                                arr[i].baseBufferElement.config.fill = 'black'
                            } else {
                                arr[i].isVisible = false
                            }

                        }
                        let a = new GUIClosedPath(new BaseBufferClosedPolygon(arr))
                        this._gui!.addGUIPreviewElement(a)
                    }
                }
            }
        }
        // console.log("changeToPreview finish", this._gui!.guiBaseElements)
    }
}

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        import.meta.hot!.invalidate()
        SvgEditor.anim!.stop()
    })
}
