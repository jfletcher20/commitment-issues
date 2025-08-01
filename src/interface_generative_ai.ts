export interface GenerativeAI {
    test(): Promise<string>;
    getInstructions(): string;
}