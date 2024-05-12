import Renderer from "../core/Renderer";
import GlobalManager from "../GlobalManager";
import FontCreatorEvent from "./FontCreatorEvent";
import { FontCreatorEventType } from "./FontCreatorEventType";

export default class RefreshSEBBoxEvent extends FontCreatorEvent {


    constructor(event: Event) {
        super(FontCreatorEventType.RefreshSEBBoxEvent, event)

    }

    handle() {
        let { gui } = GlobalManager.instance
        if (gui.selectedElements.size > 1) {
            let BBox = gui.getSelectedElementsBBox()
            gui.selectedElementsRect!.baseBufferElement.leftTop.x = BBox.x1
            gui.selectedElementsRect!.baseBufferElement.leftTop.y = BBox.y1
            gui.selectedElementsRect!.baseBufferElement.width = BBox.x2 - BBox.x1
            gui.selectedElementsRect!.baseBufferElement.height = BBox.y2 - BBox.y1
        } else {
            gui.selectedElementsRect!.baseBufferElement.width = 0
            gui.selectedElementsRect!.baseBufferElement.height = 0
        }

    }

}