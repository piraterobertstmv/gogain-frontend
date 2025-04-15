import "./ButtonsRadio.css"

export function ButtonsRadio({ buttonsName, onChangeFunction, selectedButton }: { buttonsName: any, onChangeFunction: any, selectedButton: any }) {
    return (
    <div 
        className="btn-group" 
        role="group" 
        aria-label="Basic radio toggle button group"
        onChange={(e: any) => {onChangeFunction(Number(e.target.id.replace("btnradio", "")))}}
    >
        {buttonsName.map((buttonName: String, index: number) => (
            <div key={index.toString()} className="p-2">
                <input 
                    type="radio"
                    className="btn-check"
                    name="btnradio"
                    id={`btnradio${index}`}
                    autoComplete="off"
                    defaultChecked={index === 0}
                />
                {selectedButton == index ? 
                (
                    <label 
                        className="btn"
                        htmlFor={`btnradio${index}`}
                        style={{ backgroundColor: "#FFEEE7", border: "solid 1.11px #D95213", fontWeight: "normal", color: "#D95213", marginBottom: "0px" }}
                    >
                        {buttonName.endsWith("s")? buttonName.toUpperCase() : buttonName.toUpperCase() + "S"}
                    </label>      
                ) : (
                    <label 
                        className="btn"
                        htmlFor={`btnradio${index}`}
                        style={{ backgroundColor: "#F2F2F2", border: "solid 0.56px #736A65", fontWeight: "lighter", color: "#706762", marginBottom: "0px" }}
                    >
                        {buttonName.endsWith("s")? buttonName.toUpperCase() : buttonName.toUpperCase() + "S"}
                    </label>
                )}
            </div>
        ))}
    </div>
    )
}