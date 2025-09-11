import { useState, useMemo } from 'react';
import { ButtonsRadio } from "../components/ButtonsRadio"
import { DatabaseForm } from "../components/popup/DatabaseForm";
import { Table } from "../components/table/Table"
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export function Setup({ data, reloadData, user } : { data: any, reloadData: any, user: any }) {
    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);

    const handleClose = () => {
        reloadData();
        setShow(false)
    }

    const [idButtons, setIdButtons] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter buttons based on user permissions
    const isAdmin = user?.isAdmin === true;
    const allButtons = ["users", "client", "center", "service", "costs"];
    const buttonsName: string[] = isAdmin ? allButtons : allButtons.filter(button => button !== "users");

    // Filter data based on search term for users table
    const filteredData = useMemo(() => {
        if (buttonsName[idButtons] !== "users" || !searchTerm) {
            return data;
        }

        const filtered = { ...data };
        if (data.users) {
            filtered.users = data.users.filter((user: any) => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.firstName?.toLowerCase().includes(searchLower) ||
                    user.lastName?.toLowerCase().includes(searchLower) ||
                    (user.isAdmin ? "administrator" : "regular user").includes(searchLower)
                );
            });
        }
        return filtered;
    }, [data, searchTerm, idButtons, buttonsName]);

    return <>
    <div className='p-5' style={{height: "100vh", overflow:"auto"}}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <ButtonsRadio buttonsName={buttonsName} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            {/* Hide add button for users table if not admin, or show for all other tables */}
            {(isAdmin || buttonsName[idButtons] !== "users") && (
                <Button className='m-2'style={{ borderRadius: "25px", backgroundColor: "#F2F2F2", color:"#706762", borderColor: 'transparent', height: "33px", width: "33px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleShow}>
                    +
                </Button>
            )}
        </div>

        {/* Search input for users table */}
        {buttonsName[idButtons] === "users" && (
            <div style={{ margin: "15px 0" }}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        width: "300px",
                        fontSize: "14px"
                    }}
                />
            </div>
        )}

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {buttonsName[idButtons]}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={buttonsName[idButtons]} data={data} defaultValue={null} closePopupFunc={handleClose} user={user}/>
        </Modal>
        <Table column={buttonsName[idButtons]} data={filteredData} resetDataFunc={handleClose} user={user} filters={{center: [], client: [], worker: [], service: []}} columnFilters={[]} deleteFunction={null} toggleAllLines={null} deleteLines={null}/>
    </div>
    </>
}