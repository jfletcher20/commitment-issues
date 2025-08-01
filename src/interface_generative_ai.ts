export interface GenerativeAI {
    test(): Promise<string>;
    getContents(): string;
}