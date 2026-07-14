import { tool } from '@langchain/core/tools';
import { z } from 'zod';


export interface BMIData {
    bmi: number,
    category: string,
    colorClass: "blue" | "green" | "yellow" | "red";
    weight_kg: number,
    height_cm: number,
    tips: string[],
    healthyRange: string
}

const bmiSchema = z.object({
    weight_kg: z.number().describe("the patient's weight in kilograms (kg)."),
    height_cm: z.number().describe("the patient's height in centimeters (cm).")
});


export const bmiCalculatorTool = tool(async ({ weight_kg, height_cm }): Promise<string> => {
    const heightM = height_cm / 100;
    const bmi = Math.round((weight_kg / (heightM * heightM)) * 10) / 10;

    let category: string;
    let colorClass: BMIData['colorClass'];
    let tips: string[]

    if (bmi < 18.5) {
        category = "Underweight";
        colorClass = "blue";
        tips = [
            "Consider a calorie-dense, nutrient-rich diet",
            "Include protein sources: eggs, legumes, dairy",
            "Consult a dietitian for a personalized meal plan",
        ];
    } else if (bmi < 25) {
        category = "Normal weight";
        colorClass = "green";
        tips = [
            "Maintain your current healthy lifestyle",
            "Regular aerobic exercise (150 min/week)",
            "Continue balanced nutrition and hydration",
        ];
    } else if (bmi < 30) {
        category = "Overweight";
        colorClass = "yellow";
        tips = [
            "Aim to reduce caloric intake by 300–500 kcal/day",
            "Increase physical activity gradually",
            "Focus on whole foods and reduce processed sugar",
        ];
    } else {
        category = "Obese";
        colorClass = "red";
        tips = [
            "Consult a physician before starting any weight-loss program",
            "Structured diet and exercise plan recommended",
            "Monitor for related conditions: diabetes, hypertension"
        ]
    }

    const result: BMIData = {
        bmi,
        category,
        colorClass,
        weight_kg,
        height_cm,
        tips,
        healthyRange: "18.5 – 24.9",
    }


    return JSON.stringify(result);

}, {
    name: "bmi_calculator",
    description: "calculates the patient's Body Mass Index (BMI) given a patient's weight in kg and height in cm." +
        "use this whenever the user asks to calculate BMI or wants to know their weight status .",
    schema: bmiSchema
})