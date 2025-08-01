import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import { GenerativeAI } from "./interface_generative_ai";
import dotenv from 'dotenv';
dotenv.config();

export class Gemini implements GenerativeAI {
    static ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    static instructions: string = "Return pure json that contains a list of 5 random numbers between 1 and 100, in format: [1, 2, 3, 4, 5] and then a list of 5 random strings, also in an array, do not include any other text. This way I can parse your answer for my app. Do not include markdown information like ```json`. The strings returned need not be tided to the letteres specified.";

    getInstructions(): string {
        return Gemini.instructions;
    }

    async test(): Promise<string> {
        const response: GenerateContentResponse = await Gemini.ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `${this.getInstructions()}`,
        });
        console.log(response.text);
        // all responses invariably are in the format ```json{jsoncontent}``` so we have to extract the jsoncontent
        return response.text.replace("```json", "").replace("```", "").trim();

        /**
         * WARNING
         * Issue: Invalid JSON response potential
         * 
         * Issue in response to the instructions:
         * Return pure json that contains a list of 5 random numbers between 1 and 100, in format: [1, 2, 3, 4, 5] and then a list of 5 random strings, also in an array, do not include any other text. This way I can parse your answer for my app. Do not include markdown information like ```json`. The strings returned need not be tided to the letteres specified.
         * 
         * Response text is ALMOST always correctly formatted JSON.
         * Sometimes, however, it returns a string that is not valid JSON,
         * where it starts with '[ [', instead of '{ "key": [', like so:
         * 
         * [
         *   [ 12, 87, 3, 55, 91 ],
         *   [ "apple", "banana", "cherry", "date", "fig" ]
         * ]
         * 
         */
    }

}