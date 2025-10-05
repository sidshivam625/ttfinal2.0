import { Loader2 } from "lucide-react";
import React from "react";



export function Loader() {
    return (
        <Loader2 size={48} className="animate-spin text-[#b72d43] mx-auto" />
    );
}