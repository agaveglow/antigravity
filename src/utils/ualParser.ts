import { type ProjectBrief, type Task } from '../types/ual';

/**
 * Enhanced PDF Parser for UAL Project Briefs.
 * Specifically handles text with irregular spacing and line breaks.
 */
export const parseProjectBrief = (text: string): Partial<ProjectBrief> => {
    // 1. Clean up "spaced out" text (e.g., "P R O J E C T" -> "PROJECT")
    // and consolidate multiple spaces/newlines
    const cleanText = text
        .replace(/\b(\w)\s(?=\w\b)/g, '$1') // Rejoin single chars separated by spaces
        .replace(/\s+/g, ' '); // Consolidate all whitespace to single spaces

    const brief: Partial<ProjectBrief> = {
        tasks: [],
        learningOutcomes: [],
        assessmentCriteria: []
    };

    // Robust Date extractor for DD/MM/YY formats and Natural Language dates
    const extractDate = (str: string): string | undefined => {
        if (!str) return undefined;

        // 1. Check for standard DD/MM/YYYY or DD-MM-YY formats
        const numericMatch = str.match(/(\d\s*){1,2}[\/\-\.]\s*(\d\s*){1,2}[\/\-\.]\s*(\d\s*){2,4}/);
        if (numericMatch) {
            const cleanDate = numericMatch[0].replace(/\s+/g, '');
            let [day, month, year] = cleanDate.split(/[\/\-\.]/);
            if (year.length === 2) year = '20' + year;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // 2. Check for Natural Language dates: "12th January 2024", "Jan 1, 25", etc.
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const fullMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

        const nlMatch = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{2,4})/i);

        if (nlMatch) {
            const day = nlMatch[1];
            const monthStr = nlMatch[2].toLowerCase();
            let year = nlMatch[3];
            if (year.length === 2) year = '20' + year;

            let monthIdx = months.indexOf(monthStr.substring(0, 3));
            if (monthIdx === -1) monthIdx = fullMonths.indexOf(monthStr);

            if (monthIdx !== -1) {
                return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        return undefined;
    };

    // 2. Extract Metadata
    // Project Number / ID
    const projectNumMatch = cleanText.match(/(?:Project|P|Brief)\s*(\d+)/i);
    const pNum = projectNumMatch ? `Project ${projectNumMatch[1]}` : '';

    // Title: Look for "Project X – Name" or keywords followed by name
    let pName = '';
    console.log('Parsing Project Brief with text length:', text.length);
    const stopKeywords = '(?:Unit|Deadline|LO|Task|Introduction|Tutor|Staff|Assessor|IV|Internal Verifier|Course|Level|Date|UAL)';
    const titleRegexes = [
        // Match "Project 1 - Name" or "Project 1: Name" or "Project 1 Name"
        new RegExp(`(?:Project|Brief)\\s*\\d+\\s*[–\\-:\\s]+\\s*([^\\n]+?)(?=\\s*${stopKeywords}|$)`, 'i'),
        // Positional: Everything after "Level X" and before "Year Y"
        new RegExp(`Level\\s*\\d+\\s+([^\\n]+?)(?=\\s*Year\\s*\\d+|$)`, 'i'),
        // Positional: Everything after "Year X" and before next major stop keyword
        new RegExp(`Year\\s*\\d+\\s+([^\\n]+?)(?=\\s*(?:Unit|Deadline|LO|Task|Introduction|Tutor|Staff|Assessor))`, 'i'),
        // Match "Title: Name"
        new RegExp(`Title\\s*[:\\-]+([^\\n]+?)(?=\\s*${stopKeywords}|$)`, 'i')
    ];

    for (const regex of titleRegexes) {
        console.log('Testing Regex:', regex);
        const match = cleanText.match(regex);
        if (match && match[1]) {
            pName = match[1].trim();
            // Final cleanup: strip common trailing categories and awarding bodies if they leaked in
            pName = pName.split(/\s*(?:Tutor|Staff|Assessor|IV|Internal Verifier|Course|Level|UAL)\s*[:\s-]/i)[0].trim();
            // If the name ends with "UAL", strip it too (common in UAL briefs)
            pName = pName.replace(/\s+UAL$/i, '').trim();
            break;
        }
    }

    if (pNum && pName) {
        brief.title = `${pNum}: ${pName}`;
    } else {
        brief.title = pName || pNum || "Imported Project";
    }

    if (pNum) brief.projectNumber = pNum;

    // Units: "Units covered: Unit 1... Unit 3..."
    const allUnitMentions = cleanText.match(/Unit\s*\d+/gi);
    if (allUnitMentions) {
        const uniqueUnits = [...new Set(allUnitMentions.map(m => m.trim()))];
        brief.unit = uniqueUnits.join(', ');
    }

    // Overall Deadline
    const deadlineKeywords = ['Due Date', 'Project Deadline', 'Final Deadline', 'Submission Deadline', 'Submission Date', 'Hand-in Date'];
    for (const kw of deadlineKeywords) {
        const kwRegex = new RegExp(`${kw}\\s*[:\\s-]+(.*?)(?=\\s*(?:Task|Evidence|Criteria|Unit|Introduction|LO))`, 'i');
        const match = cleanText.match(kwRegex);
        if (match) {
            const date = extractDate(match[1]);
            if (date) {
                brief.deadline = date;
                break;
            }
        }
    }

    if (!brief.deadline) {
        // Fallback: look for any date in the first 500 characters
        const startText = cleanText.substring(0, 500);
        brief.deadline = extractDate(startText);
    }

    // 3. Extract Tasks
    // Use a global match to find all tasks, then parse each segment
    const taskSegments = cleanText.split(/Task\s*(\d+)\s*[:\s-]+/i);
    // [0] is header, [1] is digit, [2] is content, [3] is digit...
    for (let i = 1; i < taskSegments.length; i += 2) {
        const taskNum = taskSegments[i];
        let content = taskSegments[i + 1] || '';

        // Clean up content: remove trailing "Task X+1" or other section headers if they bled in
        content = content.split(/Task\s*\d+/i)[0].trim();

        // Refine Description: Strip Evidence, Milestone, and specific metadata headers
        let rawDescription = content
            .split(/(?:Evidence\s*[:\s\-]+|Milestone\s*Deadline\s*[:\s\-]+|Criteria\s*[:\s\-]+|Assessment\s*Criteria\s*[:\s\-]+)/i)[0]
            .trim();

        // Aggressively strip LOs, Units, and any numerical criteria/sequences from description
        let description = rawDescription
            .replace(/(?:LO|Outcome|Assessment Criteria|AC|Criteria|Unit)\s*(\d+\.?\d*(?:\s*,\s*\d+\.?\d*)*)/gi, '')
            .replace(/\b\d+\.?\d*(?:\s*,\s*\d+\.?\d*)+\b/g, '') // Strip stray "1.1, 1.2" sequences
            .replace(/\(\s*\)/g, '') // Remove empty parentheses
            .replace(/\[\s*\]/g, '') // Remove empty brackets
            .replace(/\s+/g, ' ')
            .trim();

        const task: Task = {
            id: crypto.randomUUID(),
            title: `Task ${taskNum}`,
            description: description,
            evidenceRequirements: [],
            criteriaReferences: [],
            status: 'Not Started',
            xpReward: 100,
            deadline: extractDate(content) || brief.deadline
        };

        // Extract criteria references - Paired Unit and LO as requested
        const pairings: string[] = [];
        const unitSegments = content.split(/(?=Unit\s*\d+)/gi);

        unitSegments.forEach(segment => {
            const unitMatch = segment.match(/Unit\s*(\d+)/i);
            // Match "LO" prefix followed by one or more number sequences separated by commas
            const loMatches = segment.match(/(?:LO|Learning Outcome)\s*(\d+\.?\d*(?:\s*,\s*\d+\.?\d*)*)/gi);

            if (unitMatch) {
                const unitStr = unitMatch[0].trim();
                const loList: string[] = [];

                if (loMatches) {
                    loMatches.forEach(match => {
                        // Extract just the numbers part and split by comma
                        const numbersOnly = match.replace(/(?:LO|Learning Outcome)\s*/i, '');
                        const individualLOs = numbersOnly.split(',').map(n => n.trim()).filter(Boolean);
                        individualLOs.forEach(num => loList.push(`LO ${num}`));
                    });
                }

                if (loList.length > 0) {
                    pairings.push(`${unitStr}: ${[...new Set(loList)].join(', ')}`);
                } else if (segment.trim().startsWith(unitStr)) {
                    // Orphan Units
                    pairings.push(unitStr);
                }
            } else if (loMatches) {
                // Orphan LOs
                loMatches.forEach(match => {
                    const numbersOnly = match.replace(/(?:LO|Learning Outcome)\s*/i, '');
                    const individualLOs = numbersOnly.split(',').map(n => n.trim()).filter(Boolean);
                    individualLOs.forEach(num => pairings.push(`LO ${num}`));
                });
            }
        });

        if (pairings.length > 0) {
            task.criteriaReferences = [...new Set(pairings)];
        }

        brief.tasks?.push(task);
    }

    // Fallbacks
    if (!brief.title) brief.title = "Imported Project";
    if (!brief.unit) brief.unit = "Music Performance & Production";

    return brief;
};
