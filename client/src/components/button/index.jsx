import React from "react";

const  Button=(
    {
        label='',
        classname='',
        type='button',
        isdisabled=false
    }
)=>{
    return(
        <button type={type} disabled={isdisabled} className="bg-secondary text-white transition-all hover:bg-[#6f52f3] rounded-xl mt-8 p-2 pl-8 pr-8">{label}</button>
    )
}

export default Button;