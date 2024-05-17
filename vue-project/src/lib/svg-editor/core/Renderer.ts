import Konva from "konva";
import type BaseBufferElement from "../base-buffer-element/interface/BaseBufferElement";
import GlobalManager from "../GlobalManager";
import type GUIBaseElement from "../gui-element/interface/GUIBaseElement";
import type GUIDecoratedElement from "../gui-element/interface/GUIDecoratedElement";
import type GUIElement from "../gui-element/interface/GUIElement";

export default class Renderer {

    public static renderCanvas() {
        Renderer._renderGUIBaseElements(GlobalManager.instance.gui!.guiBaseElements)
        Renderer._renderGUIDecoratedElements(GlobalManager.instance.gui!.guiDecoratedElements)
        Renderer._renderGUIPreviewElements(GlobalManager.instance.gui!.guiPreviewElements)
        Renderer._renderGrid()
    }

    public static renderGrid() {
        let { gui, baseBuffer, viewPort } = GlobalManager.instance
        /** render range bar */
        gui.dualHRangeBar!.lower = (viewPort.x - baseBuffer.minX) / baseBuffer.bufferWidth
        gui.dualHRangeBar!.upper = (viewPort.x - baseBuffer.minX + viewPort.width) / baseBuffer.bufferWidth
        gui.dualVRangeBar!.lower = (viewPort.y - baseBuffer.minY) / baseBuffer.bufferHeight
        gui.dualVRangeBar!.upper = (viewPort.y - baseBuffer.minY + viewPort.height) / baseBuffer.bufferHeight

    }

    private static _renderGrid() {
        let { gui, viewPort, baseBuffer } = GlobalManager.instance
        let minPos = viewPort.normalCoordinateToBufferCoordinate(0, 0);
        let maxPos = viewPort.normalCoordinateToBufferCoordinate(1, 1);
        let minimalRenderX = Math.floor(minPos.bufferX)
        let minimalRenderY = Math.floor(minPos.bufferY)
        let maximalRenderX = Math.floor(maxPos.bufferX)
        let maximalRenderY = Math.floor(maxPos.bufferY)
        if ((maximalRenderX - minimalRenderX) < 100) {
            let points = []
            let j = 0
            for (let i = minimalRenderX; i <= maximalRenderX; i++) {
                let normalPoints1 = viewPort.bufferCoordinateToNormalCoordinate(i, minimalRenderY - 1)
                let normalPoints2 = viewPort.bufferCoordinateToNormalCoordinate(i, maximalRenderY + 1)
                let renderPoints1 = gui.normalCoordinateToCanvasCoordinate(normalPoints1.normalX, normalPoints1.normalY)
                let renderPoints2 = gui.normalCoordinateToCanvasCoordinate(normalPoints2.normalX, normalPoints2.normalY)
                if (j % 2 == 1) {
                    points.push(renderPoints1.canvasX)
                    points.push(renderPoints1.canvasY)
                    points.push(renderPoints2.canvasX)
                    points.push(renderPoints2.canvasY)
                } else {
                    points.push(renderPoints2.canvasX)
                    points.push(renderPoints2.canvasY)
                    points.push(renderPoints1.canvasX)
                    points.push(renderPoints1.canvasY)
                }
                j++
            }
            if (!baseBuffer.verticalGrid) {
                let opacity = (50 - (maximalRenderX - minimalRenderX)) / 10
                opacity = opacity > 1 ? 1 : opacity
                let verticalGrid = new Konva.Line({
                    points: points,
                    stroke: 'black',
                    strokeWidth: 0.3,
                    lineJoin: 'round',
                    opacity: opacity
                });
                gui.mainLayer.add(verticalGrid);
                verticalGrid.alpha(0.1)
                verticalGrid.zIndex(0);
                baseBuffer.verticalGrid = verticalGrid
            } else {
                let opacity = (100 - (maximalRenderX - minimalRenderX)) / 10
                opacity = opacity > 1 ? 1 : opacity
                baseBuffer.verticalGrid.points(points)
                baseBuffer.verticalGrid.opacity(opacity)
            }

            points = []
            j = 0
            for (let i = minimalRenderY; i <= maximalRenderY; i++) {
                let normalPoints1 = viewPort.bufferCoordinateToNormalCoordinate(minimalRenderX - 1, i)
                let normalPoints2 = viewPort.bufferCoordinateToNormalCoordinate(maximalRenderX + 1, i)
                let renderPoints1 = gui.normalCoordinateToCanvasCoordinate(normalPoints1.normalX, normalPoints1.normalY)
                let renderPoints2 = gui.normalCoordinateToCanvasCoordinate(normalPoints2.normalX, normalPoints2.normalY)
                if (j % 2 == 1) {
                    points.push(renderPoints1.canvasX)
                    points.push(renderPoints1.canvasY)
                    points.push(renderPoints2.canvasX)
                    points.push(renderPoints2.canvasY)
                } else {
                    points.push(renderPoints2.canvasX)
                    points.push(renderPoints2.canvasY)
                    points.push(renderPoints1.canvasX)
                    points.push(renderPoints1.canvasY)
                }
                j++
            }
            if (!baseBuffer.horizontalGrid) {
                let horizontalGrid = new Konva.Line({
                    points: points,
                    stroke: 'black',
                    strokeWidth: 0.3,
                    lineJoin: 'round'
                });
                gui.mainLayer.add(horizontalGrid);
                horizontalGrid.alpha(0.1)
                horizontalGrid.zIndex(0);
                baseBuffer.horizontalGrid = horizontalGrid
            } else {
                let opacity = (100 - (maximalRenderX - minimalRenderX)) / 10
                opacity = opacity > 1 ? 1 : opacity
                baseBuffer.horizontalGrid.points(points)
                baseBuffer.horizontalGrid.opacity(opacity)
            }
        } else {
            if (baseBuffer.verticalGrid) {
                baseBuffer.verticalGrid.destroy()
                baseBuffer.verticalGrid = null
            }
            if (baseBuffer.horizontalGrid) {
                baseBuffer.horizontalGrid.destroy()
                baseBuffer.horizontalGrid = null
            }

        }

    }

    private static _renderGUIBaseElements(elements: Map<string | number, GUIBaseElement>) {
        for (let element of elements.values()) {
            if (element.baseBufferElement) element.baseBufferElement.draw()
            if (element.virtualBufferElement) element.virtualBufferElement.draw()
        }
    }

    private static _renderGUIDecoratedElements(elements: Map<string | number, GUIDecoratedElement>) {
        for (let element of elements.values()) {
            if (element.baseBufferElement) element.baseBufferElement.draw()
        }
    }

    private static _renderGUIPreviewElements(elements: Map<string | number, GUIElement>) {
        for (let element of elements.values()) {
            if (element.isVisible) {
                if (element.baseBufferElement) element.baseBufferElement.draw()
            }
        }
    }

}