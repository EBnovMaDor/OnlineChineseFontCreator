import type GUILine from "../gui-element/interface/GUILine";

export function instanceOfGUILine(object: any): object is GUILine {
    return object.discriminator === 'GUILine';
}
