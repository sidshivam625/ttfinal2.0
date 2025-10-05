import React from 'react';

// Using Tailwind CSS for styling instead of an embedded style tag.
// The layout is now a standard vertical scrolling page.

const ProtocolCard = () => {
    return (

        <div className="border bg-black/70 rounded-xl border-[#522546] w-full max-w-4xl">

            <div className=" text-white p-3 flex items-center justify-center gap-2 font-bold text-lg">
              
                <span className='font-press-start-2p'>// OPERATION_PROTOCOLS.md // </span>
            </div>
            <div className="p-8 space-y-6">
                <div>
                    <h3 className="text-[#f97316] mt-6 mb-2 border-b border-[#f97316] pb-1 tracking-wider text-2xl">
                        I. Point Acquisition Matrix
                    </h3>
                    <p className="text-[#d1d5db] leading-relaxed text-lg">
                        Points are allocated upon ingestion of a valid flag string. The value is static, calculated by target system difficulty:
                    </p>
                    <ul className="list-none mt-4 flex flex-col gap-3">
                        <li className="bg-[rgba(220,38,38,0.5)] border border-[#f73750] text-[#d1d5db] p-3 rounded-md flex items-center justify-between text-lg">
                            <span className="text-[#f97316] font-bold">Easy Systems:</span>
                            <span><span className="opacity-70 mx-1">▲</span>100<span className="opacity-70 mx-1">▲</span> PTS</span>
                        </li>
                        <li className="bg-[rgba(220,38,38,0.5)] border border-[#f73750] text-[#d1d5db] p-3 rounded-md flex items-center justify-between text-lg">
                           <span className="text-[#f97316] font-bold">Medium Systems:</span>
                           <span><span className="opacity-70 mx-1">▲</span>300<span className="opacity-70 mx-1">▲</span> PTS</span>
                        </li>
                        <li className="bg-[rgba(220,38,38,0.5)] border border-[#f73750] text-[#d1d5db] p-3 rounded-md flex items-center justify-between text-lg">
                           <span className="text-[#f97316] font-bold">Hard Systems:</span>
                           <span><span className="opacity-70 mx-1">▲</span>500<span className="opacity-70 mx-1">▲</span> PTS</span>
                        </li>
                        <li className="bg-[rgba(220,38,38,0.5)] border border-[#f73750] text-[#d1d5db] p-3 rounded-md flex items-center justify-between text-lg">
                            <span className="text-[#f97316] font-bold">Critical Systems:</span>
                            <span><span className="opacity-70 mx-1">▲</span>1000<span className="opacity-70 mx-1">▲</span> PTS</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-[#f97316] mt-6 mb-2 border-b border-[#f97316] pb-1 tracking-wider text-2xl">
                        II. Brute-Force Countermeasures
                    </h3>
                    <p className="text-[#d1d5db] leading-relaxed text-lg">
                        System integrity is paramount. Invalid flag sequences submitted against high-value targets will trigger defensive subroutines. This protocol is dormant for 'Easy' systems.
                    </p>
                    <ul className="list-none pl-4 mt-2 space-y-2 text-[#d1d5db] text-lg">
                        <li className="before:content-['>>'] before:text-[#f97316] before:pr-3">After <span className="text-[#f97316] font-bold">3 invalid submissions</span>, the final point allocation for that target is permanently <span className="text-[#f97316] font-bold">degraded by 10%</span>.</li>
                        <li className="before:content-['>>'] before:text-[#f97316] before:pr-3">This degradation is a <span className="text-[#f97316] font-bold">one-time event</span> per target. Further invalid submissions will be logged but will not decrease the value further.</li>
                    </ul>
                </div>

                <div>
                     <h3 className="text-[#f97316] mt-6 mb-2 border-b border-[#f97316] pb-1 tracking-wider text-2xl">III. Temporal Analytics & Standings</h3>
                     <p className="text-[#d1d5db] leading-relaxed text-lg">All operations are time-critical. Operator rank is determined by aggregate <span className="text-[#f97316] font-bold">total points</span>. In the event of a point-tie, the operator/cell that achieved the score with the <span className="text-[#f97316] font-bold">earliest final-flag timestamp</span> receives the superior rank.</p>
                </div>

                <div>
                    <h3 className="text-[#f97316] mt-6 mb-2 border-b border-[#f97316] pb-1 tracking-wider text-2xl">IV. Flag Ingestion & Validation</h3>
                    <p className="text-[#d1d5db] leading-relaxed text-lg">All flags are ASCII strings and must conform to the standard validation format. The validation parser is <span className="text-[#f97316] font-bold">case-insensitive</span>.</p>
                     <ul className="list-none pl-4 mt-2 space-y-2 text-[#d1d5db] text-lg">
                        <li className="before:content-['>>'] before:text-[#f97316] before:pr-3">Standard Format: <span className="font-bold text-[#06b6d4] bg-[#111827] px-2 py-0.5 rounded-md">ctf&#123;alpha_numeric_string_with_underscores&#125;</span></li>
                     </ul>
                </div>

                <div>
                     <h3 className="text-[#f97316] mt-6 mb-2 border-b border-[#f97316] pb-1 tracking-wider text-2xl">V. Intelligence Dissemination Protocol</h3>
                     <p className="text-[#d1d5db] leading-relaxed text-lg">Intelligence packets (hints) will be disseminated through two channels based on target difficulty:</p>
                     <ul className="list-none pl-4 mt-2 space-y-2 text-[#d1d5db] text-lg">
                        <li className="before:content-['>>'] before:text-[#f97316] before:pr-3">For <span className="text-[#f97316] font-bold">Hard & Critical Systems</span>: Intel will be embedded directly within the challenge briefing after a set time has elapsed. Monitor the target data for updates.</li>
                        <li className="before:content-['>>'] before:text-[#f97316] before:pr-3">For all other systems: Relevant intel and situational updates will be broadcast exclusively on the designated <span className="text-[#f97316] font-bold">Discord server</span>.</li>
                     </ul>
                </div>

                <div>
                    <h3 className="text-[#f97316] mt-6 mb-2 border-b border-[#f97316] pb-1 tracking-wider text-2xl">VI. Rules of Engagement (ROE)</h3>
                    <p className="text-[#f73750] font-bold">VIOLATION OF THE ROE IS A BREACH OF CONDUCT AND WILL RESULT IN IMMEDIATE TERMINATION OF YOUR NETWORK ACCESS.</p>
                    <ul className="list-none pl-4 mt-2 space-y-2 text-[#d1d5db] text-lg">
                        <li className="before:content-['>>'] before:text-[#f73750] before:pr-3"><span className="text-[#f73750] font-bold">DO NOT</span> target mission infrastructure. This includes the scoreboard, authentication servers, or any platform services. All necessary targets are provided within the challenge data packets.</li>
                        <li className="before:content-['>>'] before:text-[#f73750] before:pr-3"><span className="text-[#f73750] font-bold">DO NOT</span> engage in network warfare, DoS, or any activity that impedes other operators.</li>
                        <li className="before:content-['>>'] before:text-[#f73750] before:pr-3"><span className="text-[#f73750] font-bold">DO NOT</span> exfiltrate or share flags or exploit methodologies between cells.</li>
                        <li className="before:content-['>>'] before:text-[#f73750] before:pr-3">All operations must be confined to the designated <span className="text-[#f97316] font-bold">challenge IP ranges and scopes</span>. Any deviation is considered a hostile act.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};


const ProtocolsPage = () => {
    return (
        // Set a dark background and use the custom font for the whole page.
        // min-h-screen ensures the background covers the full height, and allows scrolling.
        <div className="bg-black/40 text-[#22c55e] font-vt323 min-h-screen">
            <header className="flex items-center justify-between p-4 border-b-2 border-[#f73750] bg-[rgba(0,0,0,0.8)] sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                    </div>
                    <h1 className="text-[#ad78a3] text-4xl font-bold tracking-[4px] border-2 border-[#804a73] bg-[rgba(82,37,70,0.3)] px-6 py-2 rounded-lg">
                        PROTOCOLS
                    </h1>
                </div>
            </header>
            <main className="p-4 sm:p-8 flex justify-center items-start">
                <ProtocolCard />
            </main>
        </div>
    );
};

export default ProtocolsPage;
