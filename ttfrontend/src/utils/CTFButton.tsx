import React from "react";


type buttonProps = {
    text:string

}

export default function CTFButton ({text}:buttonProps) {


    return(
        <button className="inline-block hover:cursor-pointer mx-auto max-w-xs px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase">
            {text}
        </button>
    )
}