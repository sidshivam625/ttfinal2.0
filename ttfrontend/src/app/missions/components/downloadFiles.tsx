import React from 'react';
import { Download } from 'lucide-react';

export default function IntelFiles({ links }: { links?: string }) {
    // If links prop is missing, empty, or just whitespace, show the "no files" state.
    if (!links || links.trim() === "") {
        return (
            <div 
                className="rounded-xl border-2 p-5 sm:p-6 shadow-[0_0_4px_rgba(0,0,0,0.2)] bg-[#0d0d0d]" 
                style={{ borderColor: "#522546" }}
            >
                <h1 
                    className="font-vt323 text-base tracking-[0.4em] uppercase mb-4" 
                    style={{ color: "#fa4d50ff", textShadow: "0 0 8px rgba(255, 100, 103, 0.8)" }}
                >
                    INTEL.FILES
                </h1>
                <p className="font-mono text-sm text-gray-500">No downloadable intel for this target.</p>
            </div>
        )
    }

    // Parse the links string, which might contain multiple URLs separated by commas.
    const urlList = links.split(',').map(link => link.trim());

    // Helper function to extract a readable filename from a URL.
    const getFileName = (url: string) => {
        try {
            // Use the URL constructor to safely parse the URL
            return new URL(url).pathname.split('/').pop() || "download";
        } catch {
            // Fallback for invalid URLs
            return "invalid_link";
        }
    }

    return (
        <div 
            className="rounded-xl border-2 p-5 sm:p-6 shadow-[0_0_4px_rgba(0,0,0,0.2)] flex flex-col gap-3 bg-[#0d0d0d]" 
            style={{ borderColor: "#FF6467" }}
        >
            <h1 
                className="font-vt323 text-base tracking-[0.4em] uppercase" 
                style={{ color: "#fa4d50ff", textShadow: "0 0 8px rgba(255, 100, 103, 0.8)" }}
            >
                INTEL.FILES
            </h1>
            {urlList.map((url, index) => (
                <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 bg-[#522546]/50 border border-[#89304E] rounded-md text-gray-300 hover:bg-[#89304E] hover:text-white transition-colors group"
                >
                    <span className="font-mono text-sm truncate">{getFileName(url)}</span>
                    <Download size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                </a>
            ))}
        </div>
    )
}
