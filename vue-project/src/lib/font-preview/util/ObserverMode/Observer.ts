export default interface Observer {
    update(guiElementId: number, isSelected: boolean): void
}