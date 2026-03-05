import type { ArtifactRecord } from "../../shared/types.ts";

export const renderRunArtifacts = (runId: string, artifacts?: ArtifactRecord) => {
    if (!artifacts) {
        return {
            type: "div",
            props: { className: "text-gray-500 italic text-sm" },
            children: ["No artifacts captured for this run."]
        };
    }

    const links = [];

    if (artifacts.screenshotPath) {
        const filename = artifacts.screenshotPath.split("/").pop() || "screenshot.png";
        links.push({
            label: "Screenshot",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "🖼️"
        });
    }

    if (artifacts.htmlPath) {
        const filename = artifacts.htmlPath.split("/").pop() || "page.html";
        links.push({
            label: "DOM Dump",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "📄"
        });
    }

    if (artifacts.tracePath) {
        const filename = artifacts.tracePath.split("/").pop() || "trace.zip";
        links.push({
            label: "Playwright Trace",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "🔍"
        });
    }

    if (artifacts.consoleLogsPath) {
        const filename = artifacts.consoleLogsPath.split("/").pop() || "console.json";
        links.push({
            label: "Console Logs",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "📝"
        });
    }

    if (artifacts.networkLogsPath) {
        const filename = artifacts.networkLogsPath.split("/").pop() || "network.json";
        links.push({
            label: "Network Logs",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "🌐"
        });
    }

    if (artifacts.metadataPath) {
        const filename = artifacts.metadataPath.split("/").pop() || "metadata.json";
        links.push({
            label: "Detector Metadata",
            url: `/api/runs/${runId}/artifacts/${filename}`,
            icon: "📊"
        });
    }

    return {
        type: "div",
        props: { className: "flex flex-col gap-2 mt-4" },
        children: [
            {
                type: "h3",
                props: { className: "text-lg font-medium text-gray-900" },
                children: ["Artifacts"]
            },
            {
                type: "div",
                props: { className: "flex flex-wrap gap-2" },
                children: links.map(link => ({
                    type: "a",
                    props: {
                        href: link.url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    },
                    children: [
                        {
                            type: "span",
                            props: { className: "mr-2" },
                            children: [link.icon]
                        },
                        link.label
                    ]
                }))
            }
        ]
    };
};
