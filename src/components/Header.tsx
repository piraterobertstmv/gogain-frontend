import logo from "../assets/Logo.png"

export function Header({user} : {user: any}) {
    return (
    <div style={{display: "flex", alignItems: "center"}}>
        <div className="p-3" style={{marginLeft: "3vw"}}>
            <img src={logo} height={50} alt="Logo"></img>
        </div>
        <span style={{fontSize: "30px", fontWeight: "500", marginLeft: "10vw"}}>{"Hello " + user.firstName + ' 👋'}</span>
    </div>
    )
}