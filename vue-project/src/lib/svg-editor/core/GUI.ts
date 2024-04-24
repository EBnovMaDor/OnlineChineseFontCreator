import Konva from "konva";
import { DualHRangeBar, DualVRangeBar } from 'dual-range-bar'
import GlobalManager from "../GlobalManager";
import Renderer from "./Renderer";
import type GUIElement from "../gui-element/interface/GUIElement";
import GUIDecoratedRect from "../gui-element/gui-decorated-elements/GUIDecoratedRect";
import BaseBufferRect from "../base-buffer-element/BaseBufferRect";
import GUIDecoratedTri from "../gui-element/gui-decorated-elements/GUIDecoratedTri";
import BaseBufferTri from "../base-buffer-element/BaseBufferTri";
import GUIDecoratedCircle from "../gui-element/gui-decorated-elements/GUIDecoratedCircle";
import BaseBufferCircle from "../base-buffer-element/BaseBufferCircle";
import GUIDecoratedLine from "../gui-element/gui-decorated-elements/GUIDecoratedLine";
import BaseBufferLine from "../base-buffer-element/BaseBufferLine";
import Point from "../util/Point";
import type GUIBaseElement from "../gui-element/interface/GUIBaseElement";
import type GUIDecoratedElement from "../gui-element/interface/GUIDecoratedElement";
import type Observer from "../util/ObserverMode/Observer";
import { instanceOfGUILine } from "../util/InstanceHelper";
export default class GUI implements Observer {
    private _divElement: HTMLDivElement;
    private _divParentElement: HTMLDivElement | null = null;

    private _canvas: Konva.Stage;
    private _mainLayer: Konva.Layer;
    private _pointGroup: Konva.Group;
    private _lineGroup: Konva.Group;
    private _virtualPointGroup: Konva.Group;
    private _virtualLineGroup: Konva.Group;
    private _decoratedGroup: Konva.Group;

    private _guiElementIndex: number = 0;
    private _guiBaseElements: Map<string | number, GUIBaseElement> = new Map<string | number, GUIBaseElement>();
    private _guiDecoratedElements: Map<string | number, GUIDecoratedElement> = new Map<string | number, GUIDecoratedElement>();

    private _selectedElements: Map<string | number, GUIBaseElement> = new Map<string | number, GUIBaseElement>();

    private _dualHRangeBar: DualHRangeBar | null = null;
    private _dualVRangeBar: DualVRangeBar | null = null;

    private _multiSelectingRect: GUIDecoratedRect | null = null;
    private _multiSelectingTri: GUIDecoratedTri | null = null;
    private _multiSelectingCircle: GUIDecoratedCircle | null = null;
    private _multiSelectingLine: GUIDecoratedLine | null = null;
    private _selectedElementsRect: GUIDecoratedRect | null = null;

    private _guiPreviewElements: Map<string | number, GUIElement> = new Map<string | number, GUIElement>();

    constructor(divId: string) {
        this._divElement = document.getElementById(divId) as HTMLDivElement;
        if (this._divElement == null) throw new Error('Cannot find designated Div')

        /** 初始化Canvas */
        this._canvas = new Konva.Stage({
            container: divId,   // id of container <div>
            width: this.canvasWidth,
            height: this.canvasHeight,
        });


        this._mainLayer = new Konva.Layer()
        this._lineGroup = new Konva.Group()
        this._pointGroup = new Konva.Group()
        this._virtualPointGroup = new Konva.Group()
        this._virtualLineGroup = new Konva.Group()
        this._decoratedGroup = new Konva.Group()

        this._mainLayer.add(this._lineGroup)
        this._mainLayer.add(this._pointGroup)
        this._mainLayer.add(this._virtualLineGroup)
        this._mainLayer.add(this._virtualPointGroup)
        this._mainLayer.add(this._decoratedGroup)

        this._canvas.add(this._mainLayer);

        this._initScrollBar()
    }

    set guiElementIndex(guiElementIndex: number) {
        this._guiElementIndex = guiElementIndex
    }

