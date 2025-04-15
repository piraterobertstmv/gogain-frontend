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

    const buttonsName: string[] = user.isAdmin ? [
        "users",
        "client",
        "center",
        "service",
        "costs"
    ] : [
        "client",
    ];

    return <>
    <div className='p-5' style={{height: "100vh", overflow:"auto"}}>
    <div style={{ display: "flex", alignItems: "center" }}>
            <ButtonsRadio buttonsName={buttonsName} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            <Button className='m-2'style={{ borderRadius: "25px", backgroundColor: "#F2F2F2", color:"#706762", borderColor: 'transparent', height: "33px", width: "33px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleShow}>
                +
            </Button>
        </div>

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {buttonsName[idButtons]}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={buttonsName[idButtons]} data={data} defaultValue={null} closePopupFunc={handleClose} user={user}/>
        </Modal>
        <Table column={buttonsName[idButtons]} data={data} resetDataFunc={handleClose} user={user} filters={{center: [], client: [], worker: [], service: []}} columnFilters={[]} deleteFunction={null} toggleAllLines={null} deleteLines={null}/>
    </div>
    </>
}