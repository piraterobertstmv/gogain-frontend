import './LeftButtonsRadio.css'

export function LeftButtonsRadio({ isUserAdmin, buttonsName, idButtonsName, setIdButtonsLeft, setUser }: { isUserAdmin:any, buttonsName: any, idButtonsName: number, setIdButtonsLeft: any, setUser: any }) {
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser({})
    };
    
    return (
    <div 
        className="p-4" 
        role="group"
        aria-label="Basic radio toggle button group"
        style={{ backgroundColor: "#FFFFFF", flexDirection: "column", display: "flex", justifyContent: "space-between", height: "90vh" }}
    >
        <div>
        {buttonsName.map((buttonName: String, index: number) => (
            <div key={index.toString()} onClick={() => setIdButtonsLeft(index)} className="p-2">
                <input 
                    type="radio"
                    className="btn-check"
                    name="btnradioLeft"
                    id={`btnradioLeft${index}`}
                    autoComplete="off"
                    defaultChecked={index === 1}
                />
                <label 
                    className="btn"
                    htmlFor={`btnradioLeft${index}`}
                    style={index === idButtonsName ? { backgroundColor: "#FFDAC9", color: "#D95213", border: "none", display: "inlineFlex", whiteSpace: "nowrap", fontWeight: "600" } : { backgroundColor: "transparent", color: "#736A65", border: "none", display: "inlineFlex", whiteSpace: "nowrap", fontWeight: "600" }}
                >
                    <svg width="24" height="24" className="p-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {(index === 0) && (
                            <path stroke={index === idButtonsName ? "#D95213" : "#736A65"} d="M3.60002 15.6L7.44978 12.0001L10.1996 14.5715L16.2492 8.91441M12.1334 8.40002H16.8V12.7638M4.80002 21.6C3.47454 21.6 2.40002 20.5255 2.40002 19.2V4.80002C2.40002 3.47454 3.47454 2.40002 4.80002 2.40002H19.2C20.5255 2.40002 21.6 3.47454 21.6 4.80002V19.2C21.6 20.5255 20.5255 21.6 19.2 21.6H4.80002Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {(index === 1) && (
                            <path stroke={index === idButtonsName ? "#D95213" : "#736A65"} d="M4.80001 5.8H13.2M4.80001 10.6H13.2M2.76001 1H15.24C16.1016 1 16.8 1.80589 16.8 2.8V19L14.2 17.2L11.6 19L9.00001 17.2L6.40001 19L3.80001 17.2L1.20001 19V2.8C1.20001 1.80589 1.89845 1 2.76001 1Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {(index === 2) && (
                            <path stroke={index === idButtonsName ? "#D95213" : "#736A65"} d="M1.40002 14.2168C2.49867 12.3843 4.90654 11.1301 8.66314 11.1301C12.4197 11.1301 14.8276 12.3843 15.9263 14.2168M16.6213 9.74056C18.6106 10.7352 19.6053 11.7299 20.6 13.7193M14.5522 2.1376C15.4883 2.64115 16.1246 3.62991 16.1246 4.7673C16.1246 5.87183 15.5246 6.8362 14.6326 7.35216M11.6472 4.76727C11.6472 6.41533 10.3112 7.75134 8.66314 7.75134C7.01509 7.75134 5.67907 6.41533 5.67907 4.76727C5.67907 3.11922 7.01509 1.7832 8.66314 1.7832C10.3112 1.7832 11.6472 3.11922 11.6472 4.76727Z" strokeWidth="2" strokeLinecap="round"/>
                        )}
                        {(index === 3) && (
                            <path stroke={index === idButtonsName ? "#D95213" : "#736A65"} d="M11 2H4C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H16C16.5304 22 17.0391 21.7893 17.4142 21.4142C17.7893 21.0391 18 20.5304 18 20V9M11 2L18 9M11 2V9H18"  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {(index === 4) && (
                            <>
                            <path stroke={index === idButtonsName ? "#D95213" : "#736A65"} fillRule="evenodd" clipRule="evenodd" d="M11.6763 2.31627C11.2488 0.561243 8.75121 0.561243 8.3237 2.31627C8.25987 2.57999 8.13468 2.82492 7.95831 3.03112C7.78194 3.23732 7.55938 3.39897 7.30874 3.50291C7.0581 3.60684 6.78646 3.65014 6.51592 3.62927C6.24538 3.60839 5.9836 3.52394 5.75187 3.38279C4.20832 2.44227 2.44201 4.20855 3.38254 5.75207C3.99006 6.74884 3.45117 8.04936 2.31713 8.32499C0.560955 8.75137 0.560955 11.25 2.31713 11.6753C2.58093 11.7392 2.8259 11.8645 3.03211 12.041C3.23831 12.2175 3.39991 12.4402 3.50375 12.691C3.6076 12.9418 3.65074 13.2135 3.62968 13.4841C3.60862 13.7547 3.52394 14.0165 3.38254 14.2482C2.44201 15.7917 4.20832 17.558 5.75187 16.6175C5.98356 16.4761 6.24536 16.3914 6.51597 16.3704C6.78658 16.3493 7.05834 16.3924 7.30912 16.4963C7.5599 16.6001 7.7826 16.7617 7.95911 16.9679C8.13561 17.1741 8.26091 17.4191 8.32482 17.6829C8.75121 19.439 11.2499 19.439 11.6752 17.6829C11.7393 17.4192 11.8647 17.1744 12.0413 16.9684C12.2178 16.7623 12.4405 16.6008 12.6912 16.497C12.9419 16.3932 13.2135 16.35 13.4841 16.3709C13.7546 16.3919 14.0164 16.4764 14.2481 16.6175C15.7917 17.558 17.558 15.7917 16.6175 14.2482C16.4763 14.0165 16.3918 13.7547 16.3709 13.4842C16.35 13.2136 16.3932 12.942 16.497 12.6913C16.6008 12.4406 16.7623 12.2179 16.9683 12.0414C17.1744 11.8648 17.4192 11.7394 17.6829 11.6753C19.439 11.2489 19.439 8.75025 17.6829 8.32499C17.4191 8.26108 17.1741 8.13578 16.9679 7.95928C16.7617 7.78278 16.6001 7.56007 16.4962 7.3093C16.3924 7.05853 16.3493 6.78677 16.3703 6.51617C16.3914 6.24556 16.4761 5.98376 16.6175 5.75207C17.558 4.20855 15.7917 2.44227 14.2481 3.38279C14.0164 3.52418 13.7546 3.60886 13.484 3.62992C13.2134 3.65098 12.9417 3.60784 12.6909 3.504C12.4401 3.40016 12.2174 3.23856 12.0409 3.03236C11.8644 2.82616 11.7391 2.58119 11.6752 2.3174L11.6763 2.31627Z" strokeWidth="2"/>
                            <path stroke={index === idButtonsName ? "#D95213" : "#736A65"} d="M12 10C12 11.1046 11.1046 12 10 12C8.89543 12 8 11.1046 8 10C8 8.89543 8.89543 8 10 8C11.1046 8 12 8.89543 12 10Z" strokeWidth="2"/>
                            </>
                        )}
                    </svg>
                    <span className="ms-2">{buttonName}</span>
                </label>
            </div>
        ))}
        </div>
        <div>
        <button className="logout-button-left" onClick={handleLogout}>
            <svg style={{ marginRight: "1vw" }} width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.2199 18.3999L17.9258 18.3999C18.4874 18.3999 19.0261 18.1787 19.4232 17.7848C19.8203 17.391 20.0435 16.8569 20.0435 16.2999L20.0435 3.6999C20.0435 3.14295 19.8203 2.60881 19.4232 2.21498C19.0261 1.82115 18.4874 1.5999 17.9258 1.5999L14.2199 1.5999M13.9567 9.9999L1.95674 9.9999M1.95674 9.9999L6.54189 14.7999M1.95674 9.9999L6.54189 5.1999" stroke="#D95213" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>
                Logout
            </span>
        </button>
        </div>
    </div>
    )
}