    update(guiElementId: number, isSelected: boolean): void {
        console.debug("GUI Element Selected Update", guiElementId, isSelected)
        console.debug("this.guiBaseElements", this.guiBaseElements)
        if (isSelected) {
            this.selectedElements.set(guiElementId, this.guiBaseElements.get(guiElementId)!)
        } else {
            this.selectedElements.delete(guiElementId)
        }
    }

    public addGUIBaseElement(guiElement: GUIBaseElement): void {
        let { baseBuffer } = GlobalManager.instance
        guiElement.guiElementId = this._guiElementIndex++
        this._guiBaseElements.set(guiElement.guiElementId, guiElement)
        if (guiElement.baseBufferElement != null) baseBuffer.addBaseBufferElement(guiElement.baseBufferElement)
        if (guiElement.virtualBufferElement != null) baseBuffer.addBaseBufferElement(guiElement.virtualBufferElement)
    }

    public deleteGUIBaseElement(guiElement: GUIBaseElement): void {
        let { baseBuffer } = GlobalManager.instance
        let guiElementIdx = guiElement.guiElementId
        this._guiBaseElements.delete(guiElementIdx)
        // console.log("我在GUI里！！delete from _guiBaseElements",guiElementIdx)
        if (guiElement.baseBufferElement != null)baseBuffer.deleteBaseBufferElement(guiElement.baseBufferElement)
        if (guiElement.virtualBufferElement != null)baseBuffer.deleteBaseBufferElement(guiElement.virtualBufferElement)
    }

    public addGUIDecoratedElement(guiElement: GUIDecoratedElement): void {
        guiElement.guiElementId = this._guiElementIndex++
        this._guiDecoratedElements.set(guiElement.guiElementId, guiElement)
        let { baseBuffer } = GlobalManager.instance
        baseBuffer.addBaseBufferElement(guiElement.baseBufferElement)
    }

    public addGUIPreviewElement(guiElement: GUIElement): void {
        guiElement.guiElementId = this._guiElementIndex++
        this._guiPreviewElements.set(guiElement.guiElementId, guiElement)
    }

    public updateSelectedElementsRect() {
        if (this.selectedElements.size > 1) {
            let BBox = this.getSelectedElementsBBox()

            this.selectedElementsRect!.baseBufferElement.leftTop.x = BBox.x1
            this.selectedElementsRect!.baseBufferElement.leftTop.y = BBox.y1
            this.selectedElementsRect!.baseBufferElement.width = BBox.x2 - BBox.x1
            this.selectedElementsRect!.baseBufferElement.height = BBox.y2 - BBox.y1
        } else {
            this.selectedElementsRect!.baseBufferElement.width = 0
            this.selectedElementsRect!.baseBufferElement.height = 0
        }
    }

    public getSelectedElementsBBox(): { x1: number, y1: number, x2: number, y2: number } {
        let x1 = Number.MAX_VALUE, y1 = Number.MAX_VALUE, x2 = Number.MIN_VALUE, y2 = Number.MIN_VALUE
        for (let element of this.selectedElements.values()) {
            if (!instanceOfGUILine(element)) {
                let bbox = element.baseBufferElement.boudingBox
                x1 = Math.min(x1, bbox.minX)
                y1 = Math.min(y1, bbox.minY)
                x2 = Math.max(x2, bbox.maxX)
                y2 = Math.max(y2, bbox.maxY)
            }
        }
        return { x1, y1, x2, y2 }
    }

    get guiDecoratedElements(): Map<string | number, GUIDecoratedElement> {
        return this._guiDecoratedElements
    }

    get selectedElements(): Map<string | number, GUIBaseElement> {
        return this._selectedElements
    }

    set selectedElements(value: Map<string | number, GUIBaseElement>) {
        this._selectedElements = value
    }

    get guiBaseElements(): Map<string | number, GUIBaseElement> {
        return this._guiBaseElements
    }

    get guiPreviewElements(): Map<string | number, GUIElement> {
        return this._guiPreviewElements
    }

    get canvasScale(): number {
        return this.canvasWidth / this.canvasHeight;
    }

    get canvasWidth(): number {
        return this._divElement.clientWidth!
    }

    get canvasHeight(): number {
        return this._divElement.clientHeight!
    }

    get canvasDivX(): number {
        return this._divElement.getBoundingClientRect().left;
    }

    get canvasDivY(): number {
        return this._divElement.getBoundingClientRect().top;
    }

