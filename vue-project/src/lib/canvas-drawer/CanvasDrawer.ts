/**
 * @file CanvasDrawer.ts
 * @description a high-performance canvas drawer engine with apple pencil or other pointer device. 
 * Currently Support Expressure & tiltX/Y. Using Examples are in @link ../examples/CanvasDrawerExample.vue
 * @version 1.0.0
 * @license MIT
 * @author Lvkesheng Shen
 * @date 2021-03-01
 * @lastEditTime 2021-03-01
 * @lastEditors Lvkesheng Shen
 * @exports CanvasDrawer
 */

import CommonUtil from "../util/CommonUtil"
import CanvasUtil from "../util/CanvasUtil"

export default class CanvasDrawer {
    /** canvas object */
    private canvas: HTMLCanvasElement;
    /** canvas width */
    private canvasWidth: number;
    /** canvas height */
    private canvasHeight: number;
    /** canvas ctx */
    private ctx: CanvasRenderingContext2D;
    /** max stroke width */
    private maxStrokeWidth: number;
    /** current stroke width */
    private currentStrokeWidth: number;
    /** current color */
    private currentColor: string;
    /** background color */
    private backgroundColor: string;
    /** current drawn path */
    private drawnPaths: {
        path: { x: number, y: number }[],
        originStrokeWidth: number[],
        smoothedStrokeWidth: number[],
        color: string
    }[];
    /** current is drawing flag */
    private drawing: boolean;

    /**smoothed window size for smoothing the stroke width */
    private smoothedWindowSize: number = 5;

    /**multi env support */
    private supportPointerEvent: boolean = false;

    /**primary pointer device params 
     * https://developer.mozilla.org/zh-CN/docs/Web/API/PointerEvent
    */
    private primaryPointerDeviceParams: {
        pressure: number,
        tiltX: number,
        tiltY: number,
        height: number,
        width: number
        tangentialPressure: number,
        twist: number,
        pointerType: string,
    } = {
            pressure: 0.5,
            tiltX: 0,
            tiltY: 0,
            height: 0,
            width: 0,
            tangentialPressure: 0,
            twist: 0,
            pointerType: 'mouse'
        };

    /**
     * constructor
     * @param canvas 
     * @param maxStrokeWidth 
     * @param debugMode 
     * @param debugHelper 
     */
    constructor(canvasId: string, maxStrokeWidth: number = 25, smoothedWindowSize: number = 5) {
        console.info("CanvasDrawer Init")

        // Set canvas and some attributes
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (this.canvas == null) throw new Error('Cannot find designated Canvas')

        this.canvasWidth = this.canvas.width
        this.canvasHeight = this.canvas.height
        this.ctx = this.canvas.getContext('2d')!

        // Set ctx and some attributes
        this.maxStrokeWidth = maxStrokeWidth
        this.currentStrokeWidth = this.ctx.lineWidth = maxStrokeWidth / 2
        this.currentColor = this.ctx.strokeStyle = '#000'
        this.backgroundColor = this.ctx.fillStyle = '#fff'
        this.ctx.lineJoin = 'round'
        this.ctx.lineCap = 'round'

        this.smoothedWindowSize = smoothedWindowSize

        this.drawnPaths = []
        this.drawing = false

        // bind pointer events 
        this.bindPointerEvents()

        // multi env support
        this.supportPointerEvent = typeof PointerEvent !== 'undefined'
        if (!this.supportPointerEvent) throw new Error('浏览器不支持PointerEvent,请更换浏览器')
    }

    /**
     * get base64Url of this Canvas
     * @returns Base64Url
     */
    public getBase64Url(): string {
        return CanvasUtil.canvasToBase64Url(this.canvas)
    }

    /**
     * get Blob of this Canvas
     * @returns Blob data
     */
    public getBlob(): Promise<Blob> {
        return CanvasUtil.canvasToBlob(this.canvas)
    }

    /**
     * setMaxStrokeWidth
     * @param strokeWidth : 40
     */
    public setMaxStrokeWidth(strokeWidth: number): void {
        this.maxStrokeWidth = strokeWidth
    }

    /**
     * setStrokeColor
     * @param strokeColor : stroke color string like "#000000"
     */
    public setStrokeColor(strokeColor: string): void {
        this.currentColor = this.ctx.strokeStyle = strokeColor
    }

