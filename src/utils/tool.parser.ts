import { DocumentInterface } from "@langchain/core/documents";
import { CVDetail } from "src/modules/database/mongodb/schemas/cv-detail.schema";
import { CVResult } from "src/modules/database/mongodb/schemas/cv-result.schema";
import { JobDescription } from "src/modules/database/mongodb/schemas/job-description.schema";

export function searchVectorStoreParser(
    results?: DocumentInterface<Record<string, any>>[]
): string {
    if (!results || !results?.length) {
        return "No relevant documents found.";
    }
    return results
        .map((doc, index) => {
            const metadata = Object.keys(doc.metadata)
                .map((key) => `${key}: ${doc.metadata[key]}`)
                .join(", ");
            return `Document ${index + 1}:\nContent: ${doc.pageContent}\nMetadata: {${metadata}}\n`;
        })
        .join("\n--------------\n");
}

export function getListJobParser(
    results?: Partial<JobDescription>[]
): string {
    if (!results || !results?.length) {
        return "No job descriptions found.";
    }
    return results
        .map(
            (job, index) =>
                `Job ${index + 1}:\nID: ${job._id}\nTitle: ${job.title}\nDescription: ${job.description ? job.description.substring(0, 150) + "..." : "N/A"}\n`
        )
        .join("\n---\n");
}

export function getJobParser(result: JobDescription | null): string {
    if (!result) {
        return "Job description not found.";
    }
    return `Job ID: ${result._id}\nTitle: ${result.title}\nDescription: ${result.description}\nRequirements: ${result.requirements ? result.requirements.join(", ") : "N/A"}\nCreated At: ${result.created_at}\nUpdated At: ${result.updated_at}\n`;
}

export function getCvResultsParser(
    results: Partial<CVResult>[]
): string {
    if (!results || results.length === 0) {
        return "No CV results found.";
    }
    return results
        .map(
            (cvResult, index) =>
                `CV Result ${index + 1}:\nID: ${cvResult._id}\nStatus: ${cvResult.status}\nCandidate Name: ${cvResult.CV?.cv_filename}`
        )
        .join("\n---\n");
}

export function getCvResultParser(result?: CVResult): string {
    if (!result) {
        return "CV result not found.";
    }
    return `CV Result ID: ${result._id}\nStatus: ${result.status}\nCV Match Rate: ${result.cv_match_rate || "N/A"}\nCV Feedback: ${result.cv_feedback || "N/A"}\nProject Score: ${result.project_score || "N/A"}\nProject Feedback: ${result.project_feedback || "N/A"}\nOverall Score: ${result.overall_score || "N/A"}\nOverall Summary: ${result.overall_summary || "N/A"}\nJob Title: ${result.jobDescription?.title || "N/A"}\nCV Filename: ${result.CV?.cv_filename || "N/A"}\nCreated At: ${result.created_at}\nUpdated At: ${result.updated_at}\n`;
}

export function getCvDetailParser(result?: CVDetail): string {
    if (!result) return "CV details not found";

    return `page ${result.page}: \n\tdata:image/jpeg;base64,${result.base64_image}`;
}