    get mainLayer(): Konva.Layer {
        return this._mainLayer;
    }

    get pointGroup(): Konva.Group {
        return this._pointGroup;
    }

    get lineGroup(): Konva.Group {
        return this._lineGroup;
    }

    get virtualPointGroup(): Konva.Group {
        return this._virtualPointGroup;
    }

    get virtualLineGroup(): Konva.Group {
        return this._virtualLineGroup;
    }

    get canvas(): Konva.Stage {
        return this._canvas;
    }

    get divElement(): HTMLDivElement {
        return this._divElement;
    }

    get dualHRangeBar(): DualHRangeBar | null {
        return this._dualHRangeBar;
    }

    get dualVRangeBar(): DualVRangeBar | null {
        return this._dualVRangeBar;
    }

    get divParentElement(): HTMLDivElement | null {
        return this._divParentElement;
    }

    get decoratedGroup(): Konva.Group {
        return this._decoratedGroup;
    }

    get multiSelectingRect(): GUIDecoratedRect | null {
        return this._multiSelectingRect;
    }

    get multiSelectingTri(): GUIDecoratedTri | null {
        return this._multiSelectingTri;
    }

    get multiSelectingCircle(): GUIDecoratedCircle | null {
        return this._multiSelectingCircle;
    }

    get multiSelectingLine(): GUIDecoratedLine | null {
        return this._multiSelectingLine;
    }

    get selectedElementsRect(): GUIDecoratedRect | null {
        return this._selectedElementsRect;
    }

    public normalCoordinateToCanvasCoordinate(normalX: number, normalY: number): { canvasX: number, canvasY: number } {
        return {
            canvasX: normalX * this.canvasWidth,
            canvasY: normalY * this.canvasHeight
        }
    }

    public canvasCoordinateToNormalCoordinate(canvasX: number, canvasY: number): { normalX: number, normalY: number } {
        return {
            normalX: canvasX / this.canvasWidth,
            normalY: canvasY / this.canvasHeight
        }
    }

    public normalCoordinateToClientCoordinate(normalX: number, normalY: number): { clientX: number, clientY: number } {
        const { canvasX, canvasY } = this.normalCoordinateToCanvasCoordinate(normalX, normalY);
        return {
            clientX: canvasX + this.canvasDivX,
            clientY: canvasY + this.canvasDivY
        }
    }

    public clientCoordinateToNormalCoordinate(clientX: number, clientY: number): { normalX: number, normalY: number } {
        const canvasX = clientX - this.canvasDivX;
        const canvasY = clientY - this.canvasDivY;
        return this.canvasCoordinateToNormalCoordinate(canvasX, canvasY);
    }

    public normalWidthToGUIWidth(normalWidth: number): number {
        return normalWidth * this.canvasWidth;
    }

    public normalHeightToGUIHeight(normalHeight: number): number {
        return normalHeight * this.canvasHeight;
    }

    public GUIWidthToNormalWidth(canvasWidth: number): number {
        return canvasWidth / this.canvasWidth;
    }

    public GUIHeightToNormalHeight(canvasHeight: number): number {
        return canvasHeight / this.canvasHeight;
    }

    public bindWindowResize() {
        let that = this
        let { viewPort } = GlobalManager.instance
        // 创建ResizeObserver实例
        var observer = new ResizeObserver(function (entries) {
            for (var entry of entries) {
                // 当元素的宽高发生变化时执行的代码
                viewPort.setViewPortScale(viewPort.width * that.canvasWidth / entry.contentRect.width)
                Renderer.renderGrid()
                that.canvas.width(entry.contentRect.width);
                that.canvas.height(entry.contentRect.height);
                that.divParentElement!.setAttribute("style", `position: relative;width: ${that.canvasWidth}px;height: ${that.canvasHeight}px;`)
            }
        });

        // 开始观察元素
        observer.observe(that.divElement);
    }

    public bindPixelRatioChange() {
        let that = this
        let mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
        const updatePixelRatio = () => {
            let pr = window.devicePixelRatio;
            that._mainLayer.getCanvas().setPixelRatio(pr);
        }
        updatePixelRatio();
        matchMedia(mqString).addEventListener('change', updatePixelRatio);
    }