    /**
     * undo one operation on the canvas
     */
    public undoOperation(): void {
        const popped = this.drawnPaths.pop()
        /** to handle those click event,because those click will cause element with path.length = 0 */
        if (popped !== undefined && popped.path.length === 0) {
            this.drawnPaths.pop()
        }
        this.render()
    }

    /**
     * clear canvas
     */
    public clearCanvas(): void {
        this.drawnPaths = []
        this.render()
    }

    /** 
     * get current primary pointer device params 
     */
    public getPointerDeviceParams(): object {
        return {
            pressure: this.primaryPointerDeviceParams.pressure,
            height: this.primaryPointerDeviceParams.height,
            width: this.primaryPointerDeviceParams.width,
            tangentialPressure: this.primaryPointerDeviceParams.tangentialPressure,
            tiltX: this.primaryPointerDeviceParams.tiltX,
            tiltY: this.primaryPointerDeviceParams.tiltY,
            twist: this.primaryPointerDeviceParams.twist,
            pointerType: this.primaryPointerDeviceParams.pointerType,
        }
    }

    /** get xy in a pointer event */
    private getXY(event: PointerEvent): { x: number, y: number } {
        const clientX = event.clientX
        const clientY = event.clientY
        const rect = this.canvas.getBoundingClientRect()
        const x = (clientX - rect.left) / rect.width * this.canvasWidth
        const y = (clientY - rect.top) / rect.height * this.canvasHeight
        return { x, y }
    }

    private bindPointerEvents() {
        const isPrimary = (e: PointerEvent) => e.isPrimary

        const onPointerDown = (e: PointerEvent) => {
            console.debug("onpointer down")
            if (isPrimary(e)) {
                this.beginDrawing();
                this.render()
            }
        }

        const onPointerMove = (e: PointerEvent) => {
            if (isPrimary(e)) {
                if (e.cancelable) e.preventDefault()
                this.continueDrawing(e)
            }
        }

        const onPointerUp = (e: PointerEvent) => {
            if (isPrimary(e)) {
                this.endDrawing();
                this.render()
            }
        }

        /** We use PointerEvent, PointerEvent extends from MouseEvent
         *  @link https://developer.mozilla.org/en-US/docs/web/api/pointerevent
         *  
         *  Attribute 'pointerType' shows the type of pointer device that triggered the event,
         *  it can be 'mouse', 'pen' or 'touch'
         */
        this.canvas.onpointerdown = onPointerDown;

        this.canvas.onpointermove = onPointerMove;

        this.canvas.onpointerup = onPointerUp;
    }

    private beginDrawing() {
        if (!this.drawing) {
            if (!(this.drawnPaths.length > 0 &&
                this.drawnPaths[this.drawnPaths.length - 1].path.length === 0)) {
                this.drawnPaths.push({ path: [], originStrokeWidth: [], smoothedStrokeWidth: [], color: this.currentColor })
            }
            this.drawing = true
        }
    }

    private continueDrawing(event: PointerEvent) {
        if (this.drawing) {
            this.drawnPaths[this.drawnPaths.length - 1].path.push(this.getXY(event))
            this.drawnPaths[this.drawnPaths.length - 1].originStrokeWidth.push(event.pressure * this.maxStrokeWidth)
            this.drawnPaths[this.drawnPaths.length - 1].smoothedStrokeWidth = CommonUtil.calculateMovingAverage(
                this.drawnPaths[this.drawnPaths.length - 1].originStrokeWidth,
                this.smoothedWindowSize)
            this.render()
        }
    }

    private endDrawing() {
        if (this.drawing) {
            this.drawing = false
        }
        this.render()
    }

    private render(ctx = this.ctx) {
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
        this.drawnPaths.forEach(async pathObj => {
            let { path, smoothedStrokeWidth, color } = pathObj
            for (let i = 0; i < path.length; i++) {
                const point = path[i];
                if (i == 0) continue;
                const lastPoint = path[i - 1];
                const xc = (point.x + lastPoint.x) / 2
                const yc = (point.y + lastPoint.y) / 2
                if (i == 1) {
                    ctx.beginPath()
                    ctx.moveTo(xc, yc)
                    continue
                }
                ctx.lineWidth = smoothedStrokeWidth[i - 1];
                ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, xc, yc)
                ctx.stroke()
                ctx.closePath()
                ctx.beginPath()
                ctx.moveTo(xc, yc)
            }
            ctx.closePath()
        })
    }

}
