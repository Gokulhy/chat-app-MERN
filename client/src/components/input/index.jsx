import React from "react";

const Input=({
    label='',
    name='',
    type='text',
    isrequired=false,
    inputclassname='',
    classname='',
    placeholder='',
    value='',
    lclass='',
    onchange=()=>{}
})=>{
    return(
        <div  className={`pt-8 text-right ${inputclassname}`}>
            <label className={`text-lg m-2 ${lclass}`}>{label}</label>
            <input name={name} type={type}  placeholder={placeholder} value={value} onChange={onchange} className={`border-2 bg-gray-700 placeholder-gray-300 text-white text-base border-zinc-950 p-2 pt-0.5 pb-0.5 rounded-md ${classname}`} required={isrequired}></input>
        </div>
    )
};
 
export default Input;