    public bindScrollBarEvent() {
        this._dualHRangeBar?.addEventListener('update', (e: any) => {
            let { gui, viewPort, baseBuffer } = GlobalManager.instance
            viewPort.setViewPortScale((e.detail.upper - e.detail.lower) * baseBuffer.bufferWidth)
            let newX = e.detail.lower * baseBuffer.bufferWidth + baseBuffer.minX
            viewPort.setViewPortPos(newX, viewPort.y)
            Renderer.renderGrid()
        })

        this._dualVRangeBar?.addEventListener('update', (e: any) => {
            let { gui, viewPort, baseBuffer } = GlobalManager.instance
            let newScale = (e.detail.upper - e.detail.lower) * baseBuffer.bufferHeight * GlobalManager.instance.gui.canvasScale
            viewPort.setViewPortScale(newScale)
            let newY = e.detail.lower * baseBuffer.bufferHeight + baseBuffer.minY
            viewPort.setViewPortPos(viewPort.x, newY)
            Renderer.renderGrid()
        })
    }

    private _initScrollBar() {
        let parent = this._divElement.parentElement
        this._divParentElement = document.createElement("div")
        this._divParentElement.setAttribute("id", "scroll-bar-parent")
        this._divParentElement.setAttribute("style", `position: relative;width: ${this.canvasWidth}px;height: ${this.canvasHeight}px;`)
        parent?.appendChild(this._divParentElement)

        this._divParentElement.appendChild(this.divElement)
        let horizontalScrollBarDiv = document.createElement("div")
        let verticalScrollBarDiv = document.createElement("div")

        horizontalScrollBarDiv.setAttribute("id", 'horizontal-bar')
        verticalScrollBarDiv.setAttribute("id", 'vertical-bar')
        horizontalScrollBarDiv.setAttribute("style", "height: 20px; width: calc(100% - 80px); margin: 0px 40px; position: absolute; bottom: 0px; z-index: 35;")
        verticalScrollBarDiv.setAttribute("style", "height: calc(100% - 80px); width: 20px; margin: 40px 0px; position: absolute; right: 0px; z-index: 35;top:0;")

        this._divParentElement.appendChild(horizontalScrollBarDiv)
        this._divParentElement.appendChild(verticalScrollBarDiv)

        this._dualHRangeBar = new DualHRangeBar("horizontal-bar", {
            minimizes: true,
            size: 'default',
            lowerBound: 0,    // Initial value for "lowerBound"
            upperBound: 1,    // Initial value for "upperBound"
            minSpan: 0.02,     // Initial value for "minSpan"
            maxSpan: 1,       // Initial value for "maxSpan"
            lower: 0,         // Initial value for "lower"
            upper: 1,         // Initial value for "upper"
        })

        this._dualVRangeBar = new DualVRangeBar("vertical-bar", {
            minimizes: true,
            size: 'default',
            lowerBound: 0,    // Initial value for "lowerBound"
            upperBound: 1,    // Initial value for "upperBound"
            minSpan: 0.02,     // Initial value for "minSpan"
            maxSpan: 1,       // Initial value for "maxSpan"
            lower: 0,         // Initial value for "lower"
            upper: 1,         // Initial value for "upper"
        })

    }

    public initDecoratedRect() {
        this._multiSelectingRect = new GUIDecoratedRect(new BaseBufferRect(new Point(0, 0), 0, 0))
        this._multiSelectingLine = new GUIDecoratedLine(new BaseBufferLine(new Point(0, 0), new Point(0, 0)))
        this._multiSelectingTri = new GUIDecoratedTri(new BaseBufferTri(new Point(0, 0), 0))
        this._multiSelectingCircle = new GUIDecoratedCircle(new BaseBufferCircle(new Point(0, 0), 0))
        this._selectedElementsRect = new GUIDecoratedRect(new BaseBufferRect(new Point(0, 0), 0, 0))
        this.addGUIDecoratedElement(this._multiSelectingRect)
        this.addGUIDecoratedElement(this._multiSelectingTri)
        this.addGUIDecoratedElement(this._multiSelectingCircle)
        this.addGUIDecoratedElement(this._selectedElementsRect)
    }


}