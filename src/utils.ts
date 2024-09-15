import { anyObject } from "./main";
/**将任何长度单位或 css 变量转换为像素值*/
const getPx_test = document.createElement("div"), originStyle = "position:absolute;top:-12914rem;left:-12914rem;";
getPx_test.setAttribute("style", originStyle);
export function mountGetPx(){
    document.body.appendChild(getPx_test);
}
export function getPx(unitValue :string) :number{
    getPx_test.setAttribute("style", originStyle + `height:${unitValue}`);
    const result = parseFloat(getComputedStyle(getPx_test).height);
    getPx_test.setAttribute("style", originStyle);
    return result;
}