import { useState } from 'react';
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
    const [searchQuery, setSearchQuery] = useState("");

    const buttonsName: string[] = user.isAdmin ? [
        "users",
        "client",
        "center",
        "service",
        "costs"
    ] : [
        "client",
    ];

    // Filter logic for the selected entity
    const selectedEntity = buttonsName[idButtons];
    const entityData = data[selectedEntity] || [];
    const filteredData = searchQuery.trim() === "" ? entityData : entityData.filter((item: any) => {
        // Check all string/number fields for a match
        return Object.values(item).some((value) => {
            if (typeof value === 'string' || typeof value === 'number') {
                return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
            }
            // For arrays (like centers/services), join and search
            if (Array.isArray(value)) {
                return value.join(", ").toLowerCase().includes(searchQuery.toLowerCase());
            }
            return false;
        });
    });
    // Compose filtered data object for Table
    const filteredDataObj = { ...data, [selectedEntity]: filteredData };

    return <>
    <div className='p-5' style={{height: "100vh", overflow:"auto"}}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <ButtonsRadio buttonsName={buttonsName} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            <Button className='m-2'style={{ borderRadius: "25px", backgroundColor: "#F2F2F2", color:"#706762", borderColor: 'transparent', height: "33px", width: "33px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleShow}>
                +
            </Button>
        </div>
        {/* Search Bar */}
        <div className="flex items-center mt-4 mb-2">
            <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedEntity}...`}
                aria-label={`Search ${selectedEntity}`}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-base"
            />
        </div>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {buttonsName[idButtons]}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={buttonsName[idButtons]} data={data} defaultValue={null} closePopupFunc={handleClose} user={user}/>
        </Modal>
        <Table column={buttonsName[idButtons]} data={filteredDataObj} resetDataFunc={handleClose} user={user} filters={{center: [], client: [], worker: [], service: []}} columnFilters={[]} deleteFunction={null} toggleAllLines={null} deleteLines={null}/>
    </div>
    </>
}