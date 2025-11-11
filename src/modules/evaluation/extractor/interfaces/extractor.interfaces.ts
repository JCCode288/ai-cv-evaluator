export interface IExtractParam {
  mimeType: string;
  base64File: string;
}

export interface IExtractedPage {
  pageNumber: number;
  texts: string[];
  image: string | null; // array of base64 encoded images
}

export interface IExtractedDocument {
  fullText: string;
  pages: IExtractedPage[];
}
