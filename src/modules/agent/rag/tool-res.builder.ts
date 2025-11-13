import { IMessageContent } from "./rag-tool.schema";

export class ToolResponseBuilder {
    constructor(
        private readonly content: IMessageContent = []
    ) { }

    addTexts(...texts: string[]) {
        const payload = { type: 'text' }
        const textContents = texts.map(text => ({ ...payload, text }));
        this.content.push(...textContents);

        return this;
    }

    addImages(...images: string[]) {
        const payload = { type: 'image_url' };
        const imageContents = images.map(image => ({
            ...payload,
            image_url: {
                url: `data:image/jpeg;base64,${image}`
            }
        }));
        this.content.push(...imageContents);

        return this;
    }

    getContent() {
        return this.content;
    }
}