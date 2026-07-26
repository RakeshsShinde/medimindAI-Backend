import { SECTION_CODES } from "../../types";
import { tool } from "@langchain/core/tools";
import z from "zod";

const DAILYMED_BASE = "https://dailymed.nlm.nih.gov/dailymed/services/v2";

// ── Main DailyMed fetch ───────────────────────────────────────────────────────
export async function fetchDailyMedData(drug_name: string) {
    const searchUrl = `${DAILYMED_BASE}/spls.json?drug_name=${encodeURIComponent(drug_name)}&pagesize=1`;
    const searchRes = await fetch(searchUrl, {
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!searchRes.ok) {
        throw new Error("DailyMed search request failed");
    }

    const searchContentType = searchRes.headers.get("content-type");
    if (!searchContentType || !searchContentType.includes("application/json")) {
        throw new Error("Invalid response from DailyMed API");
    }

    const searchData = await searchRes.json();
    const results = searchData.data ?? [];

    if (results.length === 0) {
        return {
            success: true,
            data: {
                name: drug_name,
                setId: "",
                labeler: "",
                indications: "No FDA label found for this medication.",
                dosageAndAdmin: "Not available",
                warnings: "Not available",
                contraindications: "Not available",
                adverseReactions: "Not available",
                drugInteractions: "Not available",
                labelUrl: "",
                notFound: true,
            }
        };
    }


    const setId = results[0].setid;
    const title = results[0].title ?? drug_name;

    const labelUrl = `${DAILYMED_BASE}/spls/${setId}.xml`;
    const labelRes = await fetch(labelUrl);
    if (!labelRes.ok) {
        throw new Error("DailyMed label details fetch failed");
    }

    const xmlText = await labelRes.text();

    let labeler = "";
    const authorIdx = xmlText.indexOf('<representedOrganization>');
    if (authorIdx !== -1) {
        const nameStart = xmlText.indexOf('<name>', authorIdx);
        const nameEnd = xmlText.indexOf('</name>', nameStart);
        if (nameStart !== -1 && nameEnd !== -1) {
            labeler = xmlText.substring(nameStart + 6, nameEnd).replace(/<[^>]+>/g, '').trim();
        }
    }

    const extracted: Record<string, string> = {};
    for (const [code, fieldKey] of Object.entries(SECTION_CODES)) {
        const idx = xmlText.indexOf(`code="${code}"`);
        if (idx !== -1) {
            const textStart = xmlText.indexOf('<text>', idx);
            const textEnd = xmlText.indexOf('</text>', textStart);
            if (textStart !== -1 && textEnd !== -1) {
                const rawText = xmlText.substring(textStart + 6, textEnd);
                const cleanText = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText) {
                    extracted[fieldKey] = cleanText.slice(0, 1500);
                }
            }
        }
    }

    // Extract generic name / active ingredient from title or XML tags
    let genericName = "";
    let activeIngredient = extracted.activeIngredient || "";

    // Try XML tags for active moiety or generic medicine name
    const activeMoietyMatch = xmlText.match(/<(?:activeMoiety|activeIngredient|genericMedicine)>[\s\S]*?<name>(.*?)<\/name>/i);
    if (activeMoietyMatch && activeMoietyMatch[1]) {
        activeIngredient = activeMoietyMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Try extracting from title e.g. "TYLENOL EXTRA STRENGTH (acetaminophen)" or "TYLENOL - acetaminophen"
    const parenMatch = title.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
        genericName = parenMatch[1].trim();
    } else if (title.includes(" - ")) {
        const parts = title.split(" - ");
        if (parts.length > 1) {
            genericName = parts[1].replace(/\b(?:tablet|capsule|liquid|solution|elixir|suspension|oral|topical)\b/gi, '').trim();
        }
    }

    if (!genericName && activeIngredient) {
        genericName = activeIngredient;
    }
    if (!activeIngredient && genericName) {
        activeIngredient = genericName;
    }

    const data = {
        name: title,
        genericName: genericName || "Not explicitly specified",
        activeIngredient: activeIngredient || "Not explicitly specified",
        setId,
        labeler,
        indications: extracted.indications || "Information not specified in standard SPL section.",
        dosageAndAdmin: extracted.dosageAndAdmin || "Information not specified in standard SPL section.",
        warnings: extracted.warnings || "Information not specified in standard SPL section.",
        contraindications: extracted.contraindications || "Information not specified in standard SPL section.",
        adverseReactions: extracted.adverseReactions || "Information not specified in standard SPL section.",
        drugInteractions: extracted.drugInteractions || "Information not specified in standard SPL section.",
        labelUrl: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`,
    };

    return data;
}

export const medicineLookupTool = tool(async ({ drug_name }): Promise<string> => {
    const data = await fetchDailyMedData(drug_name);

    return JSON.stringify(data);
}, {
    name: "medicine_lookup",
    description: "Looks up FDA-approved official drug details (indications, dosage, warnings, side effects, contraindications) for a single drug using DailyMed.",
    schema: z.object({
        drug_name: z.string().describe("Name of the drug to lookup"),
    }),
});
